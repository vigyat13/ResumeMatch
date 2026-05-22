from __future__ import annotations

from urllib.parse import urlparse


def classify_ats(url: str) -> str:
    host = urlparse(url).netloc.lower()
    path = urlparse(url).path.lower()

    if "greenhouse.io" in host or "grnh.se" in host or "greenhouse" in path:
        return "greenhouse"
    if "lever.co" in host or "jobs.lever.co" in host:
        return "lever"
    if "ashbyhq.com" in host or "jobs.ashbyhq.com" in host:
        return "ashby"
    if "workable.com" in host:
        return "workable"
    if url.startswith("mailto:"):
        return "email"
    if "linkedin.com" in host:
        return "manual"
    if "indeed.com" in host or "glassdoor.com" in host:
        return "manual"

    return "generic"


def is_supported_for_apply(ats: str) -> bool:
    return ats in {"greenhouse"}
