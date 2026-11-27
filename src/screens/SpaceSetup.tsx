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
  initialCode?: string
  startOnJoin?: boolean
  onCreate: (code: string) => Promise<void>
  onJoin: (code: string) => Promise<void>
}

export function SpaceSetup({
  initialCode = '',
  startOnJoin = false,
  onCreate,
  onJoin,
}: Props) {
  const [mode, setMode] = useState<Mode>(startOnJoin || initialCode ? 'join' : 'welcome')
  const [code, setCode] = useState(initialCode ? formatSpaceCode(initialCode) : '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleCreate() {
    setBusy(true)
    setError('')
    try {
      const next = generateSpaceCode()
      await onCreate(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'יצירת הפנקס נכשלה')
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const normalized = normalizeSpaceCode(code)
    if (!isValidSpaceCode(normalized)) {
      setError('הקוד חייב להכיל לפחות 8 תווים')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onJoin(normalized)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ההצטרפות נכשלה')
    } finally {
      setBusy(false)
    }
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

          <form onSubmit={(e) => void handleJoin(e)} className="space-y-4 animate-slide-up">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-forest">קוד פנקס</label>
              <input
                className="field font-display tracking-wider"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCD-EFGH-IJKL"
                autoComplete="off"
                autoFocus
                disabled={busy}
              />
            </div>
            {error && <p className="text-sm text-rose-700">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-forest py-3.5 text-base font-semibold text-cream shadow-sm transition active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? 'מצטרפים…' : 'הצטרפות'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-[480px]">
        <div className="mb-10 text-center animate-fade-in">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-forest text-gold shadow-lg">
            <BookOpen size={28} />
          </div>
          <p className="text-xs font-medium tracking-wide text-gold-dark">מעטפות</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-forest">
            הפנקס המשותף שלכם
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-forest/65">
            יצרו פנקס חדש ושלחו קישור הזמנה לבן/בת הזוג — בלי סיסמה ובלי אימייל.
          </p>
        </div>

        <div className="space-y-3 animate-slide-up">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleCreate()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-base font-semibold text-cream shadow-sm transition active:scale-[0.98] disabled:opacity-60"
          >
            <Sparkles size={18} />
            {busy ? 'יוצרים…' : 'צור פנקס חדש'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setMode('join')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-forest/15 bg-white/60 py-3.5 text-base font-semibold text-forest transition active:scale-[0.98]"
          >
            <KeyRound size={18} />
            הצטרף לפנקס קיים
          </button>
          {error && <p className="text-center text-sm text-rose-700">{error}</p>}
        </div>
      </div>
    </div>
  )
}
