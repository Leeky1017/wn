from __future__ import annotations

import json
from typing import Annotated

from fastapi import Body, FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import ALLOWED_ORIGINS
from .formatting.render import list_platforms, render_platform_html
from .schemas import (
    AgentWsMessage,
    ExportRequest,
    ExportResponse,
    FileInfo,
    FileNewRequest,
    FileReadResponse,
    FileWriteRequest,
    FileWriteResponse,
    SnapshotListResponse,
    SnapshotRevertRequest,
    SnapshotRevertResponse,
    StoryMapRequest,
    StoryMapResponse,
)
from .storage import create_file, init_storage, list_files, list_snapshots, read_file, revert_to_snapshot, write_file
from .agent.engine import edit_stream
from .story_map import generate_story_map


app = FastAPI(title="WriteNow Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_storage()


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


@app.get("/api/platforms")
def platforms() -> list[dict]:
    return list_platforms()


@app.get("/api/files", response_model=list[FileInfo])
def api_files() -> list[FileInfo]:
    return [FileInfo(**f.__dict__) for f in list_files()]


@app.get("/api/file", response_model=FileReadResponse)
def api_read_file(path: Annotated[str, Query(min_length=1)]) -> FileReadResponse:
    try:
        content = read_file(path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return FileReadResponse(path=path, content=content)


@app.put("/api/file", response_model=FileWriteResponse)
def api_write_file(
    path: Annotated[str, Query(min_length=1)],
    payload: Annotated[FileWriteRequest, Body()],
) -> FileWriteResponse:
    try:
        snapshot_id = write_file(path=path, content=payload.content, reason=payload.reason, actor=payload.actor)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return FileWriteResponse(path=path, snapshot_id=snapshot_id)


@app.post("/api/file/new")
def api_new_file(payload: FileNewRequest) -> dict:
    try:
        create_file(path=payload.path, template=payload.template)
    except FileExistsError:
        raise HTTPException(status_code=409, detail="File exists")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True}


@app.get("/api/snapshots", response_model=SnapshotListResponse)
def api_snapshots(path: Annotated[str, Query(min_length=1)]) -> SnapshotListResponse:
    try:
        rows = list_snapshots(path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    snapshots = [
        {
            "id": r["id"],
            "path": r["path"],
            "created_at": r["created_at"],
            "reason": r["reason"],
            "actor": r["actor"],
            "size_bytes": r["size_bytes"],
        }
        for r in rows
    ]
    return SnapshotListResponse(path=path, snapshots=snapshots)


@app.post("/api/snapshots/revert", response_model=SnapshotRevertResponse)
def api_revert(payload: SnapshotRevertRequest) -> SnapshotRevertResponse:
    try:
        new_snapshot_id = revert_to_snapshot(path=payload.path, snapshot_id=payload.snapshot_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return SnapshotRevertResponse(path=payload.path, snapshot_id=new_snapshot_id)


@app.post("/api/export", response_model=ExportResponse)
def api_export(payload: ExportRequest) -> ExportResponse:
    html, warnings = render_platform_html(
        content=payload.content,
        platform=payload.platform,
        title=payload.title,
    )
    return ExportResponse(platform=payload.platform, html=html, warnings=warnings)


@app.post("/api/story-map", response_model=StoryMapResponse)
async def api_story_map(payload: StoryMapRequest) -> StoryMapResponse:
    nodes = await generate_story_map(content=payload.content, lang=payload.lang)
    return StoryMapResponse(nodes=nodes)


@app.websocket("/ws/agent")
async def ws_agent(ws: WebSocket) -> None:
    await ws.accept()
    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = AgentWsMessage.model_validate_json(raw)
            except Exception as e:
                await ws.send_text(json.dumps({"type": "error", "message": f"bad request: {e}"}))
                continue

            req = msg.request
            try:
                async for event in edit_stream(
                    path=req.path,
                    content=req.content,
                    selection_from=req.selection.from_,
                    selection_to=req.selection.to,
                    instruction=req.instruction,
                ):
                    await ws.send_text(json.dumps(event, ensure_ascii=False))
            except Exception as e:
                await ws.send_text(json.dumps({"type": "error", "message": str(e)}, ensure_ascii=False))
    except WebSocketDisconnect:
        return
