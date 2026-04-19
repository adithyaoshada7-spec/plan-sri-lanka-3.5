import { Link, useNavigate } from 'react-router-dom'
import { useProperties } from '../context/useProperties'
import { PropertyCard } from './PropertyCard'

export function PropertyGrid() {
  const { properties } = useProperties()
  const navigate = useNavigate()

  return (
    <section className="border-t border-neutral-200 bg-white py-10">
      <div className="mx-auto max-w-[1140px] px-4 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="m-0 text-2xl font-bold text-neutral-900">
              Homes guests love
            </h2>
            <p className="m-0 mt-1 text-neutral-600">
              Properties in Sri Lanka with top review scores
            </p>
          </div>
          <Link
            to="/admin?section=guest-love"
            className="font-semibold text-[#003b95] no-underline hover:underline"
          >
            Edit listings (admin)
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              onSelect={(propertyId) => navigate(`/property/${propertyId}`)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
