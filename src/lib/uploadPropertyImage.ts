import { getSupabase } from './supabaseClient'

export const PROPERTY_IMAGES_BUCKET = 'property-images'

function safeExt(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  return 'jpg'
}

export async function uploadPropertyImage(
  propertyId: string,
  field: 'image' | 'heroImage',
  file: File,
): Promise<{ publicUrl: string } | { error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase is not configured.' }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return { error: 'Sign in to upload images to the cloud.' }

  const safeId = propertyId.replace(/[^a-z0-9-]/gi, '_').slice(0, 64) || 'property'
  const ext = safeExt(file)
  const path = `${safeId}/${field}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(path)
  return { publicUrl: data.publicUrl }
}

export async function uploadDestinationImage(
  destinationId: string,
  file: File,
): Promise<{ publicUrl: string } | { error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase is not configured.' }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return { error: 'Sign in to upload images to the cloud.' }

  const safeId = destinationId.replace(/[^a-z0-9-]/gi, '_').slice(0, 64) || 'dest'
  const ext = safeExt(file)
  const path = `destinations/${safeId}/image-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(path)
  return { publicUrl: data.publicUrl }
}
