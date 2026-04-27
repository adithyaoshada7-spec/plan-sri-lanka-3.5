const columns = [
  {
    title: 'Support',
    links: ['Help Centre', 'Safety information', 'Cancellation options'],
  },
  {
    title: 'Discover',
    links: ['Colombo city guide', 'Seasonal deals', 'Travel articles'],
  },
  {
    title: 'Hosting',
    links: ['List your property', 'Resources for hosts', 'Community forum'],
  },
  {
    title: 'Company',
    links: ['About plan-srilanka', 'Careers', 'Press centre'],
  },
] as const

export function Footer() {
  return (
    <footer className="bg-[#001b4d] text-white">
      <div className="mx-auto max-w-[1140px] px-4 py-12 md:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="m-0 text-sm font-bold uppercase tracking-wide text-white/90">
                {col.title}
              </h3>
              <ul className="mt-4 list-none space-y-2 p-0">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-white/80 no-underline hover:text-white hover:underline"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-white/20 pt-8 text-center text-xs text-white/60">
          <p className="m-0">
            © 2026 Plan-SriLanka.com | Dedicated to providing safe, reliable, and
            unforgettable journeys across the wonder of Asia.
          </p>
        </div>
      </div>
    </footer>
  )
}
