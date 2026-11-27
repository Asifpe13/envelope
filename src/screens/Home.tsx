import { Download, LogOut, Pencil, Plus, Share2, Wallet } from 'lucide-react'
import { SyncBadge } from '../components/SyncBadge'
import { downloadText, envelopesToCsv, formatIls, formatNet } from '../lib/format'
import { formatSpaceCode } from '../lib/spaceCode'
import type { Envelope, SyncStatus } from '../lib/types'

interface Props {
  username: string
  spaceCode: string
  onEditName: () => void
  onShareSpace: () => void
  onLeaveSpace: () => void
  status: SyncStatus
  totalGiven: number
  eventCount: number
  netBalance: number
  receivedCount: number
  envelopes: Envelope[]
  onGoList: () => void
  onAdd: () => void
}

export function Home({
  username,
  spaceCode,
  onEditName,
  onShareSpace,
  onLeaveSpace,
  status,
  totalGiven,
  eventCount,
  netBalance,
  receivedCount,
  envelopes,
  onGoList,
  onAdd,
}: Props) {
  function exportBackup() {
    const stamp = new Date().toISOString().slice(0, 10)
    downloadText(
      `envelope-backup-${stamp}.json`,
      JSON.stringify(envelopes, null, 2),
      'application/json',
    )
    downloadText(
      `envelope-backup-${stamp}.csv`,
      envelopesToCsv(envelopes),
      'text/csv;charset=utf-8',
    )
  }

  return (
    <div className="px-5 pb-6 pt-8">
      <header className="animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-gold-dark">מעטפות</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-forest">
              שלום,{' '}
              <button
                type="button"
                onClick={onEditName}
                className="inline-flex items-center gap-1 border-b border-dashed border-forest/30"
              >
                {username}
                <Pencil size={14} className="text-forest/40" />
              </button>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onShareSpace}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest/8 text-forest transition active:scale-95"
              aria-label="שתף פנקס"
              title="שתף פנקס"
            >
              <Share2 size={16} />
            </button>
            <SyncBadge status={status} />
          </div>
        </div>
      </header>

      <section className="mt-8 space-y-3 animate-slide-up">
        <div className="rounded-2xl bg-forest px-5 py-5 text-cream shadow-sm">
          <div className="flex items-center gap-2 text-gold">
            <Wallet size={18} />
            <span className="text-xs font-medium">סה״כ נתתי</span>
          </div>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums">
            {formatIls(totalGiven)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/70 px-4 py-4 ring-1 ring-forest/8">
            <p className="text-[11px] font-medium text-forest/55">סה״כ אירועים</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-forest">
              {eventCount}
            </p>
          </div>
          <div className="rounded-2xl bg-white/70 px-4 py-4 ring-1 ring-forest/8">
            <p className="text-[11px] font-medium text-forest/55">התקבל מול ניתן</p>
            <p
              className={`mt-1 font-display text-xl font-bold tabular-nums ${
                receivedCount === 0
                  ? 'text-forest/40'
                  : netBalance >= 0
                    ? 'text-emerald-700'
                    : 'text-rose-700'
              }`}
            >
              {receivedCount === 0 ? '—' : formatNet(netBalance)}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <button
          type="button"
          onClick={onGoList}
          className="w-full rounded-2xl bg-forest py-3.5 text-base font-semibold text-cream shadow-sm transition active:scale-[0.98]"
        >
          לרשימת המעטפות שלי
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-forest/15 bg-white/60 py-3.5 text-base font-semibold text-forest transition active:scale-[0.98]"
        >
          <Plus size={18} />
          הוסף מעטפה חדשה
        </button>
        <button
          type="button"
          onClick={onShareSpace}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gold/35 bg-gold/10 py-3 text-sm font-semibold text-forest transition active:scale-[0.98]"
        >
          <Share2 size={16} className="text-gold-dark" />
          שתף פנקס
          <span className="font-display text-xs font-medium tracking-wider text-forest/45" dir="ltr">
            {formatSpaceCode(spaceCode)}
          </span>
        </button>
        <button
          type="button"
          onClick={exportBackup}
          className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-forest/50"
        >
          <Download size={14} />
          גיבוי JSON / CSV
        </button>
        <button
          type="button"
          onClick={onLeaveSpace}
          className="flex w-full items-center justify-center gap-2 py-1.5 text-xs font-medium text-forest/35 transition hover:text-rose-700"
        >
          <LogOut size={12} />
          עזיבת פנקס / יצירת חדש
        </button>
      </section>
    </div>
  )
}
