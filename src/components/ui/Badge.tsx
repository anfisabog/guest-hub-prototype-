import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'connecting'
    | 'pending'
    | 'pending_export'
    | 'importing'
    | 'connected'
    | 'ready_to_export'
    | 'exporting'
    | 'published'
    | 'missing_requirements'
    | 'disconnected'
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const base =
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-[18px] shadow-sm ring-1 ring-inset ring-black/5'
  const variants: Record<string, string> = {
    default: 'border-transparent bg-zinc-100 text-zinc-700',
    connecting: 'border-blue-200 bg-blue-50 text-blue-800',
    pending: 'border-amber-200 bg-amber-50 text-amber-800',
    pending_import: 'border-amber-200 bg-amber-50 text-amber-800',
    pending_export: 'border-amber-200 bg-amber-50 text-amber-800',
    importing: 'border-blue-200 bg-blue-50 text-blue-800',
    connected: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    ready_to_export: 'border-teal-200 bg-teal-50 text-teal-800',
    exporting: 'border-blue-200 bg-blue-50 text-blue-800',
    published: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    missing_requirements: 'border-red-200 bg-red-50 text-red-800',
    disconnected: 'border-zinc-200 bg-zinc-50 text-zinc-600',
  }
  return <span className={cn(base, variants[variant] ?? variants.default, className)} {...props} />
}
