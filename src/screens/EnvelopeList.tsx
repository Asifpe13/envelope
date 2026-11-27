import { useMemo, useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { EnvelopeCard } from '../components/EnvelopeCard'
import { ConfirmModal } from '../components/ConfirmModal'
import { EVENT_TYPE_OPTIONS, eventTypeLabel, type Envelope } from '../lib/types'

interface Props {
  envelopes: Envelope[]
  onEdit: (e: Envelope) => void
  onDelete: (id: string) => Promise<void>
  onSaveReceived: (id: string, amount: number | null) => Promise<void>
  onLoadSamples: () => Promise<void>
  onAdd: () => void
}

type AttendFilter = 'all' | 'yes' | 'no'

export function EnvelopeList({
  envelopes,
  onEdit,
  onDelete,
  onSaveReceived,
  onLoadSamples,
  onAdd,
}: Props) {
  const [q, setQ] = useState('')
  const [eventFilter, setEventFilter] = useState<string>('הכל')
  const [attendFilter, setAttendFilter] = useState<AttendFilter>('all')
  const [pendingDelete, setPendingDelete] = useState<Envelope | null>(null)
  const [loadingSamples, setLoadingSamples] = useState(false)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return envelopes.filter((e) => {
      if (needle && !e.host_name.toLowerCase().includes(needle)) return false
      if (eventFilter !== 'הכל' && e.event_type !== eventFilter) return false
      if (attendFilter === 'yes' && !e.attended) return false
      if (attendFilter === 'no' && e.attended) return false
      return true
    })
  }, [envelopes, q, eventFilter, attendFilter])

  return (
    <div className="px-5 pb-6 pt-6">
      <header className="mb-4">
        <h2 className="font-display text-xl font-bold text-forest">רשימת מעטפות</h2>
        <p className="mt-1 text-sm text-forest/55">{filtered.length} רשומות</p>
      </header>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-forest/35"
        />
        <input
          className="field pr-10"
          placeholder="חיפוש לפי שם (לדוגמה: רותם)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setEventFilter('הכל')}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            eventFilter === 'הכל'
              ? 'bg-forest text-cream'
              : 'bg-white/70 text-forest/70 ring-1 ring-forest/10'
          }`}
        >
          הכל
        </button>
        {EVENT_TYPE_OPTIONS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setEventFilter(t.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              eventFilter === t.id
                ? 'bg-forest text-cream'
                : 'bg-white/70 text-forest/70 ring-1 ring-forest/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        {(
          [
            ['all', 'הכל'],
            ['yes', 'הגעתי'],
            ['no', 'לא הגעתי'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAttendFilter(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              attendFilter === id
                ? 'bg-gold/30 text-forest'
                : 'bg-white/50 text-forest/60 ring-1 ring-forest/8'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {envelopes.length === 0 ? (
        <div className="mt-10 text-center animate-fade-in">
          <p className="text-sm text-forest/60">עדיין אין מעטפות בפנקס</p>
          <button
            type="button"
            disabled={loadingSamples}
            onClick={async () => {
              setLoadingSamples(true)
              try {
                await onLoadSamples()
              } finally {
                setLoadingSamples(false)
              }
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gold/25 px-4 py-3 text-sm font-semibold text-forest"
          >
            <Sparkles size={16} />
            טען 3 דוגמאות
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="mt-3 block w-full text-sm font-medium text-forest/50"
          >
            או הוסיפו מעטפה חדשה
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-forest/50">לא נמצאו תוצאות</p>
      ) : (
        <div className="mt-2">
          {filtered.map((e) => (
            <EnvelopeCard
              key={e.id}
              envelope={e}
              onEdit={onEdit}
              onDelete={setPendingDelete}
              onSaveReceived={onSaveReceived}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!pendingDelete}
        title="למחוק מעטפה?"
        message={
          pendingDelete
            ? `למחוק את המעטפה ל${pendingDelete.host_name} (${eventTypeLabel(pendingDelete.event_type)})?`
            : ''
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            void onDelete(pendingDelete.id)
            setPendingDelete(null)
          }
        }}
      />
    </div>
  )
}
