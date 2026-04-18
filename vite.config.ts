import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { featuredStays } from './src/data/properties'

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
        env.SITE_URL || process.env.SITE_URL || 'https://example.com',
      )

      const staticUrls = [`${siteUrl}/`]
      const propertyUrls = featuredStays.map(
        (p) => `${siteUrl}/property/${p.id}`,
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
export default defineConfig({
  plugins: [react(), tailwindcss(), sitemapPlugin()],
})
