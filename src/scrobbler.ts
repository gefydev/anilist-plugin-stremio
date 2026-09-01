import { getCachedAniListId, setMapping, isBlacklisted, addToBlacklist } from './cache';
import { searchAnimeByMalId, searchAnimeByTitle, getMediaListEntry, saveProgress } from './anilistApi';
import { getToken } from './auth';
import { parsePlayerHash, getPlayerState } from './utils';

declare const StremioEnhancedAPI: any;

export const resolveAniListId = async (kitsuId: string, title: string, token: string): Promise<number | null> => {
  const cached = getCachedAniListId(kitsuId);
  if (cached) return cached;

  try {
    let malId: number | null = null;
    const mappingsRes = await fetch(`https://kitsu.io/api/edge/anime/${kitsuId}/mappings`, {
      headers: { 'Accept': 'application/vnd.api+json' }
    });
    const mappingsData = await mappingsRes.json();
    if (mappingsData.data) {
      const malMapping = mappingsData.data.find((m: any) => m.attributes.externalSite === 'myanimelist/anime');
      if (malMapping) {
        malId = parseInt(malMapping.attributes.externalId, 10);
      }
    }

    if (malId) {
      const aniListMedia = await searchAnimeByMalId(malId, token);
      if (aniListMedia && aniListMedia.id) {
        setMapping(kitsuId, aniListMedia.id);
        return aniListMedia.id;
      }
    }

    const searchResults = await searchAnimeByTitle(title, token);
    if (searchResults && searchResults.length > 0) {
      const bestMatch = searchResults[0];
      setMapping(kitsuId, bestMatch.id);
      return bestMatch.id;
    }
  } catch (e) {
  }

  return null;
};

export const handleEpisodeWatched = async (kitsuId: string, episode: number, title: string): Promise<void> => {
  const token = await getToken();
  if (!token) return;

  const anilistId = await resolveAniListId(kitsuId, title, token);
  if (!anilistId) {
    StremioEnhancedAPI.logger.warn(`Could not resolve AniList ID for ${title}`);
    return;
  }

  const media = await getMediaListEntry(anilistId, token);
  const entry = media?.mediaListEntry;
  const totalEpisodes = media?.episodes || 0;

  if (!entry) {
    const autoAdd = await StremioEnhancedAPI.getSetting('auto_add_to_list');
    if (autoAdd) {
      if (isBlacklisted(anilistId)) return;
      
      const result = await StremioEnhancedAPI.showAlert(
        'info',
        'Add to AniList?',
        `"${title}" is not on your AniList. Would you like to add it?`,
        ['Yes, add it!', 'No thanks']
      );
      if (result === 0) {
        await saveProgress(anilistId, episode, 'CURRENT', token);
        StremioEnhancedAPI.logger.info(`Added and scrobbled ${title} ep ${episode}`);
      } else {
        addToBlacklist(anilistId);
      }
    }
  } else {
    if (entry.progress >= episode) return;

    const autoComplete = await StremioEnhancedAPI.getSetting('auto_complete');
    let status = 'CURRENT';
    if (autoComplete && totalEpisodes > 0 && episode >= totalEpisodes) {
      status = 'COMPLETED';
    }

    await saveProgress(anilistId, episode, status, token);
    StremioEnhancedAPI.logger.info(`Scrobbled ${title} ep ${episode} as ${status}`);
  }
};

export const attachVideoMonitor = async (onThresholdReached: () => void): Promise<void> => {
  const thresholdSetting = await StremioEnhancedAPI.getSetting('scrobble_threshold');
  const threshold = parseInt(thresholdSetting || '80', 10) / 100;

  const findVideo = setInterval(() => {
    const video = document.querySelector('video');
    if (video) {
      clearInterval(findVideo);
      let triggered = false;

      const timeUpdateHandler = () => {
        if (!triggered && video.duration > 0 && video.currentTime / video.duration >= threshold) {
          triggered = true;
          video.removeEventListener('timeupdate', timeUpdateHandler);
          onThresholdReached();
        }
      };

      video.addEventListener('timeupdate', timeUpdateHandler);

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.removedNodes.forEach((node) => {
            if (node === video) {
              video.removeEventListener('timeupdate', timeUpdateHandler);
              observer.disconnect();
            }
          });
        });
      });

      if (video.parentNode) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
  }, 1000);
};

export const initScrobbler = (): void => {
  let currentVideoId: string | null = null;

  const checkPlayer = async () => {
    const parsed = parsePlayerHash();
    if (!parsed || parsed.id.indexOf('kitsu:') !== 0) {
      currentVideoId = null;
      return;
    }

    if (parsed.videoId === currentVideoId) return;
    currentVideoId = parsed.videoId;

    const parts = parsed.videoId.split(':');
    if (parts.length < 3) return;

    const kitsuId = parts[1];
    const episode = parseInt(parts[2], 10);

    const state = await getPlayerState();
    const title = state.metaItem?.content?.name || state.seriesInfo?.name || 'Unknown Anime';

    attachVideoMonitor(() => {
      handleEpisodeWatched(kitsuId, episode, title);
    });
  };

  window.addEventListener('hashchange', checkPlayer);
  window.addEventListener('popstate', checkPlayer);
  
  checkPlayer();
};
