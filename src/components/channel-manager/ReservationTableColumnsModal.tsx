import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { Button, Checkbox } from '@/components/ui'
import { cn } from '@/lib/cn'
import { DotsGrid, Settings01, Trash01 } from '@untitled-ui/icons-react'
import {
  DEFAULT_RESERVATION_TABLE_COLUMN_ORDER,
  RESERVATION_TABLE_COLUMN_IDS,
  RESERVATION_TABLE_COLUMN_META,
  type ReservationColumnCategoryId,
  type ReservationTableColumnId,
} from './reservationTableColumns'

const POPOVER_WIDTH = 500
const POPOVER_GAP = 8

type ColumnsModalTab = 'select' | 'order'

/** Left-nav segments (maps underlying column categories). */
type ColumnPickerSegmentId = 'reservation' | 'listing' | 'custom_fields'

const COLUMN_PICKER_SEGMENTS: readonly { id: ColumnPickerSegmentId; label: string }[] = [
  { id: 'reservation', label: 'Reservation' },
  { id: 'listing', label: 'Listing' },
  { id: 'custom_fields', label: 'Custom fields' },
] as const

const CATEGORY_TO_PICKER_SEGMENT: Record<ReservationColumnCategoryId, ColumnPickerSegmentId> = {
  guest_contact: 'reservation',
  stay_property: 'listing',
  channel_booking: 'reservation',
  payments: 'reservation',
  operations: 'reservation',
  notes: 'custom_fields',
}

function reorder<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const next = [...list]
  const [moved] = next.splice(fromIndex, 1)
  let insertAt = toIndex
  if (fromIndex < toIndex) insertAt = toIndex - 1
  next.splice(insertAt, 0, moved)
  return next
}

function usePopoverPosition(open: boolean, anchorRef: RefObject<HTMLElement | null>) {
  const [style, setStyle] = useState<{ top: number; left: number; maxHeight: number }>({
    top: 0,
    left: 0,
    maxHeight: 480,
  })

  const update = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = Math.min(POPOVER_WIDTH, vw - 16)
    let left = r.right - width
    left = Math.max(8, Math.min(left, vw - width - 8))
    const top = r.bottom + POPOVER_GAP
    const maxHeight = Math.max(200, vh - top - 12)
    setStyle({ top, left, maxHeight })
  }, [anchorRef])

  useLayoutEffect(() => {
    if (!open) return
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, update])

  return { style, width: Math.min(POPOVER_WIDTH, typeof window !== 'undefined' ? window.innerWidth - 16 : POPOVER_WIDTH) }
}

export interface ReservationTableColumnsModalProps {
  open: boolean
  onClose: () => void
  columnOrder: ReservationTableColumnId[]
  onChangeOrder: (next: ReservationTableColumnId[]) => void
  /** Cog button — popover aligns below / to the left of this anchor. */
  anchorRef: RefObject<HTMLElement | null>
}

