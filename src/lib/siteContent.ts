import type { RoomOption } from '../data/availability'
import type { Property } from '../data/properties'
import { getSupabase } from './supabaseClient'

export const SITE_CONTENT_ID = 1

export type SiteContentPayload = {
  properties: Property[]
  roomOptionsByProperty: Record<string, RoomOption[]>
}

export async function fetchSiteContent(): Promise<{
  data: SiteContentPayload | null
  error: string | null
}> {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: null }

  const { data, error } = await supabase
    .from('site_content')
    .select('properties, room_options_by_property')
    .eq('id', SITE_CONTENT_ID)
    .maybeSingle()

  if (error) {
    console.error('fetchSiteContent', error.message)
    return { data: null, error: error.message }
  }
  if (!data) return { data: null, error: null }

  const { properties, room_options_by_property: rooms } = data
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
  if (!supabase) return { error: 'Supabase not configured' }

  // Do not use upsert with explicit `id`: tables defined with
  // GENERATED ALWAYS AS IDENTITY reject non-default values on insert.
  const { data: existing, error: selectError } = await supabase
    .from('site_content')
    .select('id')
    .eq('id', SITE_CONTENT_ID)
    .maybeSingle()

  if (selectError) return { error: selectError.message }

  const payload = {
    properties,
    room_options_by_property: roomOptionsByProperty,
  }

  if (existing) {
    const { error } = await supabase
      .from('site_content')
      .update(payload)
      .eq('id', SITE_CONTENT_ID)
    if (error) return { error: error.message }
    return { error: null }
  }

  const { error: insertError } = await supabase
    .from('site_content')
    .insert(payload)

  if (insertError) return { error: insertError.message }
  return { error: null }
}
