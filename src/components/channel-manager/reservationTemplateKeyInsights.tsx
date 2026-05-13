import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { RefObject } from 'react'
import { Checkbox } from '@/components/ui'
import { cn } from '@/lib/cn'
import { Settings01 } from '@untitled-ui/icons-react'

type TemplatePageLayoutVariant = 'comfortable' | 'compact' | 'modern'

/** Same storage as `ReservationPreviewPanelBody` so insight toggles stay in sync. */
export const RESERVATION_INSIGHT_VIEW_STORAGE_KEY = 'reservation_sidebar_view_preferences_v1'

export type TemplateInsightKey =
  | 'channel'
  | 'reservationStatus'
  | 'paymentStatus'
  | 'balanceDue'
  | 'remainingCharges'
  | 'total'
  | 'doorCode'
  | 'rentalAgreement'
  | 'baseRate'
  | 'pmCommission'

export const TEMPLATE_INSIGHT_ITEMS: { key: TemplateInsightKey; label: string }[] = [
  { key: 'channel', label: 'Channel' },
  { key: 'reservationStatus', label: 'Reservation status' },
  { key: 'paymentStatus', label: 'Payment status' },
  { key: 'balanceDue', label: 'Balance due' },
  { key: 'remainingCharges', label: 'Remaining charges' },
  { key: 'total', label: 'Total' },
  { key: 'doorCode', label: 'Door code' },
  { key: 'rentalAgreement', label: 'Rental agreement' },
  { key: 'baseRate', label: 'Base rate' },
  { key: 'pmCommission', label: 'PM commission' },
]

const DEFAULT_INSIGHTS: Record<TemplateInsightKey, boolean> = {
  channel: true,
  reservationStatus: true,
  paymentStatus: true,
  balanceDue: true,
  remainingCharges: true,
  total: true,
  doorCode: true,
  rentalAgreement: true,
  baseRate: true,
  pmCommission: true,
}

export function loadInsightVisibility(): Record<TemplateInsightKey, boolean> {
  if (typeof window === 'undefined') return DEFAULT_INSIGHTS
  try {
    const raw = window.localStorage.getItem(RESERVATION_INSIGHT_VIEW_STORAGE_KEY)
    if (!raw) return DEFAULT_INSIGHTS
    const parsed = JSON.parse(raw) as { insights?: Partial<Record<TemplateInsightKey, boolean>> }
    return { ...DEFAULT_INSIGHTS, ...(parsed.insights ?? {}) }
  } catch {
    return DEFAULT_INSIGHTS
  }
}

function persistInsightVisibility(next: Record<TemplateInsightKey, boolean>) {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(RESERVATION_INSIGHT_VIEW_STORAGE_KEY)
    const base = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    window.localStorage.setItem(
      RESERVATION_INSIGHT_VIEW_STORAGE_KEY,
      JSON.stringify({ ...base, insights: next }),
    )
  } catch {
    /* ignore */
  }
}

const statusText: Record<string, string> = {
  Reserved: 'text-[#067647]',
  Cancelled: 'text-[#b42318]',
  'Checked in': 'text-[#175cd3]',
  Pending: 'text-[#b54708]',
}

const paymentText: Record<string, string> = {
  Paid: 'text-[#067647]',
  Unpaid: 'text-[#b42318]',
  'Partially paid': 'text-[#b54708]',
}

export type TemplateKeyInsightValues = {
  source: string
  reservationStatus: string
  paymentStatus: string
  balanceDue: string
  remainingCharges: string
  totalAmount: string
  doorCode: string
  rentalAgreementStatus: string
  baseRate: string
  pmCommission: string
}

export function insightValue(key: TemplateInsightKey, v: TemplateKeyInsightValues): string {
  switch (key) {
    case 'channel':
      return v.source
    case 'reservationStatus':
      return v.reservationStatus
    case 'paymentStatus':
      return v.paymentStatus
    case 'balanceDue':
      return v.balanceDue
    case 'remainingCharges':
      return v.remainingCharges
    case 'total':
      return v.totalAmount
    case 'doorCode':
      return v.doorCode
    case 'rentalAgreement':
      return v.rentalAgreementStatus
    case 'baseRate':
      return v.baseRate
    case 'pmCommission':
      return v.pmCommission
    default:
      return ''
  }
}

export function valueTone(
  key: TemplateInsightKey,
  display: string,
): string | null {
  if (key === 'reservationStatus' && display in statusText) return statusText[display] ?? null
  if (key === 'paymentStatus' && display in paymentText) return paymentText[display] ?? null
  if (key === 'rentalAgreement') {
    return display === 'Signed' ? 'text-[#067647]' : 'text-[#b42318]'
  }
  return null
}

/** Above in-app sidebars, scrollports, and drawers (e.g. z-[240]) so the menu is always usable. */
const KEY_INSIGHTS_POPOVER_Z = 400

