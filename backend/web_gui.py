from __future__ import annotations

import os
import sys
import json
import asyncio
import logging
import re
import time
from datetime import datetime
from collections import defaultdict
from typing import TYPE_CHECKING

from aiohttp import web

from translate import _
from constants import State

if TYPE_CHECKING:
    from twitch import Twitch
    from inventory import TimedDrop, DropsCampaign

logger = logging.getLogger("TwitchDrops")


def _json(obj):
    return json.dumps(obj, default=str)


class WebStatusBar:
    def __init__(self, mgr: WebGUIManager):
        self._mgr = mgr
        self.text: str = ""

    def update(self, text: str):
        self.text = text
        self._mgr._send({"type": "status", "text": text})

    def clear(self):
        self.text = ""


class WebWebsocketStatus:
    def __init__(self, mgr: WebGUIManager):
        self._mgr = mgr
        self._items: dict[int, dict] = {
            i: {"status": "Disconnected", "topics": 0} for i in range(8)
        }

    def update(self, idx: int, status: str | None = None, topics: int | None = None):
        if idx not in self._items:
            self._items[idx] = {"status": "Disconnected", "topics": 0}
        if status is not None:
            self._items[idx]["status"] = status
        if topics is not None:
            self._items[idx]["topics"] = topics
        self._mgr._send({"type": "ws_status", "items": self._items})

    def remove(self, idx: int):
        self._items.pop(idx, None)


class WebLoginForm:
    def __init__(self, mgr: WebGUIManager):
        self._mgr = mgr
        self.status: str = "Logged out"
        self.user_id: int | None = None
        self._login_event = asyncio.Event()
        self._code_event = asyncio.Event()
        self.pending_code: str | None = None
        self.pending_url: str | None = None
        self.waiting_for: str | None = None
        self._web_username = ""
        self._web_password = ""
        self._web_token = ""

    def update(self, status: str, user_id: int | None):
        self.status = status
        self.user_id = user_id
        self._mgr._send({"type": "login", "status": status, "user_id": user_id})

    async def wait_for_login_press(self):
        self._login_event.clear()
        self.waiting_for = "login"
        self._mgr._send({"type": "login", "action": "request_login"})
        await self._mgr.coro_unless_closed(self._login_event.wait())
        self.waiting_for = None

    async def ask_login(self):
        from gui import LoginData
        self.update(_("gui", "login", "required"), None)
        self._mgr._send({"type": "login", "action": "request_login"})
        while True:
            self._mgr.print(_("gui", "login", "request"))
            await self.wait_for_login_press()
            ld = LoginData(self._web_username, self._web_password, self._web_token)
            if not (3 <= len(ld.username) <= 25) or not re.match(r"^[a-zA-Z0-9_]+$", ld.username):
                self._mgr._send({"type": "login", "error": "Invalid username"})
                continue
            if len(ld.password) < 8:
                self._mgr._send({"type": "login", "error": "Password too short"})
                continue
            if ld.token and len(ld.token) < 6:
                self._mgr._send({"type": "login", "error": "Token too short"})
                continue
            return ld

    async def ask_enter_code(self, page_url, user_code: str):
        self.update(_("gui", "login", "required"), None)
        self.pending_code = user_code
        self.pending_url = str(page_url)
        self.waiting_for = "code"
        self._mgr._send({"type": "login", "action": "enter_code", "code": user_code, "url": str(page_url)})
        self._mgr.print(f"Enter this code on Twitch's activation page: {user_code}")
        self._code_event.clear()
        await self._mgr.coro_unless_closed(self._code_event.wait())
        self.waiting_for = None

    def submit_login(self, username: str, password: str, token: str):
        self._web_username, self._web_password, self._web_token = username, password, token
        self._login_event.set()

    def confirm_code(self):
        self._code_event.set()


