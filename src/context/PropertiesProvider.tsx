import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { featuredStays, type Property } from '../data/properties'
import { defaultRoomOptions, type RoomOption } from '../data/availability'
import {
  AVAILABILITY_STORAGE_KEY,
  PROPERTIES_STORAGE_KEY,
} from '../admin/constants'
import { PropertiesContext } from './propertiesContext'
import {
  SITE_CONTENT_ROW_ID,
  fetchSiteContent,
  saveSiteContent,
} from '../lib/siteContent'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'

const SAVE_DEBOUNCE_MS = 600

/** Legacy localStorage key for removed “Explore Sri Lanka” section. */
const LEGACY_DESTINATIONS_STORAGE_KEY = 'plan-srilanka-trending-destinations'

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

/** Supabase is source of truth; drop leftover local-only copies (not read in cloud mode). */
function clearUnusedLocalSiteContentCache() {
  try {
    localStorage.removeItem(PROPERTIES_STORAGE_KEY)
    localStorage.removeItem(AVAILABILITY_STORAGE_KEY)
    localStorage.removeItem(LEGACY_DESTINATIONS_STORAGE_KEY)
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
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
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

  const [initialLoadDone, setInitialLoadDone] = useState(!cloudMode)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const clearSaveError = useCallback(() => setSaveError(null), [])

  const loadFromSupabase = useCallback(
    async (isCancelled?: () => boolean) => {
      setLoadError(null)
      const { data: row, error: fetchErr } = await fetchSiteContent()
      if (isCancelled?.()) return
      if (fetchErr) setLoadError(fetchErr)
      if (row) {
        if (row.properties.length > 0) {
          setProperties(row.properties)
          setRoomOptionsByProperty(row.roomOptionsByProperty)
        }
      }
      setInitialLoadDone(true)
    },
    [],
  )

  useEffect(() => {
    if (!cloudMode) return
    clearUnusedLocalSiteContentCache()
  }, [cloudMode])

  useEffect(() => {
    if (!cloudMode) return

    let cancelled = false
    const isCancelled = () => cancelled

    queueMicrotask(() => {
      void loadFromSupabase(isCancelled)
    })

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        queueMicrotask(() => {
          void loadFromSupabase(isCancelled)
        })
      }
    }
    window.addEventListener('pageshow', onPageShow)

    return () => {
      cancelled = true
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [cloudMode, loadFromSupabase])

  /** Tab focus / bfcache: reload site content so Supabase dashboard edits show up (not on /admin to avoid clobbering edits). */
  useEffect(() => {
    if (!cloudMode || isAdminRoute) return

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      void loadFromSupabase()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [cloudMode, isAdminRoute, loadFromSupabase])

  /**
   * When Realtime is enabled for `site_content`, push updates without waiting for navigation.
   * If the table is not in the `supabase_realtime` publication, the channel simply receives no events.
   */
  useEffect(() => {
    if (!cloudMode || isAdminRoute) return
    const supabase = getSupabase()
    if (!supabase) return

    const filter = `id=eq.${SITE_CONTENT_ROW_ID}`
    const channel = supabase
      .channel('site_content_live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_content',
          filter,
        },
        () => {
          void loadFromSupabase()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [cloudMode, isAdminRoute, loadFromSupabase])

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

        const { error } = await saveSiteContent(
          properties,
          roomOptionsByProperty,
        )
        if (error) setSaveError(error)
        else setSaveError(null)
      })()
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [cloudMode, initialLoadDone, properties, roomOptionsByProperty])

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
            taxNote: '+USD 0 taxes and fees',
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
    const nextProps = [...featuredStays]
    const nextRooms = buildDefaultAvailabilityByProperty(featuredStays)
    setProperties(nextProps)
    setRoomOptionsByProperty(nextRooms)

    if (!cloudMode) {
      localStorage.removeItem(PROPERTIES_STORAGE_KEY)
      localStorage.removeItem(AVAILABILITY_STORAGE_KEY)
      localStorage.removeItem(LEGACY_DESTINATIONS_STORAGE_KEY)
      return
    }

    void (async () => {
      const supabase = getSupabase()
      if (!supabase) return
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      const { error } = await saveSiteContent(nextProps, nextRooms)
      if (error) setSaveError(error)
      else setSaveError(null)
    })()
  }, [cloudMode])

  const value = useMemo(
    () => ({
      properties,
      roomOptionsByProperty,
      updateProperty,
      updateRoomOption,
      addRoomOption,
      removeRoomOption,
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
      updateProperty,
      updateRoomOption,
      addRoomOption,
      removeRoomOption,
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
