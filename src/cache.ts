export const getMappings = (): Record<string, number> => {
  const data = localStorage.getItem('anilist_mappings');
  return data ? JSON.parse(data) : {};
};

export const setMapping = (kitsuId: string, anilistId: number): void => {
  const mappings = getMappings();
  mappings[kitsuId] = anilistId;
  localStorage.setItem('anilist_mappings', JSON.stringify(mappings));
};

export const getCachedAniListId = (kitsuId: string): number | null => {
  const mappings = getMappings();
  return mappings[kitsuId] || null;
};

export const isBlacklisted = (anilistId: number): boolean => {
  const data = localStorage.getItem('anilist_blacklist');
  const blacklist = data ? JSON.parse(data) : [];
  return blacklist.includes(anilistId);
};

export const addToBlacklist = (anilistId: number): void => {
  const data = localStorage.getItem('anilist_blacklist');
  const blacklist = data ? JSON.parse(data) : [];
  if (!blacklist.includes(anilistId)) {
    blacklist.push(anilistId);
    localStorage.setItem('anilist_blacklist', JSON.stringify(blacklist));
  }
};

export const clearCache = (): void => {
  localStorage.removeItem('anilist_mappings');
  localStorage.removeItem('anilist_blacklist');
};
