from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class FileInfo(BaseModel):
    path: str
    size_bytes: int
    updated_at: str


class FileReadResponse(BaseModel):
    path: str
    content: str


class FileWriteRequest(BaseModel):
    content: str
    reason: str = "save"
    actor: str = "user"


class FileWriteResponse(BaseModel):
    path: str
    snapshot_id: str


class FileNewRequest(BaseModel):
    path: str
    template: str | None = None


class SnapshotInfo(BaseModel):
    id: str
    path: str
    created_at: str
    reason: str
    actor: str
    size_bytes: int


class SnapshotListResponse(BaseModel):
    path: str
    snapshots: list[SnapshotInfo]


class SnapshotRevertRequest(BaseModel):
    path: str
    snapshot_id: str


class SnapshotRevertResponse(BaseModel):
    path: str
    snapshot_id: str


PlatformId = Literal["wechat", "zhihu", "xiaohongshu"]


class ExportRequest(BaseModel):
    platform: PlatformId
    content: str
    title: str | None = None


class ExportResponse(BaseModel):
    platform: PlatformId
    html: str
    warnings: list[str] = Field(default_factory=list)


class AgentSelection(BaseModel):
    from_: int = Field(alias="from", ge=0)
    to: int = Field(ge=0)


class AgentEditRequest(BaseModel):
    path: str
    content: str
    selection: AgentSelection
    instruction: str = Field(min_length=1, max_length=500)


class AgentWsMessage(BaseModel):
    type: Literal["edit"]
    request: AgentEditRequest


class StoryMapNode(BaseModel):
    title: str
    detail: str
    depth: int = Field(ge=1, le=6)


class StoryMapRequest(BaseModel):
    content: str
    lang: Literal["en", "zh"] = "zh"


class StoryMapResponse(BaseModel):
    nodes: list[StoryMapNode] = Field(default_factory=list)
