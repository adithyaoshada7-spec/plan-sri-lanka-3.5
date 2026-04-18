export function PromoBanner() {
  return (
    <section className="border-t border-neutral-200 bg-[#e7f1ff] py-12">
      <div className="mx-auto flex max-w-[1140px] flex-col items-start gap-4 px-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <h2 className="m-0 text-2xl font-bold text-[#003b95]">
            Save on stays across the island
          </h2>
          <p className="m-0 mt-2 max-w-xl text-neutral-700">
            Sign in to unlock member prices, flexible cancellation on select
            stays, and personalised picks for your trip.
          </p>
        </div>
        <a
          href="#"
          className="inline-flex rounded-md bg-[#003b95] px-6 py-3 font-semibold text-white no-underline hover:bg-[#002a6b]"
        >
          Sign in or register
        </a>
      </div>
    </section>
  )
}
