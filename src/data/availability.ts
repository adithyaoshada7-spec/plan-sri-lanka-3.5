export type RoomOption = {
  id: string
  roomType: string
  guests: number
  price: number
  originalPrice: number
  taxNote: string
  choices: string[]
}

export const defaultRoomOptions: RoomOption[] = [
  {
    id: '1',
    roomType: 'Superior City View Twin Room',
    guests: 2,
    price: 61996,
    originalPrice: 82664,
    taxNote: '+LKR 20,221 taxes and fees',
    choices: [
      'Very good breakfast included',
      'Includes 15% off food/drink + parking + high-speed internet',
      'Free cancellation',
      'No prepayment needed - pay at the property',
    ],
  },
  {
    id: '2',
    roomType: 'Deluxe Ocean View Double Room',
    guests: 2,
    price: 64362,
    originalPrice: 85816,
    taxNote: '+LKR 20,992 taxes and fees',
    choices: [
      'Breakfast and dinner included',
      'Includes 15% off food/drink + parking + high-speed internet',
      'Free cancellation',
      'No prepayment needed - pay at the property',
    ],
  },
  {
    id: '3',
    roomType: 'Family Suite with Balcony',
    guests: 4,
    price: 83292,
    originalPrice: 111056,
    taxNote: '+LKR 27,166 taxes and fees',
    choices: [
      'Breakfast, lunch and dinner included',
      'Includes 15% off food/drink + parking + high-speed internet',
      'Free cancellation',
      'No prepayment needed - pay at the property',
    ],
  },
]
