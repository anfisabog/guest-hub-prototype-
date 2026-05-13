import { Button } from './Button'

export interface BulkActionBarProps {
  count: number
  onImport: () => void
  onConnect: () => void
  onDisconnect: () => void
  visible: boolean
}

export function BulkActionBar({
  count,
  onImport,
  onConnect,
  onDisconnect,
  visible,
}: BulkActionBarProps) {
  if (!visible || count === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-6 py-3 bg-foreground text-background rounded-lg shadow-lg">
      <span className="text-sm font-medium">{count} selected</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={onImport}>
          Import
        </Button>
        <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={onConnect}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4.93" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L13 19.07" />
          </svg>
          Connect
        </Button>
        <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={onDisconnect}>
          Disconnect
        </Button>
      </div>
    </div>
  )
}
