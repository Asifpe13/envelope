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
  return formatSpaceCode(raw)
}

/** Display form: ABCD-EFGH (groups of 4). */
export function formatSpaceCode(code: string): string {
  const raw = normalizeSpaceCode(code)
  if (!raw) return ''
  const parts: string[] = []
  for (let i = 0; i < raw.length; i += 4) {
    parts.push(raw.slice(i, i + 4))
  }
  return parts.join('-')
}

/** Strip separators, uppercase, map ambiguous glyphs. */
export function normalizeSpaceCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[\s\-_.]+/g, '')
    .split('')
    .map((ch) => AMBIGUOUS[ch] ?? ch)
    .filter((ch) => ALPHABET.includes(ch) || /[A-Z0-9]/.test(ch))
    .join('')
}

export function isValidSpaceCode(input: string): boolean {
  const raw = normalizeSpaceCode(input)
  return raw.length >= 4 && raw.length <= 32
}

export function buildInviteUrl(code: string, baseUrl = window.location.href): string {
  const url = new URL(baseUrl)
  url.search = ''
  url.hash = ''
  url.searchParams.set('space', normalizeSpaceCode(code))
  return url.toString()
}

/** Read invite code from `?space=` or `#space=`. */
export function readSpaceFromUrl(href = window.location.href): string | null {
  try {
    const url = new URL(href)
    const fromQuery = url.searchParams.get('space')
    if (fromQuery?.trim()) {
      const normalized = normalizeSpaceCode(fromQuery)
      return normalized || null
    }

    const hash = url.hash.replace(/^#/, '')
    if (hash.startsWith('space=')) {
      const value = decodeURIComponent(hash.slice('space='.length))
      const normalized = normalizeSpaceCode(value)
      return normalized || null
    }

    const hashParams = new URLSearchParams(hash)
    const fromHash = hashParams.get('space')
    if (fromHash?.trim()) {
      const normalized = normalizeSpaceCode(fromHash)
      return normalized || null
    }
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
