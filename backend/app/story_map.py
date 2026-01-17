from __future__ import annotations

import json
import os
import re
from typing import Literal

import httpx


def _heuristic_story_map(*, content: str, lang: Literal["en", "zh"]) -> list[dict]:
    text = content.strip()
    if not text:
        return []

    nodes: list[dict] = []

    headings = list(re.finditer(r"^(#{1,6})\s+(.+?)\s*$", text, flags=re.MULTILINE))
    if headings:
        for idx, m in enumerate(headings[:24]):
            depth = min(3, len(m.group(1)))
            title = m.group(2).strip()
            start = m.end()
            end = headings[idx + 1].start() if idx + 1 < len(headings) else len(text)
            body = text[start:end].strip()
            detail = ""
            if body:
                for para in re.split(r"\n\s*\n", body):
                    para = para.strip()
                    if para:
                        detail = re.sub(r"\s+", " ", para)[:140]
                        break
            nodes.append({"title": title, "detail": detail, "depth": depth})
        return nodes

    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    for p in paras[:3]:
        one_line = re.sub(r"\s+", " ", p)
        title = one_line[:18] + ("…" if len(one_line) > 18 else "")
        if lang == "zh" and len(one_line) > 12:
            title = one_line[:12] + "…"
        nodes.append({"title": title, "detail": one_line[:160], "depth": 1})
    return nodes


async def generate_story_map(*, content: str, lang: Literal["en", "zh"]) -> list[dict]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return _heuristic_story_map(content=content, lang=lang)

    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    url = f"{base_url}/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}"}

    system = (
        "You are WriteNow's Story Map generator.\n"
        "Return ONLY valid JSON (no code fences, no prose).\n"
        "JSON shape: {\"nodes\": [{\"title\": string, \"detail\": string, \"depth\": number}]}\n"
        "Rules:\n"
        "- depth is 1-3\n"
        "- keep nodes <= 12\n"
        "- keep each detail <= 140 chars\n"
    )
    user = f"Language: {lang}\n\nContent:\n```markdown\n{content[:8000]}\n```"

    payload = {
        "model": model,
        "stream": False,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }

    async with httpx.AsyncClient(timeout=90.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        obj = resp.json()
        text = obj["choices"][0]["message"].get("content") or ""

    try:
        parsed = json.loads(text)
        nodes = parsed.get("nodes")
        if isinstance(nodes, list):
            out: list[dict] = []
            for n in nodes[:12]:
                if not isinstance(n, dict):
                    continue
                title = n.get("title")
                detail = n.get("detail", "")
                depth = n.get("depth", 1)
                if not isinstance(title, str):
                    continue
                if not isinstance(detail, str):
                    detail = ""
                if not isinstance(depth, int):
                    depth = 1
                out.append(
                    {
                        "title": title.strip()[:60],
                        "detail": detail.strip()[:140],
                        "depth": max(1, min(3, depth)),
                    }
                )
            return out
    except Exception:
        pass

    return _heuristic_story_map(content=content, lang=lang)

