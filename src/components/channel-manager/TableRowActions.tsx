import type { ReactNode } from 'react'
import { Button } from '@/components/ui'

export interface TableRowActionItem {
  label: string
  onClick: () => void
  icon: ReactNode
}

interface TableRowActionsProps {
  actions: TableRowActionItem[]
}

export function TableRowActions({ actions }: TableRowActionsProps) {
  if (actions.length === 0) return null

  return (
    <div className="absolute inset-y-0 right-6 inline-flex items-center gap-0.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity duration-[120ms] ease-[var(--motion-ease-default)] motion-reduce:transition-none">
      {actions.map((action) => (
        <Button
          key={action.label}
          type="button"
          onClick={action.onClick}
          variant="ghost"
          size="sm"
          className="w-9 h-9 p-1.5 text-[#717680] hover:bg-[#f6f9fc]"
          aria-label={action.label}
        >
          <span className="w-6 h-6 inline-flex items-center justify-center">{action.icon}</span>
        </Button>
      ))}
    </div>
  )
}
