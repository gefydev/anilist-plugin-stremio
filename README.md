# AniListSync - Stremio Enhanced Plugin

![Version](https://img.shields.io/badge/version-1.0.0-blue)

A plugin for [Stremio Enhanced](https://github.com/REVENGE977/stremio-enhanced) that automatically syncs your anime watching progress with [AniList](https://anilist.co).

## Features
- Automatic episode tracking (scrobbles when you've watched 80% of an episode)
- Smart matching: Kitsu → AniList mapping via MAL ID + title search
- First episode prompt: asks before adding new anime to your list
- Auto-complete: marks anime as COMPLETED on the last episode
- Configurable scrobble threshold (50-90%)
- Local cache to minimize API calls
- Rate-limit aware (respects AniList's 90 req/min limit)

## Installation
1. Download `AniListSync.plugin.js` from the [latest release](../../releases/latest)
2. Open Stremio Enhanced → Settings → Plugins → OPEN PLUGINS FOLDER
3. Place the downloaded file in the plugins folder
4. Enable the plugin in Stremio Enhanced settings

## Setup
1. Enable the plugin in Stremio Enhanced settings
2. Visit https://anilist.co/api/v2/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=token
3. Authorize the application
4. Copy the access token shown on screen
5. Paste it in the plugin settings under "AniList Access Token"

Note: Tokens are valid for 1 year.

## How It Works
- The plugin monitors your Stremio playback
- When you're watching anime from the Kitsu catalog, it identifies the anime
- It maps the Kitsu anime to AniList using MAL ID mappings (or title search as fallback)
- After watching 80% of an episode (configurable), it updates your AniList progress
- If the anime isn't on your list, it asks if you want to add it
- On the last episode, it automatically marks the anime as COMPLETED

## Development
```bash
bun install
bun run build
```

## Release
Push a tag to trigger automatic release:
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Requirements
- Stremio Enhanced
- AniList account
- Anime must be from the Kitsu catalog in Stremio

## License
MIT
