# Live Browser Preview Module

Reusable browser-screen streaming and interaction module.

This is not a standalone SaaS app. It provides:

- FastAPI + Playwright browser session backend
- WebSocket binary screenshot streaming
- REST/browser control endpoints
- Reusable React + TypeScript + Tailwind `<LiveBrowserPreview />` component

## Folder Structure

```text
live-browser-preview/
  backend/
    app.py
    browser_manager.py
    browser_routes.py
    websocket_stream.py
    requirements.txt
    Dockerfile
  docker-compose.yml

src/components/live-browser-preview/
  LiveBrowserPreview.tsx
  index.ts
```

## Backend Setup

From `live-browser-preview/backend`:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
uvicorn app:app --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

## Docker

From `live-browser-preview`:

```bash
docker compose up --build
```

The browser backend will run at `http://localhost:8000`.

## Environment

```env
CORS_ORIGINS=http://localhost:3000
BROWSER_HEADLESS=true
BROWSER_VIEWPORT_WIDTH=1280
BROWSER_VIEWPORT_HEIGHT=720
BROWSER_FRAME_INTERVAL_MS=300
BROWSER_JPEG_QUALITY=62
BROWSER_SESSION_TTL_SECONDS=1200
```

Recommended frame settings:

- Low latency: `BROWSER_FRAME_INTERVAL_MS=200`, `BROWSER_JPEG_QUALITY=50`
- Balanced: `300`, `62`
- Higher quality: `500`, `75`

## API

Create a browser session:

```http
POST /browser/create
Content-Type: application/json

{
  "url": "https://google.com",
  "width": 1280,
  "height": 720
}
```

Response:

```json
{
  "session_id": "uuid",
  "url": "https://google.com/",
  "width": 1280,
  "height": 720,
  "websocket_path": "/browser/stream/uuid"
}
```

Navigate:

```http
POST /browser/navigate

{
  "session_id": "uuid",
  "url": "https://linkedin.com/jobs"
}
```

Render controlled HTML into the live browser page:

```http
POST /browser/content

{
  "session_id": "uuid",
  "html": "<!doctype html><html>...</html>"
}
```

Click:

```http
POST /browser/click

{
  "session_id": "uuid",
  "x": 640,
  "y": 360,
  "button": "left"
}
```

Type:

```http
POST /browser/type

{
  "session_id": "uuid",
  "text": "backend engineer remote",
  "delay_ms": 10
}
```

Press key:

```http
POST /browser/press

{
  "session_id": "uuid",
  "key": "Enter"
}
```

Scroll:

```http
POST /browser/scroll

{
  "session_id": "uuid",
  "delta_x": 0,
  "delta_y": 600
}
```

Destroy:

```http
POST /browser/destroy

{
  "session_id": "uuid"
}
```

Stream:

```text
WS /browser/stream/{session_id}
```

Server sends:

- Binary JPEG frames
- JSON metadata frames:

```json
{ "type": "ready", "sessionId": "uuid", "url": "...", "width": 1280, "height": 720 }
{ "type": "url", "sessionId": "uuid", "url": "..." }
{ "type": "error", "error": "..." }
```

Client can send websocket controls:

```json
{ "type": "click", "x": 120, "y": 220, "button": "left" }
{ "type": "scroll", "deltaX": 0, "deltaY": 500 }
{ "type": "type", "text": "hello" }
{ "type": "press", "key": "Enter" }
{ "type": "navigate", "url": "https://example.com" }
```

## Frontend Integration

Import the component:

```tsx
import { LiveBrowserPreview } from '@/components/live-browser-preview'
```

Create a session first:

```tsx
async function createBrowserSession() {
  const res = await fetch('http://localhost:8000/browser/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://google.com',
      width: 1280,
      height: 720,
    }),
  })

  return res.json() as Promise<{ session_id: string }>
}
```

Render:

```tsx
<LiveBrowserPreview
  websocketUrl="ws://localhost:8000/browser/stream"
  sessionId={sessionId}
  width={1280}
  height={720}
/>
```

The component supports:

- Binary frame rendering
- Current URL display
- Address bar navigation
- Click coordinate mapping
- Wheel scrolling
- Typing printable keys
- Pressing common control keys
- Reconnect handling
- Responsive viewport

## Production Recommendations

- Put the FastAPI service behind an authenticated API gateway.
- Require authorization before creating or streaming sessions.
- Enforce per-user session limits and hard TTLs.
- Block access to internal IP ranges to prevent SSRF.
- Run Chromium in a locked-down container with limited CPU/memory.
- Use HTTPS/WSS in production.
- Tune `BROWSER_FRAME_INTERVAL_MS` and `BROWSER_JPEG_QUALITY` per plan/tier.
- Use a queue if many agents may run concurrently.
- Export session metrics: frame rate, bytes sent, session duration, crashes.
- Destroy sessions on websocket disconnect if they are not needed for background automation.
