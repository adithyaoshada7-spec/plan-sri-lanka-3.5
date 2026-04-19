/**
 * Vercel Serverless: exposes public Supabase settings at runtime.
 * Use when env vars are set without VITE_ prefix, or as a fallback after deploy.
 *
 * Note: This is not Next.js — `export const dynamic = 'force-dynamic'` does not apply here.
 * Fresh values rely on Cache-Control: no-store (below) and Vercel not caching serverless responses.
 */
import process from 'node:process'

function readEnvTrimmed(key: string): string {
  try {
    const v = process.env[key]
    return typeof v === 'string' ? v.trim() : ''
  } catch {
    return ''
  }
}

/** Accepts any http(s) absolute URL (hosted Supabase, local CLI, or custom domain). */
function normalizeSupabaseUrl(raw: string): string {
  const s = raw.trim()
  if (!s) return ''
  try {
    const u = new URL(s)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return ''
    if (!u.hostname) return ''
    return s
  } catch {
    return ''
  }
}

export default function handler(
  _req: { method?: string },
  res: {
    status: (code: number) => {
      json: (body: unknown) => void
      end: (body?: string) => void
    }
    setHeader: (name: string, value: string) => void
  },
): void {
  const urlRaw =
    readEnvTrimmed('VITE_SUPABASE_URL') || readEnvTrimmed('SUPABASE_URL')
  const anonKeyRaw =
    readEnvTrimmed('VITE_SUPABASE_ANON_KEY') ||
    readEnvTrimmed('SUPABASE_ANON_KEY')

  const url = normalizeSupabaseUrl(urlRaw)
  const anonKey = anonKeyRaw.length > 0 ? anonKeyRaw : ''

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  )
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.status(200).json({
    url,
    anonKey,
    /** True when both URL and anon key look usable (client can connect). */
    configured: Boolean(url && anonKey),
  })
}
