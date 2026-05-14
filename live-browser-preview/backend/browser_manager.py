from __future__ import annotations

import asyncio
import time
from contextlib import suppress
from dataclasses import dataclass, field
from typing import Any, Dict, Optional
from urllib.parse import quote_plus
from uuid import uuid4

from playwright.async_api import Browser, BrowserContext, Page, Playwright, async_playwright

from job_preview_templates import build_job_preview_html


@dataclass
class BrowserSession:
    id: str
    context: BrowserContext
    page: Page
    width: int
    height: int
    created_at: float = field(default_factory=time.time)
    last_used_at: float = field(default_factory=time.time)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    automation_task: Optional[asyncio.Task[None]] = None

    async def touch(self) -> None:
        self.last_used_at = time.time()


class BrowserManager:
    """Owns the Playwright process and browser sessions.

    The browser process is shared. Each user/session gets an isolated browser
    context and page so cookies, local storage, and navigation state do not leak.
    """

    def __init__(
        self,
        *,
        headless: bool = True,
        default_width: int = 1280,
        default_height: int = 720,
        session_ttl_seconds: int = 20 * 60,
    ) -> None:
        self.headless = headless
        self.default_width = default_width
        self.default_height = default_height
        self.session_ttl_seconds = session_ttl_seconds
        self._playwright: Optional[Playwright] = None
        self._browser: Optional[Browser] = None
        self._sessions: Dict[str, BrowserSession] = {}
        self._manager_lock = asyncio.Lock()

    async def startup(self) -> None:
        async with self._manager_lock:
            if self._browser:
                return
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=self.headless,
                args=[
                    "--disable-dev-shm-usage",
                    "--disable-extensions",
                    "--disable-background-networking",
                    "--disable-background-timer-throttling",
                    "--disable-renderer-backgrounding",
                    "--no-first-run",
                    "--no-default-browser-check",
                ],
            )

    async def shutdown(self) -> None:
        async with self._manager_lock:
            session_ids = list(self._sessions.keys())
            for session_id in session_ids:
                await self.destroy_session(session_id)
            if self._browser:
                with suppress(Exception):
                    await self._browser.close()
                self._browser = None
            if self._playwright:
                with suppress(Exception):
                    await self._playwright.stop()
                self._playwright = None

    async def create_session(
        self,
        *,
        start_url: str = "about:blank",
        width: Optional[int] = None,
        height: Optional[int] = None,
    ) -> BrowserSession:
        await self.startup()
        if not self._browser:
            raise RuntimeError("Browser failed to start")

        session_id = str(uuid4())
        viewport_width = width or self.default_width
        viewport_height = height or self.default_height
        context = await self._browser.new_context(
            viewport={"width": viewport_width, "height": viewport_height},
            device_scale_factor=1,
            ignore_https_errors=True,
        )
        page = await context.new_page()
        page.set_default_timeout(15_000)
        session = BrowserSession(
            id=session_id,
            context=context,
            page=page,
            width=viewport_width,
            height=viewport_height,
        )
        self._sessions[session_id] = session

        if start_url and start_url != "about:blank":
            await self.navigate(session_id, start_url)

        return session

    def get_session(self, session_id: str) -> BrowserSession:
        session = self._sessions.get(session_id)
        if not session:
            raise KeyError(f"Browser session not found: {session_id}")
        return session

    async def destroy_session(self, session_id: str) -> None:
        session = self._sessions.pop(session_id, None)
        if not session:
            return
        if session.automation_task and not session.automation_task.done():
            session.automation_task.cancel()
        async with session.lock:
            with suppress(Exception):
                await session.context.close()

    async def cleanup_expired(self) -> int:
        now = time.time()
        expired = [
            session_id
            for session_id, session in self._sessions.items()
            if now - session.last_used_at > self.session_ttl_seconds
        ]
        for session_id in expired:
            await self.destroy_session(session_id)
        return len(expired)

    async def navigate(self, session_id: str, url: str) -> str:
        session = self.get_session(session_id)
        async with session.lock:
            await session.touch()
            await session.page.goto(normalize_url(url), wait_until="domcontentloaded")
            return session.page.url

    async def set_content(self, session_id: str, html: str) -> str:
        session = self.get_session(session_id)
        async with session.lock:
            await session.touch()
            await session.page.set_content(html, wait_until="domcontentloaded")
            return session.page.url

    def schedule_job_search_preview(self, session_id: str, query: str, location: str) -> None:
        session = self.get_session(session_id)
        if session.automation_task and not session.automation_task.done():
            session.automation_task.cancel()
        session.automation_task = self._schedule_task(
            self.start_job_search_preview(session_id, query, location)
        )

    def schedule_job_result_previews(
        self,
        session_id: str,
        query: str,
        location: str,
        jobs: list[dict[str, Any]],
    ) -> None:
        session = self.get_session(session_id)
        if session.automation_task and not session.automation_task.done():
            session.automation_task.cancel()
        session.automation_task = self._schedule_task(
            self.complete_job_search_preview(session_id, query, location, jobs)
        )

    async def start_job_search_preview(self, session_id: str, query: str, location: str) -> None:
        session = self.get_session(session_id)
        for index, source in enumerate(build_job_board_urls(query, location)):
            await self._open_live_source(session, source["url"], source["label"], index)

    async def complete_job_search_preview(
        self,
        session_id: str,
        query: str,
        location: str,
        jobs: list[dict[str, Any]],
    ) -> None:
        session = self.get_session(session_id)
        targets = job_preview_targets(jobs)
        if targets:
            total = len(targets)
            for index, target in enumerate(targets, start=1):
                label = f"Preview {index}/{total}: {target['title']} - {target['source']}"
                await self._open_live_source(session, target["url"], label, index, load_timeout_ms=3_000)
                await self._move_cursor(session, 530, 330, steps=10)
                await self._scroll_page(session, 620)
                await asyncio.sleep(0.22)
            return

        await self.set_content(session_id, build_job_preview_html())
        await self._agent_eval(
            session,
            "(args) => window.agentPreview.showResults(args.query, args.location, args.jobs)",
            {"query": query, "location": location, "jobs": jobs},
        )

    async def click(self, session_id: str, x: float, y: float, button: str = "left") -> None:
        session = self.get_session(session_id)
        async with session.lock:
            await session.touch()
            await session.page.mouse.click(x, y, button=button)

    async def scroll(self, session_id: str, delta_x: float = 0, delta_y: float = 0) -> None:
        session = self.get_session(session_id)
        async with session.lock:
            await session.touch()
            await session.page.mouse.wheel(delta_x, delta_y)

    async def type_text(self, session_id: str, text: str, delay_ms: int = 0) -> None:
        session = self.get_session(session_id)
        async with session.lock:
            await session.touch()
            await session.page.keyboard.type(text, delay=delay_ms)

    async def press(self, session_id: str, key: str) -> None:
        session = self.get_session(session_id)
        async with session.lock:
            await session.touch()
            await session.page.keyboard.press(key)

    async def screenshot(self, session_id: str, *, quality: int = 62) -> bytes:
        session = self.get_session(session_id)
        async with session.lock:
            await session.touch()
            return await session.page.screenshot(
                type="jpeg",
                quality=quality,
                full_page=False,
                animations="allow",
                caret="hide",
            )

    async def _open_live_source(
        self,
        session: BrowserSession,
        url: str,
        label: str,
        index: int,
        load_timeout_ms: int = 5_000,
    ) -> None:
        async with session.lock:
            await session.touch()
            try:
                await session.page.goto(url, wait_until="commit", timeout=load_timeout_ms)
            except Exception:
                await session.page.goto("about:blank")
                await session.page.set_content(build_source_error_html(label, url), wait_until="domcontentloaded")

        await self._install_live_overlay(session, label)
        await asyncio.sleep(0.08)
        await self._move_cursor(session, 240 + index * 52, 150 + index * 24, steps=8)
        await self._scroll_page(session, 420)
        await asyncio.sleep(0.18)

    async def _agent_ready(self, session: BrowserSession) -> bool:
        async with session.lock:
            await session.touch()
            return bool(await session.page.evaluate("Boolean(window.agentPreview)"))

    async def _agent_eval(self, session: BrowserSession, expression: str, arg: Any = None) -> None:
        async with session.lock:
            await session.touch()
            await session.page.evaluate(expression, arg)

    async def _move_cursor(self, session: BrowserSession, x: float, y: float, *, steps: int = 14) -> None:
        start = await self._cursor_position(session)
        start_x = float(start.get("x", x))
        start_y = float(start.get("y", y))

        for index in range(1, steps + 1):
            eased = index / steps
            current_x = start_x + (x - start_x) * eased
            current_y = start_y + (y - start_y) * eased
            async with session.lock:
                await session.touch()
                await session.page.mouse.move(current_x, current_y)
                await session.page.evaluate(
                    "(pos) => window.__livePreviewMoveCursor && window.__livePreviewMoveCursor(pos.x, pos.y)",
                    {"x": current_x, "y": current_y},
                )
            await asyncio.sleep(0.01)

    async def _cursor_position(self, session: BrowserSession) -> dict[str, float]:
        async with session.lock:
            await session.touch()
            return await session.page.evaluate(
                """() => {
                    const cursor = document.getElementById('__live_preview_cursor') || document.getElementById('cursor');
                    if (!cursor) return { x: 130, y: 130 };
                    const transform = cursor.style.transform || '';
                    const match = transform.match(/translate\\(([-0-9.]+)px,\\s*([-0-9.]+)px\\)/);
                    return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 130, y: 130 };
                }"""
            )

    async def _click_with_cursor(self, session: BrowserSession, x: float, y: float) -> None:
        async with session.lock:
            await session.touch()
            await session.page.evaluate(
                "(pos) => window.__livePreviewMoveCursor && window.__livePreviewMoveCursor(pos.x, pos.y, true)",
                {"x": x, "y": y},
            )
            await session.page.mouse.click(x, y)
        await asyncio.sleep(0.08)

    async def _install_live_overlay(self, session: BrowserSession, label: str) -> None:
        async with session.lock:
            await session.touch()
            await session.page.evaluate(
                """(label) => {
                    let style = document.getElementById('__live_preview_style');
                    if (!style) {
                        style = document.createElement('style');
                        style.id = '__live_preview_style';
                        style.textContent = `
                          #__live_preview_cursor {
                            position: fixed;
                            left: 0;
                            top: 0;
                            z-index: 2147483647;
                            width: 30px;
                            height: 30px;
                            pointer-events: none;
                            transform: translate(130px, 130px) rotate(-16deg);
                            filter: drop-shadow(0 8px 10px rgba(0,0,0,.25));
                            transition: transform 120ms linear;
                          }
                          #__live_preview_cursor:before {
                            content: "";
                            position: absolute;
                            border-left: 22px solid #111827;
                            border-top: 13px solid transparent;
                            border-bottom: 13px solid transparent;
                          }
                          #__live_preview_cursor.click:after {
                            content: "";
                            position: absolute;
                            left: -13px;
                            top: -13px;
                            width: 44px;
                            height: 44px;
                            border: 2px solid rgba(37,99,235,.75);
                            border-radius: 999px;
                            animation: __live_preview_click .34s ease-out;
                          }
                          #__live_preview_label {
                            position: fixed;
                            left: 18px;
                            bottom: 18px;
                            z-index: 2147483647;
                            border-radius: 999px;
                            background: rgba(15,23,42,.82);
                            color: white;
                            padding: 10px 14px;
                            font: 700 13px Inter, ui-sans-serif, system-ui, sans-serif;
                            box-shadow: 0 14px 35px rgba(0,0,0,.25);
                            backdrop-filter: blur(8px);
                          }
                          @keyframes __live_preview_click {
                            from { opacity: 1; transform: scale(.45); }
                            to { opacity: 0; transform: scale(1.5); }
                          }
                        `;
                        document.documentElement.appendChild(style);
                    }
                    let cursor = document.getElementById('__live_preview_cursor');
                    if (!cursor) {
                        cursor = document.createElement('div');
                        cursor.id = '__live_preview_cursor';
                        document.documentElement.appendChild(cursor);
                    }
                    let badge = document.getElementById('__live_preview_label');
                    if (!badge) {
                        badge = document.createElement('div');
                        badge.id = '__live_preview_label';
                        document.documentElement.appendChild(badge);
                    }
                    badge.textContent = label;
                    window.__livePreviewMoveCursor = (x, y, down = false) => {
                        cursor.style.transform = `translate(${x}px, ${y}px) rotate(-16deg)`;
                        cursor.classList.toggle('click', Boolean(down));
                        if (down) window.setTimeout(() => cursor.classList.remove('click'), 340);
                    };
                  }""",
                label,
            )

    async def _scroll_page(self, session: BrowserSession, delta_y: float) -> None:
        async with session.lock:
            await session.touch()
            await session.page.mouse.wheel(0, delta_y)
        await asyncio.sleep(0.12)

    async def _type_phrase(self, session: BrowserSession, text: str, *, delay: float) -> None:
        for char in text:
            async with session.lock:
                await session.touch()
                await session.page.keyboard.type(char, delay=0)
            await asyncio.sleep(delay)

    def _schedule_task(self, coro: Any) -> asyncio.Task[None]:
        task = asyncio.create_task(coro)

        def consume_result(done_task: asyncio.Task[None]) -> None:
            with suppress(asyncio.CancelledError, Exception):
                done_task.result()

        task.add_done_callback(consume_result)
        return task


