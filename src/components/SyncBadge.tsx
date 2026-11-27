import { Cloud, CloudOff, HardDrive, Loader2 } from 'lucide-react'
import type { SyncStatus } from '../lib/types'

const LABELS: Record<SyncStatus, { text: string; icon: typeof Cloud }> = {
  synced: { text: 'מסונכרן בענן ✓', icon: Cloud },
  cache: { text: 'נטען מהמטמון', icon: HardDrive },
  offline: { text: 'אופליין', icon: CloudOff },
  loading: { text: 'מסנכרן…', icon: Loader2 },
  error: { text: 'שגיאת סנכרון', icon: CloudOff },
}

export function SyncBadge({ status }: { status: SyncStatus }) {
  const { text, icon: Icon } = LABELS[status]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/8 px-2.5 py-1 text-[11px] font-medium text-forest/70">
      <Icon
        size={12}
        className={status === 'loading' ? 'animate-spin' : undefined}
        aria-hidden
      />
      {text}
    </span>
  )
}
