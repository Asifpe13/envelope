import { useEffect } from 'react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'מחק',
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-forest/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm animate-slide-up rounded-2xl bg-cream p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-semibold text-forest">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-forest/70">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-cream"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl border border-forest/15 bg-white/60 px-4 py-3 text-sm font-medium text-forest"
            onClick={onCancel}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}
