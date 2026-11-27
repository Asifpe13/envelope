import { useCallback, useEffect, useState } from 'react'
import { AuthSetupBanner } from './components/AuthSetupBanner'
import { BottomNav } from './components/BottomNav'
import { ConfirmModal } from './components/ConfirmModal'
import { ShareSpaceModal } from './components/ShareSpaceModal'
import { useEnvelopes } from './hooks/useEnvelopes'
import {
  clearSpaceFromUrl,
  formatSpaceCode,
  normalizeSpaceCode,
  readSpaceFromUrl,
  spaceCodesMatch,
} from './lib/spaceCode'
import { createSpaceRemote, ensureSpaceMembership, joinSpaceRemote } from './lib/spaces'
import {
  clearSpace,
  getUsername,
  isSpaceConfirmed,
  resolveInitialSpaceCode,
  setSpaceCode,
  setUsername,
} from './lib/storage'
import {
  ensureAnonymousSession,
  isSupabaseConfigured,
  probeSupabase,
  supabaseHost,
} from './lib/supabase'
import type { Envelope, EnvelopeInput, Screen } from './lib/types'
import { EnvelopeForm } from './screens/EnvelopeForm'
import { EnvelopeList } from './screens/EnvelopeList'
import { Home } from './screens/Home'
import { People } from './screens/People'
import { SpaceSetup } from './screens/SpaceSetup'

