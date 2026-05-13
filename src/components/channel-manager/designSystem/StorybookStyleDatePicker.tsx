import type { CSSProperties } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight } from '@untitled-ui/icons-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function formatDdMmYyyy(d: Date): string {
  return `${pad2(d.getDate())} / ${pad2(d.getMonth() + 1)} / ${d.getFullYear()}`
}

function parseDdMmYyyy(s: string): Date | null {
  const cleaned = s.replace(/\s*\/\s*/g, '/').trim()
  const m = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const dd = Number(m[1])
  const mm = Number(m[2]) - 1
  const yyyy = Number(m[3])
  const d = new Date(yyyy, mm, dd)
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm || d.getDate() !== dd) return null
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Monday = 0 … Sunday = 6 */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const padStart = mondayIndex(first)
  const cells: Date[] = []
  const prevLast = new Date(year, month, 0).getDate()
  for (let i = 0; i < padStart; i++) {
    const day = prevLast - padStart + i + 1
    cells.push(new Date(year, month - 1, day))
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d))
  }
  let n = 1
  while (cells.length % 7 !== 0) {
    cells.push(new Date(year, month + 1, n))
    n++
  }
  return cells
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function StorybookStyleDatePicker({
  disabled = false,
  defaultOpen = false,
  /** Match Storybook screenshot default selection */
  initialSelected = new Date(2026, 2, 27),
  initialVisibleMonth = new Date(2026, 2, 1),
}: {
  disabled?: boolean
  defaultOpen?: boolean
  initialSelected?: Date
  initialVisibleMonth?: Date
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [selected, setSelected] = useState<Date>(initialSelected)
  const [visible, setVisible] = useState(() => ({
    y: initialVisibleMonth.getFullYear(),
    m: initialVisibleMonth.getMonth(),
  }))
  const [inputStr, setInputStr] = useState(() => formatDdMmYyyy(initialSelected))
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({})

  useEffect(() => {
    setInputStr(formatDdMmYyyy(selected))
  }, [selected])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const update = () => {
      const r = triggerRef.current?.getBoundingClientRect()
      if (!r) return
      const width = 340
      const left = Math.min(r.left, window.innerWidth - width - 16)
      setPopoverStyle({
        position: 'fixed',
        top: r.bottom + 8,
        left: Math.max(8, left),
        width,
        zIndex: 9999,
      })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t)) return
      if (popoverRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const cells = buildMonthGrid(visible.y, visible.m)
  const title = `${MONTHS[visible.m]} ${visible.y}`

  const goMonth = (delta: number) => {
    const d = new Date(visible.y, visible.m + delta, 1)
    setVisible({ y: d.getFullYear(), m: d.getMonth() })
  }

  const onToday = () => {
    const t = new Date()
    setSelected(t)
    setVisible({ y: t.getFullYear(), m: t.getMonth() })
  }

  const popover = open && !disabled && (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="rounded-xl border border-[#e9eaeb] bg-white p-4 shadow-[0px_12px_16px_-4px_rgba(10,13,18,0.08),0px_4px_6px_-2px_rgba(10,13,18,0.03)]"
      role="dialog"
      aria-label="Calendar"
    >
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#667085] hover:bg-[#f5f5f6]"
          aria-label="Previous month"
          onClick={() => goMonth(-1)}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <span className="text-[15px] font-semibold text-[#101828]">{title}</span>
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#667085] hover:bg-[#f5f5f6]"
          aria-label="Next month"
          onClick={() => goMonth(1)}
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          value={inputStr}
          onChange={(e) => setInputStr(e.target.value)}
          onBlur={() => {
            const p = parseDdMmYyyy(inputStr)
            if (p) {
              setSelected(p)
              setVisible({ y: p.getFullYear(), m: p.getMonth() })
            } else {
              setInputStr(formatDdMmYyyy(selected))
            }
          }}
          placeholder="DD / MM / YYYY"
          className="min-w-0 flex-1 font-mono text-[13px]"
          aria-label="Date as DD/MM/YYYY"
        />
        <Button type="button" variant="outline" className="shrink-0 px-3" onClick={onToday}>
          Today
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-2 text-center text-[12px] font-medium text-[#98a2b3]"
          >
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const inMonth = cell.getMonth() === visible.m
          const isSel = isSameDay(cell, selected)
          return (
            <button
              key={`${cell.getTime()}-${i}`}
              type="button"
              onClick={() => {
                setSelected(cell)
                if (!inMonth) {
                  setVisible({ y: cell.getFullYear(), m: cell.getMonth() })
                }
              }}
              className={cn(
                'flex h-10 items-center justify-center rounded-lg text-[13px] font-medium transition-colors',
                inMonth ? 'text-[#101828] hover:bg-[#f5f5f6]' : 'text-[#d0d5dd] hover:bg-[#fafafa]',
              )}
            >
              {inMonth && isSel ? (
                <span className="flex flex-col items-center gap-0.5 rounded-full bg-[#f2f4f7] px-2.5 py-1">
                  <span>{cell.getDate()}</span>
                  <span className="h-1 w-1 shrink-0 rounded-full bg-[#101828]" aria-hidden />
                </span>
              ) : (
                <span>{cell.getDate()}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="relative inline-flex flex-col items-start gap-2">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-[#d5d7da] bg-white px-3.5 py-2 text-[14px] font-semibold text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] transition-colors',
          'hover:border-[#98a2b3] hover:bg-[#fafafa]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15b8b0]',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <Calendar className="h-5 w-5 shrink-0 text-[#667085]" aria-hidden />
        Select date
      </button>
      {typeof document !== 'undefined' && popover ? createPortal(popover, document.body) : null}
    </div>
  )
}
