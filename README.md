# Twitch Drops Miner

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AFK mine timed Twitch drops without watching streams. Saves bandwidth by only fetching stream metadata.

![Dashboard](https://img.shields.io/badge/Dashboard-Web_UI-6c5ce7?style=for-the-badge)
![Channels](https://img.shields.io/badge/Channels-Realtime-00b894?style=for-the-badge)
![Drops](https://img.shields.io/badge/Drops-Auto_Claim-fdcb6e?style=for-the-badge)

## Features

- **Stream-less mining** — No video/audio download, only metadata
- **Game priority list** — Prioritize games with boxart icons
- **Game exclude list** — Exclude games from mining
- **Auto channel switching** — Automatically switches to the next best channel when the current one goes offline
- **Manual channel cycling** — The **Switch** button cycles through available channels in order
- **Auto-claim** — Claims drops automatically when ready
- **8 WebSocket connections** — Track up to 199 channels simultaneously
- **Web dashboard** — Modern React UI with real-time updates
- **Built-in FAQ page** — Troubleshooting and help directly in the UI
- **REST API** — Integrate with other systems
- **21 languages** — Full translation support
- **Tooltips** — Contextual help on all settings

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ (for building frontend)

### Installation

```bash
git clone https://github.com/ZoniBoy00/TwitchDropMiner.git
cd TwitchDropMiner

# Install Python dependencies
cd backend
pip install -r requirements.txt
cd ..

# Install and build frontend
cd frontend
npm install
npm run build
cd ..
```

### Running

```bash
# Production mode (recommended)
# Windows:
start.bat

# Linux/Mac:
chmod +x start.sh && ./start.sh

# Or manually:
cd backend && python server.py --port 1337
```

Open `http://localhost:1337` in your browser.

### Development mode

```bash
npm run dev    # Starts both backend + frontend with hot reload
```

## Project Structure

```
TwitchDropMiner/
├── backend/                    # Python server
│   ├── server.py              # Entry point
│   ├── web_gui.py             # WebSocket + REST API
│   ├── twitch.py              # Core Twitch client
│   ├── channel.py             # Channel management
│   ├── settings.py            # Settings (JSON)
│   ├── constants.py           # Configuration
│   ├── utils.py               # Utilities
│   ├── translate.py           # Translations (21 languages)
│   ├── websocket.py           # WebSocket pool
│   ├── inventory.py           # Drops & campaigns
│   ├── cache.py               # Image cache
│   ├── exceptions.py          # Exceptions
│   ├── registry.py            # Windows registry
│   ├── version.py             # Version info
│   ├── requirements.txt       # Python deps
│   ├── LICENSE                # MIT License
│   └── lang/                  # 21 language files
├── frontend/                   # React TypeScript
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── GameIcon.tsx
│   │   │   ├── LoginOverlay.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── StatusDot.tsx
│   │   │   ├── Tip.tsx
│   │   │   └── Toast.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   ├── pages/             # Page components
│   │   │   ├── ChannelsPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DropsPage.tsx
│   │   │   ├── FAQPage.tsx
│   │   │   ├── LogsPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts # WebSocket hook
│   │   ├── App.tsx            # Root component with state management
│   │   ├── types.ts           # TypeScript types
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Tailwind styles
│   ├── public/favicon.ico     # Twitch favicon
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── web_static/                 # Build output (auto-served)
├── start.bat                   # Windows launcher
├── start.sh                    # Linux/Mac launcher
├── package.json                # Root npm scripts
├── .gitignore
├── LICENSE                     # MIT License
└── README.md
```

## Command Line Options

| Flag | Description |
|------|-------------|
| `--port PORT` | Web server port (default: `1337`) |
| `-v` | Verbosity (`-v` info, `-vv` call, `-vvv` debug) |
| `--log` | Enable file logging to `log.txt` |
| `--debug-ws` | Debug websocket messages |
| `--debug-gql` | Debug GQL requests |

## Web Dashboard

| Page | Description |
|------|-------------|
| **Dashboard** | Status cards, drop/campaign progress, watching channel, 8 WebSocket connections |
| **Channels** | Channel table with status, game, drops, viewers, ACL |
| **Drops** | Campaign inventory with game boxart icons, progress bars |
| **Settings** | Proxy, language, priority mode, connection quality, priority/exclude lists, login status |
| **Logs** | Real-time filtered logs with timestamps and search |
| **FAQ** | Built-in troubleshooting guide and common questions |

## Recent Improvements

### Auto Channel Switching
When the currently watched channel goes offline, the miner **automatically switches** to the next best available channel. No more getting stuck in an idle state — mining continues seamlessly.

### Manual Channel Cycling
The **Switch** button now cycles through available channels in order (wrapping around). Useful when you want to force a specific channel or skip a stream.

### Fixed Settings Persistence
Settings toggles (like "Enable Badges & Emotes") no longer revert after saving. The frontend now re-fetches settings from the server after each save, ensuring the UI stays in sync.

### Working Logout
The logout functionality works reliably via both the sidebar button and the `/api/logout` endpoint (GET and POST). Cookies are cleared and the miner resets to a clean state.

### Built-in FAQ Page
A dedicated FAQ page is now part of the Web UI — no need to check the README for common issues. Access it from the sidebar.

### Login Status in Init
Login status and user ID are now included in the initial WebSocket message, so the UI shows the correct state immediately on page load.

## REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Web dashboard |
| GET | `/ws` | WebSocket (live updates) |
| GET | `/api/status` | Server status |
| GET | `/api/settings` | Get settings |
| POST | `/api/settings` | Update settings |
| POST | `/api/login` | Submit login |
| POST | `/api/code` | Confirm activation code |
| GET/POST | `/api/logout` | Logout and clear session |
| POST | `/api/restart` | Restart server |
| POST | `/api/action/reload` | Reload inventory |
| POST | `/api/action/switch` | Switch channel |

## WebSocket Messages

**Server to Client:**
```json
{"type": "init", "status": "Idle", "channels": [], "campaigns": [], "games": {}, "uptime": "00:05:30", "login_status": "Logged out", "login_user_id": null}
{"type": "status", "text": "Watching: ChannelName"}
{"type": "log", "message": "14:32:05 [INFO] Drop claimed"}
{"type": "channels", "channels": [...]}
{"type": "drop", "active": true, "drop_name": "...", "rewards": "..."}
{"type": "settings_saved"}
{"type": "games_update", "games": {...}}
{"type": "toast", "message": "Settings saved", "style": "success"}
```

**Client to Server:**
```json
{"action": "reload"}
{"action": "switch"}
{"action": "restart"}
{"action": "logout"}
{"action": "login_submit", "username": "...", "password": "...", "token": "..."}
{"action": "save_settings", "priority": [...], "exclude": [...]}
```

## Running as a Service (Linux)

```ini
# /etc/systemd/system/twitch-drops.service
[Unit]
Description=Twitch Drops Miner
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/TwitchDropMiner/backend
ExecStart=/usr/bin/python3 server.py --port 1337
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable twitch-drops
sudo systemctl start twitch-drops
```

## Supported Languages

English, Deutsch, Français, Español, Português, Italiano, Nederlands, Polski, Română, Türkiye, Čeština, Dansk, Norsk, Indonesian, Українська, Русский, العربية, 日本語, 简体中文, 繁體中文

## FAQ / Troubleshooting

### Q: The miner stays "Idle" and won't start mining
**A:** This usually means no eligible campaigns were found. Try these:
1. Go to **Settings** and enable **"Enable Badges & Emotes"** — many drops (including Tarkov) require this
2. Make sure your game is in the **Priority List**
3. Click **Reload** in the top bar to refresh campaigns
4. Check **Logs** page for error messages
5. Verify you're logged in (sidebar shows green "Logged in" status)

### Q: How do I log in?
**A:** When the page loads, you'll see a **LoginOverlay**. You have two options:
- **Username/Password**: Enter your Twitch credentials directly
- **Activation Code**: Use the device code flow with `twitch.tv/activate`

### Q: The logout button doesn't work
**A:** Try these:
1. Click the logout icon in the sidebar (next to login status)
2. Or visit `/api/logout` directly in your browser
3. After logout, refresh the page with **Ctrl+F5** (hard refresh)
4. If still stuck, restart the server from the top bar

### Q: Settings don't save / toggle keeps reverting
**A:** After pressing **Save Settings**, the page automatically re-fetches settings from the server. If the toggle still looks wrong:
1. Refresh the page (F5)
2. Make sure you see the green "Settings saved" toast
3. Check the server-side file (`settings.json`) — it always has the correct values

### Q: The server keeps restarting / crashing
**A:** Check the logs with `journalctl -u twitch-drops -n 50`. Common causes:
- OAuth token expired (use the logout button and re-login)
- Twitch API rate limiting (wait a few minutes)
- Network connectivity issues

### Q: "Maintenance task waiting" — what does this mean?
**A:** The miner runs a scheduled task every hour that triggers a campaign refresh. This is **normal behavior**. The task will automatically reload inventory when needed — no action required.

### Q: Campaigns are found but no channels are being watched
**A:** This means campaigns exist but no live channels are streaming the game with drops enabled. The server will automatically check again when new streams go live, or click **Reload** to force an immediate refresh.

### Q: How do I run this as a service?
**A:** See the [Running as a Service](#running-as-a-service-linux) section above. On Linux, use the provided systemd unit file.

## License

[MIT](LICENSE) — Original project by [DevilXD](https://github.com/DevilXD/TwitchDropsMiner)
