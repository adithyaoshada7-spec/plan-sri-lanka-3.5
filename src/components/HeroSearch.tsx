const heroImage = '/images/hero-home.svg'

export function HeroSearch() {
  return (
    <section className="relative min-h-[280px] overflow-hidden md:min-h-[320px]">
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#001b4d]/80 via-[#003b95]/55 to-[#001b4d]/90" />

      <div className="relative mx-auto flex max-w-[1140px] flex-col px-4 py-14 md:px-6 md:py-20">
        <div className="max-w-2xl text-white">
          <h1 className="m-0 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            Find your next stay in Sri Lanka
          </h1>
        </div>
      </div>
    </section>
  )
}
