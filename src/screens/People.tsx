import { useMemo } from 'react'
import { Users } from 'lucide-react'
import { formatIls, groupByHost } from '../lib/format'
import type { Envelope } from '../lib/types'

interface Props {
  envelopes: Envelope[]
}

export function People({ envelopes }: Props) {
  const groups = useMemo(() => groupByHost(envelopes), [envelopes])

  return (
    <div className="px-5 pb-6 pt-6">
      <header className="mb-5">
        <h2 className="font-display text-xl font-bold text-forest">סיכום לפי אנשים</h2>
        <p className="mt-1 text-sm text-forest/55">
          קיבוץ אוטומטי לפי בעלי השמחה — נוח לרשימת אורחים עתידית
        </p>
      </header>

      {groups.length === 0 ? (
        <div className="mt-12 text-center text-sm text-forest/50">
          <Users className="mx-auto mb-3 text-forest/25" size={32} />
          עדיין אין רשומות לקיבוץ
        </div>
      ) : (
        <ul className="space-y-4">
          {groups.map((g) => (
            <li
              key={g.host}
              className="animate-fade-in border-b border-forest/10 pb-4 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-base font-semibold text-forest">
                    {g.host}
                  </h3>
                  <p className="mt-1 text-xs text-forest/55">
                    {g.events.length} אירועים · הגענו ל־{g.attendedCount}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {g.events.map((e) => (
                      <span
                        key={e.id}
                        className="rounded-md bg-forest/8 px-2 py-0.5 text-[11px] font-medium text-forest/75"
                      >
                        {e.event_type}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="shrink-0 font-display text-lg font-bold tabular-nums text-forest">
                  {formatIls(g.totalGiven)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
