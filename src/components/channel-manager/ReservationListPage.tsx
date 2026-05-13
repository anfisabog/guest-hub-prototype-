import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Input } from '@/components/ui'
import {
  RESERVATION_AVATAR_SRC_TABLE,
  reservationGuestAvatarUrl,
} from '@/lib/reservationGuestAvatar'
import { getChannelById, getChannelLogoBackground } from '@/config/channels'
import { PageHeader } from './PageHeader'
import {
  ReservationTableColumnsModal,
  ReservationTableHeaderCogButton,
} from './ReservationTableColumnsModal'
import {
  loadReservationTableColumnOrder,
  RESERVATION_TABLE_COLUMN_META,
  saveReservationTableColumnOrder,
  type ReservationTableColumnId,
} from './reservationTableColumns'
import { RESERVATION_SOURCE_TO_CHANNEL_ID } from './reservationSourceChannel'
import { TableFilter, type TableFilterValue } from './TableFilter'
import { cn } from '@/lib/cn'
import { demoPaymentStatusForCheckIn, mulberry32 } from '@/lib/demoReservationPayment'
import { SlidingSidePanel } from '@/lib/motion'
import { AddChargeDrawer } from './AddChargeDrawer'
import { ReservationPreviewPanelBody } from './ReservationPreviewPanelBody'
import {
  ArrowNarrowLeft,
  ArrowNarrowRight,
  ChevronDown,
  ChevronRight,
  DotsHorizontal,
  Plus,
  SearchLg,
  XClose,
} from '@untitled-ui/icons-react'

/** Table card width below which pagination uses compact layout (e.g. beside preview sidebar). */
const TABLE_SECTION_COMPACT_PX = 800

const RESERVATION_ROW_ACTIONS_COL_PX = 84
/** `<thead>` only — neutral very light gray (not mint `#f6f9fc` row/sidebar accent). */
const RESERVATION_TABLE_HEAD_BG = 'bg-[#f9fafb]'
/** Sticky corner `<th>`: inner edge (horizontal scroll) + soft floor below so header reads above tbody (`rgba(10,13,18,…)` matches table/card elevation). */
const RESERVATION_TABLE_STICKY_HEAD_SHADOW_LEFT =
  'shadow-[6px_0_16px_-8px_rgba(10,13,18,0.06),0px_3px_10px_-4px_rgba(10,13,18,0.05)]'
const RESERVATION_TABLE_STICKY_HEAD_SHADOW_RIGHT =
  'shadow-[-6px_0_16px_-8px_rgba(10,13,18,0.06),0px_3px_10px_-4px_rgba(10,13,18,0.05)]'
/** Sticky body cells: inner edge only (subtle; avoids competing with row borders). */
const RESERVATION_TABLE_STICKY_BODY_SHADOW_LEFT =
  'shadow-[6px_0_16px_-8px_rgba(10,13,18,0.05)]'
const RESERVATION_TABLE_STICKY_BODY_SHADOW_RIGHT =
  'shadow-[-6px_0_16px_-8px_rgba(10,13,18,0.05)]'
const RESERVATION_ROW_MENU_WIDTH = 280
const RESERVATION_ROW_MENU_GAP = 8

const AIRBNB_ROW_MENU_CHANNEL = getChannelById('airbnb')

const RESERVATION_ROW_MENU_ADD_LABELS = [
  'Add charge',
  'Add payment method',
  'Add guest',
  'Add attachment',
  'Add task',
  'Add Guest Review',
] as const

function useReservationRowMenuPosition(
  open: boolean,
  getAnchor: () => HTMLButtonElement | undefined,
) {
  const [style, setStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  const update = useCallback(() => {
    const el = getAnchor()
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const width = Math.min(RESERVATION_ROW_MENU_WIDTH, vw - 16)
    let left = r.right - width
    left = Math.max(8, Math.min(left, vw - width - 8))
    setStyle({ top: r.bottom + RESERVATION_ROW_MENU_GAP, left })
  }, [getAnchor])

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

  const width =
    typeof window !== 'undefined'
      ? Math.min(RESERVATION_ROW_MENU_WIDTH, window.innerWidth - 16)
      : RESERVATION_ROW_MENU_WIDTH

  return { style, width }
}

function ReservationTableChannelCell({ source }: { source: string }) {
  const channelId = RESERVATION_SOURCE_TO_CHANNEL_ID[source]
  const channel = channelId ? getChannelById(channelId) : undefined

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {channel?.logo ? (
        <div
          className="flex h-6 w-6 shrink-0 overflow-hidden rounded-full shadow-[0px_1px_2px_rgba(10,13,18,0.08)] ring-1 ring-inset ring-black/5"
          style={{ backgroundColor: getChannelLogoBackground(channel) }}
        >
          <img
            src={channel.logo}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            aria-hidden
          />
        </div>
      ) : (
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f2f4f7] text-[10px] font-semibold leading-none text-[#667085] shadow-[0px_1px_2px_rgba(10,13,18,0.08)] ring-1 ring-inset ring-black/5"
          aria-hidden
        >
          {source === 'Direct' ? 'D' : '?'}
        </div>
      )}
      <span className="truncate text-[14px] leading-5 text-[#535862]">{source}</span>
    </div>
  )
}