class WebCampaignProgress:
    def __init__(self, mgr: WebGUIManager):
        self._mgr = mgr
        self._drop: TimedDrop | None = None
        self._timer_task: asyncio.Task | None = None
        self._seconds: int = 0

    def get_init_drop(self) -> dict:
        """Return current drop data for the init message"""
        d = self._drop
        if d is None:
            return {"active": False}
        c = d.campaign
        return {
            "active": True,
            "drop_name": d.name,
            "rewards": d.rewards_text(),
            "drop_progress": d.progress,
            "drop_pct": f"{d.progress:.1%}",
            "campaign_name": c.name,
            "game_name": c.game.name,
            "campaign_progress": c.progress,
            "campaign_pct": f"{c.progress:.1%} ({c.claimed_drops}/{c.total_drops})",
            "drop_rem": f"{d.remaining_minutes} min",
            "camp_rem": f"{c.remaining_minutes} min",
        }

    def _update_time(self, seconds: int | None = None):
        if seconds is not None:
            self._seconds = seconds
        d = self._drop
        dm = d.remaining_minutes if d else 0
        cm = d.campaign.remaining_minutes if d else 0
        s = self._seconds % 60
        dh, dm = divmod(dm, 60)
        ch, cm = divmod(cm, 60)
        self._mgr._send({
            "type": "progress",
            "drop_remaining": f"{dh:>2}:{dm:02}:{s:02}",
            "campaign_remaining": f"{ch:>2}:{cm:02}:{s:02}",
        })

    async def _timer_loop(self):
        self._update_time(60)
        while self._seconds > 0:
            await asyncio.sleep(1)
            self._seconds -= 1
            self._update_time()
        self._timer_task = None

    def start_timer(self):
        if self._timer_task is None:
            if self._drop is None or self._drop.remaining_minutes <= 0:
                self._update_time(60)
            else:
                self._timer_task = asyncio.create_task(self._timer_loop())

    def stop_timer(self):
        if self._timer_task is not None:
            self._timer_task.cancel()
            self._timer_task = None

    def minute_almost_done(self) -> bool:
        return self._timer_task is None or self._seconds <= 10

    def display(self, drop: TimedDrop | None, *, countdown: bool = True, subone: bool = False):
        self._drop = drop
        self.stop_timer()
        if drop is None:
            self._mgr._send({"type": "drop", "active": False})
            return
        c = drop.campaign
        self._mgr._send({
            "type": "drop", "active": True,
            "drop_name": drop.name, "rewards": drop.rewards_text(),
            "drop_progress": drop.progress,
            "drop_pct": f"{drop.progress:.1%}",
            "campaign_name": c.name, "game_name": c.game.name,
            "campaign_progress": c.progress,
            "campaign_pct": f"{c.progress:.1%} ({c.claimed_drops}/{c.total_drops})",
            "drop_rem": f"{drop.remaining_minutes} min",
            "camp_rem": f"{c.remaining_minutes} min",
        })
        if countdown:
            self.start_timer()
        elif subone:
            self._update_time(0)
        else:
            self._update_time(60)


class WebChannelList:
    def __init__(self, mgr: WebGUIManager):
        self._mgr = mgr
        self._channels: dict[str, dict] = {}
        self._watching_id: str | None = None

    def _broadcast(self):
        self._mgr._send({"type": "channels", "channels": list(self._channels.values())})

    def display(self, channel, *, add: bool = False):
        iid = channel.iid
        if not add and iid not in self._channels:
            return
        status = "Online" if channel.online else ("Pending" if channel.pending_online else "Offline")
        self._channels[str(channel.id)] = {
            "id": str(channel.id), "name": channel.name, "status": status,
            "game": str(channel.game or ""), "drops": channel.drops_enabled,
            "viewers": channel.viewers or 0, "acl": channel.acl_based,
            "watching": str(channel.id) == self._watching_id,
        }
        self._broadcast()

    def remove(self, channel):
        self._channels.pop(str(channel.id), None)
        self._broadcast()

    def clear(self):
        self._channels.clear()
        self._broadcast()

    def set_watching(self, channel):
        self._watching_id = str(channel.id)
        for ch in self._channels.values():
            ch["watching"] = ch["id"] == self._watching_id
        self._broadcast()

    def clear_watching(self):
        self._watching_id = None
        for ch in self._channels.values():
            ch["watching"] = False
        self._broadcast()

    def get_selection(self):
        return None

    def clear_selection(self):
        pass


