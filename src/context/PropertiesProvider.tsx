import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { featuredStays, type Property } from '../data/properties'
import { defaultRoomOptions, type RoomOption } from '../data/availability'
import {
  AVAILABILITY_STORAGE_KEY,
  PROPERTIES_STORAGE_KEY,
} from '../admin/constants'
import { PropertiesContext } from './propertiesContext'

function loadFromStorage(): Property[] | null {
  try {
    const raw = localStorage.getItem(PROPERTIES_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return null
    return data as Property[]
  } catch {
    return null
  }
}

function buildDefaultAvailabilityByProperty(properties: Property[]) {
  return Object.fromEntries(
    properties.map((property) => [
      property.id,
      defaultRoomOptions.map((option) => ({
        ...option,
        choices: [...option.choices],
      })),
    ]),
  ) as Record<string, RoomOption[]>
}

function loadAvailabilityByPropertyFromStorage(
  properties: Property[],
): Record<string, RoomOption[]> | null {
  try {
    const raw = localStorage.getItem(AVAILABILITY_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as unknown

    // Migration: old storage used one shared RoomOption[] for all properties.
    if (Array.isArray(data)) {
      const shared = data as RoomOption[]
      return Object.fromEntries(
        properties.map((property) => [
          property.id,
          shared.map((option) => ({ ...option, choices: [...option.choices] })),
        ]),
      ) as Record<string, RoomOption[]>
    }

    if (!data || typeof data !== 'object') return null

    const byProperty = data as Record<string, unknown>
    const defaults = buildDefaultAvailabilityByProperty(properties)

    for (const property of properties) {
      const rawOptions = byProperty[property.id]
      if (Array.isArray(rawOptions)) {
        defaults[property.id] = rawOptions as RoomOption[]
      }
    }

    return defaults
  } catch {
    return null
  }
}

export function PropertiesProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(
    () => loadFromStorage() ?? featuredStays,
  )
  const [roomOptionsByProperty, setRoomOptionsByProperty] = useState<
    Record<string, RoomOption[]>
  >(
    () =>
      loadAvailabilityByPropertyFromStorage(properties) ??
      buildDefaultAvailabilityByProperty(properties),
  )

  useEffect(() => {
    localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(properties))
  }, [properties])
  useEffect(() => {
    localStorage.setItem(
      AVAILABILITY_STORAGE_KEY,
      JSON.stringify(roomOptionsByProperty),
    )
  }, [roomOptionsByProperty])

  const updateProperty = useCallback((id: string, next: Property) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...next, id: p.id } : p)),
    )
  }, [])

  const updateRoomOption = useCallback(
    (propertyId: string, id: string, next: RoomOption) => {
      setRoomOptionsByProperty((prev) => ({
        ...prev,
        [propertyId]: (prev[propertyId] ?? []).map((r) =>
          r.id === id ? { ...next, id: r.id } : r,
        ),
      }))
    },
    [],
  )

  const addRoomOption = useCallback((propertyId: string) => {
    setRoomOptionsByProperty((prev) => {
      const current = prev[propertyId] ?? []
      const maxId = current.reduce((max, item) => {
        const n = parseInt(item.id, 10)
        return Number.isFinite(n) ? Math.max(max, n) : max
      }, 0)
      const nextId = String(maxId + 1)
      return {
        ...prev,
        [propertyId]: [
          ...current,
          {
            id: nextId,
            roomType: 'New room option',
            guests: 2,
            price: 0,
            originalPrice: 0,
            taxNote: '+LKR 0 taxes and fees',
            choices: ['Add benefits here'],
          },
        ],
      }
    })
  }, [])

  const removeRoomOption = useCallback((propertyId: string, id: string) => {
    setRoomOptionsByProperty((prev) => ({
      ...prev,
      [propertyId]: (prev[propertyId] ?? []).filter((row) => row.id !== id),
    }))
  }, [])

  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(PROPERTIES_STORAGE_KEY)
    localStorage.removeItem(AVAILABILITY_STORAGE_KEY)
    setProperties([...featuredStays])
    setRoomOptionsByProperty(buildDefaultAvailabilityByProperty(featuredStays))
  }, [])

  const value = useMemo(
    () => ({
      properties,
      roomOptionsByProperty,
      updateProperty,
      updateRoomOption,
      addRoomOption,
      removeRoomOption,
      resetToDefaults,
    }),
    [
      properties,
      roomOptionsByProperty,
      updateProperty,
      updateRoomOption,
      addRoomOption,
      removeRoomOption,
      resetToDefaults,
    ],
  )

  return (
    <PropertiesContext.Provider value={value}>
      {children}
    </PropertiesContext.Provider>
  )
}
