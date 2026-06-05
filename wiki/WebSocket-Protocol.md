# WebSocket Protocol

The miner provides a real-time WebSocket endpoint at `/ws`. All messages are JSON.

## Connection

```javascript
const ws = new WebSocket("ws://localhost:1337/ws");

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log(message.type, message.data);
};
```

## Server → Client Messages

### `init`

Sent immediately after WebSocket connection. Contains the current full state.

```json
{
    "type": "init",
    "data": {
        "logged_in": false,
        "status": "idle",
        "settings": { ... },
        "channels": [],
        "drops": []
    }
}
```

### `status`

Server status update (periodic or on state change).

```json
{
    "type": "status",
    "data": {
        "status": "watching" | "idle" | "error",
        "logged_in": true,
        "current_channel": {
            "id": "123456789",
            "name": "channel_name",
            "game": "Game Name",
            "title": "Stream Title",
            "viewers": 1234,
            "online": true
        },
        "uptime": 3600
    }
}
```

### `channels`

Full list of tracked channels. Sent on channel list changes.

```json
{
    "type": "channels",
    "data": [
        {
            "id": "123456789",
            "name": "channel_name",
            "display_name": "ChannelName",
            "game": "Game Name",
            "title": "Stream Title",
            "viewers": 1234,
            "online": true,
            "live": true,
            "priority": true,
            "watched": false,
            "avatar": "https://static-cdn.jtvnw.net/user-default-pictures/..."
        }
    ]
}
```

| Field | Type | Description |
|---|---|---|
| `id` | String | Twitch user ID |
| `name` | String | Channel login name (lowercase) |
| `display_name` | String | Channel display name |
| `game` | String | Current game being played |
| `title` | String | Current stream title |
| `viewers` | Number | Current viewer count |
| `online` | Boolean | Whether the stream is currently live |
| `live` | Boolean | Same as `online` (legacy) |
| `priority` | Boolean | Whether this channel's game is in your priority list |
| `watched` | Boolean | Whether this channel is currently being watched |
| `avatar` | String | URL to the channel's profile image |

### `drop`

Drop progress update.

```json
{
    "type": "drop",
    "data": {
        "id": "campaign_id",
        "game": "Game Name",
        "name": "Drop Name",
        "image": "https://static-cdn.jtvnw.net/...",
        "progress": 0.75,
        "claimed": false,
        "remaining": "2h 30m 0s"
    }
}
```

| Field | Type | Description |
|---|---|---|
| `id` | String | Campaign/benefit ID |
| `game` | String | Game the drop is for |
| `name` | String | Drop reward name |
| `image` | String | Boxart image URL |
| `progress` | Number | Progress as a float (0.0 - 1.0) |
| `claimed` | Boolean | Whether the drop has been claimed |
| `remaining` | String | Human-readable remaining time |

### `progress`

Aggregated progress update (percentages).

```json
{
    "type": "progress",
    "data": {
        "overall": 45,
        "drops": [
            {
                "id": "campaign_id",
                "progress": 75,
                "name": "Drop Name"
            }
        ]
    }
}
```

### `inventory`

Full inventory list (sent on reload/refresh).

```json
{
    "type": "inventory",
    "data": [
        {
            "id": "campaign_id",
            "game": "Game Name",
            "name": "Drop Name",
            "image": "https://...",
            "progress": 0.75,
            "claimed": false,
            "remaining": "2h 30m 0s"
        }
    ]
}
```

### `ws_status`

WebSocket connection pool status.

```json
{
    "type": "ws_status",
    "data": {
        "connections": [
            {
                "id": 0,
                "connected": true,
                "topics": 24,
                "reconnect_count": 0
            },
            { "id": 1, "connected": true, "topics": 22, "reconnect_count": 0 },
            { "id": 2, "connected": false, "topics": 0, "reconnect_count": 3 },
            { "id": 3, "connected": true, "topics": 20, "reconnect_count": 1 },
            { "id": 4, "connected": true, "topics": 20, "reconnect_count": 1 },
            { "id": 5, "connected": true, "topics": 22, "reconnect_count": 0 },
            { "id": 6, "connected": true, "topics": 20, "reconnect_count": 0 },
            { "id": 7, "connected": true, "topics": 18, "reconnect_count": 0 }
        ],
        "total_topics": 146,
        "total_channels_watched": 73
    }
}
```

### `log`

Log messages (only sent if logging is enabled).

```json
{
    "type": "log",
    "data": {
        "time": "14:30:00",
        "msg": "Channel switched to X for Rust",
        "type": "info" | "warn" | "error"
    }
}
```

### `login`

Login status update.

```json
{
    "type": "login",
    "data": {
        "logged_in": true | false,
        "error": null | "Error message"
    }
}
```

### `toast`

Display a notification in the web UI.

```json
{
    "type": "toast",
    "data": {
        "message": "Drop claimed: Rust Skin",
        "type": "success" | "error" | "info" | "claim"
    }
}
```

| Type | Use |
|---|---|
| `success` | Operation completed successfully |
| `error` | Operation failed |
| `info` | General information |
| `claim` | Drop was claimed |

### `settings_saved`

Confirmation that settings were saved.

```json
{
    "type": "settings_saved",
    "data": {
        "success": true,
        "message": "Settings saved"
    }
}
```

### `games_update`

Game list has been refreshed.

```json
{
    "type": "games_update",
    "data": {
        "game_names": ["Rust", "Escape from Tarkov", "Counter-Strike 2"]
    }
}
```

### `tray`

Tray icon update (Windows only).

```json
{
    "type": "tray",
    "data": {
        "icon": "active" | "idle" | "error" | "maint"
    }
}
```

## Client → Server Messages

Send messages using `ws.send(JSON.stringify(message))`.

### `action: reload`

Reload the inventory.

```json
{
    "action": "reload"
}
```

### `action: switch`

Switch to the next channel.

```json
{
    "action": "switch"
}
```

### `action: restart`

Restart the miner completely.

```json
{
    "action": "restart"
}
```

### `action: logout`

Logout from Twitch.

```json
{
    "action": "logout"
}
```

### `action: login_submit`

Submit login credentials.

```json
{
    "action": "login_submit",
    "username": "your_username",
    "password": "your_password",
    "token": "2fa_code_if_needed"
}
```

### `action: save_settings`

Save settings (same as POST /api/settings).

```json
{
    "action": "save_settings",
    "settings": {
        "priority": ["Rust", "Escape from Tarkov"],
        "dark_mode": true
    }
}
```

### `action: code_confirm`

Confirm device activation code.

```json
{
    "action": "code_confirm",
    "code": "ABC123"
}
```
