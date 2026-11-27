/** Map Supabase / network failures to clear Hebrew (RTL-friendly) guidance. */
export function formatSyncError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : 'שגיאה לא ידועה'

  const lower = raw.toLowerCase()
  const name = err instanceof Error ? err.name.toLowerCase() : ''

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    lower.includes('network request failed') ||
    lower.includes('abort') ||
    name.includes('abort')
  ) {
    return 'אין חיבור לשרת מהמכשיר. רעננו את העמוד, לחצו «נסו להתחבר שוב», או נסו רשת אחרת. אם ההתחברות האנונימית כבר דולקת — בדרך כלל זה מטמון ישן של האפליקציה.'
  }

  if (
    lower.includes('anonymous') ||
    lower.includes('anonymous_provider_disabled')
  ) {
    return 'יש להפעיל התחברות אנונימית בדשבורד: אימות ← ספקים ← Anonymous ← הפעלה.'
  }

  if (
    lower.includes('create_space') ||
    lower.includes('join_space') ||
    lower.includes('could not find the function') ||
    lower.includes('pgrst202')
  ) {
    return 'חסרה סכמת מסד הנתונים. בעורך ה־SQL בדשבורד הריצו את כל הקובץ supabase/schema.sql.'
  }

  if (lower.includes('jwt') || lower.includes('invalid api key')) {
    return 'מפתח השרת לא תקין. בדקו ב־Vercel את משתני הסביבה של כתובת ומפתח Supabase.'
  }

  // Keep raw English only as last resort, prefixed so RTL readers know it's a technical detail
  if (/^[A-Za-z0-9]/.test(raw.trim())) {
    return `שגיאה מהשרת: ${raw}`
  }

  return raw
}
