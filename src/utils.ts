declare function _eval(code: string): Promise<any>;

export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const parsePlayerHash = (): { type: string; id: string; videoId: string } | null => {
  const hash = decodeURIComponent(location.hash);
  if (!hash.startsWith('#/player/')) return null;
  const parts = hash.split('/');
  if (parts.length < 8) return null;
  return {
    type: parts[5],
    id: parts[6],
    videoId: parts[7]
  };
};

export const getPlayerState = async (): Promise<any> => {
  while (true) {
    try {
      const state = await _eval('core.transport.getState("player")');
      if (state && state.seriesInfo && state.metaItem && state.metaItem.content) {
        return state;
      }
    } catch (e) {
    }
    await delay(1000);
  }
};

export const normalizeTitle = (title: string): string => {
  return title.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};