function KeyInsightsSettingsPopover({
  open,
  onClose,
  insights,
  onToggle,
  anchorRef,
}: {
  open: boolean
  onClose: () => void
  insights: Record<TemplateInsightKey, boolean>
  onToggle: (key: TemplateInsightKey) => void
  anchorRef: RefObject<HTMLElement | null>
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null)

  const updatePosition = () => {
    const el = anchorRef.current
    if (!el || typeof window === 'undefined') return
    const rect = el.getBoundingClientRect()
    setCoords({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
  }

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null)
      return
    }
    updatePosition()
    const el = anchorRef.current
    const ro = el ? new ResizeObserver(updatePosition) : null
    if (el && ro) ro.observe(el)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, anchorRef])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      if (anchorRef.current?.contains(t)) return
      onClose()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open, onClose, anchorRef])

  if (!open || coords === null || typeof document === 'undefined' || !document.body) return null

  return createPortal(
    <div
      ref={panelRef}
      className="fixed w-[min(100vw-2rem,320px)] overflow-hidden rounded-xl border border-[#e9eaeb] bg-white shadow-[0px_12px_32px_-8px_rgba(10,13,18,0.18),0px_4px_8px_-2px_rgba(10,13,18,0.06)]"
      style={{ top: coords.top, right: coords.right, zIndex: KEY_INSIGHTS_POPOVER_Z }}
      role="dialog"
      aria-label="Key insights display settings"
    >
      <div className="border-b border-[#e9eaeb] px-3 py-2">
        <p className="text-[13px] font-semibold leading-5 text-[#101828]">Key insights</p>
        <p className="text-[12px] leading-4 text-[#667085]">Choose which metrics appear in this section.</p>
      </div>
      <div className="max-h-[min(50vh,280px)] overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {TEMPLATE_INSIGHT_ITEMS.map((item) => (
            <li key={item.key}>
              <div className="flex items-center gap-3 rounded-md px-1 py-1.5">
                <Checkbox
                  checked={insights[item.key]}
                  onChange={() => onToggle(item.key)}
                  className="shrink-0"
                  aria-label={`Show ${item.label}`}
                />
                <button
                  type="button"
                  onClick={() => onToggle(item.key)}
                  className="min-w-0 flex-1 rounded-md py-0.5 text-left text-[13px] font-medium leading-5 text-[#101828] transition-colors hover:bg-[#f6f9fc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15b8b0]/25"
                >
                  {item.label}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  )
}

function KeyInsightsCogButton({
  insights,
  onToggle,
}: {
  insights: Record<TemplateInsightKey, boolean>
  onToggle: (key: TemplateInsightKey) => void
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#667085] hover:bg-[#f6f9fc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15b8b0]/25"
        aria-label="Configure key insights"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        <Settings01 className="h-5 w-5" aria-hidden />
      </button>
      <KeyInsightsSettingsPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={wrapRef}
        insights={insights}
        onToggle={(key) => {
          onToggle(key)
        }}
      />
    </div>
  )
}

