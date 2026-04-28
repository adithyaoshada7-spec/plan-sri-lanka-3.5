import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { featuredStays, propertyUrlSegment } from './src/data/properties'

function normalizeSiteUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '')
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed.replace(/^\/+/, '')}`
  }
  return trimmed
}

function sitemapPlugin(): Plugin {
  let outDir = 'dist'
  let mode = 'production'

  return {
    name: 'generate-sitemap',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
      mode = config.mode
    },
    closeBundle() {
      const env = loadEnv(mode, process.cwd(), '')
      const siteUrl = normalizeSiteUrl(
        env.SITE_URL || process.env.SITE_URL || 'https://plan-srilanka.com',
      )

      const staticUrls = [`${siteUrl}/`]
      const propertyUrls = featuredStays.map(
        (p) => `${siteUrl}/property/${propertyUrlSegment(p)}`,
      )

      const urlEntries = [
        ...staticUrls.map(
          (loc) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`,
        ),
        ...propertyUrls.map(
          (loc) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
        ),
      ].join('\n')

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`

      const robots = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${siteUrl}/sitemap.xml
`

      const outPath = resolve(process.cwd(), outDir)
      writeFileSync(resolve(outPath, 'sitemap.xml'), sitemap, 'utf8')
      writeFileSync(resolve(outPath, 'robots.txt'), robots, 'utf8')
    },
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Prefer process.env (CI / Vercel build) then .env files. Allow SUPABASE_* without VITE_.
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    ''
  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    ''
  const supabaseReady = Boolean(
    supabaseUrl.trim() && supabaseAnonKey.trim(),
  )

  if (process.env.VERCEL === '1' && mode === 'production' && !supabaseReady) {
    console.warn(
      '\n[plan-srilanka] No Supabase URL/key at build time (checked VITE_SUPABASE_* and SUPABASE_*). ' +
        'The client bundle may be empty until /api/supabase-config runs on Vercel. ' +
        'Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (or SUPABASE_URL + SUPABASE_ANON_KEY) ' +
        'under Project → Settings → Environment Variables for Production, then redeploy.\n',
    )
  }

  return {
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
    plugins: [react(), tailwindcss(), sitemapPlugin()],
  }
})
