from __future__ import annotations

import datetime as _dt
import sqlite3
import uuid
from dataclasses import dataclass
from pathlib import Path

from .config import DB_PATH, SNAPSHOT_DIR, WORKSPACE_DIR


def _utc_now_iso() -> str:
    return _dt.datetime.now(tz=_dt.timezone.utc).isoformat()


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_storage() -> None:
    WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS snapshots (
              id TEXT PRIMARY KEY,
              path TEXT NOT NULL,
              created_at TEXT NOT NULL,
              reason TEXT NOT NULL,
              actor TEXT NOT NULL,
              size_bytes INTEGER NOT NULL,
              content_path TEXT NOT NULL
            );
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS snapshots_path_created_at ON snapshots(path, created_at DESC);"
        )

    if not any(WORKSPACE_DIR.rglob("*.md")):
        seed = WORKSPACE_DIR / "welcome.md"
        seed.write_text(
            "# WriteNow\n\n"
            "这是一个 **AI 驱动的文字创作 IDE** MVP。\n\n"
            "## 快速体验\n\n"
            "1. 选中一段文字，按 `Ctrl/Cmd + K` 打开命令面板。\n"
            "2. 输入指令：例如“改得更口语化 / 扩写到 200 字 / 调整逻辑顺序”。\n"
            "3. 预览 diff，确认后点击应用。\n\n"
            "## 排版导出\n\n"
            "右上角选择平台模式：公众号 / 知乎 / 小红书，实时预览导出 HTML。\n",
            encoding="utf-8",
        )
        create_snapshot(path="welcome.md", content=seed.read_text(encoding="utf-8"), reason="seed", actor="system")


def _safe_rel_md_path(path: str) -> Path:
    rel = Path(path.replace("\\", "/"))
    if rel.is_absolute() or ".." in rel.parts:
        raise ValueError("Invalid path")
    if rel.suffix.lower() != ".md":
        raise ValueError("Only .md files are allowed")
    full = (WORKSPACE_DIR / rel).resolve()
    if WORKSPACE_DIR != full and WORKSPACE_DIR not in full.parents:
        raise ValueError("Path escapes workspace")
    return full


@dataclass(frozen=True)
class FileStat:
    path: str
    size_bytes: int
    updated_at: str


def list_files() -> list[FileStat]:
    items: list[FileStat] = []
    for file_path in WORKSPACE_DIR.rglob("*.md"):
        if not file_path.is_file():
            continue
        rel = str(file_path.relative_to(WORKSPACE_DIR)).replace("\\", "/")
        stat = file_path.stat()
        updated_at = _dt.datetime.fromtimestamp(stat.st_mtime, tz=_dt.timezone.utc).isoformat()
        items.append(FileStat(path=rel, size_bytes=stat.st_size, updated_at=updated_at))
    items.sort(key=lambda x: x.path.lower())
    return items


def read_file(path: str) -> str:
    full = _safe_rel_md_path(path)
    if not full.exists():
        raise FileNotFoundError(path)
    return full.read_text(encoding="utf-8")


def write_file(*, path: str, content: str, reason: str, actor: str) -> str:
    full = _safe_rel_md_path(path)
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_text(content, encoding="utf-8")
    return create_snapshot(path=path, content=content, reason=reason, actor=actor)


def create_file(*, path: str, template: str | None) -> None:
    full = _safe_rel_md_path(path)
    if full.exists():
        raise FileExistsError(path)
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_text(template or "", encoding="utf-8")
    create_snapshot(path=path, content=template or "", reason="create", actor="user")


def create_snapshot(*, path: str, content: str, reason: str, actor: str) -> str:
    snapshot_id = str(uuid.uuid4())
    content_path = SNAPSHOT_DIR / f"{snapshot_id}.md"
    content_path.write_text(content, encoding="utf-8")
    created_at = _utc_now_iso()
    size_bytes = len(content.encode("utf-8"))
    with _connect() as conn:
        conn.execute(
            "INSERT INTO snapshots(id, path, created_at, reason, actor, size_bytes, content_path) VALUES(?,?,?,?,?,?,?)",
            (snapshot_id, path, created_at, reason, actor, size_bytes, str(content_path)),
        )
    return snapshot_id


def list_snapshots(path: str, limit: int = 200) -> list[sqlite3.Row]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT id, path, created_at, reason, actor, size_bytes FROM snapshots WHERE path = ? ORDER BY created_at DESC LIMIT ?",
            (path, limit),
        ).fetchall()
    return rows


def _snapshot_content(snapshot_id: str) -> str:
    with _connect() as conn:
        row = conn.execute(
            "SELECT content_path FROM snapshots WHERE id = ?",
            (snapshot_id,),
        ).fetchone()
    if row is None:
        raise KeyError(snapshot_id)
    content_path = Path(row["content_path"])
    return content_path.read_text(encoding="utf-8")


def revert_to_snapshot(*, path: str, snapshot_id: str, actor: str = "user") -> str:
    content = _snapshot_content(snapshot_id)
    return write_file(path=path, content=content, reason=f"revert:{snapshot_id}", actor=actor)

