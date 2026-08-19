"""
Luno Store — Simple Logger
Prints timestamped messages to console and optionally to a log file.
"""
import os
from datetime import datetime

LOG_DIR = "./storage/logs"
LOG_FILE = None


def _ensure_log_dir():
    global LOG_FILE
    os.makedirs(LOG_DIR, exist_ok=True)
    if LOG_FILE is None:
        date_str = datetime.now().strftime("%Y-%m-%d")
        LOG_FILE = os.path.join(LOG_DIR, f"shipping_{date_str}.log")


def log(message: str):
    """Print a timestamped log message to console and file."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    formatted = f"[{timestamp}] {message}"
    print(formatted)

    try:
        _ensure_log_dir()
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(formatted + "\n")
    except Exception:
        pass  # Don't fail on logging errors
