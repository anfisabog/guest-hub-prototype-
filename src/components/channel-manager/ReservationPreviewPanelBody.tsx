import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Checkbox } from '@/components/ui'
import {
  RESERVATION_AVATAR_SRC_PANEL,
  reservationGuestAvatarUrl,
} from '@/lib/reservationGuestAvatar'
import { cn } from '@/lib/cn'
import {
  AlertTriangle,
  ArrowBlockUp,
  ArrowLeft,
  BellMinus,
  Calendar,
  Car01,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  ClockFastForward,
  CreditCard02,
  DotsHorizontal,
  Edit01,
  Gift01,
  Globe01,
  Grid01,
  Heart,
  HeartHand,
  Lightning01,
  Mail01,
  MarkerPin01,
  Maximize02,
  MinusCircle,
  Paperclip,
  Phone,
  RefreshCcw01,
  Save01,
  Send01,
  Settings01,
  Star01,
  Tag01,
  Tag02,
  Type01,
  UserCircle,
  Wifi,
  XClose,
  ZapFast,
} from '@untitled-ui/icons-react'
import type { OpenReservationOptions, ReservationListItem } from './ReservationListPage'

type InsightKey =
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
type SectionKey = 'keyInsights' | 'bookedBy' | 'stay' | 'notes' | 'guests' | 'payments'
type SidebarTabKey = 'reservation' | 'messages' | 'tasks' | 'guest'
type ChatAuthor = 'guest' | 'me'

interface ChatMessage {
  id: string
  author: ChatAuthor
  name: string
  time: string
  text: string
}

const SIDEBAR_VIEW_PREFERENCES_KEY = 'reservation_sidebar_view_preferences_v1'
const SIDEBAR_FIELD_LAYOUT_KEY = 'reservation_sidebar_field_layout_v1'
type SidebarFieldLayoutVariant = 'comfortable' | 'compact' | 'modern'

const SIDEBAR_SETTINGS_INSIGHT_ITEMS: { key: InsightKey; label: string }[] = [
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

const SIDEBAR_SETTINGS_SECTION_ITEMS: { key: SectionKey; label: string }[] = [
  { key: 'keyInsights', label: 'Key insights' },
  { key: 'bookedBy', label: 'Booked by' },
  { key: 'stay', label: 'Stay' },
  { key: 'notes', label: 'Notes' },
  { key: 'guests', label: 'Guests' },
  { key: 'payments', label: 'Payments' },
]

const ACCENT_MINT_BG = 'bg-[#f6f9fc]'
const PREVIEW_MINT_BORDER = 'border-[#d5ede9]'
const PREVIEW_MINT_ROW_BG = ACCENT_MINT_BG

const randomGuestReplies = [
  'Absolutely, that works for me. Thank you!',
  'Perfect, really appreciate the quick reply.',
  'Great, thanks! That sounds good.',
  'Amazing, thanks for helping with this.',
  'Sounds great. Looking forward to it!',
]

const sources = ['Airbnb', 'Booking.com', 'Direct', 'Vrbo'] as const
const statuses: ReservationListItem['status'][] = ['Reserved', 'Cancelled', 'Checked in', 'Pending']
const paymentStatuses: ReservationListItem['paymentStatus'][] = ['Paid', 'Unpaid', 'Partially paid']
const countries = ['United States', 'Spain', 'United Kingdom'] as const
const languages = ['English', 'Spanish', 'French'] as const
const currencies = ['USD ($)', 'EUR (€)', 'GBP (£)'] as const
const checkInTimes = ['2:00 PM', '3:00 PM', '4:00 PM'] as const
const checkOutTimes = ['9:00 AM', '10:00 AM', '11:00 AM'] as const
const listingNames = [
  'House in Barcelona',
  'City Loft Madrid',
  'Seaside Villa Lisbon',
  'Old Town Apartment',
  'Beachfront Condo Malaga',
  'Central Flat Valencia',
]
const guestCountSelectOptions = Array.from({ length: 10 }, (_, i) => String(i))
const rentalAgreementOptions = ['Signed', 'Not signed'] as const

const statusSidebarTextClass: Record<ReservationListItem['status'], string> = {
  Reserved: 'text-[#067647]',
  Cancelled: 'text-[#b42318]',
  'Checked in': 'text-[#175cd3]',
  Pending: 'text-[#b54708]',
}

const paymentStatusSidebarTextClass: Record<ReservationListItem['paymentStatus'], string> = {
  Paid: 'text-[#067647]',
  Unpaid: 'text-[#b42318]',
  'Partially paid': 'text-[#b54708]',
}

type SidebarDraft = {
  source: string
  status: string
  paymentStatus: string
  balanceDue: string
  remainingCharges: string
  totalAmount: string
  doorCode: string
  rentalAgreementStatus: string
  baseRate: string
  pmCommission: string
  guestName: string
  email: string
  phone: string
  country: string
  city: string
  language: string
  currency: string
  listingName: string
  checkIn: string
  checkInTime: string
  checkOut: string
  checkOutTime: string
  nights: string
  confirmationCode: string
  notes: string
  specialRequests: string
  guests: string
  children: string
  infants: string
  pets: string
}

type SidebarFieldDef = {
  label: string
  field: keyof SidebarDraft
  kind?: 'text' | 'textarea' | 'select'
  options?: readonly string[]
}

const insightKeyByDraftField: Partial<Record<keyof SidebarDraft, InsightKey>> = {
  source: 'channel',
  status: 'reservationStatus',
  paymentStatus: 'paymentStatus',
  balanceDue: 'balanceDue',
  remainingCharges: 'remainingCharges',
  totalAmount: 'total',
  doorCode: 'doorCode',
  rentalAgreementStatus: 'rentalAgreement',
  baseRate: 'baseRate',
  pmCommission: 'pmCommission',
}

function reservationToDraft(r: ReservationListItem): SidebarDraft {
  return {
    source: r.source,
    status: r.status,
    paymentStatus: r.paymentStatus,
    balanceDue: r.balanceDue,
    remainingCharges: r.remainingCharges,
    totalAmount: r.totalAmount,
    doorCode: r.doorCode,
    rentalAgreementStatus: r.rentalAgreementStatus,
    baseRate: r.baseRate,
    pmCommission: r.pmCommission,
    guestName: r.guestName,
    email: r.email,
    phone: r.phone,
    country: r.country,
    city: r.city,
    language: r.language,
    currency: r.currency,
    listingName: r.listingName,
    checkIn: r.checkIn,
    checkInTime: r.checkInTime,
    checkOut: r.checkOut,
    checkOutTime: r.checkOutTime,
    nights: String(r.nights),
    confirmationCode: r.confirmationCode,
    notes: r.notes,
    specialRequests: r.specialRequests,
    guests: String(r.guests),
    children: String(r.children),
    infants: String(r.infants),
    pets: String(r.pets),
  }
}

function partialFromDraft(d: SidebarDraft): Partial<ReservationListItem> {
  const n = (s: string) => Math.min(999, Math.max(0, parseInt(s, 10) || 0))
  return {
    source: d.source,
    status: d.status as ReservationListItem['status'],
    paymentStatus: d.paymentStatus as ReservationListItem['paymentStatus'],
    balanceDue: d.balanceDue,
    remainingCharges: d.remainingCharges,
    totalAmount: d.totalAmount,
    doorCode: d.doorCode.trim(),
    rentalAgreementStatus:
      d.rentalAgreementStatus === 'Signed' || d.rentalAgreementStatus === 'Not signed'
        ? d.rentalAgreementStatus
        : 'Not signed',
    baseRate: d.baseRate.trim(),
    pmCommission: d.pmCommission.trim(),
    guestName: d.guestName.trim(),
    email: d.email.trim(),
    phone: d.phone.trim(),
    country: d.country,
    city: d.city.trim(),
    language: d.language,
    currency: d.currency,
    listingName: d.listingName.trim(),
    checkIn: d.checkIn.trim(),
    checkInTime: d.checkInTime,
    checkOut: d.checkOut.trim(),
    checkOutTime: d.checkOutTime,
    nights: n(d.nights),
    confirmationCode: d.confirmationCode.trim(),
    notes: d.notes,
    specialRequests: d.specialRequests,
    guests: n(d.guests),
    children: n(d.children),
    infants: n(d.infants),
    pets: n(d.pets),
  }
}

function sidebarReadValue(r: ReservationListItem, field: keyof SidebarDraft): string {
  switch (field) {
    case 'nights':
      return `${r.nights} nights`
    case 'guests':
      return String(r.guests)
    case 'children':
      return String(r.children)
    case 'infants':
      return String(r.infants)
    case 'pets':
      return String(r.pets)
    default: {
      const v = r[field as keyof ReservationListItem]
      if (v === undefined || v === null) return ''
      return String(v)
    }
  }
}

// ─── Guest Tab ────────────────────────────────────────────────────────────────

function makeRng(seed: number) {
  let s = (seed + 1) * 1664525 + 1013904223
  return () => { s = (Math.imul(s, 1664525) + 1013904223) | 0; return (s >>> 0) / 0xffffffff }
}
function pickOne<T>(rng: () => number, arr: readonly T[]): T { return arr[Math.floor(rng() * arr.length)]! }
function pickN<T>(rng: () => number, arr: readonly T[], n: number): T[] {
  const copy = [...arr]; const out: T[] = []
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rng() * copy.length)
    out.push(copy.splice(idx, 1)[0]!)
  }
  return out
}

