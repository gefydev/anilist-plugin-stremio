declare const StremioEnhancedAPI: any;

export const registerPluginSettings = async (): Promise<void> => {
  await StremioEnhancedAPI.registerSettings([
    {
      key: 'anilist_token',
      type: 'input',
      label: 'AniList Access Token',
      description: 'Paste your AniList access token here',
      defaultValue: ''
    },
    {
      key: 'anilist_username',
      type: 'input',
      label: 'AniList Username',
      description: 'Shows your connected AniList username',
      defaultValue: 'Not connected'
    },
    {
      key: 'anilist_user_id',
      type: 'input',
      label: 'AniList User ID',
      description: '',
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
};
