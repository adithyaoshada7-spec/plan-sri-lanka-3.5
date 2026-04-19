import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Default headers so PostgREST/Storage API requests are not served from the HTTP cache. */
const SUPABASE_FETCH_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
} as const

/**
 * Name unlikely to collide with PostgREST (`select`, `order`, …). Ignored by Supabase.
 * @see https://vercel.com/docs/edge-network/caching — unique URLs avoid shared CDN keys.
 */
const CACHE_BUST_PARAM = '_sb_cb'

function mergeNoCacheHeaders(initHeaders?: HeadersInit): Headers {
  const h = new Headers(initHeaders)
  for (const [key, value] of Object.entries(SUPABASE_FETCH_HEADERS)) {
    h.set(key, value)
  }
  return h
}

/**
 * Appends a unique query param so each request URL differs. Vercel Edge and some
 * browser/CDN layers key GET responses by URL; headers alone are not always enough.
 *
 * **Do not** add arbitrary query params to PostgREST (`/rest/v1/…`) URLs: PostgREST
 * treats unknown params as column filters, which yields `failed to parse filter`.
 */
/** PostgREST rejects unknown `?param=` — they are parsed as column filters ("failed to parse filter"). */
function isPostgrestRequestUrl(u: URL): boolean {
  const path = u.pathname.toLowerCase()
  // Match `/rest/v1`, `/rest/v2`, … and proxy paths like `/project/ref/rest/v1/…`.
  if (/\/rest\/v\d+/.test(path)) return true
  // Rare custom/proxy paths; avoid bust if it looks like any REST API under the host.
  if (path.includes('/rest/')) return true
  return false
}

function addCacheBustToRequestInput(input: RequestInfo | URL): RequestInfo | URL {
  const ts = String(Date.now())
  const withBust = (href: string) => {
    let u: URL
    try {
      u = new URL(href)
    } catch {
      return href
    }
    if (isPostgrestRequestUrl(u)) return href
    u.searchParams.set(CACHE_BUST_PARAM, ts)
    return u.toString()
  }
  if (typeof input === 'string') {
    return withBust(input)
  }
  if (input instanceof URL) {
    return new URL(withBust(input.href))
  }
  const nextUrl = withBust(input.url)
  return nextUrl === input.url ? input : new Request(nextUrl, input)
}

/**
 * Supabase-js uses `fetch` for PostgREST, Storage, Auth HTTP, etc. This wrapper:
 * - adds a per-request cache-bust query param (helps Vercel / CDN edge caches),
 * - sets `cache: 'no-store'` and no-cache headers for browser HTTP caches.
 */
const noStoreFetch: typeof fetch = (input, init) =>
  fetch(addCacheBustToRequestInput(input), {
    ...init,
    cache: 'no-store',
    headers: mergeNoCacheHeaders(init?.headers),
  })

let client: SupabaseClient | null = null

/** Filled by bootstrapSupabaseEnv when the bundle has no VITE_* keys (e.g. Vercel mis-name). */
let runtimeUrl = ''
let runtimeAnonKey = ''

function envUrl(): string {
  return (runtimeUrl || import.meta.env.VITE_SUPABASE_URL || '').trim()
}

function envAnonKey(): string {
  return (runtimeAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
}

/**
 * Call once before React render. If VITE_* are empty, tries /api/supabase-config (Vercel).
 */
export async function bootstrapSupabaseEnv(): Promise<void> {
  if (envUrl() && envAnonKey()) return
  try {
    const r = await fetch(
      `/api/supabase-config?${CACHE_BUST_PARAM}=${Date.now()}`,
      { cache: 'no-store', headers: { ...SUPABASE_FETCH_HEADERS } },
    )
    if (!r.ok) return
    const j = (await r.json()) as {
      url?: string
      anonKey?: string
      configured?: boolean
    }
    const u = j.url?.trim()
    const k = j.anonKey?.trim()
    const ok = j.configured ?? Boolean(u && k)
    if (ok && u && k) {
      runtimeUrl = u
      runtimeAnonKey = k
      client = null
    }
  } catch {
    // e.g. vite preview with no serverless
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(envUrl() && envAnonKey())
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!client) {
    client = createClient(envUrl(), envAnonKey(), {
      auth: {
        /**
         * Does not affect PostgREST/CDN caching (session is stored in localStorage).
         * Keep `true` so admin sign-in survives refresh on the deployed site.
         */
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: noStoreFetch,
        headers: { ...SUPABASE_FETCH_HEADERS },
      },
    })
  }
  return client
}
