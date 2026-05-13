import type { ReactNode } from 'react'
import { MotionPresence, SlideUp } from '@/lib/motion'

interface BulkAction {
  label: string
  icon: ReactNode
  onClick: () => void
}

interface BulkActionBarProps {
  count: number
  actions: BulkAction[]
}

export function BulkActionBar({ count, actions }: BulkActionBarProps) {
  return (
    <MotionPresence mode="sync">
      {count > 0 ? (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <SlideUp distance={16} duration="slow">
            <div className="rounded-xl bg-[#181d27] pl-4 pr-4 py-2 flex items-center gap-6 shadow-[0px_12px_16px_rgba(10,13,18,0.08),0px_4px_6px_rgba(10,13,18,0.03),0px_2px_2px_rgba(10,13,18,0.04)]">
              <span className="text-[14px] leading-5 font-medium text-white shrink-0">{count} selected</span>
              <div className="flex items-center gap-4">
                {actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border-0 bg-transparent px-2 py-0 text-[14px] font-semibold leading-5 text-white transition-[color,background-color] duration-[120ms] ease-[var(--motion-ease-default)] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#181d27]"
                  >
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[#A4A7AE] [&>svg]:h-5 [&>svg]:w-5 [&>svg]:shrink-0">
                      {action.icon}
                    </span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </SlideUp>
        </div>
      ) : null}
    </MotionPresence>
  )
}
