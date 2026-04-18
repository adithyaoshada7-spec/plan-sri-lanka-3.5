import { trendingDestinations } from '../data/properties'

export function DestinationsRow() {
  return (
    <section className="mx-auto max-w-[1140px] px-4 py-10 md:px-6">
      <h2 className="m-0 text-2xl font-bold text-neutral-900">
        Explore Sri Lanka
      </h2>
      <p className="mt-1 text-neutral-600">
        Popular destinations travellers pick on plan-srilanka
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {trendingDestinations.map((d) => (
          <a
            key={d.name}
            href="#"
            className="group relative aspect-[4/3] overflow-hidden rounded-lg shadow-md no-underline"
          >
            <img
              src={d.image}
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute bottom-3 left-3 text-lg font-bold text-white">
              {d.name}
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
