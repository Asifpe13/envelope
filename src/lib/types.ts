/** Stored in Supabase (`envelopes_event_type_chk`). UI shows Hebrew via `eventTypeLabel`. */
export type EventType =
  | 'wedding'
  | 'henna'
  | 'bar_mitzvah'
  | 'bat_mitzvah'
  | 'brit'
  | 'britah'
  | 'other'

export type PartySizeType = 'solo' | 'couple' | 'family'

export interface Envelope {
  id: string
  space_code: string
  event_type: EventType | string
  host_name: string
  event_date: string | null
  attended: boolean
  party_size_type: PartySizeType
  party_count: number
  amount_given: number
  amount_received: number | null
  notes: string | null
  created_at: string
}

export type EnvelopeInput = Omit<Envelope, 'id' | 'created_at' | 'space_code'> & {
  space_code?: string
}

export type SyncStatus = 'synced' | 'cache' | 'offline' | 'loading' | 'error'

export const EVENT_TYPE_OPTIONS: { id: EventType; label: string }[] = [
  { id: 'wedding', label: 'חתונה' },
  { id: 'henna', label: 'חינה' },
  { id: 'bar_mitzvah', label: 'בר מצווה' },
  { id: 'bat_mitzvah', label: 'בת מצווה' },
  { id: 'brit', label: 'ברית' },
  { id: 'britah', label: 'בריתה' },
]

/** @deprecated use EVENT_TYPE_OPTIONS — kept as ids for callers that map over values */
export const EVENT_TYPES: EventType[] = EVENT_TYPE_OPTIONS.map((o) => o.id)

const LABEL_TO_ID: Record<string, EventType> = Object.fromEntries(
  EVENT_TYPE_OPTIONS.map((o) => [o.label, o.id]),
) as Record<string, EventType>

const ID_SET = new Set<string>(EVENT_TYPES)

/** Normalize Hebrew labels or English ids to the DB slug. */
export function normalizeEventType(value: string | null | undefined): EventType {
  const raw = (value ?? '').trim()
  if (!raw) return 'other'
  if (ID_SET.has(raw)) return raw as EventType
  if (LABEL_TO_ID[raw]) return LABEL_TO_ID[raw]
  return 'other'
}

export function eventTypeLabel(value: string | null | undefined): string {
  const id = normalizeEventType(value)
  return EVENT_TYPE_OPTIONS.find((o) => o.id === id)?.label ?? value ?? 'אחר'
}

export const AMOUNT_PRESETS = [250, 300, 500, 700, 800, 1000, 1500]

export type Screen = 'home' | 'list' | 'people' | 'form'
