# Configuration

All settings are stored in `backend/settings.json` and can be configured either through the web dashboard (Settings page) or by editing the JSON file directly.

## Settings Reference

| Setting | Type | Default | Description |
|---|---|---|---|
| `api_key` | String | `""` | API key for REST API authentication (sent via `X-API-Key` header) |
| `autostart_tray` | Boolean | `false` | Auto-start mining on application launch (Windows tray mode) |
| `available_drops_check` | Boolean | `false` | Check for new available drops periodically |
| `connection_quality` | Integer (1-6) | `1` | Timeout multiplier for network requests |
| `dark_mode` | Boolean | `false` | Enable dark theme in web dashboard |
| `enable_badges_emotes` | Boolean | `true` | Show badges and emotes in the UI |
| `exclude` | Array[str] | `[]` | List of game names to exclude from mining |
| `language` | String | `"English"` | UI language (one of 21 supported languages) |
| `priority` | Array[str] | `["Rust", "Escape from Tarkov"]` | Ordered list of preferred games |
| `priority_mode` | Integer (0-2) | `0` | How to prioritize channels |
| `proxy` | String | `""` | HTTP/HTTPS/SOCKS proxy URL |
| `tray_notifications` | Boolean | `true` | Show tray notifications (Windows) |

## Priority Modes

The `priority_mode` setting controls how the miner selects which channel to watch:

| Mode | Value | Description |
|---|---|---|
| **Priority List** | `0` | Only watch channels streaming games from your priority list. If no priority games are live, falls back to other games. |
| **Ending Soonest** | `1` | Watch channels whose drop campaigns are ending soonest (time-limited drops). |
| **Low Availability First** | `2` | Watch channels for games that have the fewest active drop campaigns. Useful for rare drops. |

## Game Priority & Exclude Lists

### Priority List (`priority`)

Add games to the priority list to tell the miner which games you care about most. The miner will prioritize channels streaming these games over others.

```
Example: ["Rust", "Escape from Tarkov", "Counter-Strike 2", "Valorant"]
```

### Exclude List (`exclude`)

Add games to the exclude list to completely ignore their drop campaigns and channels.

```
Example: ["Fortnite", "League of Legends", "Grand Theft Auto V"]
```

> **Note:** Both lists are case-insensitive and use fuzzy matching against Twitch's game names.

## Proxy Configuration

Set the `proxy` field to route all Twitch traffic through a proxy:

```
# HTTP proxy
http://proxy.example.com:8080

# HTTPS proxy
https://proxy.example.com:8443

# SOCKS proxy
socks5://proxy.example.com:1080

# With authentication
http://user:password@proxy.example.com:8080
```

> **Tip:** Proxies are useful if Twitch throttles your IP or if you need to appear from a different region.

## Connection Quality

The `connection_quality` setting (1-6) acts as a timeout multiplier:

| Value | Effect |
|---|---|
| `1` | Normal timeouts (default) |
| `2` | 2x longer timeouts |
| `3` | 3x longer timeouts |
| `6` | 6x longer timeouts |

Increase this if you're on a slow connection or experiencing frequent timeouts.

## API Key Authentication

To secure the REST API, set an API key:

1. Go to Settings in the web dashboard
2. Enter a key in the "API Key" field
3. Save settings
4. Restart the server

Once set, all REST API calls (except the dashboard pages) require the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-secret-key" http://localhost:1337/api/status
```

## Language Support

21 languages are available. Set the `language` setting to any of:

| Language | File |
|---|---|
| English | `English.json` |
| Deutsch | `Deutsch.json` |
| Français | `Français.json` |
| Español | `Español.json` |
| Português | `Português.json` |
| Italiano | `Italiano.json` |
| Nederlands | `Nederlandse.json` |
| Polski | `Polski.json` |
| Română | `Română.json` |
| Türkçe | `Türkçe.json` |
| Čeština | `Čeština.json` |
| Dansk | `Dansk.json` |
| Norsk | `Norsk.json` |
| Indonesian | `Indonesian.json` |
| Українська | `Українська.json` |
| Русский | `Русский.json` |
| العربية | `العربية.json` |
| 日本語 | `日本語.json` |
| 简体中文 | `简体中文.json` |
| 繁體中文 | `繁體中文.json` |

## Client Types

The miner can impersonate different Twitch client types for the GQL API. This is handled internally but you can see which type is active in the logs:

| Client Type | Identifier | Use Case |
|---|---|---|
| **Web** | `WEB` | Default browser experience |
| **Mobile Web** | `MOBILE_WEB` | Mobile browser experience |
| **Android App** | `ANDROID_APP` | Android app experience |
| **Smart TV** | `SMARTBOX` | Smart TV/console experience |

The miner cycles through client types to avoid detection and rate limiting.
