/**
 * Vercel Serverless: exposes public Supabase settings at runtime.
 * Use when env vars are set without VITE_ prefix, or as a fallback after deploy.
 */
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
  const url =
    process.env.VITE_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    ''
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    ''

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  )
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.status(200).json({ url, anonKey })
}