export interface ReservationListItem {
  id: string
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
  guests: number
  nights: number
  children: number
  infants: number
  pets: number
  source: string
  status: 'Reserved' | 'Cancelled' | 'Checked in' | 'Pending'
  paymentStatus: 'Paid' | 'Unpaid' | 'Partially paid'
  balanceDue: string
  remainingCharges: string
  totalAmount: string
  /** Smart lock / access code (demo: pseudo-random per row). */
  doorCode: string
  rentalAgreementStatus: 'Signed' | 'Not signed'
  /** Portion of total before PM commission (demo: 80% of total). */
  baseRate: string
  /** Property manager commission (demo: 20% of total). */
  pmCommission: string
  notes: string
  specialRequests: string
  confirmationCode: string
  bookingType: string
  checkInMethod: string
  roomType: string
  assignedTeam: string
  cleaningStatus: string
  arrivalWindow: string
  departureWindow: string
  host: string
  houseRules: string
}

export interface OpenReservationOptions {
  startInEditMode?: boolean
}

type PageToken = number | 'ellipsis'

/** At most four numeric page buttons; ellipses fill gaps. */
function buildReservationPageTokens(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 0) return []
  if (totalPages === 1) return [1]
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const c = currentPage
  const n = totalPages

  if (c <= 3) {
    return [1, 2, 3, 'ellipsis', n]
  }
  if (c >= n - 2) {
    return [1, 'ellipsis', n - 2, n - 1, n]
  }
  return [1, 'ellipsis', c - 1, c, 'ellipsis', n]
}

/** UI accent surface (#f6f9fc): table row hover, preview-selected row */
const ACCENT_MINT_BG = 'bg-[#f6f9fc]'
const ACCENT_MINT_ROW_HOVER = 'hover:bg-[#f6f9fc]'
const ACCENT_MINT_ROW_GROUP_HOVER = 'group-hover:bg-[#f6f9fc]'
const PREVIEW_MINT_SUBTLE_SHADOW = 'shadow-[0px_1px_2px_rgba(10,13,18,0.04)]'
const PREVIEW_MINT_ROW_BG = ACCENT_MINT_BG

/**
 * Unique guest names — one per reservation. Length must be >= `reservationRows.length`
 * because we index directly into this array (`guestNames[index]`) to guarantee no guest
 * name repeats across reservations. The calendar then draws bookings 1:1 against these,
 * so each pill gets a distinct guest + pravatar avatar.
 */
const guestNames = [
  'Emily Johnson', 'Daniel Santos', 'Grace Miller', 'Luca Romano', 'Mia Chen',
  'Noah Williams', 'Ava Garcia', 'Ethan Brown', 'Sophia Martinez', 'James Wilson',
  'Isabella Lopez', 'Mason Taylor', 'Olivia Rhye', 'Liam Anderson', 'Zoe Patel',
  'Lucas Müller', 'Aria Nguyen', 'Oliver Schmidt', 'Charlotte Dubois', 'Henry O’Connor',
  'Amelia Rossi', 'Jack Kowalski', 'Harper Silva', 'Logan Park', 'Maya Kapoor',
  'Elijah Cohen', 'Ella Lindgren', 'Aiden Rahman', 'Stella Fischer', 'Nathan Kim',
  'Sadie Walsh', 'Theo Bianchi', 'Lily van Dijk', 'Owen Fernandez', 'Nora Hassan',
  'Eli Castro', 'Ruby Hartmann', 'Caleb Ivanov', 'Freya Olsen', 'Miles Reyes',
  'Julia Bauer', 'Hugo Bennett', 'Clara Jørgensen', 'Leo Dubois', 'Hazel Dupont',
  'Felix Moreau', 'Alice Novak', 'Gabriel Esposito', 'Willow Larsen', 'Samuel Conti',
  'Aurora Haug', 'Ryan Yamamoto', 'Luna Ferrer', 'Dylan Keller', 'Savannah Greer',
  'Jude Halvorsen', 'Audrey Meier', 'Wyatt Abbot', 'Violet Asenov', 'Isaac Lefèvre',
  'Ivy Sanchez', 'Arthur Wagner', 'Emilia Kallio', 'Milo Prior', 'Rosalind Weiss',
  'Finn Holm', 'Layla Ruiz', 'Beatrix Okafor', 'Marcus Bellamy', 'Catalina Vela',
  'Quinn Porter', 'Iris Delgado', 'Asher Tremblay', 'Sienna Navarro', 'Adrian Costa',
  'Penelope Frey', 'Simon Pardo', 'Thea Jankowski', 'Dante Costa', 'Lana Steiner',
  'Phoenix Baker', 'Demi Wilkinson', 'Candice Wu', 'Nikolai Egorov', 'Eve Delacroix',
  'Kai Nakamura', 'Rhea Dhawan', 'Jasper Fenn', 'Elena Petrova', 'Milan Horvath',
  'Ines Marchetti', 'Bastian Lindqvist', 'Cora Yildiz', 'Valentin Rusu', 'Nina Koval',
  'Rowan Blackwell', 'Tess Mariani', 'Viktor Jansen', 'Linnea Dahl', 'Dominic Ashford',
  'Cassia Duarte', 'Mateo Delgado', 'Yara Saleh', 'Ezra Hollister', 'Pippa Colton',
  'Gustav Lindgren', 'Nadia Farouk', 'Cyrus Bashir', 'Esme Whitaker', 'Javier Ortiz',
  'Astrid Eklund', 'Theodora Paine', 'Kenji Watanabe', 'Annika Vogel', 'Raoul Moreira',
  'Juniper Lowe', 'Soren Bakke', 'Mira Joshi', 'Laurence Briand', 'Zara Mbeki',
  'Maximilian Richter', 'Farah Haddad', 'Louis Arsenault', 'Zelda Ibarra', 'Julian Teixeira',
  'Romy Verhoeven', 'Casper Lund', 'Lorenza Pietri', 'Nolan Harris', 'Saoirse Byrne',
  'Callum Whitmore', 'Vesna Marković', 'Rostam Farhadi', 'Talia Shore', 'Giovanni Russo',
  'Helga Arnesen', 'Bruno Ricci', 'Ananya Iyer', 'Pablo Mendez', 'Greta Luft',
  'Anders Kilsgaard', 'Tatiana Volkov', 'Matthias Rauch', 'Imogen Palmer', 'Renzo Saldaña',
  'Noor Al-Saadi', 'Silvio Marengo', 'Priya Varma', 'Arjun Desai', 'Freja Nilsen',
  'Elodie Bouchard', 'Amir Darvish', 'Maribel Aguilar', 'Leif Axelsson', 'Celine Beaumont',
  'Fabio Bianchi', 'Hana Tanaka', 'Malik Osei', 'Bianca Ortega', 'Giselle Monroe',
  'Eamon Walsh', 'Saskia de Wit', 'Ronan Farrell', 'Ingrid Halvorsen', 'Edoardo Calvi',
  'Mei Huang', 'Cristóbal Paredes', 'Anya Konstantinou', 'Theo Lambert', 'Sora Ikeda',
  'Rosa Kowalski', 'Jonas Hofer', 'Paloma Reyes', 'Emrys Vale', 'Saori Hoshino',
  'Benedikt Kraus', 'Yusuf Demir', 'Elsa Bergström', 'Antoine Leclerc', 'Mina Petrova',
  'Oskar Mäkelä', 'Clémentine Garnier', 'Rafael Ventura', 'Ji-woo Park', 'Melina Rhodes',
  'Kasper Lindberg', 'Daphne Fontaine', 'Augusto Marino', 'Pilar Navarrete', 'Irina Lucescu',
  'Emeric Dubreuil', 'Noa Shapiro', 'Hubert Dvořák', 'Vivienne Lacroix', 'Gianni Moretti',
  'Selin Aksoy', 'Tomasz Zieliński', 'Aneta Novotná', 'Karim Benali', 'Delphine Rochon',
]

