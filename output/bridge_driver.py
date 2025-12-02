
# hardware/bridge_driver.py

import json
import time
import websocket
import logging

logger = logging.getLogger(__name__)

class BridgeDriver:
    def __init__(self, uri):
        self.uri = uri
        self.ws = None
        self.connected = False

    def connect(self):
        try:
            logger.info(f"Connecting to Bridge at {self.uri}")
            self.ws = websocket.create_connection(self.uri, timeout=5)
            self.connected = True
            logger.info("Bridge connected.")
        except Exception as e:
            logger.error(f"[Bridge] Connection failed: {e}")
            self.connected = False

    def send(self, force_command, timestamp=None):
        if not self.connected or self.ws is None:
            logger.warning("Bridge not connected, skipping send.")
            return

        try:
            payload = {
                "command": "forces",
                "forces": force_command
            }
            if timestamp:
                payload["timestamp_force_generated"] = timestamp
            self.ws.send(json.dumps(payload))
        except Exception as e:
            logger.error(f"[Bridge] Failed to send command: {e}")
            self.shutdown()

    def receive(self):
        """Optional method to handle incoming messages if needed."""
        try:
            msg = self.ws.recv()
            if msg:
                data = json.loads(msg)
                print(f"[Bridge] Received message: {data}")
        except Exception as e:
            logger.warning(f"[Bridge] Receive error: {e}")

    def shutdown(self):
        if self.ws:
            try:
                self.ws.close()
            except Exception as e:
                logger.warning(f"[Bridge] Shutdown error: {e}")
            self.ws = None
        self.connected = False
