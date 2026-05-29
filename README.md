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

- **Stream-less mining** - No video/audio download, only metadata
- **Game priority list** - Prioritize games with boxart icons
- **Game exclude list** - Exclude games from mining
- **Auto-switching** - Automatically switches to better channels
- **Auto-claim** - Claims drops automatically when ready
- **8 WebSocket connections** - Track up to 199 channels simultaneously
- **Web dashboard** - Modern React UI with real-time updates
- **REST API** - Integrate with other systems
- **21 languages** - Full translation support
- **Toolips** - Contextual help on all settings

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ (for building frontend)

### Installation

```bash
git clone https://github.com/yourusername/TwitchDropsMiner.git
cd TwitchDropsMiner

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
TwitchDropsMiner/
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
| **Settings** | Proxy, language, priority mode, connection quality, priority/exclude lists |
| **Logs** | Real-time filtered logs with timestamps and search |
| **Login** | Twitch login with device activation code flow |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.10+ / aiohttp |
| Frontend | React 19 / TypeScript |
| Build | Vite 6 |
| Styles | Tailwind CSS 3 |
| Icons | Lucide React |
| Architecture | Modular components with inline game dropdowns |

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
| POST | `/api/restart` | Restart server |
| POST | `/api/action/reload` | Reload inventory |
| POST | `/api/action/switch` | Switch channel |

## WebSocket Messages

**Server to Client:**
```json
{"type": "init", "status": "Idle", "channels": [], "campaigns": [], "games": {}, "uptime": "00:05:30"}
{"type": "status", "text": "Watching: ChannelName"}
{"type": "log", "message": "14:32:05 [INFO] Drop claimed"}
{"type": "channels", "channels": [...]}
{"type": "drop", "active": true, "drop_name": "...", "rewards": "..."}
{"type": "toast", "message": "Settings saved", "style": "success"}
```

**Client to Server:**
```json
{"action": "reload"}
{"action": "switch"}
{"action": "restart"}
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
WorkingDirectory=/path/to/TwitchDropsMiner/backend
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

English, Deutsch, Francais, Espanol, Portugues, Italiano, Nederlands, Polski, Romana, Turkye, Cestina, Dansk, Norsk, Indonesian, Ukrainska, Russkij, Arabiya, Nihongo, Jianzi Zhongwen, Fanti Zhongwen

## License

[MIT](LICENSE) - Original project by [DevilXD](https://github.com/DevilXD/TwitchDropsMiner)
