import { ArrowRight, BookOpen, KeyRound, Sparkles } from 'lucide-react'
import { useState } from 'react'
import {
  formatSpaceCode,
  generateSpaceCode,
  isValidSpaceCode,
  normalizeSpaceCode,
} from '../lib/spaceCode'

type Mode = 'welcome' | 'join'

interface Props {
  /** Prefill for join form (invite link or optional env). */
  initialCode?: string
  /** Start directly on join when landing from an invite. */
  startOnJoin?: boolean
  onCreate: (code: string) => void
  onJoin: (code: string) => void
}

export function SpaceSetup({
  initialCode = '',
  startOnJoin = false,
  onCreate,
  onJoin,
}: Props) {
  const [mode, setMode] = useState<Mode>(startOnJoin || initialCode ? 'join' : 'welcome')
  const [code, setCode] = useState(
    initialCode ? formatSpaceCode(initialCode) : '',
  )
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  function handleCreate() {
    setCreating(true)
    const next = generateSpaceCode()
    // Brief beat so the button feels intentional before the share sheet
    window.setTimeout(() => {
      onCreate(next)
      setCreating(false)
    }, 220)
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const normalized = normalizeSpaceCode(code)
    if (!isValidSpaceCode(normalized)) {
      setError('הקוד חייב להכיל לפחות 4 תווים')
      return
    }
    setError('')
    onJoin(normalized)
  }

  if (mode === 'join') {
    return (
      <div className="flex min-h-dvh flex-col justify-center px-5 py-10">
        <div className="mx-auto w-full max-w-[480px]">
          <button
            type="button"
            onClick={() => {
              setMode('welcome')
              setError('')
            }}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest/55 transition hover:text-forest"
          >
            <ArrowRight size={16} />
            חזרה
          </button>

          <div className="mb-8 animate-fade-in">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-forest text-gold shadow-lg">
              <KeyRound size={24} />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest">
              הצטרפות לפנקס
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-forest/65">
              הזינו את הקוד שקיבלתם מהשותף/ה, או פתחו את קישור ההזמנה.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4 animate-slide-up">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-forest">
                קוד הפנקס
              </label>
              <input
                className="field text-center font-display text-xl font-semibold tracking-[0.2em]"
                dir="ltr"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase())
                  setError('')
                }}
                placeholder="ABCD-EFGH"
                autoComplete="off"
                autoFocus
                inputMode="text"
                spellCheck={false}
              />
            </div>
            {error && <p className="text-sm text-rose-700">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-2xl bg-forest py-3.5 text-base font-semibold text-cream shadow-sm transition active:scale-[0.98]"
            >
              כניסה לפנקס
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Atmospheric brand plane */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 100% 70% at 50% -5%, rgba(198,166,106,0.35), transparent 55%), radial-gradient(ellipse 80% 50% at 110% 80%, rgba(23,59,49,0.18), transparent 50%), linear-gradient(180deg, #173B31 0%, #1f4a3d 42%, #F7F5EF 42.1%)',
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col px-5 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
          <header className="flex flex-1 flex-col items-center justify-center pb-6 pt-8 text-center animate-fade-in">
            <div className="mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.35rem] bg-cream/15 text-gold shadow-lg ring-1 ring-gold/30 animate-soft-pulse">
              <BookOpen size={34} strokeWidth={1.75} />
            </div>
            <p className="text-xs font-medium tracking-[0.22em] text-gold">ENVELOPE</p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-cream">
              מעטפות
            </h1>
            <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-cream/75">
              פנקס משותף למעקב מתנות באירועים — סנכרון בין שני טלפונים, בלי התחברות.
            </p>
          </header>

          <div className="space-y-3 animate-slide-up" style={{ animationDelay: '120ms' }}>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-4 text-base font-semibold text-cream shadow-md transition active:scale-[0.98] disabled:opacity-80"
            >
              <Sparkles size={18} className="text-gold" />
              {creating ? 'יוצרים פנקס…' : 'צור פנקס חדש'}
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-forest/15 bg-white/80 py-4 text-base font-semibold text-forest backdrop-blur-sm transition active:scale-[0.98]"
            >
              <KeyRound size={18} className="text-gold-dark" />
              הצטרף לפנקס
            </button>
            <p className="pt-1 text-center text-[11px] leading-relaxed text-forest/45">
              אחרי יצירה תוכלו לשתף קישור הזמנה עם בן/בת הזוג
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