const PREF_POOL = [
  { label: 'Extra pillows',        Icon: Star01 },
  { label: 'Late check-out',       Icon: Clock },
  { label: 'Early check-in',       Icon: ClockFastForward },
  { label: 'Quiet room',           Icon: BellMinus },
  { label: 'High floor',           Icon: ArrowBlockUp },
  { label: 'Non-smoking room',     Icon: MinusCircle },
  { label: 'Baby cot requested',   Icon: Heart },
  { label: 'Vegan meals',          Icon: Tag01 },
  { label: 'Likely to extend',     Icon: RefreshCcw01 },
  { label: 'Pet-friendly setup',   Icon: HeartHand },
  { label: 'Gluten-free options',  Icon: Tag02 },
  { label: 'Gym access',           Icon: ZapFast },
  { label: 'Airport transfer',     Icon: Car01 },
  { label: 'WiFi for remote work', Icon: Wifi },
  { label: 'Anniversary stay',     Icon: Gift01 },
  { label: 'Loves local events',   Icon: MarkerPin01 },
] as const

const ORDER_POOL = ['Breakfast', 'Parking', 'Airport transfer', 'Late checkout', 'Extra towels', 'Wine bottle', 'Bicycle rental', 'City tour', 'Cot & pram', 'Daily cleaning']
const COMPANION_POOL = [
  'Thomas Weber', 'Sophie Müller', 'Lucas Rossi', 'Emma Chen', 'Carlos García',
  'Léa Dupont', 'Marco Bianchi', 'Anna Kowalski', 'Pierre Renault', 'Mia Schmidt',
  'Ethan Walsh', 'Chloé Fontaine', 'Matías Silva', 'Lucia Ferreira', 'Max Braun',
  'Isabel Reyes', 'Henrik Larsen', 'Astrid Holm', 'Federico Ruiz', 'Natasha Ivanova',
  'Olivia Park', 'Jin Wei', 'Emre Kaya', 'Saoirse Byrne', 'Matteo Conti',
]
const COMPANION_ROLES = ['Spouse', 'Child', 'Friend', 'Family', 'Colleague'] as const
const NOTE_POOL = [
  'Guest prefers towels changed every two days.',
  'Requested a cot for their infant.',
  'Celebrating their anniversary — arrange welcome gift.',
  'Allergic to feather pillows — synthetic only.',
  'Confirmed early check-in at 12:00 PM.',
  'Guest working remotely — needs stable WiFi.',
  'VIP guest — complimentary welcome basket arranged.',
  'Please add extra coat hangers to the room.',
  'Birthday on the third night — arrange small cake.',
  'Baby monitor requested from front desk.',
  'Guest travels with a service dog.',
  'Dietary restriction: no shellfish.',
  'Requested a parking spot near the elevator.',
  'High floor preference noted — assigned room 804.',
]
const NOTE_AUTHORS = ['John Kristoff', 'Maria R.', 'Carlos M.', 'Reception', 'Guest Services', 'Ana T.', 'Booking Bot']
const STREET_NAMES = ['Oak Ave', 'Maple Blvd', 'Park Lane', 'Sunset Dr', 'Elm Road', 'Harbour St', 'Victoria Rd', 'Calle Mayor']
const CITIES = ['Lisbon, PT', 'Madrid, ES', 'Barcelona, ES', 'Berlin, DE', 'Paris, FR', 'Amsterdam, NL', 'Rome, IT', 'Warsaw, PL', 'Prague, CZ']
const LANG_POOL = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Arabic', 'Japanese', 'Chinese', 'Dutch', 'Polish', 'Russian', 'Swedish', 'Turkish', 'Korean'] as const
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const PHONE_PREFIXES = ['+1', '+44', '+49', '+33', '+34', '+39', '+48', '+31', '+46', '+47', '+81', '+82', '+55'] as const

const COUNTRY_FLAGS: Record<string, string> = {
  'Spain': '🇪🇸', 'France': '🇫🇷', 'Germany': '🇩🇪', 'Italy': '🇮🇹',
  'Portugal': '🇵🇹', 'Netherlands': '🇳🇱', 'Poland': '🇵🇱', 'Sweden': '🇸🇪',
  'Norway': '🇳🇴', 'Denmark': '🇩🇰', 'Finland': '🇫🇮', 'Belgium': '🇧🇪',
  'Austria': '🇦🇹', 'Switzerland': '🇨🇭', 'Czech Republic': '🇨🇿', 'Hungary': '🇭🇺',
  'Romania': '🇷🇴', 'Greece': '🇬🇷', 'Ireland': '🇮🇪', 'Turkey': '🇹🇷',
  'Russia': '🇷🇺', 'USA': '🇺🇸', 'United States': '🇺🇸', 'UK': '🇬🇧',
  'United Kingdom': '🇬🇧', 'Australia': '🇦🇺', 'Canada': '🇨🇦', 'Japan': '🇯🇵',
  'South Korea': '🇰🇷', 'China': '🇨🇳', 'India': '🇮🇳', 'Brazil': '🇧🇷',
  'Argentina': '🇦🇷', 'Mexico': '🇲🇽', 'Colombia': '🇨🇴', 'Chile': '🇨🇱',
  'Morocco': '🇲🇦', 'South Africa': '🇿🇦', 'UAE': '🇦🇪',
}

function birthdayToISO(s: string): string {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const parts = s.trim().split(' ')
  if (parts.length !== 3) return ''
  const month = months.indexOf(parts[1]!) + 1
  if (month === 0) return ''
  return `${parts[2]}-${String(month).padStart(2,'0')}-${String(Number(parts[0])).padStart(2,'0')}`
}

function isoToBirthday(s: string): string {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const parts = s.split('-')
  if (parts.length !== 3) return s
  return `${Number(parts[2])} ${months[Number(parts[1]) - 1]!} ${parts[0]}`
}

