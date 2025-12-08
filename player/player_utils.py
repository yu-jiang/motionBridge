# player/player_utils.py

import json
import logging
from pathlib import Path

BRIDGE_API = "ws://localhost:6789/player"

def setup_logging(log_dir: Path, system_log_name="system_log.txt"):
    log_dir.mkdir(exist_ok=True)
    system_log_file = log_dir / system_log_name
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(message)s',
        handlers=[
            logging.FileHandler(system_log_file),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger()