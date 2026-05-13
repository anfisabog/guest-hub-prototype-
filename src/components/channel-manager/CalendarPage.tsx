import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import {
  Annotation,
  Calendar,
  CheckDone01,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DotsVertical,
  File02,
  FilterLines,
  Lock03,
  MessageDotsCircle,
  MoonStar,
  Plus,
  Save01,
  Settings01,
  Stars01,
  SwitchVertical01,
  XClose,
} from '@untitled-ui/icons-react'
import { cn } from '@/lib/cn'
import {
  demoPaymentStatusForBookingBlock,
  type DemoPaymentStatus,
} from '@/lib/demoReservationPayment'
import {
  RESERVATION_AVATAR_SRC_TABLE,
  ownerStayAvatarUrl,
  reservationGuestAvatarUrl,
} from '@/lib/reservationGuestAvatar'
import { Button, Input, Modal } from '@/components/ui'
import { ChannelIcon } from './ChannelIcon'
import { MotionPresence, motionTokens, SlidingSidePanel } from '@/lib/motion'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useChannelManagerContext } from '@/context/ChannelManagerContext'
import type { ReservationListItem } from './ReservationListPage'
import { AiCoHostPanel, type CalendarAiActions } from './AiCoHostPanel'
import {
  loadInsightVisibility,
  insightValue,
  valueTone,
  TEMPLATE_INSIGHT_ITEMS,
  type TemplateKeyInsightValues,
} from './reservationTemplateKeyInsights'

// --- Custom Clean pill colors + contrast (WCAG AA for text, ≥3:1 for icons/dots on pill)

const WCAG_AA_MIN = 4.5
const UI_GRAPHIC_MIN = 3.0

export type CalendarPillColorKey =
  | 'reservation'
  | 'inquiry'
  | 'ownerStay'
  | 'blocked'
  | 'note'
  | 'task'

export type CalendarPillColorSettings = Record<CalendarPillColorKey, string>

export type CalendarPillColorPatch = Partial<CalendarPillColorSettings>

/**
 * Curated light + dark swatch pairs used in the Calendar settings color picker.
 * Each family has a LIGHT variant (high-luminance — pill text auto-renders dark)
 * and a DARK variant (low-luminance — pill text auto-renders near-white) so the
 * same family can be shown either gentle or high-contrast without changing hue.
 */
/**
 * Curated swatch families — every pair is chosen so the light variant reads
 * beautifully on white and the dark variant works with white text.
 * Grouped: Cool blues/teals → Purples → Warm reds/pinks → Earthy → Neutrals.
 */
/**
 * Pastel-first swatch pairs. Light variants are softened (+white mix) so they
 * feel gentle on screen; dark variants keep good contrast for white pill text.
 */
const CALENDAR_PILL_SWATCH_FAMILIES: { name: string; light: string; dark: string }[] = [
  // Cool
  { name: 'Teal',     light: '#b2ece0', dark: '#0f766e' },
  { name: 'Cyan',     light: '#b8e8f5', dark: '#0e7490' },
  { name: 'Sky',      light: '#c8e9f8', dark: '#0369a1' },
  { name: 'Blue',     light: '#cfe0fc', dark: '#1d4ed8' },
  { name: 'Indigo',   light: '#d5dcfd', dark: '#4338ca' },
  { name: 'Slate',    light: '#d8dfe8', dark: '#334155' },
  // Purple
  { name: 'Violet',   light: '#e4dffe', dark: '#6d28d9' },
  { name: 'Fuchsia',  light: '#f3d0f9', dark: '#a21caf' },
  // Warm
  { name: 'Pink',     light: '#fcd9ec', dark: '#be185d' },
  { name: 'Rose',     light: '#fcdee0', dark: '#be123c' },
  { name: 'Red',      light: '#fcc8c8', dark: '#b91c1c' },
  { name: 'Orange',   light: '#fdd9b5', dark: '#c2410c' },
  // Earthy
  { name: 'Amber',    light: '#fdedb5', dark: '#92400e' },
  { name: 'Yellow',   light: '#fef3b0', dark: '#a16207' },
  { name: 'Lime',     light: '#d8f5b0', dark: '#3f6212' },
  { name: 'Green',    light: '#b8f0ce', dark: '#15803d' },
  { name: 'Emerald',  light: '#b0edcf', dark: '#065f46' },
  // Neutral
  { name: 'Stone',    light: '#eae8e6', dark: '#57534e' },
]

/** Inline spinner for inline async indicators — matches the size of a 20px leading icon. */
function ButtonSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

const DEFAULT_CALENDAR_PILL_COLORS: CalendarPillColorSettings = {
  // Light green — gentle default that reads nicely in both pill styles.
  // Users can swap to dark teal or any other colour via the colour picker.
  reservation: '#b8f0ce',
  inquiry: '#fed7aa',
  ownerStay: '#bae6fd',
  blocked: '#cbd5e1',
  // Amber light — matches the sample note pill in the brief (image 3).
  note: '#fde68a',
  // Sky light — matches the sample task pill in the brief (image 3).
  task: '#bae6fd',
}

/** Fixed system colors for payment attention (not user-configurable). */
const SYSTEM_NOTIFICATION_UNPAID = '#f04438'
const SYSTEM_NOTIFICATION_PARTIAL = '#f79009'

const CALENDAR_PILL_COLOR_PICKER_ROWS: { key: CalendarPillColorKey; label: string }[] = [
  { key: 'reservation', label: 'Reservations' },
  { key: 'inquiry', label: 'Inquiries' },
  { key: 'ownerStay', label: 'Owner stays' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'note', label: 'Calendar notes' },
  { key: 'task', label: 'Tasks' },
]

function parseHex6(h: string): { r: number; g: number; b: number } | null {
  const t = h.trim()
  if (!t.startsWith('#')) return null
  const x = t.slice(1)
  if (x.length === 3) {
    return {
      r: parseInt(x[0]! + x[0]!, 16),
      g: parseInt(x[1]! + x[1]!, 16),
      b: parseInt(x[2]! + x[2]!, 16),
    }
  }
  if (x.length === 6) {
    return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16) }
  }
  if (x.length === 8) {
    return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16) }
  }
  return null
}

function srgbToLinear(n: number): number {
  const a = n / 255
  return a <= 0.04045 ? a / 12.92 : ((a + 0.055) / 1.055) ** 2.4
}
function relLum(hex: string): number {
  const rgb = parseHex6(hex)
  if (!rgb) return 0.5
  return (
    0.2126 * srgbToLinear(rgb.r) + 0.7152 * srgbToLinear(rgb.g) + 0.0722 * srgbToLinear(rgb.b)
  )
}
function contrastRatio(fg: string, bg: string): number {
  const L1 = relLum(fg) + 0.05
  const L2 = relLum(bg) + 0.05
  return (Math.max(L1, L2) / Math.min(L1, L2))
}
function toHex6(hex: string): string {
  const p = parseHex6(hex)
  if (!p) return '#0f172a'
  return `#${[p.r, p.g, p.b]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`
}
function mixHex(a: string, b: string, t: number): string {
  const A = parseHex6(a)
  const B = parseHex6(b)
  if (!A || !B) return a
  const m = (x: number, y: number) => Math.max(0, Math.min(255, Math.round(x * (1 - t) + y * t)))
  return `#${[m(A.r, B.r), m(A.g, B.g), m(A.b, B.b)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`
}
function bestTextOnBackground(fillHex: string): string {
  for (const f of ['#0f172a', '#0a0a0a', '#1e1e1e', '#000000', '#0c4a6e', '#1e3a2f']) {
    if (contrastRatio(f, fillHex) >= WCAG_AA_MIN) return f
  }
  for (const f of ['#f8fafc', '#f1f5f9', '#ffffff', '#fef2f2']) {
    if (contrastRatio(f, fillHex) >= WCAG_AA_MIN) return f
  }
  return relLum(fillHex) < 0.45 ? '#ffffff' : '#0f172a'
}
function bestSecondaryTextOnBackground(fillHex: string, textHex: string): string {
  const cands = [
    mixHex(textHex, relLum(fillHex) < 0.3 ? '#94a3b8' : '#6b7280', 0.4),
    '#64748b',
    textHex,
  ]
  for (const c of cands) {
    if (contrastRatio(c, fillHex) >= UI_GRAPHIC_MIN) return toHex6(c)
  }
  return toHex6(textHex)
}
function cleanPillAnchorForVariant(
  b: BookingBlock
): 'reservation' | 'inquiry' | 'ownerStay' | 'blocked' {
  if (b.variant === 'gray') {
    return 'blocked'
  }
  if (b.variant === 'blue') {
    return 'ownerStay'
  }
  if (b.variant === 'orange') {
    return 'inquiry'
  }
  return 'reservation'
}
/** Light tinted pill — `styleIsClean` adds a 2px left accent only in Clean; Standard/Compact use 1px border on all sides. */
function getLightWashPillTheming(
  b: BookingBlock,
  c: CalendarPillColorSettings,
  isSelected: boolean,
  styleIsClean: boolean,
  /** No box-shadows / selection ring (monthly "clean" grid). */
  flatChrome?: boolean,
  /** Gate the red/amber left-border indicator on the Full style. */
  paymentIndicatorEnabled = true,
): {
  style: CSSProperties
  className: string
  fill: string
  labelColor: string
  noteColor: string
  /** System red / amber for compact payment dots. */
  paymentRaw: { unpaid: string; partial: string }
} {
  const k = cleanPillAnchorForVariant(b)
  const anchor = c[k] ?? DEFAULT_CALENDAR_PILL_COLORS[k]
  // The swatches are already curated (light + dark variants). Use the picked
  // hex directly as the pill fill and let `bestTextOnBackground` pick a dark
  // or near-white label color so both light and dark swatches remain legible.
  const fill = toHex6(anchor)
  const uRaw = toHex6(SYSTEM_NOTIFICATION_UNPAID)
  const pRaw = toHex6(SYSTEM_NOTIFICATION_PARTIAL)
  const text = bestTextOnBackground(fill)
  // Border color: same logic as standard pills (mix toward black).
  // Full (clean) pills use a stronger shift so hairlines stay readable
  // against both the pill fill and the white cell background.
  const borderShift = styleIsClean
    ? (relLum(anchor) < 0.35 ? 0.45 : 0.35)
    : (relLum(anchor) < 0.35 ? 0.28 : 0.18)
  const borderSoft = mixHex(anchor, '#000000', borderShift)
  const softStr = toHex6(borderSoft)
  // Payment status only relevant for Full pills (standard/compact use a dot instead).
  const payStatus: DemoPaymentStatus | null =
    b.variant === 'gray' ? null : demoPaymentStatusForBookingBlock(b.start, b.reservationId)
  const usePay =
    styleIsClean &&
    paymentIndicatorEnabled &&
    payStatus != null &&
    (payStatus === 'Unpaid' || payStatus === 'Partially paid')
  // Left border for Full pills: same color as all other borders (softStr) so it's
  // always visible regardless of pill color. Switches to alert color on unpaid/partial.
  // (Previously used typeLeft = anchor for light pills → invisible left border.)
  const leftBorderColor = usePay ? (payStatus === 'Unpaid' ? uRaw : pRaw) : softStr
  const second = bestSecondaryTextOnBackground(fill, text)
  // Full pills: all 4 borders visible at all times; left is 3px (thicker accent).
  // Standard/compact: uniform 1px border on all sides.
  const style: CSSProperties = styleIsClean
    ? {
        backgroundColor: fill,
        boxSizing: 'border-box',
        borderTop: `1px solid ${softStr}`,
        borderRight: `1px solid ${softStr}`,
        borderBottom: `1px solid ${softStr}`,
        borderLeft: `3px solid ${leftBorderColor}`,
        color: text,
      }
    : {
        backgroundColor: fill,
        border: `1px solid ${softStr}`,
        color: text,
      }
  return {
    style,
    // Shadows removed — visual clutter per design feedback. Selection ring kept
    // so the active pill still reads clearly when picked.
    className: cn(
      !flatChrome && isSelected && 'ring-2 ring-inset ring-[#0f172a]/18',
    ),
    fill,
    labelColor: text,
    noteColor: second,
    paymentRaw: { unpaid: uRaw, partial: pRaw },
  }
}

// Pill shadow tokens removed — design direction is shadow-free, relying on
// a subtle darker border for definition. Kept this comment so future devs
// don't reintroduce shadows without checking the design spec.

function mergeCalendarPillColors(vis: { calendarPillColors?: CalendarPillColorPatch }): CalendarPillColorSettings {
  const p = vis.calendarPillColors
  return {
    reservation: p?.reservation ?? DEFAULT_CALENDAR_PILL_COLORS.reservation,
    inquiry: p?.inquiry ?? DEFAULT_CALENDAR_PILL_COLORS.inquiry,
    ownerStay: p?.ownerStay ?? DEFAULT_CALENDAR_PILL_COLORS.ownerStay,
    blocked: p?.blocked ?? DEFAULT_CALENDAR_PILL_COLORS.blocked,
    note: p?.note ?? DEFAULT_CALENDAR_PILL_COLORS.note,
    task: p?.task ?? DEFAULT_CALENDAR_PILL_COLORS.task,
  }
}

const DAY_COL_PX = 73
const LISTING_COL_PX = 248
/** Pill height — Figma 275:46765 (36px). */
const BAR_PILL_H = 36
/** Compact row height — dense task-style pills. */
const COMPACT_PILL_H = 20
/** Minimum height per lane when reservation pills are Modern (row can grow taller). */
const MODERN_MIN_LANE_HEIGHT = 28
/** Vertical inset between modern pill stack and listing row top/bottom (2px + 2px). */
const MODERN_CELL_PILL_PAD_Y = 3
/** Guest / channel photo — Figma 24×24. */
const PILL_PHOTO_PX = 24
/** Vertical gap between stacked reservation pills (all styles) — 6px. */
const PILL_STACK_GAP_PX = 6
/** Pill left edge is this many px to the left of the day column center on check-in. */
const PILL_CHECKIN_OFFSET_FROM_CENTER_PX = 12
/** Pill right edge ends this many px to the left of the day column center on checkout. */
const PILL_CHECKOUT_END_BEFORE_CENTER_PX = 18
/** Vertical padding above / below pills inside a listing row (each side). */
const BAR_PILL_PAD_Y = 4
/** Monthly week row: extra offset so pills sit below the day number (Figma). */
const MONTHLY_PILL_TOP_OFFSET = 8
/** Monthly day cells: minimum height (Figma; keeps borders + number row from clipping). */
const MONTHLY_DAY_CELL_MIN_H = 96
/** Clean pills on the monthly row only: stack up from the bottom, max height per bar. */
const MONTHLY_PILL_BOTTOM_GAP = 12
const MONTHLY_CLEAN_PILL_MAX_H = 48
/** Space reserved above pills for the day number (top-left). */
const MONTHLY_DAY_NUM_RESERVE = 24
/** Short fixed window — keeps the grid small for performance (not a full multi-month range). */
const TIMELINE_DAYS = 40
const BORDER_SECONDARY = 'border-[#e9eaeb]'
const TEXT_SECONDARY = 'text-[#414651]'
const TEXT_QUATERNARY = 'text-[#717680]'
/** Calendar selection: teal wash on each in-range day; ring is one range overlay, not per cell. */
const SELECTION_CELL_BG = 'z-[1] bg-[#15b8b0]/20'
const SELECTION_RANGE_OUTLINE =
  'pointer-events-none absolute top-0 bottom-0 z-[3] ring-2 ring-inset ring-[#101828]'
const SELECTION_RANGE_OUTLINE_MONTHLY =
  'pointer-events-none absolute top-0 bottom-0 z-[3] box-border border-2 border-[#101828]'

/** Shared outline styling for calendar toolbar (1px border, 36px / h-9 targets design-system Button). */
const CALENDAR_OUTLINE_BTN = 'border-[#d5d7da] bg-white text-[#414651] hover:bg-[#fafafa]'
/** Delay before reservation / blocked pill tooltips appear (ms). */
const CALENDAR_PILL_TOOLTIP_DELAY_MS = 500

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function startOfMonth(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1))
}

function addMonths(d: Date, n: number): Date {
  const x = new Date(d)
  x.setMonth(x.getMonth() + n)
  return startOfDay(x)
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function dayIndexInView(d: Date, viewStart: Date): number {
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  const b = Date.UTC(viewStart.getFullYear(), viewStart.getMonth(), viewStart.getDate())
  return Math.round((a - b) / 86400000)
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Strictly before local calendar today — for "past" column styling (not listing column). */
function isDayBeforeToday(d: Date): boolean {
  return startOfDay(d).getTime() < startOfDay(new Date()).getTime()
}

/** Anchor the timeline so "Today" sits near the left edge with a small amount of past context. */
function initialTimelineStart(): Date {
  return addDays(startOfDay(new Date()), -3)
}

const DOW_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

type CalendarListing = {
  id: string
  name: string
  clean: boolean
  code: string
}

type BookingBlock = {
  listingId: string
  /** Inclusive first night */
  start: Date
  /** Exclusive end (checkout morning) */
  end: Date
  label: string
  variant: 'teal' | 'orange' | 'blue' | 'gray'
  /** Opens preview for this demo reservation id */
  reservationId: string
  channelId?: string
  showDoc?: boolean
  /** Demo: when Tasks is on and count > 0, pill uses compact layout */
  taskCount?: number
  /** User-placed "unavailable" bar — darker styling, lock, no preview */
  isUserBlocked?: boolean
  /** Host-visible note for blocked / not-available periods (demo + drawer). */
  hostNotes?: string
  /** When true, show the notes icon + notes tooltip on teal / orange / blue pills (~30% in demo). */
  showNotesIcon?: boolean
}

type CalendarCellOverride = {
  price?: string
  minNights?: number
  checkInBlocked?: boolean
  checkOutBlocked?: boolean
}

/**
 * Host-authored note attached to a specific listing + day. Renders as a short
 * pill pinned to the BOTTOM of the day cell so it can coexist with a
 * reservation / owner-stay / blocked pill on the same day without overlap.
 */
type CalendarNoteItem = {
  id: string
  listingId: string
  /** Inclusive start day key (YYYY-MM-DD from calendarDayKey). */
  dayKey: string
  /** Inclusive end day key. When omitted, the note covers a single day. */
  endDayKey?: string
  text: string
}

/**
 * Host-authored task for a listing + day (e.g. "Maintenance", "Check thermostat").
 * Renders as a compact bottom-of-cell pill alongside a potential note.
 */
type CalendarTaskItem = {
  id: string
  listingId: string
  dayKey: string
  endDayKey?: string
  name: string
}

function calendarDayKey(d: Date): string {
  const x = startOfDay(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseCalendarDayKeyToDate(v: string): Date | null {
  const [y, m, d] = v.split('-').map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
  return startOfDay(new Date(y, m - 1, d))
}

/** Last calendar night before exclusive `end` for user-placed blocks (`end` is day after checkout). */
function bookingCheckoutDayForForm(b: BookingBlock): Date {
  if (b.isUserBlocked) return addDays(startOfDay(b.end), -1)
  return startOfDay(b.end)
}

function cellOverrideKey(listingId: string, d: Date): string {
  return `${listingId}|${calendarDayKey(d)}`
}

function mergeCellMeta(
  listingId: string,
  date: Date,
  overrides: Record<string, CalendarCellOverride>
): ReturnType<typeof cellMeta> {
  const base = cellMeta(listingId, date)
  const o = overrides[cellOverrideKey(listingId, date)]
  if (!o) return base
  return {
    price: o.price ?? base.price,
    minNights: o.minNights ?? base.minNights,
    checkInBlocked: o.checkInBlocked !== undefined ? o.checkInBlocked : base.checkInBlocked,
    checkOutBlocked: o.checkOutBlocked !== undefined ? o.checkOutBlocked : base.checkOutBlocked,
  }
}

function noteOverlapsManageRange(
  n: CalendarNoteItem,
  listingId: string,
  rangeStart: Date,
  rangeEndInclusive: Date,
): boolean {
  if (n.listingId !== listingId) return false
  const ns = parseCalendarDayKeyToDate(n.dayKey)
  if (!ns) return false
  const ne = parseCalendarDayKeyToDate(n.endDayKey ?? n.dayKey)
  if (!ne) return false
  const rs = startOfDay(rangeStart).getTime()
  const re = startOfDay(rangeEndInclusive).getTime()
  const n0 = startOfDay(ns).getTime()
  const n1 = startOfDay(ne).getTime()
  return n0 <= re && rs <= n1
}

const CAL_PILL_OFFSET_FROM_ROW_BOTTOM = 6

/**
 * Pixels from row bottom to the bottom edge of the lowest reservation pill
 * (inset, note row?, gap, task row?, gap) — for **dedicated** bottom slots when
 * the corresponding setting is on, even if a given row has no note/task data.
 */
function bottomStripReserveForContentSlots(
  hasNoteRowSlot: boolean,
  hasTaskRowSlot: boolean
): number {
  if (!hasNoteRowSlot && !hasTaskRowSlot) return 0
  // No extra bottom-inset constant: the 6px below the lowest item comes from the
  // symmetric centering of stackTop (same 6px is applied on top of the pill).
  const ITEM_H = 18
  const GAP = CAL_ITEM_LAYER_V_PAD // 6
  let d = 0
  if (hasNoteRowSlot) d += ITEM_H
  if (hasTaskRowSlot) {
    if (hasNoteRowSlot) d += GAP
    d += ITEM_H
  }
  d += GAP // top-gap between pill and the first task/note item
  return d
}

/** When Calendar notes / Tasks are on in settings, every listing row keeps the same reserved bottom area. */
function bottomStripReserveForVisibility(visibility: CalendarSettingsVisibility): number {
  return bottomStripReserveForContentSlots(visibility.calendarNotes, visibility.tasks)
}

function taskSpanBottomOffset(hasNoteBelow: boolean): number {
  // Used only in the no-pill (bottom-anchored) fallback. 6px matches CAL_ITEM_LAYER_V_PAD.
  const ITEM_H = 18
  const GAP = CAL_ITEM_LAYER_V_PAD // 6
  if (hasNoteBelow) return GAP + ITEM_H + GAP // 6 + 18 + 6 = 30
  return GAP // 6
}

/**
 * Picks a single calendar note to show in Manage dates: exact span match, then
 * start-aligned, then any overlapping the selection (same listing).
 */
function findNoteForManageRange(
  items: readonly CalendarNoteItem[],
  listingId: string,
  rangeStart: Date,
  rangeEndInclusive: Date,
): CalendarNoteItem | null {
  const startK = calendarDayKey(rangeStart)
  const endK = calendarDayKey(rangeEndInclusive)
  const candidates = items.filter((n) =>
    noteOverlapsManageRange(n, listingId, rangeStart, rangeEndInclusive),
  )
  if (candidates.length === 0) return null
  const exact = candidates.find(
    (n) => n.dayKey === startK && (n.endDayKey ?? n.dayKey) === endK,
  )
  if (exact) return exact
  const byStart = candidates.find((n) => n.dayKey === startK)
  if (byStart) return byStart
  return candidates[0] ?? null
}

const LISTING_PREFIXES = ['Apartment', 'Loft', 'House', 'Studio', 'Villa', 'Cabin'] as const

/** Curated Unsplash stills — match `LISTING_PREFIXES` labels before `—` in demo names. */
const CAL_LISTING_THUMB_W = 240
const CAL_LISTING_THUMB_H = 192
const calListingThumb = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${CAL_LISTING_THUMB_W}&h=${CAL_LISTING_THUMB_H}&q=80`

const CAL_LISTING_THUMBS: Record<(typeof LISTING_PREFIXES)[number], readonly [string, string]> = {
  Apartment: [
    calListingThumb('photo-1522708323590-d24dbb6b0267'),
    calListingThumb('photo-1502672260266-1c1ef2d93688'),
  ],
  Loft: [
    calListingThumb('photo-1556020685-ae41abfc9365'),
    calListingThumb('photo-1582268611958-ebfd161ef9cf'),
  ],
  House: [
    calListingThumb('photo-1568605114967-8130f3a36994'),
    calListingThumb('photo-1600596542815-ffad4c1539a9'),
  ],
  Studio: [
    calListingThumb('photo-1536376072261-38c75010e6c9'),
    calListingThumb('photo-1493809842364-78817add7ffb'),
  ],
  Villa: [
    calListingThumb('photo-1613490493576-7fde63acd811'),
    calListingThumb('photo-1600585154340-be6161a56a0c'),
  ],
  Cabin: [
    calListingThumb('photo-1518780664697-55e3ad937233'),
    calListingThumb('photo-1449824913935-59a10b8d2000'),
  ],
}

const CAL_LISTING_THUMB_FALLBACK: readonly [string, string] = [
  calListingThumb('photo-1600585154340-be6161a56a0c'),
  calListingThumb('photo-1600607687939-ce8a6c25118c'),
]

function calendarListingThumbnailSrc(listing: { id: string; name: string }): string {
  const prefix = listing.name.split('—')[0]?.trim() ?? ''
  const pool =
    prefix in CAL_LISTING_THUMBS
      ? CAL_LISTING_THUMBS[prefix as keyof typeof CAL_LISTING_THUMBS]
      : CAL_LISTING_THUMB_FALLBACK
  let h = 0
  for (let i = 0; i < listing.id.length; i++) h += listing.id.charCodeAt(i)
  return pool[h % pool.length]!
}
const LISTING_AREAS = [
  'Austin',
  'Portland',
  'Denver',
  'Miami',
  'Seattle',
  'Chicago',
  'Boston',
  'Nashville',
  'Phoenix',
  'San Diego',
  'Atlanta',
  'Dallas',
  'Tucson',
  'Raleigh',
  'Oakland',
  'Minneapolis',
  'Tampa',
  'Charlotte',
  'Las Vegas',
  'Detroit',
  'Orlando',
  'Brooklyn',
  'Scottsdale',
  'Cambridge',
] as const

/** Demo listings — enough rows to fill the calendar table. */
const DEMO_LISTINGS: CalendarListing[] = Array.from({ length: 18 }, (_, i) => ({
  id: `l${i + 1}`,
  name: `${LISTING_PREFIXES[i % LISTING_PREFIXES.length]} — ${LISTING_AREAS[i % LISTING_AREAS.length]}`,
  clean: i % 4 !== 2,
  code: `LST-${String(220 + i)}`,
}))

/**
 * Seed realistic-sounding calendar notes + tasks so the prototype shows the
 * bottom-row chips without the reviewer needing to add entries through the
 * 3-dots flow. Anchored relative to "today" so they always fall inside the
 * visible timeline.
 *
 * Each entry is intentionally short (truncates cleanly on narrow columns) and
 * covers the real use-cases from the design brief: amenity gaps, small fixes,
 * cleaning, maintenance, restock and guest prep.
 */
function buildDemoNoteSeed(): CalendarNoteItem[] {
  const today = startOfDay(new Date())
  const d = (offset: number) => calendarDayKey(addDays(today, offset))
  return [
    // Multi-day note — covers 3 nights to show the spanning pill.
    {
      id: 'seed-note-1',
      listingId: 'l1',
      dayKey: d(1),
      endDayKey: d(3),
      text: 'Microwave not working — replace before next check-in',
    },
    {
      id: 'seed-note-2',
      listingId: 'l3',
      dayKey: d(2),
      text: 'Missing hair dryer — restock from storage',
    },
    {
      id: 'seed-note-3',
      listingId: 'l5',
      dayKey: d(4),
      endDayKey: d(5),
      text: 'Balcony door squeaks — grease the hinge',
    },
    {
      id: 'seed-note-4',
      listingId: 'l8',
      dayKey: d(0),
      text: 'Low on coffee pods — reorder',
    },
    {
      id: 'seed-note-5',
      listingId: 'l11',
      dayKey: d(6),
      endDayKey: d(8),
      text: 'Host keys with front-desk until Friday',
    },
  ]
}

function buildDemoTaskSeed(): CalendarTaskItem[] {
  const today = startOfDay(new Date())
  const d = (offset: number) => calendarDayKey(addDays(today, offset))
  return [
    { id: 'seed-task-1', listingId: 'l1', dayKey: d(0), name: 'Deep clean' },
    {
      id: 'seed-task-2',
      listingId: 'l2',
      dayKey: d(1),
      endDayKey: d(2),
      name: 'HVAC maintenance',
    },
    { id: 'seed-task-3', listingId: 'l4', dayKey: d(3), name: 'Restock amenities' },
    { id: 'seed-task-4', listingId: 'l6', dayKey: d(5), name: 'Welcome package' },
    { id: 'seed-task-5', listingId: 'l9', dayKey: d(2), name: 'Check smoke alarm' },
    { id: 'seed-task-6', listingId: 'l12', dayKey: d(7), name: 'Photographer visit' },
  ]
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Half-open stay ranges `[checkIn, checkOut)` — checkout morning is exclusive.
 * Overlap iff they share a night; touching only on checkout day (prev end === next start) is allowed.
 */
function stayRangesOverlapHalfOpen(
  aStart: Date,
  aEndExclusive: Date,
  bStart: Date,
  bEndExclusive: Date
): boolean {
  const a = startOfDay(aStart).getTime()
  const ae = startOfDay(aEndExclusive).getTime()
  const b = startOfDay(bStart).getTime()
  const be = startOfDay(bEndExclusive).getTime()
  return a < be && b < ae
}

/**
 * One booking per listing per night: extras (user blocks / add flow) win ties; generated fills gaps.
 * Drops any stay that overlaps an already-kept stay on the same listing.
 */
function mergeBookingsOnePerNightPerListing(generated: BookingBlock[], extra: BookingBlock[]): BookingBlock[] {
  const listingIds = new Set<string>()
  for (const b of generated) listingIds.add(b.listingId)
  for (const b of extra) listingIds.add(b.listingId)
  const out: BookingBlock[] = []
  for (const listingId of listingIds) {
    const extras = extra.filter((b) => b.listingId === listingId)
    const gens = generated.filter((b) => b.listingId === listingId)
    const kept: BookingBlock[] = []
    const tryAdd = (b: BookingBlock) => {
      if (kept.some((k) => stayRangesOverlapHalfOpen(b.start, b.end, k.start, k.end))) return
      kept.push(b)
    }
    extras.sort((a, b) => a.start.getTime() - b.start.getTime())
    for (const b of extras) tryAdd(b)
    gens.sort((a, b) => a.start.getTime() - b.start.getTime())
    for (const b of gens) tryAdd(b)
    out.push(...kept)
  }
  return out
}

/**
 * Draw a distinct reservation sample per booking. Pulls from a shuffled cursor so the same
 * sample is never picked twice within a single calendar generation — gives every pill a
 * unique guest name and avatar (seeded by reservationId in `reservationGuestAvatar`).
 */
function pickUniqueReservationSample(
  cursor: { pool: ReservationListItem[]; index: number },
): ReservationListItem | null {
  if (cursor.index >= cursor.pool.length) return null
  const r = cursor.pool[cursor.index]!
  cursor.index += 1
  return r
}

/** Deterministic Fisher–Yates shuffle — different listings should draw a varied mix. */
function shuffleWithRng<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = out[i]!
    out[i] = out[j]!
    out[j] = tmp
  }
  return out
}

/**
 * Seeded random stays in `[timelineStart, timelineStart + dayCount)`.
 * At most one stay per listing per night; same-day checkout + check-in is allowed (ranges touch, no overlap).
 */
function listingIdRngSeed(listingId: string): number {
  let h = 0x9e37_79b9
  for (let i = 0; i < listingId.length; i++) {
    h = Math.imul(h ^ listingId.charCodeAt(i), 0x85eb_ca6b)
    h ^= h >>> 13
  }
  return (h ^ 0xca1e_9daf) >>> 0
}

const DEMO_BLOCKED_NOTES = [
  'Maintenance — HVAC service scheduled.',
  'Owner use — family in town.',
  'Deep clean between guests.',
  'Holding for repeat guest.',
  'Utility work on the block; calendar blocked.',
  'Photography / listing refresh.',
] as const

/** Merge consecutive gray blocks on the same listing (checkout day = next check-in). */
function mergeAdjacentGrayBlocks(bookings: BookingBlock[]): BookingBlock[] {
  const nonGray = bookings.filter((b) => b.variant !== 'gray')
  const grayByListing = new Map<string, BookingBlock[]>()
  for (const b of bookings) {
    if (b.variant !== 'gray') continue
    const arr = grayByListing.get(b.listingId) ?? []
    arr.push(b)
    grayByListing.set(b.listingId, arr)
  }
  const mergedGrays: BookingBlock[] = []
  for (const grays of grayByListing.values()) {
    grays.sort((a, b) => a.start.getTime() - b.start.getTime())
    let cur = { ...grays[0]! }
    for (let i = 1; i < grays.length; i++) {
      const g = grays[i]!
      if (startOfDay(cur.end).getTime() === startOfDay(g.start).getTime()) {
        const parts = [cur.hostNotes, g.hostNotes].filter(Boolean)
        cur = {
          ...cur,
          end: g.end,
          hostNotes: parts.length ? parts.join(' · ') : cur.hostNotes,
        }
      } else {
        mergedGrays.push(cur)
        cur = { ...g }
      }
    }
    mergedGrays.push(cur)
  }
  return [...nonGray, ...mergedGrays]
}

function buildRandomCalendarBookings(
  listings: CalendarListing[],
  reservationSamples: ReservationListItem[],
  timelineStart: Date,
  dayCount: number
): BookingBlock[] {
  if (reservationSamples.length === 0) return []
  const rangeStart = startOfDay(timelineStart)
  const rangeEndExclusive = addDays(rangeStart, dayCount)
  const totalSpan = dayCount
  const out: BookingBlock[] = []
  /**
   * Stable pool shuffle keyed off all listing ids — gives every pill a distinct reservation
   * sample (unique guestName + avatar), resetting only when the timeline regenerates. If we
   * exhaust the pool (more bookings than samples) we skip further additions rather than
   * reuse a sample, since reuse is exactly what Image 2 asked us to remove.
   */
  const poolSeed = listings.reduce(
    (h, li) => Math.imul(h ^ listingIdRngSeed(li.id), 0x45d9f3b) >>> 0,
    0x9e3779b1 >>> 0,
  )
  const cursor = {
    pool: shuffleWithRng(reservationSamples, mulberry32(poolSeed)),
    index: 0,
  }

  for (const li of listings) {
    const rng = mulberry32(listingIdRngSeed(li.id))
    const listingAllowsBlocks = rng() < 0.42
    const listingAllowsOwnerStay = rng() < 0.55
    /** When blocks exist: some listings get one long hold, others only short 1–3 day holds. */
    const blockStaysLong = listingAllowsBlocks && rng() < 0.28
    const placed: { start: Date; end: Date }[] = []
    const targetCount = 6 + Math.floor(rng() * 12)
    let added = 0
    let attempts = 0
    const maxAttempts = 3200

    while (added < targetCount && attempts < maxAttempts) {
      attempts++
      const maxNights = Math.max(1, Math.min(14, totalSpan - 1))

      const roll = rng()
      let variant: BookingBlock['variant']
      if (roll < 0.85) variant = 'teal'
      else if (roll < 0.9) variant = 'orange'
      else if (roll < 0.95) variant = 'blue'
      else variant = 'gray'

      if (variant === 'gray' && !listingAllowsBlocks) {
        variant = rng() < 0.92 ? 'teal' : 'orange'
      }
      if (variant === 'blue' && !listingAllowsOwnerStay) {
        variant = rng() < 0.85 ? 'teal' : 'orange'
      }

      let len: number
      if (variant === 'gray') {
        if (blockStaysLong && maxNights >= 5) {
          len = 5 + Math.floor(rng() * Math.min(10, maxNights - 4))
          len = Math.min(len, maxNights)
        } else {
          const cap = Math.min(3, maxNights)
          len = 1 + Math.floor(rng() * cap)
        }
      } else {
        if (maxNights < 2) continue
        len = Math.max(2, Math.min(maxNights, 1 + Math.floor(rng() * maxNights)))
      }

      const latestStart = totalSpan - len - 1
      if (latestStart < 0) continue

      const offset = Math.floor(rng() * (latestStart + 1))

      const start = addDays(rangeStart, offset)
      const end = addDays(start, len)
      if (end.getTime() > rangeEndExclusive.getTime()) continue

      const startD = startOfDay(start)
      const endD = startOfDay(end)
      const clashes = placed.some((p) =>
        stayRangesOverlapHalfOpen(startD, endD, startOfDay(p.start), startOfDay(p.end))
      )
      if (clashes) continue

      const res = pickUniqueReservationSample(cursor)
      if (!res) break // Pool exhausted — do not reuse a reservation for a different booking.
      placed.push({ start: startD, end: endD })

      const label =
        variant === 'blue'
          ? 'Owner stay'
          : variant === 'gray'
            ? 'Not Available'
            : variant === 'orange'
              ? 'Inquiry'
              : res.guestName
      const channelId =
        variant === 'gray' || variant === 'blue'
          ? undefined
          : rng() < 0.55
            ? 'airbnb'
            : 'booking'

      const taskCount =
        variant === 'teal' || variant === 'orange'
          ? rng() > 0.82
            ? 1 + Math.floor(rng() * 4)
            : 0
          : 0
      const hostNotes =
        variant === 'gray'
          ? DEMO_BLOCKED_NOTES[Math.floor(rng() * DEMO_BLOCKED_NOTES.length)]!
          : undefined
      const showNotesIcon =
        variant === 'teal' || variant === 'orange' || variant === 'blue' ? rng() < 0.3 : undefined
      out.push({
        listingId: li.id,
        start: startD,
        end: endD,
        label,
        variant,
        reservationId: res.id,
        channelId,
        showDoc: variant === 'teal' && rng() > 0.62,
        taskCount,
        hostNotes,
        showNotesIcon,
      })
      added++
    }
  }
  return mergeAdjacentGrayBlocks(out)
}

function bookingDayRange(
  booking: BookingBlock,
  timelineStart: Date,
  dayCount: number,
  dayColumnWidthPx: number = DAY_COL_PX
): {
  startIdx: number
  endExclusive: number
  left: number
  width: number
  /** Booking began before the visible range — bar flush to the row's left, no left rounding. */
  continuesFromPrior: boolean
  /** Booking extends past the visible range — bar flush to the row's right, no right rounding. */
  continuesToNext: boolean
} | null {
  const startIdx = dayIndexInView(booking.start, timelineStart)
  const endIdx = dayIndexInView(booking.end, timelineStart)
  // Completely before or after the visible range — nothing to render.
  if (endIdx <= 0) return null
  if (startIdx >= dayCount) return null
  const visStart = Math.max(0, startIdx)
  const visEnd = Math.min(dayCount, endIdx)
  const continuesFromPrior = startIdx < 0
  /**
   * Flat right edge when the checkout column sits past the last visible cell. `>=` is
   * important: when `endIdx === dayCount` the pill end sits in the *next* row (cx - 18 of the
   * first cell of next week), so rendering it here would overflow the grid with no cap.
   */
  const continuesToNext = endIdx >= dayCount
  const W = dayColumnWidthPx
  const cx = W / 2
  const left = continuesFromPrior
    ? visStart * W
    : visStart * W + cx - PILL_CHECKIN_OFFSET_FROM_CENTER_PX
  const right = continuesToNext
    ? visEnd * W
    : visEnd * W + cx - PILL_CHECKOUT_END_BEFORE_CENTER_PX
  if (right <= left) return null
  const width = Math.max(8, right - left)
  return { startIdx: visStart, endExclusive: visEnd, left, width, continuesFromPrior, continuesToNext }
}

/**
 * Monthly week row: clip a booking to days that belong to `monthStart`'s month and then
 * apply the same geometry as the multi-view bar (check-in inset from cell center,
 * check-out ending before the next day's center). Continuation flags fold together:
 *   - the booking may continue because it started before this week (base.continuesFromPrior)
 *   - OR because we clipped the segment at the month boundary
 * When either is true the corresponding edge sits flush to the column and the pill's
 * rounded corner on that side is dropped (handled in `bookingPillRadius`).
 */
function bookingDayRangeForMonthWeek(
  booking: BookingBlock,
  weekStart: Date,
  monthStart: Date,
  dayColumnWidthPx: number = DAY_COL_PX
): {
  startIdx: number
  endExclusive: number
  left: number
  width: number
  continuesFromPrior: boolean
  continuesToNext: boolean
} | null {
  const base = bookingDayRange(booking, weekStart, 7, dayColumnWidthPx)
  if (!base) return null
  const W = dayColumnWidthPx
  const cx = W / 2
  let a = base.startIdx
  let b = base.endExclusive
  while (a < b) {
    const d = addDays(weekStart, a)
    if (isSameMonth(d, monthStart)) break
    a++
  }
  while (b > a) {
    const d = addDays(weekStart, b - 1)
    if (isSameMonth(d, monthStart)) break
    b--
  }
  if (a >= b) return null
  const clippedAtStart = a > base.startIdx
  const clippedAtEnd = b < base.endExclusive
  const continuesFromPrior = base.continuesFromPrior || clippedAtStart
  const continuesToNext = base.continuesToNext || clippedAtEnd
  const left = continuesFromPrior
    ? a * W
    : a * W + cx - PILL_CHECKIN_OFFSET_FROM_CENTER_PX
  const right = continuesToNext
    ? b * W
    : b * W + cx - PILL_CHECKOUT_END_BEFORE_CENTER_PX
  const width = Math.max(32, right - left)
  if (width < 24) return null
  return { startIdx: a, endExclusive: b, left, width, continuesFromPrior, continuesToNext }
}

function minRowHeightForMonthlyCleanStack(maxLane: number): number {
  if (maxLane < 0) return 0
  return (
    MONTHLY_PILL_BOTTOM_GAP +
    (maxLane + 1) * MONTHLY_CLEAN_PILL_MAX_H +
    maxLane * PILL_STACK_GAP_PX +
    MONTHLY_DAY_NUM_RESERVE
  )
}

/** Week starts Sunday (calendar grid — Figma monthly). */
function startOfWeekSunday(d: Date): Date {
  const x = startOfDay(d)
  return addDays(x, -x.getDay())
}

/** All Sunday week-starts that intersect a calendar month (inclusive). */
function getMonthGridWeekStarts(monthStart: Date): Date[] {
  const first = startOfMonth(monthStart)
  const lastDay = addDays(addMonths(first, 1), -1)
  const firstWeek = startOfWeekSunday(first)
  const lastWeek = startOfWeekSunday(lastDay)
  const weeks: Date[] = []
  let cur = firstWeek
  while (cur.getTime() <= lastWeek.getTime()) {
    weeks.push(cur)
    cur = addDays(cur, 7)
    if (weeks.length > 8) break
  }
  return weeks
}

/** Pill height/layout follow calendar settings only — never mix compact vs standard per row. */
function pillHeightForCalendarSettings(v: CalendarSettingsVisibility): number {
  if (v.reservationPillStyle === 'compact') return COMPACT_PILL_H
  return BAR_PILL_H
}

function paymentStatusDotClass(ps: ReservationListItem['paymentStatus']): string {
  if (ps === 'Paid') return 'bg-[#17b26a]'
  if (ps === 'Unpaid') return 'bg-[#f04438]'
  return 'bg-[#f79009]'
}

/** Show on-pill payment dot only when action may be needed (red / orange); hide when Paid (green). */
function paymentStatusShowsActionIndicator(ps: ReservationListItem['paymentStatus']): boolean {
  return ps !== 'Paid'
}

function reservationTooltipLines(
  res: ReservationListItem,
  paymentStatusDisplay?: ReservationListItem['paymentStatus']
): string[] {
  const pay = paymentStatusDisplay ?? res.paymentStatus
  return [
    res.source,
    `${res.checkIn} – ${res.checkOut} (${res.nights} nights)`,
    `${res.guests} guests`,
    `Status: ${res.status}`,
    `Payment: ${pay}`,
    `Balance due: ${res.balanceDue}`,
    `Total: ${res.totalAmount}`,
  ]
}

function notesTooltipLines(res: ReservationListItem): string[] {
  const guest = res.specialRequests.trim() || '—'
  const host = res.notes.trim() || '—'
  return [guest, '------', host]
}

function PaymentStatusDotCompact({
  paymentStatus,
  /** Raw unpaid / partial hex (no contrast adjustment); optional ring on fill. */
  rawPill,
}: {
  paymentStatus: ReservationListItem['paymentStatus']
  rawPill?: { fill: string; unpaid: string; partial: string }
}) {
  const ps = paymentStatus
  if (!paymentStatusShowsActionIndicator(ps)) return null
  if (rawPill) {
    const isUn = ps === 'Unpaid'
    const bg = isUn ? rawPill.unpaid : rawPill.partial
    return (
      <span
        className="box-border size-2 shrink-0 rounded-full"
        style={{
          backgroundColor: bg,
          boxShadow: `0 0 0 1px ${toHex6(mixHex(rawPill.fill, bg, 0.5))}`,
        }}
        aria-hidden
      />
    )
  }
  return (
    <span
      className={cn(
        'box-border size-2 shrink-0 rounded-full border border-white',
        paymentStatusDotClass(ps),
      )}
      aria-hidden
    />
  )
}

type CalendarPillTooltipAnchor = 'pill' | 'notes'

function CalendarPillFloatingTooltip({
  open,
  anchor,
  pillRef,
  notesRef,
  cursor,
  children,
}: {
  open: boolean
  anchor: CalendarPillTooltipAnchor
  pillRef: RefObject<HTMLButtonElement | null>
  notesRef: RefObject<HTMLSpanElement | null>
  /**
   * Latest cursor position in viewport coordinates. When provided, the tooltip
   * follows the cursor (preferring above, flipping below when there's no room)
   * instead of centering on the anchor rect. Falls back to rect-centering when
   * null (keyboard focus, touch, or unavailable).
   */
  cursor?: { x: number; y: number } | null
  children: ReactNode
}) {
  const tipRef = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<{ left: number; top: number; ready: boolean }>({
    left: -9999,
    top: -9999,
    ready: false,
  })

  const update = useCallback(() => {
    const el = anchor === 'notes' ? notesRef.current : pillRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const tip = tipRef.current
    const tw = tip?.offsetWidth ?? 240
    const th = tip?.offsetHeight ?? 40
    const vw = window.innerWidth
    const vh = window.innerHeight
    const margin = 8
    const cursorGap = 14 // gap between cursor and tooltip so it doesn't sit under the pointer

    // Vertical: prefer ABOVE the cursor (or pill when no cursor); flip below
    // only if there isn't room up there.
    const refTop = cursor ? cursor.y : r.top
    const refBottom = cursor ? cursor.y : r.bottom
    let top = refTop - cursorGap - th
    if (top < margin) {
      const belowTop = refBottom + cursorGap
      top =
        belowTop + th <= vh - margin
          ? belowTop
          : Math.max(margin, Math.min(vh - margin - th, refTop - cursorGap - th))
    }

    // Horizontal: center on the cursor when we have it; otherwise fall back
    // to centering on the anchor rect. Clamp inside viewport either way.
    const refLeftCenter = cursor ? cursor.x : r.left + r.width / 2
    let left = refLeftCenter - tw / 2
    if (left < margin) left = margin
    if (left + tw > vw - margin) left = Math.max(margin, vw - margin - tw)

    setPos({ left, top, ready: true })
  }, [anchor, cursor, notesRef, pillRef])

  useLayoutEffect(() => {
    if (!open) {
      setPos({ left: -9999, top: -9999, ready: false })
      return
    }
    // Two passes: first before we know the tooltip size, then after layout gives us real dims.
    update()
    const raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [open, update])

  useEffect(() => {
    if (!open) return
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, update])

  // Always render the portal so AnimatePresence can manage entrance/exit.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={tipRef}
          key="cal-tip"
          role="tooltip"
          className="pointer-events-none fixed z-[10000] w-max max-w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-xl border border-[#e4e7ec] bg-[#f8fafc] shadow-[0px_12px_24px_-6px_rgba(10,13,18,0.14),0px_4px_8px_-2px_rgba(10,13,18,0.06)]"
          style={{
            left: pos.left,
            top: pos.top,
            visibility: pos.ready ? 'visible' : 'hidden',
          }}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.97 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/**
 * Reservation hover card — driven by the same Key Insights configuration the
 * user set in the sidebar panel. Reads localStorage visibility settings so
 * whatever fields are toggled on in the sidebar appear here too, in the same
 * order with the same color coding. Zero divergence between hover and click.
 */
function PillHoverCardBody({
  guestName,
  res,
  pillPaymentStatus,
}: {
  guestName: string
  res: ReservationListItem
  pillPaymentStatus?: string | null
}) {
  // Read the user's Key Insights field selection (same storage key as sidebar)
  const visibility = useMemo(() => loadInsightVisibility(), [])
  const visibleKeys = TEMPLATE_INSIGHT_ITEMS.map((i) => i.key).filter((k) => visibility[k])

  // Map ReservationListItem → TemplateKeyInsightValues (exact same shape as sidebar)
  const pay = pillPaymentStatus ?? res.paymentStatus
  const values: TemplateKeyInsightValues = {
    source: res.source,
    reservationStatus: res.status,
    paymentStatus: pay,
    balanceDue: res.balanceDue,
    remainingCharges: res.remainingCharges,
    totalAmount: res.totalAmount,
    doorCode: res.doorCode,
    rentalAgreementStatus: res.rentalAgreementStatus,
    baseRate: res.baseRate,
    pmCommission: res.pmCommission,
  }

  const rows = visibleKeys.map((key) => ({
    key,
    label: TEMPLATE_INSIGHT_ITEMS.find((i) => i.key === key)?.label ?? key,
    value: insightValue(key, values),
    tone: valueTone(key, insightValue(key, values)),
  }))

  return (
    <div className="min-w-[272px]">
      {/* KEY INSIGHTS header — identical to sidebar section header */}
      <div className="flex items-center gap-2 border-b border-[#e4e7ec] px-4 pb-2.5 pt-3">
        <span className="h-[14px] w-px shrink-0 rounded-full bg-[#15b8b0]" aria-hidden />
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#101828]">
          Key insights
        </h4>
      </div>
      {/* Guest name */}
      <div className="border-b border-[#e4e7ec] px-4 py-2.5">
        <p className="truncate text-[13px] font-semibold leading-5 text-[#101828]">{guestName}</p>
      </div>
      {/* Rows — compact layout (label 148px | value flex) matching sidebar compact variant */}
      <div className="space-y-2 px-4 pb-3.5 pt-3">
        {rows.length === 0 ? (
          <p className="text-[12px] text-[#9aa3af]">No fields configured</p>
        ) : (
          rows.map((row) => (
            <div key={row.key} className="flex w-full items-center gap-2">
              <span className="w-[140px] shrink-0 text-[12px] leading-4 text-[#535862]">
                {row.label}
              </span>
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-[13px] font-medium leading-4 text-[#101828]',
                  /^\$[\d,.]/.test((row.value ?? '').trim()) && 'tabular-nums',
                  row.tone ?? '',
                )}
              >
                {row.value || '—'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/** Minimal blocked / notes tooltip — simple text on the same card background. */
function PillSimpleTooltipBody({ lines }: { lines: string[] }) {
  return (
    <div className="min-w-[180px] px-4 py-3">
      {lines.map((line, i) => (
        <p key={i} className={cn('text-[12px] leading-5 text-[#535862]', i === 0 && 'font-semibold text-[#101828]')}>
          {line}
        </p>
      ))}
    </div>
  )
}

const CalendarReservationPillButton = memo(function CalendarReservationPillButton({
  b,
  compact,
  modern,
  clean = false,
  flatGridChrome = false,
  barStyle,
  pillRadius,
  padX,
  gapInner,
  labelClass,
  isSelected,
  canActivate,
  onPillActivate,
  leading,
  tooltipLines,
  notesLines,
  blockedTooltipLines,
  showNotesIcon,
  cleanPillColors,
  res,
  pillPaymentStatus,
  continuesFromPrior = false,
  continuesToNext = false,
  pillLabel,
  pillDetails,
}: {
  b: BookingBlock
  compact: boolean
  barStyle: CSSProperties
  pillRadius: string
  padX: string
  gapInner: string
  labelClass: string
  /** Merged `calendarPillColors` + defaults. */
  cleanPillColors: CalendarPillColorSettings
  /** Modern and clean use flat stacked lanes. */
  modern: boolean
  /** Clean — white / tinted surfaces, listing-style label, 2px radius, left border accent, light shadow. */
  clean: boolean
  /** No pill shadow / selected ring (monthly grid; keeps table uncluttered). */
  flatGridChrome?: boolean
  isSelected: boolean
  canActivate: boolean
  onPillActivate: () => void
  leading: ReactNode
  tooltipLines: string[]
  notesLines: string[]
  /** When set, only this copy is shown on hover (blocked / not available — no reservation tooltip). */
  blockedTooltipLines?: string[] | null
  /** Teal / orange / blue: show notes affordance only when true (~30% in demo). */
  showNotesIcon?: boolean
  /** Full reservation record for the rich hover card (undefined for blocked/owner-stay). */
  res?: ReservationListItem | null
  pillPaymentStatus?: string | null
  /** Whether the booking continues beyond the left / right scroll boundary. */
  continuesFromPrior?: boolean
  continuesToNext?: boolean
  /** Overrides b.label for the pill text — used to append stay dates / guest count. */
  pillLabel?: string
  /** Pill detail settings — controls payment indicator dot visibility. */
  pillDetails: CalendarPillDetails
}) {
  const pillRef = useRef<HTMLButtonElement>(null)
  const notesRef = useRef<HTMLSpanElement>(null)
  const resTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [tip, setTip] = useState<'none' | 'res' | 'notes'>('none')
  /**
   * Last cursor position while hovering the pill. The tooltip anchors to this
   * point so it always appears above the mouse pointer (Alex's feedback).
   */
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)

  const notesIconSize = compact ? 12 : 14
  const blockedOnly = Boolean(blockedTooltipLines && blockedTooltipLines.length > 0)
  const primaryTooltipLines = blockedOnly ? blockedTooltipLines! : tooltipLines
  const showNotesUi = !blockedOnly && showNotesIcon === true

  const clearResTimer = useCallback(() => {
    if (resTimerRef.current) {
      clearTimeout(resTimerRef.current)
      resTimerRef.current = null
    }
  }, [])
  const clearNotesTimer = useCallback(() => {
    if (notesTimerRef.current) {
      clearTimeout(notesTimerRef.current)
      notesTimerRef.current = null
    }
  }, [])

  const scheduleResTip = useCallback(() => {
    clearResTimer()
    clearNotesTimer()
    resTimerRef.current = setTimeout(() => setTip('res'), CALENDAR_PILL_TOOLTIP_DELAY_MS)
  }, [clearNotesTimer, clearResTimer])

  const scheduleNotesTip = useCallback(() => {
    clearResTimer()
    clearNotesTimer()
    notesTimerRef.current = setTimeout(() => setTip('notes'), CALENDAR_PILL_TOOLTIP_DELAY_MS)
  }, [clearNotesTimer, clearResTimer])

  const clearTip = useCallback(() => {
    clearResTimer()
    clearNotesTimer()
    setTip('none')
  }, [clearNotesTimer, clearResTimer])

  useEffect(() => () => {
    clearResTimer()
    clearNotesTimer()
  }, [clearNotesTimer, clearResTimer])

  const lightTheme = useMemo(
    () => getLightWashPillTheming(b, cleanPillColors, isSelected, clean, flatGridChrome, pillDetails.paymentIndicator),
    [b, clean, cleanPillColors, isSelected, flatGridChrome, pillDetails.paymentIndicator],
  )

  return (
    <>
      {/* Rich reservation hover card — structured data on white; simple fallback for blocked/owner pills */}
      <CalendarPillFloatingTooltip
        open={tip === 'res'}
        anchor="pill"
        pillRef={pillRef}
        notesRef={notesRef}
        cursor={cursor}
      >
        {res && !blockedOnly ? (
          <PillHoverCardBody
            guestName={b.label}
            res={res}
            pillPaymentStatus={pillPaymentStatus}
          />
        ) : (
          <PillSimpleTooltipBody lines={primaryTooltipLines} />
        )}
      </CalendarPillFloatingTooltip>
      {showNotesUi ? (
        <CalendarPillFloatingTooltip
          open={tip === 'notes'}
          anchor="notes"
          pillRef={pillRef}
          notesRef={notesRef}
          cursor={cursor}
        >
          <PillSimpleTooltipBody lines={notesLines} />
        </CalendarPillFloatingTooltip>
      ) : null}
      <button
        ref={pillRef}
        type="button"
        data-calendar-booking={b.reservationId}
        aria-pressed={canActivate ? isSelected : undefined}
        aria-disabled={!canActivate}
        tabIndex={canActivate ? 0 : -1}
        className={cn(
          'absolute flex min-w-0 items-center gap-2 overflow-visible text-left font-normal text-inherit',
          lightTheme.className,
          compact ? 'min-h-[20px] py-0' : modern ? 'min-h-0 py-0' : 'min-h-9',
          pillRadius,
          padX,
          canActivate ? 'cursor-pointer' : 'cursor-default',
        )}
        style={{ ...barStyle, ...lightTheme.style }}
        aria-label={
          blockedOnly
            ? `${b.label}. ${b.hostNotes ?? 'Host notes'}. ${isSelected ? 'Close' : 'Open'} details.`
            : canActivate
              ? `${isSelected ? 'Close' : 'Open'} reservation ${b.label}`
              : `Reservation ${b.label}`
        }
        onMouseEnter={(e) => {
          setCursor({ x: e.clientX, y: e.clientY })
          scheduleResTip()
        }}
        onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => {
          setCursor(null)
          clearTip()
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (canActivate) onPillActivate()
        }}
      >
        {/* Continuation fades — show when reservation extends beyond visible scroll area */}
        {continuesFromPrior && (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 top-0 z-[30] w-6 rounded-l-[inherit]"
            style={{
              background: `linear-gradient(to right, ${lightTheme.fill}ee, ${lightTheme.fill}00)`,
            }}
          >
            <svg viewBox="0 0 6 10" width={5} height={10} className="absolute left-0.5 top-1/2 -translate-y-1/2 opacity-70" fill="none">
              <path d="M5 1L1 5l4 4" stroke={lightTheme.labelColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        )}
        {continuesToNext && (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-0 top-0 z-[30] w-6 rounded-r-[inherit]"
            style={{
              background: `linear-gradient(to left, ${lightTheme.fill}ee, ${lightTheme.fill}00)`,
            }}
          >
            <svg viewBox="0 0 6 10" width={5} height={10} className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-70" fill="none">
              <path d="M1 1l4 4-4 4" stroke={lightTheme.labelColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        )}
        {compact ? (
          <>
            <div
              className={cn('relative z-[1] flex min-w-0 flex-1 items-center overflow-visible', gapInner)}
              onMouseEnter={scheduleResTip}
            >
              {b.variant === 'gray' ? (
                /* Blocked pill — lock icon */
                <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center">
                  <Lock03
                    width={12}
                    height={12}
                    className="opacity-95"
                    style={{ color: lightTheme.labelColor }}
                    aria-hidden
                  />
                </span>
              ) : (
                <>
                  {/* Payment indicator dot — always FIRST before any images */}
                  {pillDetails.paymentIndicator && (
                    <PaymentStatusDotCompact
                      paymentStatus={demoPaymentStatusForBookingBlock(b.start, b.reservationId)}
                      rawPill={{
                        fill: lightTheme.fill,
                        unpaid: lightTheme.paymentRaw.unpaid,
                        partial: lightTheme.paymentRaw.partial,
                      }}
                    />
                  )}
                  {/* Photo / channel avatar (if any) after the dot */}
                  {leading}
                </>
              )}
              <span className={labelClass} style={{ color: lightTheme.labelColor }}>
                {pillLabel ?? b.label}
              </span>
            </div>
            {showNotesUi ? (
              <span
                ref={notesRef}
                className="relative z-[20] shrink-0"
                onMouseEnter={scheduleNotesTip}
              >
                <File02
                  width={notesIconSize}
                  height={notesIconSize}
                  className="opacity-95"
                  style={{ color: lightTheme.noteColor }}
                  aria-hidden
                />
              </span>
            ) : null}
          </>
        ) : (
          <>
            <div
              className={cn('relative z-[1] flex min-w-0 flex-1 items-center overflow-visible', gapInner)}
              onMouseEnter={scheduleResTip}
            >
              {/* Standard / Full: payment dot FIRST (only for non-Full styles — Full uses 3px border) */}
              {!clean && pillDetails.paymentIndicator && b.variant !== 'gray' && (
                <PaymentStatusDotCompact
                  paymentStatus={demoPaymentStatusForBookingBlock(b.start, b.reservationId)}
                  rawPill={{
                    fill: lightTheme.fill,
                    unpaid: lightTheme.paymentRaw.unpaid,
                    partial: lightTheme.paymentRaw.partial,
                  }}
                />
              )}
              {leading}
              <span className={labelClass} style={{ color: lightTheme.labelColor }}>
                {pillLabel ?? b.label}
              </span>
            </div>
            {showNotesUi ? (
              <span
                ref={notesRef}
                className="relative z-[20] shrink-0"
                onMouseEnter={scheduleNotesTip}
              >
                <MessageDotsCircle
                  width={notesIconSize}
                  height={notesIconSize}
                  className="opacity-95"
                  style={{ color: lightTheme.noteColor }}
                  aria-hidden
                />
              </span>
            ) : null}
          </>
        )}
      </button>
    </>
  )
})

/** Greedy lane stacking for half-open day ranges [startIdx, endExclusive). */
function assignBookingLanes(
  items: { key: string; startIdx: number; endExclusive: number }[]
): Map<string, number> {
  const sorted = [...items].sort((a, b) => a.startIdx - b.startIdx || a.endExclusive - b.endExclusive)
  const laneEndDay: number[] = []
  const laneByKey = new Map<string, number>()
  for (const it of sorted) {
    let L = 0
    while (laneEndDay[L] !== undefined && laneEndDay[L] > it.startIdx) {
      L++
    }
    laneEndDay[L] = it.endExclusive
    laneByKey.set(it.key, L)
  }
  return laneByKey
}

function minRowHeightForBarStack(maxLane: number, maxPillH: number): number {
  if (maxLane < 0) return 0
  return BAR_PILL_PAD_Y * 2 + (maxLane + 1) * maxPillH + maxLane * PILL_STACK_GAP_PX
}

/** Modern pills fill the row height; this is the minimum row height so lanes stay readable. */
function minRowHeightForModernStack(maxLane: number): number {
  if (maxLane < 0) return 0
  const lanes = maxLane + 1
  return (
    MODERN_CELL_PILL_PAD_Y * 2 +
    lanes * MODERN_MIN_LANE_HEIGHT +
    maxLane * PILL_STACK_GAP_PX
  )
}

/** Reservation pill layout — Figma Calendar-Redesign-2026 (275:46330). */
export type ReservationPillStyle = 'standard' | 'compact' | 'clean'

function isModernLayoutPillStyle(s: ReservationPillStyle): boolean {
  return s === 'clean'
}

function bookingPillRadius(
  style: ReservationPillStyle,
  continuesFromPrior: boolean | undefined,
  continuesToNext: boolean | undefined
): string {
  if (style === 'clean') {
    return cn(
      'rounded-none',
      continuesFromPrior && 'rounded-l-none',
      continuesToNext && 'rounded-r-none',
    )
  }
  const base = style === 'compact' ? 'rounded-full' : 'rounded-[40px]'
  return cn(
    base,
    continuesFromPrior && 'rounded-l-none',
    continuesToNext && 'rounded-r-none',
  )
}

/** Which elements appear inside each reservation pill. */
type CalendarPillDetails = {
  /** Show the guest's avatar circle (24px). */
  guestPhoto: boolean
  /** Show the booking channel's logo (20px) in front of the guest name. */
  channelAvatar: boolean
  /** Append stay dates to the guest name, e.g. "Emily Johnson / May 1 – May 12". */
  stayDates: boolean
  /** Append guest count to the label, e.g. "Emily Johnson / 3 guests". */
  guestCount: boolean
  /**
   * Show a red/amber dot (standard/compact) or 3px left border (Full)
   * when a reservation is Unpaid or Partially paid.
   */
  paymentIndicator: boolean
}

/** Visibility matches Calendar settings sidebar (Figma 122:18203). */
type CalendarSettingsVisibility = {
  listingImage: boolean
  listingId: boolean
  cleaningStatus: boolean
  nightlyRate: boolean
  minimumNights: boolean
  guestsCantCheckIn: boolean
  guestsCantCheckOut: boolean
  ruleSets: boolean
  reservations: boolean
  /** Calendar items — tasks (Figma); when on, bookings with tasks use compact pills */
  tasks: boolean
  /**
   * Calendar items — host-authored notes attached to a specific listing + day
   * (image 3 brief). Notes render as a short pill pinned to the BOTTOM of the
   * day cell so they can coexist with a reservation/owner-stay/blocked pill in
   * the same cell without overlap (image 3/4 brief).
   */
  calendarNotes: boolean
  reservationPillStyle: ReservationPillStyle
  /** Per-item hex colors for reservation pills (all styles); merged with defaults. */
  calendarPillColors?: CalendarPillColorPatch
  inquiries: boolean
  ownerStays: boolean
  blockedDays: boolean
  /** Which elements appear inside each reservation pill. */
  pillDetails: CalendarPillDetails
}

const DEFAULT_CALENDAR_SETTINGS: CalendarSettingsVisibility = {
  listingImage: false,
  listingId: false,
  cleaningStatus: false,
  nightlyRate: true,
  minimumNights: true,
  guestsCantCheckIn: false,
  guestsCantCheckOut: false,
  ruleSets: false,
  reservations: true,
  tasks: false,
  calendarNotes: false,
  reservationPillStyle: 'standard',
  inquiries: false,
  ownerStays: true,
  blockedDays: true,
  pillDetails: {
    guestPhoto: false,
    channelAvatar: true,
    stayDates: true,
    guestCount: true,
    paymentIndicator: true,
  },
}

function cellMeta(
  listingId: string,
  date: Date
): { price: string; minNights: number; checkInBlocked: boolean; checkOutBlocked: boolean } {
  const seed = listingId.charCodeAt(1) + date.getDate() * 3
  return {
    price: `$${90 + (seed % 40)}`,
    minNights: 1 + (seed % 5),
    checkInBlocked: seed % 11 === 0,
    checkOutBlocked: seed % 13 === 0,
  }
}

/** Space between stacked items in a day cell (nightly rate, min nights, …). */
const CELL_CONTENT_GAP = 6
/** One line of cell text (11px / leading-4). */
const CELL_LINE_H = 16
/** Min 6px top + 6px bottom for listing + calendar detail blocks (multi view). */
const CAL_LISTING_V_PAD = 6
const CAL_ITEM_LAYER_V_PAD = 6

/** Compact pills + no listing/calendar chrome — shortest row (36px) to fit more listings. */
function calendarMinimalDenseRow(v: CalendarSettingsVisibility): boolean {
  return (
    v.reservationPillStyle === 'compact' &&
    !v.listingImage &&
    !v.listingId &&
    !v.cleaningStatus &&
    !v.nightlyRate &&
    !v.minimumNights &&
    !v.guestsCantCheckIn &&
    !v.guestsCantCheckOut &&
    !v.ruleSets
  )
}

/**
 * Minimum listing-column row height: min 6px + 6px vertical padding around
 * listing content; content is centered vertically in the cell.
 */
function listingColumnMinHeight(v: CalendarSettingsVisibility): number {
  const pad = CAL_LISTING_V_PAD * 2  // 12px
  const titleH = 20
  // Dense compact rows: same height as normal compact (padding + title line).
  // Previously returned 36 which was paradoxically taller than the non-dense
  // compact case (also 32). Using pad + titleH = 32 makes the two match.
  if (calendarMinimalDenseRow(v)) return pad + titleH
  if (v.listingImage) {
    return pad + Math.max(48, titleH)
  }
  return pad + titleH
}

/**
 * **Calendar details** (layer 1) height: nightly, min nights, lock, with 6+6px outer
 * padding and 6px between lines. Returns 0 when no details are visible.
 * `withRestrictionLine` reserves a lock line when the row can show a restriction in any day.
 */
function dayCellTopMetadataHeight(v: CalendarSettingsVisibility, withRestrictionLine: boolean): number {
  if (calendarMinimalDenseRow(v)) return 0
  let lines = 0
  const lockSlot =
    withRestrictionLine && (v.guestsCantCheckIn || v.guestsCantCheckOut)
  if (lockSlot) lines++
  if (v.nightlyRate) lines++
  if (v.minimumNights) lines++
  if (lines === 0) {
    return 0
  }
  const innerH = lines * CELL_LINE_H + (lines - 1) * CELL_CONTENT_GAP
  return 2 * CAL_LISTING_V_PAD + innerH
}

function listingRowHasRestriction(
  listingId: string,
  dayDates: { date: Date }[],
  v: CalendarSettingsVisibility,
  overrides: Record<string, CalendarCellOverride>
): boolean {
  if (!v.guestsCantCheckIn && !v.guestsCantCheckOut) return false
  return dayDates.some((d) => {
    const meta = mergeCellMeta(listingId, d.date, overrides)
    return (
      (v.guestsCantCheckIn && meta.checkInBlocked) ||
      (v.guestsCantCheckOut && meta.checkOutBlocked)
    )
  })
}

function bookingPassesFilters(b: BookingBlock, v: CalendarSettingsVisibility): boolean {
  if (b.variant === 'teal') return v.reservations
  if (b.variant === 'orange') return v.inquiries
  if (b.variant === 'blue') return v.ownerStays
  if (b.variant === 'gray') return v.blockedDays
  return true
}

function SettingsToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#f2f4f7] py-2.5 last:border-b-0">
      <span className="text-sm leading-5 text-[#414651]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15b8b0] focus-visible:ring-offset-2',
          checked ? 'bg-[#344054]' : 'bg-[#e9eaeb]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all duration-200',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}

/**
 * Closed chip + popover swatch picker. Clicking the chip opens a small panel
 * that shows two rows (Light / Dark) of recommended hues. Text color on the
 * pill auto-inverts via `bestTextOnBackground`, so the user only ever picks a
 * background hue; no hex input, no wheel.
 */
/**
 * Portal-rendered color picker popover. Rendering in a portal means the popover
 * is never clipped by the settings side-panel `overflow-hidden` — it floats in
 * the viewport and flips position based on available space. Swatches are sized
 * to ~checkbox (16px) so the whole picker stays compact and the two columns
 * (Light / Dark) sit cleanly side-by-side without overlap.
 */
function CalendarPillColorPickerRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (hex: string) => void
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const current = toHex6(value)

  const POPOVER_W = 296
  const POPOVER_H_APPROX = 160

  /** Compute viewport-aware fixed position so the popover never clips. */
  const reposition = useCallback(() => {
    const btn = triggerRef.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const gap = 8
    const vw = window.innerWidth
    const vh = window.innerHeight
    // Prefer below the trigger; flip above if there isn't room.
    const spaceBelow = vh - r.bottom
    const top =
      spaceBelow >= POPOVER_H_APPROX + gap
        ? r.bottom + gap
        : Math.max(gap, r.top - POPOVER_H_APPROX - gap)
    // Horizontally anchor to the trigger's left edge, clamped to the viewport.
    let left = r.left
    if (left + POPOVER_W + gap > vw) left = vw - POPOVER_W - gap
    if (left < gap) left = gap
    setPos({ top, left })
  }, [])

  useEffect(() => {
    if (!open) return
    reposition()
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node | null
      if (!t) return
      if (triggerRef.current?.contains(t)) return
      if (popoverRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onScrollOrResize = () => reposition()
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [open, reposition])

  return (
    <div className="flex min-w-0 max-w-full flex-1 items-center gap-2 sm:max-w-[200px]">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Change ${label} color`}
        title={`Change ${label} color`}
        className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border border-[#181d27]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15b8b0] focus-visible:ring-offset-1"
        style={{ backgroundColor: current }}
        onClick={() => setOpen((o) => !o)}
      />
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-label={`${label} color options`}
              className="fixed z-[100] rounded-lg border border-[#e9eaeb] bg-white p-3 shadow-[0px_12px_16px_-4px_rgba(10,13,18,0.08),0px_4px_6px_-2px_rgba(10,13,18,0.03)]"
              style={{ top: pos.top, left: pos.left, width: POPOVER_W }}
            >
              <div className="mb-2 grid grid-cols-2 gap-x-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#717680]">Light</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#717680]">Dark</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3">
                {/* Light swatches — 6 per row */}
                <div className="grid grid-cols-6 gap-1">
                  {CALENDAR_PILL_SWATCH_FAMILIES.map((f) => {
                    const selected = current.toLowerCase() === f.light.toLowerCase()
                    return (
                      <button
                        key={`light-${f.name}`}
                        type="button"
                        aria-label={`${f.name} (light)`}
                        title={`${f.name} (light)`}
                        onClick={() => {
                          onChange(f.light)
                          setOpen(false)
                        }}
                        className={cn(
                          'relative flex size-[18px] items-center justify-center rounded border transition-all hover:scale-110 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15b8b0] focus-visible:ring-offset-1',
                          selected
                            ? 'border-[#181d27] ring-1 ring-[#181d27]/80 scale-105'
                            : 'border-[#e9eaeb] hover:border-[#181d27]/30',
                        )}
                        style={{ backgroundColor: f.light }}
                      >
                        {selected ? (
                          <svg viewBox="0 0 16 16" className="pointer-events-none size-2.5" aria-hidden>
                            <path
                              d="M3.5 8.5l2.8 2.8 6.2-6.2"
                              fill="none"
                              stroke={bestTextOnBackground(f.light)}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
                {/* Dark swatches — 6 per row */}
                <div className="grid grid-cols-6 gap-1">
                  {CALENDAR_PILL_SWATCH_FAMILIES.map((f) => {
                    const selected = current.toLowerCase() === f.dark.toLowerCase()
                    return (
                      <button
                        key={`dark-${f.name}`}
                        type="button"
                        aria-label={`${f.name} (dark)`}
                        title={`${f.name} (dark)`}
                        onClick={() => {
                          onChange(f.dark)
                          setOpen(false)
                        }}
                        className={cn(
                          'relative flex size-[18px] items-center justify-center rounded border transition-all hover:scale-110 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15b8b0] focus-visible:ring-offset-1',
                          selected
                            ? 'border-white ring-1 ring-[#181d27]/80 scale-105'
                            : 'border-[#181d27]/20 hover:border-[#181d27]/40',
                        )}
                        style={{ backgroundColor: f.dark }}
                      >
                        {selected ? (
                          <svg viewBox="0 0 16 16" className="pointer-events-none size-2.5" aria-hidden>
                            <path
                              d="M3.5 8.5l2.8 2.8 6.2-6.2"
                              fill="none"
                              stroke={bestTextOnBackground(f.dark)}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

/** Small inline tooltip that appears above the cursor on hover — used for cell metadata labels. */
function CellValueTooltip({ label, tip }: { label: ReactNode; tip: string }) {
  return (
    <span className="group/celltip relative inline-flex items-center">
      {label}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-[60] mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-[#101828] px-1.5 py-0.5 text-[10px] font-medium leading-4 text-white opacity-0 shadow-md transition-opacity duration-150 group-hover/celltip:opacity-100"
        role="tooltip"
      >
        {tip}
      </span>
    </span>
  )
}

/** Figma 310:8268 — 168px section title (text-tertiary) + 8px-gap checkbox column. */
function CalendarSettingsSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex w-full min-w-0 items-start gap-4">
      <p className="w-[168px] shrink-0 text-sm font-normal leading-5 text-[#535862]">{title}</p>
      <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
    </div>
  )
}

function CalendarSettingsCheckRow({
  label,
  checked,
  onChange,
  labelMuted = false,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
  labelMuted?: boolean
}) {
  return (
    <label className="flex min-h-5 cursor-pointer items-start gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border border-[#d5d7da] text-[#181d27] accent-[#181d27] focus:outline-none focus:ring-2 focus:ring-[#15b8b0] focus:ring-offset-0"
      />
      <span
        className={cn('min-w-0 text-sm font-normal leading-5', labelMuted ? 'text-[#535862]' : 'text-[#414651]')}
      >
        {label}
      </span>
    </label>
  )
}

/** New pill spanning the full selected check-in → check-out range (checkout day exclusive). */
function fullSpanReservationBooking(
  listingId: string,
  checkInInclusive: Date,
  checkOutInclusive: Date,
  variant: 'teal' | 'blue',
  reservationSamples: ReservationListItem[]
): BookingBlock | null {
  if (reservationSamples.length === 0) return null
  const rangeStart = startOfDay(checkInInclusive)
  const rangeEndExclusive = addDays(startOfDay(checkOutInclusive), 1)
  if (rangeEndExclusive.getTime() <= rangeStart.getTime()) return null
  const res = reservationSamples[Math.floor(Math.random() * reservationSamples.length)]
  const label = variant === 'blue' ? 'Owner stay' : res.guestName
  const channelId = variant === 'blue' ? undefined : Math.random() < 0.55 ? 'airbnb' : 'booking'
  return {
    listingId,
    start: rangeStart,
    end: rangeEndExclusive,
    label,
    variant,
    reservationId: `cal-new-${Date.now()}`,
    channelId,
    showDoc: variant === 'teal' && Math.random() > 0.65,
    taskCount: 0,
    showNotesIcon: Math.random() < 0.3,
  }
}

type CalendarDayHeaderModel = {
  date: Date
  dow: string
  isFocus: boolean
}

/** One day cell in the multi / weekly top strip — same chrome as the Figma reference (past / hover / focus). */
const CalendarDateHeaderCell = memo(function CalendarDateHeaderCell({
  date,
  dayLabel,
  isFocus,
  isHovered,
  widthClassName,
  onPointerEnter,
}: {
  date: Date
  dayLabel: string
  isFocus: boolean
  isHovered: boolean
  widthClassName: string
  onPointerEnter: () => void
}) {
  const isPastCol = isDayBeforeToday(date)
  return (
    <div
      role="presentation"
      onPointerEnter={onPointerEnter}
      className={cn(
        'box-border flex h-12 min-h-12 items-center justify-center border-b border-r border-[#e9eaeb] p-2',
        widthClassName,
        isPastCol ? 'bg-[#f2f4f7]' : 'bg-white',
        isHovered &&
          (isPastCol
            ? 'bg-[#e0ebe7] shadow-[inset_0_0_0_1px_rgba(21,184,176,0.28)]'
            : 'bg-[#f0fdf9] shadow-[inset_0_0_0_1px_rgba(21,184,176,0.28)]'),
      )}
    >
      {isFocus ? (
        <div className="flex h-10 w-auto min-w-[46px] max-w-full flex-col items-center justify-center gap-0 rounded-lg bg-[#f0fdf9] px-1.5 py-1 text-center">
          <span className="text-[8px] font-bold leading-none tracking-wider text-[#107569] uppercase opacity-80">Today</span>
          <span className="text-[11px] font-semibold leading-none text-[#107569] mt-0.5">{dayLabel}</span>
          <span className="text-[13px] font-bold leading-none tabular-nums text-[#107569]">{date.getDate()}</span>
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-0 text-center text-xs font-medium leading-3',
            TEXT_SECONDARY,
          )}
        >
          <span className="whitespace-nowrap">{dayLabel}</span>
          <span className="tabular-nums">{date.getDate()}</span>
        </div>
      )}
    </div>
  )
})

/** Isolated from CalendarPage so typing in search / other state does not re-render 40 day cells. */
const CalendarDateHeaderStrip = memo(function CalendarDateHeaderStrip({
  days,
  gridWidth,
  hoveredColumnIndex,
  onColumnPointerEnter,
}: {
  days: CalendarDayHeaderModel[]
  gridWidth: number
  hoveredColumnIndex: number | null
  onColumnPointerEnter: (index: number) => void
}) {
  return (
    <div className="flex h-12 min-h-12 shrink-0 items-stretch" style={{ width: gridWidth }}>
      {days.map((d, i) => (
        <CalendarDateHeaderCell
          key={d.date.getTime()}
          date={d.date}
          dayLabel={d.dow}
          isFocus={d.isFocus}
          isHovered={hoveredColumnIndex === i}
          widthClassName="w-[73px] min-w-[73px] shrink-0"
          onPointerEnter={() => onColumnPointerEnter(i)}
        />
      ))}
    </div>
  )
})

type CalendarLaneItem = {
  b: BookingBlock
  range: {
    startIdx: number
    endExclusive: number
    left: number
    width: number
    continuesFromPrior: boolean
    continuesToNext: boolean
  }
  key: string
  lane: number
}

function buildWeekLaneItems(
  rowBookings: BookingBlock[],
  weekStart: Date,
  visibility: CalendarSettingsVisibility,
  dayColumnWidthPx: number = DAY_COL_PX,
  monthClip: Date | null = null
): { maxLane: number; items: CalendarLaneItem[] } {
  const placed: Array<{ b: BookingBlock; range: CalendarLaneItem['range']; key: string }> = []
  for (const b of rowBookings) {
    if (!bookingPassesFilters(b, visibility)) continue
    const range = monthClip
      ? bookingDayRangeForMonthWeek(b, weekStart, monthClip, dayColumnWidthPx)
      : bookingDayRange(b, weekStart, 7, dayColumnWidthPx)
    if (!range || range.width < 24) continue
    placed.push({
      b,
      range,
      key: `${b.listingId}-${b.label}-${b.start.toISOString()}`,
    })
  }
  if (placed.length === 0) {
    return { maxLane: -1, items: [] }
  }
  placed.sort(
    (a, x) =>
      a.range.startIdx - x.range.startIdx || a.range.endExclusive - x.range.endExclusive
  )
  const laneByKey = assignBookingLanes(
    placed.map((p) => ({
      key: p.key,
      startIdx: p.range.startIdx,
      endExclusive: p.range.endExclusive,
    }))
  )
  const maxLane = Math.max(...placed.map((p) => laneByKey.get(p.key) ?? 0))
  const items: CalendarLaneItem[] = placed.map((p) => ({
    ...p,
    lane: laneByKey.get(p.key) ?? 0,
  }))
  return { maxLane, items }
}

type CalendarDayRowModel = {
  date: Date
  dow: string
  isFocus: boolean
}

/**
 * Builds the leading icon(s) for a reservation pill based on `pillDetails` settings.
 *
 * Order (left→right): channel avatar (20px) → guest photo (24px).
 * Blocked / owner-stay variants always show their fixed icons regardless of pillDetails.
 */
function calendarPillLeadingIcon(
  b: BookingBlock,
  res: ReservationListItem | undefined,
  pillDetails: CalendarPillDetails,
  compact = false,
) {
  // Blocked days — always show lock icon
  if (b.isUserBlocked || b.variant === 'gray') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/20 ring-[0.5px] ring-inset ring-white/30">
        <Lock03 width={14} height={14} className="text-white" aria-hidden />
      </span>
    )
  }

  // Owner stay — show owner avatar only when guestPhoto is enabled AND not compact
  if (b.variant === 'blue') {
    if (!pillDetails.guestPhoto || compact) return null
    return (
      <span className="relative z-20 block h-6 w-6 shrink-0 overflow-hidden rounded-full ring-[0.5px] ring-inset ring-white/30">
        <img
          src={ownerStayAvatarUrl(b.reservationId, b.listingId, RESERVATION_AVATAR_SRC_TABLE)}
          alt=""
          width={PILL_PHOTO_PX}
          height={PILL_PHOTO_PX}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </span>
    )
  }

  // Reservations / inquiries — controlled by pillDetails
  // Compact style never shows images — keep pills dense.
  if (b.variant === 'teal' || b.variant === 'orange') {
    if (compact) return null
    const showChannel = pillDetails.channelAvatar && Boolean(b.channelId)
    const showPhoto = pillDetails.guestPhoto && Boolean(res)
    if (!showChannel && !showPhoto) return null

    // Both compact and standard use 24px avatars
    const photoSize = 24
    const photoClass = 'block h-6 w-6 overflow-hidden rounded-full ring-[0.5px] ring-inset ring-white/30'

    return (
      <span className="relative z-20 flex shrink-0 items-center gap-1">
        {/* Channel avatar — 24px circle, fills fully */}
        {showChannel && (
          <span className="flex h-6 w-6 shrink-0 overflow-hidden rounded-full ring-[0.5px] ring-inset ring-white/30">
            <ChannelIcon channelId={b.channelId!} size={24} />
          </span>
        )}
        {/* Guest photo — same 24px, no payment dot overlay */}
        {showPhoto && (
          <span className={photoClass}>
            <img
              src={reservationGuestAvatarUrl(res!.id, RESERVATION_AVATAR_SRC_TABLE)}
              alt=""
              width={photoSize}
              height={photoSize}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </span>
        )}
      </span>
    )
  }

  return null
}

/** Format a Date as a short month+day string, e.g. "May 1". */
function formatShortMonthDay(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Builds the text label for a reservation pill, optionally appending stay dates
 * and/or guest count based on `pillDetails` settings.
 *
 * e.g. "Emily Johnson / May 1 – May 12 / 5 guests"
 */
function buildPillLabel(
  b: BookingBlock,
  res: ReservationListItem | undefined,
  pillDetails: CalendarPillDetails,
): string {
  // For blocked / owner-stay pills we don't append extra info
  if (b.variant === 'gray' || b.variant === 'blue') return b.label

  const parts: string[] = [b.label]

  if (pillDetails.stayDates) {
    // b.end is the exclusive checkout date; display as check-in → checkout
    const startStr = formatShortMonthDay(b.start)
    const endStr = formatShortMonthDay(b.end)
    parts.push(`${startStr} – ${endStr}`)
  }

  if (pillDetails.guestCount && res) {
    parts.push(`${res.guests} guest${res.guests !== 1 ? 's' : ''}`)
  }

  return parts.join(' / ')
}

/** One week row (Sun–Sat) for monthly listing calendar — same pill geometry as multi view. */
const CalendarMonthWeekRow = memo(function CalendarMonthWeekRow({
  weekStart,
  monthStart,
  listing,
  rowBookings,
  visibility,
  cellOverrides,
  denseMinimalRow,
  checkInDate,
  checkOutDate,
  selectedListingId,
  isDayInManageRange,
  onDayCellClick,
  previewReservationId,
  blockedPanelReservationId,
  onBookingPillActivate,
  reservationIdSet,
  reservationById,
  focusDay,
  cleanPillColors,
  /** Floor height (px) from multi view `effectiveRowHeights` for this listing — keeps week rows stable when switching views. */
  listingRowTargetHeight,
  calendarNoteItems = [],
  calendarTaskItems = [],
}: {
  weekStart: Date
  monthStart: Date
  listing: CalendarListing
  rowBookings: BookingBlock[]
  visibility: CalendarSettingsVisibility
  cleanPillColors: CalendarPillColorSettings
  listingRowTargetHeight: number
  cellOverrides: Record<string, CalendarCellOverride>
  denseMinimalRow: boolean
  checkInDate: Date | null
  checkOutDate: Date | null
  selectedListingId: string | null
  isDayInManageRange: (date: Date) => boolean
  onDayCellClick: (listingId: string, cellDate: Date) => void
  previewReservationId: string | null
  blockedPanelReservationId: string | null
  onBookingPillActivate: (b: BookingBlock) => void
  reservationIdSet: Set<string>
  reservationById: Map<string, ReservationListItem>
  focusDay: Date
  calendarNoteItems?: CalendarNoteItem[]
  calendarTaskItems?: CalendarTaskItem[]
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [dayColW, setDayColW] = useState(DAY_COL_PX)

  useLayoutEffect(() => {
    const el = rowRef.current
    if (!el) return
    const measure = () => {
      const w = el.getBoundingClientRect().width
      if (w <= 0) return
      setDayColW(Math.max(48, w / 7))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )
  const { maxLane, items: laneItems } = useMemo(
    () => buildWeekLaneItems(rowBookings, weekStart, visibility, dayColW, monthStart),
    [rowBookings, weekStart, visibility, dayColW, monthStart]
  )
  const hasRestriction = listingRowHasRestriction(
    listing.id,
    weekDays.map((date) => ({ date })),
    visibility,
    cellOverrides
  )
  const baseMin = Math.max(
    listingColumnMinHeight(visibility),
    dayCellTopMetadataHeight(visibility, hasRestriction),
  )
  const isCleanPill = visibility.reservationPillStyle === 'clean'
  // Reserve bottom strip for notes/tasks — same constant as multi view so heights stay in sync.
  const dStrip = bottomStripReserveForVisibility(visibility)
  const weekBaseRowHeight = useMemo(() => {
    if (maxLane < 0) return Math.max(MONTHLY_DAY_CELL_MIN_H, baseMin) + dStrip
    const stackMin = isCleanPill
      ? minRowHeightForMonthlyCleanStack(maxLane)
      : minRowHeightForBarStack(maxLane, pillHeightForCalendarSettings(visibility))
    return Math.max(MONTHLY_DAY_CELL_MIN_H, baseMin, stackMin) + dStrip
  }, [maxLane, visibility, baseMin, isCleanPill, dStrip])

  const hasPillLane = laneItems.length > 0
  const rowLayoutHeight = useMemo(
    () =>
      Math.max(
        weekBaseRowHeight,
        listingRowTargetHeight - (hasPillLane && !isCleanPill ? MONTHLY_PILL_TOP_OFFSET : 0),
      ),
    [weekBaseRowHeight, listingRowTargetHeight, hasPillLane, isCleanPill],
  )

  const maxL = laneItems.length === 0 ? -1 : Math.max(...laneItems.map((i) => i.lane))
  const isModern = isModernLayoutPillStyle(visibility.reservationPillStyle)
  // Available height for pills = full row minus the reserved notes/tasks strip at bottom.
  const pillAreaH = rowLayoutHeight - dStrip
  const heightForLane =
    isCleanPill && maxL >= 0
      ? (_lane: number) => {
          const innerH = pillAreaH - MODERN_CELL_PILL_PAD_Y * 2
          const lanes = maxL + 1
          return Math.min(
            MONTHLY_CLEAN_PILL_MAX_H,
            (innerH - maxL * PILL_STACK_GAP_PX) / lanes,
          )
        }
      : (_lane: number) => pillHeightForCalendarSettings(visibility)
  let stackH = 0
  if (maxL >= 0) {
    for (let lane = 0; lane <= maxL; lane++) {
      stackH += heightForLane(lane)
      if (lane < maxL) stackH += PILL_STACK_GAP_PX
    }
  }
  const stackTop =
    isModern && maxL >= 0
      ? MODERN_CELL_PILL_PAD_Y
      : Math.max(BAR_PILL_PAD_Y, maxL < 0 ? 0 : (pillAreaH - stackH) / 2)
  const topForLane = (lane: number) => {
    let t = stackTop
    for (let L = 0; L < lane; L++) {
      t += heightForLane(L) + PILL_STACK_GAP_PX
    }
    return t
  }

  const bottomForMonthCleanLane = (lane: number) => {
    let b = MONTHLY_PILL_BOTTOM_GAP + dStrip
    for (let L = maxL; L > lane; L--) {
      b += heightForLane(L)
      if (L - 1 >= lane) b += PILL_STACK_GAP_PX
    }
    return b
  }

  const focusColumnIndex = weekDays.findIndex((d) => isSameDay(d, focusDay))
  const showFocusLine = focusColumnIndex >= 0

  const containerMinH = hasPillLane
    ? isCleanPill
      ? rowLayoutHeight
      : rowLayoutHeight + MONTHLY_PILL_TOP_OFFSET
    : rowLayoutHeight
  /**
   * Size each week row to its own content. `listingRowTargetHeight` is a multi-view target
   * that, when used as a floor, leaves light weeks with empty bottom space — use the natural
   * per-week content height here so the row tracks its pills and day-number/meta content.
   */
  const finalRowMinH = containerMinH

  // ── Monthly notes / tasks ─────────────────────────────────────────────────
  const CAL_CELL_BOTTOM_PILL_H = 18
  const weekStartMs = weekDays[0]!.getTime()
  const weekEndExclMs = addDays(weekDays[6]!, 1).getTime()

  /** Map a note/task date range to pixel geometry within this week row. */
  const monthlyBottomItemGeometry = (dayKey: string, endDayKey?: string) => {
    const parse = (k: string) => {
      const [y, m, d] = k.split('-').map(Number)
      if (!y || !m || !d) return null
      return new Date(y, m - 1, d)
    }
    const s = parse(dayKey)
    const e = parse(endDayKey ?? dayKey)
    if (!s || !e) return null
    if (s.getTime() >= weekEndExclMs || e.getTime() < weekStartMs) return null
    const a = Math.max(0, Math.round((s.getTime() - weekStartMs) / 86400000))
    const b = Math.min(6, Math.round((e.getTime() - weekStartMs) / 86400000))
    const continuesFromPrior = s.getTime() < weekStartMs
    const continuesToNext = e.getTime() >= weekEndExclMs
    const INSET = 3
    const left = a * dayColW + INSET
    const width = (b - a + 1) * dayColW - INSET * 2
    if (width <= 0) return null
    return { left, width, continuesFromPrior, continuesToNext }
  }

  const mNoteColor = cleanPillColors.note ?? DEFAULT_CALENDAR_PILL_COLORS.note
  const mTaskColor = cleanPillColors.task ?? DEFAULT_CALENDAR_PILL_COLORS.task
  const mNoteBorder = toHex6(mixHex(mNoteColor, '#000000', relLum(mNoteColor) < 0.35 ? 0.28 : 0.18))
  const mTaskBorder = toHex6(mixHex(mTaskColor, '#000000', relLum(mTaskColor) < 0.35 ? 0.28 : 0.18))
  const mNoteText = bestTextOnBackground(mNoteColor)
  const mTaskText = bestTextOnBackground(mTaskColor)

  const monthNoteLayouts = visibility.calendarNotes
    ? calendarNoteItems
        .map((n) => {
          const g = monthlyBottomItemGeometry(n.dayKey, n.endDayKey)
          if (!g) return null
          return { id: n.id, text: n.text, ...g }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
    : []
  const monthTaskLayouts = visibility.tasks
    ? calendarTaskItems
        .map((t) => {
          const g = monthlyBottomItemGeometry(t.dayKey, t.endDayKey)
          if (!g) return null
          return { id: t.id, text: t.name, ...g }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
    : []
  const reservedNoteSlotMonthly = visibility.calendarNotes

  const selectionWeekBand = useMemo(() => {
    if (listing.id !== selectedListingId || !checkInDate) return null
    let start: number | null = null
    let end: number | null = null
    for (let i = 0; i < weekDays.length; i++) {
      const d = weekDays[i]!
      const inMonth = isSameMonth(d, monthStart)
      const showCheckInOnly =
        checkInDate !== null && checkOutDate === null && isSameDay(d, checkInDate)
      const showFullRange = Boolean(checkInDate && checkOutDate) && isDayInManageRange(d)
      if (inMonth && (showCheckInOnly || showFullRange)) {
        if (start === null) start = i
        end = i
      }
    }
    if (start === null || end === null) return null
    return { start, end }
  }, [
    listing.id,
    selectedListingId,
    checkInDate,
    checkOutDate,
    monthStart,
    weekDays,
    isDayInManageRange,
  ])

  return (
    <div
      ref={rowRef}
      className="relative z-0 flex w-full min-w-0 shrink-0 items-stretch border-b border-[#e9eaeb] bg-white last:border-b-0"
      style={{ minHeight: finalRowMinH }}
    >
      {showFocusLine ? (
        <div
          className="pointer-events-none absolute bottom-0 top-0 z-[1] w-px bg-[#f04438]"
          style={{ left: focusColumnIndex * dayColW + dayColW / 2 }}
          aria-hidden
        />
      ) : null}
      {selectionWeekBand ? (
        <div
          className={SELECTION_RANGE_OUTLINE_MONTHLY}
          style={{
            left: selectionWeekBand.start * dayColW,
            width: (selectionWeekBand.end - selectionWeekBand.start + 1) * dayColW,
          }}
          aria-hidden
        />
      ) : null}
      {weekDays.map((d, dayIdx) => {
        const inMonth = isSameMonth(d, monthStart)
        const isLastCol = dayIdx === weekDays.length - 1
        const meta = mergeCellMeta(listing.id, d, cellOverrides)
        const showLockIn =
          (visibility.guestsCantCheckIn && meta.checkInBlocked) ||
          (visibility.guestsCantCheckOut && meta.checkOutBlocked)
        const lockRowReserved = visibility.guestsCantCheckIn || visibility.guestsCantCheckOut
        const showCheckInOnly =
          checkInDate !== null &&
          checkOutDate === null &&
          listing.id === selectedListingId &&
          isSameDay(d, checkInDate)
        const showFullRange =
          Boolean(checkInDate && checkOutDate) &&
          listing.id === selectedListingId &&
          isDayInManageRange(d)
        const cellSelected = inMonth && (showCheckInOnly || showFullRange)
        const isPastCol = isDayBeforeToday(d)
        return (
          <div
            key={d.toISOString()}
            role={inMonth ? 'button' : 'presentation'}
            tabIndex={inMonth ? 0 : -1}
            onClick={inMonth ? () => onDayCellClick(listing.id, d) : undefined}
            onKeyDown={
              !inMonth
                ? undefined
                : (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onDayCellClick(listing.id, d)
                    }
                  }
            }
            className={cn(
              'relative box-border flex h-full min-h-[96px] min-w-0 flex-1 self-stretch flex-col border-solid border-[#e9eaeb]',
              isLastCol ? null : 'border-r',
              inMonth ? 'cursor-pointer' : 'pointer-events-none cursor-default',
              inMonth
                ? isPastCol
                  ? 'bg-[#f2f4f7] hover:bg-[#e9eaeb]'
                  : 'bg-white hover:bg-[#fafafa]'
                : isPastCol
                  ? 'bg-[#f2f4f7]'
                  : 'bg-white',
              cellSelected ? SELECTION_CELL_BG : null,
            )}
          >
            {inMonth ? (
              <span
                className={cn(
                  'absolute left-1 top-1 z-[2] text-xs font-medium tabular-nums leading-4',
                  TEXT_SECONDARY,
                )}
              >
                {d.getDate()}
              </span>
            ) : null}
            {visibility.ruleSets && inMonth ? (
              <span className="absolute left-1 top-5 size-1.5 rounded-full bg-[#7c3aed]" aria-hidden />
            ) : null}
            <div
              className={cn(
                'flex min-h-0 w-full flex-1 flex-col justify-start px-[6px] pt-5',
                denseMinimalRow ? 'pb-1' : 'pb-3',
              )}
            >
              <div
                className={cn(
                  'flex w-full min-w-0 flex-col items-end text-right',
                  denseMinimalRow ? 'gap-1' : 'gap-[6px]',
                )}
              >
                {lockRowReserved && inMonth ? (
                  <span
                    className="flex h-4 w-full shrink-0 items-center justify-end"
                    title={showLockIn ? 'Guest restriction' : undefined}
                  >
                    {showLockIn ? (
                      <Lock03 width={12} height={12} className="text-[#f04438]" aria-hidden />
                    ) : (
                      <span className="inline-block size-3 shrink-0" aria-hidden />
                    )}
                  </span>
                ) : null}
                {visibility.nightlyRate && inMonth ? (
                  <CellValueTooltip
                    tip="Nightly rate"
                    label={
                      <span className="block min-h-[16px] w-full text-right text-[11px] font-medium tabular-nums leading-4 text-[#717680]">
                        {meta.price}
                      </span>
                    }
                  />
                ) : null}
                {visibility.minimumNights && inMonth ? (
                  <CellValueTooltip
                    tip="Minimum nights"
                    label={
                      <span className="flex min-h-[16px] w-full items-center justify-end gap-0.5 text-[11px] leading-4 text-[#717680]">
                        <MoonStar width={10} height={10} className="shrink-0 opacity-80" aria-hidden />
                        {meta.minNights}
                      </span>
                    }
                  />
                ) : null}
              </div>
            </div>
          </div>
        )
      })}

      {laneItems.map(({ b, range, key, lane }) => {
        const topNonClean = topForLane(lane) + MONTHLY_PILL_TOP_OFFSET
        const isBlockedPill = b.variant === 'gray'
        const isPillSelected =
          (isBlockedPill && blockedPanelReservationId === b.reservationId) ||
          (!isBlockedPill && previewReservationId === b.reservationId)
        const res = reservationById.get(b.reservationId)
        const pillStyle = visibility.reservationPillStyle
        const compact = pillStyle === 'compact'
        const clean = pillStyle === 'clean'
        const modernLayout = isModernLayoutPillStyle(pillStyle)
        const modern = modernLayout
        const pillH = heightForLane(lane)
        const barStyle = isCleanPill
          ? {
              left: range.left,
              width: range.width,
              height: pillH,
              top: 'auto' as const,
              bottom: bottomForMonthCleanLane(lane),
              zIndex: 10 + lane,
            }
          : {
              left: range.left,
              width: range.width,
              height: pillH,
              top: topNonClean,
              bottom: 'auto' as const,
              zIndex: 10 + lane,
            }
        const pillRadius = bookingPillRadius(pillStyle, range.continuesFromPrior, range.continuesToNext)
        const gapInner = 'gap-1.5'
        const labelClass = clean
          ? 'min-w-0 flex-1 truncate text-left text-[13px] font-normal leading-5 text-inherit'
          : 'min-w-0 flex-1 truncate text-left text-[12px] font-normal leading-5 text-white'
        const pillPaymentStatus = demoPaymentStatusForBookingBlock(b.start, b.reservationId)
        const tooltipLines =
          res && !isBlockedPill
            ? reservationTooltipLines(res, pillPaymentStatus)
            : [`${b.label}`, 'Open sidebar for details']
        const notesLines = res ? notesTooltipLines(res) : ['—', '------', '—']
        const leading = calendarPillLeadingIcon(b, res, visibility.pillDetails, compact)
        // 12px padding when there's no photo/avatar before the label; 6px otherwise
        const padX = leading !== null ? 'px-[6px]' : 'px-3'
        const pillLabelText = buildPillLabel(b, res, visibility.pillDetails)
        const blockedTooltipLines = isBlockedPill ? [b.hostNotes?.trim() || 'No host notes'] : null
        const canActivate = isBlockedPill ? true : reservationIdSet.has(b.reservationId)
        return (
          <CalendarReservationPillButton
            key={`${key}-${weekStart.getTime()}`}
            b={b}
            compact={compact}
            clean={clean}
            flatGridChrome
            barStyle={barStyle}
            pillRadius={pillRadius}
            padX={padX}
            gapInner={gapInner}
            labelClass={labelClass}
            modern={modern}
            isSelected={isPillSelected}
            canActivate={canActivate}
            onPillActivate={() => onBookingPillActivate(b)}
            leading={leading}
            tooltipLines={tooltipLines}
            notesLines={notesLines}
            blockedTooltipLines={blockedTooltipLines}
            showNotesIcon={b.showNotesIcon === true}
            cleanPillColors={cleanPillColors}
            res={res ?? null}
            pillLabel={pillLabelText}
            pillDetails={visibility.pillDetails}
          />
        )
      })}

      {/* Tasks — pinned to bottom of row, above notes */}
      {monthTaskLayouts.map((t) => (
        <div
          key={`mtask-${t.id}`}
          className="pointer-events-none absolute z-[8] flex min-h-0 items-center gap-1 px-1 text-[11px] font-medium leading-4"
          style={{
            left: t.left,
            width: t.width,
            bottom: reservedNoteSlotMonthly ? CAL_ITEM_LAYER_V_PAD + CAL_CELL_BOTTOM_PILL_H + CAL_ITEM_LAYER_V_PAD : CAL_ITEM_LAYER_V_PAD,
            height: CAL_CELL_BOTTOM_PILL_H,
            backgroundColor: mTaskColor,
            color: mTaskText,
            border: `1px solid ${mTaskBorder}`,
            borderTopLeftRadius: t.continuesFromPrior ? 0 : 1,
            borderBottomLeftRadius: t.continuesFromPrior ? 0 : 1,
            borderTopRightRadius: t.continuesToNext ? 0 : 1,
            borderBottomRightRadius: t.continuesToNext ? 0 : 1,
          }}
          title={t.text}
        >
          <CheckDone01 width={11} height={11} className="shrink-0 opacity-80" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{t.text}</span>
        </div>
      ))}

      {/* Notes — pinned to the very bottom of the row */}
      {monthNoteLayouts.map((n) => (
        <div
          key={`mnote-${n.id}`}
          className="pointer-events-none absolute z-[9] flex min-h-0 items-center gap-1 px-1 text-[11px] font-medium leading-4"
          style={{
            left: n.left,
            width: n.width,
            bottom: CAL_ITEM_LAYER_V_PAD,
            height: CAL_CELL_BOTTOM_PILL_H,
            backgroundColor: mNoteColor,
            color: mNoteText,
            border: `1px solid ${mNoteBorder}`,
            borderTopLeftRadius: n.continuesFromPrior ? 0 : 1,
            borderBottomLeftRadius: n.continuesFromPrior ? 0 : 1,
            borderTopRightRadius: n.continuesToNext ? 0 : 1,
            borderBottomRightRadius: n.continuesToNext ? 0 : 1,
          }}
          title={n.text}
        >
          <Annotation width={11} height={11} className="shrink-0 opacity-80" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{n.text}</span>
        </div>
      ))}
    </div>
  )
})

/** Left column card — monthly sidebar (same chrome as multi listing column). */
const CalendarSidebarListingCard = memo(function CalendarSidebarListingCard({
  listing,
  visibility,
  denseMinimalRow,
  isSelected,
  onSelect,
  minRowHeight,
}: {
  listing: CalendarListing
  visibility: CalendarSettingsVisibility
  denseMinimalRow: boolean
  isSelected: boolean
  onSelect: (listingId: string) => void
  /** Same row height as multi view listing column for this listing (avoids layout jump when switching views). */
  minRowHeight: number
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(listing.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(listing.id)
        }
      }}
      className={cn(
        'box-border flex w-full shrink-0 cursor-pointer border-b bg-white px-3 outline-none transition-colors hover:bg-[#fafafa] focus-visible:bg-[#fafafa]',
        denseMinimalRow ? 'min-h-0 items-center py-2' : 'min-h-0 items-center py-1.5',
        BORDER_SECONDARY,
        visibility.listingImage ? 'items-center gap-2' : 'items-center',
        isSelected &&
          'relative bg-[#fafafa] before:pointer-events-none before:absolute before:left-0 before:top-0 before:bottom-0 before:z-10 before:w-1 before:bg-[#17b26a]',
      )}
      style={{ width: 'var(--cal-listing-col, 248px)', minHeight: minRowHeight, transition: 'width 0.32s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {visibility.listingImage ? (
        <img
          src={calendarListingThumbnailSrc(listing)}
          alt=""
          width={60}
          height={48}
          loading="lazy"
          decoding="async"
          className="h-12 w-[60px] shrink-0 self-center rounded-md bg-[#f2f4f7] object-cover object-center shadow-[0px_1px_2px_rgba(10,13,18,0.06)] ring-1 ring-inset ring-black/[0.06]"
        />
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 items-center gap-1.5">
        {visibility.cleaningStatus && (
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden
            className={cn('shrink-0', listing.clean ? 'text-[#17b26a]' : 'text-[#f04438]')}
          >
            <path d="M8 1L1.5 7.5M1.5 7.5C0.8 8.2 0.8 9.2 1.5 9.2C2.2 9.2 3.8 8.5 3.8 7.5C3.8 6.5 3 5.8 1.5 7.5Z"
              stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        <p className="min-w-0 truncate text-[13px] font-normal leading-5 text-[#181d27]">
          <span className="truncate">{listing.name}</span>
          {visibility.listingId && <span className="ml-1 text-[11px] text-[#9aa3af]">({listing.code})</span>}
        </p>
      </div>
    </div>
  )
})

const CalendarGridListingRow = memo(function CalendarGridListingRow({
  listing,
  visibility,
  rowHeight,
  laneItems,
  gridWidth,
  days,
  cellOverrides,
  showFocusLine,
  focusColumnIndex,
  checkInDate,
  checkOutDate,
  selectedListingId,
  isDayInManageRange,
  onListingColumnClick,
  onDayCellClick,
  previewReservationId,
  blockedPanelReservationId,
  onBookingPillActivate,
  reservationIdSet,
  reservationById,
  denseMinimalRow,
  isActiveSidebarListing = false,
  showListingMonthlyLink = false,
  onOpenMonthlyForListing,
  hoveredColumnIndex,
  onColumnPointerEnter,
  cleanPillColors,
  noteItems,
  taskItems,
  timelineStart,
  onCalendarNotePillClick,
}: {
  listing: CalendarListing
  visibility: CalendarSettingsVisibility
  cleanPillColors: CalendarPillColorSettings
  /** Compact pills + all listing/calendar details off — 36px row chrome. */
  denseMinimalRow: boolean
  rowHeight: number
  laneItems: CalendarLaneItem[]
  gridWidth: number
  days: CalendarDayRowModel[]
  cellOverrides: Record<string, CalendarCellOverride>
  showFocusLine: boolean
  focusColumnIndex: number
  checkInDate: Date | null
  checkOutDate: Date | null
  selectedListingId: string | null
  isDayInManageRange: (date: Date) => boolean
  onListingColumnClick: (listingId: string) => void
  onDayCellClick: (listingId: string, cellDate: Date) => void
  previewReservationId: string | null
  blockedPanelReservationId: string | null
  onBookingPillActivate: (b: BookingBlock) => void
  reservationIdSet: Set<string>
  reservationById: Map<string, ReservationListItem>
  /** Matches sidebar / monthly active listing (Figma green accent). */
  isActiveSidebarListing?: boolean
  /** Multi view: listing title links to Monthly for that listing. */
  showListingMonthlyLink?: boolean
  onOpenMonthlyForListing?: (listingId: string) => void
  /** Multi view: day column (0…days.length-1) for band highlight with date header. */
  hoveredColumnIndex: number | null
  onColumnPointerEnter: (index: number) => void
  /** Notes for this listing (already pre-filtered to listing.id upstream). */
  noteItems: CalendarNoteItem[]
  /** Tasks for this listing (already pre-filtered to listing.id upstream). */
  taskItems: CalendarTaskItem[]
  /** Needed so bottom-item geometry maps day keys to column indices. */
  timelineStart: Date
  /** Open edit UI for a calendar note pill (id from `CalendarNoteItem`). */
  onCalendarNotePillClick: (noteId: string) => void
}) {
  const maxL = laneItems.length === 0 ? -1 : Math.max(...laneItems.map((i) => i.lane))
  const isModern = isModernLayoutPillStyle(visibility.reservationPillStyle)
  const CAL_CELL_BOTTOM_PILL_H = 18

  /**
   * Compute on-screen pill geometry for a note or task that lives on a day
   * range within the visible timeline. The pill fills the full width of every
   * day cell in the range (start cell left edge → end cell right edge) with a
   * small inset so it doesn't touch the cell borders. Returns null when the
   * item falls entirely outside the visible window.
   */
  const bottomItemGeometry = (start: string, endInclusive: string | undefined) => {
    const parse = (k: string) => {
      const [y, m, d] = k.split('-').map(Number)
      if (!y || !m || !d) return null
      return new Date(y, m - 1, d)
    }
    const s = parse(start)
    const e = parse(endInclusive ?? start)
    if (!s || !e) return null
    const startIdx = dayIndexInView(s, timelineStart)
    const endIdx = dayIndexInView(e, timelineStart)
    const dayCount = days.length
    if (endIdx < 0) return null
    if (startIdx >= dayCount) return null
    const a = Math.max(0, startIdx)
    const b = Math.min(dayCount - 1, endIdx)
    const continuesFromPrior = startIdx < 0
    const continuesToNext = endIdx > dayCount - 1
    const INSET = 3
    const left = a * DAY_COL_PX + INSET
    const width = (b - a + 1) * DAY_COL_PX - INSET * 2
    if (width <= 0) return null
    return { left, width, continuesFromPrior, continuesToNext }
  }

  const noteColor = cleanPillColors.note ?? DEFAULT_CALENDAR_PILL_COLORS.note
  const taskColor = cleanPillColors.task ?? DEFAULT_CALENDAR_PILL_COLORS.task
  const noteBorderShift = relLum(noteColor) < 0.35 ? 0.28 : 0.18
  const taskBorderShift = relLum(taskColor) < 0.35 ? 0.28 : 0.18
  const noteBorder = toHex6(mixHex(noteColor, '#000000', noteBorderShift))
  const taskBorder = toHex6(mixHex(taskColor, '#000000', taskBorderShift))
  const noteText = bestTextOnBackground(noteColor)
  const taskText = bestTextOnBackground(taskColor)

  // Layout rows: tasks just above notes, each 18px tall with a 2px vertical
  // gap. Both are anchored to the bottom of the row so they never collide
  // with reservation pills in the middle of the row.
  const noteLayouts = visibility.calendarNotes
    ? noteItems
        .map((n) => {
          const g = bottomItemGeometry(n.dayKey, n.endDayKey)
          if (!g) return null
          return { id: n.id, text: n.text, ...g }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
    : []
  const taskLayouts = visibility.tasks
    ? taskItems
        .map((t) => {
          const g = bottomItemGeometry(t.dayKey, t.endDayKey)
          if (!g) return null
          return { id: t.id, text: t.name, ...g }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
    : []

  const noteTaskBottomStripH = bottomStripReserveForVisibility(visibility)
  const reservedNoteSlot = visibility.calendarNotes
  const heightForLane: (lane: number) => number =
    isModern && maxL >= 0
      ? (_lane: number) => {
          const lanes = maxL + 1
          const innerH = Math.max(
            0,
            rowHeight - noteTaskBottomStripH - MODERN_CELL_PILL_PAD_Y * 2,
          )
          return Math.max(
            MODERN_MIN_LANE_HEIGHT,
            (innerH - maxL * PILL_STACK_GAP_PX) / lanes,
          )
        }
      : (_lane: number) => pillHeightForCalendarSettings(visibility)
  let stackH = 0
  if (maxL >= 0) {
    for (let lane = 0; lane <= maxL; lane++) {
      stackH += heightForLane(lane)
      if (lane < maxL) stackH += PILL_STACK_GAP_PX
    }
  }
  const dStrip = noteTaskBottomStripH
  const calBottomGutter = dStrip > 0 ? 0 : CAL_PILL_OFFSET_FROM_ROW_BOTTOM
  /**
   * Center the pill stack (plus the task/note strip below it) vertically in the
   * row. When the note+task strip is on the entire visual block
   * (pill → 6px gap → task → 6px gap → note) is treated as one unit and
   * centered with equal top/bottom padding. When the strip is off, center
   * with a minimum 6px inset from each edge.
   */
  const stackTop =
    maxL < 0
      ? 0
      : dStrip > 0
        ? Math.max(CAL_ITEM_LAYER_V_PAD, (rowHeight - dStrip - stackH) / 2)
        : Math.max(
            CAL_ITEM_LAYER_V_PAD,
            Math.min(
              (rowHeight - calBottomGutter - stackH) / 2,
              rowHeight - calBottomGutter - stackH - CAL_ITEM_LAYER_V_PAD,
            ),
          )
  // When a pill exists and the bottom strip is on, anchor tasks/notes relative
  // to the centered pill (6px below pill bottom) so the whole block moves together.
  const hasPillInRow = maxL >= 0 && dStrip > 0
  const taskTopPos = hasPillInRow ? stackTop + stackH + CAL_ITEM_LAYER_V_PAD : null
  const noteTopPos = hasPillInRow
    ? (taskTopPos ?? 0) + (visibility.tasks ? CAL_CELL_BOTTOM_PILL_H + CAL_ITEM_LAYER_V_PAD : 0)
    : null
  const topForLane = (lane: number) => {
    let t = stackTop
    for (let L = 0; L < lane; L++) {
      t += heightForLane(L) + PILL_STACK_GAP_PX
    }
    return t
  }

  const selectionBand = useMemo(() => {
    if (listing.id !== selectedListingId || !checkInDate) return null
    let start: number | null = null
    let end: number | null = null
    for (let i = 0; i < days.length; i++) {
      const dayDate = days[i]!.date
      const showCheckInOnly =
        checkInDate !== null && checkOutDate === null && isSameDay(dayDate, checkInDate)
      const showFullRange = Boolean(checkInDate && checkOutDate) && isDayInManageRange(dayDate)
      if (showCheckInOnly || showFullRange) {
        if (start === null) start = i
        end = i
      }
    }
    if (start === null || end === null) return null
    return { start, end }
  }, [listing.id, selectedListingId, checkInDate, checkOutDate, days, isDayInManageRange])

  return (
    <div
      className="relative flex min-w-min min-h-0 items-stretch border-b border-[#e9eaeb] bg-white"
      style={{ minHeight: rowHeight }}
    >
      {/* White bg strip — covers the full listing-column width for the entire row height,
          including any extra height from stacked reservation pills that overflow the base. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[28] bg-white"
        style={{ width: 'var(--cal-listing-col, 248px)' }}
        aria-hidden
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => onListingColumnClick(listing.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onListingColumnClick(listing.id)
          }
        }}
        className={cn(
          'sticky left-0 z-30 flex min-h-0 shrink-0 cursor-pointer box-border border-r bg-white px-3 shadow-[6px_0_16px_-8px_rgba(10,13,18,0.06)] outline-none transition-colors hover:bg-white focus-visible:bg-white',
          'items-center',
          denseMinimalRow ? 'py-2' : 'py-1.5',
          BORDER_SECONDARY,
          visibility.listingImage ? 'items-center gap-2' : 'items-center',
          isActiveSidebarListing &&
            'relative before:pointer-events-none before:absolute before:left-0 before:top-0 before:bottom-0 before:z-10 before:w-1 before:bg-[#17b26a]',
        )}
        style={{ width: 'var(--cal-listing-col, 248px)', transition: 'width 0.32s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {visibility.listingImage ? (
          <img
            src={calendarListingThumbnailSrc(listing)}
            alt=""
            width={60}
            height={48}
            loading="lazy"
            decoding="async"
            className="h-12 w-[60px] shrink-0 self-center rounded-md bg-[#f2f4f7] object-cover object-center shadow-[0px_1px_2px_rgba(10,13,18,0.06)] ring-1 ring-inset ring-black/[0.06]"
          />
        ) : null}
        <div className="flex min-h-0 min-w-0 flex-1 items-center gap-1.5">
          {visibility.cleaningStatus && (
            <span
              className={cn('inline-block size-2 shrink-0 rounded-full',
                listing.clean ? 'bg-[#17b26a]' : 'bg-[#f04438]')}
              aria-hidden
            />
          )}
          {showListingMonthlyLink && onOpenMonthlyForListing ? (
            <button
              type="button"
              className="min-w-0 cursor-pointer truncate border-0 bg-transparent p-0 text-left text-[13px] font-normal leading-5 text-[#181d27] hover:text-[#0d9488] transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onOpenMonthlyForListing(listing.id)
              }}
            >
              <span className="truncate">{listing.name}</span>
              {visibility.listingId && <span className="ml-1 text-[11px] text-[#9aa3af]">({listing.code})</span>}
            </button>
          ) : (
            <p className="min-w-0 truncate text-[13px] font-normal leading-5 text-[#181d27]">
              <span className="truncate">{listing.name}</span>
              {visibility.listingId && <span className="ml-1 text-[11px] text-[#9aa3af]">({listing.code})</span>}
            </p>
          )}
        </div>
      </div>

      <div
        data-calendar-listing-row={listing.id}
        className="relative z-0 flex shrink-0 items-stretch bg-white"
        style={{ minHeight: rowHeight, width: gridWidth }}
      >
        {showFocusLine && (
          <div
            className="pointer-events-none absolute bottom-0 top-0 z-[1] w-px bg-[#f04438]"
            style={{ left: focusColumnIndex * DAY_COL_PX + DAY_COL_PX / 2 }}
            aria-hidden
          />
        )}
        {selectionBand ? (
          <div
            className={SELECTION_RANGE_OUTLINE}
            style={{
              left: selectionBand.start * DAY_COL_PX,
              width: (selectionBand.end - selectionBand.start + 1) * DAY_COL_PX,
            }}
            aria-hidden
          />
        ) : null}
        {days.map((d, i) => {
          const meta = mergeCellMeta(listing.id, d.date, cellOverrides)
          const showLockIn =
            (visibility.guestsCantCheckIn && meta.checkInBlocked) ||
            (visibility.guestsCantCheckOut && meta.checkOutBlocked)
          const lockRowReserved = visibility.guestsCantCheckIn || visibility.guestsCantCheckOut
          const showCheckInOnly =
            checkInDate !== null &&
            checkOutDate === null &&
            listing.id === selectedListingId &&
            isSameDay(d.date, checkInDate)
          const showFullRange =
            Boolean(checkInDate && checkOutDate) &&
            listing.id === selectedListingId &&
            isDayInManageRange(d.date)
          const cellSelected = showCheckInOnly || showFullRange
          const isPastCol = isDayBeforeToday(d.date)
          const colHovered = hoveredColumnIndex === i
          return (
            <div
              key={d.date.toISOString()}
              role="button"
              tabIndex={0}
              onClick={() => onDayCellClick(listing.id, d.date)}
              onPointerEnter={() => onColumnPointerEnter(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onDayCellClick(listing.id, d.date)
                }
              }}
              className={cn(
                'relative box-border h-full w-[73px] min-w-[73px] shrink-0 cursor-pointer border-r border-[#e9eaeb]',
                cellSelected
                  ? SELECTION_CELL_BG
                  : cn(
                      // Today column gets a subtle teal wash; past/future otherwise
                      d.isFocus && !isPastCol ? 'bg-[#f0fdf9]' : isPastCol ? 'bg-[#f2f4f7]' : 'bg-white',
                      colHovered
                        ? isPastCol
                          ? 'bg-[#e0ebe7] shadow-[inset_0_0_0_1px_rgba(21,184,176,0.2)]'
                          : 'bg-[#ecfdf8] shadow-[inset_0_0_0_1px_rgba(21,184,176,0.2)]'
                        : isPastCol
                          ? 'hover:bg-[#e9eaeb]'
                          : d.isFocus
                            ? 'hover:bg-[#e6faf5]'
                            : 'hover:bg-[#fafafa]/80',
                    ),
              )}
            >
              {visibility.ruleSets && (
                <span
                  className="pointer-events-none absolute left-1 top-1 z-[2] size-1.5 rounded-full bg-[#7c3aed]"
                  aria-hidden
                />
              )}
              {(lockRowReserved ||
                visibility.nightlyRate ||
                visibility.minimumNights) && (
                <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-end p-1.5 text-right">
                  <div
                    className={cn(
                      'ml-auto flex w-full min-w-0 max-w-full flex-col items-end text-right',
                      denseMinimalRow ? 'gap-1' : 'gap-[6px]',
                    )}
                  >
                    {lockRowReserved ? (
                      <span
                        className="flex h-4 w-full shrink-0 items-center justify-end"
                        title={showLockIn ? 'Guest restriction' : undefined}
                      >
                        {showLockIn ? (
                          <Lock03 width={12} height={12} className="text-[#f04438]" aria-hidden />
                        ) : (
                          <span className="inline-block size-3 shrink-0" aria-hidden />
                        )}
                      </span>
                    ) : null}
                    {visibility.nightlyRate ? (
                      <CellValueTooltip
                        tip="Nightly rate"
                        label={
                          <span className="block min-h-[16px] w-full text-right text-[11px] font-medium tabular-nums leading-4 text-[#717680]">
                            {meta.price}
                          </span>
                        }
                      />
                    ) : null}
                    {visibility.minimumNights ? (
                      <CellValueTooltip
                        tip="Minimum nights"
                        label={
                          <span className="flex min-h-[16px] w-full items-center justify-end gap-0.5 text-[11px] leading-4 text-[#717680]">
                            <MoonStar width={10} height={10} className="shrink-0 opacity-80" aria-hidden />
                            {meta.minNights}
                          </span>
                        }
                      />
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {laneItems.map(({ b, range, key, lane }) => {
          const top = topForLane(lane)
          const isBlockedPill = b.variant === 'gray'
          const isPillSelected =
            (isBlockedPill && blockedPanelReservationId === b.reservationId) ||
            (!isBlockedPill && previewReservationId === b.reservationId)
          const res = reservationById.get(b.reservationId)
          const pillStyle = visibility.reservationPillStyle
          const compact = pillStyle === 'compact'
          const clean = pillStyle === 'clean'
          const modernLayout = isModernLayoutPillStyle(pillStyle)
          const modern = modernLayout
          const pillH = heightForLane(lane)
          const barStyle = {
            left: range.left,
            width: range.width,
            height: pillH,
            top,
            bottom: 'auto' as const,
            zIndex: 10 + lane,
          }
          const pillRadius = bookingPillRadius(pillStyle, range.continuesFromPrior, range.continuesToNext)
          const gapInner = 'gap-1.5'
          const labelClass = clean
            ? 'min-w-0 flex-1 truncate text-left text-[13px] font-normal leading-5 text-inherit'
            : 'min-w-0 flex-1 truncate text-left text-[12px] font-normal leading-5 text-white'
          const pillPaymentStatus = demoPaymentStatusForBookingBlock(b.start, b.reservationId)
          const tooltipLines =
            res && !isBlockedPill
              ? reservationTooltipLines(res, pillPaymentStatus)
              : [`${b.label}`, 'Open sidebar for details']
          const notesLines = res ? notesTooltipLines(res) : ['—', '------', '—']
          const leading = calendarPillLeadingIcon(b, res, visibility.pillDetails, compact)
          // 12px padding when there's no photo/avatar before the label; 6px otherwise
          const padX = leading !== null ? 'px-[6px]' : 'px-3'
          const pillLabelText = buildPillLabel(b, res, visibility.pillDetails)
          const blockedTooltipLines = isBlockedPill
            ? [b.hostNotes?.trim() || 'No host notes']
            : null
          const canActivate = isBlockedPill ? true : reservationIdSet.has(b.reservationId)
          return (
            <CalendarReservationPillButton
              key={key}
              b={b}
              compact={compact}
              clean={clean}
              barStyle={barStyle}
              pillRadius={pillRadius}
              padX={padX}
              gapInner={gapInner}
              labelClass={labelClass}
              modern={modern}
              isSelected={isPillSelected}
              canActivate={canActivate}
              onPillActivate={() => onBookingPillActivate(b)}
              leading={leading}
              tooltipLines={tooltipLines}
              notesLines={notesLines}
              blockedTooltipLines={blockedTooltipLines}
              showNotesIcon={b.showNotesIcon === true}
              cleanPillColors={cleanPillColors}
              res={res ?? null}
              pillPaymentStatus={pillPaymentStatus}
              continuesFromPrior={range.continuesFromPrior}
              continuesToNext={range.continuesToNext}
              pillLabel={pillLabelText}
              pillDetails={visibility.pillDetails}
            />
          )
        })}

        {/* Tasks — pinned to the bottom of the row ABOVE notes. Spanning is
            supported via endDayKey; the chip stretches from the first day's
            left edge to the last day's right edge. */}
        {taskLayouts.map((t) => {
          return (
            <div
              key={`task-${t.id}`}
              className="pointer-events-none absolute z-[8] flex min-h-0 items-center gap-1 px-1 text-[11px] font-medium leading-4 shadow-none"
              style={{
                left: t.left,
                width: t.width,
                ...(taskTopPos !== null
                  ? { top: taskTopPos }
                  : { bottom: taskSpanBottomOffset(reservedNoteSlot) }),
                height: CAL_CELL_BOTTOM_PILL_H,
                backgroundColor: taskColor,
                color: taskText,
                border: `1px solid ${taskBorder}`,
                borderTopLeftRadius: t.continuesFromPrior ? 0 : 1,
                borderBottomLeftRadius: t.continuesFromPrior ? 0 : 1,
                borderTopRightRadius: t.continuesToNext ? 0 : 1,
                borderBottomRightRadius: t.continuesToNext ? 0 : 1,
              }}
              title={t.text}
            >
              <CheckDone01 width={11} height={11} className="shrink-0 opacity-80" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{t.text}</span>
            </div>
          )
        })}

        {/* Notes — pinned to the very bottom of the row. */}
        {noteLayouts.map((n) => (
          <div
            key={`note-${n.id}`}
            role="button"
            tabIndex={0}
            className="absolute z-[9] flex min-h-0 cursor-pointer items-center gap-1 px-1 text-[11px] font-medium leading-4 shadow-none"
            style={{
              left: n.left,
              width: n.width,
              ...(noteTopPos !== null
                ? { top: noteTopPos }
                : { bottom: CAL_ITEM_LAYER_V_PAD }),
              height: CAL_CELL_BOTTOM_PILL_H,
              backgroundColor: noteColor,
              color: noteText,
              border: `1px solid ${noteBorder}`,
              borderTopLeftRadius: n.continuesFromPrior ? 0 : 1,
              borderBottomLeftRadius: n.continuesFromPrior ? 0 : 1,
              borderTopRightRadius: n.continuesToNext ? 0 : 1,
              borderBottomRightRadius: n.continuesToNext ? 0 : 1,
            }}
            title={n.text}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onCalendarNotePillClick(n.id)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                e.preventDefault()
                onCalendarNotePillClick(n.id)
              }
            }}
          >
            <Annotation width={11} height={11} className="shrink-0 opacity-80" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{n.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
})

function ManageDateFieldRow({
  label,
  value,
  onSelect,
}: {
  label: string
  value: Date | null
  onSelect: (d: Date) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const display =
    value?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) ?? '—'
  return (
    <div className="flex w-full min-w-0 items-center">
      <p className="w-[180px] shrink-0 text-sm text-[#535862]">{label}</p>
      <div className="relative min-w-0 flex-1">
        <input
          ref={inputRef}
          type="date"
          className="absolute inset-0 z-10 h-9 w-full cursor-pointer opacity-0"
          value={value ? calendarDayKey(value) : ''}
          onChange={(e) => {
            const v = e.target.value
            if (!v) return
            const [y, m, d] = v.split('-').map(Number)
            onSelect(startOfDay(new Date(y, m - 1, d)))
          }}
          aria-label={label}
        />
        <div
          className="pointer-events-none flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-[#d5d7da] bg-white px-3 text-sm text-[#181d27] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]"
          aria-hidden
        >
          <span className="flex min-w-0 items-center gap-2">
            <Calendar className="h-5 w-5 shrink-0 text-[#414651]" />
            <span className="truncate tabular-nums">{display}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[#414651]" />
        </div>
      </div>
    </div>
  )
}

/**
 * Weekly view — Gmail-style week grid. Matches Multi / Monthly chrome so
 * switching views feels seamless: same listing sidebar on the left, same
 * filter / sort / search bar in the listing column, same day header row.
 *
 * Layout:
 *   [ listing sidebar ] [ hour axis ] [ 7 day columns ]
 *
 * - Reservations, owner stays, and blocked bars render as time-positioned
 *   blocks inside their day column (check-in 3–6 PM, full grid for middle
 *   nights, check-out 9–11 AM). Times are derived deterministically from
 *   each reservation id so they stay consistent across renders and match
 *   the same reservations shown in Multi / Monthly.
 * - Tasks render as a small 12–1 PM block on their scheduled day.
 * - Notes strip renders above the hour grid only when the Calendar notes
 *   toggle is on — no vertical space reserved when hidden.
 * - Clicking a reservation / owner-stay / blocked block opens the same
 *   contextual sidebar Multi / Monthly pills open.
 */
function CalendarWeeklyView({
  anchorDate,
  focusDay,
  filteredListings,
  selectedListingId,
  bookings,
  visibility,
  cleanPillColors,
  calendarNoteItems,
  calendarTaskItems,
  denseMinimalRow,
  effectiveRowHeightsByListingId,
  reservationIdSet,
  reservationById,
  previewReservationId,
  blockedPanelReservationId,
  onSelectListing,
  onBookingPillActivate,
  searchQuery,
  onSearchQueryChange,
}: {
  anchorDate: Date
  /** Active day column (same as Multi header focus) — not necessarily "today". */
  focusDay: Date
  filteredListings: CalendarListing[]
  selectedListingId: string | null
  bookings: BookingBlock[]
  visibility: CalendarSettingsVisibility
  cleanPillColors: CalendarPillColorSettings
  calendarNoteItems: CalendarNoteItem[]
  calendarTaskItems: CalendarTaskItem[]
  denseMinimalRow: boolean
  effectiveRowHeightsByListingId: Map<string, number>
  reservationIdSet: Set<string>
  reservationById: Map<string, ReservationListItem>
  previewReservationId: string | null
  blockedPanelReservationId: string | null
  onSelectListing: (id: string) => void
  onBookingPillActivate: (b: BookingBlock) => void
  searchQuery: string
  onSearchQueryChange: (v: string) => void
}) {
  // Sunday-aligned start of the week containing `anchorDate`.
  const weekStart = useMemo(() => {
    const s = startOfDay(anchorDate)
    s.setDate(s.getDate() - s.getDay())
    return s
  }, [anchorDate])
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )
  const [hoveredWeekColIdx, setHoveredWeekColIdx] = useState<number | null>(null)
  const focusColumnIndex = useMemo(
    () => weekDays.findIndex((d) => isSameDay(d, focusDay)),
    [weekDays, focusDay],
  )
  const weekStartMs = weekStart.getTime()
  const weekEndExclMs = addDays(weekStart, 7).getTime()

  const activeListing =
    filteredListings.find((l) => l.id === selectedListingId) ?? filteredListings[0]

  // Dimensions — keep the hour grid and strips in the same horizontal
  // coordinate space so borders line up with the day headers above.
  const HOUR_AXIS_PX = 56
  const HOUR_ROW_PX = 52
  const HOUR_START = 6 // 6 AM
  const HOUR_END = 22 // 10 PM (bottom of grid)
  const hours = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START }, (_, i) => i + HOUR_START),
    [],
  )
  const gridHeight = (HOUR_END - HOUR_START) * HOUR_ROW_PX

  // Stable per-reservation check-in (3–6 PM) / check-out (9–11 AM) times so
  // the Weekly view stays consistent across re-renders and matches the
  // reservation previewed in Multi / Monthly.
  const stableHash = (s: string) => {
    let h = 0
    for (let i = 0; i < s.length; i++) {
      h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
    }
    return Math.abs(h)
  }
  const timesForBooking = (b: BookingBlock) => {
    const h = stableHash(b.reservationId)
    // Check-in any of 15, 16, 17, 18 (3–6 PM).
    const checkInHour = 15 + (h % 4)
    // Check-out any of 9, 10, 11 (9–11 AM).
    const checkOutHour = 9 + ((h >> 3) % 3)
    return { checkInHour, checkOutHour }
  }

  const reservationBg = toHex6(cleanPillColors.reservation)
  const inquiryBg = toHex6(cleanPillColors.inquiry)
  const ownerBg = toHex6(cleanPillColors.ownerStay)
  const blockedBg = toHex6(cleanPillColors.blocked)
  const noteBg = toHex6(cleanPillColors.note)
  const taskBg = toHex6(cleanPillColors.task)

  const pickBookingBg = (b: BookingBlock): string => {
    if (b.variant === 'teal') return reservationBg
    if (b.variant === 'orange') return inquiryBg
    if (b.variant === 'blue') return ownerBg
    if (b.variant === 'gray') return blockedBg
    return reservationBg
  }

  // For every booking that overlaps this week, produce per-day segments
  // (each segment has a start and end hour within that day).
  type DayBookingSegment = {
    booking: BookingBlock
    dayCol: number
    startH: number
    endH: number
  }
  const daySegmentsByBooking = useMemo(() => {
    if (!activeListing) return [] as DayBookingSegment[]
    const out: DayBookingSegment[] = []
    for (const b of bookings) {
      if (b.listingId !== activeListing.id) continue
      if (!bookingPassesFilters(b, visibility)) continue
      const sMs = startOfDay(b.start).getTime()
      const eMs = startOfDay(b.end).getTime() // check-out morning
      // Overlap check — include the checkout morning day in the range.
      if (eMs < weekStartMs || sMs >= weekEndExclMs) continue
      const { checkInHour, checkOutHour } = timesForBooking(b)
      for (let i = 0; i < 7; i++) {
        const dayMs = weekStartMs + i * 86400000
        if (dayMs < sMs || dayMs > eMs) continue
        let startH = HOUR_START
        let endH = HOUR_END
        if (dayMs === sMs) startH = Math.max(HOUR_START, checkInHour)
        if (dayMs === eMs) endH = Math.min(HOUR_END, checkOutHour)
        // Guard: if the computed block has no height (e.g., same day edge
        // case where check-in > check-out), skip it.
        if (endH <= startH) continue
        out.push({ booking: b, dayCol: i, startH, endH })
      }
    }
    return out
  }, [bookings, activeListing, visibility, weekStartMs, weekEndExclMs])

  // Task segments — fixed 12 PM → 1 PM on the task day.
  const taskSegments = useMemo(() => {
    if (!activeListing || !visibility.tasks) return [] as Array<{
      task: CalendarTaskItem
      dayCol: number
    }>
    const out: Array<{ task: CalendarTaskItem; dayCol: number }> = []
    for (const t of calendarTaskItems) {
      if (t.listingId !== activeListing.id) continue
      const s = parseCalendarDayKeyToDate(t.dayKey)
      if (!s) continue
      const eInclusive = t.endDayKey
        ? parseCalendarDayKeyToDate(t.endDayKey) ?? s
        : s
      const sMs = startOfDay(s).getTime()
      const eMs = startOfDay(eInclusive).getTime()
      for (let i = 0; i < 7; i++) {
        const dayMs = weekStartMs + i * 86400000
        if (dayMs < sMs || dayMs > eMs) continue
        out.push({ task: t, dayCol: i })
      }
    }
    return out
  }, [calendarTaskItems, activeListing, visibility.tasks, weekStartMs])

  // Notes strip (single horizontal strip above the grid when on).
  type NoteSpan = {
    item: CalendarNoteItem
    startCol: number
    spanCols: number
    continuesLeft: boolean
    continuesRight: boolean
    lane: number
  }
  const noteSpans = useMemo<NoteSpan[]>(() => {
    if (!activeListing || !visibility.calendarNotes) return []
    const raw: Array<Omit<NoteSpan, 'lane'>> = []
    for (const n of calendarNoteItems) {
      if (n.listingId !== activeListing.id) continue
      const s = parseCalendarDayKeyToDate(n.dayKey)
      const eInclusive = n.endDayKey
        ? parseCalendarDayKeyToDate(n.endDayKey) ?? s
        : s
      if (!s || !eInclusive) continue
      const sMs = startOfDay(s).getTime()
      const eMs = addDays(startOfDay(eInclusive), 1).getTime()
      if (eMs <= weekStartMs || sMs >= weekEndExclMs) continue
      const clampedStart = Math.max(sMs, weekStartMs)
      const clampedEnd = Math.min(eMs, weekEndExclMs)
      const startCol = Math.round((clampedStart - weekStartMs) / 86400000)
      const spanCols = Math.max(
        1,
        Math.round((clampedEnd - clampedStart) / 86400000),
      )
      raw.push({
        item: n,
        startCol,
        spanCols,
        continuesLeft: sMs < weekStartMs,
        continuesRight: eMs > weekEndExclMs,
      })
    }
    raw.sort((a, b) => a.startCol - b.startCol || b.spanCols - a.spanCols)
    const laneEnds: number[] = []
    const out: NoteSpan[] = []
    for (const r of raw) {
      let lane = laneEnds.findIndex((end) => end <= r.startCol)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(r.startCol + r.spanCols)
      } else {
        laneEnds[lane] = r.startCol + r.spanCols
      }
      out.push({ ...r, lane })
    }
    return out
  }, [calendarNoteItems, activeListing, visibility.calendarNotes, weekStartMs, weekEndExclMs])

  const NOTE_BAR_H = 22
  const NOTE_BAR_GAP = 4
  const NOTE_STRIP_V_PAD = 6
  const maxNoteLanes = noteSpans.reduce((m, n) => Math.max(m, n.lane + 1), 0)
  const notesStripH =
    visibility.calendarNotes && maxNoteLanes > 0
      ? NOTE_STRIP_V_PAD * 2 + maxNoteLanes * NOTE_BAR_H + (maxNoteLanes - 1) * NOTE_BAR_GAP
      : 0

  const formatHour = (h: number) => {
    const am = h < 12
    const label = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${label} ${am ? 'AM' : 'PM'}`
  }

  if (!activeListing) {
    return (
      <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center border-x border-b border-[#e9eaeb] bg-[#fafafa] px-6 text-center">
        <p className="text-sm text-[#717680]">No listings match your search.</p>
      </div>
    )
  }

  // Render a single day-column reservation / owner-stay / blocked block
  // positioned by its time range. Absolute-positioned inside the day column.
  const renderDayBookingBlock = (seg: DayBookingSegment, keySuffix: string) => {
    const bg = pickBookingBg(seg.booking)
    const fg = bestTextOnBackground(bg)
    const borderShift = relLum(bg) < 0.35 ? 0.28 : 0.18
    const borderColor = mixHex(bg, '#000000', borderShift)
    const top = (seg.startH - HOUR_START) * HOUR_ROW_PX
    const height = (seg.endH - seg.startH) * HOUR_ROW_PX - 2
    const isActive =
      seg.booking.variant === 'gray'
        ? blockedPanelReservationId === seg.booking.reservationId
        : previewReservationId === seg.booking.reservationId
    return (
      <button
        key={`book-${seg.booking.reservationId}-${seg.dayCol}-${keySuffix}`}
        type="button"
        onClick={() => {
          if (
            seg.booking.variant === 'gray' ||
            reservationIdSet.has(seg.booking.reservationId) ||
            reservationById.has(seg.booking.reservationId)
          ) {
            onBookingPillActivate(seg.booking)
          }
        }}
        title={
          seg.booking.variant === 'gray'
            ? seg.booking.hostNotes || 'Blocked'
            : seg.booking.label
        }
        className={cn(
          'absolute left-1 right-1 flex flex-col items-start justify-start overflow-hidden rounded-md px-2 py-1 text-left text-[12px] font-semibold leading-tight',
          'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f172a]/40',
          isActive && 'ring-2 ring-inset ring-[#0f172a]/40',
        )}
        style={{
          top,
          height,
          backgroundColor: bg,
          border: `1px solid ${borderColor}`,
          color: fg,
        }}
      >
        <span className="truncate text-[12px] font-semibold leading-4">
          {seg.booking.label}
        </span>
        <span className="text-[11px] font-medium leading-4 opacity-80">
          {formatHour(seg.startH)} – {formatHour(seg.endH)}
        </span>
      </button>
    )
  }

  // Render a task block fixed to 12–1 PM in its day column.
  const renderTaskBlock = (task: CalendarTaskItem, dayCol: number) => {
    const bg = taskBg
    const fg = bestTextOnBackground(bg)
    const borderShift = relLum(bg) < 0.35 ? 0.28 : 0.18
    const borderColor = mixHex(bg, '#000000', borderShift)
    const top = (12 - HOUR_START) * HOUR_ROW_PX
    const height = HOUR_ROW_PX - 4
    return (
      <div
        key={`task-${task.id}-${dayCol}`}
        className="absolute left-1 right-1 flex items-center overflow-hidden rounded-md px-2 text-left text-[12px] font-semibold leading-tight"
        style={{
          top: top + 2,
          height,
          backgroundColor: bg,
          border: `1px solid ${borderColor}`,
          color: fg,
        }}
        title={task.name}
      >
        <span className="truncate">{task.name}</span>
      </div>
    )
  }

  return (
    <div
      onPointerLeave={(e) => {
        const next = e.relatedTarget as Node | null
        if (next && e.currentTarget.contains(next)) return
        setHoveredWeekColIdx(null)
      }}
    >
      {/* Header row — mirrors Multi view exactly: filter / sort / search in
          the listing column, then the day header strip across the rest. */}
      <div
        className={cn(
          'flex h-12 min-h-12 shrink-0 items-center border-b border-l border-r border-[#e9eaeb] bg-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]',
        )}
      >
        <div
          className="flex h-12 min-h-12 min-w-0 shrink-0 items-center gap-2 border-r border-[#e9eaeb] bg-white px-3 py-0"
          style={{ width: 'var(--cal-listing-col, 248px)', transition: 'width 0.32s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <Button
            type="button"
            variant="outline"
            className={cn('h-9 gap-2 px-3 text-sm font-semibold shadow-sm', CALENDAR_OUTLINE_BTN)}
            aria-label="Filter"
          >
            <FilterLines width={20} height={20} className={TEXT_QUATERNARY} aria-hidden />
            <span
              className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full border border-[#e9eaeb] bg-[#fafafa] px-2 text-xs font-medium leading-none text-[#414651]"
              aria-hidden
            >
              5
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className={cn('size-9 min-h-9 min-w-9 shrink-0 p-0 shadow-sm', CALENDAR_OUTLINE_BTN)}
            aria-label="Sort"
          >
            <SwitchVertical01 width={20} height={20} className={TEXT_QUATERNARY} aria-hidden />
          </Button>
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search"
            className="min-w-0 flex-1 shadow-sm"
          />
        </div>
        {/* Hour axis header spacer — keeps the 7 day labels in the same
            horizontal coordinate space as the grid cells below. */}
        <div
          className="h-12 min-h-12 shrink-0 border-r border-[#e9eaeb] bg-white"
          style={{ width: HOUR_AXIS_PX }}
          aria-hidden
        />
        <div className="flex h-12 min-h-12 min-w-0 flex-1 items-stretch bg-white">
          {weekDays.map((d, i) => {
            const dow3 = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
            return (
              <CalendarDateHeaderCell
                key={d.getTime()}
                date={d}
                dayLabel={dow3}
                isFocus={isSameDay(d, focusDay)}
                isHovered={hoveredWeekColIdx === i}
                widthClassName="min-w-0 flex-1"
                onPointerEnter={() => setHoveredWeekColIdx(i)}
              />
            )
          })}
        </div>
      </div>

      {/* Body — listing sidebar + (notes strip? + hour grid). */}
      <div className="flex min-h-0 min-w-0 flex-1 border-x border-b border-[#e9eaeb] bg-white">
        {/* Left: persistent listing list (matches Monthly). */}
        <div
          className="shrink-0 overflow-y-auto overflow-x-hidden border-r border-[#e9eaeb] bg-white [scrollbar-width:thin]"
          style={{ width: 'var(--cal-listing-col, 248px)', transition: 'width 0.32s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {filteredListings.map((listing) => (
            <CalendarSidebarListingCard
              key={listing.id}
              listing={listing}
              visibility={visibility}
              denseMinimalRow={denseMinimalRow}
              isSelected={listing.id === selectedListingId}
              onSelect={onSelectListing}
              minRowHeight={effectiveRowHeightsByListingId.get(listing.id) ?? 32}
            />
          ))}
        </div>

        {/* Right: (optional) notes strip + scrollable hour grid. */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Notes strip — only shows when the toggle is on AND there are
              notes this week, so it never eats vertical space unnecessarily. */}
          {visibility.calendarNotes && notesStripH > 0 ? (
            <div className="flex shrink-0 border-b border-[#e9eaeb]">
              <div
                className="flex shrink-0 items-start justify-end border-r border-[#e9eaeb] bg-white py-1 pr-2 text-[10px] font-semibold uppercase tracking-wide text-[#717680]"
                style={{ width: HOUR_AXIS_PX, height: notesStripH }}
              >
                Notes
              </div>
              <div className="relative min-w-0 flex-1" style={{ height: notesStripH }}>
                {/* Day column dividers inside the strip so vertical borders
                    stay aligned with the grid below and the headers above. */}
                <div className="pointer-events-none absolute inset-0 z-0 flex">
                  {weekDays.map((d, i) => (
                    <div
                      key={d.getTime()}
                      className={cn(
                        'min-w-0 flex-1',
                        isDayBeforeToday(d) && 'bg-[#f2f4f7]',
                        i < 6 && 'border-r border-[#e9eaeb]',
                      )}
                    />
                  ))}
                </div>
                {noteSpans.map((n) => {
                  const bg = noteBg
                  const fg = bestTextOnBackground(bg)
                  const borderShift = relLum(bg) < 0.35 ? 0.28 : 0.18
                  const borderColor = mixHex(bg, '#000000', borderShift)
                  const leftPct = (n.startCol / 7) * 100
                  const widthPct = (n.spanCols / 7) * 100
                  return (
                    <div
                      key={`note-${n.item.id}`}
                      className="absolute flex items-center overflow-hidden px-2 text-left text-[12px] font-semibold leading-none"
                      title={n.item.text}
                      style={{
                        left: `calc(${leftPct}% + 3px)`,
                        width: `calc(${widthPct}% - 6px)`,
                        top: NOTE_STRIP_V_PAD + n.lane * (NOTE_BAR_H + NOTE_BAR_GAP),
                        height: NOTE_BAR_H,
                        backgroundColor: bg,
                        border: `1px solid ${borderColor}`,
                        borderTopLeftRadius: n.continuesLeft ? 0 : 6,
                        borderBottomLeftRadius: n.continuesLeft ? 0 : 6,
                        borderTopRightRadius: n.continuesRight ? 0 : 6,
                        borderBottomRightRadius: n.continuesRight ? 0 : 6,
                        color: fg,
                      }}
                    >
                      <span className="truncate">{n.item.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* Hour grid. */}
          <div className="flex min-h-0 min-w-0 flex-1 overflow-auto [scrollbar-width:thin]">
            <div
              className="shrink-0 border-r border-[#e9eaeb] bg-white"
              style={{ width: HOUR_AXIS_PX, height: gridHeight }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="flex items-start justify-end border-b border-[#e9eaeb] pr-2 pt-1 text-[10px] font-medium leading-none text-[#717680]"
                  style={{ height: HOUR_ROW_PX }}
                >
                  {formatHour(h)}
                </div>
              ))}
            </div>
            <div
              className="relative flex min-w-0 flex-1"
              style={{ height: gridHeight }}
            >
              {focusColumnIndex >= 0 ? (
                <div
                  className="pointer-events-none absolute bottom-0 top-0 z-[1] w-px bg-[#f04438]"
                  style={{ left: `calc(${(focusColumnIndex + 0.5) / 7} * 100%)` }}
                  aria-hidden
                />
              ) : null}
              {weekDays.map((d, i) => {
                const isPastCol = isDayBeforeToday(d)
                const colHovered = hoveredWeekColIdx === i
                const daySegs = daySegmentsByBooking.filter((s) => s.dayCol === i)
                const dayTasks = taskSegments.filter((t) => t.dayCol === i)
                return (
                  <div
                    key={d.getTime()}
                    role="presentation"
                    onPointerEnter={() => setHoveredWeekColIdx(i)}
                    className={cn(
                      'relative z-0 min-w-0 flex-1',
                      i < 6 && 'border-r border-[#e9eaeb]',
                      colHovered
                        ? isPastCol
                          ? 'bg-[#e0ebe7] shadow-[inset_0_0_0_1px_rgba(21,184,176,0.2)]'
                          : 'bg-[#ecfdf8] shadow-[inset_0_0_0_1px_rgba(21,184,176,0.2)]'
                        : isPastCol
                          ? 'bg-[#f2f4f7]'
                          : 'bg-white',
                    )}
                  >
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="border-b border-[#e9eaeb]"
                        style={{ height: HOUR_ROW_PX }}
                      />
                    ))}
                    {daySegs.map((seg, idx) => renderDayBookingBlock(seg, String(idx)))}
                    {dayTasks.map((t) => renderTaskBlock(t.task, i))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


export function CalendarPage({
  reservations,
  previewReservationId,
  onToggleReservationPreview,
  onSyncBookingPreview,
  onManageDatesOpenChange,
  onCloseReservationPreview,
}: {
  reservations: ReservationListItem[]
  previewReservationId: string | null
  onToggleReservationPreview: (reservationId: string) => void
  /**
   * Called when a pill is activated so the parent can push the booking's actual start/end
   * onto the reservation as an override — keeps the sidebar panel's dates in lockstep with
   * what the pill shows on the grid, even when the randomly-generated booking dates differ
   * from the reservation sample's own `checkIn`/`checkOut` strings.
   */
  onSyncBookingPreview?: (reservationId: string, booking: { start: Date; end: Date }) => void
  /** Close reservation preview when Manage dates opens so the two rails don't stack awkwardly. */
  onManageDatesOpenChange?: (open: boolean) => void
  /** Close reservation preview when opening calendar settings (single right rail). */
  onCloseReservationPreview?: () => void
}) {
  const { setSuccessToast } = useChannelManagerContext()
  const reduceMotion = useReducedMotion()
  const reservationIdSet = useMemo(() => new Set(reservations.map((r) => r.id)), [reservations])
  const reservationById = useMemo(() => {
    const m = new Map<string, ReservationListItem>()
    for (const r of reservations) m.set(r.id, r)
    return m
  }, [reservations])
  /** First column date — timeline runs `TIMELINE_DAYS` forward from here. */
  const [timelineStart, setTimelineStart] = useState(() => initialTimelineStart())
  /** Highlight column (active / "current" day in the strip — defaults to today). */
  const [focusDay, setFocusDay] = useState(() => startOfDay(new Date()))
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [calendarView, setCalendarView] = useState<'multi' | 'monthly' | 'weekly'>('multi')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aiCoHostOpen, setAiCoHostOpen] = useState(false)
  const [aiPanelState, setAiPanelState] = useState({ pendingCount: 0, hasActiveAutomation: false })
  const [visibility, setVisibility] = useState<CalendarSettingsVisibility>(DEFAULT_CALENDAR_SETTINGS)
  const cleanPillColors = useMemo(() => mergeCalendarPillColors(visibility), [visibility])
  const [monthMenuOpen, setMonthMenuOpen] = useState(false)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    () => DEMO_LISTINGS[0]?.id ?? null
  )
  const [checkInDate, setCheckInDate] = useState<Date | null>(null)
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null)
  const [cellOverrides, setCellOverrides] = useState<Record<string, CalendarCellOverride>>({})
  const [extraBookings, setExtraBookings] = useState<BookingBlock[]>([])
  const [removedBookingIds, setRemovedBookingIds] = useState<Set<string>>(() => new Set())
  const [bookingAmendments, setBookingAmendments] = useState<
    Record<string, { start?: Date; end?: Date; hostNotes?: string }>
  >({})
  const [blockedPanelBooking, setBlockedPanelBooking] = useState<BookingBlock | null>(null)
  const [blockedFormStart, setBlockedFormStart] = useState('')
  const [blockedFormEnd, setBlockedFormEnd] = useState('')
  const [blockedFormNotes, setBlockedFormNotes] = useState('')
  const [blockedSecDatesOpen, setBlockedSecDatesOpen] = useState(true)
  const [blockedSecNotesOpen, setBlockedSecNotesOpen] = useState(true)
  const [managePricing, setManagePricing] = useState({ updateType: 'flat', nightly: '100' })
  const [manageAvail, setManageAvail] = useState({
    minNights: '2',
    maxNights: '30',
    available: true,
    guestCanCheckIn: true,
    guestCanCheckOut: true,
  })
  const [manageNote, setManageNote] = useState('')
  const [managePricingShowMore, setManagePricingShowMore] = useState(false)
  const [manageAvailShowMore, setManageAvailShowMore] = useState(false)
  const [manageMoreOpen, setManageMoreOpen] = useState(false)
  /**
   * Calendar notes (host-authored) and tasks. State lives here in the calendar
   * shell so both the settings/side-panel UI and the grid cells read from the
   * same source. The 3-dots menu pushes new items into these arrays.
   */
  const [calendarNoteItems, setCalendarNoteItems] = useState<CalendarNoteItem[]>(
    () => buildDemoNoteSeed(),
  )
  const [calendarTaskItems, setCalendarTaskItems] = useState<CalendarTaskItem[]>(
    () => buildDemoTaskSeed(),
  )
  /** Which add-item modal is open from the 3-dots menu — 'note' | 'task' | null. */
  const [addItemModal, setAddItemModal] = useState<'note' | 'task' | null>(null)
  const [addItemDraft, setAddItemDraft] = useState('')
  const [gridNoteEdit, setGridNoteEdit] = useState<{ id: string; text: string } | null>(null)
  /** Which async manage action is running — drives spinner + disabled states. */
  const [manageBusy, setManageBusy] = useState<'save' | 'reservation' | 'ownerStay' | null>(null)
  const manageFormBaselineRef = useRef('')
  /** Which `calendarNoteItems` id the manage form is editing (for save / remove). */
  const manageRangeNoteIdRef = useRef<string | null>(null)
  const lastManageRangeSyncKeyRef = useRef<string | null>(null)
  const prevManageDatesOpenRef = useRef(false)
  const manageMoreMenuRef = useRef<HTMLUListElement | null>(null)
  const manageMoreTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [manageMorePos, setManageMorePos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  })
  /** Multi view: which day column (0…TIMELINE_DAYS-1) is hovered for row + header band highlight. */
  const [hoveredColumnIndex, setHoveredColumnIndex] = useState<number | null>(null)

  const handleColumnPointerEnter = useCallback((i: number) => {
    setHoveredColumnIndex(i)
  }, [])

  const headerScrollRef = useRef<HTMLDivElement>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)
  const monthlyCalendarScrollRef = useRef<HTMLDivElement>(null)
  const monthPickerRef = useRef<HTMLDivElement>(null)
  const listingSearchInputRef = useRef<HTMLInputElement>(null)
  const previewScrollPrevRef = useRef<string | null>(null)
  /** Listing column + date headers + day grid (not toolbar). */
  const calendarGridInteractiveRef = useRef<HTMLDivElement>(null)
  const calendarSidePanelRef = useRef<HTMLDivElement>(null)

  const days = useMemo(
    () =>
      Array.from({ length: TIMELINE_DAYS }, (_, i) => {
        const date = addDays(timelineStart, i)
        return {
          date,
          dow: DOW_LETTER[date.getDay()],
          isFocus: isSameDay(date, focusDay),
        }
      }),
    [timelineStart, focusDay]
  )

  /** Passive scroll sync + guard avoids reciprocal scroll feedback and redundant layout work. */
  useLayoutEffect(() => {
    const header = headerScrollRef.current
    const body = bodyScrollRef.current
    if (!header || !body) return

    let syncing = false

    const syncBodyToHeader = () => {
      if (syncing) return
      const left = header.scrollLeft
      if (Math.abs(body.scrollLeft - left) <= 0.5) return
      syncing = true
      try {
        body.scrollLeft = left
      } finally {
        syncing = false
      }
    }

    const syncHeaderToBody = () => {
      if (syncing) return
      const left = body.scrollLeft
      if (Math.abs(header.scrollLeft - left) <= 0.5) return
      syncing = true
      try {
        header.scrollLeft = left
      } finally {
        syncing = false
      }
    }

    header.addEventListener('scroll', syncBodyToHeader, { passive: true })
    body.addEventListener('scroll', syncHeaderToBody, { passive: true })
    return () => {
      header.removeEventListener('scroll', syncBodyToHeader)
      body.removeEventListener('scroll', syncHeaderToBody)
    }
  }, [])

  /** Month/year in the nav — for Weekly, the week's Sunday (start of week) so the label matches week steps. */
  const activeMonthYearLabel = useMemo(
    () =>
      (calendarView === 'weekly' ? startOfWeekSunday(timelineStart) : timelineStart).toLocaleDateString(
        'en-US',
        { month: 'short', year: 'numeric' },
      ),
    [timelineStart, calendarView]
  )

  const monthPickerOptions = useMemo(() => {
    const base = startOfMonth(timelineStart)
    return Array.from({ length: 25 }, (_, i) => addMonths(base, i - 12))
  }, [timelineStart])

  /**
   * Bookings anchored to TODAY so Multi / Monthly / Weekly all show the same
   * reservations. The range extends 14 days into the past (for already-checked-in
   * guests) and 120 days forward so every month a PM might browse has data.
   * Importantly this no longer depends on `timelineStart`, so navigating between
   * months/weeks does NOT reshuffle reservations — they stay consistent.
   */
  const generatedBookings = useMemo(() => {
    const anchor = addDays(startOfDay(new Date()), -14)
    return buildRandomCalendarBookings(DEMO_LISTINGS, reservations, anchor, 134)
  }, [reservations])

  /**
   * Auto-generate a "Cleaning & turnover" task on the checkout day whenever
   * two teal reservations on the same listing have a gap of ≤ 2 days.
   * These are shown in addition to user-created tasks — they only appear when
   * the Tasks toggle is on (same visibility gate as other tasks).
   */
  const autoCleaningTasks = useMemo<CalendarTaskItem[]>(() => {
    const result: CalendarTaskItem[] = []
    for (const li of DEMO_LISTINGS) {
      const liReservations = generatedBookings
        .filter((b) => b.listingId === li.id && b.variant === 'teal')
        .sort((a, b) => a.start.getTime() - b.start.getTime())
      for (let i = 0; i + 1 < liReservations.length; i++) {
        const curr = liReservations[i]!
        const next = liReservations[i + 1]!
        const checkoutDay = startOfDay(curr.end)
        const nextCheckin = startOfDay(next.start)
        const gapDays = Math.round(
          (nextCheckin.getTime() - checkoutDay.getTime()) / 86_400_000
        )
        if (gapDays <= 2) {
          result.push({
            id: `cleaning-${li.id}-${calendarDayKey(checkoutDay)}`,
            listingId: li.id,
            dayKey: calendarDayKey(checkoutDay),
            name: 'Cleaning & turnover',
          })
        }
      }
    }
    return result
  }, [generatedBookings])

  const bookings = useMemo(() => {
    const merged = mergeBookingsOnePerNightPerListing(generatedBookings, extraBookings)
    return merged
      .filter((b) => !removedBookingIds.has(b.reservationId))
      .map((b) => {
        const a = bookingAmendments[b.reservationId]
        if (!a) return b
        return {
          ...b,
          ...(a.start ? { start: startOfDay(a.start) } : {}),
          ...(a.end ? { end: startOfDay(a.end) } : {}),
          ...(a.hostNotes !== undefined ? { hostNotes: a.hostNotes } : {}),
          // Blocked pills: use host notes as the visible label (fallback to 'Not Available')
          ...(b.variant === 'gray' && a.hostNotes !== undefined
            ? { label: a.hostNotes.trim() || 'Not Available' }
            : {}),
        }
      })
  }, [generatedBookings, extraBookings, removedBookingIds, bookingAmendments])

  /** Merge user-created tasks with auto-generated cleaning tasks for display. */
  const allCalendarTaskItems = useMemo<CalendarTaskItem[]>(
    () => [...calendarTaskItems, ...autoCleaningTasks],
    [calendarTaskItems, autoCleaningTasks],
  )

  /** Drawer opens only after check-out is chosen (second click). */
  const manageDatesOpen = Boolean(selectedListingId && checkInDate && checkOutDate)
  const calendarSidePanelOpen =
    manageDatesOpen || settingsOpen || aiCoHostOpen || blockedPanelBooking !== null

  const getManageFormSnapshot = useCallback(() => {
    return JSON.stringify({
      in: checkInDate?.getTime() ?? null,
      out: checkOutDate?.getTime() ?? null,
      note: manageNote,
      p: managePricing,
      a: manageAvail,
    })
  }, [checkInDate, checkOutDate, manageNote, managePricing, manageAvail])

  const manageRangeKey = useMemo(() => {
    if (!selectedListingId || !checkInDate || !checkOutDate) return null
    return `${selectedListingId}|${checkInDate.getTime()}|${checkOutDate.getTime()}`
  }, [selectedListingId, checkInDate, checkOutDate])

  /**
   * When Manage dates opens or the selected range changes, load the calendar
   * note, nightly rate, and min-nights from the same sources the grid uses.
   */
  useLayoutEffect(() => {
    if (!manageDatesOpen) {
      lastManageRangeSyncKeyRef.current = null
      manageFormBaselineRef.current = ''
      return
    }
    if (!manageRangeKey) return
    if (lastManageRangeSyncKeyRef.current === manageRangeKey) return
    lastManageRangeSyncKeyRef.current = manageRangeKey
    if (!selectedListingId || !checkInDate || !checkOutDate) return

    const note = findNoteForManageRange(
      calendarNoteItems,
      selectedListingId,
      checkInDate,
      checkOutDate,
    )
    manageRangeNoteIdRef.current = note?.id ?? null
    const nextNote = note?.text ?? ''
    setManageNote(nextNote)

    // Collect meta for every day in the selected range so we can detect uniformity.
    const rangeDays: ReturnType<typeof mergeCellMeta>[] = []
    let d = startOfDay(checkInDate)
    while (d < startOfDay(checkOutDate)) {
      rangeDays.push(mergeCellMeta(selectedListingId, d, cellOverrides))
      d = addDays(d, 1)
    }
    if (rangeDays.length === 0) return

    // Nightly rate: show only when ALL days have the same price; blank otherwise.
    const firstPrice = rangeDays[0]!.price
    const uniformPrice = rangeDays.every((rd) => rd.price === firstPrice)
    const nightly = uniformPrice ? firstPrice.replace(/^\$/, '') : ''

    // Availability: pre-select only when ALL days share the same state.
    // Detect blocked days by checking if any booking covers each day.
    const blockedDay = (date: Date) =>
      bookings.some(
        (b) =>
          b.listingId === selectedListingId &&
          b.variant === 'gray' &&
          startOfDay(b.start) <= startOfDay(date) &&
          startOfDay(date) < startOfDay(b.end),
      )
    const firstBlocked = blockedDay(checkInDate)
    const datesInRange: Date[] = []
    let cur = startOfDay(checkInDate)
    while (cur < startOfDay(checkOutDate)) { datesInRange.push(cur); cur = addDays(cur, 1) }
    const uniformAvail = datesInRange.every((dd) => blockedDay(dd) === firstBlocked)

    // Min nights: uniform only when all days return the same value.
    const firstMin = rangeDays[0]!.minNights
    const uniformMin = rangeDays.every((rd) => rd.minNights === firstMin)

    setManagePricing((p) => ({ ...p, updateType: 'flat', nightly }))
    setManageAvail((prev) => {
      const next = {
        ...prev,
        // If availability is mixed, reset to a neutral state (available, no restrictions).
        available: uniformAvail ? !firstBlocked : true,
        minNights: uniformMin ? String(firstMin) : '',
        guestCanCheckIn: !rangeDays[0]!.checkInBlocked,
        guestCanCheckOut: !rangeDays[0]!.checkOutBlocked,
      }
      manageFormBaselineRef.current = JSON.stringify({
        in: checkInDate.getTime(),
        out: checkOutDate.getTime(),
        note: nextNote,
        p: { updateType: 'flat' as const, nightly },
        a: next,
      })
      return next
    })
  }, [
    manageDatesOpen,
    manageRangeKey,
    calendarNoteItems,
    cellOverrides,
    selectedListingId,
    checkInDate,
    checkOutDate,
    bookings,
  ])

  useEffect(() => {
    if (manageDatesOpen) {
      if (!prevManageDatesOpenRef.current) {
        setManageMoreOpen(false)
        setManagePricingShowMore(false)
        setManageAvailShowMore(false)
      }
    }
    prevManageDatesOpenRef.current = manageDatesOpen
  }, [manageDatesOpen])

  useEffect(() => {
    if (!manageMoreOpen) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node | null
      if (!t) return
      if (manageMoreMenuRef.current?.contains(t)) return
      if (manageMoreTriggerRef.current?.contains(t)) return
      setManageMoreOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setManageMoreOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [manageMoreOpen])

  /**
   * Position the portal-rendered 3-dots menu above the trigger (drops-up to
   * match the original design), right-aligned and clamped to the viewport so
   * it is never clipped by the side-panel overflow.
   */
  useEffect(() => {
    if (!manageMoreOpen) return
    const place = () => {
      const btn = manageMoreTriggerRef.current
      if (!btn) return
      const r = btn.getBoundingClientRect()
      const MENU_W = 220
      const MENU_H_APPROX = 132
      const gap = 6
      const vw = window.innerWidth
      const vh = window.innerHeight
      // Drop-up when there's room above; otherwise drop-down.
      const spaceAbove = r.top
      const top =
        spaceAbove >= MENU_H_APPROX + gap
          ? r.top - MENU_H_APPROX - gap
          : Math.min(vh - MENU_H_APPROX - gap, r.bottom + gap)
      // Right-align the menu's right edge with the trigger's right edge.
      let left = r.right - MENU_W
      if (left + MENU_W + gap > vw) left = vw - MENU_W - gap
      if (left < gap) left = gap
      setManageMorePos({ top: Math.max(gap, top), left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [manageMoreOpen])

  const visibleTimelineRangeLabel = useMemo(() => {
    const start = timelineStart
    const end = addDays(timelineStart, TIMELINE_DAYS - 1)
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
  }, [timelineStart])

  const calendarAiActions = useMemo<CalendarAiActions>(
    () => ({
      jumpToToday: () => {
        const t = startOfDay(new Date())
        setFocusDay(t)
        if (calendarView === 'weekly') {
          setTimelineStart(t)
        } else {
          setTimelineStart(addDays(t, -3))
        }
        setMonthMenuOpen(false)
        setSuccessToast({ show: true, message: 'Calendar moved to today' })
      },
      goToNextMonth: () => {
        setMonthMenuOpen(false)
        if (calendarView === 'weekly') {
          setTimelineStart((cur) => addDays(startOfDay(cur), 7))
          setSuccessToast({ show: true, message: 'View moved to next week' })
        } else {
          setTimelineStart((cur) => startOfMonth(addMonths(startOfMonth(cur), 1)))
          setSuccessToast({ show: true, message: 'View moved to next month' })
        }
      },
      focusListingSearch: () => {
        listingSearchInputRef.current?.focus()
        setSuccessToast({ show: true, message: 'Listing search focused' })
      },
      hintCreateReservation: () => {
        setSuccessToast({
          show: true,
          message: 'Select dates on the grid, then use Manage dates to add a reservation.',
        })
      },
      hintOwnerStay: () => {
        setSuccessToast({
          show: true,
          message: 'Select dates, open Manage dates, then Add owner stay.',
        })
      },
    }),
    [setSuccessToast, calendarView],
  )

  const selectionNights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0
    return Math.max(
      0,
      dayIndexInView(addDays(startOfDay(checkOutDate), 1), startOfDay(checkInDate))
    )
  }, [checkInDate, checkOutDate])

  useEffect(() => {
    onManageDatesOpenChange?.(manageDatesOpen)
  }, [manageDatesOpen, onManageDatesOpenChange])

  /** When Manage dates opens, scroll horizontally so the range is in view and vertically to the active listing row. */
  useEffect(() => {
    if (!manageDatesOpen || !checkInDate || !checkOutDate || !selectedListingId) return

    const startIdx = Math.max(0, dayIndexInView(startOfDay(checkInDate), timelineStart))
    const endIdx = Math.max(
      startIdx,
      dayIndexInView(startOfDay(checkOutDate), timelineStart)
    )
    const rangeStartPx = startIdx * DAY_COL_PX
    const rangeEndPx = (endIdx + 1) * DAY_COL_PX

    const scrollHoriz = () => {
      const body = bodyScrollRef.current
      const header = headerScrollRef.current
      if (!body || !header) return
      const vw = body.clientWidth
      const rangeW = Math.max(DAY_COL_PX, rangeEndPx - rangeStartPx)
      let target = rangeStartPx - (vw - rangeW) / 2
      const maxScroll = Math.max(0, body.scrollWidth - vw)
      target = Math.max(0, Math.min(target, maxScroll))
      body.scrollLeft = target
      header.scrollLeft = target
    }

    const scrollVert = () => {
      const row = document.querySelector<HTMLElement>(
        `[data-calendar-listing-row="${CSS.escape(selectedListingId)}"]`
      )
      row?.scrollIntoView({ block: 'nearest', behavior: 'smooth', inline: 'nearest' })
    }

    let t = 0
    const id1 = window.requestAnimationFrame(() => {
      scrollHoriz()
      scrollVert()
      t = window.setTimeout(() => {
        scrollHoriz()
        scrollVert()
      }, 80)
    })
    return () => {
      window.cancelAnimationFrame(id1)
      window.clearTimeout(t)
    }
  }, [manageDatesOpen, checkInDate, checkOutDate, selectedListingId, timelineStart])

  const isDayInManageRange = useCallback(
    (date: Date) => {
      if (!checkInDate) return false
      const d = startOfDay(date).getTime()
      const a = startOfDay(checkInDate).getTime()
      const b = startOfDay(checkOutDate ?? checkInDate).getTime()
      return d >= a && d <= b
    },
    [checkInDate, checkOutDate],
  )

  const handleListingColumnClick = useCallback((listingId: string) => {
    setSelectedListingId(listingId)
  }, [])

  const handleDayCellClick = useCallback(
    (listingId: string, cellDate: Date) => {
      const clicked = startOfDay(cellDate)

      if (checkInDate && checkOutDate) {
        setSelectedListingId(listingId)
        setCheckInDate(clicked)
        setCheckOutDate(null)
        return
      }

      if (!checkInDate) {
        setSelectedListingId(listingId)
        setCheckInDate(clicked)
        setCheckOutDate(null)
        return
      }

      if (checkInDate && !checkOutDate) {
        if (listingId !== selectedListingId) {
          setSelectedListingId(listingId)
          setCheckInDate(clicked)
          setCheckOutDate(null)
          return
        }
        const ci = startOfDay(checkInDate)
        if (clicked.getTime() < ci.getTime()) {
          setCheckInDate(clicked)
          setCheckOutDate(null)
          return
        }
        setCheckOutDate(clicked)
      }
    },
    [checkInDate, checkOutDate, selectedListingId],
  )

  const closeManageDates = useCallback(() => {
    lastManageRangeSyncKeyRef.current = null
    manageRangeNoteIdRef.current = null
    setCheckInDate(null)
    setCheckOutDate(null)
  }, [])

  const handleBookingPillActivate = useCallback(
    (b: BookingBlock) => {
      if (b.variant === 'gray') {
        setBlockedPanelBooking(b)
        setSettingsOpen(false)
        setAiCoHostOpen(false)
        onCloseReservationPreview?.()
        closeManageDates()
        return
      }
      if (reservationIdSet.has(b.reservationId)) {
        // Push booking dates up so the preview sidebar renders the pill's actual span.
        onSyncBookingPreview?.(b.reservationId, { start: b.start, end: b.end })
        onToggleReservationPreview(b.reservationId)
      }
    },
    [
      closeManageDates,
      onCloseReservationPreview,
      onSyncBookingPreview,
      onToggleReservationPreview,
      reservationIdSet,
    ],
  )

  useEffect(() => {
    if (!blockedPanelBooking) return
    const b = blockedPanelBooking
    setBlockedFormStart(calendarDayKey(b.start))
    setBlockedFormEnd(calendarDayKey(bookingCheckoutDayForForm(b)))
    setBlockedFormNotes(b.hostNotes ?? '')
  }, [blockedPanelBooking])

  const applyBlockedEdits = useCallback(() => {
    if (!blockedPanelBooking) return
    const id = blockedPanelBooking.reservationId
    const b = blockedPanelBooking
    const startD = parseCalendarDayKeyToDate(blockedFormStart)
    const checkoutD = parseCalendarDayKeyToDate(blockedFormEnd)
    if (!startD || !checkoutD) {
      setSuccessToast({ show: true, message: 'Enter valid start and end dates' })
      return
    }
    let endExclusive: Date
    if (b.isUserBlocked) {
      endExclusive = addDays(startOfDay(checkoutD), 1)
    } else {
      const nights = Math.max(
        1,
        Math.round((startOfDay(checkoutD).getTime() - startD.getTime()) / 86400000),
      )
      endExclusive = addDays(startD, nights)
    }
    if (endExclusive.getTime() <= startD.getTime()) {
      setSuccessToast({ show: true, message: 'End date must be after start date' })
      return
    }
    setBookingAmendments((prev) => ({
      ...prev,
      [id]: {
        start: startD,
        end: endExclusive,
        hostNotes: blockedFormNotes,
      },
    }))
    setBlockedPanelBooking((prev) =>
      prev && prev.reservationId === id
        ? {
            ...prev,
            start: startD,
            end: endExclusive,
            hostNotes: blockedFormNotes,
          }
        : prev,
    )
    setExtraBookings((prev) =>
      prev.map((x) =>
        x.reservationId === id
          ? { ...x, start: startD, end: endExclusive, hostNotes: blockedFormNotes }
          : x,
      ),
    )
    setSuccessToast({ show: true, message: 'Not available period updated' })
  }, [blockedPanelBooking, blockedFormStart, blockedFormEnd, blockedFormNotes, setSuccessToast])

  const removeBlockedBooking = useCallback(() => {
    if (!blockedPanelBooking) return
    const id = blockedPanelBooking.reservationId
    setRemovedBookingIds((prev) => new Set(prev).add(id))
    setExtraBookings((prev) => prev.filter((x) => x.reservationId !== id))
    setBlockedPanelBooking(null)
    setSuccessToast({ show: true, message: 'Not available period removed' })
  }, [blockedPanelBooking, setSuccessToast])

  useEffect(() => {
    if (!previewReservationId) return
    closeManageDates()
    setSettingsOpen(false)
    setAiCoHostOpen(false)
    setBlockedPanelBooking(null)
  }, [previewReservationId, closeManageDates])

  useEffect(() => {
    if (manageDatesOpen) {
      setAiCoHostOpen(false)
      setBlockedPanelBooking(null)
    }
  }, [manageDatesOpen])

  useEffect(() => {
    if (checkInDate && checkOutDate) {
      setSettingsOpen(false)
      setAiCoHostOpen(false)
      setBlockedPanelBooking(null)
    }
  }, [checkInDate, checkOutDate])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (!aiCoHostOpen) return
      setAiCoHostOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aiCoHostOpen])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (!checkInDate && !checkOutDate) return
      closeManageDates()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [checkInDate, checkOutDate, closeManageDates])

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (calendarGridInteractiveRef.current?.contains(t)) return
      if (calendarSidePanelRef.current?.contains(t)) return
      if (!checkInDate && !checkOutDate) return
      closeManageDates()
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [checkInDate, checkOutDate, closeManageDates])

  const forEachSelectedDay = (fn: (d: Date) => void) => {
    if (!selectedListingId || !checkInDate || !checkOutDate) return
    let d = startOfDay(checkInDate)
    const end = startOfDay(checkOutDate)
    while (d.getTime() <= end.getTime()) {
      fn(new Date(d))
      d = addDays(d, 1)
    }
  }

  const applyPricingToRange = () => {
    if (!selectedListingId || !checkInDate || !checkOutDate) return
    const raw = managePricing.nightly.trim()
    // Empty input means the range had mixed prices and the user didn't set a
    // uniform value — leave each day's existing price unchanged.
    if (!raw) return
    const numericVal = parseFloat(raw.replace(/^\$/, ''))
    if (!Number.isFinite(numericVal) || numericVal <= 0) return
    const priceStr = `$${Math.round(numericVal)}`
    setCellOverrides((prev) => {
      const next = { ...prev }
      forEachSelectedDay((d) => {
        const k = cellOverrideKey(selectedListingId, d)
        next[k] = { ...next[k], price: priceStr }
      })
      return next
    })
  }

  const applyAvailabilityToRange = () => {
    if (!selectedListingId || !checkInDate || !checkOutDate) return
    const minNRaw = manageAvail.minNights.trim()
    const minN = minNRaw ? parseInt(minNRaw, 10) : NaN
    // Empty minNights means the range had mixed values — keep each day's own.
    const applyMinNights = Number.isFinite(minN) && minN > 0
    setCellOverrides((prev) => {
      const next = { ...prev }
      forEachSelectedDay((d) => {
        const k = cellOverrideKey(selectedListingId, d)
        const prevO = next[k] ?? {}
        next[k] = {
          ...prevO,
          checkInBlocked: !manageAvail.guestCanCheckIn,
          checkOutBlocked: !manageAvail.guestCanCheckOut,
          ...(applyMinNights ? { minNights: minN } : {}),
        }
      })
      return next
    })
  }

  const applyCalendarNoteToRange = () => {
    if (!selectedListingId || !checkInDate || !checkOutDate) return
    const t = manageNote.trim()
    const startK = calendarDayKey(checkInDate)
    const endK = calendarDayKey(checkOutDate)
    const editId = manageRangeNoteIdRef.current
    setCalendarNoteItems((prev) => {
      if (!t) {
        if (editId) {
          return prev.filter((n) => n.id !== editId)
        }
        return prev.filter(
          (n) => !noteOverlapsManageRange(n, selectedListingId, checkInDate, checkOutDate),
        )
      }
      if (editId) {
        return prev.map((n) =>
          n.id === editId
            ? {
                ...n,
                dayKey: startK,
                endDayKey: endK === startK ? undefined : endK,
                text: t,
              }
            : n,
        )
      }
      const withoutOverlaps = prev.filter(
        (n) => !noteOverlapsManageRange(n, selectedListingId, checkInDate, checkOutDate),
      )
      return [
        ...withoutOverlaps,
        {
          id: `note-${Date.now()}`,
          listingId: selectedListingId,
          dayKey: startK,
          endDayKey: endK === startK ? undefined : endK,
          text: t,
        },
      ]
    })
    if (t) {
      setVisibility((v) => ({ ...v, calendarNotes: true }))
    }
  }

  const addUserBlockedRange = () => {
    if (!selectedListingId || !checkInDate || !checkOutDate) return
    const start = startOfDay(checkInDate)
    const end = addDays(startOfDay(checkOutDate), 1)
    const id = `user-block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    setExtraBookings((prev) => [
      ...prev,
      {
        listingId: selectedListingId,
        start,
        end,
        label: 'Not Available',
        variant: 'gray',
        reservationId: id,
        isUserBlocked: true,
        hostNotes: manageNote.trim() || undefined,
      },
    ])
  }

  const saveManageForm = () => {
    applyCalendarNoteToRange()
    applyPricingToRange()
    applyAvailabilityToRange()
    manageFormBaselineRef.current = getManageFormSnapshot()
    // When the host flips Availability to "Blocked", also drop a gray "Not Available"
    // pill across the selected range — mirrors the + Add reservation flow.
    const shouldCreateBlock =
      !manageAvail.available && selectedListingId && checkInDate && checkOutDate
    if (shouldCreateBlock) {
      addUserBlockedRange()
      closeManageDates()
      setSuccessToast({ show: true, message: 'Range marked as blocked' })
      return
    }
    closeManageDates()
    setSuccessToast({ show: true, message: 'Changes saved' })
  }

  /** Commit the draft text as a new calendar note on the manage-dates start day. */
  const saveCalendarNoteDraft = () => {
    const text = addItemDraft.trim()
    if (!text || !selectedListingId || !checkInDate) return
    setCalendarNoteItems((prev) => [
      ...prev,
      {
        id: `note-${Date.now()}`,
        listingId: selectedListingId,
        dayKey: calendarDayKey(checkInDate),
        text,
      },
    ])
    setAddItemModal(null)
    setAddItemDraft('')
    // Also flip the visibility on so the user sees their note immediately.
    setVisibility((prev) => ({ ...prev, calendarNotes: true }))
    setSuccessToast({ show: true, message: 'Calendar note added' })
    closeManageDates()
  }

  /** Commit the draft name as a new task on the manage-dates start day. */
  const saveCalendarTaskDraft = () => {
    const name = addItemDraft.trim()
    if (!name || !selectedListingId || !checkInDate) return
    setCalendarTaskItems((prev) => [
      ...prev,
      {
        id: `task-${Date.now()}`,
        listingId: selectedListingId,
        dayKey: calendarDayKey(checkInDate),
        name,
      },
    ])
    setAddItemModal(null)
    setAddItemDraft('')
    setVisibility((prev) => ({ ...prev, tasks: true }))
    setSuccessToast({ show: true, message: 'Task added' })
    closeManageDates()
  }

  const appendFullSpanReservation = (variant: 'teal' | 'blue') => {
    if (!selectedListingId || !checkInDate || !checkOutDate || reservations.length === 0) return
    const b = fullSpanReservationBooking(
      selectedListingId,
      checkInDate,
      checkOutDate,
      variant,
      reservations
    )
    if (!b) return
    setExtraBookings((prev) => [...prev, b])
    closeManageDates()
    setSuccessToast({
      show: true,
      message:
        variant === 'blue'
          ? 'Owner stay created successfully'
          : 'Reservation created successfully',
    })
  }

  /** Simulate backend latency so async actions show a spinner. Prototype-only. */
  const runWithBusy = useCallback(
    async (
      flag: 'save' | 'reservation' | 'ownerStay',
      fn: () => void,
      delayMs = 420,
    ) => {
      if (manageBusy) return
      setManageBusy(flag)
      try {
        await new Promise((r) => setTimeout(r, delayMs))
        fn()
      } finally {
        setManageBusy(null)
      }
    },
    [manageBusy],
  )

  const openGridCalendarNote = useCallback(
    (noteId: string) => {
      const n = calendarNoteItems.find((x) => x.id === noteId)
      if (!n) return
      setGridNoteEdit({ id: noteId, text: n.text })
    },
    [calendarNoteItems],
  )

  const saveGridCalendarNote = useCallback(() => {
    if (!gridNoteEdit) return
    const t = gridNoteEdit.text.trim()
    setCalendarNoteItems((prev) => {
      if (!t) return prev.filter((x) => x.id !== gridNoteEdit.id)
      return prev.map((x) => (x.id === gridNoteEdit.id ? { ...x, text: t } : x))
    })
    setGridNoteEdit(null)
    setSuccessToast({ show: true, message: t ? 'Note updated' : 'Note removed' })
  }, [gridNoteEdit, setSuccessToast])

  const removeGridCalendarNote = useCallback(() => {
    if (!gridNoteEdit) return
    setCalendarNoteItems((prev) => prev.filter((x) => x.id !== gridNoteEdit.id))
    setGridNoteEdit(null)
    setSuccessToast({ show: true, message: 'Note removed' })
  }, [gridNoteEdit, setSuccessToast])

  const focusColumnIndex = useMemo(() => days.findIndex((d) => d.isFocus), [days])
  const showFocusLine = focusColumnIndex >= 0

  const filteredListings = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase()
    if (!q) return DEMO_LISTINGS
    return DEMO_LISTINGS.filter((l) => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q))
  }, [deferredSearchQuery])

  /** Keep a valid selection when the filtered list changes (search). */
  useEffect(() => {
    if (filteredListings.length === 0) return
    if (!selectedListingId || !filteredListings.some((l) => l.id === selectedListingId)) {
      setSelectedListingId(filteredListings[0]!.id)
    }
  }, [filteredListings, selectedListingId])

  const gridWidth = TIMELINE_DAYS * DAY_COL_PX

  /**
   * Auto-shrink the listing column to 50 % when the side panel is open and the
   * viewport is narrower than 1440 px — gives the calendar grid more room.
   * We set a CSS custom property on the outer grid div (via ref) so ALL listing
   * panel elements animate simultaneously without re-rendering every row.
   * The transition timing is tuned to match SlidingSidePanel's 320 ms slide.
   */
  const calendarOuterRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = calendarOuterRef.current
    if (!el) return
    const shouldCompact = calendarSidePanelOpen && window.innerWidth < 1440
    el.style.setProperty('--cal-listing-col', `${shouldCompact ? Math.round(LISTING_COL_PX * 0.5) : LISTING_COL_PX}px`)
  }, [calendarSidePanelOpen])

  useEffect(() => {
    const el = calendarOuterRef.current
    if (!el) return
    const onResize = () => {
      const shouldCompact = calendarSidePanelOpen && window.innerWidth < 1440
      el.style.setProperty('--cal-listing-col', `${shouldCompact ? Math.round(LISTING_COL_PX * 0.5) : LISTING_COL_PX}px`)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [calendarSidePanelOpen])

  const denseMinimalRow = useMemo(() => calendarMinimalDenseRow(visibility), [visibility])

  const laneDataByListingId = useMemo(() => {
    const m = new Map<string, { maxLane: number; items: CalendarLaneItem[] }>()
    for (const listing of filteredListings) {
      const rowBookings = bookings
        .filter((b) => b.listingId === listing.id)
        .filter((b) => bookingPassesFilters(b, visibility))
      const placed: Array<{ b: BookingBlock; range: CalendarLaneItem['range']; key: string }> = []
      for (const b of rowBookings) {
        const range = bookingDayRange(b, timelineStart, TIMELINE_DAYS)
        if (!range || range.width < 24) continue
        placed.push({
          b,
          range,
          key: `${b.listingId}-${b.label}-${b.start.toISOString()}`,
        })
      }
      if (placed.length === 0) {
        m.set(listing.id, { maxLane: -1, items: [] })
        continue
      }
      placed.sort(
        (a, x) =>
          a.range.startIdx - x.range.startIdx || a.range.endExclusive - x.range.endExclusive
      )
      const laneByKey = assignBookingLanes(
        placed.map((p) => ({
          key: p.key,
          startIdx: p.range.startIdx,
          endExclusive: p.range.endExclusive,
        }))
      )
      const maxLane = Math.max(...placed.map((p) => laneByKey.get(p.key) ?? 0))
      const items: CalendarLaneItem[] = placed.map((p) => ({
        ...p,
        lane: laneByKey.get(p.key) ?? 0,
      }))
      m.set(listing.id, { maxLane, items })
    }
    return m
  }, [filteredListings, bookings, timelineStart, visibility])

  const effectiveRowHeightsByListingId = useMemo(() => {
    const m = new Map<string, number>()
    for (const listing of filteredListings) {
      const hasRestriction = listingRowHasRestriction(listing.id, days, visibility, cellOverrides)
      const listH = listingColumnMinHeight(visibility)
      const dayMetaH = dayCellTopMetadataHeight(visibility, hasRestriction)

      const { maxLane, items } = laneDataByListingId.get(listing.id) ?? { maxLane: -1, items: [] }
      // Pill cells cover calendar details, so dayMetaH is irrelevant there.
      // BUT: cells without a pill on that specific day still need to show calendar details,
      // so we must include dayMetaH as a height floor for those empty-day cells.
      // Exception: when a bottom strip (notes/tasks) is also active, excluding dayMetaH
      // prevents excessive padding above the pill stack (the strip already adds height).
      const hasPills = items.length > 0
      const bottomStrip = bottomStripReserveForVisibility(visibility)
      const base = hasPills && bottomStrip > 0
        ? listH                            // strip is on — keep row tight, avoid double-inflation
        : Math.max(listH, dayMetaH)        // no strip — dayMetaH drives height for non-pill cells
      const isClean = isModernLayoutPillStyle(visibility.reservationPillStyle)
      const ph = pillHeightForCalendarSettings(visibility)
      const stackMin =
        items.length === 0
          ? 0
          : isClean
            ? minRowHeightForModernStack(maxLane)
            : minRowHeightForBarStack(maxLane, ph)
      // bottomStrip already computed above for the base calc

      /** min 6px + pill stack + 6px in the area above the note strip (pills are vertically centered there). */
      const itemLayerContentMinH =
        maxLane < 0
          ? 0
          : 2 * CAL_ITEM_LAYER_V_PAD +
            (isClean
              ? stackMin - 2 * MODERN_CELL_PILL_PAD_Y
              : stackMin - 2 * BAR_PILL_PAD_Y)

      m.set(listing.id, Math.max(base, stackMin, itemLayerContentMinH) + bottomStrip)
    }
    return m
  }, [
    filteredListings,
    days,
    visibility,
    cellOverrides,
    laneDataByListingId,
  ])

  type VisibilityPatch = Omit<Partial<CalendarSettingsVisibility>, 'pillDetails'> & {
    pillDetails?: Partial<CalendarPillDetails>
  }
  const patchVisibility = (patch: VisibilityPatch) => {
    setVisibility((prev) => {
      const next: CalendarSettingsVisibility = { ...prev, ...(patch as Partial<CalendarSettingsVisibility>) }
      if (patch.calendarPillColors) {
        next.calendarPillColors = { ...prev.calendarPillColors, ...patch.calendarPillColors }
      }
      if (patch.pillDetails) {
        next.pillDetails = { ...prev.pillDetails, ...patch.pillDetails }
      }
      return next
    })
  }

  useEffect(() => {
    if ((visibility.reservationPillStyle as string) === 'modern') {
      setVisibility((prev) => ({ ...prev, reservationPillStyle: 'standard' }))
    }
  }, [visibility.reservationPillStyle])

  /** Panning the timeline with chevrons resets horizontal scroll to the start of the new range. */
  useEffect(() => {
    const h = headerScrollRef.current
    const b = bodyScrollRef.current
    if (h) h.scrollLeft = 0
    if (b) b.scrollLeft = 0
  }, [timelineStart])

  useEffect(() => {
    if (!monthMenuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      const node = monthPickerRef.current
      if (node && !node.contains(event.target as Node)) {
        setMonthMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [monthMenuOpen])

  /**
   * Scroll the selected pill into view only when the preview opens or switches —
   * not when the user closes the panel (second click).
   */
  useEffect(() => {
    const cur = previewReservationId
    if (!cur) {
      previewScrollPrevRef.current = null
      return
    }

    const prev = previewScrollPrevRef.current
    const shouldScrollIntoView = prev !== cur
    previewScrollPrevRef.current = cur

    if (!shouldScrollIntoView) return

    const id = window.requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-calendar-booking="${CSS.escape(cur)}"]`)
      el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [previewReservationId])

  const monthlyMonthsToShow = useMemo(() => {
    const center = startOfMonth(timelineStart)
    return Array.from({ length: 18 }, (_, i) => addMonths(center, i - 6))
  }, [timelineStart])

  const monthlyBookingsForSelected = useMemo(
    () =>
      selectedListingId ? bookings.filter((b) => b.listingId === selectedListingId) : [],
    [bookings, selectedListingId],
  )

  const selectedListingEntity = useMemo(
    () => filteredListings.find((l) => l.id === selectedListingId) ?? filteredListings[0],
    [filteredListings, selectedListingId],
  )

  const openMonthlyForListing = useCallback((listingId: string) => {
    setSelectedListingId(listingId)
    setCalendarView('monthly')
  }, [])

  /** Monthly view: scroll the overflow container so the current month is at top.
   *  180 ms delay lets the AnimatePresence transition finish before DOM work. */
  useEffect(() => {
    if (calendarView !== 'monthly') return
    const m = startOfMonth(timelineStart)
    const id = ['cal-month', m.getFullYear(), m.getMonth()].join('-')
    const timer = window.setTimeout(() => {
      const target = document.getElementById(id)
      if (!target) return
      // Scroll the nearest overflow-y container instead of relying on scrollIntoView,
      // which may target the wrong ancestor when the monthly list is overflow-y:auto.
      let el: HTMLElement | null = target.parentElement
      while (el) {
        const oy = window.getComputedStyle(el).overflowY
        if (oy === 'auto' || oy === 'scroll') {
          el.scrollTop = target.offsetTop - el.offsetTop
          return
        }
        el = el.parentElement
      }
    }, 180)
    return () => window.clearTimeout(timer)
  }, [calendarView, timelineStart])

  return (
    <div className="flex min-h-0 min-w-0 flex-1 gap-0">
    <div
      ref={calendarOuterRef}
      className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e9eaeb] bg-white [contain:layout_paint] [will-change:width]"
      style={{ '--cal-listing-col': `${LISTING_COL_PX}px` } as React.CSSProperties}
    >
      {/* AI scan — subtle horizontal border sweep (top→bottom) when automation active */}
      <AnimatePresence>
        {aiPanelState.hasActiveAutomation && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-[60] overflow-hidden rounded-xl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {/* Horizontal sweep — a thin teal line descending top→bottom along the row borders */}
            <motion.div
              className="absolute left-0 right-0 h-px"
              style={{ background: 'linear-gradient(to right, transparent 0%, rgba(21,184,176,0.5) 20%, rgba(21,184,176,0.65) 50%, rgba(21,184,176,0.5) 80%, transparent 100%)' }}
              animate={{ top: ['-1%', '101%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
            />
            {/* Wide soft glow band following the line */}
            <motion.div
              className="absolute left-0 right-0 h-[32px]"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(21,184,176,0.03), transparent)' }}
              animate={{ top: ['-5%', '105%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Toolbar — Figma 245:13697 (row 1: views + month + actions; row 2: filter + search + dates) */}
      <div className="flex shrink-0 flex-col">
        <div
          className={cn(
            'flex h-[50px] min-h-[50px] w-full min-w-0 items-center justify-between gap-3 rounded-t-xl border border-[#e9eaeb] bg-white pl-3 pr-3',
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-[308px] shrink-0 items-stretch border-r border-[#d5d7da] pr-3">
              <div
                className="flex h-full min-h-0 w-full min-w-0 items-stretch gap-0.5 rounded-lg border border-[#e9eaeb] bg-[#fafafa] p-0.5 box-border"
                role="tablist"
                aria-label="Calendar view"
              >
                {(['multi', 'monthly', 'weekly'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={calendarView === key}
                    onClick={() => {
                      // When switching to weekly: ensure we show the week that
                      // contains today (or the focused week) — never pure past.
                      if (key === 'weekly') {
                        const today = startOfDay(new Date())
                        const weekOfTimeline = startOfWeekSunday(timelineStart)
                        const weekOfToday = startOfWeekSunday(today)
                        if (weekOfTimeline.getTime() < weekOfToday.getTime()) {
                          setTimelineStart(today)
                        }
                      }
                      setCalendarView(key)
                    }}
                    className={cn(
                      'flex min-h-0 min-w-0 flex-1 items-center justify-center rounded-lg px-3 py-0 text-sm font-semibold leading-5 transition-colors',
                      calendarView === key
                        ? 'border border-[#d5d7da] bg-white text-[#414651] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]'
                        : 'border border-transparent text-[#717680] hover:text-[#414651]',
                    )}
                  >
                    {key === 'multi' ? 'Multi' : key === 'monthly' ? 'Monthly' : 'Weekly'}
                  </button>
                ))}
              </div>
            </div>
            <div
              className="flex shrink-0 items-center gap-2"
              style={{ width: 'var(--cal-listing-col, 248px)', transition: 'width 0.32s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <div className="relative w-[170px] shrink-0">
                <div
                  ref={monthPickerRef}
                  className="relative flex h-9 w-full items-center justify-center gap-0 rounded-lg border border-[#d5d7da] bg-white px-1 text-[#414651] shadow-sm"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={calendarView === 'weekly' ? 'Previous week' : 'Previous month'}
                    className="size-9 min-h-9 min-w-9 shrink-0 p-0 text-[#717680] hover:bg-[#f5f5f5] hover:text-[#414651]"
                    onClick={() => {
                      setMonthMenuOpen(false)
                      if (calendarView === 'weekly') {
                        setTimelineStart((cur) => addDays(startOfDay(cur), -7))
                      } else {
                        setTimelineStart(startOfMonth(addMonths(startOfMonth(timelineStart), -1)))
                      }
                    }}
                  >
                    <ChevronLeft width={20} height={20} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 min-w-0 flex-1 px-0.5 text-center text-sm font-semibold leading-5 text-[#414651] hover:bg-[#fafafa]"
                    aria-haspopup="listbox"
                    aria-expanded={monthMenuOpen}
                    onClick={() => setMonthMenuOpen((o) => !o)}
                  >
                    {activeMonthYearLabel}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={calendarView === 'weekly' ? 'Next week' : 'Next month'}
                    className="size-9 min-h-9 min-w-9 shrink-0 p-0 text-[#717680] hover:bg-[#f5f5f5] hover:text-[#414651]"
                    onClick={() => {
                      setMonthMenuOpen(false)
                      if (calendarView === 'weekly') {
                        setTimelineStart((cur) => addDays(startOfDay(cur), 7))
                      } else {
                        setTimelineStart(startOfMonth(addMonths(startOfMonth(timelineStart), 1)))
                      }
                    }}
                  >
                    <ChevronRight width={20} height={20} />
                  </Button>
                  {monthMenuOpen ? (
                    <ul
                      className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-64 w-[200px] overflow-y-auto rounded-lg border border-[#e9eaeb] bg-white py-1 shadow-[0px_12px_16px_-4px_rgba(10,13,18,0.08),0px_4px_6px_-2px_rgba(10,13,18,0.03)]"
                      role="listbox"
                      aria-label="Select month"
                    >
                      {monthPickerOptions.map((m) => {
                        const selected = isSameMonth(m, timelineStart)
                        return (
                          <li key={m.toISOString()} role="none">
                            <button
                              type="button"
                              role="option"
                              aria-selected={selected}
                              className={cn(
                                'flex w-full px-3 py-2 text-left text-sm font-medium transition-colors',
                                selected
                                  ? 'bg-[#f0fdf9] font-semibold text-[#107569]'
                                  : 'text-[#414651] hover:bg-[#fafafa]',
                              )}
                              onClick={() => {
                                setTimelineStart(startOfMonth(m))
                                setMonthMenuOpen(false)
                              }}
                            >
                              {m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className={cn('h-9 shrink-0 px-3 text-sm font-semibold leading-5 shadow-sm', CALENDAR_OUTLINE_BTN)}
                onClick={() => {
                  const t = startOfDay(new Date())
                  setFocusDay(t)
                  if (calendarView === 'weekly') {
                    setTimelineStart(t)
                  } else {
                    setTimelineStart(addDays(t, -3))
                  }
                  setMonthMenuOpen(false)
                }}
              >
                Today
              </Button>
            </div>
          </div>
          <div
            className="flex shrink-0 items-center justify-end gap-2"
            style={{ width: 'var(--cal-listing-col, 248px)', transition: 'width 0.32s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <Button
              type="button"
              variant="outline"
              className={cn(
                'size-9 min-h-9 min-w-9 shrink-0 p-0 shadow-sm',
                CALENDAR_OUTLINE_BTN,
                settingsOpen && 'border-[#98a2b3] bg-[#fafafa]',
              )}
              aria-label="Calendar settings"
              aria-expanded={settingsOpen}
              onClick={() => {
                setSettingsOpen((o) => {
                  const next = !o
                  if (next) {
                    setAiCoHostOpen(false)
                    setBlockedPanelBooking(null)
                    closeManageDates()
                    onCloseReservationPreview?.()
                  }
                  return next
                })
              }}
            >
              <Settings01 width={20} height={20} className={TEXT_QUATERNARY} aria-hidden />
            </Button>
            {!aiCoHostOpen && (
              <button
                type="button"
                className={cn(
                  'relative flex size-9 min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-colors',
                  aiPanelState.hasActiveAutomation
                    ? 'border-[#f97316]/30 bg-[#fff7ed] text-[#f97316] hover:bg-[#fff0db]'
                    : cn('border-[#d5d7da] bg-white text-[#414651] hover:bg-[#fafafa]'),
                )}
                aria-label="Open AI Co-Host"
                onClick={() => {
                  setAiCoHostOpen(true)
                  setSettingsOpen(false)
                  setBlockedPanelBooking(null)
                  onCloseReservationPreview?.()
                }}
              >
                <Stars01 width={20} height={20} aria-hidden />
                {/* Pending activity badge */}
                {aiPanelState.pendingCount > 0 && (
                  <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#f04438] px-1 text-[9px] font-bold leading-none text-white shadow-sm">
                    {aiPanelState.pendingCount}
                  </span>
                )}
                {/* Scanning pulse when automation is active */}
                {aiPanelState.hasActiveAutomation && (
                  <motion.span
                    className="pointer-events-none absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#f97316]"
                    animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        ref={calendarGridInteractiveRef}
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        onPointerLeave={() => setHoveredColumnIndex(null)}
      >
        <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={calendarView}
          className="flex min-h-0 flex-1 flex-col"
          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
        {calendarView === 'multi' ? (
          <>
            <div
              className={cn(
                'flex h-12 min-h-12 shrink-0 items-center border-b border-l border-r border-[#e9eaeb] bg-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]',
              )}
            >
              <div
                className={cn(
                  'flex h-12 min-h-12 min-w-0 shrink-0 items-center gap-2 border-r border-[#e9eaeb] bg-white px-3 py-0',
                )}
                style={{ width: 'var(--cal-listing-col, 248px)', transition: 'width 0.32s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <Button
                  type="button"
                  variant="outline"
                  className={cn('h-9 gap-2 px-3 text-sm font-semibold shadow-sm', CALENDAR_OUTLINE_BTN)}
                  aria-label="Filter"
                >
                  <FilterLines width={20} height={20} className={TEXT_QUATERNARY} aria-hidden />
                  <span
                    className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full border border-[#e9eaeb] bg-[#fafafa] px-2 text-xs font-medium leading-none text-[#414651]"
                    aria-hidden
                  >
                    5
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn('size-9 min-h-9 min-w-9 shrink-0 p-0 shadow-sm', CALENDAR_OUTLINE_BTN)}
                  aria-label="Sort"
                >
                  <SwitchVertical01 width={20} height={20} className={TEXT_QUATERNARY} aria-hidden />
                </Button>
                <Input
                  ref={listingSearchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="min-w-0 flex-1 shadow-sm"
                />
              </div>
              <div
                ref={headerScrollRef}
                className="h-12 min-h-12 min-w-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [contain:layout]"
              >
                <CalendarDateHeaderStrip
                  days={days}
                  gridWidth={gridWidth}
                  hoveredColumnIndex={hoveredColumnIndex}
                  onColumnPointerEnter={handleColumnPointerEnter}
                />
              </div>
            </div>

            <div className="min-h-0 min-w-0 flex-1 border-x border-b border-[#e9eaeb] bg-white">
              <div
                ref={bodyScrollRef}
                className="h-full min-h-[320px] overflow-x-auto overflow-y-auto [scrollbar-width:thin] [contain:layout]"
              >
                <div className="flex min-w-min flex-col">
                  {filteredListings.map((listing) => {
                    const rh = effectiveRowHeightsByListingId.get(listing.id) ?? 32
                    const { items } = laneDataByListingId.get(listing.id) ?? { items: [] }
                    const notesForListing = calendarNoteItems.filter(
                      (n) => n.listingId === listing.id,
                    )
                    const tasksForListing = allCalendarTaskItems.filter(
                      (t) => t.listingId === listing.id,
                    )
                    return (
                      <CalendarGridListingRow
                        key={listing.id}
                        listing={listing}
                        visibility={visibility}
                        denseMinimalRow={denseMinimalRow}
                        rowHeight={rh}
                        laneItems={items}
                        gridWidth={gridWidth}
                        days={days}
                        cellOverrides={cellOverrides}
                        showFocusLine={showFocusLine}
                        focusColumnIndex={focusColumnIndex}
                        checkInDate={checkInDate}
                        checkOutDate={checkOutDate}
                        selectedListingId={selectedListingId}
                        isDayInManageRange={isDayInManageRange}
                        onListingColumnClick={handleListingColumnClick}
                        onDayCellClick={handleDayCellClick}
                        previewReservationId={previewReservationId}
                        blockedPanelReservationId={blockedPanelBooking?.reservationId ?? null}
                        onBookingPillActivate={handleBookingPillActivate}
                        reservationIdSet={reservationIdSet}
                        reservationById={reservationById}
                        isActiveSidebarListing={false}
                        showListingMonthlyLink
                        onOpenMonthlyForListing={openMonthlyForListing}
                        hoveredColumnIndex={hoveredColumnIndex}
                        onColumnPointerEnter={handleColumnPointerEnter}
                        cleanPillColors={cleanPillColors}
                        noteItems={notesForListing}
                        taskItems={tasksForListing}
                        timelineStart={timelineStart}
                        onCalendarNotePillClick={openGridCalendarNote}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        ) : calendarView === 'monthly' ? (
          selectedListingEntity ? (
          <>
            <div
              className={cn(
                'flex h-12 min-h-12 shrink-0 items-center border-b border-l border-r border-[#e9eaeb] bg-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]',
              )}
            >
              <div
                className={cn(
                  'flex h-12 min-h-12 min-w-0 shrink-0 items-center gap-2 border-r border-[#e9eaeb] bg-white px-3 py-0',
                )}
                style={{ width: 'var(--cal-listing-col, 248px)', transition: 'width 0.32s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <Button
                  type="button"
                  variant="outline"
                  className={cn('h-9 gap-2 px-3 text-sm font-semibold shadow-sm', CALENDAR_OUTLINE_BTN)}
                  aria-label="Filter"
                >
                  <FilterLines width={20} height={20} className={TEXT_QUATERNARY} aria-hidden />
                  <span
                    className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full border border-[#e9eaeb] bg-[#fafafa] px-2 text-xs font-medium leading-none text-[#414651]"
                    aria-hidden
                  >
                    5
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn('size-9 min-h-9 min-w-9 shrink-0 p-0 shadow-sm', CALENDAR_OUTLINE_BTN)}
                  aria-label="Sort"
                >
                  <SwitchVertical01 width={20} height={20} className={TEXT_QUATERNARY} aria-hidden />
                </Button>
                <Input
                  ref={listingSearchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="min-w-0 flex-1 shadow-sm"
                />
              </div>
              <div className="flex h-12 min-h-12 min-w-0 flex-1 items-stretch overflow-x-hidden bg-white px-3">
                {DOW_LETTER.map((dow, i) => (
                  <div
                    key={`${dow}-${i}`}
                    className={cn(
                      'flex min-h-0 min-w-0 flex-1 items-center justify-center text-xs font-medium leading-3 text-[#414651]',
                      i < 6 && 'border-r border-[#e9eaeb]',
                    )}
                  >
                    {dow}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 border-x border-b border-[#e9eaeb] bg-white">
              <div className="shrink-0 overflow-y-auto overflow-x-hidden border-r border-[#e9eaeb] bg-white [scrollbar-width:thin]">
                {filteredListings.map((listing) => (
                  <CalendarSidebarListingCard
                    key={listing.id}
                    listing={listing}
                    visibility={visibility}
                    denseMinimalRow={denseMinimalRow}
                    isSelected={listing.id === selectedListingId}
                    onSelect={handleListingColumnClick}
                    minRowHeight={effectiveRowHeightsByListingId.get(listing.id) ?? 32}
                  />
                ))}
              </div>
              <div
                ref={monthlyCalendarScrollRef}
                className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-white [scrollbar-width:thin] [contain:layout]"
              >
                <div className="flex w-full min-w-0 flex-col px-3 pb-6 pt-1">
                  {monthlyMonthsToShow.map((monthStart) => {
                    const weeks = getMonthGridWeekStarts(monthStart)
                    return (
                      <section
                        key={monthStart.toISOString()}
                        id={`cal-month-${monthStart.getFullYear()}-${monthStart.getMonth()}`}
                        className="mb-6 w-full min-w-0 scroll-mt-2 last:mb-2"
                      >
                        <h3 className="mb-2 text-lg font-semibold leading-7 text-[#181d27]">
                          {monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <div className="flex w-full min-w-0 flex-col overflow-hidden rounded-lg border border-[#e9eaeb] bg-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]">
                          {weeks.map((ws) => (
                            <CalendarMonthWeekRow
                              key={ws.getTime()}
                              weekStart={ws}
                              monthStart={monthStart}
                              listing={selectedListingEntity}
                              rowBookings={monthlyBookingsForSelected}
                              visibility={visibility}
                              cellOverrides={cellOverrides}
                              denseMinimalRow={denseMinimalRow}
                              checkInDate={checkInDate}
                              checkOutDate={checkOutDate}
                              selectedListingId={selectedListingId}
                              isDayInManageRange={isDayInManageRange}
                              onDayCellClick={handleDayCellClick}
                              previewReservationId={previewReservationId}
                              blockedPanelReservationId={blockedPanelBooking?.reservationId ?? null}
                              onBookingPillActivate={handleBookingPillActivate}
                              reservationIdSet={reservationIdSet}
                              reservationById={reservationById}
                              focusDay={focusDay}
                              cleanPillColors={cleanPillColors}
                              listingRowTargetHeight={
                                effectiveRowHeightsByListingId.get(selectedListingEntity.id) ?? 32
                              }
                              calendarNoteItems={calendarNoteItems.filter(
                                (n) => n.listingId === selectedListingEntity.id,
                              )}
                              calendarTaskItems={allCalendarTaskItems.filter(
                                (t) => t.listingId === selectedListingEntity.id,
                              )}
                            />
                          ))}
                        </div>
                      </section>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
          ) : (
            <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center border-x border-b border-[#e9eaeb] bg-[#fafafa] px-6 text-center">
              <p className="text-sm text-[#717680]">No listings match your search.</p>
            </div>
          )
        ) : (
          <CalendarWeeklyView
            anchorDate={timelineStart}
            focusDay={focusDay}
            filteredListings={filteredListings}
            selectedListingId={selectedListingId}
            bookings={bookings}
            visibility={visibility}
            cleanPillColors={cleanPillColors}
            calendarNoteItems={calendarNoteItems}
            calendarTaskItems={allCalendarTaskItems}
            denseMinimalRow={denseMinimalRow}
            effectiveRowHeightsByListingId={effectiveRowHeightsByListingId}
            reservationIdSet={reservationIdSet}
            reservationById={reservationById}
            previewReservationId={previewReservationId}
            blockedPanelReservationId={blockedPanelBooking?.reservationId ?? null}
            onSelectListing={handleListingColumnClick}
            onBookingPillActivate={handleBookingPillActivate}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        )}
        </motion.div>
        </AnimatePresence>
      </div>
    </div>

    <SlidingSidePanel
      show={calendarSidePanelOpen}
      motionKey="calendar-side-shell"
      panelWidthPx={412}
    >
      <div ref={calendarSidePanelRef} className="flex h-full min-h-0 flex-col overflow-hidden">
        <MotionPresence mode="wait">
          {manageDatesOpen ? (
            <motion.div
              key="calendar-manage"
              className="flex min-h-0 flex-1 flex-col"
              initial={reduceMotion ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
              transition={{
                duration: reduceMotion ? 0 : motionTokens.duration.normal,
                ease: motionTokens.easing.default,
              }}
            >
        <header className="flex h-[50px] min-h-[50px] shrink-0 items-center justify-between gap-2 border-b border-[#e9eaeb] px-4">
          <h2 className="min-w-0 flex-1 truncate pr-2 text-lg font-semibold leading-7 text-[#181d27]">
            {filteredListings.find((l) => l.id === selectedListingId)?.name ?? 'Listing'}
          </h2>
          <button
            type="button"
            onClick={closeManageDates}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#98a2b3] hover:bg-[#f6f9fc]"
            aria-label="Close"
          >
            <XClose className="h-5 w-5" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
          <div className="flex flex-col gap-4">
            {checkInDate && checkOutDate ? (
              <>
                <ManageDateFieldRow
                  label="Start date"
                  value={checkInDate}
                  onSelect={(d) => setCheckInDate(d)}
                />
                <ManageDateFieldRow
                  label="End date"
                  value={checkOutDate}
                  onSelect={(d) => setCheckOutDate(d)}
                />
                <div className="flex h-9 w-full min-w-0 items-center text-sm">
                  <p className="w-[180px] shrink-0 text-[#535862]">Number of nights</p>
                  <p className="min-w-0 flex-1 text-left font-medium tabular-nums text-[#181d27] sm:text-right">
                    {selectionNights > 0
                      ? `${selectionNights} night${selectionNights === 1 ? '' : 's'}`
                      : '—'}
                  </p>
                </div>
                <div className="w-full min-w-0">
                  <p className="mb-1 text-sm text-[#535862]">Calendar note</p>
                  <textarea
                    className="min-h-[48px] w-full resize-y rounded-lg border border-[#d5d7da] px-[14px] py-3 text-sm text-[#181d27] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] placeholder:text-[#717680] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/25"
                    placeholder="Add a note for this range"
                    value={manageNote}
                    onChange={(e) => setManageNote(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="h-px w-full bg-[#e9eaeb]" role="separator" />
                <div className="flex w-full min-w-0 items-center">
                  <span className="w-[180px] shrink-0 text-sm text-[#535862]">Price update type</span>
                  <div className="min-w-0 flex-1">
                    <select
                      className="h-9 w-full min-w-0 rounded-lg border border-[#d5d7da] bg-white px-3 text-sm text-[#181d27] shadow-sm"
                      value={managePricing.updateType}
                      onChange={(e) => setManagePricing((p) => ({ ...p, updateType: e.target.value }))}
                    >
                      <option value="flat">Flat rate update</option>
                    </select>
                  </div>
                </div>
                <div className="flex w-full min-w-0 items-center">
                  <span className="w-[180px] shrink-0 text-sm text-[#535862]">Nightly rate</span>
                  <Input
                    className="h-9 min-w-0 flex-1 border-2 border-[#d5d7da] text-sm focus:border-[#00b5b2] focus:ring-0"
                    value={managePricing.nightly}
                    onChange={(e) => setManagePricing((p) => ({ ...p, nightly: e.target.value }))}
                    inputMode="decimal"
                  />
                </div>
                <button
                  type="button"
                  className="w-full text-right text-sm font-medium text-[#339c99] hover:underline"
                  onClick={() => setManagePricingShowMore((o) => !o)}
                >
                  {managePricingShowMore ? 'Show less' : 'Show more'}
                </button>
                {managePricingShowMore ? (
                  <p className="text-sm text-[#414651]">Per-channel pricing can be set after channels are connected.</p>
                ) : null}
                <div className="h-px w-full bg-[#e9eaeb]" role="separator" />
                <div className="flex w-full min-w-0 items-center">
                  <p className="w-[180px] shrink-0 text-sm text-[#535862]">Availability</p>
                  <div
                    className="flex min-h-9 min-w-0 flex-1 gap-0.5 rounded-lg border border-[#e9eaeb] bg-[#fafafa] p-0.5"
                    role="group"
                    aria-label="Availability"
                  >
                    <button
                      type="button"
                      onClick={() => setManageAvail((a) => ({ ...a, available: true }))}
                      className={cn(
                        'flex min-h-0 min-w-0 flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-5 transition-colors',
                        manageAvail.available
                          ? 'border border-[#d5d7da] bg-white text-[#414651] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]'
                          : 'border border-transparent text-[#717680] hover:text-[#414651]',
                      )}
                    >
                      Available
                    </button>
                    <button
                      type="button"
                      onClick={() => setManageAvail((a) => ({ ...a, available: false }))}
                      className={cn(
                        'flex min-h-0 min-w-0 flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-5 transition-colors',
                        !manageAvail.available
                          ? 'border border-[#d5d7da] bg-white text-[#414651] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]'
                          : 'border border-transparent text-[#717680] hover:text-[#414651]',
                      )}
                    >
                      Blocked
                    </button>
                  </div>
                </div>
                <div className="flex w-full min-w-0 items-center">
                  <span className="w-[180px] shrink-0 text-sm text-[#535862]">Minimum nights</span>
                  <Input
                    className="h-9 min-w-0 flex-1 text-sm"
                    value={manageAvail.minNights}
                    onChange={(e) => setManageAvail((a) => ({ ...a, minNights: e.target.value }))}
                  />
                </div>
                <button
                  type="button"
                  className="w-full text-right text-sm font-medium text-[#339c99] hover:underline"
                  onClick={() => setManageAvailShowMore((o) => !o)}
                >
                  {manageAvailShowMore ? 'Show less' : 'Show more'}
                </button>
                {manageAvailShowMore ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex w-full min-w-0 items-center">
                      <span className="w-[180px] shrink-0 text-sm text-[#414651]">Maximum nights</span>
                      <Input
                        className="h-9 min-w-0 flex-1 text-sm"
                        value={manageAvail.maxNights}
                        onChange={(e) => setManageAvail((a) => ({ ...a, maxNights: e.target.value }))}
                      />
                    </div>
                    <SettingsToggleRow
                      label="Guest can check-in"
                      checked={manageAvail.guestCanCheckIn}
                      onChange={(v) => setManageAvail((a) => ({ ...a, guestCanCheckIn: v }))}
                    />
                    <SettingsToggleRow
                      label="Guest can check-out"
                      checked={manageAvail.guestCanCheckOut}
                      onChange={(v) => setManageAvail((a) => ({ ...a, guestCanCheckOut: v }))}
                    />
                    <Button type="button" variant="outline" className="w-full" onClick={addUserBlockedRange}>
                      Mark dates unavailable
                    </Button>
                  </div>
                ) : null}
                <div className="h-px w-full bg-[#e9eaeb]" role="separator" />
              </>
            ) : null}
          </div>
        </div>
        <footer className="shrink-0 border-t border-[#e9eaeb] px-4 py-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="relative">
              <Button
                ref={manageMoreTriggerRef}
                type="button"
                variant="outline"
                className="h-9 min-w-9 shrink-0 border-[#d5d7da] p-0 px-0"
                aria-label="More actions"
                aria-expanded={manageMoreOpen}
                onClick={() => setManageMoreOpen((o) => !o)}
              >
                <DotsVertical className="h-5 w-5" aria-hidden />
              </Button>
              {manageMoreOpen && typeof document !== 'undefined'
                ? createPortal(
                    <ul
                      ref={manageMoreMenuRef}
                      className="fixed z-[100] w-[220px] rounded-lg border border-[#e9eaeb] bg-white py-1 shadow-[0px_12px_16px_-4px_rgba(10,13,18,0.08),0px_4px_6px_-2px_rgba(10,13,18,0.03)]"
                      style={{ top: manageMorePos.top, left: manageMorePos.left }}
                      role="menu"
                    >
                      <li>
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#414651] hover:bg-[#fafafa]"
                          onClick={() => {
                            setManageMoreOpen(false)
                            setAddItemDraft('')
                            setAddItemModal('note')
                          }}
                        >
                          <span>Add calendar note</span>
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#414651] hover:bg-[#fafafa]"
                          onClick={() => {
                            setManageMoreOpen(false)
                            setAddItemDraft('')
                            setAddItemModal('task')
                          }}
                        >
                          <span>Add task</span>
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          role="menuitem"
                          disabled={manageBusy !== null}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#414651] hover:bg-[#fafafa] disabled:opacity-60"
                          onClick={() => {
                            setManageMoreOpen(false)
                            void runWithBusy('ownerStay', () => appendFullSpanReservation('blue'))
                          }}
                        >
                          {manageBusy === 'ownerStay' ? (
                            <ButtonSpinner className="h-4 w-4 shrink-0 text-[#717680]" />
                          ) : null}
                          <span>Add owner stay</span>
                        </button>
                      </li>
                    </ul>,
                    document.body,
                  )
                : null}
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={manageBusy !== null}
              className="inline-flex h-9 min-w-0 items-center gap-1.5 border-[#d5d7da] px-3 text-sm font-semibold shadow-sm disabled:opacity-60"
              onClick={() =>
                void runWithBusy('reservation', () => appendFullSpanReservation('teal'))
              }
            >
              {manageBusy === 'reservation' ? (
                <ButtonSpinner className="h-5 w-5 shrink-0 text-[#414651]" />
              ) : (
                <Plus className="h-5 w-5 shrink-0" aria-hidden />
              )}
              <span>Add reservation</span>
            </Button>
            <Button
              type="button"
              disabled={manageBusy !== null}
              onClick={() => void runWithBusy('save', saveManageForm)}
              className="inline-flex h-9 min-w-0 items-center gap-1.5 bg-[#181d27] px-3 text-sm hover:bg-[#101828] disabled:opacity-50"
            >
              {manageBusy === 'save' ? (
                <ButtonSpinner className="h-5 w-5 shrink-0 text-white" />
              ) : (
                <Save01 className="h-5 w-5 shrink-0" aria-hidden />
              )}
              <span>{manageBusy === 'save' ? 'Saving…' : 'Save'}</span>
            </Button>
          </div>
        </footer>
            </motion.div>
          ) : blockedPanelBooking ? (
            <motion.div
              key="calendar-blocked"
              className="flex min-h-0 flex-1 flex-col"
              initial={reduceMotion ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
              transition={{
                duration: reduceMotion ? 0 : motionTokens.duration.normal,
                ease: motionTokens.easing.default,
              }}
            >
              <header className="flex h-[50px] min-h-[50px] shrink-0 items-center justify-between gap-3 border-b border-[#e9eaeb] px-4">
                <h2 className="text-lg font-semibold leading-7 text-[#181d27]">Not available</h2>
                <button
                  type="button"
                  onClick={() => setBlockedPanelBooking(null)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#98a2b3] hover:bg-[#f6f9fc]"
                  aria-label="Close not available details"
                >
                  <XClose className="h-5 w-5" aria-hidden />
                </button>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                <div className="border-b border-[#e9eaeb] py-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => setBlockedSecDatesOpen((o) => !o)}
                  >
                    <span className="text-sm font-semibold text-[#181d27]">Dates</span>
                    <ChevronDown
                      className={cn(
                        'size-4 shrink-0 text-[#717680] transition-transform',
                        blockedSecDatesOpen && 'rotate-180',
                      )}
                      aria-hidden
                    />
                  </button>
                  {blockedSecDatesOpen ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="w-[180px] shrink-0 text-sm text-[#414651]">Start date</span>
                        <Input
                          type="date"
                          className="h-9 min-w-0 flex-1 text-sm"
                          value={blockedFormStart}
                          onChange={(e) => setBlockedFormStart(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-[180px] shrink-0 text-sm text-[#414651]">End date</span>
                        <Input
                          type="date"
                          className="h-9 min-w-0 flex-1 text-sm"
                          value={blockedFormEnd}
                          onChange={(e) => setBlockedFormEnd(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="border-b border-[#e9eaeb] py-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => setBlockedSecNotesOpen((o) => !o)}
                  >
                    <span className="text-sm font-semibold text-[#181d27]">Host notes</span>
                    <ChevronDown
                      className={cn(
                        'size-4 shrink-0 text-[#717680] transition-transform',
                        blockedSecNotesOpen && 'rotate-180',
                      )}
                      aria-hidden
                    />
                  </button>
                  {blockedSecNotesOpen ? (
                    <textarea
                      className="mt-3 min-h-[100px] w-full resize-y rounded-lg border border-[#d5d7da] px-3 py-2 text-sm text-[#181d27] placeholder:text-[#717680] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/25"
                      placeholder="Notes for your team (not shown to guests)"
                      value={blockedFormNotes}
                      onChange={(e) => setBlockedFormNotes(e.target.value)}
                    />
                  ) : null}
                </div>
              </div>
              <footer className="shrink-0 border-t border-[#e9eaeb] px-4 py-4">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button type="button" variant="outline" className="border-[#d5d7da]" onClick={removeBlockedBooking}>
                    Remove not available
                  </Button>
                  <Button type="button" className="min-w-0 px-4" onClick={applyBlockedEdits}>
                    Save changes
                  </Button>
                </div>
              </footer>
            </motion.div>
          ) : settingsOpen ? (
            <motion.div
              key="calendar-settings"
              className="flex min-h-0 flex-1 flex-col"
              initial={reduceMotion ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
              transition={{
                duration: reduceMotion ? 0 : motionTokens.duration.normal,
                ease: motionTokens.easing.default,
              }}
            >
      <header className="flex h-[50px] min-h-[50px] shrink-0 items-center justify-between border-b border-[#e9eaeb] px-4">
        <h2 className="text-lg font-semibold leading-7 text-[#181d27]">Calendar settings</h2>
        <button
          type="button"
          onClick={() => setSettingsOpen(false)}
          className="inline-flex size-8 items-center justify-center rounded-md text-[#98a2b3] hover:bg-[#f6f9fc]"
          aria-label="Close calendar settings"
        >
          <XClose className="size-5" aria-hidden />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
        <div className="flex flex-col gap-4">
          {/* Calendar settings body — Figma 310:8268 */}
          <CalendarSettingsSection title="Listing details">
            <CalendarSettingsCheckRow
              label="Listing image"
              checked={visibility.listingImage}
              onChange={(v) => patchVisibility({ listingImage: v })}
            />
            <CalendarSettingsCheckRow
              label="Listing ID"
              checked={visibility.listingId}
              onChange={(v) => patchVisibility({ listingId: v })}
            />
            <CalendarSettingsCheckRow
              label="Cleaning status"
              checked={visibility.cleaningStatus}
              onChange={(v) => patchVisibility({ cleaningStatus: v })}
            />
          </CalendarSettingsSection>

          <div className="h-px w-full bg-[#e9eaeb]" aria-hidden />

          <CalendarSettingsSection title="Calendar details">
            <CalendarSettingsCheckRow
              label="Nightly rate"
              checked={visibility.nightlyRate}
              onChange={(v) => patchVisibility({ nightlyRate: v })}
            />
            <CalendarSettingsCheckRow
              label="Minimum nights"
              checked={visibility.minimumNights}
              onChange={(v) => patchVisibility({ minimumNights: v })}
              labelMuted
            />
            <CalendarSettingsCheckRow
              label="Guests can't check-in"
              checked={visibility.guestsCantCheckIn}
              onChange={(v) => patchVisibility({ guestsCantCheckIn: v })}
              labelMuted
            />
            <CalendarSettingsCheckRow
              label="Guests can't check-out"
              checked={visibility.guestsCantCheckOut}
              onChange={(v) => patchVisibility({ guestsCantCheckOut: v })}
              labelMuted
            />
            <CalendarSettingsCheckRow
              label="Rule-sets"
              checked={visibility.ruleSets}
              onChange={(v) => patchVisibility({ ruleSets: v })}
              labelMuted
            />
          </CalendarSettingsSection>

          <div className="h-px w-full bg-[#e9eaeb]" aria-hidden />

          <CalendarSettingsSection title="Calendar items">
            <CalendarSettingsCheckRow
              label="Reservations"
              checked={visibility.reservations}
              onChange={(v) => patchVisibility({ reservations: v })}
            />
            <CalendarSettingsCheckRow
              label="Inquiries"
              checked={visibility.inquiries}
              onChange={(v) => patchVisibility({ inquiries: v })}
              labelMuted
            />
            <CalendarSettingsCheckRow
              label="Owner stays"
              checked={visibility.ownerStays}
              onChange={(v) => patchVisibility({ ownerStays: v })}
              labelMuted
            />
            <CalendarSettingsCheckRow
              label="Blocked days"
              checked={visibility.blockedDays}
              onChange={(v) => patchVisibility({ blockedDays: v })}
              labelMuted
            />
            <CalendarSettingsCheckRow
              label="Calendar notes"
              checked={visibility.calendarNotes}
              onChange={(v) => patchVisibility({ calendarNotes: v })}
              labelMuted
            />
            <CalendarSettingsCheckRow
              label="Tasks"
              checked={visibility.tasks}
              onChange={(v) => patchVisibility({ tasks: v })}
              labelMuted
            />
          </CalendarSettingsSection>

          <div className="h-px w-full bg-[#e9eaeb]" aria-hidden />

          <CalendarSettingsSection title="Reservation pill style">
            <div
              className="flex min-w-0 max-w-full flex-1 flex-col gap-2 sm:max-w-[200px]"
              role="radiogroup"
              aria-label="Reservation pill style"
            >
              {(['standard', 'compact', 'clean'] as const).map((style) => (
                <label key={style} className="flex cursor-pointer items-start gap-2">
                  <input
                    type="radio"
                    name="reservation-pill-style"
                    checked={visibility.reservationPillStyle === style}
                    onChange={() => patchVisibility({ reservationPillStyle: style })}
                    className="mt-0.5 size-4 shrink-0 border-[#d5d7da] accent-[#181d27] focus:outline-none focus:ring-2 focus:ring-[#15b8b0] focus:ring-offset-0"
                  />
                  <span className="text-sm font-normal capitalize leading-5 text-[#414651]">
                    {style === 'clean' ? 'Full' : style[0]!.toUpperCase() + style.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </CalendarSettingsSection>

          <div className="h-px w-full bg-[#e9eaeb]" aria-hidden />

          <CalendarSettingsSection title="Reservation pill details">
            <div className="flex min-w-0 max-w-full flex-1 flex-col gap-2">
              <CalendarSettingsCheckRow
                label="Guest photo"
                checked={visibility.pillDetails.guestPhoto}
                onChange={(v) => patchVisibility({ pillDetails: { guestPhoto: v } })}
                labelMuted
              />
              <CalendarSettingsCheckRow
                label="Channel avatar"
                checked={visibility.pillDetails.channelAvatar}
                onChange={(v) => patchVisibility({ pillDetails: { channelAvatar: v } })}
                labelMuted
              />
              <CalendarSettingsCheckRow
                label="Stay dates"
                checked={visibility.pillDetails.stayDates}
                onChange={(v) => patchVisibility({ pillDetails: { stayDates: v } })}
                labelMuted
              />
              <CalendarSettingsCheckRow
                label="Number of guests"
                checked={visibility.pillDetails.guestCount}
                onChange={(v) => patchVisibility({ pillDetails: { guestCount: v } })}
                labelMuted
              />
              <CalendarSettingsCheckRow
                label="Failed or unpaid indicator"
                checked={visibility.pillDetails.paymentIndicator}
                onChange={(v) => patchVisibility({ pillDetails: { paymentIndicator: v } })}
                labelMuted
              />
            </div>
          </CalendarSettingsSection>

          <div className="h-px w-full bg-[#e9eaeb]" aria-hidden />

          {CALENDAR_PILL_COLOR_PICKER_ROWS.map(({ key, label }) => {
            const v = cleanPillColors[key]
            return (
              <CalendarSettingsSection key={key} title={label}>
                <CalendarPillColorPickerRow
                  label={label}
                  value={v}
                  onChange={(hex) => patchVisibility({ calendarPillColors: { [key]: hex } })}
                />
              </CalendarSettingsSection>
            )
          })}
        </div>
      </div>
            </motion.div>
          ) : aiCoHostOpen ? (
            <motion.div
              key="calendar-ai-cohost"
              className="flex min-h-0 flex-1 flex-col"
              initial={reduceMotion ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
              transition={{
                duration: reduceMotion ? 0 : motionTokens.duration.normal,
                ease: motionTokens.easing.default,
              }}
            >
              <AiCoHostPanel
                onClose={() => setAiCoHostOpen(false)}
                calendarActions={calendarAiActions}
                calendarContext={{ visibleRangeDescription: visibleTimelineRangeLabel }}
                onStateChange={setAiPanelState}
              />
            </motion.div>
          ) : null}
        </MotionPresence>
      </div>
    </SlidingSidePanel>
    <Modal
      open={gridNoteEdit !== null}
      onClose={() => setGridNoteEdit(null)}
      title="Calendar note"
      size="sm"
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={removeGridCalendarNote}>
            Remove
          </Button>
          <Button
            type="button"
            className="bg-[#181d27] hover:bg-[#101828]"
            onClick={saveGridCalendarNote}
          >
            Save
          </Button>
        </div>
      }
    >
      <textarea
        className="min-h-[100px] w-full resize-y rounded-lg border border-[#d5d7da] px-3 py-2 text-sm text-[#181d27] shadow-sm placeholder:text-[#717680] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/25"
        value={gridNoteEdit?.text ?? ''}
        onChange={(e) => setGridNoteEdit((g) => (g ? { ...g, text: e.target.value } : g))}
        rows={4}
        placeholder="Add a note for this range"
      />
    </Modal>
    {addItemModal !== null
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={addItemModal === 'note' ? 'Add calendar note' : 'Add task'}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0f172a]/30 px-4"
            onClick={() => setAddItemModal(null)}
          >
            <div
              className="w-full max-w-[420px] rounded-xl border border-[#e9eaeb] bg-white p-5 shadow-[0px_20px_24px_-4px_rgba(10,13,18,0.08),0px_8px_8px_-4px_rgba(10,13,18,0.03)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold leading-7 text-[#181d27]">
                  {addItemModal === 'note' ? 'Add calendar note' : 'Add task'}
                </h3>
                <button
                  type="button"
                  onClick={() => setAddItemModal(null)}
                  className="inline-flex size-8 items-center justify-center rounded-md text-[#98a2b3] hover:bg-[#f6f9fc]"
                  aria-label="Close"
                >
                  <XClose className="size-5" aria-hidden />
                </button>
              </div>
              <div className="mt-3">
                {addItemModal === 'note' ? (
                  <textarea
                    autoFocus
                    value={addItemDraft}
                    onChange={(e) => setAddItemDraft(e.target.value)}
                    placeholder="Note text (shown to your team on this day)"
                    className="min-h-[120px] w-full resize-y rounded-lg border border-[#d5d7da] px-3 py-2 text-sm text-[#181d27] placeholder:text-[#717680] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/25"
                  />
                ) : (
                  <input
                    autoFocus
                    type="text"
                    value={addItemDraft}
                    onChange={(e) => setAddItemDraft(e.target.value)}
                    placeholder="Task name (e.g. Maintenance visit)"
                    className="h-10 w-full rounded-lg border border-[#d5d7da] px-3 text-sm text-[#181d27] placeholder:text-[#717680] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/25"
                  />
                )}
                <p className="mt-2 text-xs text-[#717680]">
                  {checkInDate
                    ? `Will be added to the selected day (${checkInDate.toLocaleDateString(
                        'en-US',
                        { month: 'short', day: 'numeric', year: 'numeric' },
                      )}).`
                    : 'Pick a day in the calendar first.'}
                </p>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 border-[#d5d7da] px-3"
                  onClick={() => setAddItemModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!addItemDraft.trim() || !checkInDate}
                  className="h-9 bg-[#181d27] px-3 text-sm text-white hover:bg-[#101828] disabled:opacity-50"
                  onClick={() =>
                    addItemModal === 'note' ? saveCalendarNoteDraft() : saveCalendarTaskDraft()
                  }
                >
                  {addItemModal === 'note' ? 'Add note' : 'Add task'}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null}
    </div>
  )
}
