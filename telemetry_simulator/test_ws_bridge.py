import os
import unittest
from unittest import mock

import ws_bridge


class WsBridgeTests(unittest.TestCase):
    def test_build_wokwi_command_uses_non_expiring_timeout(self):
        self.assertEqual(
            ws_bridge.build_wokwi_command(),
            ["wokwi-cli", ".", "--timeout", "0"],
        )

    def test_normalize_line_strips_whitespace(self):
        self.assertEqual(ws_bridge.normalize_line("  1,2,3\n"), "1,2,3")

    def test_build_wokwi_env_uses_wokwi_cli_token(self):
        with mock.patch.dict(os.environ, {"WOKWI_CLI_TOKEN": "token-123"}, clear=True):
            env = ws_bridge.build_wokwi_env()

        self.assertEqual(env["WOKWI_CLI_TOKEN"], "token-123")

    def test_build_wokwi_env_falls_back_to_generic_token(self):
        with mock.patch.dict(os.environ, {"WOKWI_TOKEN": "token-456"}, clear=True):
            env = ws_bridge.build_wokwi_env()

        self.assertEqual(env["WOKWI_CLI_TOKEN"], "token-456")


if __name__ == "__main__":
    unittest.main()
