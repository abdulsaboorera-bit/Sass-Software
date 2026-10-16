type CachedEntry = {
  at: number;
  text: string;
  status: number;
  headers: [string, string][];
};

const TTL_MS = 15_000;
// After the fresh window expires we still serve the stale copy instantly and
// refresh it in the background, so navigation feels immediate.
const STALE_MS = 60_000;
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

/**
 * The active workspace is carried in a cookie (set when a super admin
 * impersonates a tenant), so the very same URL can resolve to different
 * tenants. Fold it into the cache key to never serve one tenant's data to
 * another.
 */
function tenantKey(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)active_tenant_id=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
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
    return url.pathname + url.search + "\u0000" + tenantKey();
  } catch {
    return null;
  }
}

function toResponse(entry: CachedEntry): Response {
  return new Response(entry.text, { status: entry.status, headers: new Headers(entry.headers) });
}

function storeResponse(key: string, res: Response): void {
  if (!res.ok || res.status === 204 || res.status === 205) return;
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

/**
 * Cache same-origin GET /api requests in memory and dedupe in-flight ones so
 * navigating between dashboard pages (which refetch on mount) does not pay a
 * fresh network round-trip every time. Fresh hits are served from cache, stale
 * hits are served instantly and revalidated in the background. Any non-GET
 * request clears the cache so data is always refetched after a write.
 */
export function installApiCache(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const original = window.fetch.bind(window);

  const isAuthPath = (input: RequestInfo | URL): boolean => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    try {
      return new URL(raw, window.location.origin).pathname.startsWith("/api/auth/");
    } catch {
      return false;
    }
  };

  // De-dupe concurrent refreshes so a burst of 401s triggers a single rotation.
  let refreshPromise: Promise<boolean> | null = null;
  const ensureRefreshed = (): Promise<boolean> => {
    if (!refreshPromise) {
      refreshPromise = original("/api/auth/refresh", { method: "POST", credentials: "include" })
        .then((res) => res.ok)
        .catch(() => false)
        .finally(() => {
          refreshPromise = null;
        });
    }
    return refreshPromise;
  };

  // Transparently rotate an expired access token once, then replay the request,
  // so an idle tab never surfaces a 401 to the user.
  const run = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const res = await original(input, init);
    if (res.status !== 401 || isAuthPath(input)) return res;
    const refreshed = await ensureRefreshed();
    if (!refreshed) return res;
    store.clear();
    return original(input, init);
  };

  // Run + cache a request, de-duplicating concurrent callers on the same key.
  const fetchAndStore = (key: string, input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const pending = inflight.get(key);
    if (pending) return pending;
    const request = run(input, init)
      .then((res) => {
        storeResponse(key, res);
        return res;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, request);
    return request;
  };

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const key = cacheKey(input, init);

    if (!key) {
      const res = await run(input, init);
      if (methodOf(input, init) !== "GET") store.clear();
      return res;
    }

    const hit = store.get(key);
    if (hit) {
      const age = Date.now() - hit.at;
      if (age < TTL_MS) return toResponse(hit);
      if (age < STALE_MS) {
        // Serve the stale copy now, refresh in the background.
        fetchAndStore(key, input, init).catch(() => {});
        return toResponse(hit);
      }
    }

    return (await fetchAndStore(key, input, init)).clone();
  };
}

installApiCache();
