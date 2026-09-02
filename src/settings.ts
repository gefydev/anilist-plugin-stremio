import { validateAndSaveToken, getToken } from './auth';

declare const StremioEnhancedAPI: any;

export const registerPluginSettings = async (): Promise<void> => {
  await StremioEnhancedAPI.registerSettings([
    {
      key: 'anilist_token',
      type: 'input',
      label: 'AniList Access Token',
      description: 'Paste your AniList access token here (Account connects automatically)',
      defaultValue: ''
    },
    {
      key: 'anilist_username',
      type: 'input',
      label: 'Connected Account (Read Only)',
      description: 'Automatically updated with your AniList username',
      defaultValue: 'Not connected'
    },
    {
      key: 'anilist_user_id',
      type: 'input',
      label: 'AniList User ID (Read Only)',
      description: 'Automatically updated with your AniList user ID',
      defaultValue: ''
    },
    {
      key: 'auto_add_to_list',
      type: 'toggle',
      label: 'Ask to Add New Anime',
      description: 'Ask before adding anime that are not on your list',
      defaultValue: true
    },
    {
      key: 'auto_complete',
      type: 'toggle',
      label: 'Auto-Complete Anime',
      description: 'Automatically mark anime as COMPLETED on the last episode',
      defaultValue: true
    },
    {
      key: 'scrobble_threshold',
      type: 'select',
      label: 'Scrobble Threshold',
      description: 'How much of the episode to watch before updating AniList',
      defaultValue: '80',
      options: [
        { label: '50%', value: '50' },
        { label: '70%', value: '70' },
        { label: '80% (Recommended)', value: '80' },
        { label: '90%', value: '90' }
      ]
    }
  ]);

  StremioEnhancedAPI.onSettingChange('anilist_token', async (newToken: string) => {
    if (typeof newToken === 'string') {
      await validateAndSaveToken(newToken, true);
    }
  });

  const currentToken = await getToken();
  if (currentToken) {
    const currentUsername = await StremioEnhancedAPI.getSetting('anilist_username');
    if (!currentUsername || currentUsername === 'Not connected' || currentUsername === 'Invalid token') {
      await validateAndSaveToken(currentToken, false);
    }
  }

  setupDisabledSettingsObserver();
};

const setupDisabledSettingsObserver = (): void => {
  const readOnlyKeys = ['anilist_username', 'anilist_user_id'];

  const applyDisabled = () => {
    for (const key of readOnlyKeys) {
      const inputs = document.querySelectorAll(`input[name="${key}"], input[id*="${key}"]`);
      inputs.forEach((input: Element) => {
        const htmlInput = input as HTMLInputElement;
        htmlInput.disabled = true;
        htmlInput.readOnly = true;
        htmlInput.style.opacity = '0.6';
        htmlInput.style.cursor = 'not-allowed';
      });
    }

    const labels = document.querySelectorAll('label, .setting-label, .title');
    labels.forEach((label) => {
      const text = label.textContent || '';
      if (text.includes('Connected Account') || text.includes('AniList User ID') || text.includes('AniList Username')) {
        const parent = label.closest('.setting-item, .setting, div');
        if (parent) {
          const input = parent.querySelector('input');
          if (input && !input.disabled) {
            input.disabled = true;
            input.readOnly = true;
            input.style.opacity = '0.6';
            input.style.cursor = 'not-allowed';
          }
        }
      }
    });
  };

  const observer = new MutationObserver(() => {
    applyDisabled();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
  setInterval(applyDisabled, 2000);
};
