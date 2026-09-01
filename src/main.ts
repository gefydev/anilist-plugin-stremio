/**
 * @name AniListSync
 * @description Syncs your anime watching progress with AniList automatically. Tracks episodes watched in Stremio and updates your AniList list.
 * @updateUrl https://raw.githubusercontent.com/GefyDev/anilist-plugin-stremio/main/dist/AniListSync.plugin.js
 * @version 1.0.0
 * @author GefyDev
 */

import { registerPluginSettings } from './settings';
import { initScrobbler } from './scrobbler';

declare const StremioEnhancedAPI: any;

(async () => {
  await registerPluginSettings();
  initScrobbler();
  StremioEnhancedAPI.logger.info('AniListSync plugin initialized');
})();
