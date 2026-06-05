# Twitch Drop Miner

**Version:** v17.1 | **License:** MIT | **Repository:** [ZoniBoy00/TwitchDropMiner](https://github.com/ZoniBoy00/TwitchDropMiner)

AFK mine timed Twitch drops without watching streams. Saves bandwidth by only fetching stream metadata — no video or audio is ever downloaded.

## Features

- **Stream-less mining** — No video/audio download, only metadata via GQL queries
- **Game priority list** — Ordered list of preferred games with boxart icons
- **Game exclude list** — Exclude games you don't want drops from
- **Auto channel switching** — Automatically switches to the next best channel when the current one goes offline
- **Manual channel cycling** — Switch button cycles through channels in order
- **Auto-claim** — Claims drops automatically when ready
- **8 parallel WebSocket connections** — Track up to 199 channels simultaneously
- **Modern web dashboard** — Real-time React UI with live WebSocket updates
- **REST API** — Full programmatic control over the miner
- **API page** — Dedicated API management tab with key management, endpoint reference, and built-in tester
- **API key authentication** — Optional security for API access
- **Rate limiting** — 30 requests/minute/IP protection
- **21 languages** — Full translation support
- **3 priority modes** — Priority list, Ending Soonest, Low Availability First
- **Proxy support** — Full URL proxy configuration
- **Responsive mobile UI** — Hamburger menu, drawer sidebar
- **Multiple login methods** — Username/password + 2FA or OAuth device code flow
- **8 client types** — Choose from Web, Mobile Web, Android App, or Smart TV Twitch client types

## Quick Start

```bash
# Clone the repository
git clone https://github.com/ZoniBoy00/TwitchDropMiner.git
cd TwitchDropMiner

# Install backend dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies
cd frontend && npm install && cd ..

# Build frontend
cd frontend && npm run build && cd ..

# Run the server
python backend/server.py --port 1337 -vv --log
```

Open `http://localhost:1337` in your browser and follow the login flow.

## Screenshots

![Dashboard](https://raw.githubusercontent.com/ZoniBoy00/TwitchDropMiner/master/Screenshots/Dashboard.png)
![Channels](https://raw.githubusercontent.com/ZoniBoy00/TwitchDropMiner/master/Screenshots/Channels.png)
![Drops](https://raw.githubusercontent.com/ZoniBoy00/TwitchDropMiner/master/Screenshots/Drops.png)

![Settings](https://raw.githubusercontent.com/ZoniBoy00/TwitchDropMiner/master/Screenshots/Settings.png)
![Logs](https://raw.githubusercontent.com/ZoniBoy00/TwitchDropMiner/master/Screenshots/Logs.png)
![FAQ](https://raw.githubusercontent.com/ZoniBoy00/TwitchDropMiner/master/Screenshots/FAQ.png)

## System Requirements

- **Python:** 3.10+
- **Node.js:** 18+ (for building the frontend)
- **OS:** Linux, macOS, or Windows
- **Network:** Internet connection to Twitch (no VPN required by default)

## Navigation

- [Installation](Installation) — Full setup guide
- [Configuration](Configuration) — All settings explained
- [Architecture](Architecture) — How the miner works under the hood
- [API Reference](API-Reference) — REST API endpoints
- [WebSocket Protocol](WebSocket-Protocol) — Real-time message reference
- [FAQ](FAQ) — Troubleshooting and common questions
