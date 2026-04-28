import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

type JsonLd = Record<string, unknown>

function safeJsonLdStringify(value: unknown): string {
  // Prevent `</script>` from prematurely closing the tag in HTML parsing.
  return JSON.stringify(value).replace(/<\/script/gi, '<\\/script')
}

function siteOrigin(): string {
  if (typeof window === 'undefined') return 'https://plan-srilanka.com'
  return window.location.origin
}

function pageUrl(pathname: string): string {
  const base = siteOrigin().replace(/\/+$/, '')
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${path}`
}

export function StructuredData() {
  const location = useLocation()

  const jsonLd = useMemo(() => {
    const origin = siteOrigin()
    const url = pageUrl(location.pathname)
    const modifiedIso =
      (import.meta.env.VITE_BUILD_TIME_ISO as string | undefined) ||
      new Date().toISOString()

    const graph: JsonLd[] = [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'plan-srilanka',
        url: origin,
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: origin,
        name: 'plan-srilanka',
        publisher: { '@id': `${origin}/#organization` },
        dateModified: modifiedIso,
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        isPartOf: { '@id': `${origin}/#website` },
        about: { '@id': `${origin}/#organization` },
        dateModified: modifiedIso,
      },
    ]

    return {
      '@context': 'https://schema.org',
      '@graph': graph,
    }
  }, [location.pathname])

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jsonLd) }}
    />
  )
}

