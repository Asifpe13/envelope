import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { formatSyncError } from './errors'
import { SUPABASE_PUBLIC_ANON_KEY, SUPABASE_PUBLIC_URL } from './supabasePublic'

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function pickUrl(): string | undefined {
  const fromEnv = envUrl?.trim()
  if (fromEnv && !fromEnv.includes('YOUR_PROJECT')) return fromEnv
  const fromPublic = SUPABASE_PUBLIC_URL.trim()
  if (fromPublic && !fromPublic.includes('YOUR_PROJECT')) return fromPublic
  return undefined
}

function pickAnon(): string | undefined {
  const fromEnv = envAnon?.trim()
  if (fromEnv) return fromEnv
  const fromPublic = SUPABASE_PUBLIC_ANON_KEY.trim()
  return fromPublic || undefined
}

const configuredUrl = pickUrl()
const anon = pickAnon()

/**
 * Prefer same-origin `/sb` when the host rewrites it (Vercel + Vite proxy).
 * On Cursor/grok.bot publish hosts there is no `/sb` rewrite — use the project URL directly.
 */
function hostSupportsSbProxy(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') return true
  if (host.endsWith('.vercel.app')) return true
  return false
}

/**
 * Browser traffic on Vercel/local goes through same-origin `/sb` so mobile
 * ad-blockers that block `*.supabase.co` cannot break sync.
 *
 * On `*.apps.grok.bot` (and other hosts without rewrites) use the direct
 * Supabase URL so REST + Realtime work.
 *
 * Vercel HTTP rewrites cannot upgrade WebSockets, so Realtime must stay off
 * while the client URL is same-origin `/sb` (REST remains the source of truth).
 */
function resolveSupabaseUrl(): string | undefined {
  if (!configuredUrl) return undefined
  if (typeof window === 'undefined') return configuredUrl
  if (hostSupportsSbProxy()) return `${window.location.origin}/sb`
  return configuredUrl
}

export const isSupabaseConfigured = Boolean(configuredUrl && anon)

/** True when the browser talks to Supabase via same-origin `/sb` (no WS proxy). */
export function isSupabaseProxied(): boolean {
  if (typeof window === 'undefined') return false
  const url = resolveSupabaseUrl()
  return Boolean(url?.startsWith(`${window.location.origin}/sb`))
}

/** Realtime only when pointing at Supabase directly (not the Vercel `/sb` rewrite). */
export function isRealtimeEnabled(): boolean {
  return isSupabaseConfigured && !isSupabaseProxied()
}

export const supabaseHost =
  typeof window !== 'undefined' ? window.location.host : configuredUrl ?? null

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  const url = resolveSupabaseUrl()
  if (!isSupabaseConfigured || !url || !anon) return null
  if (!client) {
    client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Accept: 'application/json',
          'Accept-Profile': 'public',
        },
        fetch: (input, init) => {
          const ctrl = new AbortController()
          const timer = setTimeout(() => ctrl.abort(), 20_000)
          const signal = init?.signal
          if (signal) {
            if (signal.aborted) ctrl.abort()
            else signal.addEventListener('abort', () => ctrl.abort(), { once: true })
          }
          const headers = new Headers(init?.headers)
          if (!headers.has('Accept')) headers.set('Accept', 'application/json')
          if (!headers.has('Accept-Profile')) headers.set('Accept-Profile', 'public')
          return fetch(input, { ...init, headers, signal: ctrl.signal }).finally(() =>
            clearTimeout(timer),
          )
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
  const url = resolveSupabaseUrl()
  if (!url || !anon) return { ok: false, detail: 'חסרים משתני סביבה' }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 12_000)
  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      signal: ctrl.signal,
    })
    if (!res.ok) return { ok: false, detail: `בדיקת חיבור נכשלה (קוד ${res.status})` }
    return { ok: true, detail: url }
  } catch (e) {
    return {
      ok: false,
      detail: formatSyncError(e),
    }
  } finally {
    clearTimeout(timer)
  }
}
