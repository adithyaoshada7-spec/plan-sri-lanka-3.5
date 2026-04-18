import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Avoid browser / CDN HTTP caching of Supabase REST (PostgREST) GETs on refresh. */
const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, {
    ...init,
    cache: 'no-store',
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
    const r = await fetch('/api/supabase-config', { cache: 'no-store' })
    if (!r.ok) return
    const j = (await r.json()) as { url?: string; anonKey?: string }
    const u = j.url?.trim()
    const k = j.anonKey?.trim()
    if (u && k) {
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
      global: {
        fetch: noStoreFetch,
        headers: {
          'Cache-Control': 'no-store',
          Pragma: 'no-cache',
        },
      },
    })
  }
  return client
}
