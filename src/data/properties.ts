export type Property = {
  id: string
  name: string
  city: string
  rating: number
  reviewCount: number
  scoreLabel: string
  pricePerNight: number
  currency: string
  /** Shown on listing cards (home grid). */
  image: string
  /** Optional larger photo for the property detail hero; falls back to `image` if omitted. */
  heroImage?: string
  stars?: number
  badge?: string
}

export const featuredStays: Property[] = [
  {
    id: '1',
    name: 'Galle Face Ocean Suites',
    city: 'Colombo',
    rating: 9.2,
    reviewCount: 2840,
    scoreLabel: 'Wonderful',
    pricePerNight: 189,
    currency: 'USD',
    image: '/images/stay-1.svg',
    stars: 5,
    badge: 'Genius discount',
  },
  {
    id: '2',
    name: 'Tea Country Lodge — Ella',
    city: 'Ella',
    rating: 9.6,
    reviewCount: 912,
    scoreLabel: 'Exceptional',
    pricePerNight: 112,
    currency: 'USD',
    image: '/images/stay-2.svg',
    badge: 'Breakfast included',
  },
  {
    id: '3',
    name: 'Sigiriya Rock View Resort',
    city: 'Dambulla',
    rating: 8.9,
    reviewCount: 1543,
    scoreLabel: 'Excellent',
    pricePerNight: 96,
    currency: 'USD',
    image: '/images/stay-3.svg',
    stars: 4,
  },
  {
    id: '4',
    name: 'Mirissa Palm Villas',
    city: 'Mirissa',
    rating: 9.4,
    reviewCount: 667,
    scoreLabel: 'Wonderful',
    pricePerNight: 134,
    currency: 'USD',
    image: '/images/stay-4.svg',
  },
  {
    id: '5',
    name: 'Kandy Hills Boutique Hotel',
    city: 'Kandy',
    rating: 8.7,
    reviewCount: 2102,
    scoreLabel: 'Excellent',
    pricePerNight: 78,
    currency: 'USD',
    image: '/images/stay-5.svg',
    stars: 4,
    badge: 'Free cancellation',
  },
  {
    id: '6',
    name: 'Negombo Lagoon Retreat',
    city: 'Negombo',
    rating: 8.5,
    reviewCount: 445,
    scoreLabel: 'Very good',
    pricePerNight: 64,
    currency: 'USD',
    image: '/images/stay-6.svg',
  },
]

export const trendingDestinations = [
  { name: 'Colombo', image: '/images/dest-colombo.svg' },
  { name: 'Kandy', image: '/images/dest-kandy.svg' },
  { name: 'Galle', image: '/images/dest-galle.svg' },
  { name: 'Ella', image: '/images/dest-ella.svg' },
]
