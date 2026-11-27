interface Props {
  message: string
  host?: string | null
  busy?: boolean
  onRetry?: () => void
  onContinueLocal?: () => void
}

const DASHBOARD =
  'https://supabase.com/dashboard/project/wiznbwjvyjkjvbnzhdcf'

function Ltr({ children }: { children: string }) {
  return (
    <span className="mx-0.5 inline-block font-mono text-[12px]" dir="ltr">
      {children}
    </span>
  )
}

export function AuthSetupBanner({
  message,
  host,
  busy,
  onRetry,
  onContinueLocal,
}: Props) {
  return (
    <div
      className="border-b border-amber-200 bg-amber-50 px-4 py-4 text-right text-amber-950"
      dir="rtl"
      lang="he"
    >
      <p className="text-sm font-semibold">הסנכרון לא פעיל</p>
      <p className="mt-1 text-sm leading-relaxed">{message}</p>
      {host && (
        <p className="mt-2 text-[11px] leading-relaxed text-amber-900/75">
          חיבור דרך:{' '}
          <Ltr>{host}</Ltr>
        </p>
      )}

      <p className="mt-3 text-sm font-semibold">מה לבדוק</p>
      <ol className="mt-2 list-decimal space-y-2 ps-5 text-sm leading-relaxed marker:font-semibold">
        <li>
          בדשבורד של Supabase פתחו{' '}
          <a
            className="font-medium underline underline-offset-2"
            href={`${DASHBOARD}/auth/providers`}
            target="_blank"
            rel="noreferrer"
          >
            אימות ← ספקים
          </a>
          , והפעילו את{' '}
          <span className="font-semibold">התחברות אנונימית</span>
          {' '}
          (<Ltr>Anonymous</Ltr>).
        </li>
        <li>
          ב־
          <a
            className="font-medium underline underline-offset-2"
            href={`${DASHBOARD}/sql/new`}
            target="_blank"
            rel="noreferrer"
          >
            עורך ה־SQL
          </a>{' '}
          הדביקו את כל תוכן הקובץ{' '}
          <Ltr>supabase/schema.sql</Ltr>
          {' '}ולחצו הרצה.
        </li>
        <li>לחצו «נסו להתחבר שוב». אם עדיין נכשל — רעננו את העמוד אחרי עדכון האתר.</li>
      </ol>

      <div className="mt-4 flex flex-wrap items-center justify-start gap-3">
        {onRetry && (
          <button
            type="button"
            disabled={busy}
            onClick={onRetry}
            className="rounded-xl bg-forest px-3 py-2 text-sm font-semibold text-cream disabled:opacity-60"
          >
            {busy ? 'בודקים…' : 'נסו להתחבר שוב'}
          </button>
        )}
        {onContinueLocal && (
          <button
            type="button"
            onClick={onContinueLocal}
            className="text-sm font-semibold underline underline-offset-2"
          >
            המשך במצב מקומי במכשיר הזה
          </button>
        )}
      </div>
    </div>
  )
}
