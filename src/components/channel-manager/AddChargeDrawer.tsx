import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { cn } from '@/lib/cn'
import { motionTokens } from '@/lib/motion'
import {
  Calculator,
  Check,
  ChevronDown,
  CreditCard02,
  CurrencyDollar,
  DotsHorizontal,
  XClose,
} from '@untitled-ui/icons-react'

const ADD_CHARGE_LAYOUT_STORAGE_KEY = 'add-charge-drawer-layout-variant'

export type AddChargeLayoutVariant = 'comfortable' | 'compact' | 'modern'

const DRAWER_SHADOW =
  'shadow-[0px_20px_24px_-4px_rgba(10,13,18,0.08),0px_8px_8px_-4px_rgba(10,13,18,0.03),0px_3px_3px_-1.5px_rgba(10,13,18,0.04)]'

const FIELD_SHELL =
  'flex h-9 w-full min-w-0 items-center gap-2 rounded-lg border border-[#d5d7da] bg-white px-3 text-[14px] leading-5 text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)]'

/** Native `<select>` must not use `display: flex` — padding/icon alignment breaks in several browsers. */
const SELECT_DEFAULT_CLASS =
  'box-border h-9 w-full min-w-0 appearance-none rounded-lg border border-[#d5d7da] bg-white py-0 text-[14px] font-medium leading-9 text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:border-[#15b8b0] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/20'

const SELECT_CHEVRON_WRAP = 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#717680]'

const MODERN_CONTROL_RING =
  'rounded-md border border-[#d0d5dd] bg-white text-[14px] leading-9 transition-[border-color,box-shadow] duration-100 ease-linear focus:border-[#15b8b0] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/20'

function loadAddChargeLayout(): AddChargeLayoutVariant {
  try {
    const raw = sessionStorage.getItem(ADD_CHARGE_LAYOUT_STORAGE_KEY)
    if (raw === 'comfortable' || raw === 'compact' || raw === 'modern') return raw
  } catch {
    /* ignore */
  }
  return 'compact'
}

function panelMaxWidthClass(variant: AddChargeLayoutVariant): string {
  switch (variant) {
    case 'comfortable':
      return 'max-w-[min(100vw,440px)]'
    case 'modern':
      return 'max-w-[min(100vw,520px)]'
    default:
      return 'max-w-[min(100vw,500px)]'
  }
}

function RequiredFieldLabel({
  children,
  required,
  className,
}: {
  children: React.ReactNode
  required?: boolean
  className?: string
}) {
  return (
    <p className={cn('shrink-0 text-[14px] leading-5 text-[#535862]', className)}>
      {children}
      {required ? (
        <span className="font-bold text-[#339c99]" aria-hidden>
          {' '}
          *
        </span>
      ) : null}
    </p>
  )
}

function ChargeSectionHeading() {
  return (
    <div className="flex items-stretch gap-2.5">
      <span className="w-px shrink-0 rounded-full bg-[#15b8b0]" aria-hidden />
      <h3 className="text-[14px] font-semibold leading-5 tracking-tight text-[#101828] sm:text-[15px]">
        Charge
      </h3>
    </div>
  )
}

