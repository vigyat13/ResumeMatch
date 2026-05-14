from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, HTTPException, WebSocket
from pydantic import BaseModel, Field

from browser_manager import BrowserManager
from websocket_stream import BrowserWebSocketStreamer


class CreateBrowserRequest(BaseModel):
    url: str = "about:blank"
    width: int = Field(default=1280, ge=320, le=3840)
    height: int = Field(default=720, ge=240, le=2160)


class CreateBrowserResponse(BaseModel):
    session_id: str
    url: str
    width: int
    height: int
    websocket_path: str


class SessionRequest(BaseModel):
    session_id: str


class NavigateRequest(SessionRequest):
    url: str


class ContentRequest(SessionRequest):
    html: str


class ClickRequest(SessionRequest):
    x: float
    y: float
    button: str = "left"


class TypeRequest(SessionRequest):
    text: str
    delay_ms: int = 0


class PressRequest(SessionRequest):
    key: str


class ScrollRequest(SessionRequest):
    delta_x: float = 0
    delta_y: float = 0


class JobPreviewStartRequest(SessionRequest):
    query: str
    location: str = ""


class JobPreviewResultsRequest(JobPreviewStartRequest):
    jobs: list[dict[str, Any]] = Field(default_factory=list)


def build_browser_router(
    manager: BrowserManager,
    streamer: Optional[BrowserWebSocketStreamer] = None,
) -> APIRouter:
    router = APIRouter(prefix="/browser", tags=["browser"])
    ws_streamer = streamer or BrowserWebSocketStreamer(manager)

    @router.post("/create", response_model=CreateBrowserResponse)
    async def create_browser(payload: CreateBrowserRequest) -> CreateBrowserResponse:
        try:
            session = await manager.create_session(
                start_url=payload.url,
                width=payload.width,
                height=payload.height,
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

        return CreateBrowserResponse(
            session_id=session.id,
            url=session.page.url,
            width=session.width,
            height=session.height,
            websocket_path=f"/browser/stream/{session.id}",
        )

    @router.post("/destroy")
    async def destroy_browser(payload: SessionRequest) -> dict[str, bool]:
        await manager.destroy_session(payload.session_id)
        return {"ok": True}

    @router.post("/navigate")
    async def navigate(payload: NavigateRequest) -> dict[str, str]:
        try:
            url = await manager.navigate(payload.session_id, payload.url)
            return {"url": url}
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @router.post("/content")
    async def set_content(payload: ContentRequest) -> dict[str, str]:
        try:
            url = await manager.set_content(payload.session_id, payload.html)
            return {"url": url}
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @router.post("/job-search/start")
    async def start_job_search_preview(payload: JobPreviewStartRequest) -> dict[str, bool]:
        try:
            manager.schedule_job_search_preview(payload.session_id, payload.query, payload.location)
            return {"ok": True}
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @router.post("/job-search/results")
    async def complete_job_search_preview(payload: JobPreviewResultsRequest) -> dict[str, bool]:
        try:
            manager.schedule_job_result_previews(
                payload.session_id,
                payload.query,
                payload.location,
                payload.jobs,
            )
            return {"ok": True}
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @router.post("/click")
    async def click(payload: ClickRequest) -> dict[str, bool]:
        try:
            await manager.click(payload.session_id, payload.x, payload.y, payload.button)
            return {"ok": True}
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @router.post("/type")
    async def type_text(payload: TypeRequest) -> dict[str, bool]:
        try:
            await manager.type_text(payload.session_id, payload.text, payload.delay_ms)
            return {"ok": True}
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @router.post("/press")
    async def press(payload: PressRequest) -> dict[str, bool]:
        try:
            await manager.press(payload.session_id, payload.key)
            return {"ok": True}
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @router.post("/scroll")
    async def scroll(payload: ScrollRequest) -> dict[str, bool]:
        try:
            await manager.scroll(payload.session_id, payload.delta_x, payload.delta_y)
            return {"ok": True}
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @router.websocket("/stream/{session_id}")
    async def stream(websocket: WebSocket, session_id: str) -> None:
        try:
            manager.get_session(session_id)
        except KeyError:
            await websocket.close(code=4404, reason="Browser session not found")
            return
        await ws_streamer.stream(websocket, session_id)

    return router
