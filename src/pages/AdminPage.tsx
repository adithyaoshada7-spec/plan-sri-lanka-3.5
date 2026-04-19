import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ADMIN_PASSWORD,
  ADMIN_SESSION_KEY,
} from '../admin/constants'
import type { RoomOption } from '../data/availability'
import type { Property, TrendingDestination } from '../data/properties'
import { useProperties } from '../context/useProperties'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import {
  uploadDestinationImage,
  uploadPropertyImage,
} from '../lib/uploadPropertyImage'

function isSessionValid() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1'
}

function setSession() {
  sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
}

function clearSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY)
}

type Draft = {
  name: string
  city: string
  rating: string
  reviewCount: string
  scoreLabel: string
  pricePerNight: string
  currency: string
  image: string
  heroImage: string
  stars: string
  badge: string
}

function toDraft(p: Property): Draft {
  return {
    name: p.name,
    city: p.city,
    rating: String(p.rating),
    reviewCount: String(p.reviewCount),
    scoreLabel: p.scoreLabel,
    pricePerNight: String(p.pricePerNight),
    currency: p.currency,
    image: p.image,
    heroImage: p.heroImage ?? '',
    stars: p.stars != null ? String(p.stars) : '',
    badge: p.badge ?? '',
  }
}

function draftToProperty(id: string, d: Draft): Property {
  const starsNum = parseInt(d.stars, 10)
  const stars =
    Number.isFinite(starsNum) && starsNum >= 1 && starsNum <= 5
      ? starsNum
      : undefined
  const badge = d.badge.trim() === '' ? undefined : d.badge.trim()
  return {
    id,
    name: d.name.trim(),
    city: d.city.trim(),
    rating: Math.min(10, Math.max(0, parseFloat(d.rating) || 0)),
    reviewCount: Math.max(0, parseInt(d.reviewCount, 10) || 0),
    scoreLabel: d.scoreLabel.trim() || '—',
    pricePerNight: Math.max(0, parseFloat(d.pricePerNight) || 0),
    currency: d.currency.trim().toUpperCase().slice(0, 4) || 'USD',
    image: d.image.trim(),
    heroImage:
      d.heroImage.trim() === '' ? undefined : d.heroImage.trim(),
    stars,
    badge,
  }
}

function propertyEditorKey(p: Property) {
  return [
    p.id,
    p.name,
    p.city,
    p.rating,
    p.reviewCount,
    p.scoreLabel,
    p.pricePerNight,
    p.currency,
    p.image,
    p.heroImage ?? '',
    p.stars ?? '',
    p.badge ?? '',
  ].join('|')
}

type RoomOptionDraft = {
  roomType: string
  guests: string
  price: string
  originalPrice: string
  taxNote: string
  choices: string
}

function roomOptionToDraft(option: RoomOption): RoomOptionDraft {
  return {
    roomType: option.roomType,
    guests: String(option.guests),
    price: String(option.price),
    originalPrice: String(option.originalPrice),
    taxNote: option.taxNote,
    choices: option.choices.join('\n'),
  }
}

function draftToRoomOption(id: string, draft: RoomOptionDraft): RoomOption {
  const choices = draft.choices
    .split('\n')
    .map((c) => c.trim())
    .filter(Boolean)

  return {
    id,
    roomType: draft.roomType.trim(),
    guests: Math.max(1, parseInt(draft.guests, 10) || 1),
    price: Math.max(0, parseInt(draft.price, 10) || 0),
    originalPrice: Math.max(0, parseInt(draft.originalPrice, 10) || 0),
    taxNote: draft.taxNote.trim(),
    choices,
  }
}

function roomOptionEditorKey(option: RoomOption) {
  return [
    option.id,
    option.roomType,
    option.guests,
    option.price,
    option.originalPrice,
    option.taxNote,
    option.choices.join('|'),
  ].join('|')
}

const MAX_UPLOAD_IMAGE_BYTES = 2 * 1024 * 1024

