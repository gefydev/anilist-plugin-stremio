import { getViewer } from './anilistApi';

declare const StremioEnhancedAPI: any;

const ANILIST_CLIENT_ID = "YOUR_CLIENT_ID";

export const getAuthUrl = (): string => {
  return `https://anilist.co/api/v2/oauth/authorize?client_id=${ANILIST_CLIENT_ID}&response_type=token`;
};

export const authenticateUser = async (): Promise<{ id: number; name: string } | null> => {
  const authUrl = getAuthUrl();
  await StremioEnhancedAPI.showAlert(
    'info',
    'AniList Authentication',
    `Visit this URL to authenticate:\n${authUrl}\n\nAfter authorizing, copy the access token shown on screen.`,
    ['OK']
  );
  const token = await StremioEnhancedAPI.showPrompt(
    'AniList Token',
    'Paste your AniList access token here:',
    ''
  );
  if (!token) return null;

  const viewer = await getViewer(token);
  if (viewer) {
    await StremioEnhancedAPI.saveSetting('anilist_token', token);
    await StremioEnhancedAPI.saveSetting('anilist_username', viewer.name);
    await StremioEnhancedAPI.saveSetting('anilist_user_id', viewer.id.toString());
    return viewer;
  }

  await StremioEnhancedAPI.showAlert(
    'error',
    'Authentication Failed',
    'The token provided is invalid. Please try again.',
    ['OK']
  );
  return null;
};

export const getToken = async (): Promise<string | null> => {
  const token = await StremioEnhancedAPI.getSetting('anilist_token');
  return token || null;
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token && token.trim().length > 0;
};

export const logout = async (): Promise<void> => {
  await StremioEnhancedAPI.saveSetting('anilist_token', '');
  await StremioEnhancedAPI.saveSetting('anilist_username', 'Not connected');
  await StremioEnhancedAPI.saveSetting('anilist_user_id', '');
};
