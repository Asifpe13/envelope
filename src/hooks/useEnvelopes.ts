import { useCallback, useEffect, useMemo, useState } from 'react'
import { SAMPLE_ENVELOPES } from '../lib/samples'
import { setCachedEnvelopes, getCachedEnvelopes } from '../lib/storage'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { Envelope, EnvelopeInput, SyncStatus } from '../lib/types'

function sortRows(rows: Envelope[]): Envelope[] {
  return [...rows].sort((a, b) => {
    const da = a.created_at || ''
    const db = b.created_at || ''
    return db.localeCompare(da)
  })
}

function normalizeRow(row: Record<string, unknown>): Envelope {
  return {
    id: String(row.id),
    space_code: String(row.space_code ?? ''),
    event_type: String(row.event_type ?? ''),
    host_name: String(row.host_name ?? ''),
    event_date: (row.event_date as string | null) ?? null,
    attended: Boolean(row.attended),
    party_size_type: (row.party_size_type as Envelope['party_size_type']) || 'couple',
    party_count: Number(row.party_count) || 1,
    amount_given: Number(row.amount_given) || 0,
    amount_received:
      row.amount_received == null || row.amount_received === ''
        ? null
        : Number(row.amount_received),
    notes: (row.notes as string | null) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  }
}

function localId() {
  return crypto.randomUUID()
}

