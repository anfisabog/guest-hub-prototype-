export const RESERVATION_TABLE_COLUMN_STORAGE_KEY = 'reservation_list_table_columns_v1'

/** Column groups for the table-column picker (left panel). */
export type ReservationColumnCategoryId =
  | 'guest_contact'
  | 'stay_property'
  | 'channel_booking'
  | 'payments'
  | 'operations'
  | 'notes'

export const RESERVATION_COLUMN_CATEGORY_ORDER: readonly {
  id: ReservationColumnCategoryId
  label: string
}[] = [
  { id: 'guest_contact', label: 'Guest & contact' },
  { id: 'stay_property', label: 'Stay & property' },
  { id: 'channel_booking', label: 'Channel & booking' },
  { id: 'payments', label: 'Payments' },
  { id: 'operations', label: 'Operations' },
  { id: 'notes', label: 'Notes' },
] as const

export const RESERVATION_TABLE_COLUMN_IDS = [
  'guest',
  'listing',
  'stayDates',
  'guests',
  'channel',
  'status',
  'confirmationCode',
  'email',
  'phone',
  'country',
  'city',
  'language',
  'currency',
  'checkInTime',
  'checkOutTime',
  'nights',
  'children',
  'infants',
  'pets',
  'paymentStatus',
  'balanceDue',
  'remainingCharges',
  'totalAmount',
  'bookingType',
  'checkInMethod',
  'roomType',
  'assignedTeam',
  'cleaningStatus',
  'arrivalWindow',
  'departureWindow',
  'host',
  'houseRules',
  'notes',
  'specialRequests',
] as const

export type ReservationTableColumnId = (typeof RESERVATION_TABLE_COLUMN_IDS)[number]

export const RESERVATION_TABLE_COLUMN_META: Record<
  ReservationTableColumnId,
  { label: string; width: number; category: ReservationColumnCategoryId }
> = {
  guest: { label: 'Guest', width: 270, category: 'guest_contact' },
  listing: { label: 'Listing', width: 250, category: 'stay_property' },
  stayDates: { label: 'Stay dates', width: 280, category: 'stay_property' },
  guests: { label: 'Guests', width: 100, category: 'stay_property' },
  channel: { label: 'Channel', width: 140, category: 'channel_booking' },
  status: { label: 'Status', width: 130, category: 'channel_booking' },
  confirmationCode: { label: 'Confirmation code', width: 170, category: 'channel_booking' },
  email: { label: 'Email', width: 220, category: 'guest_contact' },
  phone: { label: 'Phone', width: 140, category: 'guest_contact' },
  country: { label: 'Country', width: 120, category: 'guest_contact' },
  city: { label: 'City', width: 120, category: 'guest_contact' },
  language: { label: 'Language', width: 110, category: 'guest_contact' },
  currency: { label: 'Currency', width: 110, category: 'guest_contact' },
  checkInTime: { label: 'Check-in time', width: 120, category: 'stay_property' },
  checkOutTime: { label: 'Check-out time', width: 120, category: 'stay_property' },
  nights: { label: 'Nights', width: 90, category: 'stay_property' },
  children: { label: 'Children', width: 90, category: 'stay_property' },
  infants: { label: 'Infants', width: 90, category: 'stay_property' },
  pets: { label: 'Pets', width: 80, category: 'stay_property' },
  paymentStatus: { label: 'Payment status', width: 140, category: 'payments' },
  balanceDue: { label: 'Balance due', width: 120, category: 'payments' },
  remainingCharges: { label: 'Remaining charges', width: 150, category: 'payments' },
  totalAmount: { label: 'Total', width: 120, category: 'payments' },
  bookingType: { label: 'Booking type', width: 160, category: 'channel_booking' },
  checkInMethod: { label: 'Check-in method', width: 150, category: 'channel_booking' },
  roomType: { label: 'Room type', width: 130, category: 'channel_booking' },
  assignedTeam: { label: 'Assigned team', width: 150, category: 'operations' },
  cleaningStatus: { label: 'Cleaning status', width: 140, category: 'operations' },
  arrivalWindow: { label: 'Arrival window', width: 150, category: 'operations' },
  departureWindow: { label: 'Departure window', width: 150, category: 'operations' },
  host: { label: 'Host', width: 140, category: 'operations' },
  houseRules: { label: 'House rules', width: 160, category: 'operations' },
  notes: { label: 'Notes', width: 220, category: 'notes' },
  specialRequests: { label: 'Special requests', width: 220, category: 'notes' },
}

/** Default matches original reservations table. */
export const DEFAULT_RESERVATION_TABLE_COLUMN_ORDER: ReservationTableColumnId[] = [
  'guest',
  'listing',
  'stayDates',
  'guests',
  'channel',
  'status',
]

const idSet = new Set<string>(RESERVATION_TABLE_COLUMN_IDS)

export function parseReservationTableColumnOrder(raw: unknown): ReservationTableColumnId[] | null {
  if (!Array.isArray(raw)) return null
  const out: ReservationTableColumnId[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (typeof item !== 'string' || !idSet.has(item) || seen.has(item)) continue
    seen.add(item)
    out.push(item as ReservationTableColumnId)
  }
  if (out.length === 0) return null
  return out
}

export function loadReservationTableColumnOrder(): ReservationTableColumnId[] {
  if (typeof window === 'undefined') return [...DEFAULT_RESERVATION_TABLE_COLUMN_ORDER]
  try {
    const raw = JSON.parse(window.localStorage.getItem(RESERVATION_TABLE_COLUMN_STORAGE_KEY) ?? '')
    const parsed = parseReservationTableColumnOrder(raw?.order ?? raw)
    return parsed ?? [...DEFAULT_RESERVATION_TABLE_COLUMN_ORDER]
  } catch {
    return [...DEFAULT_RESERVATION_TABLE_COLUMN_ORDER]
  }
}

export function saveReservationTableColumnOrder(order: ReservationTableColumnId[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    RESERVATION_TABLE_COLUMN_STORAGE_KEY,
    JSON.stringify({ order })
  )
}
