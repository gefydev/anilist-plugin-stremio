import { validateAndSaveToken, getToken } from './auth';

declare const StremioEnhancedAPI: any;

export const updateDomInputs = (username: string, userId: string, status?: 'connected' | 'error' | 'loading'): void => {
  try {
    const modal = document.querySelector('[id*="AniListSync"][id*="settings-modal"], #AniListSyncsettingsmodal, #AniListSync-settings-modal') as HTMLElement;
    if (!modal) return;

    const usernameInput = modal.querySelector('input[data-key="anilist_username"]') as HTMLInputElement;
    if (usernameInput) {
      usernameInput.value = username;
      usernameInput.disabled = true;
      usernameInput.readOnly = true;
      usernameInput.style.opacity = '0.7';
      usernameInput.style.cursor = 'not-allowed';
    }

    const userIdInput = modal.querySelector('input[data-key="anilist_user_id"]') as HTMLInputElement;
    if (userIdInput) {
      userIdInput.value = userId;
      userIdInput.disabled = true;
      userIdInput.readOnly = true;
      userIdInput.style.opacity = '0.7';
      userIdInput.style.cursor = 'not-allowed';
    }

    const tokenInput = modal.querySelector('input[data-key="anilist_token"]') as HTMLInputElement;
    if (tokenInput && tokenInput.parentElement) {
      let badge = modal.querySelector('#anilist-status-badge') as HTMLElement;
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'anilist-status-badge';
        badge.style.marginTop = '8px';
        badge.style.padding = '6px 12px';
        badge.style.borderRadius = '6px';
        badge.style.fontSize = '12px';
        badge.style.fontWeight = 'bold';
        badge.style.display = 'flex';
        badge.style.alignItems = 'center';
        badge.style.gap = '6px';
        badge.style.background = 'rgba(0, 0, 0, 0.4)';
        tokenInput.parentElement.appendChild(badge);
      }

      if (status === 'loading') {
        badge.style.color = '#f59e0b';
        badge.innerHTML = '⏳ <span>Validating token with AniList...</span>';
      } else if (status === 'connected' || (username && username !== 'Not connected' && username !== 'Invalid token')) {
        badge.style.color = '#10b981';
        badge.innerHTML = `🟢 <span>Connected as <strong>${username}</strong>${userId ? ` (ID: ${userId})` : ''}</span>`;
      } else if (status === 'error' || username === 'Invalid token') {
        badge.style.color = '#ef4444';
        badge.innerHTML = '🔴 <span>Invalid or expired token</span>';
      } else {
        badge.style.color = '#9ca3af';
        badge.innerHTML = '⚪ <span>Not connected (paste token above)</span>';
      }
    }
  } catch (e) {}
};

export const registerPluginSettings = async (): Promise<void> => {
  try {
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
  } catch (e) {}

  if (typeof StremioEnhancedAPI !== 'undefined' && typeof StremioEnhancedAPI.onSettingsSaved === 'function') {
    try {
      StremioEnhancedAPI.onSettingsSaved(async (newSettings: any) => {
        if (newSettings && typeof newSettings.anilist_token === 'string') {
          await validateAndSaveToken(newSettings.anilist_token, false);
        }
      });
    } catch (e) {}
  }

  const currentToken = await getToken();
  if (currentToken) {
    const currentUsername = await StremioEnhancedAPI.getSetting('anilist_username');
    if (!currentUsername || currentUsername === 'Not connected' || currentUsername === 'Invalid token') {
      await validateAndSaveToken(currentToken, false);
    }
  }

  setupSettingsObserver();
};

const setupSettingsObserver = (): void => {
  let lastTokenValue = '';

  const syncModal = async () => {
    try {
      const modal = document.querySelector('[id*="AniListSync"][id*="settings-modal"], #AniListSyncsettingsmodal, #AniListSync-settings-modal') as HTMLElement;
      if (!modal) return;

      const tokenInput = modal.querySelector('input[data-key="anilist_token"]') as HTMLInputElement;
      const usernameInput = modal.querySelector('input[data-key="anilist_username"]') as HTMLInputElement;
      const userIdInput = modal.querySelector('input[data-key="anilist_user_id"]') as HTMLInputElement;

      if (!tokenInput) return;

      if (usernameInput) {
        usernameInput.disabled = true;
        usernameInput.readOnly = true;
        usernameInput.style.opacity = '0.7';
        usernameInput.style.cursor = 'not-allowed';
      }

      if (userIdInput) {
        userIdInput.disabled = true;
        userIdInput.readOnly = true;
        userIdInput.style.opacity = '0.7';
        userIdInput.style.cursor = 'not-allowed';
      }

      const currentUsername = (await StremioEnhancedAPI.getSetting('anilist_username')) || localStorage.getItem('anilist_username') || 'Not connected';
      const currentUserId = (await StremioEnhancedAPI.getSetting('anilist_user_id')) || localStorage.getItem('anilist_user_id') || '';

      updateDomInputs(currentUsername, currentUserId);

      if (!tokenInput.dataset.anilistBound) {
        tokenInput.dataset.anilistBound = 'true';
        lastTokenValue = tokenInput.value.trim();

        const onTokenInput = async () => {
          const val = tokenInput.value.trim();
          if (val === lastTokenValue) return;
          lastTokenValue = val;

          if (val.length > 20) {
            updateDomInputs('Validating...', '', 'loading');
            const result = await validateAndSaveToken(val, true);
            if (result) {
              updateDomInputs(result.name, result.id.toString(), 'connected');
            }
          } else if (val.length === 0) {
            await validateAndSaveToken('', false);
            updateDomInputs('Not connected', '');
          }
        };

        tokenInput.addEventListener('paste', () => setTimeout(onTokenInput, 50));
        tokenInput.addEventListener('change', onTokenInput);
        tokenInput.addEventListener('blur', onTokenInput);
        tokenInput.addEventListener('input', () => {
          if (tokenInput.value.trim().length > 30) {
            setTimeout(onTokenInput, 200);
          }
        });
      }
    } catch (e) {}
  };

  const observer = new MutationObserver(() => {
    syncModal();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  setInterval(syncModal, 500);
};
