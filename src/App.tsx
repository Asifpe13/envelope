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
import { createSpaceRemote, joinSpaceRemote } from './lib/spaces'
import {
  clearSpace,
  getUsername,
  isSpaceConfirmed,
  resolveInitialSpaceCode,
  setSpaceCode,
  setUsername,
} from './lib/storage'
import { ensureAnonymousSession, isSupabaseConfigured } from './lib/supabase'
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
  const [localOnly, setLocalOnly] = useState(false)

  const [spaceReady, setSpaceReady] = useState(
    () => isSpaceConfirmed() && Boolean(resolveInitialSpaceCode()),
  )
  const [spaceCode, setSpaceCodeState] = useState<string | null>(() =>
    spaceReady ? resolveInitialSpaceCode() : null,
  )
  const [username, setUsernameState] = useState(getUsername)
  const [screen, setScreen] = useState<Screen>('home')
  const [editing, setEditing] = useState<Envelope | null>(null)
  const [returnTo, setReturnTo] = useState<Screen>('list')
  const [shareOpen, setShareOpen] = useState(false)
  const [shareTitle, setShareTitle] = useState('שתפו את הפנקס')
  const [pendingInvite, setPendingInvite] = useState<string | null>(null)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)

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
  } = useEnvelopes(spaceCode, !localOnly && !authError)

  useEffect(() => {
    document.documentElement.lang = 'he'
    document.documentElement.dir = 'rtl'
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true)
      return
    }
    void ensureAnonymousSession()
      .then(() => {
        setAuthReady(true)
        setAuthError(null)
      })
      .catch((e) => {
        setAuthReady(true)
        setAuthError(e instanceof Error ? e.message : 'שגיאת התחברות')
      })
  }, [])

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
      if (localOnly || authError) {
        enterSpace(normalizeSpaceCode(code), { showShare: true })
        return
      }
      const registered = await createSpaceRemote(code)
      enterSpace(registered, { showShare: true })
    },
    [enterSpace, localOnly, authError],
  )

  const handleJoin = useCallback(
    async (code: string) => {
      if (localOnly || authError) {
        enterSpace(normalizeSpaceCode(code))
        return
      }
      const joined = await joinSpaceRemote(code)
      enterSpace(joined)
    },
    [enterSpace, localOnly, authError],
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
        {authError && !localOnly && (
          <AuthSetupBanner
            message={authError}
            onContinueLocal={() => setLocalOnly(true)}
          />
        )}
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
          {authError && !localOnly && status !== 'synced' && (
            <AuthSetupBanner message={authError || error || ''} />
          )}
          {!authError && error && status !== 'synced' && (
            <p className="bg-amber-50 px-4 py-2 text-center text-[11px] text-amber-900">
              {error}
            </p>
          )}
          {localOnly && (
            <p className="bg-stone-100 px-4 py-2 text-center text-xs text-forest/70">
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
