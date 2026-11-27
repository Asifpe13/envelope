import { useMemo, useState } from 'react'
import { ArrowRight, Minus, Plus } from 'lucide-react'
import {
  AMOUNT_PRESETS,
  EVENT_TYPES,
  type Envelope,
  type EnvelopeInput,
  type EventType,
  type PartySizeType,
} from '../lib/types'
import { childrenFromCount, partyCountFrom } from '../lib/format'

interface Props {
  initial?: Envelope | null
  hostSuggestions: string[]
  onCancel: () => void
  onSave: (input: EnvelopeInput) => Promise<void>
}

export function EnvelopeForm({ initial, hostSuggestions, onCancel, onSave }: Props) {
  const [eventType, setEventType] = useState<EventType | string>(
    initial?.event_type ?? 'חתונה',
  )
  const [hostName, setHostName] = useState(initial?.host_name ?? '')
  const [attended, setAttended] = useState(initial?.attended ?? true)
  const [partyType, setPartyType] = useState<PartySizeType>(
    initial?.party_size_type ?? 'couple',
  )
  const [children, setChildren] = useState(
    initial ? childrenFromCount(initial.party_count) : 1,
  )
  const [amount, setAmount] = useState(
    initial ? String(initial.amount_given) : '',
  )
  const [eventDate, setEventDate] = useState(initial?.event_date ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const suggestions = useMemo(() => {
    const q = hostName.trim().toLowerCase()
    if (!q || q.length < 1) return []
    return hostSuggestions
      .filter((h) => h.toLowerCase().includes(q) && h !== hostName)
      .slice(0, 5)
  }, [hostName, hostSuggestions])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!hostName.trim()) {
      setError('נא להזין מי הזמין / בעלי השמחה')
      return
    }
    const amountNum = Number(amount)
    if (!amount || Number.isNaN(amountNum) || amountNum < 0) {
      setError('נא להזין סכום תקין')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        event_type: eventType,
        host_name: hostName.trim(),
        event_date: eventDate.trim() || null,
        attended,
        party_size_type: attended ? partyType : 'couple',
        party_count: attended ? partyCountFrom(partyType, children) : 2,
        amount_given: amountNum,
        amount_received: initial?.amount_received ?? null,
        notes: notes.trim() || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-5 pb-8 pt-6">
      <button
        type="button"
        onClick={onCancel}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-forest/55"
      >
        <ArrowRight size={16} />
        חזרה
      </button>
      <h2 className="font-display text-xl font-bold text-forest">
        {initial ? 'עריכת מעטפה' : 'מעטפה חדשה'}
      </h2>

      <form onSubmit={(e) => void submit(e)} className="mt-5 space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-forest">סוג השמחה</legend>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setEventType(t)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  eventType === t
                    ? 'bg-forest text-cream'
                    : 'bg-white/70 text-forest/70 ring-1 ring-forest/10'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="relative">
          <label className="mb-1.5 block text-sm font-medium text-forest">
            מי הזמין / בעלי השמחה
          </label>
          <input
            className="field"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder="לדוגמה: רותם ורביב"
            required
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-forest/10">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-right text-sm text-forest hover:bg-cream"
                    onClick={() => setHostName(s)}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-forest">הגעה</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                [true, 'הגעתי'],
                [false, 'לא הגעתי'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => setAttended(val)}
                className={`rounded-xl py-3 text-sm font-semibold transition ${
                  attended === val
                    ? 'bg-forest text-cream'
                    : 'bg-white/70 text-forest/70 ring-1 ring-forest/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {attended && (
          <fieldset className="animate-fade-in">
            <legend className="mb-2 text-sm font-medium text-forest">כמה הגענו</legend>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['solo', 'לבד (1)'],
                  ['couple', 'זוג (2)'],
                  ['family', 'זוג + ילדים'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPartyType(val)}
                  className={`rounded-xl px-2 py-3 text-xs font-semibold transition ${
                    partyType === val
                      ? 'bg-gold/35 text-forest'
                      : 'bg-white/70 text-forest/70 ring-1 ring-forest/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {partyType === 'family' && (
              <div className="mt-3 flex items-center justify-center gap-4">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-cream"
                  onClick={() => setChildren((c) => Math.max(1, c - 1))}
                  aria-label="הפחת ילד"
                >
                  <Minus size={16} />
                </button>
                <span className="font-display text-lg font-bold tabular-nums text-forest">
                  {children} ילדים
                </span>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-cream"
                  onClick={() => setChildren((c) => c + 1)}
                  aria-label="הוסף ילד"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </fieldset>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-forest">
            כמה שמתי בש״ח
          </label>
          <input
            className="field"
            type="number"
            inputMode="numeric"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="סכום"
            required
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {AMOUNT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(String(p))}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums transition ${
                  amount === String(p)
                    ? 'bg-forest text-cream'
                    : 'bg-white/70 text-forest/70 ring-1 ring-forest/10'
                }`}
              >
                {p.toLocaleString('he-IL')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-forest">
            תאריך / שנה <span className="font-normal text-forest/40">(אופציונלי)</span>
          </label>
          <input
            className="field"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            placeholder="לדוגמה: 12/06/2024 או 2022"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-forest">
            הערות <span className="font-normal text-forest/40">(אופציונלי)</span>
          </label>
          <textarea
            className="field min-h-[80px] resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="לדוגמה: העברה בביט, חברים מהצבא"
          />
        </div>

        {error && <p className="text-sm text-rose-700">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-forest py-3.5 text-base font-semibold text-cream shadow-sm disabled:opacity-60"
        >
          {saving ? 'שומר…' : 'שמירה'}
        </button>
      </form>
    </div>
  )
}
