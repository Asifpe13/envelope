import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anon && !url.includes('YOUR_PROJECT'))

/** Clients are keyed by space_code so RLS receives `x-space-code` on every request. */
const clients = new Map<string, SupabaseClient>()

/**
 * Supabase client scoped to one notebook.
 * RLS policies require the `x-space-code` header to match `envelopes.space_code`.
 */
export function getSupabase(spaceCode: string): SupabaseClient | null {
  if (!isSupabaseConfigured || !url || !anon) return null
  const key = spaceCode.trim()
  if (!key) return null

  const existing = clients.get(key)
  if (existing) return existing

  const client = createClient(url, anon, {
    global: {
      headers: {
        'x-space-code': key,
      },
    },
  })
  clients.set(key, client)
  return client
}