export default function App() {
  const [inviteOnBoot] = useState(() => readSpaceFromUrl())
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [authError, setAuthError] = useState<string | null>(null)
  const [cloudOk, setCloudOk] = useState(false)
  const [localOnly, setLocalOnly] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)

  const [spaceReady, setSpaceReady] = useState(
    () => isSpaceConfirmed() && Boolean(resolveInitialSpaceCode()),
  )
  const [spaceCode, setSpaceCodeState] = useState<string | null>(() =>
    spaceReady ? resolveInitialSpaceCode() : null,
  )
  const [username, setUsernameState] = useState(getUsername)
  const [screen, setScreen] = useState<Screen>('home')
  const [editing, setEditing] = useState<Envelope | null>(null)
  const [returnTo, setReturnTo] = useState<Screen>('home')
  const [shareOpen, setShareOpen] = useState(false)
  const [shareTitle, setShareTitle] = useState('שתפו את הפנקס')
  const [pendingInvite, setPendingInvite] = useState<string | null>(null)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)

  const cloudSync = !localOnly && cloudOk

  const {
    envelopes,
    status,
    error,
    stats,
    hostSuggestions,
    addEnvelope,
    updateEnvelope,
    deleteEnvelope,
    loadSamples,
  } = useEnvelopes(spaceCode, cloudSync)

  useEffect(() => {
    document.documentElement.lang = 'he'
    document.documentElement.dir = 'rtl'
  }, [])

  const connectCloud = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setAuthReady(true)
      setCloudOk(false)
      return
    }
    setAuthBusy(true)
    try {
      const probe = await probeSupabase()
      if (!probe.ok) {
        throw new Error(probe.detail)
      }
      await ensureAnonymousSession()
      const code = resolveInitialSpaceCode()
      if (code) {
        await ensureSpaceMembership(code)
      }
      setAuthError(null)
      setCloudOk(true)
      setLocalOnly(false)
    } catch (e) {
      setCloudOk(false)
      setAuthError(e instanceof Error ? e.message : 'שגיאת התחברות')
    } finally {
      setAuthBusy(false)
      setAuthReady(true)
    }
  }, [])

  useEffect(() => {
    void connectCloud()
  }, [connectCloud])

  const enterSpace = useCallback((code: string, opts?: { showShare?: boolean }) => {
    const normalized = normalizeSpaceCode(code)
    setSpaceCode(normalized)
    setSpaceCodeState(normalized)
    setSpaceReady(true)
    clearSpaceFromUrl()
    if (opts?.showShare) {
      setShareTitle('הפנקס מוכן — שתפו')
      setShareOpen(true)
    }
  }, [])

  const handleCreate = useCallback(
    async (code: string) => {
      if (localOnly || !cloudOk) {
        enterSpace(normalizeSpaceCode(code), { showShare: true })
        return
      }
      const registered = await createSpaceRemote(code)
      enterSpace(registered, { showShare: true })
    },
    [enterSpace, localOnly, cloudOk],
  )

  const handleJoin = useCallback(
    async (code: string) => {
      if (localOnly || !cloudOk) {
        enterSpace(normalizeSpaceCode(code))
        return
      }
      const joined = await joinSpaceRemote(code)
      enterSpace(joined)
    },
    [enterSpace, localOnly, cloudOk],
  )

  const openShare = useCallback(() => {
    setShareTitle('שתפו את הפנקס')
    setShareOpen(true)
  }, [])

  useEffect(() => {
    if (!authReady || !inviteOnBoot) return
    const invite = inviteOnBoot.trim()
    if (!invite) return

    if (!spaceReady || !spaceCode) {
      void handleJoin(invite).catch(() => {
        setPendingInvite(invite)
      })
      return
    }

    if (spaceCodesMatch(spaceCode, invite)) {
      clearSpaceFromUrl()
      return
    }

    setPendingInvite(invite)
  }, [authReady, inviteOnBoot, spaceReady, spaceCode, handleJoin])

  const openForm = useCallback((target: Envelope | null, back: Screen) => {
    setEditing(target)
    setReturnTo(back)
    setScreen('form')
  }, [])

  const handleSave = useCallback(
    async (input: EnvelopeInput) => {
      if (editing) {
        await updateEnvelope(editing.id, input)
      } else {
        await addEnvelope(input)
      }
      setEditing(null)
      setScreen(returnTo)
    },
    [editing, updateEnvelope, addEnvelope, returnTo],
  )

  function handleLeaveSpace() {
    clearSpace()
    setSpaceCodeState(null)
    setSpaceReady(false)
    setShareOpen(false)
    setLeaveConfirmOpen(false)
    setScreen('home')
  }

  const setupBanner =
    authError && !localOnly ? (
      <AuthSetupBanner
        message={authError}
        host={supabaseHost}
        busy={authBusy}
        onRetry={() => void connectCloud()}
        onContinueLocal={() => setLocalOnly(true)}
      />
    ) : null

  if (!authReady) {
    return (
      <div className="app-shell flex min-h-dvh items-center justify-center px-5">
        <p className="text-sm text-forest/60">מתחברים…</p>
      </div>
    )
  }

  if (!spaceReady || !spaceCode) {
    return (
      <div className="app-shell">
        {setupBanner}
        {localOnly && (
          <p className="bg-stone-100 px-4 py-2 text-center text-xs text-forest/70">
            מצב מקומי — הנתונים נשמרים רק במכשיר הזה עד ש־Supabase יופעל
          </p>
        )}
        <SpaceSetup
          initialCode={inviteOnBoot || ''}
          startOnJoin={Boolean(inviteOnBoot)}
          onCreate={handleCreate}
          onJoin={handleJoin}
        />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="app-frame">
        <main className="min-h-0 flex-1 overflow-y-auto">
          {setupBanner}
          {!authError && error && status !== 'synced' && (
            <div
              className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-right text-amber-950"
              dir="rtl"
              lang="he"
            >
              <p className="text-sm leading-relaxed">{error}</p>
              <div className="mt-2 flex justify-start">
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => void connectCloud()}
                  className="rounded-xl bg-forest px-3 py-1.5 text-xs font-semibold text-cream disabled:opacity-60"
                >
                  {authBusy ? 'בודקים…' : 'נסו שוב'}
                </button>
              </div>
            </div>
          )}
          {localOnly && (
            <p className="bg-stone-100 px-4 py-2 text-center text-xs text-forest/70" dir="rtl">
              מצב מקומי — בלי סנכרון ענן
            </p>
          )}

          {screen === 'home' && (
            <Home
              username={username}
              spaceCode={spaceCode}
              onEditName={() => {
                const next = window.prompt('איך לקרוא לכם במכשיר הזה?', username)
                if (next != null && next.trim()) {
                  setUsername(next)
                  setUsernameState(next.trim())
                }
              }}
              onShareSpace={openShare}
              onLeaveSpace={() => setLeaveConfirmOpen(true)}
              status={status}
              totalGiven={stats.totalGiven}
              eventCount={stats.eventCount}
              netBalance={stats.netBalance}
              receivedCount={stats.receivedCount}
              envelopes={envelopes}
              onGoList={() => setScreen('list')}
              onAdd={() => openForm(null, 'home')}
            />
          )}

          {screen === 'list' && (
            <EnvelopeList
              envelopes={envelopes}
              onEdit={(e) => openForm(e, 'list')}
              onDelete={deleteEnvelope}
              onSaveReceived={async (id, amount) => {
                await updateEnvelope(id, { amount_received: amount })
              }}
              onLoadSamples={loadSamples}
              onAdd={() => openForm(null, 'list')}
            />
          )}

          {screen === 'people' && <People envelopes={envelopes} />}

          {screen === 'form' && (
            <EnvelopeForm
              initial={editing}
              hostSuggestions={hostSuggestions}
              onCancel={() => {
                setEditing(null)
                setScreen(returnTo)
              }}
              onSave={handleSave}
            />
          )}
        </main>

        {screen !== 'form' && (
          <BottomNav
            current={screen}
            onNavigate={setScreen}
            onAdd={() => openForm(null, screen === 'people' ? 'people' : 'list')}
          />
        )}
      </div>

      <ShareSpaceModal
        open={shareOpen}
        spaceCode={spaceCode}
        title={shareTitle}
        onClose={() => setShareOpen(false)}
      />

      <ConfirmModal
        open={leaveConfirmOpen}
        title="לעזוב את הפנקס?"
        message="המכשיר הזה יצא מהפנקס הנוכחי. הנתונים בענן נשארים — תוכלו ליצור פנקס חדש או להצטרף עם קוד אחר."
        confirmLabel="עזיבה"
        onConfirm={handleLeaveSpace}
        onCancel={() => setLeaveConfirmOpen(false)}
      />

      <ConfirmModal
        open={Boolean(pendingInvite)}
        title="להחליף פנקס?"
        message={
          pendingInvite
            ? `פתחתם קישור הזמנה לפנקס ${formatSpaceCode(pendingInvite)}. להחליף את הפנקס הנוכחי במכשיר הזה?`
            : ''
        }
        confirmLabel="החלפה"
        onConfirm={() => {
          if (pendingInvite) {
            void handleJoin(pendingInvite).then(() => setPendingInvite(null))
          }
        }}
        onCancel={() => {
          setPendingInvite(null)
          clearSpaceFromUrl()
        }}
      />
    </div>
  )
}