class WebTrayIcon:
    def __init__(self, mgr: WebGUIManager):
        self._mgr = mgr
        self.state: str = "pickaxe"

    def change_icon(self, state: str):
        self.state = state
        self._mgr._send({"type": "tray", "state": state})

    def update_title(self, drop):
        pass

    def notify(self, message: str, title: str | None = None, duration: float = 10):
        self._mgr._send({"type": "notification", "message": message, "title": title or "Twitch Drops Miner"})

    def minimize(self):
        pass

    def restore(self):
        pass

    def stop(self):
        pass


class WebInventoryOverview:
    def __init__(self, mgr: WebGUIManager):
        self._mgr = mgr
        self._campaigns: dict[str, dict] = {}

    def _broadcast(self):
        self._mgr._send({"type": "inventory", "campaigns": list(self._campaigns.values())})

    def clear(self):
        self._campaigns.clear()

    async def add_campaign(self, campaign: DropsCampaign):
        drops = [{
            "id": d.id, "name": d.name, "rewards": d.rewards_text(),
            "progress": d.progress, "cur": d.current_minutes,
            "req": d.required_minutes, "claimed": d.is_claimed, "can_claim": d.can_claim,
        } for d in campaign.drops]
        status = "active" if campaign.active else ("upcoming" if campaign.upcoming else "expired")
        self._campaigns[campaign.id] = {
            "id": campaign.id, "name": campaign.name, "game": campaign.game.name,
            "status": status, "eligible": campaign.eligible,
            "claimed": campaign.claimed_drops, "total": campaign.total_drops,
            "progress": campaign.progress,
            "starts": campaign.starts_at.isoformat() if campaign.starts_at else "",
            "ends": campaign.ends_at.isoformat() if campaign.ends_at else "",
            "drops": drops,
        }
        self._broadcast()

    def update_drop(self, drop: TimedDrop):
        c = drop.campaign
        if c.id in self._campaigns:
            for d in self._campaigns[c.id]["drops"]:
                if d["id"] == drop.id:
                    d["progress"] = drop.progress
                    d["cur"] = drop.current_minutes
                    d["claimed"] = drop.is_claimed
                    d["can_claim"] = drop.can_claim
            self._broadcast()


def _make_api_key_middleware():
    """Middleware that checks X-API-Key header on /api/* routes."""
    @web.middleware
    async def middleware(request, handler):
        path = request.path
        # Only protect /api/* routes
        if path.startswith("/api/"):
            settings = request.app.get("settings")
            api_key = settings.api_key if settings else ""
            if api_key:
                provided = request.headers.get("X-API-Key", "")
                if provided != api_key:
                    return web.json_response({"error": "Unauthorized"}, status=401)
        return await handler(request)
    return middleware


def _make_rate_limit_middleware():
    """Rate limiter: 30 requests per minute per IP."""
    hits: dict[str, list[float]] = defaultdict(list)

    @web.middleware
    async def middleware(request, handler):
        # Only limit /api/* routes
        if request.path.startswith("/api/"):
            ip = request.remote or "unknown"
            now = time.time()
            window = 60.0
            max_reqs = 30

            # Purge old entries
            hits[ip] = [t for t in hits[ip] if now - t < window]

            if len(hits[ip]) >= max_reqs:
                return web.json_response(
                    {"error": "Rate limit exceeded"},
                    status=429,
                    headers={"Retry-After": str(int(window))},
                )

            hits[ip].append(now)

        return await handler(request)
    return middleware


