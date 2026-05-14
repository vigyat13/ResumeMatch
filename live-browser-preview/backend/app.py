from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from browser_manager import BrowserManager
from browser_routes import build_browser_router
from websocket_stream import BrowserWebSocketStreamer


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


manager = BrowserManager(
    headless=env_bool("BROWSER_HEADLESS", True),
    default_width=int(os.getenv("BROWSER_VIEWPORT_WIDTH", "1280")),
    default_height=int(os.getenv("BROWSER_VIEWPORT_HEIGHT", "720")),
    session_ttl_seconds=int(os.getenv("BROWSER_SESSION_TTL_SECONDS", "1200")),
)

streamer = BrowserWebSocketStreamer(
    manager,
    frame_interval_ms=int(os.getenv("BROWSER_FRAME_INTERVAL_MS", "100")),
    jpeg_quality=int(os.getenv("BROWSER_JPEG_QUALITY", "58")),
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await manager.startup()
    yield
    await manager.shutdown()


app = FastAPI(
    title="Live Browser Preview",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(build_browser_router(manager, streamer))


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
