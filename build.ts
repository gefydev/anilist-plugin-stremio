const metadata = `/**
 * @name AniListSync
 * @description Syncs your anime watching progress with AniList automatically. Tracks episodes watched in Stremio and updates your AniList list.
 * @updateUrl https://raw.githubusercontent.com/GefyDev/anilist-plugin-stremio/main/dist/AniListSync.plugin.js
 * @version 1.0.0
 * @author GefyDev
 */
`;

const result = await Bun.build({
  entrypoints: ['./src/main.ts'],
  outdir: './dist',
  naming: 'AniListSync.plugin.js',
  target: 'browser',
  banner: metadata,
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}
