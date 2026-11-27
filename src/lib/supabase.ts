import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anon && !url.includes('YOUR_PROJECT'))

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured || !url || !anon) return null
  if (!client) {
    client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  }
  return client
}

/** Ensure a durable anonymous session (no email). Required before data access. */
export async function ensureAnonymousSession(): Promise<void> {
  const sb = getSupabase()
  if (!sb) return

  const { data: existing } = await sb.auth.getSession()
  if (existing.session) return

  const { error } = await sb.auth.signInAnonymously()
  if (error) {
    throw new Error(
      error.message.includes('anonymous') || error.status === 422
        ? 'יש להפעיל Anonymous Sign-Ins ב־Supabase (Authentication → Providers)'
        : error.message,
    )
  }
}