const listingNames = [
  'House in Barcelona',
  'City Loft Madrid',
  'Seaside Villa Lisbon',
  'Old Town Apartment',
  'Beachfront Condo Malaga',
  'Central Flat Valencia',
]

const sources = ['Airbnb', 'Booking.com', 'Direct', 'Vrbo'] as const
const statuses: ReservationListItem['status'][] = ['Reserved', 'Cancelled', 'Checked in', 'Pending']
const monthNames = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
const countries = ['United States', 'Spain', 'United Kingdom'] as const
const languages = ['English', 'Spanish', 'French'] as const
const currencies = ['USD ($)', 'EUR (€)', 'GBP (£)'] as const
const checkInTimes = ['2:00 PM', '3:00 PM', '4:00 PM'] as const
const checkOutTimes = ['9:00 AM', '10:00 AM', '11:00 AM'] as const
const bookingTypes = ['Instant booking', 'Request to book'] as const
const checkInMethods = ['Self check-in', 'Meet and greet', 'Key lockbox'] as const
const roomTypes = ['Entire home', 'Private room'] as const
const teams = ['Barcelona Team', 'Guest Experience', 'Operations'] as const
const cleaningStatuses = ['Scheduled', 'In progress', 'Complete'] as const
const timeWindows = ['Anytime', '3:00 PM - 5:00 PM', '5:00 PM - 7:00 PM'] as const
const houseRules = ['Standard rules', 'Family friendly', 'Quiet hours after 10 PM'] as const

/**
 * Length must not exceed {@link guestNames}.length — we index directly into `guestNames[index]`
 * to keep guest names unique per reservation (no modulo wrap-around). Expand the name pool first
 * if more rows are needed; see comment on {@link guestNames}.
 */
