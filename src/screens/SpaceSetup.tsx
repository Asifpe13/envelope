import { useState } from 'react'
import { KeyRound } from 'lucide-react'

interface Props {
  initialCode: string
  onConfirm: (code: string) => void
}

export function SpaceSetup({ initialCode, onConfirm }: Props) {
  const [code, setCode] = useState(initialCode)
  const [confirm, setConfirm] = useState(initialCode ? initialCode : '')
  const [error, setError] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const a = code.trim()
    const b = confirm.trim()
    if (a.length < 4) {
      setError('הקוד חייב להכיל לפחות 4 תווים')
      return
    }
    if (a !== b) {
      setError('הקודים אינם תואמים')
      return
    }
    onConfirm(a)
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-[480px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-forest text-gold shadow-lg animate-fade-in">
            <KeyRound size={28} />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-forest">
            מעטפות
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-forest/65">
            הזינו קוד פנקס משותף — אותו קוד בשני הטלפונים, בלי התחברות.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 animate-slide-up">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-forest">
              קוד פנקס משותף
            </label>
            <input
              className="field"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="לדוגמה: our-home-2026"
              autoComplete="off"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-forest">
              אימות קוד
            </label>
            <input
              className="field"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="הקלידו שוב"
              autoComplete="off"
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
