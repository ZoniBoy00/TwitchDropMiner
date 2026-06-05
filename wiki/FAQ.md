# FAQ & Troubleshooting

## General

### How does the miner work without watching the stream?

Instead of downloading video/audio, the miner sends lightweight GraphQL "minute-watched" events to Twitch's API every ~59 seconds. This triggers the same drop progress as actually watching the stream, but uses a tiny fraction of the bandwidth.

### Is this against Twitch's Terms of Service?

Using automated tools to claim drops technically violates Twitch's ToS. This tool is provided for educational purposes. Use at your own risk. Accounts with a history of ToS violations may be at higher risk.

### Can I run multiple instances?

Yes, but each instance needs its own Twitch account and a different port:

```bash
# Instance 1
python backend/server.py --port 1337

# Instance 2
python backend/server.py --port 1338
```

### Does the miner work for Prime Gaming / Amazon drops?

No. This miner only handles **in-platform Twitch drops** — campaigns that appear in your Twitch Drops Inventory page. Amazon/Prime Gaming drops require a different mechanism.

## Login Issues

### I get "Captcha Required" when logging in

Twitch is requiring a captcha challenge. Solutions:

1. **Use the Device Activation Code method** — This bypasses captcha entirely. Click the "Device Activation" button in the login overlay.
2. **Wait a few hours** — Captcha requirements are temporary and usually clear up.
3. **Use a different IP** — Try a proxy or different network.

### Device Activation Code doesn't work

1. Make sure you enter the code exactly as shown (case-sensitive)
2. The code expires after a few minutes — refresh and try again
3. Try a different browser or incognito mode

### Username/password login fails

1. Check credentials — try logging into Twitch manually first
2. If you have 2FA enabled, include the 2FA code in the `token` field
3. Twitch may require captcha — switch to Device Activation Code method

### Session expires frequently

This is normal. Twitch sessions can expire after several hours. The miner will:
1. Detect the expired session
2. Log the error
3. Wait for you to re-login through the dashboard

If this happens too frequently, try:
- Using a proxy to avoid IP-based session limits
- Checking if your account has any restrictions

## Mining Issues

### Drops progress isn't moving

1. **Check the channel** — Make sure the channel you're watching is actually streaming the game that has drops
2. **Check if drops are active** — Go to your Twitch Drops Inventory page and verify the campaign is still running
3. **Check the logs** — Look for error messages in the web dashboard Logs page
4. **Manual bump** — Click the "Reload" button in the dashboard to refresh inventory
5. **Try a different channel** — Click "Switch" to change channels

### "No channels available" message

This means the miner couldn't find any live channels for your selected games. Possible causes:
- No one is streaming your priority games right now
- All channels playing your games have already been claimed for all drops
- Your exclude list is too broad

**Solutions:**
- Add more games to your priority list
- Check the exclude list
- Change priority mode to "Ending Soonest" to find any active drops

### Miner keeps switching channels

If the miner is rapidly switching channels:
1. **Connection issues** — The WebSocket connections may be unstable. Increase `connection_quality` setting.
2. **Channels going offline** — The channels may be ending their streams. This is normal.
3. **Rate limiting** — You might be hitting Twitch rate limits. The miner will back off automatically.

### Drops not claiming automatically

The auto-claim works for most drops, but some campaign types may require manual claiming. If auto-claim fails:
1. Reload the inventory
2. Check the dashboard — completed drops should show with a "Claim" button
3. Claim manually from Twitch's Drops Inventory page

### Too many channels in the list

The miner is designed to track many channels. If you want fewer:
1. Narrow your priority list to specific games
2. Add games to the exclude list
3. The miner will only watch one channel at a time regardless of how many are tracked

## Performance & Resources

### High CPU usage

The miner is very lightweight. If you see high CPU:
1. Check if multiple instances are running
2. Update to the latest version
3. Use `-v` (not `-vvv`) for verbosity to reduce logging overhead
4. On Windows, tray mode may reduce CPU vs. web mode

### Memory usage

Expected memory usage:
- **Idle (no mining):** ~30-50 MB
- **Active mining:** ~60-100 MB
- **Web dashboard loaded:** ~100-150 MB

High memory? Try:
1. Restart the miner
2. Update to the latest version
3. Disable the web dashboard if you only need the API

### Bandwidth usage

Since no video/audio is streamed, bandwidth usage is minimal:
- **GQL requests:** ~2-5 KB per request
- **Watch events:** ~1 KB every 59 seconds
- **WebSocket:** ~0.5-2 KB per connection overhead
- **Total:** ~10-50 MB per day depending on channel count

## Web Dashboard

### Dashboard shows "Connecting..."

The WebSocket connection to the backend failed. Try:
1. Refresh the page
2. Check if the backend is running (`curl http://localhost:1337/api/status`)
3. Check the backend logs for WebSocket errors
4. Restart the backend

### Settings won't save

1. Check the logs for error messages
2. Make sure the `settings.json` file is writable
3. Try saving through the API: `POST /api/settings`
4. Check the browser console for errors

### Frontend shows blank page

1. Clear your browser cache (Ctrl+F5 / Cmd+Shift+R)
2. Make sure the frontend was built: `cd frontend && npm run build`
3. Check the browser console for errors

## Proxy & Network

### Proxy connection fails

1. Make sure the proxy URL format is correct:
   - `http://ip:port` — HTTP proxy
   - `https://ip:port` — HTTPS proxy
   - `socks5://ip:port` — SOCKS5 proxy
2. If your proxy requires authentication: `http://user:pass@ip:port`
3. Test the proxy separately: `curl --proxy http://ip:port https://twitch.tv`
4. Check the logs for connection errors

### "Connection closed" errors in logs

These are usually harmless WebSocket disconnections. The miner will:
1. Automatically reconnect with exponential backoff
2. Re-subscribe to all channel topics
3. Resume normal operation

If it happens constantly, check your internet connection or try a proxy.

### Rate limited by Twitch

If you see rate limit errors:
1. The miner already handles this with exponential backoff and client type rotation
2. Increase `connection_quality` to spread out requests more
3. Use a proxy to get a fresh IP
4. Reduce the number of tracked channels

## Platform-Specific

### Windows: "Access Denied" when writing settings

Run the application as Administrator, or change the permissions on the `backend/` folder.

### Linux: Port 1337 already in use

```bash
# Find the process using port 1337
sudo lsof -i :1337

# Kill it
sudo kill -9 <PID>

# Or use a different port
python backend/server.py --port 1338
```

### Systemd service won't start

Check the service logs:
```bash
sudo journalctl -u twitch-drops -n 50 --no-pager
```

Common issues:
- Python path is wrong → use full path: `/usr/bin/python3`
- Working directory doesn't exist → set `WorkingDirectory=/opt/TwitchDropMiner`
- Port already in use → change port or stop the other process

## Error Reference

| Log Message | Meaning | Solution |
|---|---|---|
| `Login failed: CaptchaRequired` | Twitch requires captcha | Use Device Activation Code method |
| `GQLException: 401 Unauthorized` | Session expired | Re-login |
| `WebsocketClosed: connection lost` | WebSocket disconnected | Auto-reconnects, usually harmless |
| `Rate limit hit, backing off...` | Too many requests | Miner will wait, this is normal |
| `No channels found for [game]` | No live streams for this game | Add more games or wait |
| `Failed to claim drop: [reason]` | Auto-claim failed | Claim manually from Twitch |
| `Proxy error: [error]` | Proxy connection failed | Check proxy configuration |
| `Cannot connect to Twitch` | Network issue | Check your internet connection |
