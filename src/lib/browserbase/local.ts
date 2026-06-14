/**
 * Local Chrome fallback provider.
 *
 * When Browserbase is unavailable (no key, or free-plan minutes exhausted)
 * the apply agent can drive a Chrome instance running on the same machine,
 * started with remote debugging enabled:
 *
 *   /Applications/Google Chrome.app/Contents/MacOS/Google Chrome \
 *     --remote-debugging-port=9222 --user-data-dir=/tmp/resumematch-chrome
 *
 * Free and unlimited. The "live view" is the actual Chrome window.
 */

const DEBUG_HOST = process.env.LOCAL_CDP_URL ?? 'http://127.0.0.1:9222'

export async function getLocalConnectUrl(): Promise<string | null> {
  try {
    const res = await fetch(`${DEBUG_HOST}/json/version`, { signal: AbortSignal.timeout(1500) })
    if (!res.ok) return null
    const data = await res.json() as { webSocketDebuggerUrl?: string }
    return data.webSocketDebuggerUrl ?? null
  } catch {
    return null
  }
}

export const LOCAL_CHROME_HINT =
  'Start Chrome with remote debugging to use the free local agent: ' +
  '"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9222 --user-data-dir=/tmp/resumematch-chrome'
