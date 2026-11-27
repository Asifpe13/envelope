import { formatSyncError } from './errors'
import { normalizeSpaceCode } from './spaceCode'
import { ensureAnonymousSession, getSupabase, isSupabaseConfigured } from './supabase'

async function requireClient() {
  if (!isSupabaseConfigured) return null
  await ensureAnonymousSession()
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase לא מוגדר')
  return sb
}

function rpcMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message)
  }
  return err instanceof Error ? err.message : String(err)
}

/** Register a new notebook and make the current device a member. */
export async function createSpaceRemote(code: string): Promise<string> {
  const normalized = normalizeSpaceCode(code)
  const sb = await requireClient()
  if (!sb) return normalized

  try {
    const { data, error } = await sb.rpc('create_space', { p_code: normalized })
    if (error) throw error
    return String(data ?? normalized)
  } catch (e) {
    throw new Error(formatSyncError(e))
  }
}

/** Join an existing notebook as the current signed-in device. */
export async function joinSpaceRemote(code: string): Promise<string> {
  const normalized = normalizeSpaceCode(code)
  const sb = await requireClient()
  if (!sb) return normalized

  try {
    const { data, error } = await sb.rpc('join_space', { p_code: normalized })
    if (error) throw error
    return String(data ?? normalized)
  } catch (e) {
    throw new Error(formatSyncError(e))
  }
}

/**
 * Make sure this device is a member of the notebook.
 * Local-only codes (created while cloud was down) are registered via create, or joined if they already exist.
 */
export async function ensureSpaceMembership(code: string): Promise<string> {
  const normalized = normalizeSpaceCode(code)
  const sb = await requireClient()
  if (!sb) return normalized

  try {
    const joined = await sb.rpc('join_space', { p_code: normalized })
    if (!joined.error) return String(joined.data ?? normalized)

    const msg = rpcMessage(joined.error).toLowerCase()
    if (msg.includes('not found') || msg.includes('space not found')) {
      const created = await sb.rpc('create_space', { p_code: normalized })
      if (created.error) {
        // Race: someone else created it — join again
        const again = await sb.rpc('join_space', { p_code: normalized })
        if (again.error) throw again.error
        return String(again.data ?? normalized)
      }
      return String(created.data ?? normalized)
    }

    // Already a member / duplicate — treat as success when join says so
    if (msg.includes('duplicate') || msg.includes('already')) {
      return normalized
    }

    throw joined.error
  } catch (e) {
    throw new Error(formatSyncError(e))
  }
}
