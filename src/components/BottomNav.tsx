import { Home, List, Users, Plus } from 'lucide-react'
import type { Screen } from '../lib/types'

interface Props {
  current: Screen
  onNavigate: (screen: Screen) => void
  onAdd: () => void
}

const ITEMS: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'בית', icon: Home },
  { id: 'list', label: 'מעטפות', icon: List },
  { id: 'people', label: 'אנשים', icon: Users },
]

export function BottomNav({ current, onNavigate, onAdd }: Props) {
  return (
    <nav className="safe-bottom sticky bottom-0 z-40 border-t border-forest/10 bg-cream/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[480px] items-center justify-around px-2 py-2">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = current === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`flex min-w-[64px] flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[11px] font-medium transition ${
                active ? 'text-forest' : 'text-forest/45'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={onAdd}
          className="flex min-w-[64px] flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[11px] font-semibold text-gold-dark"
          aria-label="הוסף מעטפה"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-cream shadow-sm">
            <Plus size={18} strokeWidth={2.5} />
          </span>
          חדש
        </button>
      </div>
    </nav>
  )
}
