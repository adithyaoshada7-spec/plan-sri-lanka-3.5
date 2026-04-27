/** Column titles for the admin Easy Availability Manager table; optional per-property overrides. */
export type AvailabilityQuickColumnLabels = {
  roomType: string
  guests: string
  price: string
  original: string
  taxNote: string
  choices: string
  selectRooms: string
}

export const DEFAULT_AVAILABILITY_QUICK_COLUMN_LABELS: AvailabilityQuickColumnLabels =
  {
    roomType: 'Room type',
    guests: 'Guests',
    price: 'Price',
    original: 'Original',
    taxNote: 'Tax note',
    choices: 'Choices',
    selectRooms: 'Select rooms',
  }

export function resolveAvailabilityQuickColumnLabels(
  partial: Partial<AvailabilityQuickColumnLabels> | undefined,
): AvailabilityQuickColumnLabels {
  const merged = {
    ...DEFAULT_AVAILABILITY_QUICK_COLUMN_LABELS,
    ...partial,
  }
  return {
    roomType:
      merged.roomType.trim() ||
      DEFAULT_AVAILABILITY_QUICK_COLUMN_LABELS.roomType,
    guests:
      merged.guests.trim() ||
      DEFAULT_AVAILABILITY_QUICK_COLUMN_LABELS.guests,
    price:
      merged.price.trim() || DEFAULT_AVAILABILITY_QUICK_COLUMN_LABELS.price,
    original:
      merged.original.trim() ||
      DEFAULT_AVAILABILITY_QUICK_COLUMN_LABELS.original,
    taxNote:
      merged.taxNote.trim() ||
      DEFAULT_AVAILABILITY_QUICK_COLUMN_LABELS.taxNote,
    choices:
      merged.choices.trim() ||
      DEFAULT_AVAILABILITY_QUICK_COLUMN_LABELS.choices,
    selectRooms:
      merged.selectRooms.trim() ||
      DEFAULT_AVAILABILITY_QUICK_COLUMN_LABELS.selectRooms,
  }
}

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
  /** Admin-only overrides for Easy Availability Manager header cells. */
  availabilityQuickColumnLabels?: Partial<AvailabilityQuickColumnLabels>
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
