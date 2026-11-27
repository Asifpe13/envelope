import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { formatSyncError } from './errors'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anon && !url.includes('YOUR_PROJECT'))
export const supabaseHost = url ? (() => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
})() : null

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured || !url || !anon) return null
  if (!client) {
    client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        // Avoid navigator.locks deadlocks on some mobile browsers
        lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>) => fn(),
      },
      global: {
        fetch: (input, init) => {
          const ctrl = new AbortController()
          const timer = setTimeout(() => ctrl.abort(), 15_000)
          const signal = init?.signal
          if (signal) {
            if (signal.aborted) ctrl.abort()
            else signal.addEventListener('abort', () => ctrl.abort(), { once: true })
          }
          return fetch(input, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer))
        },
      },
    })
  }
  return client
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function clearBrokenSession(sb: SupabaseClient) {
  try {
    await sb.auth.signOut({ scope: 'local' })
  } catch {
    /* ignore */
  }
}

/** Ensure a durable anonymous session (no email). Retries transient network failures. */
export async function ensureAnonymousSession(): Promise<void> {
  const sb = getSupabase()
  if (!sb) return

  let lastError: unknown

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data: existing, error: sessionErr } = await sb.auth.getSession()
      if (sessionErr) throw sessionErr
      if (existing.session) return

      const { error } = await sb.auth.signInAnonymously()
      if (error) throw error
      return
    } catch (e) {
      lastError = e
      const msg = e instanceof Error ? e.message.toLowerCase() : String(e).toLowerCase()
      const transient =
        msg.includes('failed to fetch') ||
        msg.includes('network') ||
        msg.includes('abort') ||
        msg.includes('timeout') ||
        msg.includes('load failed')

      if (transient) {
        await clearBrokenSession(sb)
      }

      if (attempt < 2 && transient) {
        await sleep(400 * (attempt + 1))
        continue
      }
      break
    }
  }

  throw new Error(formatSyncError(lastError))
}

/** Quick reachability check used by the retry UI. */
export async function probeSupabase(): Promise<{ ok: boolean; detail: string }> {
  if (!url || !anon) return { ok: false, detail: 'חסרים משתני סביבה' }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 10_000)
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      signal: ctrl.signal,
    })
    if (!res.ok) return { ok: false, detail: `health HTTP ${res.status}` }
    return { ok: true, detail: supabaseHost ?? url }
  } catch (e) {
    return {
      ok: false,
      detail: formatSyncError(e),
    }
  } finally {
    clearTimeout(timer)
  }
}
