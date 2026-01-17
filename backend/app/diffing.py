from __future__ import annotations

import difflib


def unified_diff(*, before: str, after: str, path: str) -> str:
    lines = list(
        difflib.unified_diff(
            before.splitlines(),
            after.splitlines(),
            fromfile=f"a/{path}",
            tofile=f"b/{path}",
            lineterm="",
            n=3,
        )
    )
    if not lines:
        return ""
    return "\n".join(lines) + "\n"
