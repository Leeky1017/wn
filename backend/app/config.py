from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()


REPO_ROOT = Path(__file__).resolve().parents[2]

DATA_DIR = Path(os.getenv("WN_DATA_DIR", str(REPO_ROOT / "data")))
WORKSPACE_DIR = Path(os.getenv("WN_WORKSPACE_DIR", str(DATA_DIR / "workspace")))
SNAPSHOT_DIR = Path(os.getenv("WN_SNAPSHOT_DIR", str(DATA_DIR / "snapshots")))
DB_PATH = Path(os.getenv("WN_DB_PATH", str(DATA_DIR / "writenow.sqlite3")))

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "WN_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,null",
    ).split(",")
    if origin.strip()
]

OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

AGENT_MAX_SELECTION_CHARS = int(os.getenv("WN_AGENT_MAX_SELECTION_CHARS", "8000"))