export function ReservationTableColumnsModal({
  open,
  onClose,
  columnOrder,
  onChangeOrder,
  anchorRef,
}: ReservationTableColumnsModalProps) {
  const [modalTab, setModalTab] = useState<ColumnsModalTab>('select')
  const [pickerSegment, setPickerSegment] = useState<ColumnPickerSegmentId>('reservation')
  const [columnSearchTerm, setColumnSearchTerm] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const visibleOrderScrollRef = useRef<HTMLDivElement>(null)
  const visibleOrderLenBaselineRef = useRef<number | null>(null)
  const { style: popoverStyle, width: popoverWidth } = usePopoverPosition(open, anchorRef)

  const columnsBySegment = useMemo(() => {
    const map = new Map<ColumnPickerSegmentId, ReservationTableColumnId[]>()
    for (const { id } of COLUMN_PICKER_SEGMENTS) {
      map.set(id, [])
    }
    for (const id of RESERVATION_TABLE_COLUMN_IDS) {
      const cat = RESERVATION_TABLE_COLUMN_META[id].category
      const seg = CATEGORY_TO_PICKER_SEGMENT[cat]
      map.get(seg)!.push(id)
    }
    for (const [, ids] of map) {
      ids.sort((a, b) =>
        RESERVATION_TABLE_COLUMN_META[a].label.localeCompare(RESERVATION_TABLE_COLUMN_META[b].label)
      )
    }
    return map
  }, [])

  const filteredSegmentColumnIds = useMemo(() => {
    const ids = columnsBySegment.get(pickerSegment) ?? []
    const q = columnSearchTerm.trim().toLowerCase()
    if (!q) return ids
    return ids.filter((id) => RESERVATION_TABLE_COLUMN_META[id].label.toLowerCase().includes(q))
  }, [columnsBySegment, pickerSegment, columnSearchTerm])

  const visibleSet = useMemo(() => new Set(columnOrder), [columnOrder])

  const removeColumn = useCallback(
    (id: ReservationTableColumnId) => {
      if (columnOrder.length <= 1) return
      onChangeOrder(columnOrder.filter((c) => c !== id))
    },
    [columnOrder, onChangeOrder]
  )

  const onDropAt = useCallback(
    (toIndex: number) => {
      if (dragIndex === null) return
      if (dragIndex === toIndex) {
        setDragIndex(null)
        return
      }
      onChangeOrder(reorder(columnOrder, dragIndex, toIndex))
      setDragIndex(null)
    },
    [columnOrder, dragIndex, onChangeOrder]
  )

  const resetDefault = useCallback(() => {
    onChangeOrder([...DEFAULT_RESERVATION_TABLE_COLUMN_ORDER])
  }, [onChangeOrder])

  const setColumnInOrder = useCallback(
    (id: ReservationTableColumnId, inOrder: boolean) => {
      if (inOrder) {
        if (columnOrder.includes(id)) return
        onChangeOrder([...columnOrder, id])
      } else {
        removeColumn(id)
      }
    },
    [columnOrder, onChangeOrder, removeColumn]
  )

  useLayoutEffect(() => {
    if (!open) {
      visibleOrderLenBaselineRef.current = null
      return
    }
    if (visibleOrderLenBaselineRef.current === null) {
      visibleOrderLenBaselineRef.current = columnOrder.length
      return
    }
    const el = visibleOrderScrollRef.current
    if (columnOrder.length > visibleOrderLenBaselineRef.current && el) {
      el.scrollTop = el.scrollHeight
    }
    visibleOrderLenBaselineRef.current = columnOrder.length
  }, [open, columnOrder])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      setModalTab('select')
      setPickerSegment('reservation')
      setColumnSearchTerm('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const t = e.target as Node
      if (anchorRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      onClose()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open, onClose, anchorRef])

  if (!open) return null

  return createPortal(
    <>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Customize table columns"
        className="fixed z-[80] flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#e9eaeb] bg-white"
        style={{
          top: popoverStyle.top,
          left: popoverStyle.left,
          width: popoverWidth,
          maxHeight: popoverStyle.maxHeight,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 pb-2">
          <div
            className="flex rounded-lg bg-[#f2f4f7] p-0.5"
            role="tablist"
            aria-label="Column customization"
          >
            <button
              type="button"
              role="tab"
              aria-selected={modalTab === 'select'}
              onClick={() => setModalTab('select')}
              className={cn(
                'min-h-9 flex-1 rounded-md px-2 py-2 text-[13px] font-medium leading-4 transition-[color,box-shadow,background-color] duration-150',
                modalTab === 'select'
                  ? 'bg-white text-[#101828] shadow-[0px_1px_2px_rgba(10,13,18,0.06)] ring-1 ring-inset ring-[#e9eaeb]'
                  : 'text-[#667085] hover:text-[#344054]',
              )}
            >
              Select columns
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={modalTab === 'order'}
              onClick={() => setModalTab('order')}
              className={cn(
                'min-h-9 flex-1 rounded-md px-2 py-2 text-[13px] font-medium leading-4 transition-[color,box-shadow,background-color] duration-150',
                modalTab === 'order'
                  ? 'bg-white text-[#101828] shadow-[0px_1px_2px_rgba(10,13,18,0.06)] ring-1 ring-inset ring-[#e9eaeb]'
                  : 'text-[#667085] hover:text-[#344054]',
              )}
            >
              Order columns
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-1">
          {modalTab === 'select' ? (
            <div className="flex max-h-[min(72vh,520px)] min-h-[240px] flex-1 overflow-hidden rounded-lg border border-[#e9eaeb] bg-white">
              <div className="w-[250px] shrink-0 border-r border-[#e9eaeb] py-1">
                {COLUMN_PICKER_SEGMENTS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setPickerSegment(id)
                      setColumnSearchTerm('')
                    }}
                    className="w-full px-1.5 py-0.5 text-left"
                  >
                    <span
                      className={cn(
                        'flex rounded-md px-2.5 py-2 text-[14px] leading-5',
                        id === pickerSegment
                          ? 'bg-[#f6f9fc] font-semibold text-[#252b37]'
                          : 'font-medium text-[#414651] hover:bg-[#f6f9fc]',
                      )}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white p-3">
                <div className="shrink-0">
                  <div className="flex h-9 items-center gap-2 rounded-md border border-[#d5d7da] bg-white px-3">
                    <svg
                      className="h-5 w-5 shrink-0 text-[#717680]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-3.5-3.5" />
                    </svg>
                    <input
                      type="search"
                      value={columnSearchTerm}
                      onChange={(e) => setColumnSearchTerm(e.target.value)}
                      placeholder="Search"
                      className="min-w-0 flex-1 bg-transparent text-[14px] leading-5 text-[#414651] outline-none placeholder:text-[#717680]"
                      aria-label="Search columns"
                    />
                  </div>
                </div>
                <div
                  ref={visibleOrderScrollRef}
                  className="mt-3 min-h-0 flex-1 overflow-y-auto"
                >
                  {filteredSegmentColumnIds.length === 0 ? (
                    <p className="py-6 text-center text-[13px] leading-5 text-[#717680]">
                      No columns match your search.
                    </p>
                  ) : (
                    <ul className="space-y-0.5">
                      {filteredSegmentColumnIds.map((id) => {
                        const checked = visibleSet.has(id)
                        const disableUncheck = checked && columnOrder.length <= 1
                        return (
                          <li key={id}>
                            <div className="flex items-center gap-3 rounded-md px-1 py-1.5 sm:px-1.5">
                              <Checkbox
                                checked={checked}
                                disabled={disableUncheck}
                                onChange={(e) => setColumnInOrder(id, e.target.checked)}
                                className="shrink-0"
                                aria-label={`Show column ${RESERVATION_TABLE_COLUMN_META[id].label} in table`}
                              />
                              <button
                                type="button"
                                disabled={disableUncheck}
                                onClick={() => {
                                  if (checked) {
                                    if (columnOrder.length <= 1) return
                                    setColumnInOrder(id, false)
                                  } else {
                                    setColumnInOrder(id, true)
                                  }
                                }}
                                className="min-w-0 flex-1 truncate rounded-md py-0.5 text-left text-[14px] font-medium leading-5 text-[#101828] transition-colors hover:bg-[#f6f9fc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15b8b0]/25 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {RESERVATION_TABLE_COLUMN_META[id].label}
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              ref={visibleOrderScrollRef}
              className="max-h-[min(72vh,520px)] min-h-[240px] overflow-y-auto"
            >
              <ul className="space-y-0.5">
                {columnOrder.map((id, index) => (
                  <li
                    key={id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      onDropAt(index)
                    }}
                    className={cn(
                      'group flex items-center gap-2 rounded-md px-1 py-1.5 sm:px-1.5',
                      dragIndex === index && 'bg-[#f6f9fc]',
                    )}
                  >
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData('text/plain', String(index))
                        setDragIndex(index)
                      }}
                      onDragEnd={() => setDragIndex(null)}
                      className="cursor-grab touch-none shrink-0 active:cursor-grabbing"
                      aria-label={`Drag to reorder ${RESERVATION_TABLE_COLUMN_META[id].label}`}
                    >
                      <DotsGrid className="h-5 w-5 shrink-0 text-[#98a2b3]" aria-hidden />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium leading-5 text-[#101828]">
                      {RESERVATION_TABLE_COLUMN_META[id].label}
                    </span>
                    <button
                      type="button"
                      disabled={columnOrder.length <= 1}
                      onClick={() => removeColumn(id)}
                      className="shrink-0 rounded-md p-1.5 text-[#667085] opacity-0 transition-opacity hover:bg-[#fee4e2] hover:text-[#b42318] focus-visible:opacity-100 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0"
                      aria-label={`Remove ${RESERVATION_TABLE_COLUMN_META[id].label}`}
                    >
                      <Trash01 className="h-4 w-4 shrink-0" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#e9eaeb] bg-white px-4 py-2.5">
          <button
            type="button"
            onClick={resetDefault}
            className="rounded-lg border border-[#d5d7da] bg-white px-3 py-1.5 text-[13px] font-semibold leading-5 text-[#414651] shadow-sm hover:bg-[#f6f9fc]"
          >
            Reset to default
          </button>
          <Button type="button" variant="primary" onClick={onClose} className="h-9 px-3 text-[13px] leading-5">
            Done
          </Button>
        </footer>
      </div>
    </>,
    document.body
  )
}

export const ReservationTableHeaderCogButton = forwardRef<
  HTMLButtonElement,
  { onClick: () => void; menuOpen?: boolean }
>(function ReservationTableHeaderCogButton({ onClick, menuOpen = false }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d5d7da] bg-white text-[#667085] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] transition-[border-color,box-shadow,background-color] duration-100 ease-linear hover:bg-[#f6f9fc] focus:border-[#15b8b0] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/20"
      aria-label="Customize table columns"
      aria-haspopup="dialog"
      aria-expanded={menuOpen}
    >
      <Settings01 className="h-5 w-5" aria-hidden />
    </button>
  )
})
