import { createContext } from 'react'
import type { Property, TrendingDestination } from '../data/properties'
import type { RoomOption } from '../data/availability'

export type PropertiesContextValue = {
  properties: Property[]
  roomOptionsByProperty: Record<string, RoomOption[]>
  trendingDestinations: TrendingDestination[]
  updateProperty: (id: string, next: Property) => void
  updateRoomOption: (propertyId: string, id: string, next: RoomOption) => void
  addRoomOption: (propertyId: string) => void
  removeRoomOption: (propertyId: string, id: string) => void
  updateTrendingDestination: (id: string, next: TrendingDestination) => void
  addTrendingDestination: () => void
  removeTrendingDestination: (id: string) => void
  resetTrendingDestinationsToDefaults: () => void
  resetToDefaults: () => void
  /** True when VITE_SUPABASE_* env is set — data loads/saves from Supabase. */
  cloudMode: boolean
  /** False until first remote fetch attempt finishes (cloud only). */
  initialLoadDone: boolean
  loadError: string | null
  saveError: string | null
  clearSaveError: () => void
}

export const PropertiesContext = createContext<PropertiesContextValue | null>(
  null,
)
