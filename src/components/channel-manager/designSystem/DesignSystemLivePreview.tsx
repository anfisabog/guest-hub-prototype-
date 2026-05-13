import type { ReactNode } from 'react'
import { ChevronRight, Download01, Plus, Settings01 } from '@untitled-ui/icons-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { tableAxesFromSyntheticId, type CatalogVariant, type DesignSystemComponentId } from './catalogData'
import { DesignSystemTableLivePreview } from './DesignSystemTableLivePreview'
import { StorybookStyleDatePicker } from './StorybookStyleDatePicker'

const spinSvg = (
  <svg
    className="h-4 w-4 shrink-0 animate-spin text-current"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
)

export type ButtonDemoAxes = {
  hierarchy: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size: 'sm' | 'md' | 'lg'
  state: 'default' | 'disabled' | 'loading'
  icon: 'none' | 'leading' | 'trailing' | 'dual' | 'icon-only'
}

export function buttonAxesFromSyntheticId(variantId: string): Record<string, string> | null {
  if (!variantId.startsWith('btn-demo~')) return null
  const parts = variantId.split('~')
  if (parts.length !== 5 || parts[0] !== 'btn-demo') return null
  const [, hierarchy, size, state, icon] = parts
  if (!hierarchy || !size || !state || !icon) return null
  return { hierarchy, size, state, icon }
}

function parseButtonDemoAxes(raw: Record<string, string>): ButtonDemoAxes {
  const h = raw.hierarchy ?? 'primary'
  const hierarchy =
    h === 'secondary' || h === 'outline' || h === 'ghost' || h === 'destructive' ? h : 'primary'
  const sz = raw.size ?? 'md'
  const size = sz === 'sm' || sz === 'lg' ? sz : 'md'
  const st = raw.state ?? 'default'
  const state = st === 'disabled' || st === 'loading' ? st : 'default'
  const ic = raw.icon ?? 'none'
  const icon =
    ic === 'leading' || ic === 'trailing' || ic === 'dual' || ic === 'icon-only' ? ic : 'none'
  return { hierarchy, size, state, icon }
}

function renderButtonFromAxes(axes: ButtonDemoAxes) {
  const { hierarchy, size, state, icon } = axes
  const isLoading = state === 'loading'
  const isDisabled = state === 'disabled' || isLoading

  const text =
    hierarchy === 'secondary'
      ? 'Cancel'
      : hierarchy === 'outline'
        ? 'Filter'
        : hierarchy === 'ghost'
          ? 'Learn more'
          : hierarchy === 'destructive'
            ? 'Remove'
            : 'Save changes'

  const loadingLabel =
    hierarchy === 'secondary' ? 'Syncing' : hierarchy === 'destructive' ? 'Removing…' : 'Submitting…'

  const iconOnlyLabel =
    hierarchy === 'outline' ? 'Add' : hierarchy === 'destructive' ? 'Delete' : 'Settings'

  const padIconOnly = size === 'sm' ? '!px-2' : size === 'lg' ? '!px-3' : '!px-2.5'

  if (icon === 'icon-only') {
    return (
      <Button
        variant={hierarchy}
        size={size}
        disabled={isDisabled}
        className={padIconOnly}
        aria-label={iconOnlyLabel}
      >
        {isLoading ? (
          spinSvg
        ) : hierarchy === 'outline' || hierarchy === 'secondary' ? (
          <Plus className="h-5 w-5 shrink-0" aria-hidden />
        ) : (
          <Settings01 className="h-5 w-5 shrink-0" aria-hidden />
        )}
      </Button>
    )
  }

  if (icon === 'dual') {
    return (
      <Button variant={hierarchy} size={size} disabled={isDisabled} className="gap-2">
        {isLoading ? (
          spinSvg
        ) : (
          <Download01 className="h-4 w-4 shrink-0" aria-hidden />
        )}
        {isLoading ? loadingLabel : 'Export report'}
        {!isLoading ? <ChevronRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden /> : null}
      </Button>
    )
  }

  const showLeading = icon === 'leading'
  const showTrailing = icon === 'trailing'
  const label =
    hierarchy === 'primary' && icon === 'leading' && !isLoading ? 'Add reservation' : text

  return (
    <Button
      variant={hierarchy}
      size={size}
      disabled={isDisabled}
      className={icon !== 'none' || isLoading ? 'gap-2' : undefined}
    >
      {showLeading && !isLoading ? <Plus className="h-4 w-4 shrink-0" aria-hidden /> : null}
      {isLoading ? spinSvg : null}
      {isLoading ? loadingLabel : label}
      {showTrailing && !isLoading ? <ChevronRight className="h-4 w-4 shrink-0" aria-hidden /> : null}
    </Button>
  )
}

