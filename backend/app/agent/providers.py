from __future__ import annotations

import asyncio
import json
import os
import re
from collections.abc import AsyncIterator
from dataclasses import dataclass

import httpx


@dataclass(frozen=True)
class OpenAIConfig:
    base_url: str
    api_key: str
    model: str
    timeout_s: float = 90.0


class LLMProvider:
    async def stream_rewrite(self, *, system: str, user: str) -> AsyncIterator[str]:
        raise NotImplementedError


class MockProvider(LLMProvider):
    async def stream_rewrite(self, *, system: str, user: str) -> AsyncIterator[str]:
        instruction, selected = _extract_instruction_and_selected(user)
        text = _mock_rewrite(selected_text=selected, instruction=instruction)
        for chunk in _chunk_text(text, chunk_size=24):
            await asyncio.sleep(0.01)
            yield chunk


class OpenAIChatCompletionsProvider(LLMProvider):
    def __init__(self, config: OpenAIConfig) -> None:
        self._config = config

    async def stream_rewrite(self, *, system: str, user: str) -> AsyncIterator[str]:
        url = f"{self._config.base_url}/chat/completions"
        headers = {"Authorization": f"Bearer {self._config.api_key}"}
        payload = {
            "model": self._config.model,
            "stream": True,
            "temperature": 0.4,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        async with httpx.AsyncClient(timeout=self._config.timeout_s) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data = line.removeprefix("data:").strip()
                    if data == "[DONE]":
                        break
                    try:
                        obj = json.loads(data)
                        delta = obj["choices"][0]["delta"].get("content")
                    except Exception:
                        continue
                    if delta:
                        yield delta


def provider_from_env() -> LLMProvider:
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    if api_key:
        return OpenAIChatCompletionsProvider(OpenAIConfig(base_url=base_url, api_key=api_key, model=model))
    return MockProvider()


def _chunk_text(text: str, chunk_size: int) -> list[str]:
    return [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]


def _extract_instruction_and_selected(user: str) -> tuple[str, str]:
    instruction = ""
    selected = ""
    m1 = re.search(r"指令：(.+?)\n", user)
    if m1:
        instruction = m1.group(1).strip()
    m2 = re.search(r"选中文本：\n```text\n([\s\S]*?)\n```", user)
    if m2:
        selected = m2.group(1)
    return instruction, selected


def _mock_rewrite(*, selected_text: str, instruction: str) -> str:
    text = selected_text.strip("\n")
    if not text:
        return ""

    if "口语" in instruction:
        text = (
            text.replace("因此", "所以")
            .replace("此外", "另外")
            .replace("然而", "不过")
            .replace("同时", "而且")
            .replace("我们需要", "我们得")
        )

    m = re.search(r"(\d+)\s*字", instruction)
    if "扩写" in instruction or m:
        target = int(m.group(1)) if m else max(200, len(text) + 120)
        filler = (
            "你可以把它理解成一次“先把骨架搭好，再把血肉填满”的过程。"
            "先把要点写清楚，再补上例子、对比和一句能落地的结论。"
        )
        while len(text) < target:
            text = text + "\n\n" + filler
        return text.strip("\n")

    if "精简" in instruction or "压缩" in instruction:
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        return " ".join(lines)[: max(50, int(len(" ".join(lines)) * 0.65))]

    if "标题" in instruction:
        core = re.sub(r"[，。！？；：,.!?:;]+", "", text)
        core = core[:20]
        return f"{core}：一眼看懂的版本"

    return text

