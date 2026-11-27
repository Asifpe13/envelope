interface Props {
  message: string
  host?: string | null
  busy?: boolean
  onRetry?: () => void
  onContinueLocal?: () => void
}

const DASHBOARD =
  'https://supabase.com/dashboard/project/wiznbwjvyjkjvbnzhdcf'

export function AuthSetupBanner({
  message,
  host,
  busy,
  onRetry,
  onContinueLocal,
}: Props) {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-4 text-amber-950">
      <p className="text-sm font-semibold">סנכרון לא פעיל</p>
      <p className="mt-1 text-sm leading-relaxed">{message}</p>
      {host && (
        <p className="mt-1 text-[11px] text-amber-900/70" dir="ltr">
          {host}
        </p>
      )}
      <ol className="mt-3 list-decimal space-y-1 pr-5 text-sm leading-relaxed">
        <li>
          <a
            className="font-medium underline underline-offset-2"
            href={`${DASHBOARD}/auth/providers`}
            target="_blank"
            rel="noreferrer"
          >
            Authentication → Providers → Anonymous → Enable
          </a>
        </li>
        <li>
          <a
            className="font-medium underline underline-offset-2"
            href={`${DASHBOARD}/sql/new`}
            target="_blank"
            rel="noreferrer"
          >
            SQL Editor
          </a>{' '}
          → להדביק את כל <code className="rounded bg-amber-100 px-1">supabase/schema.sql</code> →
          Run
        </li>
        <li>כבו חוסם פרסומות / VPN לכתובת supabase.co ורעננו</li>
      </ol>
      <div className="mt-3 flex flex-wrap gap-3">
        {onRetry && (
          <button
            type="button"
            disabled={busy}
            onClick={onRetry}
            className="rounded-xl bg-forest px-3 py-2 text-sm font-semibold text-cream disabled:opacity-60"
          >
            {busy ? 'בודקים…' : 'נסה להתחבר שוב'}
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
