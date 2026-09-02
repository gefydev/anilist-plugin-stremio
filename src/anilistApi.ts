import { delay } from './utils';

export const anilistRequest = async (query: string, variables: object, token?: string): Promise<any> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  if (token) {
    const cleanToken = token.trim().replace(/^Bearer\s+/i, '');
    headers['Authorization'] = `Bearer ${cleanToken}`;
  }

  let retries = 0;
  while (retries < 3) {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables })
    });

    if (response.status === 429) {
      retries++;
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 3000;
      await delay(waitTime);
      continue;
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }
    return data.data;
  }
  throw new Error('AniList rate limit exceeded. Please wait a moment.');
};

export const getViewer = async (token: string): Promise<{ id: number; name: string; avatar: { medium: string } } | null> => {
  const query = `
    query {
      Viewer {
        id
        name
        avatar {
          medium
        }
      }
    }
  `;
  try {
    const data = await anilistRequest(query, {}, token);
    return data.Viewer;
  } catch (e) {
    return null;
  }
};

export const searchAnimeByTitle = async (title: string, token: string): Promise<any[]> => {
  const query = `
    query($search: String) {
      Page(perPage: 5) {
        media(search: $search, type: ANIME) {
          id
          idMal
          title {
            romaji
            english
            native
            userPreferred
          }
          synonyms
          format
          status
          episodes
          mediaListEntry {
            id
            status
            progress
            score
          }
        }
      }
    }
  `;
  const data = await anilistRequest(query, { search: title }, token);
  return data.Page.media;
};

export const searchAnimeByMalId = async (malId: number, token: string): Promise<any | null> => {
  const query = `
    query($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        id
        idMal
        title {
          romaji
          english
          native
          userPreferred
        }
        synonyms
        format
        status
        episodes
        mediaListEntry {
          id
          status
          progress
          score
        }
      }
    }
  `;
  try {
    const data = await anilistRequest(query, { idMal: malId }, token);
    return data.Media;
  } catch (e) {
    return null;
  }
};

export const getMediaListEntry = async (mediaId: number, token: string): Promise<any | null> => {
  const query = `
    query($id: Int) {
      Media(id: $id) {
        episodes
        mediaListEntry {
          id
          status
          progress
          score
        }
      }
    }
  `;
  try {
    const data = await anilistRequest(query, { id: mediaId }, token);
    return data.Media;
  } catch (e) {
    return null;
  }
};

export const saveProgress = async (mediaId: number, progress: number, status: string, token: string): Promise<any> => {
  const query = `
    mutation($mediaId: Int, $progress: Int, $status: MediaListStatus) {
      SaveMediaListEntry(mediaId: $mediaId, progress: $progress, status: $status) {
        id
        mediaId
        status
        progress
      }
    }
  `;
  const data = await anilistRequest(query, { mediaId, progress, status }, token);
  return data.SaveMediaListEntry;
};
