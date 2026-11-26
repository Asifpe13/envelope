import { useState } from 'react'
import {
  Baby,
  Cake,
  Heart,
  Pencil,
  Sparkles,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { Envelope } from '../lib/types'
import { formatIls, formatNet, partyLabel } from '../lib/format'

const TYPE_META: Record<string, { icon: typeof Heart; tone: string }> = {
  חתונה: { icon: Heart, tone: 'bg-rose-100 text-rose-800' },
  חינה: { icon: Sparkles, tone: 'bg-amber-100 text-amber-900' },
  'בר מצווה': { icon: Cake, tone: 'bg-sky-100 text-sky-900' },
  'בת מצווה': { icon: Cake, tone: 'bg-fuchsia-100 text-fuchsia-900' },
  ברית: { icon: Baby, tone: 'bg-emerald-100 text-emerald-900' },
  בריתה: { icon: Baby, tone: 'bg-teal-100 text-teal-900' },
}

interface Props {
  envelope: Envelope
  onEdit: (e: Envelope) => void
  onDelete: (e: Envelope) => void
  onSaveReceived: (id: string, amount: number | null) => Promise<void>
}

export function EnvelopeCard({ envelope, onEdit, onDelete, onSaveReceived }: Props) {
  const meta = TYPE_META[envelope.event_type] ?? {
    icon: Heart,
    tone: 'bg-forest/10 text-forest',
  }
  const Icon = meta.icon
  const [openRizika, setOpenRizika] = useState(false)
  const [received, setReceived] = useState(
    envelope.amount_received != null ? String(envelope.amount_received) : '',
  )
  const [saving, setSaving] = useState(false)

  const net =
    envelope.amount_received != null
      ? Number(envelope.amount_received) - Number(envelope.amount_given)
      : null

  async function saveReceived() {
    setSaving(true)
    try {
      const val = received.trim() === '' ? null : Number(received)
      await onSaveReceived(envelope.id, val != null && !Number.isNaN(val) ? val : null)
      setOpenRizika(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="animate-fade-in border-b border-forest/10 py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}
            >
              <Icon size={12} />
              {envelope.event_type}
            </span>
            <span className="text-[11px] text-forest/50">
              {partyLabel(envelope.attended, envelope.party_size_type, envelope.party_count)}
            </span>
          </div>
          <h3 className="mt-1.5 truncate font-display text-base font-semibold text-forest">
            {envelope.host_name}
          </h3>
          {(envelope.event_date || envelope.notes) && (
            <p className="mt-0.5 text-xs text-forest/55">
              {[envelope.event_date, envelope.notes].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div className="shrink-0 text-left">
          <p className="font-display text-lg font-bold tabular-nums text-forest">
            {formatIls(Number(envelope.amount_given))}
          </p>
          {net != null && (
            <p
              className={`text-xs font-semibold tabular-nums ${
                net >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatNet(net)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpenRizika((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg bg-gold/15 px-2.5 py-1.5 text-[11px] font-medium text-forest"
        >
          הריזיקה
          {openRizika ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        <button
          type="button"
          onClick={() => onEdit(envelope)}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-forest/60 hover:bg-forest/5"
        >
          <Pencil size={12} />
          עריכה
        </button>
        <button
          type="button"
          onClick={() => onDelete(envelope)}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-rose-700/80 hover:bg-rose-50"
        >
          <Trash2 size={12} />
          מחיקה
        </button>
      </div>

      {openRizika && (
        <div className="mt-3 rounded-xl bg-white/70 p-3 ring-1 ring-forest/8">
          <label className="block text-xs font-medium text-forest/70">
            כמה החזירו לי באירוע שלי
          </label>
          <div className="mt-2 flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              placeholder="סכום בש״ח"
              className="field flex-1"
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveReceived()}
              className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-cream disabled:opacity-60"
            >
              שמור
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
