
# hardware/gamepad_driver.py

import json
import logging
import socket

logger = logging.getLogger(__name__)

class GamepadDriver:
    def __init__(self):
        self.sock = None
        self.connected = False

    def connect(self):
        try:
            logger.info(f"Connecting to Gamepad Driver at localhost:8080")
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.connect(('localhost', 8080))
            self.connected = True
            logger.info("Gamepad Driver connected.")
        except Exception as e:
            logger.error(f"[Gamepad Driver] Connection failed: {e}")
            self.connected = False

    def send(self, force_command):
        if not self.connected or self.sock is None:
            logger.warning("Gamepad Driver not connected, skipping send.")
            return

        try:
            payload = {
                "command": "forces",
                "forces": force_command
            }
            self.sock.send(json.dumps(payload).encode())
        except Exception as e:
            logger.error(f"[Gamepad Driver] Failed to send command: {e}")
            self.shutdown()

    def receive(self):
        """Optional method to handle incoming messages if needed."""
        try:
            msg = self.sock.recv()
            if msg:
                data = json.loads(msg)
                print(data)
        except Exception as e:
            logger.warning(f"[Gamepad Driver] Receive error: {e}")

    def shutdown(self):
        if self.sock:
            try:
                self.sock.close()
            except Exception as e:
                logger.warning(f"[Gamepad Driver] Shutdown error: {e}")
            self.sock = None
        self.connected = False