export function useEnvelopes(spaceCode: string | null) {
  const [envelopes, setEnvelopes] = useState<Envelope[]>(() => getCachedEnvelopes())
  const [status, setStatus] = useState<SyncStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const client = spaceCode && isSupabaseConfigured ? getSupabase(spaceCode) : null

  const commit = useCallback((rows: Envelope[], nextStatus: SyncStatus) => {
    const sorted = sortRows(rows)
    setEnvelopes(sorted)
    setCachedEnvelopes(sorted)
    setStatus(nextStatus)
  }, [])

  const patchLocal = useCallback(
    (updater: (prev: Envelope[]) => Envelope[], nextStatus: SyncStatus) => {
      setEnvelopes((prev) => {
        const sorted = sortRows(updater(prev))
        setCachedEnvelopes(sorted)
        return sorted
      })
      setStatus(nextStatus)
    },
    [],
  )

  const refresh = useCallback(async () => {
    if (!spaceCode) {
      setStatus('offline')
      return
    }

    if (!client) {
      const cached = getCachedEnvelopes().filter((e) => e.space_code === spaceCode)
      commit(cached, 'cache')
      setError(isSupabaseConfigured ? null : 'Supabase לא מוגדר — עובדים במצב מקומי')
      return
    }

    setStatus('loading')
    setError(null)
    try {
      const { data, error: qErr } = await client
        .from('envelopes')
        .select('*')
        .eq('space_code', spaceCode)
        .order('created_at', { ascending: false })

      if (qErr) throw new Error(qErr.message)
      const rows = (data ?? []).map((r) => normalizeRow(r as Record<string, unknown>))
      commit(rows, 'synced')
    } catch (e) {
      const cached = getCachedEnvelopes().filter((e) => e.space_code === spaceCode)
      commit(cached.length ? cached : getCachedEnvelopes(), 'cache')
      setError(e instanceof Error ? e.message : 'שגיאת סנכרון')
    }
  }, [spaceCode, client, commit])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!spaceCode || !client) return

    const channel = client
      .channel(`envelopes:${spaceCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'envelopes',
          filter: `space_code=eq.${spaceCode}`,
        },
        (payload) => {
          setEnvelopes((prev) => {
            let next = [...prev]
            if (payload.eventType === 'INSERT' && payload.new) {
              const row = normalizeRow(payload.new as Record<string, unknown>)
              if (!next.some((e) => e.id === row.id)) next = [row, ...next]
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const row = normalizeRow(payload.new as Record<string, unknown>)
              next = next.map((e) => (e.id === row.id ? row : e))
            } else if (payload.eventType === 'DELETE' && payload.old) {
              const id = String((payload.old as { id?: string }).id ?? '')
              next = next.filter((e) => e.id !== id)
            }
            const sorted = sortRows(next)
            setCachedEnvelopes(sorted)
            setStatus('synced')
            return sorted
          })
        },
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [spaceCode, client])

  const toPayload = useCallback(
    (input: EnvelopeInput) => {
      if (!spaceCode) throw new Error('אין קוד פנקס')
      return {
        space_code: spaceCode,
        event_type: input.event_type,
        host_name: input.host_name.trim(),
        event_date: input.event_date || null,
        attended: input.attended,
        party_size_type: input.party_size_type,
        party_count: input.party_count,
        amount_given: Number(input.amount_given) || 0,
        amount_received:
          input.amount_received == null || input.amount_received === ('' as unknown)
            ? null
            : Number(input.amount_received),
        notes: input.notes?.trim() || null,
      }
    },
    [spaceCode],
  )

  const addEnvelope = useCallback(
    async (input: EnvelopeInput) => {
      const payload = toPayload(input)

      if (!client) {
        const local: Envelope = {
          ...payload,
          id: localId(),
          created_at: new Date().toISOString(),
          amount_received: payload.amount_received,
        }
        patchLocal((prev) => [local, ...prev], 'cache')
        return local
      }

      const { data, error: qErr } = await client
        .from('envelopes')
        .insert(payload)
        .select('*')
        .single()
      if (qErr) throw new Error(qErr.message)
      const row = normalizeRow(data as Record<string, unknown>)
      patchLocal((prev) => [row, ...prev.filter((e) => e.id !== row.id)], 'synced')
      return row
    },
    [toPayload, patchLocal, client],
  )

  const updateEnvelope = useCallback(
    async (id: string, patch: Partial<EnvelopeInput>) => {
      if (!spaceCode) throw new Error('אין קוד פנקס')

      const payload: Record<string, unknown> = {}
      if (patch.event_type !== undefined) payload.event_type = patch.event_type
      if (patch.host_name !== undefined) payload.host_name = patch.host_name.trim()
      if (patch.event_date !== undefined) payload.event_date = patch.event_date || null
      if (patch.attended !== undefined) payload.attended = patch.attended
      if (patch.party_size_type !== undefined) payload.party_size_type = patch.party_size_type
      if (patch.party_count !== undefined) payload.party_count = patch.party_count
      if (patch.amount_given !== undefined) payload.amount_given = Number(patch.amount_given) || 0
      if (patch.amount_received !== undefined) {
        payload.amount_received =
          patch.amount_received == null || Number.isNaN(Number(patch.amount_received))
            ? null
            : Number(patch.amount_received)
      }
      if (patch.notes !== undefined) payload.notes = patch.notes?.trim() || null

      if (!client) {
        patchLocal(
          (prev) => prev.map((e) => (e.id === id ? normalizeRow({ ...e, ...payload }) : e)),
          'cache',
        )
        return
      }

      const { data, error: qErr } = await client
        .from('envelopes')
        .update(payload)
        .eq('id', id)
        .eq('space_code', spaceCode)
        .select('*')
        .single()
      if (qErr) throw new Error(qErr.message)
      const row = normalizeRow(data as Record<string, unknown>)
      patchLocal(
        (prev) => prev.map((e) => (e.id === row.id ? row : e)),
        'synced',
      )
    },
    [spaceCode, patchLocal, client],
  )

  const deleteEnvelope = useCallback(
    async (id: string) => {
      if (!spaceCode) throw new Error('אין קוד פנקס')

      if (!client) {
        patchLocal((prev) => prev.filter((e) => e.id !== id), 'cache')
        return
      }

      const { error: qErr } = await client
        .from('envelopes')
        .delete()
        .eq('id', id)
        .eq('space_code', spaceCode)
      if (qErr) throw new Error(qErr.message)
      patchLocal((prev) => prev.filter((e) => e.id !== id), 'synced')
    },
    [spaceCode, patchLocal, client],
  )

  const loadSamples = useCallback(async () => {
    if (!spaceCode) throw new Error('אין קוד פנקס')
    const payloads = SAMPLE_ENVELOPES.map((s) => toPayload(s))

    if (!client) {
      const locals: Envelope[] = payloads.map((payload, i) => ({
        ...payload,
        id: localId(),
        created_at: new Date(Date.now() - i).toISOString(),
        amount_received: payload.amount_received,
      }))
      patchLocal((prev) => [...locals, ...prev], 'cache')
      return
    }

    const { data, error: qErr } = await client.from('envelopes').insert(payloads).select('*')
    if (qErr) throw new Error(qErr.message)
    const rows = (data ?? []).map((r) => normalizeRow(r as Record<string, unknown>))
    patchLocal((prev) => [...rows, ...prev], 'synced')
  }, [spaceCode, toPayload, patchLocal, client])

  const stats = useMemo(() => {
    const totalGiven = envelopes.reduce((s, e) => s + (Number(e.amount_given) || 0), 0)
    const withReceived = envelopes.filter((e) => e.amount_received != null)
    const totalReceived = withReceived.reduce(
      (s, e) => s + (Number(e.amount_received) || 0),
      0,
    )
    const givenOnReceived = withReceived.reduce(
      (s, e) => s + (Number(e.amount_given) || 0),
      0,
    )
    return {
      totalGiven,
      eventCount: envelopes.length,
      netBalance: totalReceived - givenOnReceived,
      receivedCount: withReceived.length,
    }
  }, [envelopes])

  const hostSuggestions = useMemo(() => {
    const set = new Set(envelopes.map((e) => e.host_name.trim()).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b, 'he'))
  }, [envelopes])

  return {
    envelopes,
    status,
    error,
    stats,
    hostSuggestions,
    refresh,
    addEnvelope,
    updateEnvelope,
    deleteEnvelope,
    loadSamples,
  }
}
