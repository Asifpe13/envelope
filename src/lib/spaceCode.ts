/** Crockford Base32 — omits I, L, O, U to avoid ambiguous characters. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

const AMBIGUOUS: Record<string, string> = {
  I: '1',
  L: '1',
  O: '0',
  U: 'V',
}

/** 8 characters → ~40 bits of entropy, shown as ABCD-EFGH. */
const CODE_LENGTH = 8

export function generateSpaceCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  let raw = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    raw += ALPHABET[bytes[i]! % ALPHABET.length]
  }
  return raw
}

function stripSeparators(input: string): string {
  return input.trim().replace(/[\s\-_.]+/g, '')
}

function looksLikeCrockford(input: string): boolean {
  const stripped = stripSeparators(input).toUpperCase()
  // Only our generated codes (exact length) — legacy freeform PINs stay as typed.
  if (stripped.length !== CODE_LENGTH) return false
  return [...stripped].every((ch) => {
    const mapped = AMBIGUOUS[ch] ?? ch
    return ALPHABET.includes(mapped)
  })
}

function normalizeCrockford(input: string): string {
  return stripSeparators(input)
    .toUpperCase()
    .split('')
    .map((ch) => AMBIGUOUS[ch] ?? ch)
    .filter((ch) => ALPHABET.includes(ch))
    .join('')
}

/** Display form: ABCD-EFGH for Crockford codes; otherwise the trimmed original. */
export function formatSpaceCode(code: string): string {
  const trimmed = code.trim()
  if (!trimmed) return ''
  if (!looksLikeCrockford(trimmed)) return trimmed
  const raw = normalizeCrockford(trimmed)
  const parts: string[] = []
  for (let i = 0; i < raw.length; i += 4) {
    parts.push(raw.slice(i, i + 4))
  }
  return parts.join('-')
}

/**
 * Canonical form for storage / comparison.
 * New Crockford codes → uppercase, no separators.
 * Legacy freeform PINs → trimmed as typed (so existing notebooks keep syncing).
 */
export function normalizeSpaceCode(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (looksLikeCrockford(trimmed)) return normalizeCrockford(trimmed)
  return trimmed
}

export function isValidSpaceCode(input: string): boolean {
  return normalizeSpaceCode(input).length >= 4
}

export function buildInviteUrl(code: string, baseUrl = window.location.href): string {
  const url = new URL(baseUrl)
  url.search = ''
  url.hash = ''
  url.searchParams.set('space', normalizeSpaceCode(code) || code.trim())
  return url.toString()
}

/** Read invite code from `?space=` or `#space=`. */
export function readSpaceFromUrl(href = window.location.href): string | null {
  try {
    const url = new URL(href)
    const fromQuery = url.searchParams.get('space')
    if (fromQuery?.trim()) return fromQuery.trim()

    const hash = url.hash.replace(/^#/, '')
    if (hash.startsWith('space=')) {
      const value = decodeURIComponent(hash.slice('space='.length)).trim()
      return value || null
    }

    const hashParams = new URLSearchParams(hash)
    const fromHash = hashParams.get('space')
    if (fromHash?.trim()) return fromHash.trim()
  } catch {
    /* ignore malformed URLs */
  }
  return null
}

/** Remove space invite params from the address bar without reloading. */
export function clearSpaceFromUrl() {
  try {
    const url = new URL(window.location.href)
    let changed = false
    if (url.searchParams.has('space')) {
      url.searchParams.delete('space')
      changed = true
    }
    if (url.hash.includes('space=')) {
      url.hash = ''
      changed = true
    }
    if (changed) {
      window.history.replaceState({}, '', url.pathname + url.search + url.hash)
    }
  } catch {
    /* ignore */
  }
}

/** True when two codes refer to the same notebook. */
export function spaceCodesMatch(a: string, b: string): boolean {
  return normalizeSpaceCode(a) === normalizeSpaceCode(b) || a.trim() === b.trim()
}
