import type { EnvelopeInput } from './types'

export const SAMPLE_ENVELOPES: EnvelopeInput[] = [
  {
    event_type: 'חתונה',
    host_name: 'רותם ורביב',
    event_date: null,
    attended: true,
    party_size_type: 'couple',
    party_count: 2,
    amount_given: 1500,
    amount_received: null,
    notes: null,
  },
  {
    event_type: 'חינה',
    host_name: 'רותם ורביב',
    event_date: null,
    attended: true,
    party_size_type: 'couple',
    party_count: 2,
    amount_given: 800,
    amount_received: null,
    notes: null,
  },
  {
    event_type: 'בריתה',
    host_name: 'אוראל חן',
    event_date: null,
    attended: false,
    party_size_type: 'couple',
    party_count: 2,
    amount_given: 300,
    amount_received: null,
    notes: null,
  },
]
