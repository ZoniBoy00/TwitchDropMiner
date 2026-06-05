# Installation Guide

## Prerequisites

- **Python 3.10+** — Check with `python --version`
- **Node.js 18+** (LTS recommended) — Check with `node --version`
- **npm 9+** — Check with `npm --version`
- **Git** — To clone the repository

## Step 1: Clone the Repository

```bash
git clone https://github.com/ZoniBoy00/TwitchDropMiner.git
cd TwitchDropMiner
```

## Step 2: Install Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

The dependencies are minimal:
- `aiohttp>=3.9,<4.0` — Async HTTP/WebSocket framework
- `truststore` — SSL certificate injection (uses system trust store)

> **Note:** Using a virtual environment is recommended but not required:
> ```bash
> python -m venv venv
> source venv/bin/activate  # Linux/macOS
> venv\Scripts\activate     # Windows
> pip install -r backend/requirements.txt
> ```

## Step 3: Build the Frontend (Optional)

If you want to use the web dashboard, build the frontend:

```bash
cd frontend
npm install
npm run build
cd ..
```

The built files are output to `web_static/` and automatically served by the backend. If you skip this step, the server will still start but you'll only be able to use the REST API.

### Development Mode

For frontend development, run the Vite dev server alongside the backend:

```bash
# Terminal 1: Start the backend
python backend/server.py --port 1337 -vv --log

# Terminal 2: Start the frontend dev server
cd frontend
npm run dev
```

The frontend dev server runs on port 3000 and proxies API calls to port 1337.

## Step 4: Start the Miner

```bash
python backend/server.py --port 1337 -vv --log
```

Open `http://localhost:1337` in your browser and follow the login flow.

### CLI Arguments

| Flag | Description | Default |
|---|---|---|
| `--port PORT` | Web server port | `1337` |
| `--host HOST` | Bind address | `0.0.0.0` |
| `-v` | Verbosity level (info) | `0` (errors only) |
| `-vv` | Verbosity level (call) | — |
| `-vvv` | Verbosity level (debug) | — |
| `--log` | Enable file logging to `log.txt` | off |
| `--debug-ws` | Debug WebSocket messages | off |
| `--debug-gql` | Debug GQL requests | off |
| `--version` | Show version number | — |

> **Tip:** Use `-vv` for normal operation — it shows enough output to know what's happening without being overwhelming.

## Running as a Service (Linux)

### systemd Service

Create `/etc/systemd/system/twitch-drops.service`:

```ini
[Unit]
Description=Twitch Drop Miner
After=network.target

[Service]
Type=simple
User=YOUR_USER
WorkingDirectory=/opt/TwitchDropMiner
ExecStart=/usr/bin/python3 /opt/TwitchDropMiner/backend/server.py --port 1337 -vv --log
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now twitch-drops
```

### Using the Production Launcher

```bash
# Linux/macOS
./start.sh --port 1337 -vv --log

# Windows (double-click)
start.bat
```

## Running with Docker (Community)

While no official Dockerfile is provided, you can create one:

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ backend/
COPY web_static/ web_static/

EXPOSE 1337
CMD ["python", "backend/server.py", "--port", "1337", "-vv", "--log"]
```

## First-Time Login

1. Open the web dashboard at `http://localhost:1337`
2. You'll see a login overlay with two options:
   - **Device Activation Code** (recommended) — Opens Twitch's activation page, enter the 6-digit code
   - **Username & Password** — Direct login (may trigger captcha)
3. After successful login, the miner starts automatically

> **Tip:** Use the Device Activation Code method — it's more reliable and avoids captcha issues.
