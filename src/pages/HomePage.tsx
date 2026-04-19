import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { HeroSearch } from '../components/HeroSearch'
import { PromoBanner } from '../components/PromoBanner'
import { PropertyGrid } from '../components/PropertyGrid'
import { WelcomeBanner } from '../components/WelcomeBanner'

export function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />
      <WelcomeBanner />
      <main>
        <HeroSearch />
        <PropertyGrid />
        <PromoBanner />
      </main>
      <Footer />
    </div>
  )
}
