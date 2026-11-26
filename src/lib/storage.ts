import type { Envelope } from './types'

const KEYS = {
  spaceCode: 'envelope_space_code',
  username: 'envelope_username',
  cache: 'envelope_cache',
  spaceConfirmed: 'envelope_space_confirmed',
} as const

export function getSpaceCode(): string | null {
  return localStorage.getItem(KEYS.spaceCode)
}

export function setSpaceCode(code: string) {
  localStorage.setItem(KEYS.spaceCode, code.trim())
  localStorage.setItem(KEYS.spaceConfirmed, '1')
}

export function isSpaceConfirmed(): boolean {
  return localStorage.getItem(KEYS.spaceConfirmed) === '1'
}

export function getUsername(): string {
  return localStorage.getItem(KEYS.username) || 'אורחים'
}

export function setUsername(name: string) {
  localStorage.setItem(KEYS.username, name.trim() || 'אורחים')
}

export function getCachedEnvelopes(): Envelope[] {
  try {
    const raw = localStorage.getItem(KEYS.cache)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Envelope[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function setCachedEnvelopes(rows: Envelope[]) {
  localStorage.setItem(KEYS.cache, JSON.stringify(rows))
}

export function resolveInitialSpaceCode(): string {
  const stored = getSpaceCode()
  if (stored) return stored
  const fromEnv = import.meta.env.VITE_DEFAULT_SPACE_CODE as string | undefined
  return fromEnv?.trim() || ''
}
