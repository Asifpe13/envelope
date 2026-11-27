import { Check, Copy, Link2, Share2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { buildInviteUrl, formatSpaceCode } from '../lib/spaceCode'

interface Props {
  open: boolean
  spaceCode: string
  title?: string
  onClose: () => void
}

type CopiedKind = 'link' | 'code' | null

export function ShareSpaceModal({
  open,
  spaceCode,
  title = 'שתפו את הפנקס',
  onClose,
}: Props) {
  const [copied, setCopied] = useState<CopiedKind>(null)
  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const display = formatSpaceCode(spaceCode)
  const inviteUrl = buildInviteUrl(spaceCode)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(null), 1800)
    return () => window.clearTimeout(t)
  }, [copied])

  if (!open) return null

  async function copyText(text: string, kind: CopiedKind) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
    } catch {
      window.prompt('העתיקו את הטקסט:', text)
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({
        title: 'מעטפות — הזמנה לפנקס משותף',
        text: `הצטרפו לפנקס המשותף שלנו במעטפות. הקוד: ${display}`,
        url: inviteUrl,
      })
    } catch {
      /* user cancelled or share unavailable */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-forest/45 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-space-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-scale-in overflow-hidden rounded-3xl bg-cream shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-forest px-5 pb-8 pt-5 text-cream">
          <button
            type="button"
            onClick={onClose}
            className="absolute start-4 top-4 rounded-full p-1.5 text-cream/70 transition hover:bg-white/10 hover:text-cream"
            aria-label="סגור"
          >
            <X size={18} />
          </button>
          <p className="text-center text-[11px] font-medium tracking-wide text-gold">מעטפות</p>
          <h3
            id="share-space-title"
            className="mt-1 text-center font-display text-xl font-semibold"
          >
            {title}
          </h3>
          <p className="mt-2 text-center text-sm leading-relaxed text-cream/70">
            שני הטלפונים נכנסים לאותו פנקס בלי התחברות
          </p>
        </div>

        <div className="relative -mt-4 px-5 pb-5">
          <div className="rounded-2xl bg-white px-4 py-5 text-center shadow-sm ring-1 ring-forest/8">
            <p className="text-[11px] font-medium text-forest/50">קוד הפנקס</p>
            <p
              className="mt-2 select-all font-display text-3xl font-bold tracking-[0.18em] text-forest"
              dir="ltr"
            >
              {display}
            </p>
          </div>

          <div className="mt-4 space-y-2.5 animate-slide-up" style={{ animationDelay: '80ms' }}>
            <button
              type="button"
              onClick={() => void copyText(inviteUrl, 'link')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-sm font-semibold text-cream transition active:scale-[0.98]"
            >
              {copied === 'link' ? <Check size={16} /> : <Link2 size={16} />}
              {copied === 'link' ? 'הקישור הועתק' : 'העתק קישור הזמנה'}
            </button>

            <button
              type="button"
              onClick={() => void copyText(display, 'code')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-forest/12 bg-white/80 py-3.5 text-sm font-semibold text-forest transition active:scale-[0.98]"
            >
              {copied === 'code' ? <Check size={16} /> : <Copy size={16} />}
              {copied === 'code' ? 'הקוד הועתק' : 'העתק קוד'}
            </button>

            {canNativeShare && (
              <button
                type="button"
                onClick={() => void nativeShare()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gold/40 bg-gold/15 py-3.5 text-sm font-semibold text-forest transition active:scale-[0.98]"
              >
                <Share2 size={16} className="text-gold-dark" />
                שיתוף…
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
