import { propertyUrlSegment, type Property } from '../data/properties'

type Props = {
  property: Property
  /** Receives the URL segment for `/property/:segment` (slug or listing id). */
  onSelect?: (propertyUrlSegment: string) => void
}

export function PropertyCard({ property: p, onSelect }: Props) {
  const isClickable = Boolean(onSelect)

  const handleSelect = () => {
    onSelect?.(propertyUrlSegment(p))
  }

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition ${
        isClickable ? 'cursor-pointer hover:shadow-md' : ''
      }`}
      onClick={isClickable ? handleSelect : undefined}
      onKeyDown={
        isClickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleSelect()
              }
            }
          : undefined
      }
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'link' : undefined}
      aria-label={isClickable ? `View details for ${p.name}` : undefined}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-200">
        <img
          src={p.image}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {p.badge && (
          <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-1 text-xs font-semibold text-[#003b95] shadow">
            {p.badge}
          </span>
        )}
        <button
          type="button"
          aria-label="Save property"
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-lg shadow hover:bg-neutral-50"
          onClick={(event) => event.stopPropagation()}
        >
          ♡
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="m-0 text-base font-semibold leading-snug text-neutral-900">
              {p.name}
            </h3>
            <p className="m-0 mt-0.5 text-sm text-neutral-600">{p.city}</p>
          </div>
          {p.stars != null && (
            <div className="flex shrink-0 gap-0.5 text-[#ffb700]" aria-hidden>
              {Array.from({ length: p.stars }).map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
          )}
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-neutral-100 pt-3">
          <div>
            <p className="m-0 text-xs text-neutral-500">{p.scoreLabel}</p>
            <p className="m-0 text-sm text-neutral-700">
              {p.reviewCount.toLocaleString()} reviews
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block rounded bg-[#003b95] px-2 py-1 text-sm font-bold text-white">
              {p.rating}
            </span>
            <p className="m-0 mt-1 text-sm font-semibold text-neutral-900">
              {p.currency} {p.pricePerNight}{' '}
              <span className="font-normal text-neutral-500">/ night</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}
