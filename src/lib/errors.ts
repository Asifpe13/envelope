/** Map Supabase / network failures to clear Hebrew guidance. */
export function formatSyncError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : 'שגיאה לא ידועה'

  const lower = raw.toLowerCase()

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    lower.includes('network request failed')
  ) {
    return 'אין חיבור ל־Supabase (Failed to fetch). בדקו רשת / חוסם פרסומות, ודאו שהפרויקט פעיל, והפעילו Anonymous Sign-Ins.'
  }

  if (
    lower.includes('anonymous') ||
    lower.includes('anonymous_provider_disabled')
  ) {
    return 'יש להפעיל Anonymous Sign-Ins ב־Supabase: Authentication → Providers → Anonymous → Enable'
  }

  if (
    lower.includes('create_space') ||
    lower.includes('join_space') ||
    lower.includes('could not find the function') ||
    lower.includes('pgrst202')
  ) {
    return 'חסר סכמת DB. ב־Supabase SQL Editor הריצו את כל הקובץ supabase/schema.sql'
  }

  if (lower.includes('jwt') || lower.includes('invalid api key')) {
    return 'מפתח Supabase לא תקין — בדקו VITE_SUPABASE_URL ו־VITE_SUPABASE_ANON_KEY ב־Vercel'
  }

  return raw
}