function AddChargeLayoutMenu({
  layoutVariant,
  onSelect,
}: {
  layoutVariant: AddChargeLayoutVariant
  onSelect: (v: AddChargeLayoutVariant) => void
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const pick = useCallback(
    (v: AddChargeLayoutVariant) => {
      onSelect(v)
      setOpen(false)
    },
    [onSelect],
  )

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d5d7da] bg-white text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] transition-colors',
          'hover:bg-[#f6f9fc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15b8b0]/25',
          open && 'border-[#d5d7da] bg-[#f6f9fc]',
        )}
        aria-label="Form layout"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <DotsHorizontal className="h-5 w-5" aria-hidden />
      </button>
      {open ? (
        <div
          className="absolute bottom-[calc(100%+6px)] left-0 z-50 min-w-[220px] rounded-xl border border-[#e9eaeb] bg-white p-1 shadow-[0px_12px_16px_-4px_rgba(10,13,18,0.08),0px_4px_6px_-2px_rgba(10,13,18,0.03)]"
          role="menu"
          aria-label="Form layout"
        >
          <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-[#98a2b3]">
            Page layout
          </p>
          {(
            [
              { id: 'comfortable' as const, label: 'Comfortable' },
              { id: 'compact' as const, label: 'Compact' },
              { id: 'modern' as const, label: 'Modern' },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="menuitem"
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[14px] font-medium leading-5',
                layoutVariant === id
                  ? 'bg-[#f6f9fc] text-[#181d27]'
                  : 'text-[#414651] hover:bg-[#f6f9fc]',
              )}
              onClick={() => pick(id)}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#15b8b0]">
                {layoutVariant === id ? <Check className="h-4 w-4" aria-hidden /> : null}
              </span>
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function TypeSelect({ className, modern }: { className?: string; modern?: boolean }) {
  return (
    <div className={cn('relative w-full', className)}>
      <select
        defaultValue="charge"
        className={cn(
          'pr-9',
          modern ? cn(MODERN_CONTROL_RING, 'pl-3 shadow-none') : cn(SELECT_DEFAULT_CLASS, 'pl-3'),
        )}
        aria-label="Charge type"
      >
        <option value="charge">Charge</option>
      </select>
      <span className={cn(SELECT_CHEVRON_WRAP, modern && 'text-[#98a2b3]')}>
        <ChevronDown className="h-4 w-4" aria-hidden />
      </span>
    </div>
  )
}

function ReservationSelect({
  guestLabel,
  className,
  modern,
}: {
  guestLabel: string
  className?: string
  modern?: boolean
}) {
  return (
    <div className={cn('relative w-full', className)}>
      <select
        defaultValue={guestLabel}
        className={cn(
          'pr-9',
          modern ? cn(MODERN_CONTROL_RING, 'pl-3 shadow-none') : cn(SELECT_DEFAULT_CLASS, 'pl-3'),
        )}
        aria-label="Reservation"
      >
        <option value={guestLabel}>{guestLabel}</option>
      </select>
      <span className={cn(SELECT_CHEVRON_WRAP, modern && 'text-[#98a2b3]')}>
        <ChevronDown className="h-4 w-4" aria-hidden />
      </span>
    </div>
  )
}

function PaymentMethodSelect({ className, modern }: { className?: string; modern?: boolean }) {
  return (
    <div className={cn('relative w-full', className)}>
      <div className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2">
        <CreditCard02 className={cn('h-5 w-5', modern ? 'text-[#98a2b3]' : 'text-[#717680]')} aria-hidden />
      </div>
      <select
        defaultValue="payment-link"
        className={cn('pl-10 pr-9', MODERN_CONTROL_RING, 'shadow-none')}
        aria-label="Payment method"
      >
        <option value="payment-link">Payment link</option>
      </select>
      <span className={cn(SELECT_CHEVRON_WRAP, modern && 'text-[#98a2b3]')}>
        <ChevronDown className="h-4 w-4" aria-hidden />
      </span>
    </div>
  )
}

function ChargeAmountControl({ className, modern }: { className?: string; modern?: boolean }) {
  return (
    <div
      className={cn(
        'box-border flex h-9 w-full min-w-0 cursor-text items-center gap-2 px-3 focus-within:border-[#15b8b0] focus-within:ring-2 focus-within:ring-[#15b8b0]/20',
        modern
          ? cn(MODERN_CONTROL_RING, 'shadow-none')
          : FIELD_SHELL,
        className,
      )}
    >
      <CurrencyDollar
        className={cn('h-5 w-5 shrink-0', modern ? 'text-[#98a2b3]' : 'text-[#717680]')}
        aria-hidden
      />
      <input
        type="text"
        inputMode="decimal"
        defaultValue="250"
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[14px] font-medium leading-5 text-[#181d27] outline-none"
        aria-label="Charge amount"
      />
      <button
        type="button"
        className={cn(
          'shrink-0 rounded p-0.5 hover:bg-[#f6f9fc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15b8b0]/25',
          modern ? 'text-[#98a2b3]' : 'text-[#717680]',
        )}
        aria-label="Open calculator"
      >
        <Calculator className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}

function DescriptionTextarea({ modern }: { modern?: boolean }) {
  return (
    <textarea
      defaultValue="We plan to arrive late in the afternoon. I'll call you a day or two before to confirm the check-in time."
      rows={4}
      className={cn(
        'min-h-[100px] w-full min-w-0 resize-y text-[14px] leading-5 text-[#181d27] placeholder:text-[#717680]',
        modern
          ? cn(MODERN_CONTROL_RING, 'min-h-[88px] px-3 py-2.5 leading-5')
          : cn(
              'rounded-lg border border-[#d5d7da] bg-white px-3.5 py-3 shadow-[0px_1px_2px_rgba(10,13,18,0.05)]',
              'focus:border-[#15b8b0] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/20',
            ),
      )}
      aria-label="Description"
    />
  )
}

function AddChargeFormBody({
  variant,
  guestLabel,
}: {
  variant: AddChargeLayoutVariant
  guestLabel: string
}) {
  if (variant === 'comfortable') {
    return (
      <div className="flex w-full min-w-0 flex-col gap-4">
        <div>
          <label className="mb-1 block text-[12px] font-medium leading-4 text-[#667085]">
            Type<span className="text-[#15b8b0]"> *</span>
          </label>
          <TypeSelect />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium leading-4 text-[#667085]">
            Charge name<span className="text-[#15b8b0]"> *</span>
          </label>
          <Input defaultValue="Charge #1" className="w-full" aria-label="Charge name" />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium leading-4 text-[#667085]">Description</label>
          <DescriptionTextarea />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium leading-4 text-[#667085]">
            Reservation<span className="text-[#15b8b0]"> *</span>
          </label>
          <ReservationSelect guestLabel={guestLabel} />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium leading-4 text-[#667085]">
            Charge amount<span className="text-[#15b8b0]"> *</span>
          </label>
          <ChargeAmountControl />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium leading-4 text-[#667085]">
            Payment method<span className="text-[#15b8b0]"> *</span>
          </label>
          <PaymentMethodSelect />
        </div>
      </div>
    )
  }

  if (variant === 'modern') {
    const modernRowClass =
      'grid w-full grid-cols-[minmax(0,148px)_minmax(0,1fr)] items-center gap-x-6 lg:grid-cols-[minmax(0,168px)_minmax(0,1fr)] lg:gap-x-8'
    const modernRowStartClass =
      'grid w-full grid-cols-[minmax(0,148px)_minmax(0,1fr)] items-start gap-x-6 lg:grid-cols-[minmax(0,168px)_minmax(0,1fr)] lg:gap-x-8'

    return (
      <div className="flex w-full min-w-0 flex-col gap-4">
        <div className={modernRowClass}>
          <label className="text-[14px] font-medium leading-5 text-[#475467]">
            Type<span className="text-[#15b8b0]"> *</span>
          </label>
          <div className="min-w-0">
            <TypeSelect modern />
          </div>
        </div>
        <div className={modernRowClass}>
          <label className="text-[14px] font-medium leading-5 text-[#475467]">
            Charge name<span className="text-[#15b8b0]"> *</span>
          </label>
          <div className="min-w-0">
            <Input
              defaultValue="Charge #1"
              className="h-9 rounded-md border-[#d0d5dd] py-0 shadow-none focus:border-[#15b8b0] focus:ring-2 focus:ring-[#15b8b0]/20"
              aria-label="Charge name"
            />
          </div>
        </div>
        <div className={modernRowStartClass}>
          <label className="pt-0.5 text-[14px] font-medium leading-5 text-[#475467]">Description</label>
          <div className="min-w-0">
            <DescriptionTextarea modern />
          </div>
        </div>
        <div className={modernRowClass}>
          <label className="text-[14px] font-medium leading-5 text-[#475467]">
            Reservation<span className="text-[#15b8b0]"> *</span>
          </label>
          <div className="min-w-0">
            <ReservationSelect guestLabel={guestLabel} modern />
          </div>
        </div>
        <div className={modernRowClass}>
          <label className="text-[14px] font-medium leading-5 text-[#475467]">
            Charge amount<span className="text-[#15b8b0]"> *</span>
          </label>
          <div className="min-w-0">
            <ChargeAmountControl modern />
          </div>
        </div>
        <div className={modernRowClass}>
          <label className="text-[14px] font-medium leading-5 text-[#475467]">
            Payment method<span className="text-[#15b8b0]"> *</span>
          </label>
          <div className="min-w-0">
            <PaymentMethodSelect modern />
          </div>
        </div>
      </div>
    )
  }

  /* compact — label column + field (section title on top) */
  return (
    <div className="w-full min-w-0 space-y-4">
      <ChargeSectionHeading />
      <div className="flex w-full min-w-0 flex-col gap-4">
        <div className="flex w-full items-center gap-3">
          <RequiredFieldLabel required className="w-[168px]">
            Type
          </RequiredFieldLabel>
          <TypeSelect className="min-w-0 flex-1" />
        </div>
        <div className="flex w-full items-center gap-3">
          <RequiredFieldLabel required className="w-[168px]">
            Charge name
          </RequiredFieldLabel>
          <Input defaultValue="Charge #1" className="min-w-0 flex-1" aria-label="Charge name" />
        </div>
        <div className="flex w-full items-start gap-3">
          <p className="w-[168px] shrink-0 pt-2 text-[14px] leading-5 text-[#535862]">Description</p>
          <div className="min-w-0 flex-1">
            <DescriptionTextarea />
          </div>
        </div>
        <div className="flex w-full items-center gap-3">
          <RequiredFieldLabel required className="w-[168px]">
            Reservation
          </RequiredFieldLabel>
          <ReservationSelect guestLabel={guestLabel} className="min-w-0 flex-1" />
        </div>
        <div className="flex w-full items-center gap-3">
          <RequiredFieldLabel required className="w-[168px]">
            Charge amount
          </RequiredFieldLabel>
          <ChargeAmountControl className="min-w-0 flex-1" />
        </div>
        <div className="flex w-full items-center gap-3">
          <RequiredFieldLabel required className="w-[168px]">
            Payment method
          </RequiredFieldLabel>
          <PaymentMethodSelect className="min-w-0 flex-1" />
        </div>
      </div>
    </div>
  )
}

export function AddChargeDrawer({
  open,
  onClose,
  guestName,
}: {
  open: boolean
  onClose: () => void
  guestName: string | null
}) {
  const reduceMotion = useReducedMotion()
  const titleId = useId()
  const [layoutVariant, setLayoutVariant] = useState<AddChargeLayoutVariant>(loadAddChargeLayout)

  const setLayoutAndPersist = useCallback((v: AddChargeLayoutVariant) => {
    setLayoutVariant(v)
    try {
      sessionStorage.setItem(ADD_CHARGE_LAYOUT_STORAGE_KEY, v)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (typeof document === 'undefined') return null

  const guestLabel = guestName ?? '—'
  const panelW = panelMaxWidthClass(layoutVariant)

  return createPortal(
    <AnimatePresence mode="sync">
      {open ? (
        <div className="fixed inset-0 z-[240] flex justify-end" role="presentation">
          <motion.button
            key="add-charge-backdrop"
            type="button"
            aria-label="Close add charge"
            className="absolute inset-0 border-0 bg-[#0a0d12]/70 backdrop-blur-md"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: {
                duration: reduceMotion ? 0 : motionTokens.duration.normal,
                ease: motionTokens.easing.default,
              },
            }}
            transition={{
              duration: reduceMotion ? 0 : motionTokens.duration.normal,
              ease: motionTokens.easing.default,
            }}
            onClick={onClose}
          />
          {reduceMotion ? (
            <aside
              key="add-charge-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className={cn(
                'relative flex h-full w-full flex-col overflow-hidden bg-white transition-[max-width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                panelW,
                DRAWER_SHADOW,
              )}
            >
              <AddChargeDrawerInner
                titleId={titleId}
                guestLabel={guestLabel}
                onClose={onClose}
                layoutVariant={layoutVariant}
                onLayoutChange={setLayoutAndPersist}
              />
            </aside>
          ) : (
            <motion.aside
              key="add-charge-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className={cn(
                'relative flex h-full w-full flex-col overflow-hidden bg-white transition-[max-width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                panelW,
                DRAWER_SHADOW,
              )}
              initial={{ x: '100%' }}
              animate={{
                x: 0,
                transition: {
                  duration: motionTokens.duration.sidePanel,
                  ease: motionTokens.easing.sidePanelIn,
                },
              }}
              exit={{
                x: '100%',
                transition: {
                  duration: motionTokens.duration.sidePanelExit,
                  ease: motionTokens.easing.sidePanelOut,
                },
              }}
            >
              <AddChargeDrawerInner
                titleId={titleId}
                guestLabel={guestLabel}
                onClose={onClose}
                layoutVariant={layoutVariant}
                onLayoutChange={setLayoutAndPersist}
              />
            </motion.aside>
          )}
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

function AddChargeDrawerInner({
  titleId,
  guestLabel,
  onClose,
  layoutVariant,
  onLayoutChange,
}: {
  titleId: string
  guestLabel: string
  onClose: () => void
  layoutVariant: AddChargeLayoutVariant
  onLayoutChange: (v: AddChargeLayoutVariant) => void
}) {
  return (
    <>
      <header className="flex min-h-[72px] shrink-0 items-center justify-between gap-3 border-b border-[#d5d7da] bg-white px-4 py-4">
        <h2
          id={titleId}
          className="min-w-0 truncate text-left text-[20px] font-medium leading-[30px] text-[#181d27]"
        >
          Add charge
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[#414651] transition-colors hover:bg-[#f6f9fc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15b8b0]/25"
          aria-label="Close"
        >
          <XClose className="h-5 w-5" aria-hidden />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6">
        <AddChargeFormBody variant={layoutVariant} guestLabel={guestLabel} />
      </div>

      <footer className="shrink-0 border-t border-[#e9eaeb] bg-white px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AddChargeLayoutMenu layoutVariant={layoutVariant} onSelect={onLayoutChange} />
          <div className="flex shrink-0 flex-wrap justify-end gap-3 sm:flex-nowrap">
            <Button type="button" variant="outline" onClick={onClose} className="min-w-[88px] shadow-sm">
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={onClose}
              className="min-w-[104px] bg-[#181d27] hover:bg-[#101828] active:bg-[#0c111d]"
            >
              Add charge
            </Button>
          </div>
        </div>
      </footer>
    </>
  )
}
