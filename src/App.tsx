import { useCallback, useEffect, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { useEnvelopes } from './hooks/useEnvelopes'
import {
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

  if (!spaceReady || !spaceCode) {
    return (
      <div className="app-shell">
        <SpaceSetup
          initialCode={resolveInitialSpaceCode()}
          onConfirm={(code) => {
            setSpaceCode(code)
            setSpaceCodeState(code)
            setSpaceReady(true)
          }}
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
              onEditName={() => {
                const next = window.prompt('איך לקרוא לכם במכשיר הזה?', username)
                if (next != null && next.trim()) {
                  setUsername(next)
                  setUsernameState(next.trim())
                }
              }}
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
    </div>
  )
}
