import { Link } from 'react-router-dom'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-[1140px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link to="/" className="flex shrink-0 items-baseline gap-1 no-underline">
          <span className="text-2xl font-bold tracking-tight text-[#003b95]">
            plan
          </span>
          <span className="text-2xl font-semibold tracking-tight text-[#ffb700]">
            srilanka
          </span>
        </Link>

        <nav
          className="order-3 flex w-full gap-1 md:order-none md:w-auto md:flex-1 md:justify-center"
          aria-label="Main"
        >
          <Link
            to="/"
            className="whitespace-nowrap rounded-full border border-[#003b95] bg-[#e7f1ff] px-3 py-2 text-sm font-medium text-[#003b95] no-underline"
          >
            Stays
          </Link>
        </nav>

        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            className="hidden rounded-md px-2 py-1.5 font-medium text-[#003b95] hover:bg-neutral-100 sm:inline"
          >
            USD
          </button>
          <button
            type="button"
            className="hidden rounded-md px-2 py-1.5 font-medium text-[#003b95] hover:bg-neutral-100 lg:inline"
          >
            List your property
          </button>
        </div>
      </div>
    </header>
  )
}
