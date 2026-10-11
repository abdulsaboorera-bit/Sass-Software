type CachedEntry = {
  at: number;
  text: string;
  status: number;
  headers: [string, string][];
};

const TTL_MS = 15_000;
const MAX_ENTRIES = 150;
const SKIP = /^\/api\/(auth|me)(\/|$)/;

const store = new Map<string, CachedEntry>();
const inflight = new Map<string, Promise<Response>>();

let installed = false;

function methodOf(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  if (typeof Request !== "undefined" && input instanceof Request) return input.method.toUpperCase();
  return "GET";
}

function cacheKey(input: RequestInfo | URL, init?: RequestInit): string | null {
  if (typeof window === "undefined") return null;
  if (methodOf(input, init) !== "GET") return null;
  if (init?.signal || init?.cache === "no-store" || init?.cache === "reload") return null;
  const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!url.pathname.startsWith("/api/")) return null;
    if (SKIP.test(url.pathname)) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

function toResponse(entry: CachedEntry): Response {
  return new Response(entry.text, { status: entry.status, headers: new Headers(entry.headers) });
}

/**
 * Cache same-origin GET /api requests in memory and dedupe in-flight ones so
 * navigating between dashboard pages (which refetch on mount) does not pay a
 * fresh network round-trip every time. Any non-GET request clears the cache so
 * data is always refetched after a create/update/delete.
 */
export function installApiCache(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const original = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const key = cacheKey(input, init);

    if (!key) {
      const res = await original(input, init);
      if (methodOf(input, init) !== "GET") store.clear();
      return res;
    }

    const hit = store.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return toResponse(hit);

    const pending = inflight.get(key);
    if (pending) return (await pending).clone();

    const request = original(input, init)
      .then((res) => {
        if (res.ok && res.status !== 204 && res.status !== 205) {
          const clone = res.clone();
          clone
            .text()
            .then((text) => {
              const headers: [string, string][] = [];
              clone.headers.forEach((value, name) => {
                if (name.toLowerCase() !== "set-cookie") headers.push([name, value]);
              });
              if (store.size >= MAX_ENTRIES) {
                const oldest = store.keys().next().value;
                if (oldest !== undefined) store.delete(oldest);
              }
              store.set(key, { at: Date.now(), text, status: res.status, headers });
            })
            .catch(() => {});
        }
        return res;
      })
      .finally(() => inflight.delete(key));

    inflight.set(key, request);
    return request;
  };
}

installApiCache();
