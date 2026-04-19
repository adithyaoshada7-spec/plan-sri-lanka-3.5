import type { RoomOption } from '../data/availability'
import type { Property, TrendingDestination } from '../data/properties'
import { getSupabase } from './supabaseClient'

export const SITE_CONTENT_ID = 1

export type SiteContentPayload = {
  properties: Property[]
  roomOptionsByProperty: Record<string, RoomOption[]>
  /** Null when the column is absent or the DB value is null (see trendingColumnAvailable). */
  trendingDestinations: TrendingDestination[] | null
  /** False when the database has no `trending_destinations` column (fetch used a fallback query). */
  trendingColumnAvailable: boolean
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

export async function fetchSiteContent(): Promise<{
  data: SiteContentPayload | null
  error: string | null
}> {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: null }

  type SiteRow = {
    properties: unknown
    room_options_by_property: unknown
    trending_destinations?: unknown
  }

  let trendingColumnAvailable = true
  const first = await supabase
    .from('site_content')
    .select('properties, room_options_by_property, trending_destinations')
    .eq('id', SITE_CONTENT_ID)
    .maybeSingle()

  let data = first.data as SiteRow | null
  let error = first.error

  if (error && missingTrendingDestinationsColumnError(error)) {
    trendingColumnAvailable = false
    const retry = await supabase
      .from('site_content')
      .select('properties, room_options_by_property')
      .eq('id', SITE_CONTENT_ID)
      .maybeSingle()
    data = retry.data as SiteRow | null
    error = retry.error
  }

  if (error) {
    console.error('fetchSiteContent', error.message)
    return { data: null, error: error.message }
  }
  if (!data) return { data: null, error: null }

  const {
    properties,
    room_options_by_property: rooms,
    trending_destinations: trendingRaw,
  } = data
  if (!Array.isArray(properties)) return { data: null, error: null }
  if (!rooms || typeof rooms !== 'object') return { data: null, error: null }

  let trendingDestinations: TrendingDestination[] | null = null
  if (trendingColumnAvailable && Array.isArray(trendingRaw)) {
    trendingDestinations = trendingRaw as TrendingDestination[]
  }

  return {
    data: {
      properties: properties as Property[],
      roomOptionsByProperty: rooms as Record<string, RoomOption[]>,
      trendingDestinations,
      trendingColumnAvailable,
    },
    error: null,
  }
}

type SaveResult = {
  error: string | null
  /** False when `trending_destinations` was not written because the column is missing. */
  trendingPersistedToSupabase: boolean
}

export async function saveSiteContent(
  properties: Property[],
  roomOptionsByProperty: Record<string, RoomOption[]>,
  trendingDestinations: TrendingDestination[],
): Promise<SaveResult> {
  const supabase = getSupabase()
  if (!supabase) {
    return { error: 'Supabase not configured', trendingPersistedToSupabase: false }
  }

  const { data: existing, error: selectError } = await supabase
    .from('site_content')
    .select('id')
    .eq('id', SITE_CONTENT_ID)
    .maybeSingle()

  if (selectError) {
    return { error: selectError.message, trendingPersistedToSupabase: false }
  }

  const payloadFull = {
    properties,
    room_options_by_property: roomOptionsByProperty,
    trending_destinations: trendingDestinations,
  }
  const payloadPartial = {
    properties,
    room_options_by_property: roomOptionsByProperty,
  }

  if (existing) {
    const { error } = await supabase
      .from('site_content')
      .update(payloadFull)
      .eq('id', SITE_CONTENT_ID)
    if (!error) {
      return { error: null, trendingPersistedToSupabase: true }
    }
    if (!missingTrendingDestinationsColumnError(error)) {
      return { error: error.message, trendingPersistedToSupabase: false }
    }
    const { error: errPartial } = await supabase
      .from('site_content')
      .update(payloadPartial)
      .eq('id', SITE_CONTENT_ID)
    if (errPartial) {
      return { error: errPartial.message, trendingPersistedToSupabase: false }
    }
    return { error: null, trendingPersistedToSupabase: false }
  }

  const { error: insertError } = await supabase
    .from('site_content')
    .insert(payloadFull)

  if (!insertError) {
    return { error: null, trendingPersistedToSupabase: true }
  }
  if (!missingTrendingDestinationsColumnError(insertError)) {
    return { error: insertError.message, trendingPersistedToSupabase: false }
  }

  const { error: insertPartial } = await supabase
    .from('site_content')
    .insert(payloadPartial)

  if (insertPartial) {
    return { error: insertPartial.message, trendingPersistedToSupabase: false }
  }
  return { error: null, trendingPersistedToSupabase: false }
}
