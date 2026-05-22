from __future__ import annotations

import hashlib
import os
import urllib.request
import asyncio
from pathlib import Path
from urllib.parse import urlparse

from .models import ApplicantProfile


async def ensure_resume_path(profile: ApplicantProfile) -> str:
    if profile.resume_path and Path(profile.resume_path).exists():
        return profile.resume_path

    if not profile.resume_url:
        raise ValueError("Applicant profile is missing a resume file.")

    url = str(profile.resume_url)
    parsed = urlparse(url)
    suffix = Path(parsed.path).suffix or ".pdf"
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:18]
    target = Path(os.getenv("APPLY_AGENT_TMP_DIR", "/tmp/resumematch-apply"))
    target.mkdir(parents=True, exist_ok=True)
    path = target / f"resume-{digest}{suffix}"

    if path.exists() and path.stat().st_size > 0:
        return str(path)

    def download() -> bytes:
        request = urllib.request.Request(url, headers={"User-Agent": "ResumeMatchApplyAgent/1.0"})
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.read()

    path.write_bytes(await asyncio.to_thread(download))

    return str(path)