class _DummyHelp:
    """Tynkä yhteensopivuudelle upstreamin gui.help.-viittauksille"""
    class _DummyButton:
        def config(self, **kwargs):
            pass
    _invalidate_button = _DummyButton()


class WebGUIManager:
    def __init__(self, twitch: Twitch, port: int = 1337):
        self._twitch = twitch
        self._port = port
        self._server_task: asyncio.Task | None = None
        self._close_requested = asyncio.Event()
        self._ws_clients: set[web.WebSocketResponse] = set()
        self._app = web.Application(middlewares=[_make_api_key_middleware(), _make_rate_limit_middleware()])
        self._app["settings"] = self._twitch.settings
        self._server_ready = asyncio.Event()
        self._start_time = datetime.now()
        self._setup_routes()
        self.status = WebStatusBar(self)
        self.websockets = WebWebsocketStatus(self)
        self.login = WebLoginForm(self)
        self.progress = WebCampaignProgress(self)
        self.channels = WebChannelList(self)
        self.tray = WebTrayIcon(self)
        self.inv = WebInventoryOverview(self)
        self.output = self
        self.help = _DummyHelp()
        self._game_names: set[str] = set()
        self._games: dict[str, dict] = {}
        # Log history: persist last 500 lines, send on WS init so they survive page refresh
        self._log_history: list[str] = []

    # --- Properties required by Twitch ---
    @property
    def close_requested(self) -> bool:
        return self._close_requested.is_set()

    @property
    def running(self) -> bool:
        return self._server_task is not None

    # --- Lifecycle ---
    def start(self):
        if self._server_task is None:
            self._server_task = asyncio.create_task(self._run_server())

    def stop(self):
        self.progress.stop_timer()
        if self._server_task is not None:
            self._server_task.cancel()
            self._server_task = None

    async def wait_until_closed(self):
        await self._close_requested.wait()

    async def coro_unless_closed(self, coro):
        tasks = [asyncio.ensure_future(coro), asyncio.ensure_future(self._close_requested.wait())]
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        for t in pending:
            t.cancel()
        if self._close_requested.is_set():
            from exceptions import ExitRequest
            raise ExitRequest()
        return await next(iter(done))

    def prevent_close(self):
        self._close_requested.clear()

    def close(self, *args):
        self._close_requested.set()
        self._twitch.close()

    def close_window(self):
        pass

    def save(self, *, force: bool = False):
        pass

    def grab_attention(self, *, sound: bool = True):
        pass

    def set_games(self, games: set) -> None:
        for g in games:
            self._game_names.add(g.name)
            self._games[g.name] = {"id": g.id, "name": g.name}
        # Broadcast updated games to all connected clients
        self._send({"type": "games_update", "games": self._games})

    def display_drop(self, drop: TimedDrop, *, countdown: bool = True, subone: bool = False):
        self.progress.display(drop, countdown=countdown, subone=subone)

    def clear_drop(self):
        self.progress.display(None)

    def print(self, message: str):
        stamp = datetime.now().strftime("%H:%M:%S")
        formatted = f"{stamp}: {message}"
        self._log_history.append(formatted)
        if len(self._log_history) > 500:
            self._log_history = self._log_history[-500:]
        self._send({"type": "log", "message": formatted})

    def unfocus(self, event=None):
        pass

    # --- Server ---
    def _setup_routes(self):
        r = self._app.router
        r.add_get("/", self._index)
        r.add_get("/favicon.ico", self._favicon)
        r.add_get("/ws", self._websocket)
        r.add_get("/api/status", self._api_status)
        r.add_get("/api/settings", self._api_get_settings)
        r.add_post("/api/settings", self._api_set_settings)
        r.add_post("/api/login", self._api_login)
        r.add_post("/api/code", self._api_code)
        r.add_post("/api/logout", self._api_logout)
        r.add_get("/api/logout", self._api_logout)
        r.add_post("/api/restart", self._api_restart)
        r.add_post("/api/action/{action}", self._api_action)
        # Serve React build - check both local and parent directory
        base = os.path.dirname(os.path.abspath(__file__))
        self._static_dir = None
        for candidate in [os.path.join(base, "web_static"), os.path.join(base, "..", "web_static")]:
            if os.path.exists(os.path.join(candidate, "index.html")):
                self._static_dir = os.path.normpath(candidate)
                # Serve all static files via custom handler with no-cache headers
                # (using add_static would let browsers cache assets indefinitely)
                r.add_get("/{filename:.*}", self._static)
                print(f"[SERVER] Serving React build from {self._static_dir} (no-cache)", flush=True)
                break

    async def _run_server(self):
        runner = web.AppRunner(self._app)
        await runner.setup()
        site = web.TCPSite(runner, "127.0.0.1", self._port)
        await site.start()
        self._server_ready.set()
        print(f"[SERVER] Web UI running at http://localhost:{self._port}", flush=True)
        try:
            while not self._close_requested.is_set():
                await asyncio.sleep(1)
        finally:
            await runner.cleanup()

    def _send(self, data: dict):
        msg = _json(data)
        dead = []
        for ws in list(self._ws_clients):
            try:
                if ws.closed:
                    dead.append(ws)
                    continue
                asyncio.ensure_future(self._safe_send(ws, msg))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._ws_clients.discard(ws)

    async def _safe_send(self, ws: web.WebSocketResponse, msg: str):
        try:
            await ws.send_str(msg)
        except (ConnectionResetError, ConnectionError, RuntimeError):
            self._ws_clients.discard(ws)
        except Exception:
            self._ws_clients.discard(ws)

    # --- HTTP Handlers ---
    async def _index(self, request):
        """Serve index.html with cache-busted asset URLs and no ETag/Last-Modified.
        The ?v=<build_mtime> query parameter forces browsers to skip their cache
        even if they ignored Cache-Control headers."""
        if self._static_dir:
            index_path = os.path.join(self._static_dir, "index.html")
            if os.path.exists(index_path):
                build_time = int(os.path.getmtime(self._static_dir))
                with open(index_path, "r", encoding="utf-8") as f:
                    content = f.read()
                # Add ?v=<build_mtime> to all JS and CSS asset URLs
                content = re.sub(
                    r'(src="/assets/[^"]+\.(?:js|css))"',
                    rf'\1?v={build_time}"',
                    content,
                )
                content = re.sub(
                    r'(href="/assets/[^"]+\.(?:js|css))"',
                    rf'\1?v={build_time}"',
                    content,
                )
                return web.Response(
                    text=content,
                    content_type="text/html",
                    headers={
                        "Cache-Control": "no-cache, no-store, must-revalidate",
                        "Pragma": "no-cache",
                        "Expires": "0",
                    },
                )
        return web.Response(text="<h1>Build not found</h1><p>Run 'npm run build' in frontend/</p>", content_type="text/html")

    async def _favicon(self, request):
        if self._static_dir:
            ico_path = os.path.join(self._static_dir, "favicon.ico")
            if os.path.exists(ico_path):
                return web.FileResponse(ico_path, headers={"Cache-Control": "no-cache"})
        return web.Response(status=404)

    async def _static(self, request):
        """Serve all static files (assets, PWA files, etc.) with no-cache headers.
        Prevents browsers from caching JS/CSS between builds."""
        if self._static_dir:
            filename = request.match_info.get("filename", "")
            if not filename:
                return web.Response(status=404)
            filepath = os.path.normpath(os.path.join(self._static_dir, filename))
            if not filepath.startswith(self._static_dir):
                return web.Response(status=404)
            if os.path.exists(filepath) and os.path.isfile(filepath):
                return web.FileResponse(filepath, headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0"
                })
        return web.Response(status=404)

    async def _websocket(self, request):
        ws = web.WebSocketResponse(heartbeat=30)
        await ws.prepare(request)
        self._ws_clients.add(ws)
        self.print(f"Web client connected ({len(self._ws_clients)} total)")
        try:
            init = {
                "type": "init",
                "status": self.status.text,
                "channels": list(self.channels._channels.values()),
                "tray": self.tray.state,
                "campaigns": list(self.inv._campaigns.values()),
                "games": self._games,
                "ws_status": self.websockets._items,
                "uptime": f"{int((datetime.now() - self._start_time).total_seconds()) // 3600}:{int((datetime.now() - self._start_time).total_seconds()) % 3600 // 60:02d}:{int((datetime.now() - self._start_time).total_seconds()) % 60:02d}",
                "login_status": self.login.status,
                "login_user_id": self.login.user_id,
                "drop": self.progress.get_init_drop(),
                "api_key": self._twitch.settings.api_key,
            }
            if self.login.waiting_for == "code" and self.login.pending_code:
                init["login_action"] = "enter_code"
                init["login_code"] = self.login.pending_code
                init["login_url"] = self.login.pending_url
            elif self.login.waiting_for == "login":
                init["login_action"] = "request_login"
            init["logs"] = self._log_history[-100:]  # lähetä viimeiset 100 logia uudelle clientille
            await ws.send_str(_json(init))
            async for msg in ws:
                if msg.type == web.WSMsgType.TEXT:
                    try:
                        await self._on_ws(json.loads(msg.data))
                    except Exception as e:
                        logger.error(f"WS error: {e}")
                elif msg.type in (web.WSMsgType.ERROR, web.WSMsgType.CLOSE):
                    break
        finally:
            self._ws_clients.discard(ws)
            self.print(f"Web client disconnected ({len(self._ws_clients)} remaining)")
        return ws

    async def _on_ws(self, data: dict):
        a = data.get("action", "")
        if a == "login_submit":
            self.print("Login credentials submitted via web UI")
            self.login.submit_login(data.get("username", ""), data.get("password", ""), data.get("token", ""))
        elif a == "code_confirm":
            self.print("Activation code confirmed via web UI")
            self.login.confirm_code()
        elif a == "reload":
            self.print("Inventory reload requested via web UI")
            self._twitch.change_state(State.INVENTORY_FETCH)
        elif a == "switch":
            self.print("Channel switch requested via web UI")
            self._twitch.change_state(State.CHANNEL_SWITCH)
        elif a == "restart":
            self.print("Server restart requested via web UI")
            python = sys.executable
            args_list = [python] + sys.argv
            self._send({"type": "toast", "message": "Restarting server...", "style": "warning"})
            asyncio.ensure_future(self._do_restart(python, args_list))
        elif a == "save_settings":
            self.print("Settings saved via web UI")
            self._apply_settings(data)
        elif a == "logout":
            self.print("Logout requested via web UI")
            self._twitch._auth_state.clear()
            self.login.update("Logged out", None)
            from constants import COOKIES_PATH
            if COOKIES_PATH.exists():
                COOKIES_PATH.unlink()
            self._send({"type": "login", "status": "Logged out", "user_id": None})
            self._send({"type": "toast", "message": "Logged out", "style": "success"})
            self._twitch.change_state(State.INVENTORY_FETCH)

    def _apply_settings(self, data: dict):
        s = self._twitch.settings
        from constants import PriorityMode
        from yarl import URL
        mapping = {
            "proxy": lambda v: URL(v) if v else URL(),
            "language": lambda v: v,
            "dark_mode": lambda v: bool(v),
            "tray_notifications": lambda v: bool(v),
            "enable_badges_emotes": lambda v: bool(v),
            "available_drops_check": lambda v: bool(v),
            "connection_quality": lambda v: max(1, min(6, int(v))),
            "api_key": lambda v: str(v),
        }
        for key, conv in mapping.items():
            if key in data:
                try:
                    setattr(s, key, conv(data[key]))
                except Exception:
                    pass
        if "priority_mode" in data:
            try:
                s.priority_mode = PriorityMode(int(data["priority_mode"]))
            except (ValueError, KeyError):
                pass
        if "priority" in data:
            s.priority = list(data["priority"])
        if "exclude" in data:
            s.exclude = set(data["exclude"])
        s.save(force=True)
        self._send({"type": "settings_saved"})
        self._send({"type": "toast", "message": "Settings saved", "style": "success"})
        # Also update the games set in case it changed
        self._send({"type": "games_update", "games": self._games})

    # --- REST API ---
    async def _api_status(self, request):
        return web.json_response({
            "status": self.status.text,
            "tray": self.tray.state,
            "uptime": f"{int((datetime.now() - self._start_time).total_seconds()) // 3600}:{int((datetime.now() - self._start_time).total_seconds()) % 3600 // 60:02d}:{int((datetime.now() - self._start_time).total_seconds()) % 60:02d}",
            "channels": len(self.channels._channels),
            "campaigns": len(self.inv._campaigns),
            "ws_clients": len(self._ws_clients),
        })

    async def _api_get_settings(self, request):
        s = self._twitch.settings
        return web.json_response({
            "proxy": str(s.proxy), "language": s.language,
            "dark_mode": s.dark_mode, "tray_notifications": s.tray_notifications,
            "enable_badges_emotes": s.enable_badges_emotes,
            "available_drops_check": s.available_drops_check,
            "connection_quality": s.connection_quality,
            "priority_mode": s.priority_mode.value,
            "priority": s.priority, "exclude": sorted(s.exclude),
            "games": self._games,
            "api_key": s.api_key,
        })

    async def _api_set_settings(self, request):
        data = await request.json()
        self._apply_settings(data)
        return web.json_response({"ok": True})

    async def _api_login(self, request):
        data = await request.json()
        self.login.submit_login(data.get("username", ""), data.get("password", ""), data.get("token", ""))
        return web.json_response({"ok": True})

    async def _api_code(self, request):
        self.login.confirm_code()
        return web.json_response({"ok": True})

    async def _api_logout(self, request):
        self.print("Logout requested via API - restarting server")
        try:
            self._twitch._auth_state.clear()
        except Exception:
            pass
        self.login.update("Logged out", None)
        self.login._login_event.set()
        self.login._code_event.set()
        self.login.waiting_for = None
        from constants import COOKIES_PATH
        if COOKIES_PATH.exists():
            COOKIES_PATH.unlink()
        self._send({"type": "login", "status": "Logged out", "user_id": None})
        # Send toast and restart to clear all state
        self._send({"type": "toast", "message": "Logged out - restarting server...", "style": "warning"})
        # Give time for response to be sent, then restart process
        asyncio.ensure_future(self._do_logout_restart())
        return web.json_response({"ok": True})

    async def _do_logout_restart(self):
        await asyncio.sleep(0.5)
        python = sys.executable
        args_list = [python] + sys.argv
        os.execv(python, args_list)

    async def _api_restart(self, request):
        self._send({"type": "toast", "message": "Restarting server...", "style": "warning"})
        await asyncio.sleep(0.5)
        python = sys.executable
        args_list = [python] + sys.argv
        self._send({"type": "log", "message": f"{datetime.now().strftime('%H:%M:%S')}: [SERVER] Restarting process..."})
        await asyncio.sleep(0.3)
        os.execv(python, args_list)
        return web.json_response({"ok": True})

    async def _do_restart(self, python, args_list):
        await asyncio.sleep(1)
        os.execv(python, args_list)

    async def _api_action(self, request):
        action = request.match_info["action"]
        if action == "reload":
            self._twitch.change_state(State.INVENTORY_FETCH)
        elif action == "switch":
            self._twitch.change_state(State.CHANNEL_SWITCH)
        return web.json_response({"ok": True})
