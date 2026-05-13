import type { ReactNode } from 'react'
import { PrimarySidebar } from './PrimarySidebar'

interface PageShellProps {
  children: ReactNode
  sidebarActiveIndex?: number
  onSidebarSelectItem?: (index: number) => void
  mainGap?: number
}

export function PageShell({
  children,
  sidebarActiveIndex = 4,
  onSidebarSelectItem,
  mainGap = 8,
}: PageShellProps) {
  return (
    <div className="flex h-full min-h-screen w-full bg-[var(--figma-bg)] p-2 pl-0" style={{ gap: 8 }}>
      <PrimarySidebar activeIndex={sidebarActiveIndex} onSelectItem={onSidebarSelectItem} />
      <main className="flex-1 min-w-0 min-h-0 flex flex-col" style={{ gap: mainGap }}>
        {children}
      </main>
    </div>
  )
}
