
# hardware/arduino_driver.py

import logging
print("Loading ArduinoDriver...")
import serial
import time

# Update the COM port to match your Arduino Uno
PORT = "COM5"      # or COM3, COM4, etc.
BAUD = 115200

logger = logging.getLogger(__name__)

class ArduinoDriver:
    def __init__(self):
        self.ws = None
        self.connected = False
        self.ser = None

    def connect(self):
        try:
            self.ser = serial.Serial(PORT, BAUD, timeout=1)
            time.sleep(2)  # wait for the serial connection to initialize
            self.connected = True
            logger.info(f"[Arduino] Connected to {PORT} at {BAUD} baud.")
        except Exception as e:
            logger.error(f"[Arduino] Connection failed: {e}")
            self.connected = False

    def send(self, force_command, timestamp=None):
        try:
            a1 = int(90 - ((force_command[0] + 1) * 45))
            a2 = int((force_command[1] + 1) * 45)
            a3 = int(90 - ((force_command[2] + 1) * 45))
            a4 = int((force_command[3] + 1) * 45)
            msg = f"{a1} {a2} {a3} {a4}\n"
            self.ser.write(msg.encode('ascii'))
        except Exception as e:
            logger.error(f"[Arduino] Failed to send command: {e}")

    def receive(self):
        """Optional method to handle incoming messages if needed."""
        pass

    def shutdown(self):
        if self.ser:
            try:
                self.ser.close()
            except Exception as e:
                logger.warning(f"[Arduino] Shutdown error: {e}")
            self.ser = None