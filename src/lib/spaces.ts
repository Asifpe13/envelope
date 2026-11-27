import { normalizeSpaceCode } from './spaceCode'
import { ensureAnonymousSession, getSupabase, isSupabaseConfigured } from './supabase'

async function requireClient() {
  if (!isSupabaseConfigured) return null
  await ensureAnonymousSession()
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase לא מוגדר')
  return sb
}

/** Register a new notebook and make the current device a member. */
export async function createSpaceRemote(code: string): Promise<string> {
  const normalized = normalizeSpaceCode(code)
  const sb = await requireClient()
  if (!sb) return normalized

  const { data, error } = await sb.rpc('create_space', { p_code: normalized })
  if (error) throw new Error(error.message)
  return String(data ?? normalized)
}

/** Join an existing notebook as the current signed-in device. */
export async function joinSpaceRemote(code: string): Promise<string> {
  const normalized = normalizeSpaceCode(code)
  const sb = await requireClient()
  if (!sb) return normalized

  const { data, error } = await sb.rpc('join_space', { p_code: normalized })
  if (error) throw new Error(error.message)
  return String(data ?? normalized)
}