export const reservationRows: ReservationListItem[] = Array.from({ length: 200 }, (_, index) => {
  const nights = (index % 9) + 2
  const checkInMonth = monthNames[index % monthNames.length]
  const checkInDay = (index % 24) + 1
  const checkOutDay = Math.min(checkInDay + nights, 30)
  // Unique name per reservation — no modulo. Guarded by the array-length comment above.
  const guestName = guestNames[index]!
  const checkInForPayment = new Date(`${checkInMonth} ${checkInDay} 2026`)
  const paymentStatus = demoPaymentStatusForCheckIn(checkInForPayment, mulberry32(index * 0x9e3779b1 + 2654435761))
  const baseTotal = 900 + (index % 8) * 150
  const balanceDueNumber = paymentStatus === 'Paid' ? 0 : paymentStatus === 'Unpaid' ? baseTotal : Math.round(baseTotal * 0.35)
  const remainingChargesNumber = Math.round(baseTotal * 0.18)
  const doorCode = String((index * 7913 + 1021) % 9000 + 1000)
  const rentalAgreementStatus: ReservationListItem['rentalAgreementStatus'] =
    (index * 17 + index % 5) % 11 !== 0 ? 'Signed' : 'Not signed'
  const pmCommissionNumber = Math.round(baseTotal * 0.2 * 100) / 100
  const baseRateNumber = Math.round((baseTotal - pmCommissionNumber) * 100) / 100
  const money = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return {
    id: `res-${1001 + index}`,
    guestName,
    email: `${guestName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
    phone: '+1 233 324 3245',
    country: countries[index % countries.length],
    city:
      listingNames[index % listingNames.length].includes('Barcelona') ? 'Barcelona' :
      listingNames[index % listingNames.length].includes('Madrid') ? 'Madrid' :
      listingNames[index % listingNames.length].includes('Lisbon') ? 'Lisbon' :
      listingNames[index % listingNames.length].includes('Malaga') ? 'Malaga' :
      listingNames[index % listingNames.length].includes('Valencia') ? 'Valencia' :
      'Barcelona',
    language: languages[index % languages.length],
    currency: currencies[index % currencies.length],
    listingName: listingNames[index % listingNames.length],
    checkIn: `${checkInMonth} ${checkInDay} 2026`,
    checkInTime: checkInTimes[index % checkInTimes.length],
    checkOut: `${checkInMonth} ${checkOutDay} 2026`,
    checkOutTime: checkOutTimes[index % checkOutTimes.length],
    guests: (index % 6) + 1,
    nights,
    children: index % 3,
    infants: index % 2,
    pets: index % 2,
    source: sources[index % sources.length],
    status: statuses[index % statuses.length],
    paymentStatus,
    balanceDue: `$${balanceDueNumber.toLocaleString()}.00`,
    remainingCharges: `$${remainingChargesNumber.toLocaleString()}.00`,
    totalAmount: `$${baseTotal.toLocaleString()}.00`,
    doorCode,
    rentalAgreementStatus,
    baseRate: money(baseRateNumber),
    pmCommission: money(pmCommissionNumber),
    notes: 'Guest asked for an early luggage drop-off if possible.',
    specialRequests: 'Vegetarian welcome basket and two extra towels.',
    confirmationCode: `ABR-${1000 + index}-${7000 + index}`,
    bookingType: bookingTypes[index % bookingTypes.length],
    checkInMethod: checkInMethods[index % checkInMethods.length],
    roomType: roomTypes[index % roomTypes.length],
    assignedTeam: teams[index % teams.length],
    cleaningStatus: cleaningStatuses[index % cleaningStatuses.length],
    arrivalWindow: timeWindows[index % timeWindows.length],
    departureWindow: timeWindows[(index + 1) % timeWindows.length],
    host: guestNames[(index + 2) % guestNames.length]!,
    houseRules: houseRules[index % houseRules.length],
  }
})

const statusToneClass: Record<ReservationListItem['status'], string> = {
  Reserved: 'border-[#abefc6] bg-[#ecfdf3] text-[#067647]',
  Cancelled: 'border-[#fecdca] bg-[#fef3f2] text-[#b42318]',
  'Checked in': 'border-[#b2ddff] bg-[#eff8ff] text-[#175cd3]',
  Pending: 'border-[#fedf89] bg-[#fffaeb] text-[#b54708]',
}

function truncateTableCell(s: string, max = 52): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

function renderReservationTableDataCell(
  columnId: ReservationTableColumnId,
  row: ReservationListItem
): ReactNode {
  switch (columnId) {
    case 'guest':
      return (
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            src={reservationGuestAvatarUrl(row.id, RESERVATION_AVATAR_SRC_TABLE)}
            alt={row.guestName}
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full object-cover shadow-[0px_1px_2px_rgba(10,13,18,0.08)] ring-1 ring-inset ring-black/5"
          />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold leading-5 text-[#0086a8]">{row.guestName}</p>
            <p className="truncate text-[14px] leading-5 text-[#535862]" title={row.email}>
              {row.email}
            </p>
          </div>
        </div>
      )
    case 'listing':
      return <span className="truncate">{row.listingName}</span>
    case 'stayDates':
      return (
        <span>
          {row.checkIn} - {row.checkOut}
        </span>
      )
    case 'guests':
      return String(row.guests)
    case 'channel':
      return <ReservationTableChannelCell source={row.source} />
    case 'status':
      return (
        <span
          className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[12px] font-medium leading-[18px] ${statusToneClass[row.status]}`}
        >
          {row.status}
        </span>
      )
    case 'confirmationCode':
      return row.confirmationCode
    case 'email':
      return <span className="truncate">{row.email}</span>
    case 'phone':
      return row.phone
    case 'country':
      return row.country
    case 'city':
      return row.city
    case 'language':
      return row.language
    case 'currency':
      return row.currency
    case 'checkInTime':
      return row.checkInTime
    case 'checkOutTime':
      return row.checkOutTime
    case 'nights':
      return String(row.nights)
    case 'children':
      return String(row.children)
    case 'infants':
      return String(row.infants)
    case 'pets':
      return String(row.pets)
    case 'paymentStatus':
      return row.paymentStatus
    case 'balanceDue':
      return row.balanceDue
    case 'remainingCharges':
      return row.remainingCharges
    case 'totalAmount':
      return row.totalAmount
    case 'bookingType':
      return row.bookingType
    case 'checkInMethod':
      return row.checkInMethod
    case 'roomType':
      return row.roomType
    case 'assignedTeam':
      return row.assignedTeam
    case 'cleaningStatus':
      return row.cleaningStatus
    case 'arrivalWindow':
      return row.arrivalWindow
    case 'departureWindow':
      return row.departureWindow
    case 'host':
      return row.host
    case 'houseRules':
      return <span title={row.houseRules}>{truncateTableCell(row.houseRules, 40)}</span>
    case 'notes':
      return (
        <span className="line-clamp-2" title={row.notes}>
          {truncateTableCell(row.notes, 64)}
        </span>
      )
    case 'specialRequests':
      return (
        <span className="line-clamp-2" title={row.specialRequests}>
          {truncateTableCell(row.specialRequests, 64)}
        </span>
      )
    default:
      return null
  }
}

