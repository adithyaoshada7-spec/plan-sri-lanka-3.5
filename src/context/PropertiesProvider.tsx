import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  defaultTrendingDestinations,
  featuredStays,
  type Property,
  type TrendingDestination,
} from '../data/properties'
import { defaultRoomOptions, type RoomOption } from '../data/availability'
import {
  AVAILABILITY_STORAGE_KEY,
  DESTINATIONS_STORAGE_KEY,
  PROPERTIES_STORAGE_KEY,
} from '../admin/constants'
import { PropertiesContext } from './propertiesContext'
import { fetchSiteContent, saveSiteContent } from '../lib/siteContent'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'

const SAVE_DEBOUNCE_MS = 600

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

function loadDestinationsFromStorage(): TrendingDestination[] | null {
  try {
    const raw = localStorage.getItem(DESTINATIONS_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return null
    return data as TrendingDestination[]
  } catch {
    return null
  }
}

/** When Supabase has no `trending_destinations` column, keep a browser backup. */
function persistDestinationsLocalBackup(destinations: TrendingDestination[]) {
  try {
    localStorage.setItem(
      DESTINATIONS_STORAGE_KEY,
      JSON.stringify(destinations),
    )
  } catch {
    /* quota / private mode */
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
  const cloudMode = isSupabaseConfigured()

  const [properties, setProperties] = useState<Property[]>(() =>
    cloudMode ? featuredStays : loadFromStorage() ?? featuredStays,
  )
  const [roomOptionsByProperty, setRoomOptionsByProperty] = useState<
    Record<string, RoomOption[]>
  >(() => {
    const propsForRooms = cloudMode
      ? featuredStays
      : loadFromStorage() ?? featuredStays
    return (
      cloudMode
        ? buildDefaultAvailabilityByProperty(featuredStays)
        : loadAvailabilityByPropertyFromStorage(propsForRooms) ??
          buildDefaultAvailabilityByProperty(propsForRooms)
    )
  })

  const [trendingDestinations, setTrendingDestinations] = useState<
    TrendingDestination[]
  >(() =>
    cloudMode
      ? defaultTrendingDestinations
      : loadDestinationsFromStorage() ?? defaultTrendingDestinations,
  )

  const [initialLoadDone, setInitialLoadDone] = useState(!cloudMode)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const clearSaveError = useCallback(() => setSaveError(null), [])

  useEffect(() => {
    if (!cloudMode) return

    let cancelled = false

    const loadFromSupabase = async () => {
      setLoadError(null)
      const { data: row, error: fetchErr } = await fetchSiteContent()
      if (cancelled) return
      if (fetchErr) setLoadError(fetchErr)
      if (row) {
        if (row.properties.length > 0) {
          setProperties(row.properties)
          setRoomOptionsByProperty(row.roomOptionsByProperty)
        }
        if (row.trendingColumnAvailable) {
          if (row.trendingDestinations != null) {
            setTrendingDestinations(row.trendingDestinations)
          } else {
            setTrendingDestinations(defaultTrendingDestinations)
          }
        } else {
          setTrendingDestinations(
            loadDestinationsFromStorage() ?? defaultTrendingDestinations,
          )
        }
      }
      setInitialLoadDone(true)
    }

    void loadFromSupabase()

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void loadFromSupabase()
    }
    window.addEventListener('pageshow', onPageShow)

    return () => {
      cancelled = true
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [cloudMode])

  useEffect(() => {
    if (cloudMode) return
    localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(properties))
  }, [properties, cloudMode])

  useEffect(() => {
    if (cloudMode) return
    localStorage.setItem(
      AVAILABILITY_STORAGE_KEY,
      JSON.stringify(roomOptionsByProperty),
    )
  }, [roomOptionsByProperty, cloudMode])

  useEffect(() => {
    if (cloudMode) return
    localStorage.setItem(
      DESTINATIONS_STORAGE_KEY,
      JSON.stringify(trendingDestinations),
    )
  }, [trendingDestinations, cloudMode])

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!cloudMode || !initialLoadDone) return

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null
      void (async () => {
        const supabase = getSupabase()
        if (!supabase) return
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        const { error, trendingPersistedToSupabase } = await saveSiteContent(
          properties,
          roomOptionsByProperty,
          trendingDestinations,
        )
        if (error) setSaveError(error)
        else {
          setSaveError(null)
          if (!trendingPersistedToSupabase) {
            persistDestinationsLocalBackup(trendingDestinations)
          }
        }
      })()
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [cloudMode, initialLoadDone, properties, roomOptionsByProperty, trendingDestinations])

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

  const updateTrendingDestination = useCallback(
    (id: string, next: TrendingDestination) => {
      setTrendingDestinations((prev) =>
        prev.map((d) => (d.id === id ? { ...next, id: d.id } : d)),
      )
    },
    [],
  )

  const addTrendingDestination = useCallback(() => {
    setTrendingDestinations((prev) => [
      ...prev,
      {
        id: `dest-${Date.now()}`,
        name: 'New destination',
        image: '/images/dest-colombo.svg',
      },
    ])
  }, [])

  const removeTrendingDestination = useCallback((id: string) => {
    setTrendingDestinations((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const resetTrendingDestinationsToDefaults = useCallback(() => {
    setTrendingDestinations([...defaultTrendingDestinations])
    if (!cloudMode) {
      localStorage.removeItem(DESTINATIONS_STORAGE_KEY)
      return
    }
    void (async () => {
      const supabase = getSupabase()
      if (!supabase) return
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      const { error, trendingPersistedToSupabase } = await saveSiteContent(
        properties,
        roomOptionsByProperty,
        defaultTrendingDestinations,
      )
      if (error) setSaveError(error)
      else {
        setSaveError(null)
        if (!trendingPersistedToSupabase) {
          persistDestinationsLocalBackup(defaultTrendingDestinations)
        }
      }
    })()
  }, [cloudMode, properties, roomOptionsByProperty])

  const resetToDefaults = useCallback(() => {
    const nextProps = [...featuredStays]
    const nextRooms = buildDefaultAvailabilityByProperty(featuredStays)
    const nextDest = [...defaultTrendingDestinations]
    setProperties(nextProps)
    setRoomOptionsByProperty(nextRooms)
    setTrendingDestinations(nextDest)

    if (!cloudMode) {
      localStorage.removeItem(PROPERTIES_STORAGE_KEY)
      localStorage.removeItem(AVAILABILITY_STORAGE_KEY)
      localStorage.removeItem(DESTINATIONS_STORAGE_KEY)
      return
    }

    void (async () => {
      const supabase = getSupabase()
      if (!supabase) return
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      const { error, trendingPersistedToSupabase } = await saveSiteContent(
        nextProps,
        nextRooms,
        nextDest,
      )
      if (error) setSaveError(error)
      else {
        setSaveError(null)
        if (!trendingPersistedToSupabase) {
          persistDestinationsLocalBackup(nextDest)
        }
      }
    })()
  }, [cloudMode])

  const value = useMemo(
    () => ({
      properties,
      roomOptionsByProperty,
      trendingDestinations,
      updateProperty,
      updateRoomOption,
      addRoomOption,
      removeRoomOption,
      updateTrendingDestination,
      addTrendingDestination,
      removeTrendingDestination,
      resetTrendingDestinationsToDefaults,
      resetToDefaults,
      cloudMode,
      initialLoadDone,
      loadError,
      saveError,
      clearSaveError,
    }),
    [
      properties,
      roomOptionsByProperty,
      trendingDestinations,
      updateProperty,
      updateRoomOption,
      addRoomOption,
      removeRoomOption,
      updateTrendingDestination,
      addTrendingDestination,
      removeTrendingDestination,
      resetTrendingDestinationsToDefaults,
      resetToDefaults,
      cloudMode,
      initialLoadDone,
      loadError,
      saveError,
      clearSaveError,
    ],
  )

  return (
    <PropertiesContext.Provider value={value}>
      {children}
    </PropertiesContext.Provider>
  )
}
