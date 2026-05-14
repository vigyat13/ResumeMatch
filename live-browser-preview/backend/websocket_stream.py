from __future__ import annotations

import asyncio
import json
from contextlib import suppress
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

from browser_manager import BrowserManager


class BrowserWebSocketStreamer:
    """Bidirectional websocket transport.

    Server -> client:
      - binary JPEG screenshot frames
      - JSON metadata frames, currently URL and session status

    Client -> server:
      - JSON interaction frames: click, scroll, type, press, navigate
    """

    def __init__(
        self,
        manager: BrowserManager,
        *,
        frame_interval_ms: int = 300,
        jpeg_quality: int = 62,
    ) -> None:
        self.manager = manager
        self.frame_interval = max(frame_interval_ms, 100) / 1000
        self.jpeg_quality = max(20, min(jpeg_quality, 90))

    async def stream(self, websocket: WebSocket, session_id: str) -> None:
        session = self.manager.get_session(session_id)
        await websocket.accept()

        receiver = asyncio.create_task(self._receive_controls(websocket, session_id))
        last_url = ""

        try:
            await websocket.send_json({
                "type": "ready",
                "sessionId": session_id,
                "url": session.page.url,
                "width": session.width,
                "height": session.height,
            })

            while True:
                if receiver.done():
                    error = receiver.exception()
                    if error:
                        raise error
                    break

                current_url = session.page.url
                if current_url != last_url:
                    last_url = current_url
                    await websocket.send_json({
                        "type": "url",
                        "sessionId": session_id,
                        "url": current_url,
                    })

                frame = await self.manager.screenshot(session_id, quality=self.jpeg_quality)
                await websocket.send_bytes(frame)
                await asyncio.sleep(self.frame_interval)
        except WebSocketDisconnect:
            pass
        except (KeyError, RuntimeError, Exception):
            # Session may be destroyed while the client still reconnects; Starlette
            # also raises RuntimeError if the socket closes during send.
            pass
        finally:
            receiver.cancel()
            with suppress(asyncio.CancelledError):
                await receiver

    async def _receive_controls(self, websocket: WebSocket, session_id: str) -> None:
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break

            raw = message.get("text")
            if not raw:
                continue

            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "error": "Invalid JSON control frame"})
                continue

            try:
                await self._handle_control(session_id, payload)
            except Exception as exc:
                await websocket.send_json({"type": "error", "error": str(exc)})

    async def _handle_control(self, session_id: str, payload: dict[str, Any]) -> None:
        event_type = payload.get("type")

        if event_type == "click":
            await self.manager.click(
                session_id,
                float(payload["x"]),
                float(payload["y"]),
                payload.get("button", "left"),
            )
            return

        if event_type == "scroll":
            await self.manager.scroll(
                session_id,
                float(payload.get("deltaX", 0)),
                float(payload.get("deltaY", 0)),
            )
            return

        if event_type == "type":
            await self.manager.type_text(
                session_id,
                str(payload.get("text", "")),
                int(payload.get("delayMs", 0)),
            )
            return

        if event_type == "press":
            await self.manager.press(session_id, str(payload["key"]))
            return

        if event_type == "navigate":
            await self.manager.navigate(session_id, str(payload["url"]))
            return

        raise ValueError(f"Unsupported control event: {event_type}")