function DestinationEditor({
  destination,
}: {
  destination: TrendingDestination
}) {
  const { updateTrendingDestination } = useProperties()
  const [draft, setDraft] = useState(() => ({
    name: destination.name,
    image: destination.image,
  }))
  const [uploadHint, setUploadHint] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cloudImages = isSupabaseConfigured()

  useEffect(() => {
    setDraft({ name: destination.name, image: destination.image })
  }, [destination.id, destination.name, destination.image])

  const handleSave = () => {
    updateTrendingDestination(destination.id, {
      id: destination.id,
      name: draft.name.trim() || 'Destination',
      image: draft.image.trim(),
    })
  }

  const handleImageFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadHint('Please choose an image file.')
      return
    }
    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
      setUploadHint(
        `Image is too large (max ${MAX_UPLOAD_IMAGE_BYTES / (1024 * 1024)} MB).`,
      )
      return
    }
    setUploadHint(null)

    if (cloudImages) {
      setUploading(true)
      const result = await uploadDestinationImage(destination.id, file)
      setUploading(false)
      if ('error' in result) {
        setUploadHint(result.error)
        return
      }
      setDraft((prev) => {
        const next = { ...prev, image: result.publicUrl }
        updateTrendingDestination(destination.id, {
          id: destination.id,
          name: next.name.trim() || 'Destination',
          image: result.publicUrl,
        })
        return next
      })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const res = reader.result
      if (typeof res === 'string') {
        setDraft((prev) => ({ ...prev, image: res }))
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <fieldset className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <legend className="px-1 text-sm font-semibold text-neutral-600">
        Card — {destination.name}
      </legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-neutral-700">Destination name</span>
          <input
            className="rounded border border-neutral-300 px-2 py-1.5"
            value={draft.name}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </label>
        <div className="sm:col-span-2 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 text-sm">
          <p className="m-0 font-semibold text-neutral-800">Card image</p>
          <p className="m-0 text-xs text-neutral-600">
            Recommended: <strong>4∶3</strong> aspect — e.g.{' '}
            <strong>1200×900 px</strong> (matches the home row crop).
          </p>
          <div className="flex flex-wrap items-stretch gap-2">
            <input
              className="min-w-0 flex-1 rounded border border-neutral-300 bg-white px-2 py-1.5"
              placeholder="/images/dest-colombo.svg or https://…"
              value={draft.image}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, image: e.target.value }))
              }
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFile}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="shrink-0 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload image'}
            </button>
          </div>
          {draft.image ? (
            <div className="flex max-w-[280px] flex-col gap-1">
              <div className="aspect-[4/3] w-full overflow-hidden rounded border border-neutral-200 bg-neutral-200">
                <img
                  src={draft.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-xs text-neutral-500">
                Preview — <strong>Save card</strong> to keep name/URL edits.
              </span>
            </div>
          ) : null}
          {uploadHint ? (
            <p className="text-xs text-amber-800" role="status">
              {uploadHint}
            </p>
          ) : null}
          <p className="m-0 text-xs text-neutral-500">
            {cloudImages ? (
              <>
                <strong>Uploads</strong> go to Supabase Storage (same bucket as
                listings). Sign in required. You can also paste{' '}
                <code className="rounded bg-neutral-200 px-1">/images/…</code> or
                a hosted URL.
              </>
            ) : (
              <>
                <strong>Uploads</strong> stay in this browser (data URLs) for
                testing. For production, use files under{' '}
                <code className="rounded bg-neutral-200 px-1">public/images/</code>{' '}
                or a URL.
              </>
            )}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-md bg-[#003b95] px-4 py-2 text-sm font-semibold text-white hover:bg-[#002a6b]"
        >
          Save card
        </button>
      </div>
    </fieldset>
  )
}