const DEMO_IMG = 'https://i.pravatar.cc/128?img=12'

function StatusDot({ online }: { online?: boolean }) {
  return (
    <span
      className={cn(
        'absolute bottom-0 right-0 size-2.5 rounded-full border-[1.5px] border-white',
        online ? 'bg-[#17b26a]' : 'bg-[#98a2b3]',
      )}
      aria-hidden
    />
  )
}

export function DesignSystemLivePreview({
  componentId,
  variant,
  className,
  buttonDemoAxes,
}: {
  componentId: DesignSystemComponentId
  variant: CatalogVariant
  className?: string
  /** When set for `button`, preview is composed from the control matrix (ignores catalog variant id). */
  buttonDemoAxes?: Record<string, string> | null
}) {
  const wrap = (child: ReactNode) => (
    <div
      className={cn(
        'flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-[#e9eaeb] bg-[#fafafa] p-6',
        className,
      )}
    >
      {child}
    </div>
  )

  switch (componentId) {
    case 'avatar': {
      const { id } = variant
      if (id === 'av-sm-img') {
        return wrap(
          <div className="relative">
            <img
              src={DEMO_IMG}
              alt=""
              className="size-8 rounded-full object-cover ring-1 ring-inset ring-black/5"
            />
          </div>,
        )
      }
      if (id === 'av-md-img') {
        return wrap(
          <img
            src={DEMO_IMG}
            alt=""
            className="size-10 rounded-full object-cover ring-1 ring-inset ring-black/5"
          />,
        )
      }
      if (id === 'av-lg-img') {
        return wrap(
          <img
            src={DEMO_IMG}
            alt=""
            className="size-14 rounded-full object-cover ring-1 ring-inset ring-black/5"
          />,
        )
      }
      if (id === 'av-initials') {
        return wrap(
          <div
            className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-300 text-[14px] font-semibold text-amber-900 ring-1 ring-inset ring-black/5"
            aria-hidden
          >
            AB
          </div>,
        )
      }
      if (id === 'av-status') {
        return wrap(
          <div className="relative inline-flex">
            <img
              src={DEMO_IMG}
              alt=""
              className="size-10 rounded-full object-cover ring-1 ring-inset ring-black/5"
            />
            <StatusDot online />
          </div>,
        )
      }
      if (id === 'av-group') {
        return wrap(
          <div className="flex -space-x-2">
            {[32, 47, 22].map((img) => (
              <img
                key={img}
                src={`https://i.pravatar.cc/64?img=${img}`}
                alt=""
                className="inline-block size-9 rounded-full ring-2 ring-white object-cover"
              />
            ))}
          </div>,
        )
      }
      return wrap(null)
    }
    case 'badge': {
      const map: Record<string, React.ComponentProps<typeof Badge>['variant']> = {
        'bd-connected': 'connected',
        'bd-pending': 'pending',
        'bd-importing': 'importing',
        'bd-disconnected': 'disconnected',
        'bd-default': 'default',
      }
      const v = map[variant.id] ?? 'default'
      const labels: Record<string, string> = {
        connected: 'Connected',
        pending: 'Pending',
        importing: 'Importing',
        disconnected: 'Disconnected',
        default: 'Neutral',
      }
      return wrap(<Badge variant={v}>{labels[v]}</Badge>)
    }
    case 'button': {
      const axes =
        buttonDemoAxes ??
        (variant.id.startsWith('btn-demo~') ? buttonAxesFromSyntheticId(variant.id) : null)
      if (axes) {
        return wrap(renderButtonFromAxes(parseButtonDemoAxes(axes)))
      }

      if (variant.id === 'btn-primary-md') {
        return wrap(<Button variant="primary">Save changes</Button>)
      }
      if (variant.id === 'btn-secondary-md') {
        return wrap(<Button variant="secondary">Cancel</Button>)
      }
      if (variant.id === 'btn-outline-md') {
        return wrap(<Button variant="outline">Filter</Button>)
      }
      if (variant.id === 'btn-ghost-sm') {
        return wrap(
          <Button variant="ghost" size="sm">
            Learn more
          </Button>,
        )
      }
      if (variant.id === 'btn-destructive-md') {
        return wrap(<Button variant="destructive">Remove</Button>)
      }
      if (variant.id === 'btn-primary-disabled') {
        return wrap(
          <Button variant="primary" disabled>
            Continue
          </Button>,
        )
      }
      if (variant.id === 'btn-primary-icon-leading') {
        return wrap(
          <Button variant="primary" className="gap-2">
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Add reservation
          </Button>,
        )
      }
      if (variant.id === 'btn-primary-icon-trailing') {
        return wrap(
          <Button variant="primary" className="gap-2">
            Next step
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          </Button>,
        )
      }
      if (variant.id === 'btn-outline-dual-icons') {
        return wrap(
          <Button variant="outline" className="gap-2">
            <Download01 className="h-4 w-4 shrink-0" aria-hidden />
            Export report
            <ChevronRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
          </Button>,
        )
      }
      if (variant.id === 'btn-icon-only-primary') {
        return wrap(
          <Button variant="primary" className="!px-2.5" aria-label="Settings">
            <Settings01 className="h-5 w-5 shrink-0" aria-hidden />
          </Button>,
        )
      }
      if (variant.id === 'btn-icon-only-outline') {
        return wrap(
          <Button variant="outline" className="!px-2.5" aria-label="Add">
            <Plus className="h-5 w-5 shrink-0" aria-hidden />
          </Button>,
        )
      }
      if (variant.id === 'btn-primary-loading') {
        return wrap(
          <Button variant="primary" disabled className="gap-2 opacity-90">
            {spinSvg}
            Submitting…
          </Button>,
        )
      }
      if (variant.id === 'btn-secondary-loading') {
        return wrap(
          <Button variant="secondary" disabled className="gap-2 opacity-90">
            {spinSvg}
            Syncing
          </Button>,
        )
      }
      return wrap(<Button variant="primary">Button</Button>)
    }
    case 'checkbox': {
      if (variant.id === 'cb-off') {
        return wrap(<Checkbox aria-label="Demo unchecked" />)
      }
      if (variant.id === 'cb-on') {
        return wrap(<Checkbox defaultChecked aria-label="Demo checked" />)
      }
      if (variant.id === 'cb-ind') {
        return wrap(<Checkbox isIndeterminate aria-label="Demo indeterminate" />)
      }
      if (variant.id === 'cb-disabled-off') {
        return wrap(<Checkbox disabled aria-label="Demo disabled" />)
      }
      if (variant.id === 'cb-disabled-on') {
        return wrap(<Checkbox defaultChecked disabled aria-label="Demo disabled checked" />)
      }
      return wrap(<Checkbox />)
    }
    case 'datepicker': {
      if (variant.id === 'dp-single') {
        return wrap(
          <StorybookStyleDatePicker
            initialSelected={new Date(2026, 2, 27)}
            initialVisibleMonth={new Date(2026, 2, 1)}
          />,
        )
      }
      if (variant.id === 'dp-range') {
        return wrap(
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">
                Check-in
              </p>
              <StorybookStyleDatePicker
                initialSelected={new Date(2026, 4, 1)}
                initialVisibleMonth={new Date(2026, 4, 1)}
              />
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">
                Check-out
              </p>
              <StorybookStyleDatePicker
                initialSelected={new Date(2026, 4, 8)}
                initialVisibleMonth={new Date(2026, 4, 1)}
              />
            </div>
          </div>,
        )
      }
      if (variant.id === 'dp-month') {
        return wrap(
          <div className="w-full max-w-[280px] space-y-2">
            <p className="text-[12px] font-medium text-[#667085]">Month</p>
            <Input type="month" className="w-full" defaultValue="2026-03" aria-label="Month" />
          </div>,
        )
      }
      if (variant.id === 'dp-disabled') {
        return wrap(
          <StorybookStyleDatePicker
            disabled
            initialSelected={new Date(2026, 2, 27)}
            initialVisibleMonth={new Date(2026, 2, 1)}
          />,
        )
      }
      return wrap(
        <StorybookStyleDatePicker
          initialSelected={new Date(2026, 2, 27)}
          initialVisibleMonth={new Date(2026, 2, 1)}
        />,
      )
    }
    case 'table': {
      const axes = tableAxesFromSyntheticId(variant.id)
      return (
        <div
          className={cn(
            'w-full max-w-full overflow-x-auto rounded-xl border border-dashed border-[#e9eaeb] bg-[#fafafa] p-3 sm:p-4',
            className,
          )}
        >
          <DesignSystemTableLivePreview axes={axes} className="min-w-[min(100%,640px)]" />
        </div>
      )
    }
    default:
      return wrap(<span className="text-sm text-[#98a2b3]">Preview</span>)
  }
}
