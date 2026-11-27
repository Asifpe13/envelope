import type { Envelope, PartySizeType } from './types'

export function formatIls(amount: number): string {
  const rounded = Math.round(amount)
  return `${rounded.toLocaleString('he-IL')} ₪`
}

export function formatNet(diff: number): string {
  const sign = diff > 0 ? '+' : diff < 0 ? '' : ''
  return `${sign}${Math.round(diff).toLocaleString('he-IL')} ₪`
}

export function partyLabel(
  attended: boolean,
  type: PartySizeType,
  count: number,
): string {
  if (!attended) return 'לא הגעתי'
  if (type === 'solo') return 'הגעתי • לבד (1)'
  if (type === 'couple') return 'הגעתי • זוג (2)'
  const kids = Math.max(0, count - 2)
  return `הגעתי • זוג + ${kids} ילדים`
}

export function childrenFromCount(count: number): number {
  return Math.max(1, count - 2)
}

export function partyCountFrom(type: PartySizeType, children = 1): number {
  if (type === 'solo') return 1
  if (type === 'couple') return 2
  return 2 + Math.max(1, children)
}

export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function envelopesToCsv(rows: Envelope[]): string {
  const header = [
    'id',
    'event_type',
    'host_name',
    'event_date',
    'attended',
    'party_size_type',
    'party_count',
    'amount_given',
    'amount_received',
    'notes',
    'created_at',
  ]
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }
  const lines = rows.map((r) =>
    [
      r.id,
      r.event_type,
      r.host_name,
      r.event_date ?? '',
      r.attended,
      r.party_size_type,
      r.party_count,
      r.amount_given,
      r.amount_received ?? '',
      r.notes ?? '',
      r.created_at,
    ]
      .map(escape)
      .join(','),
  )
  return '\uFEFF' + [header.join(','), ...lines].join('\n')
}

export function groupByHost(rows: Envelope[]) {
  const map = new Map<
    string,
    {
      host: string
      events: Envelope[]
      totalGiven: number
      attendedCount: number
    }
  >()
  for (const row of rows) {
    const key = row.host_name.trim()
    const existing = map.get(key)
    if (existing) {
      existing.events.push(row)
      existing.totalGiven += Number(row.amount_given) || 0
      if (row.attended) existing.attendedCount += 1
    } else {
      map.set(key, {
        host: key,
        events: [row],
        totalGiven: Number(row.amount_given) || 0,
        attendedCount: row.attended ? 1 : 0,
      })
    }
  }
  return [...map.values()].sort((a, b) => b.totalGiven - a.totalGiven)
}
