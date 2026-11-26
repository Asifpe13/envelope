export type EventType =
  | 'חתונה'
  | 'חינה'
  | 'בר מצווה'
  | 'בת מצווה'
  | 'ברית'
  | 'בריתה'

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

export const EVENT_TYPES: EventType[] = [
  'חתונה',
  'חינה',
  'בר מצווה',
  'בת מצווה',
  'ברית',
  'בריתה',
]

export const AMOUNT_PRESETS = [250, 300, 500, 700, 800, 1000, 1500]

export type Screen = 'home' | 'list' | 'people' | 'form'
