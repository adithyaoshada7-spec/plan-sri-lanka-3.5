import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { useProperties } from '../context/useProperties'
import {
  findPropertyByUrlSegment,
  propertyUrlSegment,
  resolveAvailabilityQuickColumnLabels,
} from '../data/properties'

function usd(value: number) {
  return `USD ${value.toLocaleString()}`
}

const WHATSAPP_PHONE =
  (import.meta.env.VITE_WHATSAPP_PHONE as string | undefined)?.replace(
    /\D/g,
    '',
  ) || '94722968210'

function whatsappReserveUrl(propertyName: string, roomType: string) {
  const text = `Hi, I'd like to reserve: ${roomType} at ${propertyName}`
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`
}

function renderBoldMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    const match = /^\*\*([^*]+)\*\*$/.exec(part)
    if (match) {
      return <strong key={`bold-${index}`}>{match[1]}</strong>
    }
    return part
  })
}

function toPlainText(input: string) {
  return input
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateForMeta(input: string, max = 160) {
  if (input.length <= max) return input
  return `${input.slice(0, max - 1).trimEnd()}…`
}

function setOrCreateMetaTag(
  key: 'name' | 'property',
  value: string,
  content: string,
) {
  const selector = `meta[${key}="${value}"]`
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(key, value)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setOrCreateCanonicalTag(href: string) {
  let link = document.head.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

export function PropertyDetailPage() {
  const { propertyId: urlSegment } = useParams<{ propertyId: string }>()
  const { properties, roomOptionsByProperty } = useProperties()

  const property = findPropertyByUrlSegment(properties, urlSegment)
  const roomOptions =
    property ? roomOptionsByProperty[property.id] ?? [] : []

  if (!property) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Header />
        <main className="mx-auto max-w-[1140px] px-4 py-16 md:px-6">
          <h1 className="m-0 text-3xl font-bold text-neutral-900">
            Property not found
          </h1>
          <p className="mt-3 text-neutral-600">
            This listing may have been removed or the link is incorrect.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block font-semibold text-[#003b95] no-underline hover:underline"
          >
            Back to homes guests love
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const availabilityColumnLabels = resolveAvailabilityQuickColumnLabels(
    property.availabilityQuickColumnLabels,
  )
  const proTipText =
    property.proTip?.trim() ||
    `Booking mid-week often unlocks better rates and quieter stays. If your dates are flexible, compare one or two weekdays before reserving to get the best value at ${property.name}.`
  const plainProTip = toPlainText(proTipText)

  useEffect(() => {
    const previousTitle = document.title
    const segment = propertyUrlSegment(property)
    const canonicalUrl = `${window.location.origin}/property/${segment}`
    const metaDescription = truncateForMeta(
      `${property.name} in ${property.city}. ${property.scoreLabel} stay with ${property.reviewCount.toLocaleString()} reviews. Pro Tip: ${plainProTip}`,
    )

    document.title = `${property.name} | plan-srilanka`
    setOrCreateMetaTag('name', 'description', metaDescription)
    setOrCreateMetaTag('property', 'og:title', `${property.name} | plan-srilanka`)
    setOrCreateMetaTag('property', 'og:description', metaDescription)
    setOrCreateMetaTag('property', 'og:type', 'article')
    setOrCreateMetaTag('property', 'og:url', canonicalUrl)
    setOrCreateMetaTag('property', 'og:image', property.heroImage ?? property.image)
    setOrCreateCanonicalTag(canonicalUrl)

    return () => {
      document.title = previousTitle
    }
  }, [property, plainProTip])

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />
      <main className="mx-auto max-w-[1140px] px-4 py-10 md:px-6">
        <Link
          to="/"
          className="font-semibold text-[#003b95] no-underline hover:underline"
        >
          ← Back to homes
        </Link>

        <section className="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="aspect-[16/7] w-full overflow-hidden bg-neutral-200">
            <img
              src={property.heroImage ?? property.image}
              alt={property.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="p-6 md:p-8">
            <h1 className="m-0 text-3xl font-bold text-neutral-900">
              {property.name}
            </h1>
            <p className="mt-2 text-neutral-600">{property.city}, Sri Lanka</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="m-0 text-xs uppercase tracking-wide text-neutral-500">
                  Guest score
                </p>
                <p className="m-0 mt-2 text-2xl font-bold text-neutral-900">
                  {property.rating} ({property.scoreLabel})
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="m-0 text-xs uppercase tracking-wide text-neutral-500">
                  Reviews
                </p>
                <p className="m-0 mt-2 text-2xl font-bold text-neutral-900">
                  {property.reviewCount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="m-0 text-xs uppercase tracking-wide text-neutral-500">
                  From
                </p>
                <p className="m-0 mt-2 text-2xl font-bold text-neutral-900">
                  {property.currency} {property.pricePerNight}
                </p>
                <p className="m-0 text-sm text-neutral-500">per night</p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="m-0 text-xs uppercase tracking-wide text-neutral-500">
                  Category
                </p>
                <p className="m-0 mt-2 text-lg font-semibold text-neutral-900">
                  {property.stars ? `${property.stars}-star stay` : 'Top-rated stay'}
                </p>
                {property.badge && (
                  <p className="m-0 mt-1 text-sm text-[#003b95]">{property.badge}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm md:p-6">
          <h2 className="m-0 text-2xl font-bold text-neutral-900">Availability</h2>
          <p className="mt-1 text-neutral-600">
            Pick a package option and reserve your stay at {property.name}.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-700">
            <span className="font-semibold">Filter by:</span>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Rooms
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" />
              Suites
            </label>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[920px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#2c5e9e] text-white">
                  <th className="border border-[#9eb8d9] p-3">
                    {availabilityColumnLabels.roomType}
                  </th>
                  <th className="border border-[#9eb8d9] p-3">
                    {availabilityColumnLabels.guests}
                  </th>
                  <th className="border border-[#9eb8d9] p-3">
                    {availabilityColumnLabels.price}
                  </th>
                  <th className="border border-[#9eb8d9] p-3">
                    {availabilityColumnLabels.choices}
                  </th>
                  <th className="border border-[#9eb8d9] p-3">
                    {availabilityColumnLabels.selectRooms}
                  </th>
                </tr>
              </thead>
              <tbody>
                {roomOptions.map((option) => (
                  <tr key={option.id} className="align-top">
                    <td className="border border-neutral-200 p-3">
                      <p className="m-0 font-semibold text-[#003b95] underline">
                        {option.roomType}
                      </p>
                      <p className="mt-2 text-neutral-600">
                        Free toiletries, private bathroom, and air conditioning.
                      </p>
                    </td>
                    <td className="border border-neutral-200 p-3 font-semibold text-neutral-900">
                      {option.guests} guests
                    </td>
                    <td className="border border-neutral-200 p-3">
                      <p className="m-0 text-xs text-neutral-500 line-through">
                        {usd(option.originalPrice)}
                      </p>
                      <p className="m-0 mt-1 text-2xl font-bold text-neutral-900">
                        {usd(option.price)}
                      </p>
                      <p className="m-0 mt-1 text-xs text-neutral-500">
                        {option.taxNote}
                      </p>
                      <span className="mt-2 inline-block rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white">
                        25% off
                      </span>
                    </td>
                    <td className="border border-neutral-200 p-3">
                      <ul className="m-0 list-none space-y-1 p-0 text-green-700">
                        {option.choices.map((choice) => (
                          <li key={choice}>✓ {choice}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="border border-neutral-200 p-3">
                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          className="rounded bg-[#0071c2] px-3 py-2 font-semibold text-white hover:bg-[#005e9f]"
                        >
                          I&apos;ll reserve
                        </button>
                        <a
                          href={whatsappReserveUrl(property.name, option.roomType)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded bg-[#25D366] px-3 py-2 text-center text-sm font-semibold text-white no-underline hover:bg-[#20bd5a]"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          WhatsApp
                        </a>
                        <p className="m-0 text-xs text-neutral-500">
                          You won&apos;t be charged yet
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h3 className="m-0 flex items-center gap-2 text-xl font-bold text-amber-900">
            <span role="img" aria-label="Pro tip">
              💡
            </span>
            Pro Tip
          </h3>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-amber-900 sm:text-base">
            {renderBoldMarkdown(proTipText)}
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