function buildGuestData(id: number, guestName: string) {
  const rng = makeRng(id)
  const nameParts = guestName.toLowerCase().replace(/\s+/g, '.')
  const emailDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'proton.me']
  const email = `${nameParts}@${pickOne(rng, emailDomains)}`
  const prefix = pickOne(rng, PHONE_PREFIXES)
  const phone = `${prefix} ${Math.floor(rng() * 900 + 100)}-${String(Math.floor(rng() * 9000 + 1000))}`
  const year = 1958 + Math.floor(rng() * 37)
  const month = pickOne(rng, MONTH_NAMES)
  const day = Math.floor(rng() * 27) + 1
  const birthday = `${day} ${month} ${year}`
  const langCount = 1 + Math.floor(rng() * 3)
  const languages = pickN(rng, LANG_POOL, langCount)
  const prefCount = 2 + Math.floor(rng() * 4)
  const preferences = pickN(rng, PREF_POOL, prefCount)
  const orderCount = 1 + Math.floor(rng() * 3)
  const frequentOrders = pickN(rng, ORDER_POOL, orderCount).map(label => ({ label, count: 2 + Math.floor(rng() * 9) }))
  const cardCount = 1 + Math.floor(rng() * 2)
  const paymentMethods = Array.from({ length: cardCount }, () => ({
    type: rng() > 0.5 ? 'visa' : 'mastercard' as 'visa' | 'mastercard',
    last4: String(Math.floor(rng() * 9000 + 1000)),
  }))
  const companionCount = Math.floor(rng() * 3)
  const companions = pickN(rng, COMPANION_POOL, companionCount).map(name => ({ name, role: pickOne(rng, COMPANION_ROLES) }))
  const noteCount = 1 + Math.floor(rng() * 2)
  const notes = pickN(rng, NOTE_POOL, noteCount).map(text => ({
    text,
    author: pickOne(rng, NOTE_AUTHORS),
    date: `${Math.floor(rng() * 12) + 1}/${Math.floor(rng() * 27) + 1}/2023 ${Math.floor(rng() * 12) + 8}:${String(Math.floor(rng() * 60)).padStart(2, '0')} ${rng() > 0.5 ? 'AM' : 'PM'}`,
  }))
  const aptNum = Math.floor(rng() * 900) + 100
  const streetNum = Math.floor(rng() * 900) + 10
  const primaryAddr = `${streetNum} ${pickOne(rng, STREET_NAMES)} Apt ${aptNum}, ${pickOne(rng, CITIES)}`
  const addresses = [primaryAddr]
  if (rng() > 0.55) addresses.push(`${Math.floor(rng() * 900) + 10} ${pickOne(rng, STREET_NAMES)}, ${pickOne(rng, CITIES)}`)
  const hasDuplicate = rng() < 0.25
  return { email, phone, birthday, languages, preferences, frequentOrders, paymentMethods, companions, notes, addresses, hasDuplicate }
}

const EDIT_INPUT = 'w-full rounded-lg border border-[#d5d7da] bg-white px-3 text-[13px] font-medium leading-5 text-[#101828] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:border-[#15b8b0] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/20 h-9'
const EDIT_TEXTAREA = 'w-full rounded-lg border border-[#d5d7da] bg-white px-3 py-2.5 text-[13px] font-medium leading-5 text-[#101828] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:border-[#15b8b0] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/20 resize-none min-h-[72px]'
const DYN = 'text-[13px] font-medium leading-5 text-[#101828]'
const META = 'text-[11px] leading-4 text-[#98a2b3]'
const SECTION_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]'

function GuestAccordion({
  title, badge, children, defaultOpen = true,
}: { title: string; badge?: number; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="overflow-hidden rounded-xl border border-[#e9eaeb] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.04)]">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="flex w-full items-center justify-between gap-2 border-b border-[#f2f4f7] px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-1.5">
          <h3 className={SECTION_LABEL}>{title}</h3>
          {badge !== undefined && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#f2f4f7] px-1 text-[10px] font-semibold text-[#667085]">{badge}</span>
          )}
        </div>
        <ChevronUp className={cn('h-4 w-4 shrink-0 text-[#98a2b3] transition-transform', open ? '' : 'rotate-180')} aria-hidden />
      </button>
      {open && <div className="px-3 py-3">{children}</div>}
    </section>
  )
}

function CompanionSubPage({
  companion, mainGuestName, onBack,
}: { companion: { name: string; role: string }; mainGuestName: string; onBack: () => void }) {
  const id = Math.abs(companion.name.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0))
  const d = buildGuestData(id, companion.name)
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 space-y-3">
      <button type="button" onClick={onBack}
        className="flex items-center gap-1.5 text-[12px] font-medium text-[#667085] hover:text-[#101828] transition-colors mb-1">
        <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Back to {mainGuestName}
      </button>
      <div className="flex items-center gap-3 py-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f2f4f7] text-[14px] font-semibold text-[#667085]">
          {companion.name[0]}
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[#101828]">{companion.name}</p>
          <p className="text-[12px] text-[#667085]">{companion.role} of {mainGuestName}</p>
        </div>
      </div>
      <GuestAccordion title="Guest details">
        <div className="divide-y divide-[#f2f4f7] -mx-3 -mt-3">
          {[
            { label: 'Email',         value: d.email },
            { label: 'Phone',         value: d.phone },
            { label: 'Date of birth', value: d.birthday },
            { label: 'Languages',     value: d.languages.join(', ') },
          ].map(({ label, value }) => (
            <div key={label} className="grid grid-cols-[120px_1fr] items-center gap-3 px-3 py-2.5">
              <span className="text-[12px] font-medium text-[#667085]">{label}</span>
              <span className={DYN}>{value}</span>
            </div>
          ))}
        </div>
      </GuestAccordion>
      {d.preferences.length > 0 && (
        <GuestAccordion title="Guest preferences" badge={d.preferences.length}>
          <div className="flex flex-wrap gap-1.5">
            {d.preferences.map(({ label, Icon }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-[#e4e7ec] bg-[#f9fafb] px-2.5 py-1 text-[12px] font-medium leading-4 text-[#344054]">
                <Icon className="h-3.5 w-3.5 shrink-0 text-[#667085]" aria-hidden />
                {label}
              </span>
            ))}
          </div>
        </GuestAccordion>
      )}
      {d.notes.length > 0 && (
        <GuestAccordion title="Notes" badge={d.notes.length}>
          <div className="space-y-4">
            {d.notes.map((note, i) => (
              <div key={i}>
                <p className={DYN}>{note.text}</p>
                <p className={cn(META, 'mt-1')}>{note.author}, {note.date}</p>
              </div>
            ))}
          </div>
        </GuestAccordion>
      )}
    </div>
  )
}

type GuestDraft = {
  name: string; email: string; phone: string; birthday: string; languages: string
  country: string; city: string; currency: string
  notes: { text: string; author: string; date: string }[]
  paymentMethods: { type: 'visa' | 'mastercard'; last4: string }[]
  companions: { name: string; role: string }[]
  addresses: string[]
}

