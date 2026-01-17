from __future__ import annotations

from collections.abc import AsyncIterator

from ..config import AGENT_MAX_SELECTION_CHARS
from ..diffing import unified_diff
from .providers import provider_from_env


SYSTEM_PROMPT = (
    "你是 WriteNow 的写作修改 Agent。你的任务是只改写用户选中的那段文本，"
    "严格保留其余内容不变。输出必须只有“改写后的选中文本本身”，不要加解释、不要加引号、不要 Markdown 代码块。"
    "注意中文标点与换行的自然性。"
)


def _build_user_prompt(*, instruction: str, selected_text: str) -> str:
    return (
        f"指令：{instruction}\n\n"
        "选中文本：\n```text\n"
        f"{selected_text}\n"
        "```\n\n"
        "请输出改写后的选中文本："
    )


async def edit_stream(
    *,
    path: str,
    content: str,
    selection_from: int,
    selection_to: int,
    instruction: str,
) -> AsyncIterator[dict]:
    if selection_to < selection_from:
        raise ValueError("selection.to must be >= selection.from")
    if selection_to > len(content) or selection_from > len(content):
        raise ValueError("selection out of range")

    selected_text = content[selection_from:selection_to]
    if len(selected_text) > AGENT_MAX_SELECTION_CHARS:
        raise ValueError("selection too large")

    yield {"type": "log", "message": "Agent: 准备改写选中文本…"}

    provider = provider_from_env()
    user_prompt = _build_user_prompt(instruction=instruction, selected_text=selected_text)

    replacement = ""
    async for delta in provider.stream_rewrite(system=SYSTEM_PROMPT, user=user_prompt):
        replacement += delta
        yield {"type": "delta", "text": delta}

    patched = content[:selection_from] + replacement + content[selection_to:]
    diff_text = unified_diff(before=content, after=patched, path=path)

    summary = f"选区 {len(selected_text)} 字符 → {len(replacement)} 字符"
    yield {
        "type": "result",
        "path": path,
        "replacement": replacement,
        "patched_content": patched,
        "diff": diff_text,
        "summary": summary,
    }

