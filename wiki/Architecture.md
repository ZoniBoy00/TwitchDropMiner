# Architecture

## Overview

The Twitch Drop Miner is an async state machine that runs entirely in Python (aiohttp) with a React TypeScript frontend. It mines timed Twitch drops by sending lightweight GQL "minute-watched" events — no video or audio is ever streamed.

### Architecture Overview

The system is composed of four main layers:

**State Machine** — The core logic that drives the miner through a continuous lifecycle:
IDLE → INVENTORY_FETCH → GAMES_UPDATE → CHANNELS_FETCH → CHANNELS_CLEANUP → CHANNEL_SWITCH → (back to start)

**Twitch GQL Client** — Handles all GraphQL communication with Twitch: inventory queries, campaign data, and periodic `SendEvents` mutations for minute-watched progress.

**WebSocket Pool (8x)** — Maintains eight parallel connections to `wss://pubsub-edge.twitch.tv` for tracking channel online/offline status and watch progress updates.

**Web GUI (aiohttp)** — Serves the React frontend, provides the REST API, and manages the real-time WebSocket connection to the dashboard.

## State Machine

The miner runs through these states in a continuous loop:

### IDLE
Initial state. Waits for login to complete. Once authenticated, transitions to `INVENTORY_FETCH`.

### INVENTORY_FETCH
Fetches the user's active drop inventory from Twitch via GQL:
- `Inventory` query — Gets the user's current drop progress
- `CurrentDrop` query — Checks the currently active drop campaign
- `Campaigns` query — Lists all available campaigns
- `CampaignDetails` query — Gets per-campaign progress
- `AvailableDrops` query — Finds all claimable drops

Transitions to `GAMES_UPDATE`.

### GAMES_UPDATE
Builds the list of games to watch:
1. Applies the **priority list** filter (if `priority_mode = 0`)
2. Applies the **exclude list** filter
3. Sorts according to `priority_mode` (ending soonest / low availability first)
4. Ensures priority games come first

Transitions to `CHANNELS_FETCH`.

### CHANNELS_FETCH
Discovers live channels for the selected games:
1. Uses `GameDirectory` GQL query — searches for channels by game
2. Uses ACL-based channel discovery — finds channels related to already-tracked ones
3. Checks all discovered channels for active drop campaigns
4. Deduplicates and filters channels

Transitions to `CHANNELS_CLEANUP`.

### CHANNELS_CLEANUP
Validates and cleans up the channel list:
1. Removes channels that went offline
2. Removes channels playing games no longer in scope
3. Ensures at least one watchable channel remains

Transitions to `CHANNEL_SWITCH`.

### CHANNEL_SWITCH
Selects the best channel and starts watching:
1. Picks the highest-priority channel that's online and has active drops
2. Sends a `minute-watched` event via GQL `SendEvents` mutation
3. Schedules the next watch event (~59 seconds later)
4. Monitors the channel for offline status (via WebSocket PubSub)
5. If the channel goes offline, transitions back to `CHANNELS_FETCH`

### Maintenance Task
An hourly background task runs alongside the watch loop:
1. Refreshes campaign data from Twitch
2. Claims any drops that are ready to claim
3. Updates the game list (new campaigns may have appeared)

## WebSocket Pool

The miner maintains **8 parallel WebSocket connections** to `wss://pubsub-edge.twitch.tv`:

```
Connection 1: Topics A-N  (up to 49 channels)
Connection 2: Topics O-Z  (up to 49 channels)
...
Connection 8: Topics ...  (up to 49 channels)
```

### Topic Allocation

Each channel requires 2 PubSub topics:
- `video-playback-by-id.{channel_id}` — Tracks online/offline status
- `minute-watched-update.{user_id}` — Tracks watch progress

Each WebSocket connection supports up to 50 topics. After reserving 2 base topics, 48 remain for channels → **24 channels per connection**.

With 8 connections: **8 × 24 = 192 channels** (capped at 199 in practice due to margin).

### Auto-Reconnect

If a WebSocket disconnects:
1. Exponential backoff starts (1s, 2s, 4s, 8s, up to 30s max)
2. All topics for that connection are re-subscribed on reconnect
3. Channels on that connection resume watching normally

## Minute-Watch Mechanism

The core of drop mining — sending periodic "I'm still watching" events:

1. Every ~59 seconds, the miner sends a `SendEvents` GQL mutation
2. The event payload includes:
   - `channel_id` — The current channel being watched
   - `game_id` — The game being played
   - `minute_duration` — 60 seconds (one minute interval)
3. Twitch returns the updated drop progress
4. The miner checks if progress advanced:
   - If yes → Schedule next event in ~59 seconds
   - If stalled → Send a "bump" event (extra event to trigger progress)
   - If drop is complete → Stop watching this channel

## Auto-Claim

When a drop's progress reaches 100%:
1. Miner detects the completed drop during the watch event response
2. Sends `DropsPage_ClaimDropRewards` GQL mutation
3. Verifies the claim was successful
4. Logs the claimed reward

## File Structure

```
backend/
├── server.py          # Entry point, CLI args, main loop
├── twitch.py          # Core Twitch client & state machine (1655 lines)
├── web_gui.py         # aiohttp web server, REST API, WebSocket
├── channel.py         # Channel & Stream management
├── settings.py        # Settings JSON persistence
├── constants.py       # GQL queries, enums, configuration
├── utils.py           # Utilities, backoff, rate limiter
├── translate.py       # 21-language translation system
├── websocket.py       # WebSocket pool management (8 connections)
├── inventory.py       # Drops, campaigns, benefits management
├── cache.py           # Image caching (boxart)
├── exceptions.py      # Custom exception hierarchy
├── registry.py        # Windows registry (tray mode)
└── version.py         # Version constant

frontend/src/
├── main.tsx           # React entry point
├── types.ts           # TypeScript type definitions
├── App.tsx            # Root component & state management
├── useWebSocket.ts    # WebSocket hook with auto-reconnect
├── components/        # Reusable UI components
├── layout/            # Sidebar + Topbar layout
└── pages/             # Dashboard, Channels, Drops, Settings, Logs, FAQ
```

## Exception Hierarchy

```
MinerException (base)
├── ExitRequest         — Graceful shutdown requested
├── ReloadRequest       — Inventory reload requested
├── RequestException    — Network/GQL request failed
│   └── GQLException    — Specific GQL query failure
├── LoginException      — Authentication failed
├── CaptchaRequired     — Twitch is asking for captcha
└── WebsocketClosed     — WebSocket connection closed unexpectedly
```
