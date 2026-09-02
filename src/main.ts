/**
 * @name AniListSync
 * @description Syncs your anime watching progress with AniList automatically. Tracks episodes watched in Stremio and updates your AniList list.
 * @updateUrl https://raw.githubusercontent.com/GefyDev/anilist-plugin-stremio/main/dist/AniListSync.plugin.js
 * @version 1.0.0
 * @author GefyDev
 */

import { registerPluginSettings } from './settings';
import { initScrobbler } from './scrobbler';

declare const StremioEnhancedAPI: any;

(async () => {
  try {
    await registerPluginSettings();
  } catch (e) {
    console.error('[AniListSync] Error registering settings:', e);
  }

  try {
    initScrobbler();
  } catch (e) {
    console.error('[AniListSync] Error initializing scrobbler:', e);
  }

  if (typeof StremioEnhancedAPI !== 'undefined' && StremioEnhancedAPI?.logger?.info) {
    StremioEnhancedAPI.logger.info('AniListSync plugin initialized');
  } else {
    console.log('[AniListSync] Plugin initialized');
  }
})();
