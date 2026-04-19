import type { RoomOption } from '../data/availability'
import type { Property } from '../data/properties'
import { getSupabase } from './supabaseClient'

/** Logical id of the singleton `site_content` row (for docs / future env wiring). */
export const SITE_CONTENT_ID = 1

/**
 * Validated primary key for PostgREST `.eq('id', …)` and Realtime `filter` strings.
 * PostgREST builds filters as `eq.${value}`; `undefined` becomes `eq.undefined` and fails to parse.
 */
export const SITE_CONTENT_ROW_ID: number = (() => {
  const n = Number(SITE_CONTENT_ID)
  if (!Number.isFinite(n)) {
    throw new Error(
      'siteContent: SITE_CONTENT_ID must be a finite number (see src/lib/siteContent.ts).',
    )
  }
  return n
})()

export type SiteContentPayload = {
  properties: Property[]
  roomOptionsByProperty: Record<string, RoomOption[]>
}

/** PostgREST / Postgres errors when `trending_destinations` is not in the remote schema yet. */
function missingTrendingDestinationsColumnError(
  err: { message?: string } | null | undefined,
): boolean {
  const m = err?.message ?? ''
  if (!m.includes('trending_destinations')) return false
  return (
    m.includes('does not exist') ||
    m.includes('schema cache') ||
    m.includes('Could not find')
  )
}

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
} as const

export async function fetchSiteContent(): Promise<{
  data: SiteContentPayload | null
  error: string | null
}> {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: null }

  type SiteRow = {
    properties: unknown
    room_options_by_property: unknown
  }

  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .eq('id', SITE_CONTENT_ROW_ID)
    .setHeader('Cache-Control', NO_CACHE_HEADERS['Cache-Control'])
    .setHeader('Pragma', NO_CACHE_HEADERS.Pragma)
    .maybeSingle()

  if (error) {
    console.error('fetchSiteContent', error.message)
    return { data: null, error: error.message }
  }
  if (!data) return { data: null, error: null }

  const row = data as SiteRow
  const { properties, room_options_by_property: rooms } = row
  if (!Array.isArray(properties)) return { data: null, error: null }
  if (!rooms || typeof rooms !== 'object') return { data: null, error: null }

  return {
    data: {
      properties: properties as Property[],
      roomOptionsByProperty: rooms as Record<string, RoomOption[]>,
    },
    error: null,
  }
}

export async function saveSiteContent(
  properties: Property[],
  roomOptionsByProperty: Record<string, RoomOption[]>,
): Promise<{ error: string | null }> {
  const supabase = getSupabase()
  if (!supabase) {
    return { error: 'Supabase not configured' }
  }

  const rowBase = {
    id: SITE_CONTENT_ROW_ID,
    properties,
    room_options_by_property: roomOptionsByProperty,
  }
  /** Legacy column — keep `[]` so existing DBs stay consistent; UI no longer edits this. */
  const payloadFull = {
    ...rowBase,
    trending_destinations: [] as unknown[],
  }
  const payloadPartial = rowBase

  const { error } = await supabase
    .from('site_content')
    .upsert(payloadFull, { onConflict: 'id' })

  if (!error) {
    return { error: null }
  }
  if (!missingTrendingDestinationsColumnError(error)) {
    return { error: error.message }
  }

  const { error: errPartial } = await supabase
    .from('site_content')
    .upsert(payloadPartial, { onConflict: 'id' })

  if (errPartial) {
    return { error: errPartial.message }
  }
  return { error: null }
}
