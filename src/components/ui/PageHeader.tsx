import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './Button'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  primaryAction?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
}

export function PageHeader({ title, subtitle, backHref, primaryAction, children }: PageHeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {backHref && (
              <Link
                to={backHref}
                className="p-1 -ml-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                aria-label="Go back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold truncate">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
            </div>
          </div>
          {primaryAction && (
            <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button>
          )}
        </div>
        {children}
      </div>
    </header>
  )
}