function GuestTab({ reservation }: { reservation: ReservationListItem }) {
  const d = buildGuestData(Number(reservation.id), reservation.guestName)
  const [editing, setEditing] = useState(false)
  const [companionView, setCompanionView] = useState<{ name: string; role: string } | null>(null)

  const initialNotes = [
    ...(reservation.notes ? [{ text: reservation.notes, author: 'Guest (booking)', date: '' }] : []),
    ...d.notes,
  ]

  const [draft, setDraft] = useState<GuestDraft>({
    name: reservation.guestName, email: d.email, phone: d.phone,
    birthday: d.birthday, languages: d.languages.join(', '),
    country: reservation.country, city: reservation.city, currency: reservation.currency,
    notes: initialNotes,
    paymentMethods: d.paymentMethods,
    companions: d.companions,
    addresses: d.addresses,
  })

  const resetDraft = () => {
    setDraft({
      name: reservation.guestName, email: d.email, phone: d.phone,
      birthday: d.birthday, languages: d.languages.join(', '),
      country: reservation.country, city: reservation.city, currency: reservation.currency,
      notes: initialNotes,
      paymentMethods: d.paymentMethods,
      companions: d.companions,
      addresses: d.addresses,
    })
    setEditing(false)
  }

  if (companionView) {
    return (
      <CompanionSubPage
        companion={companionView}
        mainGuestName={reservation.guestName}
        onBack={() => setCompanionView(null)}
      />
    )
  }

  return (
    <>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">

        {/* Guest details */}
        <GuestAccordion title="Guest details">
          <div className="divide-y divide-[#f2f4f7] -mx-3 -mt-3">
            {(
              [
                { label: 'Name',          key: 'name' as const },
                { label: 'Email',         key: 'email' as const },
                { label: 'Phone',         key: 'phone' as const },
                { label: 'Date of birth', key: 'birthday' as const },
                { label: 'Languages',     key: 'languages' as const },
                { label: 'Country',       key: 'country' as const },
                { label: 'City',          key: 'city' as const },
                { label: 'Currency',      key: 'currency' as const },
              ] as { label: string; key: keyof Pick<GuestDraft, 'name'|'email'|'phone'|'birthday'|'languages'|'country'|'city'|'currency'> }[]
            ).map(({ label, key }) => (
              <div key={label} className="grid grid-cols-[120px_1fr] items-center gap-3 px-3 py-2.5">
                <span className="text-[12px] font-medium text-[#667085]">{label}</span>
                {editing ? (
                  key === 'birthday' ? (
                    <input
                      type="date"
                      className={EDIT_INPUT}
                      value={birthdayToISO(draft.birthday)}
                      onChange={e => setDraft(p => ({ ...p, birthday: isoToBirthday(e.target.value) }))}
                    />
                  ) : (
                    <input className={EDIT_INPUT} value={draft[key]} onChange={e => setDraft(p => ({ ...p, [key]: e.target.value }))} />
                  )
                ) : (
                  key === 'country' ? (
                    <span className={DYN}>{COUNTRY_FLAGS[draft.country] ? `${COUNTRY_FLAGS[draft.country]} ` : ''}{draft.country}</span>
                  ) : (
                    <span className={DYN}>{draft[key]}</span>
                  )
                )}
              </div>
            ))}
          </div>
        </GuestAccordion>

        {/* Guest preferences */}
        <GuestAccordion title="Guest preferences" badge={d.preferences.length}>
          <div className="flex flex-wrap gap-1.5">
            {d.preferences.map(({ label, Icon }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-[#e4e7ec] bg-[#f9fafb] px-2.5 py-1 text-[12px] font-medium leading-4 text-[#344054]">
                <Icon className="h-3.5 w-3.5 shrink-0 text-[#667085]" aria-hidden />
                {label}
              </span>
            ))}
          </div>
          {editing && (
            <div className="mt-3">
              <Button variant="outline" size="sm" className="w-full">Add preference</Button>
            </div>
          )}
        </GuestAccordion>

        {/* Notes */}
        <GuestAccordion title="Notes" badge={draft.notes.length}>
          <div className="space-y-4">
            {draft.notes.map((note, i) => (
              <div key={i}>
                {editing ? (
                  <textarea
                    className={EDIT_TEXTAREA}
                    value={note.text}
                    rows={3}
                    onChange={e => setDraft(p => ({ ...p, notes: p.notes.map((n, j) => j === i ? { ...n, text: e.target.value } : n) }))}
                  />
                ) : (
                  <p className={DYN}>{note.text}</p>
                )}
                {note.date ? <p className={cn(META, 'mt-1')}>{note.author}, {note.date}</p> : <p className={cn(META, 'mt-1')}>{note.author}</p>}
              </div>
            ))}
          </div>
          {editing && (
            <div className="mt-3">
              <Button variant="outline" size="sm" className="w-full">Add note</Button>
            </div>
          )}
        </GuestAccordion>

        {/* Payment methods */}
        <GuestAccordion title="Payment methods" badge={draft.paymentMethods.length}>
          <div className="space-y-2">
            {draft.paymentMethods.map((card, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-lg border border-[#e9eaeb] bg-[#f9fafb] px-3 py-2.5">
                <img src={`/${card.type}.svg`} alt={card.type} className="h-6 w-8 shrink-0 rounded object-contain" />
                <span className={cn(DYN, 'flex-1')}>••••{card.last4}</span>
                {editing && (
                  <button type="button" onClick={() => setDraft(p => ({ ...p, paymentMethods: p.paymentMethods.filter((_, j) => j !== i) }))}
                    className="text-[#98a2b3] hover:text-[#f04438]" aria-label="Remove card">
                    <XClose className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <div className="mt-3">
              <Button variant="outline" size="sm" className="w-full">Add payment method</Button>
            </div>
          )}
        </GuestAccordion>

        {/* Companions */}
        <GuestAccordion title="Companions" badge={draft.companions.length}>
          {draft.companions.length > 0 ? (
            <div className="space-y-3">
              {draft.companions.map((c, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f2f4f7] text-[12px] font-semibold text-[#667085]">
                    {c.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    {editing ? (
                      <p className={cn(DYN, 'text-[#0086a8]')}>{c.name}</p>
                    ) : (
                      <button type="button" onClick={() => setCompanionView(c)}
                        className={cn(DYN, 'text-[#0086a8] hover:underline text-left')}>
                        {c.name}
                      </button>
                    )}
                    <p className={META}>{c.role}</p>
                  </div>
                  {editing && (
                    <button type="button" onClick={() => setDraft(p => ({ ...p, companions: p.companions.filter((_, j) => j !== i) }))}
                      className="shrink-0 text-[12px] font-medium text-[#667085] hover:text-[#f04438]" aria-label="Detach companion">
                      Detach
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={cn(META, 'py-1')}>No companions added yet.</p>
          )}
          {editing && (
            <div className="mt-3">
              <Button variant="outline" size="sm" className="w-full">Add companion</Button>
            </div>
          )}
        </GuestAccordion>

        {/* Address book */}
        <GuestAccordion title="Address book" badge={draft.addresses.length}>
          <div className="space-y-3">
            {draft.addresses.map((addr, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className={DYN}>{addr}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {i === 0 && <span className="rounded-full border border-[#e9eaeb] bg-[#f9fafb] px-2 py-0.5 text-[11px] font-medium text-[#667085]">Primary</span>}
                  {editing && (
                    <button type="button" onClick={() => setDraft(p => ({ ...p, addresses: p.addresses.filter((_, j) => j !== i) }))}
                      className="text-[#98a2b3] hover:text-[#f04438]" aria-label="Remove address">
                      <XClose className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {editing && (
            <div className="mt-3">
              <Button variant="outline" size="sm" className="w-full">Add address</Button>
            </div>
          )}
        </GuestAccordion>

        {/* Duplicates */}
        {d.hasDuplicate && (
          <GuestAccordion title="Duplicates" badge={1} defaultOpen={false}>
            <div className="flex items-start gap-2.5 rounded-lg border border-[#fec84b] bg-[#fffaeb] px-3 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#b54708]" aria-hidden />
              <p className={DYN}>Several possible matches for {reservation.guestName}</p>
            </div>
            {editing && (
              <div className="mt-3">
                <Button variant="outline" size="sm" className="w-full">Show profile matches</Button>
              </div>
            )}
          </GuestAccordion>
        )}

      </div>

      {/* Footer */}
      <footer className="flex h-[60px] shrink-0 items-center justify-end gap-2 border-t border-[#e9eaeb] bg-white px-4">
        {editing ? (
          <>
            <Button variant="outline" size="sm" onClick={resetDraft}>Cancel</Button>
            <Button variant="primary" size="sm" className="gap-1.5" onClick={() => setEditing(false)}>
              <Save01 className="h-4 w-4 shrink-0" aria-hidden />
              Save
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" className="gap-1.5">
              <DotsHorizontal className="h-4 w-4 shrink-0" aria-hidden />
              More
            </Button>
            <Button variant="outline" size="sm" className="!px-2.5" aria-label="Guest options">
              <UserCircle className="h-4 w-4 shrink-0" aria-hidden />
            </Button>
            <Button variant="primary" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
              <Edit01 className="h-4 w-4 shrink-0" aria-hidden />
              Edit
            </Button>
          </>
        )}
      </footer>
    </>
  )
}

export function ReservationPreviewPanelBody({
  reservation,
  onClose,
  onOpenFullscreen,
  onApplyReservationPatch,
  paginationCompact = false,
}: {
  reservation: ReservationListItem
  onClose: () => void
  onOpenFullscreen: (r: ReservationListItem, options?: OpenReservationOptions) => void
  onApplyReservationPatch: (id: string, partial: Partial<ReservationListItem>) => void
  paginationCompact?: boolean
}) {
  const [sidebarEditing, setSidebarEditing] = useState(false)
  const [sidebarDraft, setSidebarDraft] = useState<SidebarDraft | null>(null)
  const [sidebarTab, setSidebarTab] = useState<SidebarTabKey>('reservation')
  const [messageDraft, setMessageDraft] = useState('')
  const [messageThreads, setMessageThreads] = useState<Record<string, ChatMessage[]>>({})
  const [showSettingsPopover, setShowSettingsPopover] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'keyInsights' | 'sections'>('keyInsights')
  const [sidebarFieldLayout, setSidebarFieldLayout] = useState<SidebarFieldLayoutVariant>(() => {
    if (typeof window === 'undefined') return 'compact'
    try {
      const raw = window.sessionStorage.getItem(SIDEBAR_FIELD_LAYOUT_KEY)
      // Only accept 'compact' — Comfortable and Modern have been removed.
      if (raw === 'compact') return raw
    } catch {
      /* ignore */
    }
    return 'compact'
  })
  const [sidebarMoreMenuOpen, setSidebarMoreMenuOpen] = useState(false)
  const sidebarMoreMenuRef = useRef<HTMLDivElement>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    keyInsights: true,
    bookedBy: true,
    stay: true,
    notes: true,
    guests: true,
    payments: true,
  })
  const [viewPreferences, setViewPreferences] = useState<{
    insights: Record<InsightKey, boolean>
    sections: Record<SectionKey, boolean>
  }>(() => {
    const defaults = {
      insights: {
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
      } as Record<InsightKey, boolean>,
      sections: {
        keyInsights: true,
        bookedBy: true,
        stay: true,
        notes: true,
        guests: true,
        payments: true,
      } as Record<SectionKey, boolean>,
    }

    if (typeof window === 'undefined') return defaults
    try {
      const raw = window.localStorage.getItem(SIDEBAR_VIEW_PREFERENCES_KEY)
      if (!raw) return defaults
      const parsed = JSON.parse(raw) as typeof defaults
      return {
        insights: { ...defaults.insights, ...(parsed.insights ?? {}) },
        sections: { ...defaults.sections, ...(parsed.sections ?? {}) },
      }
    } catch {
      return defaults
    }
  })
  const settingsPopoverRef = useRef<HTMLDivElement>(null)
  const settingsTriggerRef = useRef<HTMLButtonElement>(null)

  const previewAvatarUrl = reservationGuestAvatarUrl(reservation.id, RESERVATION_AVATAR_SRC_PANEL)
  const activeThread = messageThreads[reservation.id] ?? []

  const sidebarDirty = useMemo(() => {
    if (!sidebarDraft) return false
    return JSON.stringify(sidebarDraft) !== JSON.stringify(reservationToDraft(reservation))
  }, [sidebarDraft, reservation])

  const resetSidebarEdit = useCallback(() => {
    setSidebarEditing(false)
    setSidebarDraft(null)
  }, [])

  function buildInitialMessages(r: ReservationListItem): ChatMessage[] {
    return [
      {
        id: `${r.id}-guest-1`,
        author: 'guest',
        name: r.guestName,
        time: 'Today 2:20pm',
        text: 'Hey, can I check out later please? Around 12:00-13:00 would be great.',
      },
      {
        id: `${r.id}-me-1`,
        author: 'me',
        name: 'You',
        time: 'Just now',
        text: 'Sure thing, I will have a look today. They are looking great!',
      },
    ]
  }

  useEffect(() => {
    resetSidebarEdit()
    setSidebarTab('reservation')
    setShowSettingsPopover(false)
    setSidebarMoreMenuOpen(false)
    setMessageDraft('')
    setMessageThreads((prev) => {
      if (prev[reservation.id]) return prev
      return { ...prev, [reservation.id]: buildInitialMessages(reservation) }
    })
    setExpandedSections({
      keyInsights: true,
      bookedBy: true,
      stay: true,
      notes: true,
      guests: true,
      payments: true,
    })
  }, [reservation.id, resetSidebarEdit])

  useEffect(() => {
    if (sidebarTab !== 'reservation') resetSidebarEdit()
  }, [sidebarTab, resetSidebarEdit])

  useEffect(() => {
    if (sidebarEditing) {
      setExpandedSections({
        keyInsights: true,
        bookedBy: true,
        stay: true,
        notes: true,
        guests: true,
        payments: true,
      })
    }
  }, [sidebarEditing])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SIDEBAR_VIEW_PREFERENCES_KEY, JSON.stringify(viewPreferences))
  }, [viewPreferences])

  useEffect(() => {
    try {
      window.sessionStorage.setItem(SIDEBAR_FIELD_LAYOUT_KEY, sidebarFieldLayout)
    } catch {
      /* ignore */
    }
  }, [sidebarFieldLayout])

  useEffect(() => {
    if (!sidebarMoreMenuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const node = sidebarMoreMenuRef.current
      if (!node) return
      if (!node.contains(event.target as Node)) setSidebarMoreMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [sidebarMoreMenuOpen])

  useEffect(() => {
    if (!showSettingsPopover) return
    const onPointerDown = (event: PointerEvent) => {
      const t = event.target as Node
      if (settingsPopoverRef.current?.contains(t)) return
      if (settingsTriggerRef.current?.contains(t)) return
      setShowSettingsPopover(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [showSettingsPopover])

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))
  }

  const toggleInsightVisibility = (key: InsightKey) => {
    setViewPreferences((prev) => ({
      ...prev,
      insights: { ...prev.insights, [key]: !prev.insights[key] },
    }))
  }

  const toggleSectionVisibility = (key: SectionKey) => {
    setViewPreferences((prev) => ({
      ...prev,
      sections: { ...prev.sections, [key]: !prev.sections[key] },
    }))
  }

  const sendMessage = () => {
    const text = messageDraft.trim()
    if (!text) return

    const reservationId = reservation.id
    const myMessage: ChatMessage = {
      id: `${reservationId}-${Date.now()}-me`,
      author: 'me',
      name: 'You',
      time: 'Just now',
      text,
    }

    setMessageThreads((prev) => ({
      ...prev,
      [reservationId]: [...(prev[reservationId] ?? buildInitialMessages(reservation)), myMessage],
    }))
    setMessageDraft('')

    const randomReply = randomGuestReplies[Math.floor(Math.random() * randomGuestReplies.length)]
    window.setTimeout(() => {
      setMessageThreads((prev) => {
        const thread = prev[reservationId]
        if (!thread) return prev
        const guestReply: ChatMessage = {
          id: `${reservationId}-${Date.now()}-guest`,
          author: 'guest',
          name: reservation.guestName,
          time: 'Just now',
          text: randomReply,
        }
        return {
          ...prev,
          [reservationId]: [...thread, guestReply],
        }
      })
    }, 500)
  }

  const renderSection = (
    sectionKey: SectionKey,
    title: string,
    fields: SidebarFieldDef[],
    options?: { emphasize?: boolean }
  ) => {
    const emphasize = options?.emphasize ?? false
    if (!viewPreferences.sections[sectionKey]) return null
    const expanded = expandedSections[sectionKey]

    const layout = sidebarFieldLayout
    const isComfortable = layout === 'comfortable'
    const isGridLayout = layout === 'compact' || layout === 'modern'
    const isModernPanel = layout === 'modern'

    const valueTextSize =
      layout === 'compact'
        ? 'text-[12px] leading-4'
        : isComfortable
          ? 'text-[14px] leading-5'
          : 'text-[13px] leading-5'
    const labelClass = cn(
      isModernPanel
        ? 'text-[12px] sm:text-[13px] font-medium leading-4 sm:leading-5 text-[#475467]'
        : layout === 'compact'
          ? 'text-[11px] font-medium leading-4 text-[#667085]'
          : 'text-[12px] font-medium leading-4 text-[#667085]',
    )
    const comfortableStackLabel = 'text-[11px] font-medium leading-4 text-[#667085]'

    const hSingle =
      layout === 'compact'
        ? 'h-6 min-h-[24px]'
        : isModernPanel
          ? 'h-9 min-h-9'
          : 'min-h-10 h-10'
    const minTextarea =
      layout === 'compact'
        ? 'min-h-[40px]'
        : isModernPanel
          ? 'min-h-[72px]'
          : 'min-h-[88px]'

    const editShell = isModernPanel
      ? 'rounded-md border border-[#d0d5dd] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.05)] transition-[border-color,box-shadow] duration-100 ease-linear focus:border-[#15b8b0] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/20'
      : 'rounded-lg border border-[#d5d7da] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:border-[#15b8b0] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/20'
    const sbSingleLineEdit = cn(
      'box-border w-full py-0 text-[#101828]',
      layout === 'compact' && 'font-normal text-[12px] leading-6',
      isModernPanel && 'font-normal text-[13px] leading-9',
      isComfortable && 'font-normal text-[14px] leading-5',
      hSingle,
      layout === 'compact' ? 'px-2' : 'px-3',
      editShell,
    )
    const readComfortableSingle = cn(
      'flex w-full min-w-0 items-center gap-2.5 rounded-lg bg-[#f6f9fc] px-3 py-0 text-left text-[#101828] ring-1 ring-inset ring-[#f2f4f7]',
      hSingle,
    )
    const readGridSingle = isModernPanel
      ? cn(
          'flex w-full min-w-0 items-center rounded-md border border-[#eaecf0] bg-[#fafbfb] py-0 text-left text-[13px] font-semibold leading-5 tracking-tight text-[#101828] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] ring-1 ring-inset ring-black/[0.04]',
          hSingle,
          'px-2.5',
        )
      : cn(
          'flex w-full min-w-0 items-center rounded-lg border border-transparent bg-transparent py-0 text-left font-normal text-[#101828]',
          valueTextSize,
          hSingle,
        )
    const sbMultilineEdit = cn(
      'w-full resize-y bg-white font-normal text-[#101828] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:border-[#15b8b0] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/20',
      minTextarea,
      isModernPanel
        ? 'rounded-md border border-[#d0d5dd] px-3 py-2 text-[13px] leading-5 transition-[border-color,box-shadow] duration-100 ease-linear'
        : cn(
            'rounded-lg border border-[#d5d7da]',
            isComfortable ? 'px-3 py-2.5 text-[14px] leading-6' : cn('py-1', valueTextSize, layout === 'compact' ? 'px-2' : 'px-2.5'),
          ),
    )
    const readComfortableTa = cn(
      'flex w-full items-start rounded-lg bg-[#f6f9fc] px-3 py-2.5 text-left text-[14px] leading-6 text-[#101828] ring-1 ring-inset ring-[#f2f4f7]',
      minTextarea,
    )
    const readGridTa = isModernPanel
      ? cn(
          'flex w-full items-start rounded-lg border border-[#eaecf0] bg-[#fafbfb] py-2 text-left text-[13px] font-medium leading-5 text-[#101828] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] ring-1 ring-inset ring-black/[0.04]',
          minTextarea,
          'px-2.5',
        )
      : cn(
          'flex w-full items-start rounded-lg border border-transparent bg-transparent py-1 text-left font-normal text-[#101828]',
          valueTextSize,
          minTextarea,
        )

    const selectShell = 'relative w-full'
    const selectChevronRight =
      layout === 'compact' ? 'right-1.5' : isModernPanel || isComfortable ? 'right-3' : 'right-2'
    const selectChevronPr =
      layout === 'compact' ? 'pr-6' : isModernPanel || isComfortable ? 'pr-9' : 'pr-7'
    const selectChevron = cn(
      'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]',
      selectChevronRight,
    )

    const setDraftField = (field: keyof SidebarDraft, value: string) => {
      setSidebarDraft((prev) => (prev ? { ...prev, [field]: value } : prev))
    }

    const renderControl = (def: SidebarFieldDef) => {
      if (!sidebarEditing || !sidebarDraft) {
        return null
      }
      const v = sidebarDraft[def.field]
      if (def.kind === 'textarea') {
        return (
          <textarea
            value={v}
            onChange={(e) => setDraftField(def.field, e.target.value)}
            className={sbMultilineEdit}
            rows={layout === 'compact' ? 2 : 3}
          />
        )
      }
      if (def.kind === 'select' && def.options) {
        return (
          <div className={selectShell}>
            <select
              value={v}
              onChange={(e) => setDraftField(def.field, e.target.value)}
              className={cn(sbSingleLineEdit, 'appearance-none', selectChevronPr)}
            >
              {def.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown className={selectChevron} aria-hidden />
          </div>
        )
      }
      return (
        <input
          type="text"
          value={v}
          onChange={(e) => setDraftField(def.field, e.target.value)}
          className={sbSingleLineEdit}
        />
      )
    }

    const renderRead = (def: SidebarFieldDef) => {
      const display = sidebarReadValue(reservation, def.field)
      const isMoney = /^\$[\d,]/.test(display.trim())
      const isTotal = def.field === 'totalAmount'
      const statusHue =
        emphasize && def.field === 'status' && display in statusSidebarTextClass
          ? statusSidebarTextClass[display as ReservationListItem['status']]
          : null
      const paymentHue =
        emphasize &&
        def.field === 'paymentStatus' &&
        display in paymentStatusSidebarTextClass
          ? paymentStatusSidebarTextClass[display as ReservationListItem['paymentStatus']]
          : null
      const rentalHue =
        emphasize && def.field === 'rentalAgreementStatus'
          ? display === 'Signed'
            ? 'text-[#067647]'
            : 'text-[#b42318]'
          : null

      const valueTypography = cn(
        'min-w-0',
        isModernPanel ? 'text-[13px] leading-5 text-[#101828]' : valueTextSize,
        isModernPanel
          ? def.kind === 'textarea'
            ? 'font-medium'
            : 'font-semibold tracking-tight'
          : isComfortable
            ? def.kind === 'textarea'
              ? 'font-normal text-[#101828]'
              : 'font-medium text-[#101828]'
            : layout === 'compact'
              ? 'font-medium text-[#101828]'
              : 'font-normal',
        isComfortable && def.kind === 'textarea' && 'leading-6',
        (isMoney || isTotal || def.field === 'baseRate' || def.field === 'pmCommission') &&
          'tabular-nums tracking-tight',
        statusHue ?? paymentHue ?? rentalHue,
      )

      if (def.kind === 'textarea') {
        const shell = isComfortable ? readComfortableTa : readGridTa
        return (
          <div className={shell}>
            <span className={cn(valueTypography, 'break-words whitespace-pre-wrap')}>{display}</span>
          </div>
        )
      }

      const shell = isComfortable ? readComfortableSingle : readGridSingle
      return (
        <div className={shell}>
          <span className={cn(valueTypography, 'min-w-0 flex-1 truncate')}>{display}</span>
        </div>
      )
    }

    return (
      <section
        className={cn(
          'overflow-hidden border bg-white',
          isModernPanel
            ? cn(
                'rounded-2xl shadow-[0px_1px_3px_rgba(10,13,18,0.08),0px_1px_2px_-1px_rgba(10,13,18,0.06)] ring-1 ring-inset ring-black/[0.03]',
                emphasize ? cn(PREVIEW_MINT_BORDER, PREVIEW_MINT_ROW_BG) : 'border-[#e9eaeb]',
              )
            : cn(
                'rounded-xl shadow-[0px_1px_2px_rgba(10,13,18,0.04)]',
                emphasize ? cn(PREVIEW_MINT_BORDER, PREVIEW_MINT_ROW_BG) : 'border-[#e9eaeb]',
              ),
        )}
      >
        <button
          type="button"
          onClick={() => !sidebarEditing && toggleSection(sectionKey)}
          disabled={sidebarEditing}
          className={cn(
            'flex w-full items-center justify-between gap-2 text-left transition-colors',
            isModernPanel
              ? cn(
                  'border-b border-[#e9eaeb] bg-[linear-gradient(180deg,#fafbfc_0%,#ffffff_100%)] px-3 py-3 sm:px-4',
                  sidebarEditing && 'cursor-default',
                )
              : cn(
                  'border-b border-[#f2f4f7] px-3 py-2',
                  sidebarEditing && 'cursor-default',
                ),
          )}
        >
          {isModernPanel ? (
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span
                className="h-6 w-[3px] shrink-0 rounded-full bg-[#15b8b0] shadow-[0_0_0_2px_rgba(21,184,176,0.12),0_2px_6px_rgba(21,184,176,0.22)]"
                aria-hidden
              />
              <h3 className="min-w-0 truncate text-left text-[14px] font-semibold leading-5 tracking-tight text-[#101828]">
                {title}
              </h3>
            </div>
          ) : (
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">{title}</h3>
          )}
          {!sidebarEditing ? (
            <ChevronUp
              className={cn(
                'h-4 w-4 shrink-0 transition-transform',
                isModernPanel ? 'text-[#98a2b3]' : 'text-[#98a2b3]',
                expanded ? '' : 'rotate-180',
              )}
              aria-hidden
            />
          ) : null}
        </button>
        {expanded || sidebarEditing ? (
          <div
            className={cn(
              !isGridLayout && 'space-y-2 px-3 py-2',
              isGridLayout && !isModernPanel && 'divide-y divide-[#f2f4f7]',
              isModernPanel && 'bg-white',
            )}
          >
            {fields.map((def) => {
              const cell =
                sidebarEditing && sidebarDraft ? renderControl(def) : renderRead(def)
              if (isComfortable) {
                return (
                  <div key={`${sectionKey}-${def.label}`} className="flex min-w-0 flex-col gap-0.5">
                    <span className={comfortableStackLabel}>{def.label}</span>
                    {cell}
                  </div>
                )
              }
              return (
                <div
                  key={`${sectionKey}-${def.label}`}
                  className={cn(
                    'grid min-w-0 text-left',
                    layout === 'compact' &&
                      cn(
                        'grid-cols-[minmax(0,116px)_minmax(0,1fr)] gap-x-2 px-2.5 py-1',
                        def.kind === 'textarea' ? 'items-start' : 'items-center',
                      ),
                    isModernPanel &&
                      cn(
                        'grid-cols-[minmax(0,100px)_minmax(0,1fr)] gap-x-3 border-b border-[#f0f2f5] px-3 py-3 sm:grid-cols-[minmax(0,112px)_minmax(0,1fr)] sm:px-4 last:border-b-0',
                        def.kind === 'textarea' ? 'items-start' : 'items-center',
                        !sidebarEditing &&
                          'transition-[background-color] duration-150 ease-out hover:bg-[#f6f9fc]/[0.55] motion-reduce:transition-none',
                      ),
                  )}
                >
                  <label
                    className={cn(
                      labelClass,
                      def.kind === 'textarea' ? (isModernPanel ? 'pt-1' : 'pt-0.5') : '',
                    )}
                  >
                    {def.label}
                  </label>
                  <div className="min-w-0">{cell}</div>
                </div>
              )
            })}
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <>
      <header className="flex h-[52px] shrink-0 items-center border-b border-[#e9eaeb] px-4">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src={previewAvatarUrl}
              alt={reservation.guestName}
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-full object-cover shadow-[0px_1px_2px_rgba(10,13,18,0.08)] ring-1 ring-inset ring-black/5"
            />
            <h3 className="min-w-0 truncate text-[20px] font-semibold leading-[30px] text-[#181d27]">
              {reservation.guestName}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={sidebarEditing}
              onClick={() => onOpenFullscreen(reservation, { startInEditMode: false })}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#98a2b3] hover:bg-[#f6f9fc] disabled:pointer-events-none disabled:opacity-40"
              aria-label="Open fullscreen reservation"
            >
              <Maximize02 className="h-5 w-5" aria-hidden />
            </button>
            <button
              ref={settingsTriggerRef}
              type="button"
              disabled={sidebarEditing}
              onClick={() => setShowSettingsPopover((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#667085] hover:bg-[#f6f9fc] disabled:pointer-events-none disabled:opacity-40"
              aria-label="Sidebar view settings"
              aria-expanded={showSettingsPopover}
              aria-haspopup="dialog"
            >
              <Settings01 className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#98a2b3] hover:bg-[#f6f9fc]"
              aria-label="Close side panel"
            >
              <XClose className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[52px] shrink-0 items-end gap-5 border-b border-[#e9eaeb] bg-white px-4">
        <button
          type="button"
          onClick={() => {
            setSidebarTab('reservation')
            setShowSettingsPopover(false)
          }}
          className={`-mb-px flex h-full max-h-[52px] items-end border-b-2 pb-3 text-[14px] font-semibold leading-5 transition-colors ${
            sidebarTab === 'reservation'
              ? 'border-[#15b8b0] text-[#101828]'
              : 'border-transparent text-[#667085] hover:text-[#344054]'
          }`}
        >
          Reservation
        </button>
        <button
          type="button"
          onClick={() => {
            setSidebarTab('messages')
            setShowSettingsPopover(false)
          }}
          className={`-mb-px flex h-full max-h-[52px] items-end border-b-2 pb-3 text-[14px] font-semibold leading-5 transition-colors ${
            sidebarTab === 'messages'
              ? 'border-[#15b8b0] text-[#101828]'
              : 'border-transparent text-[#667085] hover:text-[#344054]'
          }`}
        >
          Messages
        </button>
        <button
          type="button"
          onClick={() => {
            setSidebarTab('tasks')
            setShowSettingsPopover(false)
          }}
          className={`-mb-px flex h-full max-h-[52px] items-end border-b-2 pb-3 text-[14px] font-semibold leading-5 transition-colors ${
            sidebarTab === 'tasks'
              ? 'border-[#15b8b0] text-[#101828]'
              : 'border-transparent text-[#667085] hover:text-[#344054]'
          }`}
        >
          Tasks
        </button>
        <button
          type="button"
          onClick={() => {
            setSidebarTab('guest')
            setShowSettingsPopover(false)
          }}
          className={`-mb-px flex h-full max-h-[52px] items-end border-b-2 pb-3 text-[14px] font-semibold leading-5 transition-colors ${
            sidebarTab === 'guest'
              ? 'border-[#15b8b0] text-[#101828]'
              : 'border-transparent text-[#667085] hover:text-[#344054]'
          }`}
        >
          Guest
        </button>
      </div>

      {sidebarTab === 'reservation' ? (
        <>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2.5">
            {renderSection(
              'keyInsights',
              'Key insights',
              (
                [
                  { label: 'Channel', field: 'source', kind: 'select', options: [...sources] },
                  { label: 'Reservation status', field: 'status', kind: 'select', options: [...statuses] },
                  {
                    label: 'Payment status',
                    field: 'paymentStatus',
                    kind: 'select',
                    options: [...paymentStatuses],
                  },
                  { label: 'Balance due', field: 'balanceDue' },
                  { label: 'Remaining charges', field: 'remainingCharges' },
                  { label: 'Total', field: 'totalAmount' },
                  { label: 'Door code', field: 'doorCode' },
                  {
                    label: 'Rental agreement',
                    field: 'rentalAgreementStatus',
                    kind: 'select',
                    options: [...rentalAgreementOptions],
                  },
                  { label: 'Base rate', field: 'baseRate' },
                  { label: 'PM commission', field: 'pmCommission' },
                ] satisfies SidebarFieldDef[]
              ).filter((def) => {
                const k = insightKeyByDraftField[def.field]
                return !k || viewPreferences.insights[k]
              }),
              { emphasize: true }
            )}
            {renderSection('stay', 'Stay', [
              { label: 'Listing', field: 'listingName', kind: 'select', options: [...listingNames] },
              { label: 'Check-in date', field: 'checkIn' },
              { label: 'Check-in time', field: 'checkInTime', kind: 'select', options: [...checkInTimes] },
              { label: 'Check-out date', field: 'checkOut' },
              { label: 'Check-out time', field: 'checkOutTime', kind: 'select', options: [...checkOutTimes] },
              { label: 'Number of nights', field: 'nights' },
              { label: 'Channel', field: 'source', kind: 'select', options: [...sources] },
              { label: 'Confirmation code', field: 'confirmationCode' },
            ])}
            {renderSection('notes', 'Notes', [
              { label: 'Special requests', field: 'specialRequests', kind: 'textarea' },
            ])}
            {renderSection('guests', 'Guests', [
              { label: 'Number of guests', field: 'guests', kind: 'select', options: guestCountSelectOptions },
              { label: 'Children', field: 'children', kind: 'select', options: guestCountSelectOptions },
              { label: 'Infants', field: 'infants', kind: 'select', options: guestCountSelectOptions },
              { label: 'Pets', field: 'pets', kind: 'select', options: guestCountSelectOptions },
            ])}
            {renderSection('payments', 'Payments', [
              { label: 'Payment status', field: 'paymentStatus', kind: 'select', options: [...paymentStatuses] },
              { label: 'Balance due', field: 'balanceDue' },
              { label: 'Remaining charges', field: 'remainingCharges' },
              { label: 'Total amount', field: 'totalAmount' },
            ])}
          </div>

          <footer
            className={cn(
              'flex shrink-0 items-center justify-end gap-2 border-t border-[#e9eaeb] bg-white px-4 sm:px-6',
              paginationCompact ? 'h-[52px] min-h-[52px]' : 'h-[60px] min-h-[60px]',
            )}
          >
            {sidebarEditing ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={resetSidebarEdit}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!sidebarDirty}
                  onClick={() => {
                    if (!sidebarDraft) return
                    onApplyReservationPatch(reservation.id, partialFromDraft(sidebarDraft))
                    resetSidebarEdit()
                  }}
                  className="gap-1.5"
                >
                  <Save01 className="h-4 w-4 shrink-0" aria-hidden />
                  Save
                </Button>
              </>
            ) : (
              <>
                <div className="relative shrink-0" ref={sidebarMoreMenuRef}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    aria-haspopup="menu"
                    aria-expanded={sidebarMoreMenuOpen}
                    onClick={() => setSidebarMoreMenuOpen((prev) => !prev)}
                  >
                    <DotsHorizontal className="h-4 w-4 shrink-0" aria-hidden />
                    More
                  </Button>
                  {sidebarMoreMenuOpen ? (
                    <div
                      className="absolute bottom-[calc(100%+6px)] right-0 z-40 min-w-[220px] rounded-xl border border-[#e9eaeb] bg-white p-1 shadow-[0px_12px_16px_-4px_rgba(10,13,18,0.08),0px_4px_6px_-2px_rgba(10,13,18,0.03)]"
                      role="menu"
                    >
                      <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-[#98a2b3]">
                        Page layout
                      </p>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[14px] font-medium leading-5 bg-[#f6f9fc] text-[#181d27]"
                        onClick={() => {
                          setSidebarFieldLayout('compact')
                          setSidebarMoreMenuOpen(false)
                        }}
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#15b8b0]">
                          <Check className="h-4 w-4" aria-hidden />
                        </span>
                        Compact
                      </button>
                    </div>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="!px-2.5"
                  aria-label="Guest options"
                >
                  <UserCircle className="h-4 w-4 shrink-0" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setSidebarMoreMenuOpen(false)
                    setSidebarDraft(reservationToDraft(reservation))
                    setSidebarEditing(true)
                  }}
                >
                  <Edit01 className="h-4 w-4 shrink-0" aria-hidden />
                  Edit
                </Button>
              </>
            )}
          </footer>
        </>
      ) : sidebarTab === 'messages' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-[#e9eaeb]" />
              <span className="text-[14px] font-medium leading-5 text-[#535862]">Today</span>
              <div className="h-px flex-1 bg-[#e9eaeb]" />
            </div>
            <div className="space-y-4">
              {activeThread.map((message) => (
                <div key={message.id} className={`flex ${message.author === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[92%] ${message.author === 'me' ? '' : 'flex gap-3'}`}>
                    {message.author === 'guest' ? (
                      <img
                        src={reservationGuestAvatarUrl(reservation.id, RESERVATION_AVATAR_SRC_PANEL)}
                        alt={message.name}
                        width={32}
                        height={32}
                        className="h-8 w-8 shrink-0 rounded-full object-cover shadow-[0px_1px_2px_rgba(10,13,18,0.08)] ring-1 ring-inset ring-black/5"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <p className="text-[14px] font-medium leading-5 text-[#414651]">
                          {message.author === 'me' ? 'You' : message.name}
                        </p>
                        <p className="text-[12px] leading-[18px] text-[#535862]">{message.time}</p>
                      </div>
                      <div className="rounded-lg border border-[#e9eaeb] bg-[#f6f9fc] px-3 py-2 text-[14px] leading-7 text-[#181d27]">
                        {message.text}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-[#e9eaeb] p-4">
            <div className="rounded-xl border border-[#e9eaeb] bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-[14px] font-semibold leading-5 text-[#181d27]">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ff5a5f] text-white">A</span>
                Reply on Airbnb
              </div>
              <textarea
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Write..."
                className="mb-3 h-20 w-full resize-none rounded-md border-0 bg-transparent px-0 py-0 text-[14px] leading-7 text-[#181d27] placeholder:text-[#717680] focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[#98a2b3]">
                  <Type01 className="h-5 w-5" aria-hidden />
                  <Paperclip className="h-5 w-5" aria-hidden />
                  <Clock className="h-5 w-5" aria-hidden />
                  <Grid01 className="h-5 w-5" aria-hidden />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={sendMessage}
                  className="h-9 gap-1 px-3 text-[14px] leading-5"
                >
                  <Send01 className="h-5 w-5" aria-hidden />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : sidebarTab === 'guest' ? (
        <GuestTab reservation={reservation} />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-6 text-[14px] leading-5 text-[#717680]">
          No tasks yet for this reservation.
        </div>
      )}

      <div ref={settingsPopoverRef} className="absolute right-12 top-12 z-30">
        {showSettingsPopover && sidebarTab === 'reservation' && (
          <div
            className="w-[min(100vw-2rem,340px)] overflow-hidden rounded-xl border border-[#e9eaeb] bg-white shadow-[0px_12px_32px_-8px_rgba(10,13,18,0.18),0px_4px_8px_-2px_rgba(10,13,18,0.06)]"
            role="dialog"
            aria-label="Sidebar view settings"
          >
            <div className="p-3 pb-2">
              <div
                className="flex rounded-lg bg-[#f2f4f7] p-0.5"
                role="tablist"
                aria-label="Settings category"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={settingsTab === 'keyInsights'}
                  onClick={() => setSettingsTab('keyInsights')}
                  className={cn(
                    'min-h-9 flex-1 rounded-md px-2 py-2 text-[13px] font-medium leading-4 transition-[color,box-shadow,background-color] duration-150',
                    settingsTab === 'keyInsights'
                      ? 'bg-white text-[#101828] shadow-[0px_1px_2px_rgba(10,13,18,0.06)] ring-1 ring-inset ring-[#e9eaeb]'
                      : 'text-[#667085] hover:text-[#344054]',
                  )}
                >
                  Key insights
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={settingsTab === 'sections'}
                  onClick={() => setSettingsTab('sections')}
                  className={cn(
                    'min-h-9 flex-1 rounded-md px-2 py-2 text-[13px] font-medium leading-4 transition-[color,box-shadow,background-color] duration-150',
                    settingsTab === 'sections'
                      ? 'bg-white text-[#101828] shadow-[0px_1px_2px_rgba(10,13,18,0.06)] ring-1 ring-inset ring-[#e9eaeb]'
                      : 'text-[#667085] hover:text-[#344054]',
                  )}
                >
                  Sections
                </button>
              </div>
            </div>
            <div className="max-h-[min(50vh,320px)] overflow-y-auto px-3 pb-3 pt-0">
              {settingsTab === 'keyInsights' ? (
                <ul className="divide-y divide-[#f2f4f7] rounded-lg border border-[#f2f4f7] bg-[#f6f9fc]/50">
                  {SIDEBAR_SETTINGS_INSIGHT_ITEMS.map((item) => (
                    <li key={item.key}>
                      <div className="flex items-center gap-3 px-2 py-2 sm:px-2.5 sm:py-2.5">
                        <Checkbox
                          checked={viewPreferences.insights[item.key]}
                          onChange={() => toggleInsightVisibility(item.key)}
                          className="shrink-0"
                          aria-label={`Show ${item.label}`}
                        />
                        <button
                          type="button"
                          onClick={() => toggleInsightVisibility(item.key)}
                          className="min-w-0 flex-1 rounded-md py-0.5 text-left text-[14px] font-medium leading-5 text-[#101828] transition-colors hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15b8b0]/25"
                        >
                          {item.label}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="divide-y divide-[#f2f4f7] rounded-lg border border-[#f2f4f7] bg-[#f6f9fc]/50">
                  {SIDEBAR_SETTINGS_SECTION_ITEMS.map((item) => (
                    <li key={item.key}>
                      <div className="flex items-center gap-3 px-2 py-2 sm:px-2.5 sm:py-2.5">
                        <Checkbox
                          checked={viewPreferences.sections[item.key]}
                          onChange={() => toggleSectionVisibility(item.key)}
                          className="shrink-0"
                          aria-label={`Show ${item.label} section`}
                        />
                        <button
                          type="button"
                          onClick={() => toggleSectionVisibility(item.key)}
                          className="min-w-0 flex-1 rounded-md py-0.5 text-left text-[14px] font-medium leading-5 text-[#101828] transition-colors hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15b8b0]/25"
                        >
                          {item.label}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