def normalize_url(url: str) -> str:
    trimmed = url.strip()
    if trimmed == "about:blank":
        return trimmed
    if trimmed.startswith(("http://", "https://")):
        return trimmed
    return f"https://{trimmed}"


def build_job_board_urls(query: str, location: str) -> list[dict[str, str]]:
    role = quote_plus(query.strip())
    place = quote_plus(location.strip())
    linked_in_keywords = quote_plus(" ".join(part for part in [query.strip(), location.strip()] if part))

    return [
        {
            "label": "Viewing Indeed live search",
            "url": f"https://www.indeed.com/jobs?q={role}&l={place}" if place else f"https://www.indeed.com/jobs?q={role}",
        },
        {
            "label": "Viewing Glassdoor live search",
            "url": f"https://www.glassdoor.com/Job/jobs.htm?sc.keyword={role}&locT=&locId=&locKeyword={place}",
        },
        {
            "label": "Viewing LinkedIn live search",
            "url": f"https://www.linkedin.com/jobs/search/?keywords={linked_in_keywords}",
        },
    ]


def job_preview_targets(jobs: list[dict[str, Any]]) -> list[dict[str, str]]:
    targets: list[dict[str, str]] = []
    seen: set[str] = set()
    for job in jobs:
        url = str(job.get("url") or "").strip()
        if not url.startswith(("http://", "https://")) or url in seen:
            continue
        seen.add(url)
        targets.append({
            "url": url,
            "title": str(job.get("title") or "Job listing").strip()[:70],
            "source": str(job.get("source") or "Job board").strip()[:36],
        })
        if len(targets) >= 10:
            break
    return targets


def build_source_error_html(label: str, url: str) -> str:
    safe_label = html_escape(label)
    safe_url = html_escape(url)
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body {{
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #f8fafc;
      color: #111827;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    }}
    main {{
      width: min(760px, calc(100vw - 48px));
      border: 1px solid #e5e7eb;
      border-radius: 24px;
      background: white;
      padding: 34px;
      box-shadow: 0 24px 70px rgba(15,23,42,.10);
    }}
    h1 {{ margin: 0 0 10px; font-size: 28px; }}
    p {{ margin: 0; color: #64748b; line-height: 1.55; }}
    code {{ display: block; margin-top: 18px; padding: 14px; border-radius: 14px; background: #f1f5f9; color: #334155; white-space: normal; }}
  </style>
</head>
<body>
  <main>
    <h1>{safe_label}</h1>
    <p>The live browser attempted to open this real job-board page. If it is blocked by the publisher, the stream still reflects the real browser result.</p>
    <code>{safe_url}</code>
  </main>
</body>
</html>"""


def html_escape(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )
