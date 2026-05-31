from __future__ import annotations

import sys
import signal
import asyncio
import logging
import argparse
import warnings
import traceback

if sys.version_info < (3, 10):
    raise RuntimeError("Python 3.10 or higher is required")

import truststore
truststore.inject_into_ssl()


class ParsedArgs(argparse.Namespace):
    _verbose: int
    _debug_ws: bool
    _debug_gql: bool
    log: bool
    port: int

    @property
    def logging_level(self) -> int:
        return LOGGING_LEVELS[min(self._verbose, 4)]

    @property
    def debug_ws(self) -> int:
        if self._debug_ws:
            return logging.DEBUG
        elif self._verbose >= 4:
            return logging.INFO
        return logging.NOTSET

    @property
    def debug_gql(self) -> int:
        if self._debug_gql:
            return logging.DEBUG
        elif self._verbose >= 4:
            return logging.INFO
        return logging.NOTSET


def create_settings(args: ParsedArgs):
    from settings import SettingsFile, SETTINGS_PATH, DEFAULT_LANG
    from utils import json_load
    from constants import PriorityMode
    from yarl import URL

    class WebSettings:
        def __init__(self):
            self._settings: SettingsFile = json_load(SETTINGS_PATH, {
                "proxy": URL(), "priority": [], "exclude": set(),
                "dark_mode": False, "autostart_tray": False, "connection_quality": 1,
                "language": DEFAULT_LANG, "tray_notifications": True,
                "enable_badges_emotes": False, "available_drops_check": False,
                "priority_mode": PriorityMode.PRIORITY_ONLY,
                "api_key": "",
            })
            self._altered = False
            self.log = args.log
            self.dump = False
            self.tray = False
            self.debug_ws = args.debug_ws
            self.debug_gql = args.debug_gql
            self.logging_level = args.logging_level

        def __getattr__(self, name):
            if name.startswith("_") or name in ("log", "dump", "tray", "debug_ws", "debug_gql", "logging_level"):
                return object.__getattribute__(self, name)
            if name in self._settings:
                return self._settings[name]
            raise AttributeError(name)

        def __setattr__(self, name, value):
            if name.startswith("_") or name in ("log", "dump", "tray", "debug_ws", "debug_gql", "logging_level"):
                object.__setattr__(self, name, value)
                return
            if name in self._settings:
                self._settings[name] = value
                self._altered = True
                return
            raise AttributeError(name)

        def alter(self):
            self._altered = True

        def save(self, *, force=False):
            from utils import json_save
            if self._altered or force:
                json_save(SETTINGS_PATH, self._settings, sort=True)

    return WebSettings()


FORMATTER = logging.Formatter("{levelname}: {message}", style="{", datefmt="%H:%M:%S")


async def async_main(args: ParsedArgs):
    from translate import _
    from twitch import Twitch
    from web_gui import WebGUIManager
    from constants import FILE_FORMATTER, LOG_PATH

    settings = create_settings(args)
    try:
        _.set_language(settings.language)
    except ValueError:
        pass

    root = logging.getLogger()
    root.setLevel(settings.logging_level)
    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(FORMATTER)
    root.addHandler(sh)

    log = logging.getLogger("TwitchDrops")
    log.setLevel(settings.logging_level)
    if settings.log:
        fh = logging.FileHandler(LOG_PATH)
        fh.setFormatter(FILE_FORMATTER)
        log.addHandler(fh)
    logging.getLogger("TwitchDrops.gql").setLevel(settings.debug_gql)
    logging.getLogger("TwitchDrops.websocket").setLevel(settings.debug_ws)

    print(f"[SERVER] Starting Twitch Drops Miner on port {args.port}", flush=True)

    client = Twitch(settings, web_mode=True)
    client.gui = WebGUIManager(client, port=args.port)

    loop = asyncio.get_running_loop()
    if sys.platform == "linux":
        loop.add_signal_handler(signal.SIGINT, lambda *_: client.gui.close())
        loop.add_signal_handler(signal.SIGTERM, lambda *_: client.gui.close())

    exit_status = 0
    try:
        await client.run()
    except KeyboardInterrupt:
        pass
    except Exception:
        exit_status = 1
        client.prevent_close()
        client.print("Fatal error encountered:\n")
        client.print(traceback.format_exc())
    finally:
        if sys.platform == "linux":
            loop.remove_signal_handler(signal.SIGINT)
            loop.remove_signal_handler(signal.SIGTERM)
        client.print(_("gui", "status", "exiting"))
        await client.shutdown()

    client.save(force=True)
    sys.exit(exit_status)


if __name__ == "__main__":
    from version import __version__
    from constants import LOGGING_LEVELS, SELF_PATH

    parser = argparse.ArgumentParser(SELF_PATH.name, description="Twitch Drops Miner - Web Server")
    parser.add_argument("--version", action="version", version=f"v{__version__}")
    parser.add_argument("-v", dest="_verbose", action="count", default=0)
    parser.add_argument("--port", type=int, default=1337, help="Web server port (default: 1337)")
    parser.add_argument("--log", action="store_true")
    parser.add_argument("--debug-ws", dest="_debug_ws", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument("--debug-gql", dest="_debug_gql", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args(namespace=ParsedArgs())

    warnings.simplefilter("default", ResourceWarning)
    try:
        asyncio.run(async_main(args))
    except KeyboardInterrupt:
        print("\nShutting down.", flush=True)
