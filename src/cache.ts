const memoryCache: Record<string, string> = {};

export const getMappings = (): Record<string, number> => {
  if (typeof localStorage === 'undefined') {
    const data = memoryCache['anilist_mappings'];
    return data ? JSON.parse(data) : {};
  }
  const data = localStorage.getItem('anilist_mappings');
  return data ? JSON.parse(data) : {};
};

export const setMapping = (kitsuId: string, anilistId: number): void => {
  const mappings = getMappings();
  mappings[kitsuId] = anilistId;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('anilist_mappings', JSON.stringify(mappings));
  } else {
    memoryCache['anilist_mappings'] = JSON.stringify(mappings);
  }
};

export const getCachedAniListId = (kitsuId: string): number | null => {
  const mappings = getMappings();
  return mappings[kitsuId] || null;
};

export const isBlacklisted = (anilistId: number): boolean => {
  if (typeof localStorage === 'undefined') {
    const data = memoryCache['anilist_blacklist'];
    const blacklist = data ? JSON.parse(data) : [];
    return blacklist.includes(anilistId);
  }
  const data = localStorage.getItem('anilist_blacklist');
  const blacklist = data ? JSON.parse(data) : [];
  return blacklist.includes(anilistId);
};

export const addToBlacklist = (anilistId: number): void => {
  const data = typeof localStorage !== 'undefined' ? localStorage.getItem('anilist_blacklist') : memoryCache['anilist_blacklist'];
  const blacklist = data ? JSON.parse(data) : [];
  if (!blacklist.includes(anilistId)) {
    blacklist.push(anilistId);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('anilist_blacklist', JSON.stringify(blacklist));
    } else {
      memoryCache['anilist_blacklist'] = JSON.stringify(blacklist);
    }
  }
};

export const clearCache = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('anilist_mappings');
    localStorage.removeItem('anilist_blacklist');
  } else {
    delete memoryCache['anilist_mappings'];
    delete memoryCache['anilist_blacklist'];
  }
};
