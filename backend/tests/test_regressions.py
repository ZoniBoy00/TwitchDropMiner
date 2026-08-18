from __future__ import annotations

import ast
from pathlib import Path
import unittest


ROOT = Path(__file__).parents[1]


def function_node(path: Path, name: str) -> ast.AsyncFunctionDef | ast.FunctionDef:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, (ast.AsyncFunctionDef, ast.FunctionDef)) and node.name == name:
            return node
    raise AssertionError(f"Function not found: {name}")


class RuntimeRegressionTests(unittest.TestCase):
    def test_validate_uses_scoped_web_login(self) -> None:
        node = function_node(ROOT / "twitch.py", "_validate")
        calls = [
            call.func.attr
            for call in ast.walk(node)
            if isinstance(call, ast.Call)
            and isinstance(call.func, ast.Attribute)
        ]
        self.assertIn("_login", calls)
        self.assertNotIn("_oauth_login", calls)

    def test_offline_watch_requests_channel_switch(self) -> None:
        source = (ROOT / "twitch.py").read_text(encoding="utf-8")
        marker = "if not channel.online:"
        start = source.index(marker)
        block = source[start : source.index("succeeded:", start)]
        self.assertIn("self.stop_watching()", block)
        self.assertIn("self.change_state(State.CHANNEL_SWITCH)", block)

    def test_channel_switch_waits_after_clearing_state_event(self) -> None:
        node = function_node(ROOT / "twitch.py", "_run")
        channel_switch_blocks = []
        for candidate in ast.walk(node):
            if not isinstance(candidate, ast.If):
                continue
            text = ast.unparse(candidate.test)
            if "State.CHANNEL_SWITCH" in text:
                channel_switch_blocks.append(candidate)
        self.assertTrue(channel_switch_blocks)
        block_text = " ".join(ast.unparse(block) for block in channel_switch_blocks)
        self.assertIn("self._state_change.clear()", block_text)
        self.assertIn("await self._state_change.wait()", block_text)

    def test_estimated_progress_triggers_inventory_refresh(self) -> None:
        source = (ROOT / "inventory.py").read_text(encoding="utf-8")
        marker = "def bump_minutes"
        start = source.index(marker)
        block = source[start:]
        self.assertIn("maximum estimated minutes", block)
        self.assertIn("State.INVENTORY_FETCH", block)
        self.assertNotIn("State.CHANNEL_SWITCH", block)


if __name__ == "__main__":
    unittest.main()
