import { validateAndSaveToken, getToken } from './auth';

declare const StremioEnhancedAPI: any;

export const findSettingRow = (labelText: string): HTMLElement | null => {
  const elements = Array.from(document.querySelectorAll('*'));
  for (const el of elements) {
    if (el.children.length === 0 && (el.textContent || '').trim().toLowerCase().includes(labelText.toLowerCase())) {
      let curr: HTMLElement | null = el.parentElement;
      for (let i = 0; i < 6 && curr; i++) {
        const input = curr.querySelector('input');
        if (input) {
          return curr;
        }
        curr = curr.parentElement;
      }
    }
  }
  return null;
};

export const findSettingInput = (keywords: string[]): HTMLInputElement | null => {
  for (const kw of keywords) {
    const direct = document.querySelector(`input[name="${kw}"], input#${kw}, input[data-key="${kw}"], input[placeholder*="${kw}"]`) as HTMLInputElement;
    if (direct) return direct;
  }

  for (const kw of keywords) {
    const row = findSettingRow(kw);
    if (row) {
      const input = row.querySelector('input');
      if (input) return input;
    }
  }

  return null;
};

export const updateDomInputs = (username: string, userId: string, status?: 'connected' | 'error' | 'loading'): void => {
  const usernameInput = findSettingInput(['anilist_username', 'Connected Account', 'AniList Username']);
  if (usernameInput) {
    usernameInput.value = username;
    usernameInput.disabled = true;
    usernameInput.readOnly = true;
    usernameInput.style.opacity = '0.7';
    usernameInput.style.cursor = 'not-allowed';
  }

  const userIdInput = findSettingInput(['anilist_user_id', 'AniList User ID']);
  if (userIdInput) {
    userIdInput.value = userId;
    userIdInput.disabled = true;
    userIdInput.readOnly = true;
    userIdInput.style.opacity = '0.7';
    userIdInput.style.cursor = 'not-allowed';
  }

  const tokenInput = findSettingInput(['anilist_token', 'AniList Access Token']);
  if (tokenInput && tokenInput.parentElement) {
    let badge = document.getElementById('anilist-status-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'anilist-status-badge';
      badge.style.marginTop = '8px';
      badge.style.padding = '6px 10px';
      badge.style.borderRadius = '4px';
      badge.style.fontSize = '12px';
      badge.style.fontWeight = 'bold';
      badge.style.display = 'flex';
      badge.style.alignItems = 'center';
      badge.style.gap = '6px';
      badge.style.background = 'rgba(0, 0, 0, 0.3)';
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
};

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

  if (typeof StremioEnhancedAPI !== 'undefined' && typeof StremioEnhancedAPI.onSettingChange === 'function') {
    try {
      StremioEnhancedAPI.onSettingChange('anilist_token', async (newToken: string) => {
        if (typeof newToken === 'string') {
          await validateAndSaveToken(newToken, true);
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

  let lastKnownToken = (await getToken()) || '';
  setInterval(async () => {
    const currentTok = (await getToken()) || '';
    if (currentTok && currentTok !== lastKnownToken) {
      lastKnownToken = currentTok;
      await validateAndSaveToken(currentTok, true);
    } else if (!currentTok && lastKnownToken) {
      lastKnownToken = '';
      await validateAndSaveToken('', false);
    }
  }, 2000);

  setupSettingsObserver();
};

const setupSettingsObserver = (): void => {
  let lastTokenValue = '';

  const syncUI = async () => {
    const username = (await StremioEnhancedAPI.getSetting('anilist_username')) || localStorage.getItem('anilist_username') || 'Not connected';
    const userId = (await StremioEnhancedAPI.getSetting('anilist_user_id')) || localStorage.getItem('anilist_user_id') || '';
    
    updateDomInputs(username, userId);

    const tokenInput = findSettingInput(['anilist_token', 'AniList Access Token']);
    if (tokenInput && !tokenInput.dataset.anilistBound) {
      tokenInput.dataset.anilistBound = 'true';
      lastTokenValue = tokenInput.value.trim();

      const onTokenInput = async () => {
        const val = tokenInput.value.trim();
        if (val === lastTokenValue) return;
        lastTokenValue = val;

        if (val.length > 20) {
          updateDomInputs('Validating...', '', 'loading');
          await validateAndSaveToken(val, true);
        } else if (val.length === 0) {
          await validateAndSaveToken('', false);
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
  };

  const observer = new MutationObserver(() => {
    syncUI();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
  setInterval(syncUI, 1500);
};
