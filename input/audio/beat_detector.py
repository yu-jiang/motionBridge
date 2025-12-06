import websocket
import sys
import json
from BeatNet.BeatNet import BeatNet

ws = websocket.create_connection("ws://localhost:6789/input?client=audio", timeout=5)

class StdoutInterceptor:
    def __init__(self, callback):
        self.callback = callback
        self._stdout = sys.stdout

    def write(self, text):
        self.callback(text)
        return self._stdout.write(text)

    def flush(self):
        return self._stdout.flush()

def on_stdout_write(text):
    if text == "beat!":
        ws.send(json.dumps({"beat": True, "downbeat": False}))
    elif text == "*beat!":
        ws.send(json.dumps({"beat": False, "downbeat": True}))

sys.stdout = StdoutInterceptor(on_stdout_write)

estimator = BeatNet(1, mode='stream', inference_model='PF', plot=[], thread=False)

Output = estimator.process()