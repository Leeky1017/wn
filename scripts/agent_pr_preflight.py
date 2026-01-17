#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

_TASK_BRANCH_RE = re.compile(r"^task/(?P<issue_number>[0-9]+)-(?P<slug>[a-z0-9-]+)$")


@dataclass(frozen=True)
class PullRequestSummary:
    number: int
    head_ref: str
    title: str
    url: str
    is_draft: bool


def _run(args: list[str], cwd: Path | None = None) -> str:
    try:
        completed = subprocess.run(
            args,
            cwd=cwd,
            text=True,
            capture_output=True,
            check=False,
        )
    except FileNotFoundError as exc:
        raise RuntimeError(f"command not found: {args[0]}") from exc

    if completed.returncode != 0:
        stderr = (completed.stderr or "").strip()
        raise RuntimeError(f"command failed ({completed.returncode}): {' '.join(args)}\n{stderr}")

    return (completed.stdout or "").strip()


def _repo_root() -> Path:
    return Path(_run(["git", "rev-parse", "--show-toplevel"]))


def _current_branch(repo_root: Path) -> str:
    return _run(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=repo_root)


def _issue_number_from_branch(branch: str) -> int | None:
    match = _TASK_BRANCH_RE.match(branch)
    if not match:
        return None
    return int(match.group("issue_number"))


def _changed_files(repo_root: Path, base_ref: str) -> set[str]:
    output = _run(
        [
            "git",
            "diff",
            "--name-only",
            "--diff-filter=ACMRT",
            f"{base_ref}...HEAD",
        ],
        cwd=repo_root,
    )
    if not output:
        return set()
    return {line for line in output.splitlines() if line.strip()}


def _list_open_prs() -> list[PullRequestSummary]:
    output = _run(
        [
            "gh",
            "pr",
            "list",
            "--state",
            "open",
            "--json",
            "number,headRefName,title,url,isDraft",
        ]
    )
    items = json.loads(output)
    prs: list[PullRequestSummary] = []
    for item in items:
        prs.append(
            PullRequestSummary(
                number=int(item["number"]),
                head_ref=str(item["headRefName"]),
                title=str(item.get("title", "")),
                url=str(item.get("url", "")),
                is_draft=bool(item.get("isDraft", False)),
            )
        )
    return prs


def _pr_changed_files(pr_number: int) -> set[str]:
    output = _run(["gh", "pr", "view", str(pr_number), "--json", "files"])
    payload = json.loads(output)
    files = payload.get("files", [])

    paths: set[str] = set()
    for item in files:
        path = str(item.get("path", "")).strip()
        if path:
            paths.add(path)
    return paths


def _print_header(label: str) -> None:
    print(f"\n== {label} ==")


def _print_context(repo_root: Path, branch: str, issue_number: int | None, base_ref: str) -> None:
    print("WriteNow PR preflight")
    print(f"- Repo   : {repo_root}")
    print(f"- Branch : {branch}")
    if issue_number is not None:
        print(f"- Issue  : #{issue_number}")
    print(f"- Base   : {base_ref}")


def _print_changed_files(changed: set[str]) -> None:
    _print_header("Changed Files")
    if not changed:
        print("(none)")
        return
    for path in sorted(changed):
        print(f"- {path}")


def _print_open_pr_overlap(changed: set[str], open_prs: list[PullRequestSummary]) -> bool:
    _print_header("Open PR File Overlap")
    overlap_found = False
    for pr in open_prs:
        overlap = sorted(changed.intersection(_pr_changed_files(pr.number)))
        if not overlap:
            continue
        overlap_found = True
        draft_marker = " (draft)" if pr.is_draft else ""
        print(f"- PR #{pr.number}{draft_marker}: {pr.head_ref} — {pr.title}")
        print(f"  {pr.url}")
        for path in overlap:
            print(f"  - {path}")

    if not overlap_found:
        print("OK: no overlapping files with open PRs")
    return overlap_found


def _args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="WriteNow agent PR preflight: file overlap.")
    parser.add_argument(
        "--base-ref",
        default="origin/main",
        help="Git ref to diff against (default: origin/main).",
    )
    return parser.parse_args()


def _main() -> int:
    args = _args()

    repo_root = _repo_root()
    branch = _current_branch(repo_root)
    issue_number = _issue_number_from_branch(branch)

    common_path = Path(_run(["git", "rev-parse", "--git-common-dir"], cwd=repo_root))
    common_path = common_path if common_path.is_absolute() else (repo_root / common_path).resolve()
    controlplane_root = common_path.parent
    controlplane_dirty = _run(["git", "status", "--porcelain=v1"], cwd=controlplane_root)
    if controlplane_dirty:
        print(
            f"\n== Controlplane Guard ==\nERROR: controlplane dirty: {controlplane_root}\n"
            f"{controlplane_dirty}\nFix: move into task worktree; keep controlplane clean."
        )
        return 5

    _run(["git", "fetch", "origin", "main"], cwd=repo_root)
    changed = _changed_files(repo_root, args.base_ref)

    _print_context(repo_root, branch, issue_number, args.base_ref)
    _print_changed_files(changed)

    open_prs = [pr for pr in _list_open_prs() if pr.head_ref != branch]
    overlap_found = _print_open_pr_overlap(changed, open_prs)

    if overlap_found:
        _print_header("Status")
        print("WARN: overlapping files detected; coordinate or split the work.")
        return 2
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(_main())
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