function MintInsightsBody({
  layoutVariant,
  values,
  visibleKeys,
}: {
  layoutVariant: TemplatePageLayoutVariant
  values: TemplateKeyInsightValues
  visibleKeys: TemplateInsightKey[]
}) {
  const rows = visibleKeys.map((key) => ({
    key,
    label: TEMPLATE_INSIGHT_ITEMS.find((i) => i.key === key)?.label ?? key,
    display: insightValue(key, values),
    tone: valueTone(key, insightValue(key, values)),
  }))

  if (layoutVariant === 'comfortable') {
    return (
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[12px] font-medium leading-4 text-[#667085]">{row.label}</span>
            <div
              className={cn(
                'flex h-10 min-h-10 w-full min-w-0 items-center rounded-lg bg-[#f6f9fc] px-3 py-0 font-medium text-[14px] leading-5 ring-1 ring-inset ring-[#f2f4f7]',
              )}
            >
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-left text-[#101828]',
                  row.tone,
                  /^\$[\d,.]/.test(row.display.trim()) && 'tabular-nums',
                )}
              >
                {row.display || '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (layoutVariant === 'compact') {
    /* Match `CompactFieldRow` + compact `ReservationField` read row: w-[168px] label, gap-2, space-y-2.5 */
    return (
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.key} className="flex w-full items-center gap-2">
            <span className="w-[168px] shrink-0 text-[13px] leading-4 text-[#535862]">{row.label}</span>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  'flex min-h-9 w-full items-center rounded-lg border border-transparent bg-transparent px-0 text-left text-[13px] font-medium leading-4 text-[#101828] shadow-none ring-0',
                  row.tone,
                  /^\$[\d,.]/.test(row.display.trim()) && 'tabular-nums',
                )}
              >
                <span className="min-w-0 flex-1 truncate">{row.display || '—'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  /* modern — match `ModernFieldRow` + modern read-only `ReservationField` (view / edit shell is the same). */
  return (
    <>
      {rows.map((row) => (
        <div
          key={row.key}
          className={cn(
            'relative grid grid-cols-[minmax(0,148px)_minmax(0,1fr)] items-center gap-x-6 px-5 py-2 lg:grid-cols-[minmax(0,168px)_minmax(0,1fr)] lg:gap-x-8',
            'border-b border-[#f0f2f5] last:border-b-0',
          )}
        >
          <span className="text-[14px] font-medium leading-5 text-[#475467]">{row.label}</span>
          <div className="flex w-full min-w-0 items-center py-0">
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-left text-[14px] font-semibold leading-5 tracking-tight text-[#101828]',
                row.tone,
                /^\$[\d,.]/.test(row.display.trim()) && 'tabular-nums',
              )}
            >
              {row.display || '—'}
            </span>
          </div>
        </div>
      ))}
    </>
  )
}

const modernPageSectionGridClass = cn(
  'grid grid-cols-1 gap-9 items-start',
  'lg:max-xl:grid-cols-[minmax(200px,280px)_minmax(560px,1fr)] lg:max-xl:gap-x-9',
  'xl:grid-cols-[minmax(200px,1fr)_minmax(560px,1fr)_minmax(200px,1fr)] xl:gap-x-9',
)

/** Matches `PageSection` content column — same single card div as profile / overview fields. */
const keyInsightsComfortableCardClass = cn(
  'w-full max-w-[560px] rounded-xl border border-[#e9eaeb] bg-white px-5 py-5 shadow-[0px_1px_2px_rgba(10,13,18,0.04)] sm:px-6 sm:py-5',
)

/** Matches `modernPageSectionNarrowCardClass` on `ModernPageSection`. */
const keyInsightsModernCardClass = cn(
  'w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#e9eaeb] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.04)]',
)

export function ReservationTemplateKeyInsightsSection({
  layoutVariant,
  values,
}: {
  layoutVariant: TemplatePageLayoutVariant
  values: TemplateKeyInsightValues
}) {
  const [insights, setInsights] = useState(loadInsightVisibility)

  useEffect(() => {
    persistInsightVisibility(insights)
  }, [insights])

  const toggle = (key: TemplateInsightKey) => {
    setInsights((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const visibleKeys = TEMPLATE_INSIGHT_ITEMS.map((i) => i.key).filter((k) => insights[k])

  const mintBody = (
    <MintInsightsBody layoutVariant={layoutVariant} values={values} visibleKeys={visibleKeys} />
  )

  const mintShell =
    layoutVariant === 'compact' ? (
      <div className="min-w-0">{mintBody}</div>
    ) : layoutVariant === 'comfortable' ? (
      <div className={keyInsightsComfortableCardClass}>{mintBody}</div>
    ) : (
      <div className={keyInsightsModernCardClass}>
        <div className="bg-white">{mintBody}</div>
      </div>
    )

  const titleBlock = (
    <div className="flex items-stretch gap-2.5">
      <span className="w-px shrink-0 rounded-full bg-[#15b8b0]" aria-hidden />
      <div className="flex min-w-0 items-center gap-1">
        <h3
          className={cn(
            'font-semibold tracking-tight text-[#101828]',
            layoutVariant === 'comfortable' && 'text-[15px] leading-5',
            layoutVariant === 'compact' && 'text-[14px] leading-5',
            layoutVariant === 'modern' && 'text-[15px] leading-5',
          )}
        >
          Key insights
        </h3>
        <KeyInsightsCogButton insights={insights} onToggle={toggle} />
      </div>
    </div>
  )

  if (layoutVariant === 'comfortable') {
    return (
      <section className="pt-0">
        <div className={modernPageSectionGridClass}>
          <div className="min-w-0">{titleBlock}</div>
          <div className="flex min-w-0 w-full justify-center">{mintShell}</div>
        </div>
      </section>
    )
  }

  if (layoutVariant === 'compact') {
    return (
      <section className="pt-0">
        <div
          className={cn(
            'grid grid-cols-1 gap-5 items-start',
            'lg:max-xl:grid-cols-[minmax(200px,280px)_minmax(0,560px)] lg:max-xl:gap-x-8',
            'xl:grid-cols-[minmax(200px,1fr)_minmax(0,560px)_minmax(200px,1fr)] xl:gap-x-8',
          )}
        >
          <div className="min-w-0">{titleBlock}</div>
          <div className="flex min-w-0 w-full justify-center">
            <div className="w-full max-w-[560px]">{mintShell}</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="pt-0">
      <div className={modernPageSectionGridClass}>
        <div className="min-w-0">{titleBlock}</div>
        <div className="flex min-w-0 w-full justify-center">{mintShell}</div>
      </div>
    </section>
  )
}
