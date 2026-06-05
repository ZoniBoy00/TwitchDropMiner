# API Reference

The Twitch Drop Miner exposes a REST API on the same port as the web dashboard. All endpoints return JSON.

## Base URL

```
http://localhost:1337/api/
```

## Authentication

If an API key is configured, include it in all requests:

```
X-API-Key: your-api-key
```

Requests without a valid key receive a `403 Forbidden` response.

## Rate Limiting

All API endpoints are rate-limited to **30 requests per minute per IP**. Exceeding this returns:

```json
{
    "error": "Rate limit exceeded. Try again later."
}
```

## Endpoints

### GET /api/status

Returns the current server status.

**Response:**
```json
{
    "version": "17.0",
    "status": "watching" | "idle",
    "uptime": 3600,
    "logged_in": true,
    "current_channel": {
        "id": "123456789",
        "name": "channel_name",
        "game": "Game Name",
        "title": "Stream Title",
        "viewers": 1234,
        "online": true
    },
    "channels_count": 42,
    "drops": [
        {
            "id": "campaign_id",
            "game": "Game Name",
            "name": "Drop Name",
            "progress": 0.75,
            "claimed": false,
            "remaining": "2h 30m"
        }
    ]
}
```

**Status values:**
| Status | Meaning |
|---|---|
| `watching` | Mining is active |
| `idle` | Waiting for login or no channels available |
| `error` | An error occurred |

---

### GET /api/settings

Returns all current settings.

**Response:**
```json
{
    "api_key": "",
    "autostart_tray": false,
    "available_drops_check": false,
    "connection_quality": 1,
    "dark_mode": false,
    "enable_badges_emotes": true,
    "exclude": [],
    "language": "English",
    "priority": ["Rust", "Escape from Tarkov"],
    "priority_mode": 0,
    "proxy": "",
    "tray_notifications": true
}
```

---

### POST /api/settings

Updates settings. Only sends changed fields (partial update).

**Request Body (JSON):**
```json
{
    "priority": ["Rust", "Escape from Tarkov", "Counter-Strike 2"],
    "language": "Deutsch",
    "dark_mode": true
}
```

**Response:**
```json
{
    "success": true,
    "message": "Settings saved"
}
```

The miner broadcasts a `settings_saved` WebSocket message after successful update.

---

### POST /api/login

Submit login credentials (username/password method).

**Request Body (JSON):**
```json
{
    "username": "your_twitch_username",
    "password": "your_twitch_password",
    "token": "optional_2fa_code"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful"
}
```

On failure:
```json
{
    "success": false,
    "error": "Invalid username or password"
}
```

---

### POST /api/code

Confirm OAuth device activation code.

**Request Body (JSON):**
```json
{
    "code": "ABC123"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful"
}
```

---

### GET|POST /api/logout

Logout and clear the current Twitch session.

**Response:**
```json
{
    "success": true,
    "message": "Logged out"
}
```

---

### POST /api/restart

Restart the miner. Returns immediately; the server will reconnect and resume.

**Response:**
```json
{
    "success": true,
    "message": "Restarting..."
}
```

---

### POST /api/action/reload

Reload the inventory — re-fetch all active drop campaigns and update the channel list.

**Response:**
```json
{
    "success": true,
    "message": "Reloading inventory"
}
```

---

### POST /api/action/switch

Switch to the next available channel in the priority order.

**Response:**
```json
{
    "success": true,
    "message": "Switching channel"
}
```

---

### GET /

Serves the web dashboard (static HTML). Returns the React SPA.

## Error Responses

All endpoints return consistent error objects on failure:

```json
{
    "error": "Error description"
}
```

HTTP status codes:
| Code | Meaning |
|---|---|
| `200` | Success |
| `400` | Bad request (missing/invalid fields) |
| `401` | Login required |
| `403` | Invalid API key |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
