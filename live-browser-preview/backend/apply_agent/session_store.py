from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Optional
from uuid import uuid4

from playwright.async_api import BrowserContext, Page


@dataclass
class ApplySession:
    id: str
    context: BrowserContext
    page: Page
    job_id: str
    job_url: str
    ats: str
    created_at: float = field(default_factory=time.time)
    expires_at: float = field(default_factory=lambda: time.time() + 5 * 60)


class ApplySessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, ApplySession] = {}

    def put(self, *, context: BrowserContext, page: Page, job_id: str, job_url: str, ats: str) -> ApplySession:
        session = ApplySession(
            id=str(uuid4()),
            context=context,
            page=page,
            job_id=job_id,
            job_url=job_url,
            ats=ats,
        )
        self._sessions[session.id] = session
        return session

    def get(self, session_id: str) -> ApplySession:
        session = self._sessions.get(session_id)
        if not session:
            raise KeyError("Apply session expired or not found.")
        if session.expires_at < time.time():
            self._sessions.pop(session_id, None)
            raise KeyError("Apply session expired. Please refill the application.")
        return session

    async def close(self, session_id: str) -> None:
        session = self._sessions.pop(session_id, None)
        if session:
            await session.context.close()

    async def cleanup_expired(self) -> int:
        expired = [
            session_id
            for session_id, session in self._sessions.items()
            if session.expires_at < time.time()
        ]
        for session_id in expired:
            await self.close(session_id)
        return len(expired)


store = ApplySessionStore()
