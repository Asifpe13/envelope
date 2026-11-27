import { useCallback, useEffect, useState } from 'react'
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
import {
  clearSpace,
  getEnvSpacePrefill,
  getUsername,
  isSpaceConfirmed,
  resolveInitialSpaceCode,
  setSpaceCode,
  setUsername,
} from './lib/storage'
import type { Envelope, EnvelopeInput, Screen } from './lib/types'
import { EnvelopeForm } from './screens/EnvelopeForm'
import { EnvelopeList } from './screens/EnvelopeList'
import { Home } from './screens/Home'
import { People } from './screens/People'
import { SpaceSetup } from './screens/SpaceSetup'

export default function App() {
  const [inviteOnBoot] = useState(() => readSpaceFromUrl())

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
  } = useEnvelopes(spaceCode)

  useEffect(() => {
    document.documentElement.lang = 'he'
    document.documentElement.dir = 'rtl'
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

  const openShare = useCallback(() => {
    setShareTitle('שתפו את הפנקס')
    setShareOpen(true)
  }, [])

  // Deep link: ?space=CODE on boot
  useEffect(() => {
    if (!inviteOnBoot) return
    const invite = inviteOnBoot.trim()
    if (!invite) return

    if (!spaceReady || !spaceCode) {
      // Auto-join when there is no existing notebook
      enterSpace(invite)
      return
    }

    if (spaceCodesMatch(spaceCode, invite)) {
      clearSpaceFromUrl()
      return
    }

    // Switching notebooks — ask first
    setPendingInvite(invite)
  }, [inviteOnBoot, spaceReady, spaceCode, enterSpace])

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

  if (!spaceReady || !spaceCode) {
    const joinPrefill = inviteOnBoot || getEnvSpacePrefill()
    return (
      <div className="app-shell">
        <SpaceSetup
          initialCode={joinPrefill}
          startOnJoin={Boolean(inviteOnBoot)}
          onCreate={(code) => enterSpace(code, { showShare: true })}
          onJoin={(code) => enterSpace(code)}
        />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="app-frame">
        <main className="min-h-0 flex-1 overflow-y-auto">
          {error && status !== 'synced' && (
            <p className="bg-amber-50 px-4 py-2 text-center text-[11px] text-amber-900">
              {error}
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
            enterSpace(pendingInvite)
            setPendingInvite(null)
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