function PropertyEditor({ property }: { property: Property }) {
  const { updateProperty } = useProperties()
  const [draft, setDraft] = useState(() => toDraft(property))
  const [cardUploadHint, setCardUploadHint] = useState<string | null>(null)
  const [heroUploadHint, setHeroUploadHint] = useState<string | null>(null)
  const [uploadingField, setUploadingField] = useState<'card' | 'hero' | null>(
    null,
  )
  const cardFileRef = useRef<HTMLInputElement>(null)
  const heroFileRef = useRef<HTMLInputElement>(null)
  const cloudImages = isSupabaseConfigured()

  const field = (key: keyof Draft) => ({
    value: draft[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setDraft((prev) => ({ ...prev, [key]: e.target.value }))
    },
  })

  const handleSave = () => {
    updateProperty(property.id, draftToProperty(property.id, draft))
  }

  const handleImageFile =
    (field: 'image' | 'heroImage') => async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      const setHint = field === 'image' ? setCardUploadHint : setHeroUploadHint
      if (!file) return
      if (!file.type.startsWith('image/')) {
        setHint('Please choose an image file.')
        return
      }
      if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
        setHint(
          `Image is too large (max ${MAX_UPLOAD_IMAGE_BYTES / (1024 * 1024)} MB). Use a smaller file or a /images/… or https URL.`,
        )
        return
      }
      setHint(null)

      if (cloudImages) {
        setUploadingField(field === 'image' ? 'card' : 'hero')
        const result = await uploadPropertyImage(property.id, field, file)
        setUploadingField(null)
        if ('error' in result) {
          setHint(result.error)
          return
        }
        setDraft((prev) => {
          const next = { ...prev, [field]: result.publicUrl }
          updateProperty(property.id, draftToProperty(property.id, next))
          return next
        })
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const res = reader.result
        if (typeof res === 'string') {
          setDraft((prev) => ({ ...prev, [field]: res }))
        }
      }
      reader.readAsDataURL(file)
    }

  return (
    <fieldset className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <legend className="px-1 text-sm font-semibold text-neutral-600">
        Listing #{property.id}
      </legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Name</span>
          <input
            className="rounded border border-neutral-300 px-2 py-1.5"
            {...field('name')}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">City</span>
          <input
            className="rounded border border-neutral-300 px-2 py-1.5"
            {...field('city')}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Rating (0–10)</span>
          <input
            type="number"
            step="0.1"
            min={0}
            max={10}
            className="rounded border border-neutral-300 px-2 py-1.5"
            {...field('rating')}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Review count</span>
          <input
            type="number"
            min={0}
            className="rounded border border-neutral-300 px-2 py-1.5"
            {...field('reviewCount')}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Score label</span>
          <input
            className="rounded border border-neutral-300 px-2 py-1.5"
            {...field('scoreLabel')}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Price / night</span>
          <input
            type="number"
            min={0}
            step="0.01"
            className="rounded border border-neutral-300 px-2 py-1.5"
            {...field('pricePerNight')}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Currency</span>
          <input
            className="rounded border border-neutral-300 px-2 py-1.5"
            {...field('currency')}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Stars (optional)</span>
          <select
            className="rounded border border-neutral-300 px-2 py-1.5"
            value={draft.stars === '' ? '' : draft.stars}
            onChange={(e) => {
              setDraft((prev) => ({ ...prev, stars: e.target.value }))
            }}
          >
            <option value="">None</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </label>
        <div className="sm:col-span-2 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 text-sm">
          <p className="m-0 font-semibold text-neutral-800">
            Listing card image
            <span className="ml-1 font-normal text-neutral-500">
              (home grid)
            </span>
          </p>
          <p className="m-0 text-xs text-neutral-600">
            Recommended size: <strong>16∶10</strong> aspect ratio — e.g.{' '}
            <strong>1200×750 px</strong> or <strong>1600×1000 px</strong>{' '}
            (matches the card crop).
          </p>
          <div className="flex flex-wrap items-stretch gap-2">
            <input
              className="min-w-0 flex-1 rounded border border-neutral-300 bg-white px-2 py-1.5"
              placeholder="/images/stay-1.jpg"
              {...field('image')}
            />
            <input
              ref={cardFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFile('image')}
            />
            <button
              type="button"
              disabled={uploadingField !== null}
              onClick={() => cardFileRef.current?.click()}
              className="shrink-0 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100 disabled:opacity-50"
            >
              {uploadingField === 'card' ? 'Uploading…' : 'Upload card image'}
            </button>
          </div>
          {draft.image ? (
            <div className="flex max-w-[220px] flex-col gap-1">
              <div className="aspect-[16/10] w-full overflow-hidden rounded border border-neutral-200 bg-neutral-200">
                <img
                  src={draft.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-xs text-neutral-500">
                Card preview — <strong>Save listing</strong> to keep.
              </span>
            </div>
          ) : null}
          {cardUploadHint ? (
            <p className="text-xs text-amber-800" role="status">
              {cardUploadHint}
            </p>
          ) : null}
        </div>

        <div className="sm:col-span-2 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 text-sm">
          <p className="m-0 font-semibold text-neutral-800">
            Main hero image
            <span className="ml-1 font-normal text-neutral-500">
              (property detail page)
            </span>
          </p>
          <p className="m-0 text-xs text-neutral-600">
            Recommended size: <strong>16∶7</strong> aspect ratio — e.g.{' '}
            <strong>1920×840 px</strong> or <strong>1600×700 px</strong>{' '}
            (wide banner). Leave empty to reuse the listing card image.
          </p>
          <div className="flex flex-wrap items-stretch gap-2">
            <input
              className="min-w-0 flex-1 rounded border border-neutral-300 bg-white px-2 py-1.5"
              placeholder="Optional — /images/hero.jpg or URL"
              {...field('heroImage')}
            />
            <input
              ref={heroFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFile('heroImage')}
            />
            <button
              type="button"
              disabled={uploadingField !== null}
              onClick={() => heroFileRef.current?.click()}
              className="shrink-0 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100 disabled:opacity-50"
            >
              {uploadingField === 'hero' ? 'Uploading…' : 'Upload hero image'}
            </button>
          </div>
          {draft.heroImage ? (
            <div className="flex max-w-full flex-col gap-1">
              <div className="aspect-[16/7] max-h-40 w-full max-w-md overflow-hidden rounded border border-neutral-200 bg-neutral-200">
                <img
                  src={draft.heroImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-xs text-neutral-500">
                Hero preview — <strong>Save listing</strong> to keep.
              </span>
            </div>
          ) : null}
          {heroUploadHint ? (
            <p className="text-xs text-amber-800" role="status">
              {heroUploadHint}
            </p>
          ) : null}
        </div>

        <p className="sm:col-span-2 m-0 text-xs text-neutral-500">
          {cloudImages ? (
            <>
              <strong>Uploads</strong> go to Supabase Storage (public URLs). You
              must be signed in. You can also paste{' '}
              <code className="rounded bg-neutral-200 px-1">/images/…</code> or
              any https URL.
            </>
          ) : (
            <>
              <strong>Uploads</strong> store images in this browser (data URLs in
              localStorage) — fine for testing; large files use more storage. For
              production, use paths under{' '}
              <code className="rounded bg-neutral-200 px-1">public/images/</code>{' '}
              as <code className="rounded bg-neutral-200 px-1">/images/…</code> or
              a hosted URL.
            </>
          )}
        </p>
        <label className="sm:col-span-2 flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Badge (optional)</span>
          <input
            className="rounded border border-neutral-300 px-2 py-1.5"
            placeholder="e.g. Free cancellation"
            {...field('badge')}
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-md bg-[#003b95] px-4 py-2 text-sm font-semibold text-white hover:bg-[#002a6b]"
        >
          Save listing
        </button>
      </div>
    </fieldset>
  )
}

function AvailabilityEditor({
  propertyId,
  option,
}: {
  propertyId: string
  option: RoomOption
}) {
  const { updateRoomOption } = useProperties()
  const [draft, setDraft] = useState(() => roomOptionToDraft(option))

  const field = (key: keyof RoomOptionDraft) => ({
    value: draft[key],
    onChange: (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      setDraft((prev) => ({ ...prev, [key]: e.target.value }))
    },
  })

  const handleSave = () => {
    updateRoomOption(
      propertyId,
      option.id,
      draftToRoomOption(option.id, draft),
    )
  }

  return (
    <fieldset className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <legend className="px-1 text-sm font-semibold text-neutral-600">
        Availability Row #{option.id}
      </legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Room type</span>
          <input
            className="rounded border border-neutral-300 px-2 py-1.5"
            {...field('roomType')}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Guests</span>
          <input
            type="number"
            min={1}
            className="rounded border border-neutral-300 px-2 py-1.5"
            {...field('guests')}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Price</span>
          <input
            type="number"
            min={0}
            className="rounded border border-neutral-300 px-2 py-1.5"
            {...field('price')}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Original price</span>
          <input
            type="number"
            min={0}
            className="rounded border border-neutral-300 px-2 py-1.5"
            {...field('originalPrice')}
          />
        </label>
        <label className="sm:col-span-2 flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Tax note</span>
          <input
            className="rounded border border-neutral-300 px-2 py-1.5"
            {...field('taxNote')}
          />
        </label>
        <label className="sm:col-span-2 flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">
            Choices (one per line)
          </span>
          <textarea
            rows={5}
            className="rounded border border-neutral-300 px-2 py-1.5"
            {...field('choices')}
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-md bg-[#003b95] px-4 py-2 text-sm font-semibold text-white hover:bg-[#002a6b]"
        >
          Save row
        </button>
      </div>
    </fieldset>
  )
}

function QuickAvailabilityManager({
  propertyId,
  roomOptions,
}: {
  propertyId: string
  roomOptions: RoomOption[]
}) {
  const {
    updateRoomOption,
    addRoomOption,
    removeRoomOption,
  } = useProperties()

  return (
    <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-neutral-900">
            Easy Availability Manager
          </h2>
          <p className="m-0 mt-1 text-sm text-neutral-600">
            Quick table view to add, edit, and remove room rows.
          </p>
        </div>
        <button
          type="button"
          onClick={() => addRoomOption(propertyId)}
          className="rounded-md bg-[#0071c2] px-3 py-2 text-sm font-semibold text-white hover:bg-[#005e9f]"
        >
          + Add row
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse text-sm">
          <thead>
            <tr className="bg-neutral-100 text-left text-neutral-700">
              <th className="border border-neutral-200 p-2">Room type</th>
              <th className="border border-neutral-200 p-2">Guests</th>
              <th className="border border-neutral-200 p-2">Price</th>
              <th className="border border-neutral-200 p-2">Original</th>
              <th className="border border-neutral-200 p-2">Tax note</th>
              <th className="border border-neutral-200 p-2">Choices</th>
              <th className="border border-neutral-200 p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {roomOptions.map((option) => (
              <tr key={option.id} className="align-top">
                <td className="border border-neutral-200 p-2">
                  <input
                    className="w-full rounded border border-neutral-300 px-2 py-1"
                    value={option.roomType}
                    onChange={(e) =>
                      updateRoomOption(propertyId, option.id, {
                        ...option,
                        roomType: e.target.value,
                      })
                    }
                  />
                </td>
                <td className="border border-neutral-200 p-2">
                  <input
                    type="number"
                    min={1}
                    className="w-20 rounded border border-neutral-300 px-2 py-1"
                    value={option.guests}
                    onChange={(e) =>
                      updateRoomOption(propertyId, option.id, {
                        ...option,
                        guests: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                  />
                </td>
                <td className="border border-neutral-200 p-2">
                  <input
                    type="number"
                    min={0}
                    className="w-28 rounded border border-neutral-300 px-2 py-1"
                    value={option.price}
                    onChange={(e) =>
                      updateRoomOption(propertyId, option.id, {
                        ...option,
                        price: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                  />
                </td>
                <td className="border border-neutral-200 p-2">
                  <input
                    type="number"
                    min={0}
                    className="w-28 rounded border border-neutral-300 px-2 py-1"
                    value={option.originalPrice}
                    onChange={(e) =>
                      updateRoomOption(propertyId, option.id, {
                        ...option,
                        originalPrice: Math.max(
                          0,
                          parseInt(e.target.value, 10) || 0,
                        ),
                      })
                    }
                  />
                </td>
                <td className="border border-neutral-200 p-2">
                  <input
                    className="w-full rounded border border-neutral-300 px-2 py-1"
                    value={option.taxNote}
                    onChange={(e) =>
                      updateRoomOption(propertyId, option.id, {
                        ...option,
                        taxNote: e.target.value,
                      })
                    }
                  />
                </td>
                <td className="border border-neutral-200 p-2">
                  <textarea
                    rows={4}
                    className="w-full rounded border border-neutral-300 px-2 py-1"
                    value={option.choices.join('\n')}
                    onChange={(e) =>
                      updateRoomOption(propertyId, option.id, {
                        ...option,
                        // Keep line breaks while typing so Enter can create a new point.
                        choices: e.target.value.split('\n'),
                      })
                    }
                  />
                </td>
                <td className="border border-neutral-200 p-2">
                  <button
                    type="button"
                    onClick={() => removeRoomOption(propertyId, option.id)}
                    className="rounded-md border border-red-300 px-2 py-1 font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function AdminPage() {
  const {
    properties,
    roomOptionsByProperty,
    trendingDestinations,
    addTrendingDestination,
    removeTrendingDestination,
    resetTrendingDestinationsToDefaults,
    resetToDefaults,
    cloudMode,
    initialLoadDone,
    loadError,
    saveError,
    clearSaveError,
  } = useProperties()
  const supabaseConfigured = isSupabaseConfigured()
  const [authed, setAuthed] = useState(() => {
    if (supabaseConfigured) return false
    return isSessionValid()
  })
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const rawSection = searchParams.get('section')
  const section =
    rawSection === 'homes' ? 'guest-love' : rawSection

  useEffect(() => {
    if (!supabaseConfigured) return
    const supabase = getSupabase()
    if (!supabase) return
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session)
    })
    return () => subscription.unsubscribe()
  }, [supabaseConfigured])

  const sorted = useMemo(
    () => [...properties].sort((a, b) => Number(a.id) - Number(b.id)),
    [properties],
  )

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    clearSaveError()
    if (supabaseConfigured) {
      const supabase = getSupabase()
      if (!supabase) {
        setError('Supabase client is not available.')
        return
      }
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authError) {
        setError(authError.message)
        return
      }
      setAuthed(true)
      setPassword('')
      setEmail('')
    } else if (password === ADMIN_PASSWORD) {
      setSession()
      setAuthed(true)
      setPassword('')
    } else {
      setError('Incorrect password.')
    }
  }

  const handleLogout = async () => {
    clearSaveError()
    if (supabaseConfigured) {
      await getSupabase()?.auth.signOut()
    } else {
      clearSession()
    }
    setAuthed(false)
  }

  const showHomeEditor = section === 'home'
  const showGuestLoveEditor = section === 'guest-love'
  const showAvailabilityEditor = section === 'availability'

  if (!authed) {
    return (
      <div className="min-h-screen bg-neutral-100 px-4 py-16">
        <div className="mx-auto w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 shadow-md">
          <h1 className="m-0 text-xl font-bold text-neutral-900">Admin</h1>
          <p className="mt-2 text-sm text-neutral-600">
            {supabaseConfigured
              ? 'Sign in with your Supabase admin user (Authentication → Users).'
              : 'Sign in to edit property cards shown on the home page.'}
          </p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            {supabaseConfigured ? (
              <label className="block text-sm font-medium text-neutral-700">
                Email
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
                  required
                />
              </label>
            ) : null}
            <label className="block text-sm font-medium text-neutral-700">
              Password
              <input
                type="password"
                autoComplete={
                  supabaseConfigured ? 'current-password' : 'current-password'
                }
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
                required
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-md bg-[#003b95] py-2.5 font-semibold text-white hover:bg-[#002a6b]"
            >
              Sign in
            </button>
          </form>
          <p className="mt-6 text-center text-sm">
            <Link to="/" className="font-medium text-[#003b95] hover:underline">
              ← Back to site
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {!cloudMode ? (
        <div
          className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p className="m-0 mx-auto max-w-3xl">
            <strong className="font-semibold">Not synced to production.</strong> This
            session is not using Supabase, so listing and destination edits stay in
            this browser only. Add{' '}
            <code className="rounded bg-amber-100/90 px-1">VITE_SUPABASE_URL</code> and{' '}
            <code className="rounded bg-amber-100/90 px-1">VITE_SUPABASE_ANON_KEY</code>{' '}
            (or <code className="rounded bg-amber-100/90 px-1">SUPABASE_URL</code> /{' '}
            <code className="rounded bg-amber-100/90 px-1">SUPABASE_ANON_KEY</code>) in
            Vercel → Environment Variables, then redeploy. UI or code changes must be{' '}
            <strong className="font-semibold">committed and pushed</strong> so Vercel
            can rebuild.
          </p>
        </div>
      ) : null}
      <header className="border-b border-neutral-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="m-0 text-lg font-bold text-neutral-900">
              plan-srilanka — Admin
            </h1>
            {cloudMode && !initialLoadDone ? (
              <p className="m-0 mt-1 text-xs text-neutral-500">
                Loading site content…
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-md px-3 py-2 text-sm font-medium text-[#003b95] hover:bg-neutral-100"
            >
              View site
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {cloudMode && (loadError || saveError) ? (
        <div
          className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          {loadError ? (
            <p className="m-0">
              <strong>Could not load remote content:</strong> {loadError}
            </p>
          ) : null}
          {saveError ? (
            <p className={`m-0 ${loadError ? 'mt-2' : ''}`}>
              <strong>Could not save:</strong> {saveError}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {!showHomeEditor &&
          !showGuestLoveEditor &&
          !showAvailabilityEditor && (
          <section className="space-y-4">
            <h2 className="m-0 text-lg font-semibold text-neutral-900">
              Admin Sections
            </h2>
            <p className="m-0 text-sm text-neutral-600">
              Choose what you want to edit.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <button
                type="button"
                onClick={() => setSearchParams({ section: 'home' })}
                className="text-left rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-[#0071c2] hover:shadow-md"
              >
                <h3 className="m-0 text-base font-semibold text-neutral-900">
                  Home
                </h3>
                <p className="m-0 mt-2 text-sm text-neutral-600">
                  “Explore Sri Lanka” destination cards — names and photos on the
                  home page.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSearchParams({ section: 'guest-love' })}
                className="text-left rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-[#0071c2] hover:shadow-md"
              >
                <h3 className="m-0 text-base font-semibold text-neutral-900">
                  Guest love
                </h3>
                <p className="m-0 mt-2 text-sm text-neutral-600">
                  {cloudMode
                    ? '“Homes guests love” listings — sync to Supabase when signed in.'
                    : '“Homes guests love” cards — stored in this browser (localStorage).'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSearchParams({ section: 'availability' })}
                className="text-left rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-[#0071c2] hover:shadow-md md:col-span-1"
              >
                <h3 className="m-0 text-base font-semibold text-neutral-900">
                  Edit availability
                </h3>
                <p className="m-0 mt-2 text-sm text-neutral-600">
                  Room rows on each property’s Availability table.
                </p>
              </button>
            </div>
          </section>
        )}

        {showHomeEditor && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="m-0 text-lg font-semibold text-neutral-900">
                  Home — Explore Sri Lanka
                </h2>
                <p className="m-0 mt-1 text-sm text-neutral-600">
                  {cloudMode
                    ? 'Destination cards sync to Supabase when you are signed in.'
                    : 'Changes are stored in this browser (localStorage).'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
              >
                ← Back to admin sections
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addTrendingDestination()}
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50"
              >
                + Add destination card
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      cloudMode
                        ? 'Reset destination cards to built-in defaults? This updates Supabase if you are signed in.'
                        : 'Reset destination cards to built-in defaults? This clears saved cards in this browser.',
                    )
                  ) {
                    resetTrendingDestinationsToDefaults()
                  }
                }}
                className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
              >
                Reset destinations to defaults
              </button>
            </div>

            <div className="space-y-6">
              {trendingDestinations.map((d) => (
                <div key={d.id} className="space-y-3">
                  <DestinationEditor destination={d} />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            'Remove this destination card from the home page?',
                          )
                        ) {
                          removeTrendingDestination(d.id)
                        }
                      }}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-50"
                    >
                      Remove card
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {showGuestLoveEditor && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="m-0 text-lg font-semibold text-neutral-900">
                  Homes guests love
                </h2>
                <p className="m-0 mt-1 text-sm text-neutral-600">
                  {cloudMode
                    ? 'Edits sync to Supabase — sign in so saves reach the database.'
                    : 'Changes apply to the “Homes guests love” cards and are stored in this browser (localStorage).'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
              >
                ← Back to admin sections
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      cloudMode
                        ? 'Reset all listings to the built-in defaults? If you are signed in, this updates Supabase for everyone.'
                        : 'Reset all listings to the built-in defaults? This clears saved edits in this browser.',
                    )
                  ) {
                    resetToDefaults()
                  }
                }}
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
              >
                Reset all to defaults
              </button>
            </div>

            <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <h3 className="m-0 text-base font-semibold text-neutral-900">
                {cloudMode ? 'Images — repo or Supabase Storage' : 'Homes guests love — images from the repo'}
              </h3>
              <p className="m-0 mt-1 text-sm text-neutral-600">
                {cloudMode ? (
                  <>
                    Uploads go to the <strong>property-images</strong> bucket (public
                    URLs). You can also use <code className="rounded bg-neutral-200 px-1">/images/…</code> from{' '}
                    <code className="rounded bg-neutral-200 px-1">public/images/</code> after
                    deploy, or edit defaults in{' '}
                    <code className="rounded bg-neutral-200 px-1">src/data/properties.ts</code>.
                  </>
                ) : (
                  <>
                    Put image files in{' '}
                    <code className="rounded bg-neutral-200 px-1">public/images/</code>, point
                    each card at <code className="rounded bg-neutral-200 px-1">/images/…</code>,
                    commit and deploy. Or tweak copy here (localStorage) or edit defaults in{' '}
                    <code className="rounded bg-neutral-200 px-1">src/data/properties.ts</code>.
                  </>
                )}
              </p>
            </section>

            <div className="space-y-6">
              {sorted.map((p) => (
                <PropertyEditor key={propertyEditorKey(p)} property={p} />
              ))}
            </div>
          </section>
        )}

        {showAvailabilityEditor && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="m-0 text-lg font-semibold text-neutral-900">
                  Edit Availability Table
                </h2>
                <p className="m-0 mt-1 text-sm text-neutral-600">
                  Update the room rows shown in the Availability table on each
                  property detail page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
              >
                ← Back to admin sections
              </button>
            </div>

            <div className="space-y-6">
              {sorted.map((property) => {
                const propertyOptions = roomOptionsByProperty[property.id] ?? []
                return (
                  <section
                    key={`availability-${property.id}`}
                    className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
                  >
                    <h3 className="m-0 text-base font-semibold text-neutral-900">
                      {property.name}
                    </h3>
                    <p className="m-0 text-sm text-neutral-600">
                      Manage availability rows for this property card.
                    </p>
                    <QuickAvailabilityManager
                      propertyId={property.id}
                      roomOptions={propertyOptions}
                    />
                    <div className="space-y-6">
                      {propertyOptions.map((option) => (
                        <AvailabilityEditor
                          key={`${property.id}-${roomOptionEditorKey(option)}`}
                          propertyId={property.id}
                          option={option}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
