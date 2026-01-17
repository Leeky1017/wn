from __future__ import annotations

import re
from pathlib import Path

import markdown as _md


TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


def list_platforms() -> list[dict]:
    return [
        {"id": "wechat", "name": "WeChat"},
        {"id": "zhihu", "name": "Zhihu"},
        {"id": "xiaohongshu", "name": "XHS"},
    ]


def render_platform_html(*, content: str, platform: str, title: str | None) -> tuple[str, list[str]]:
    css = _load_css("base.css") + "\n" + _load_css(f"{platform}.css")
    body_html = _md.markdown(content, extensions=["extra", "sane_lists"])
    warnings = _lint_markdown(content)
    safe_title = (title or "WriteNow Export").strip()[:80]

    html = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{_escape_html(safe_title)}</title>
  <style>{css}</style>
</head>
<body>
  <article class="wn wn--{platform}">
    {body_html}
  </article>
</body>
</html>
"""
    return html, warnings


def _load_css(name: str) -> str:
    return (TEMPLATES_DIR / name).read_text(encoding="utf-8")


def _escape_html(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def _lint_markdown(content: str) -> list[str]:
    warnings: list[str] = []

    heading_levels: list[int] = []
    for line in content.splitlines():
        m = re.match(r"^(#{1,6})\\s+.+", line)
        if m:
            heading_levels.append(len(m.group(1)))
    for idx in range(1, len(heading_levels)):
        if heading_levels[idx] - heading_levels[idx - 1] > 1:
            warnings.append("Heading level jumps: avoid jumping from H%d to H%d" % (heading_levels[idx - 1], heading_levels[idx]))
            break

    paragraphs = [p.strip() for p in re.split(r"\\n\\s*\\n", content) if p.strip()]
    for p in paragraphs:
        plain = re.sub(r"\\s+", "", p)
        if len(plain) > 520:
            warnings.append("Paragraph too long: consider splitting for readability")
            break

    if "TODO" in content:
        warnings.append("TODO found: remove placeholders before publishing")

    return warnings
