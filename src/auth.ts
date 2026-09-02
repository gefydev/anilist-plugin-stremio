import { getViewer } from './anilistApi';
import { updateDomInputs } from './settings';

declare const StremioEnhancedAPI: any;

const ANILIST_CLIENT_ID = "YOUR_CLIENT_ID";

export const getAuthUrl = (): string => {
  return `https://anilist.co/api/v2/oauth/authorize?client_id=${ANILIST_CLIENT_ID}&response_type=token`;
};

export const sanitizeToken = (token: string): string => {
  return token.trim().replace(/^Bearer\s+/i, '');
};

let lastValidatedToken = '';
let isValidating = false;

export const getLastValidatedToken = (): string => lastValidatedToken;

export const validateAndSaveToken = async (rawToken: string, notify = true): Promise<{ id: number; name: string } | null> => {
  const token = sanitizeToken(rawToken);

  if (!token) {
    lastValidatedToken = '';
    await StremioEnhancedAPI.saveSetting('anilist_token', '');
    await StremioEnhancedAPI.saveSetting('anilist_username', 'Not connected');
    await StremioEnhancedAPI.saveSetting('anilist_user_id', '');
    try {
      localStorage.removeItem('anilist_token');
      localStorage.removeItem('anilist_username');
      localStorage.removeItem('anilist_user_id');
    } catch (e) {}
    updateDomInputs('Not connected', '');
    return null;
  }

  if (token === lastValidatedToken || isValidating) {
    return null;
  }

  isValidating = true;
  updateDomInputs('Validating...', '', 'loading');

  try {
    const viewer = await getViewer(token);
    if (viewer && viewer.id) {
      lastValidatedToken = token;

      await StremioEnhancedAPI.saveSetting('anilist_token', token);
      await StremioEnhancedAPI.saveSetting('anilist_username', viewer.name);
      await StremioEnhancedAPI.saveSetting('anilist_user_id', viewer.id.toString());
      try {
        localStorage.setItem('anilist_token', token);
        localStorage.setItem('anilist_username', viewer.name);
        localStorage.setItem('anilist_user_id', viewer.id.toString());
      } catch (e) {}

      updateDomInputs(viewer.name, viewer.id.toString(), 'connected');

      if (notify) {
        await StremioEnhancedAPI.showAlert(
          'info',
          'AniList Connected',
          `Successfully connected to AniList as ${viewer.name}!`,
          ['OK']
        );
      }
      StremioEnhancedAPI.logger.info(`AniList connected: ${viewer.name} (ID: ${viewer.id})`);
      return viewer;
    }

    lastValidatedToken = '';
    await StremioEnhancedAPI.saveSetting('anilist_username', 'Invalid token');
    await StremioEnhancedAPI.saveSetting('anilist_user_id', '');
    try {
      localStorage.setItem('anilist_username', 'Invalid token');
      localStorage.removeItem('anilist_user_id');
    } catch (e) {}

    updateDomInputs('Invalid token', '', 'error');

    if (notify) {
      await StremioEnhancedAPI.showAlert(
        'error',
        'AniList Connection Failed',
        'The token provided is invalid or expired. Please check your token and try again.',
        ['OK']
      );
    }
    StremioEnhancedAPI.logger.error('AniList authentication failed: Invalid token');
    return null;
  } finally {
    isValidating = false;
  }
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

  return validateAndSaveToken(token, true);
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
