interface Props {
  message: string
  onContinueLocal?: () => void
}

const DASHBOARD =
  'https://supabase.com/dashboard/project/wiznbwjvyjkjvbnzhdcf'

export function AuthSetupBanner({ message, onContinueLocal }: Props) {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-4 text-amber-950">
      <p className="text-sm font-semibold">סנכרון לא פעיל</p>
      <p className="mt-1 text-sm leading-relaxed">{message}</p>
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
      </ol>
      {onContinueLocal && (
        <button
          type="button"
          onClick={onContinueLocal}
          className="mt-3 text-sm font-semibold underline underline-offset-2"
        >
          המשך במצב מקומי במכשיר הזה
        </button>
      )}
    </div>
  )
}