function reservationTableCellClass(columnId: ReservationTableColumnId): string {
  if (columnId === 'guest' || columnId === 'channel' || columnId === 'status') return 'px-6'
  return 'px-6 text-[14px] leading-5 text-[#535862]'
}

export function ReservationListPage({
  onOpenReservation,
}: {
  onOpenReservation: (reservation: ReservationListItem, options?: OpenReservationOptions) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'reservations' | 'coupons' | 'guestbook' | 'custom-fields'>('reservations')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [previewReservationId, setPreviewReservationId] = useState<string | null>(null)
  const [rowOverrides, setRowOverrides] = useState<Record<string, Partial<ReservationListItem>>>({})
  const columnCogRef = useRef<HTMLButtonElement>(null)
  const [tableColumnOrder, setTableColumnOrder] = useState<ReservationTableColumnId[]>(() =>
    loadReservationTableColumnOrder()
  )
  const [tableColumnsModalOpen, setTableColumnsModalOpen] = useState(false)

  useEffect(() => {
    saveReservationTableColumnOrder(tableColumnOrder)
  }, [tableColumnOrder])

  const reservationTableMinWidth = useMemo(
    () =>
      tableColumnOrder.reduce((acc, id) => acc + RESERVATION_TABLE_COLUMN_META[id].width, 0) +
      RESERVATION_ROW_ACTIONS_COL_PX,
    [tableColumnOrder]
  )

  const [rowActionsMenuRowId, setRowActionsMenuRowId] = useState<string | null>(null)
  const [addChargeGuestName, setAddChargeGuestName] = useState<string | null>(null)
  const rowActionsMenuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const rowActionsMenuPanelRef = useRef<HTMLDivElement>(null)

  const getRowActionsMenuAnchor = useCallback(() => {
    if (!rowActionsMenuRowId) return undefined
    return rowActionsMenuButtonRefs.current.get(rowActionsMenuRowId)
  }, [rowActionsMenuRowId])

  const { style: rowActionsMenuPosition, width: rowActionsMenuWidth } = useReservationRowMenuPosition(
    rowActionsMenuRowId !== null,
    getRowActionsMenuAnchor,
  )

  const [filters, setFilters] = useState<TableFilterValue>({
    source: [],
    status: [],
  })

  const sourceOptions = useMemo(
    () =>
      Array.from(new Set(reservationRows.map((row) => row.source))).map((source) => ({
        value: source,
        label: source,
      })),
    []
  )

  const filterTypes = useMemo(
    () => [
      { id: 'source', label: 'Channel', options: sourceOptions },
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'Reserved', label: 'Reserved' },
          { value: 'Cancelled', label: 'Cancelled' },
          { value: 'Checked in', label: 'Checked in' },
          { value: 'Pending', label: 'Pending' },
        ],
      },
    ],
    [sourceOptions]
  )

  const mergedReservationRows = useMemo(
    () => reservationRows.map((r) => ({ ...r, ...(rowOverrides[r.id] ?? {}) })),
    [rowOverrides]
  )

  const filteredRows = useMemo(() => {
    const rowsByFilter = mergedReservationRows.filter((row) => {
      const sourceMatch = filters.source.length === 0 || filters.source.includes(row.source)
      const statusMatch = filters.status.length === 0 || filters.status.includes(row.status)
      return sourceMatch && statusMatch
    })

    const query = searchQuery.trim().toLowerCase()
    if (!query) return rowsByFilter

    return rowsByFilter.filter((row) =>
      `${row.guestName} ${row.email} ${row.listingName} ${row.source}`.toLowerCase().includes(query)
    )
  }, [mergedReservationRows, filters.source, filters.status, searchQuery])

  const totalRows = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / itemsPerPage))

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, filters.source, filters.status, searchQuery, itemsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredRows.slice(start, start + itemsPerPage)
  }, [currentPage, filteredRows, itemsPerPage])

  const visibleCount = Math.min(currentPage * itemsPerPage, totalRows)

  const [viewportPaginationCompact, setViewportPaginationCompact] = useState(false)
  const [tableSectionNarrow, setTableSectionNarrow] = useState(false)
  const tableSectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setViewportPaginationCompact(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const el = tableSectionRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      setTableSectionNarrow(w > 0 && w < TABLE_SECTION_COMPACT_PX)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const paginationCompact = viewportPaginationCompact || tableSectionNarrow

  const pageTokens = useMemo(
    () => buildReservationPageTokens(currentPage, totalPages),
    [currentPage, totalPages]
  )
  const previewReservation = useMemo(
    () =>
      previewReservationId
        ? mergedReservationRows.find((r) => r.id === previewReservationId) ?? null
        : null,
    [previewReservationId, mergedReservationRows]
  )

  useEffect(() => {
    if (!rowActionsMenuRowId) return
    const onPointerDown = (event: PointerEvent) => {
      const panel = rowActionsMenuPanelRef.current
      const btn = rowActionsMenuButtonRefs.current.get(rowActionsMenuRowId)
      const t = event.target as Node
      if (panel?.contains(t) || btn?.contains(t)) return
      setRowActionsMenuRowId(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [rowActionsMenuRowId])

  useEffect(() => {
    if (!rowActionsMenuRowId) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRowActionsMenuRowId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rowActionsMenuRowId])


  return (
    <div className="flex min-h-0 flex-1 gap-0 transition-[gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
      <section
        ref={tableSectionRef}
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e9eaeb] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.05)]"
      >
      <PageHeader
        embedded
        showTabCounts={false}
        title="Reservations"
        tabs={[
          { key: 'reservations', label: 'Reservations' },
          { key: 'coupons', label: 'Coupons' },
          { key: 'guestbook', label: 'Guestbook' },
          { key: 'custom-fields', label: 'Custom Fields' },
        ]}
        activeTabKey={activeTab}
        onTabChange={(key) => setActiveTab(key as 'reservations' | 'coupons' | 'guestbook' | 'custom-fields')}
        secondaryActionLabel="More"
        onSecondaryActionClick={() => undefined}
        actionLabel="Add reservation"
        onActionClick={() => undefined}
        compactPrimaryActionOnSmallScreens
      />

      <div className="h-[72px] flex items-center justify-between gap-4 border-b border-[#e9eaeb] px-6">
        <TableFilter types={filterTypes} value={filters} onChange={setFilters} />
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative w-[280px]">
            <SearchLg
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#717680]"
              aria-hidden
            />
            <Input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search reservations"
              className="pl-10"
            />
          </div>
          <ReservationTableHeaderCogButton
            ref={columnCogRef}
            menuOpen={tableColumnsModalOpen}
            onClick={() => setTableColumnsModalOpen((o) => !o)}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-auto">
          <table
            className="w-full table-fixed border-collapse"
            style={{ minWidth: Math.max(640, reservationTableMinWidth) }}
          >
            <colgroup>
              {tableColumnOrder.map((cid) => (
                <col key={cid} style={{ width: RESERVATION_TABLE_COLUMN_META[cid].width }} />
              ))}
              <col style={{ width: RESERVATION_ROW_ACTIONS_COL_PX }} />
            </colgroup>
            <thead>
              <tr className={cn('border-b border-[#e9eaeb]', RESERVATION_TABLE_HEAD_BG)}>
                {tableColumnOrder.map((cid, colIndex) => (
                  <th
                    key={cid}
                    className={cn(
                      colIndex === 0
                        ? cn(
                            'sticky left-0 top-0 z-20 h-11 border-r border-[#e9eaeb] px-6 text-left text-[12px] font-semibold leading-[18px] text-[#414651]',
                            RESERVATION_TABLE_STICKY_HEAD_SHADOW_LEFT,
                          )
                        : 'sticky top-0 z-10 h-11 px-6 text-left text-[12px] font-semibold leading-[18px] text-[#414651]',
                      RESERVATION_TABLE_HEAD_BG,
                    )}
                  >
                    {RESERVATION_TABLE_COLUMN_META[cid].label}
                  </th>
                ))}
                <th
                  scope="col"
                  style={{ width: RESERVATION_ROW_ACTIONS_COL_PX, minWidth: RESERVATION_ROW_ACTIONS_COL_PX }}
                  className={cn(
                    'sticky top-0 right-0 z-30 h-11 border-l border-[#e9eaeb]',
                    RESERVATION_TABLE_STICKY_HEAD_SHADOW_RIGHT,
                    RESERVATION_TABLE_HEAD_BG,
                  )}
                >
                  <span className="sr-only">Quick view and row actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => {
                const isPreviewSelected = previewReservationId === row.id
                return (
                <tr
                  key={row.id}
                  className={cn(
                    'group h-[72px] cursor-pointer border-b border-[#e9eaeb] transition-[background-color,box-shadow,outline-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                    isPreviewSelected
                      ? cn(
                          PREVIEW_MINT_ROW_BG,
                          PREVIEW_MINT_SUBTLE_SHADOW,
                          'relative z-[1] outline outline-1 outline-[#d5ede9] outline-offset-[-1px]',
                          ACCENT_MINT_ROW_HOVER,
                        )
                      : cn('shadow-[inset_0_0_0_0_transparent]', ACCENT_MINT_ROW_HOVER),
                  )}
                  onClick={() => onOpenReservation(row)}
                >
                  {tableColumnOrder.map((cid, colIndex) => (
                    <td
                      key={cid}
                      className={cn(
                        reservationTableCellClass(cid),
                        'min-w-0 overflow-hidden align-middle transition-[background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        colIndex === 0 &&
                          cn(
                            'sticky left-0 z-10 border-r border-[#e9eaeb]',
                            RESERVATION_TABLE_STICKY_BODY_SHADOW_LEFT,
                            isPreviewSelected
                              ? cn(PREVIEW_MINT_ROW_BG, ACCENT_MINT_ROW_GROUP_HOVER)
                              : cn('bg-white', ACCENT_MINT_ROW_GROUP_HOVER),
                          ),
                      )}
                    >
                      {renderReservationTableDataCell(cid, row)}
                    </td>
                  ))}
                  <td
                    style={{ width: RESERVATION_ROW_ACTIONS_COL_PX, minWidth: RESERVATION_ROW_ACTIONS_COL_PX }}
                    className={cn(
                      'sticky right-0 z-20 border-l border-[#e9eaeb] pr-3 transition-[background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                      RESERVATION_TABLE_STICKY_BODY_SHADOW_RIGHT,
                      isPreviewSelected
                        ? cn(PREVIEW_MINT_ROW_BG, 'text-[#15b8b0]', ACCENT_MINT_ROW_GROUP_HOVER)
                        : cn('bg-white text-[#98a2b3]', ACCENT_MINT_ROW_GROUP_HOVER),
                    )}
                  >
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setRowActionsMenuRowId(null)
                          setPreviewReservationId(row.id)
                        }}
                        className={cn(
                          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-[background-color,transform] duration-200 ease-out',
                          isPreviewSelected
                            ? 'bg-[#15b8b0]/12 hover:bg-[#15b8b0]/20'
                            : 'hover:bg-[#f6f9fc]',
                        )}
                        aria-label={`Open reservation quick view for ${row.guestName}`}
                      >
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5',
                            isPreviewSelected && 'text-[#15b8b0]',
                          )}
                          aria-hidden
                        />
                      </button>
                      <button
                        type="button"
                        ref={(el) => {
                          if (el) rowActionsMenuButtonRefs.current.set(row.id, el)
                          else rowActionsMenuButtonRefs.current.delete(row.id)
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          setRowActionsMenuRowId((prev) => (prev === row.id ? null : row.id))
                        }}
                        className={cn(
                          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-[background-color,color] duration-200 ease-out hover:bg-[#f6f9fc]',
                          rowActionsMenuRowId === row.id && 'bg-[#f6f9fc] text-[#414651]',
                        )}
                        aria-label={`More actions for ${row.guestName}`}
                        aria-haspopup="menu"
                        aria-expanded={rowActionsMenuRowId === row.id}
                      >
                        <DotsHorizontal className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
                )
              })}
              {pagedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={tableColumnOrder.length + 1}
                    className="h-24 text-center text-[14px] text-[#717680]"
                  >
                    No reservations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <footer
          className={cn(
            'flex shrink-0 flex-col gap-3 border-t border-[#e9eaeb] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-6',
            paginationCompact ? 'min-h-[52px] sm:h-auto sm:min-h-[52px] sm:py-2' : 'min-h-[60px] sm:h-[60px] sm:py-0',
          )}
        >
          <p
            className={cn(
              'font-semibold text-[#414651]',
              paginationCompact ? 'text-[12px] leading-4' : 'text-[14px] leading-5',
            )}
          >
            {visibleCount} of {totalRows} reservations
          </p>
          <div
            className={cn('flex flex-wrap items-center', paginationCompact ? 'gap-1' : 'gap-2 sm:gap-3')}
          >
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-lg border bg-white font-semibold shadow-[0px_1px_2px_rgba(10,13,18,0.05)] disabled:cursor-not-allowed',
                paginationCompact
                  ? 'h-8 w-8 justify-center border-[#e9eaeb] p-0 text-[#a4a7ae]'
                  : 'h-9 border-[#e9eaeb] px-2.5 text-[14px] leading-5 text-[#a4a7ae] sm:px-3',
              )}
            >
              <ArrowNarrowLeft
                className={cn('shrink-0', paginationCompact ? 'h-4 w-4' : 'h-5 w-5')}
                aria-hidden
              />
              <span className={paginationCompact ? 'sr-only' : 'hidden md:inline'}>Previous</span>
            </button>
            <div className="flex flex-wrap items-center gap-0.5">
              {pageTokens.map((token, idx) =>
                token === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className={cn(
                      'inline-flex items-center justify-center text-[#717680]',
                      paginationCompact ? 'h-8 w-8 text-[13px] leading-4' : 'h-10 w-10 text-[14px] leading-5',
                    )}
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={token}
                    type="button"
                    onClick={() => setCurrentPage(token)}
                    className={cn(
                      'inline-flex items-center justify-center rounded-lg font-medium',
                      paginationCompact ? 'h-8 w-8 min-w-8 text-[13px] leading-4' : 'h-10 w-10 text-[14px] leading-5',
                      token === currentPage
                        ? 'bg-[#f6f9fc] text-[#414651]'
                        : 'text-[#717680] hover:bg-[#f6f9fc]',
                    )}
                  >
                    {token}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#d5d7da] bg-white font-semibold text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] disabled:cursor-not-allowed disabled:text-[#a4a7ae]',
                paginationCompact ? 'h-8 w-8 justify-center p-0' : 'h-9 px-2.5 text-[14px] leading-5 sm:px-3',
              )}
            >
              <span className={paginationCompact ? 'sr-only' : 'hidden md:inline'}>Next</span>
              <ArrowNarrowRight
                className={cn('shrink-0', paginationCompact ? 'h-4 w-4' : 'h-5 w-5')}
                aria-hidden
              />
            </button>
          </div>
          <div
            className={cn('flex flex-wrap items-center', paginationCompact ? 'gap-1.5' : 'gap-2 sm:gap-3')}
          >
            <p
              className={cn(
                'font-semibold text-[#414651]',
                paginationCompact ? 'text-[12px] leading-4' : 'text-[14px] leading-5',
              )}
            >
              Items per page:
            </p>
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(event) => setItemsPerPage(Number(event.target.value))}
                className={cn(
                  'appearance-none rounded-lg border border-[#d5d7da] bg-white font-semibold text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)]',
                  paginationCompact
                    ? 'h-8 pl-3 pr-8 text-[13px] leading-4'
                    : 'h-9 pl-4 pr-9 text-[14px] leading-5',
                )}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span
                className={cn(
                  'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#717680]',
                  paginationCompact ? 'right-2' : 'right-3',
                )}
              >
                <ChevronDown
                  className={cn(paginationCompact ? 'h-4 w-4' : 'h-5 w-5')}
                  aria-hidden
                />
              </span>
            </div>
          </div>
        </footer>
      </div>
    </section>
    <ReservationTableColumnsModal
      open={tableColumnsModalOpen}
      onClose={() => setTableColumnsModalOpen(false)}
      columnOrder={tableColumnOrder}
      onChangeOrder={setTableColumnOrder}
      anchorRef={columnCogRef}
    />
    <SlidingSidePanel show={!!previewReservation} motionKey="reservation-preview-panel">
      {previewReservation ? (
        <ReservationPreviewPanelBody
          reservation={previewReservation}
          onClose={() => setPreviewReservationId(null)}
          onOpenFullscreen={(r) => {
            onOpenReservation(r, { startInEditMode: false })
            setPreviewReservationId(null)
          }}
          onApplyReservationPatch={(id, partial) =>
            setRowOverrides((prev) => ({
              ...prev,
              [id]: { ...prev[id], ...partial },
            }))
          }
          paginationCompact={paginationCompact}
        />
      ) : null}
    </SlidingSidePanel>
    {rowActionsMenuRowId && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={rowActionsMenuPanelRef}
            role="menu"
            aria-label="Reservation actions"
            className="fixed z-[200] overflow-y-auto overflow-x-hidden rounded-lg border border-[#e9eaeb] bg-white py-1 shadow-[0px_20px_24px_-4px_rgba(10,13,18,0.08),0px_8px_8px_-4px_rgba(10,13,18,0.03),0px_3px_3px_-1.5px_rgba(10,13,18,0.04)]"
            style={{
              top: rowActionsMenuPosition.top,
              left: rowActionsMenuPosition.left,
              width: rowActionsMenuWidth,
              maxHeight: 'min(70vh, 480px)',
            }}
          >
            {RESERVATION_ROW_MENU_ADD_LABELS.map((label) => (
              <div key={label} className="px-1.5 py-px">
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[14px] font-semibold leading-5 text-[#414651] transition-colors hover:bg-[#f6f9fc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15b8b0]/25"
                  onClick={() => {
                    if (label === 'Add charge' && rowActionsMenuRowId) {
                      const row = mergedReservationRows.find((r) => r.id === rowActionsMenuRowId)
                      setAddChargeGuestName(row?.guestName ?? null)
                    }
                    setRowActionsMenuRowId(null)
                  }}
                >
                  <Plus className="h-4 w-4 shrink-0 text-[#98a2b3]" aria-hidden />
                  <span className="min-w-0">{label}</span>
                </button>
              </div>
            ))}
            <div className="px-0 py-1" role="separator">
              <div className="mx-2 h-px bg-[#e9eaeb]" />
            </div>
            {(['Guest profile (Airbnb)', 'Reservation (Airbnb)'] as const).map((label) => (
              <div key={label} className="px-1.5 py-px">
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[14px] font-semibold leading-5 text-[#414651] transition-colors hover:bg-[#f6f9fc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15b8b0]/25"
                  onClick={() => setRowActionsMenuRowId(null)}
                >
                  {AIRBNB_ROW_MENU_CHANNEL?.logo ? (
                    <span
                      className="flex h-4 w-4 shrink-0 overflow-hidden rounded-full shadow-[0px_1px_2px_rgba(10,13,18,0.08)] ring-1 ring-inset ring-black/5"
                      style={{
                        backgroundColor: AIRBNB_ROW_MENU_CHANNEL
                          ? getChannelLogoBackground(AIRBNB_ROW_MENU_CHANNEL)
                          : undefined,
                      }}
                    >
                      <img
                        src={AIRBNB_ROW_MENU_CHANNEL.logo}
                        alt=""
                        className="h-full w-full object-cover"
                        aria-hidden
                      />
                    </span>
                  ) : (
                    <span className="h-4 w-4 shrink-0 rounded-full bg-[#f2f4f7]" aria-hidden />
                  )}
                  <span className="min-w-0">{label}</span>
                </button>
              </div>
            ))}
            <div className="px-0 py-1" role="separator">
              <div className="mx-2 h-px bg-[#e9eaeb]" />
            </div>
            <div className="px-1.5 py-px">
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[14px] font-semibold leading-5 text-[#414651] transition-colors hover:bg-[#fef3f2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f04438]/25"
                onClick={() => setRowActionsMenuRowId(null)}
              >
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#f04438]"
                  aria-hidden
                >
                  <XClose className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
                </span>
                <span className="min-w-0">Cancel reservation</span>
              </button>
            </div>
          </div>,
          document.body,
        )
      : null}
    <AddChargeDrawer
      open={addChargeGuestName !== null}
      guestName={addChargeGuestName}
      onClose={() => setAddChargeGuestName(null)}
    />
    </div>
  )
}
