import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  Attachment01,
  BarChart10,
  Calendar,
  Check,
  ChevronDown,
  Clipboard,
  Clock,
  CodeSnippet01,
  CreditCard01,
  DotsHorizontal,
  Edit01,
  File02,
  HomeLine,
  LinkExternal02,
  Mail01,
  MessageChatSquare,
  Moon01,
  Phone01,
  Plus,
  Save01,
  Star01,
  Send01,
  Type01,
  Paperclip,
  Grid01,
  UserCircle,
  Users03,
  XClose,
} from '@untitled-ui/icons-react'
import { Button } from '@/components/ui'
import { getChannelById } from '@/config/channels'
import { cn } from '@/lib/cn'
import { SlidingSidePanel } from '@/lib/motion'
import { reservationGuestAvatarUrl, RESERVATION_AVATAR_SRC_PANEL } from '@/lib/reservationGuestAvatar'
import { RESERVATION_SOURCE_TO_CHANNEL_ID } from './reservationSourceChannel'
import { ChannelAvatarCircle } from './TableColumnAvatar'
import { ReservationTemplateKeyInsightsSection } from './reservationTemplateKeyInsights'

export type ReservationForm = {
  /** Guest profile image (read-only display; synced from reservation list). */
  profileImageUrl: string
  /** Key insights strip (aligned with reservation list / preview panel). */
  reservationStatus: string
  paymentStatus: string
  balanceDue: string
  remainingCharges: string
  totalAmount: string
  doorCode: string
  rentalAgreementStatus: string
  baseRate: string
  pmCommission: string
  name: string
  email: string
  phone: string
  country: string
  city: string
  language: string
  currency: string
  listing: string
  checkInDate: string
  checkInTime: string
  checkOutDate: string
  checkOutTime: string
  nights: string
  adults: string
  children: string
  infants: string
  pets: string
  source: string
  confirmationCode: string
  bookingType: string
  checkInMethod: string
  roomType: string
  notes: string
  specialRequests: string
  assignedTeam: string
  cleaningStatus: string
  arrivalWindow: string
  departureWindow: string
  host: string
  houseRules: string
}

type FieldType = 'text' | 'select' | 'textarea'

type FieldConfig = {
  key: keyof ReservationForm
  label: string
  type?: FieldType
  icon?: 'mail' | 'country' | 'calendar' | 'clock' | 'phone'
  required?: boolean
  options?: string[]
}

export interface ReservationDetailsSummary {
  /** When opened from the list, used for avatars and message thread identity. */
  reservationId?: string
  guestName: string
  checkInDate: string
  checkOutDate: string
  guests: number
  source: string
  listingName: string
  nights: number
}

type TemplateChatAuthor = 'guest' | 'me'

interface TemplateChatMessage {
  id: string
  author: TemplateChatAuthor
  name: string
  time: string
  text: string
}

const TEMPLATE_RANDOM_GUEST_REPLIES = [
  'Absolutely, that works for me. Thank you!',
  'Perfect, really appreciate the quick reply.',
  'Great, thanks! That sounds good.',
  'Amazing, thanks for helping with this.',
  'Sounds great. Looking forward to it!',
]

function buildTemplateInitialMessages(guestName: string, idPrefix: string): TemplateChatMessage[] {
  return [
    {
      id: `${idPrefix}-guest-1`,
      author: 'guest',
      name: guestName,
      time: 'Today 2:20pm',
      text: 'Hey, can I check out later please? Around 12:00-13:00 would be great.',
    },
    {
      id: `${idPrefix}-me-1`,
      author: 'me',
      name: 'You',
      time: 'Just now',
      text: 'Sure thing, I will have a look today. They are looking great!',
    },
  ]
}

const internalNavItems = [
  { label: 'Overview' },
  { label: 'Payment' },
  { label: 'Guests', badge: '5' },
  { label: 'Financials' },
  { label: 'Custom fields' },
  { label: 'Attachments' },
  { label: 'Tasks' },
  { label: 'Reviews' },
  { label: 'Logs' },
]

const languageOptions = ['English', 'Spanish', 'French']
const currencyOptions = ['USD ($)', 'EUR (€)', 'GBP (£)']
const countryOptions = ['United States', 'Spain', 'United Kingdom']
const listingOptions = ['House in Barcelona (843213)', 'Villa in Lisbon (103992)']
const guestCountOptions = ['0', '1', '2', '3', '4', '5']
const sourceOptions = ['Airbnb', 'Direct booking', 'Booking.com']
const bookingTypeOptions = ['Instant booking', 'Request to book']
const checkInMethodOptions = ['Self check-in', 'Meet and greet', 'Key lockbox']
const roomTypeOptions = ['Entire home', 'Private room']
const assignedTeamOptions = ['Barcelona Team', 'Guest Experience', 'Operations']
const cleaningStatusOptions = ['Scheduled', 'In progress', 'Complete']
const timeWindowOptions = ['Anytime', '3:00 PM - 5:00 PM', '5:00 PM - 7:00 PM']
const hostOptions = ['Emily Johnson', 'Maria Lopez', 'Javier Ruiz']
const houseRulesOptions = ['Standard rules', 'Family friendly', 'Quiet hours after 10 PM']

const initialReservation: ReservationForm = {
  profileImageUrl: '',
  reservationStatus: 'Reserved',
  paymentStatus: 'Paid',
  balanceDue: '$0.00',
  remainingCharges: '$162.00',
  totalAmount: '$900.00',
  doorCode: '2021',
  rentalAgreementStatus: 'Not signed',
  baseRate: '$720.00',
  pmCommission: '$180.00',
  name: 'Emily Johnson',
  email: 'emily.johnson@gmail.com',
  phone: '+1 233 324 3245',
  country: 'United States',
  city: 'New York',
  language: 'English',
  currency: 'USD ($)',
  listing: 'House in Barcelona (843213)',
  checkInDate: 'May 1 2026',
  checkInTime: '',
  checkOutDate: 'May 12 2026',
  checkOutTime: '',
  nights: '11',
  adults: '5',
  children: '0',
  infants: '0',
  pets: '0',
  source: 'Airbnb',
  confirmationCode: 'ABR-843213-7781',
  bookingType: 'Instant booking',
  checkInMethod: 'Self check-in',
  roomType: 'Entire home',
  notes: 'Guest asked for an early luggage drop-off if possible.',
  specialRequests: 'Vegetarian welcome basket and two extra towels.',
  assignedTeam: 'Barcelona Team',
  cleaningStatus: 'Scheduled',
  arrivalWindow: '5:00 PM - 7:00 PM',
  departureWindow: 'Anytime',
  host: 'Emily Johnson',
  houseRules: 'Standard rules',
}

const bookedByFields: FieldConfig[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email', icon: 'mail' },
  { key: 'phone', label: 'Phone', icon: 'phone' },
  { key: 'country', label: 'Country', type: 'select', icon: 'country', options: countryOptions },
  { key: 'city', label: 'City' },
  { key: 'language', label: 'Language', type: 'select', options: languageOptions },
  { key: 'currency', label: 'Currency', type: 'select', options: currencyOptions },
]

const stayFields: FieldConfig[] = [
  { key: 'listing', label: 'Listing', type: 'select', required: true, options: listingOptions },
  { key: 'checkInDate', label: 'Check-in date', icon: 'calendar', required: true },
  { key: 'checkInTime', label: 'Check-in time', icon: 'clock' },
  { key: 'checkOutDate', label: 'Check-out date', icon: 'calendar', required: true },
  { key: 'checkOutTime', label: 'Check-out time', icon: 'clock' },
  { key: 'nights', label: 'Nights of stay' },
  { key: 'adults', label: 'Adults', type: 'select', options: guestCountOptions },
  { key: 'children', label: 'Children', type: 'select', options: guestCountOptions },
  { key: 'infants', label: 'Infants', type: 'select', options: guestCountOptions },
  { key: 'pets', label: 'Pets', type: 'select', options: guestCountOptions },
  { key: 'source', label: 'Source', type: 'select', options: sourceOptions },
  { key: 'confirmationCode', label: 'Confirmation code' },
]

const notesFields: FieldConfig[] = [
  { key: 'notes', label: 'Guest notes', type: 'textarea' },
  { key: 'specialRequests', label: 'Special requests', type: 'textarea' },
]

const operationsFields: FieldConfig[] = [
  { key: 'assignedTeam', label: 'Assigned team', type: 'select', options: assignedTeamOptions },
  { key: 'cleaningStatus', label: 'Cleaning status', type: 'select', options: cleaningStatusOptions },
  { key: 'arrivalWindow', label: 'Arrival window', type: 'select', options: timeWindowOptions },
  { key: 'departureWindow', label: 'Departure window', type: 'select', options: timeWindowOptions },
  { key: 'bookingType', label: 'Booking type', type: 'select', options: bookingTypeOptions },
  { key: 'checkInMethod', label: 'Check-in method', type: 'select', options: checkInMethodOptions },
  { key: 'roomType', label: 'Room type', type: 'select', options: roomTypeOptions },
  { key: 'host', label: 'Host', type: 'select', options: hostOptions },
  { key: 'houseRules', label: 'House rules', type: 'select', options: houseRulesOptions },
]

const fieldInputIconClass = 'h-4 w-4 shrink-0 text-[#98a2b3]'

const LAYOUT_STORAGE_KEY = 'reservation-template-layout-variant'

type PageLayoutVariant = 'comfortable' | 'compact' | 'modern'

function SectionNavIcon({ label }: { label: string }) {
  const p = { width: 18, height: 18, className: 'shrink-0 text-[#98a2b3]' } as const
  switch (label) {
    case 'Overview':
      return <HomeLine {...p} />
    case 'Payment':
      return <CreditCard01 {...p} />
    case 'Guests':
      return <Users03 {...p} />
    case 'Financials':
      return <BarChart10 {...p} />
    case 'Custom fields':
      return <CodeSnippet01 {...p} />
    case 'Attachments':
      return <Attachment01 {...p} />
    case 'Tasks':
      return <Clipboard {...p} />
    case 'Reviews':
      return <Star01 {...p} />
    default:
      return <File02 {...p} />
  }
}

function StatusPill({
  label,
  tone,
}: {
  label: string
  tone: 'success' | 'danger'
}) {
  const tones = {
    success: 'border-[#abefc6] bg-[#ecfdf3] text-[#067647]',
    danger: 'border-[#fecdca] bg-[#fef3f2] text-[#b42318]',
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] font-medium leading-[18px] ${tones[tone]}`}>
      {label}
    </span>
  )
}

function HeaderMeta({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[14px] leading-5 text-[#181d27]">
      {icon}
      {children}
    </span>
  )
}

function ReservationHeaderSourceIcon({ source }: { source: string }) {
  const channelId = RESERVATION_SOURCE_TO_CHANNEL_ID[source]
  const channel = channelId ? getChannelById(channelId) : undefined
  const isDirect =
    source === 'Direct' ||
    source === 'Direct booking' ||
    source.toLowerCase().includes('direct')

  if (channel) {
    return (
      <span
        className="inline-flex shrink-0 overflow-hidden rounded-full shadow-[0px_1px_2px_rgba(10,13,18,0.08)] ring-1 ring-inset ring-black/5"
        aria-hidden
      >
        <ChannelAvatarCircle channelId={channelId} size={18} />
      </span>
    )
  }

  return (
    <span
      className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f2f4f7] text-[9px] font-semibold leading-none text-[#667085] shadow-[0px_1px_2px_rgba(10,13,18,0.08)] ring-1 ring-inset ring-black/5"
      aria-hidden
    >
      {isDirect ? 'D' : '?'}
    </span>
  )
}

function PageSection({
  title,
  children,
  withDivider = true,
  tableLayout = false,
  headerActions,
}: {
  title: string
  children: ReactNode
  withDivider?: boolean
  tableLayout?: boolean
  headerActions?: ReactNode
}) {
  const sectionClass = cn(
    withDivider ? 'border-t border-[#e9eaeb] pt-10' : '',
    !withDivider && 'pt-0',
  )

  if (tableLayout) {
    return (
      <section className={sectionClass}>
        <div className="w-full min-w-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-stretch gap-2.5">
              <span className="w-px shrink-0 rounded-full bg-[#15b8b0]" aria-hidden />
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold leading-5 tracking-tight text-[#101828]">
                  {title}
                </h3>
              </div>
            </div>
            {headerActions ? (
              <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
                {headerActions}
              </div>
            ) : null}
          </div>
          <div className="w-full min-w-0 overflow-hidden rounded-xl border border-[#e9eaeb] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.04)]">
            {children}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={sectionClass}>
      <div
        className={cn(
          'grid grid-cols-1 gap-9 items-start',
          'lg:max-xl:grid-cols-[minmax(200px,280px)_minmax(560px,1fr)] lg:max-xl:gap-x-9',
          'xl:grid-cols-[minmax(200px,1fr)_minmax(560px,1fr)_minmax(200px,1fr)] xl:gap-x-9',
        )}
      >
        <div className="min-w-0">
          <div className="flex items-stretch gap-2.5">
            <span
              className="w-px shrink-0 rounded-full bg-[#15b8b0]"
              aria-hidden
            />
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold leading-5 tracking-tight text-[#101828]">
                {title}
              </h3>
            </div>
          </div>
        </div>
        <div className="flex min-w-0 w-full justify-center">
          <div className="w-full max-w-[560px] rounded-xl border border-[#e9eaeb] bg-white px-5 py-5 shadow-[0px_1px_2px_rgba(10,13,18,0.04)] sm:px-6 sm:py-5">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}

function getFieldIcon(icon?: FieldConfig['icon']) {
  switch (icon) {
    case 'mail':
      return <Mail01 className={fieldInputIconClass} aria-hidden />
    case 'phone':
      return <Phone01 className={fieldInputIconClass} aria-hidden />
    case 'country':
      return <span className="text-[18px] leading-none">🇺🇸</span>
    case 'calendar':
      return <Calendar className={fieldInputIconClass} aria-hidden />
    case 'clock':
      return <Clock className={fieldInputIconClass} aria-hidden />
    default:
      return null
  }
}

const fieldControlHeightClass = 'min-h-10 h-10'
const fieldTextareaMinClass = 'min-h-[88px]'
/** Compact overview / payment — denser than comfortable, still above modern row rhythm. */
const compactControlHeightClass = 'min-h-9 h-9'
const compactTextareaMinClass = 'min-h-[72px]'
const modernControlHeightClass = 'min-h-9 h-9'
const modernTextareaMinClass = 'min-h-[80px]'
/** Untitled-style modern read-only value (single-line). */
const modernReadValueClass = 'text-[14px] font-semibold leading-5 tracking-tight text-[#101828]'
const modernEditControlRing =
  'rounded-md border border-[#d0d5dd] bg-white transition-[border-color,box-shadow] duration-100 ease-linear placeholder:text-[#667085] focus:border-[#15b8b0] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/20'

function ReservationField({
  field,
  value,
  isEditing,
  onChange,
  layoutVariant,
}: {
  field: FieldConfig
  value: string
  isEditing: boolean
  onChange: (value: string) => void
  layoutVariant: PageLayoutVariant
}) {
  const icon = getFieldIcon(field.icon)
  const isModern = layoutVariant === 'modern'
  const isCompact = layoutVariant === 'compact'
  const isCompactLike = isCompact || isModern
  const controlHeightClass = isModern
    ? modernControlHeightClass
    : isCompact
      ? compactControlHeightClass
      : fieldControlHeightClass
  const textareaMinClass = isModern
    ? modernTextareaMinClass
    : isCompact
      ? compactTextareaMinClass
      : fieldTextareaMinClass
  const readSurface = isModern
    ? ''
    : isCompactLike
      ? 'border border-transparent bg-transparent shadow-none'
      : 'bg-[#f6f9fc] ring-1 ring-inset ring-[#f2f4f7]'

  if (!isEditing) {
    if (field.type === 'textarea') {
      return (
        <div
          className={cn(
            'w-full text-[#101828]',
            isModern
              ? 'rounded-lg border border-[#eaecf0] bg-[#fafbfb] px-3 py-2.5 text-[14px] font-normal leading-6'
              : cn(
                  'rounded-lg',
                  isCompact ? 'px-2.5 py-2 text-[13px] leading-5' : 'px-3 py-2.5 text-[14px] leading-6',
                  readSurface,
                ),
            textareaMinClass,
          )}
        >
          <span
            className={cn(
              'block whitespace-pre-wrap break-words',
              isModern && 'text-[14px] font-medium leading-6 text-[#101828]',
            )}
          >
            {value || '—'}
          </span>
        </div>
      )
    }
    return (
      <div
        className={cn(
          'flex w-full min-w-0 items-center py-0',
          isModern
            ? 'min-h-9 rounded-md px-0 leading-5'
            : cn(
                'rounded-lg font-medium text-[#101828]',
                isCompact ? 'px-0 text-[13px] leading-4' : 'px-3 text-[14px] leading-5',
                controlHeightClass,
                readSurface,
              ),
        )}
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-left',
            isModern && modernReadValueClass,
            !isModern && 'text-[#101828]',
            !isModern && (isCompact ? 'leading-4' : 'leading-5'),
          )}
        >
          {value || '—'}
        </span>
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'w-full resize-y text-[#101828]',
          isCompact ? 'px-2.5' : 'px-3',
          isModern
            ? cn(modernEditControlRing, 'py-2.5 text-[14px] leading-5', textareaMinClass)
            : cn(
                'rounded-lg border border-[#d5d7da] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.05)] placeholder:text-[#98a2b3] focus:border-[#15b8b0] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/20',
                isCompact ? 'px-2.5 py-2 text-[13px] leading-5' : 'px-3 py-2.5 text-[14px] leading-6',
                textareaMinClass,
              ),
        )}
      />
    )
  }

  if (field.type === 'select') {
    const iconPad = isModern ? 'pl-8' : 'pl-9'
    const noIconPad = isModern ? 'pl-3' : 'pl-3'
    const iconLeft = isModern ? 'left-3' : 'left-3'
    const chevronRight = isModern ? 'right-3' : 'right-3'
    const chevronPr = isModern ? 'pr-9' : 'pr-9'

    return (
      <div className="relative w-full max-w-full">
        {icon ? (
          <span
            className={`pointer-events-none absolute ${iconLeft} top-1/2 z-10 -translate-y-1/2 text-[#98a2b3]`}
          >
            {icon}
          </span>
        ) : null}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            `box-border ${controlHeightClass} w-full appearance-none py-0`,
            isModern
              ? cn(modernEditControlRing, 'text-[14px] leading-9')
              : cn(
                  'rounded-lg border border-[#d5d7da] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:border-[#15b8b0] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/20',
                  isCompact ? 'text-[13px] leading-9' : 'text-[14px] leading-10',
                ),
            chevronPr,
            icon ? iconPad : noIconPad,
          )}
        >
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span
          className={`pointer-events-none absolute ${chevronRight} top-1/2 -translate-y-1/2 text-[#98a2b3]`}
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </span>
      </div>
    )
  }

  const inputIconPad = isModern ? 'pl-8' : 'pl-9'
  const inputNoIconPad = isModern ? 'pl-3' : 'pl-3'
  const inputIconLeft = isModern ? 'left-3' : 'left-3'
  const inputPr = isModern ? 'pr-3' : 'pr-3'

  return (
    <div className="relative w-full max-w-full">
      {icon ? (
        <span
          className={`pointer-events-none absolute ${inputIconLeft} top-1/2 z-10 -translate-y-1/2 text-[#98a2b3]`}
        >
          {icon}
        </span>
      ) : null}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          `box-border ${controlHeightClass} w-full py-0`,
          isModern
            ? cn(modernEditControlRing, 'text-[14px] leading-9')
            : cn(
                'rounded-lg border border-[#d5d7da] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:border-[#15b8b0] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/20',
                isCompact ? 'text-[13px] leading-9' : 'text-[14px] leading-10',
              ),
          inputPr,
          icon ? inputIconPad : inputNoIconPad,
        )}
      />
    </div>
  )
}

function FieldRow({
  field,
  value,
  isEditing,
  onChange,
  layoutVariant,
}: {
  field: FieldConfig
  value: string
  isEditing: boolean
  onChange: (value: string) => void
  layoutVariant: PageLayoutVariant
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium leading-4 text-[#667085]">
        {field.label}
        {field.required ? <span className="text-[#15b8b0]"> *</span> : null}
      </label>
      <ReservationField
        field={field}
        value={value}
        isEditing={isEditing}
        onChange={onChange}
        layoutVariant={layoutVariant}
      />
    </div>
  )
}

function CompactFieldRow({
  field,
  value,
  isEditing,
  onChange,
  labelWidthClass,
}: {
  field: FieldConfig
  value: string
  isEditing: boolean
  onChange: (value: string) => void
  labelWidthClass: string
}) {
  const isTextarea = field.type === 'textarea'
  return (
    <div className={cn('flex w-full gap-2', isTextarea ? 'items-start' : 'items-center')}>
      <label
        className={cn(
          'shrink-0 text-[13px] leading-4 text-[#535862]',
          labelWidthClass,
          isTextarea ? 'pt-1.5' : '',
        )}
      >
        {field.label}
        {field.required ? <span className="font-bold text-[#339c99]"> *</span> : null}
      </label>
      <div className="min-w-0 flex-1">
        <ReservationField
          field={field}
          value={value}
          isEditing={isEditing}
          onChange={onChange}
          layoutVariant="compact"
        />
      </div>
    </div>
  )
}

function CompactPageSection({
  title,
  children,
  first,
  tableLayout = false,
  headerActions,
}: {
  title: string
  children: ReactNode
  first?: boolean
  tableLayout?: boolean
  headerActions?: ReactNode
}) {
  const sectionClass = cn(first ? 'pt-0' : 'border-t border-[#e9eaeb] pt-8')

  if (tableLayout) {
    return (
      <section className={sectionClass}>
        <div className="w-full min-w-0 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-stretch gap-2.5">
              <span className="w-px shrink-0 rounded-full bg-[#15b8b0]" aria-hidden />
              <div className="min-w-0">
                <h3 className="text-[14px] font-semibold leading-5 tracking-tight text-[#101828]">
                  {title}
                </h3>
              </div>
            </div>
            {headerActions ? (
              <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                {headerActions}
              </div>
            ) : null}
          </div>
          <div className="w-full min-w-0 overflow-hidden rounded-xl border border-[#e9eaeb] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.04)]">
            {children}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={sectionClass}>
      <div
        className={cn(
          'grid grid-cols-1 gap-5 items-start',
          'lg:max-xl:grid-cols-[minmax(200px,280px)_minmax(0,560px)] lg:max-xl:gap-x-8',
          'xl:grid-cols-[minmax(200px,1fr)_minmax(0,560px)_minmax(200px,1fr)] xl:gap-x-8',
        )}
      >
        <div className="min-w-0">
          <div className="flex items-stretch gap-2.5">
            <span
              className="w-px shrink-0 rounded-full bg-[#15b8b0]"
              aria-hidden
            />
            <div className="min-w-0">
              <h3 className="text-[14px] font-semibold leading-5 tracking-tight text-[#101828]">
                {title}
              </h3>
            </div>
          </div>
        </div>
        <div className="flex min-w-0 w-full justify-center">
          <div className="w-full max-w-[560px] space-y-2.5">{children}</div>
        </div>
      </div>
    </section>
  )
}

/** Matches `ModernFieldRow` / modern key–value rows so section titles line up with field labels. */
const modernSectionHeaderGridClass =
  'grid grid-cols-[minmax(0,148px)_minmax(0,1fr)] items-center gap-x-6 px-5 py-3 lg:grid-cols-[minmax(0,168px)_minmax(0,1fr)] lg:gap-x-8'

/** Same grid as comfortable `PageSection` so modern section titles align with that layout. */
const modernPageSectionGridClass = cn(
  'grid grid-cols-1 gap-9 items-start',
  'lg:max-xl:grid-cols-[minmax(200px,280px)_minmax(560px,1fr)] lg:max-xl:gap-x-9',
  'xl:grid-cols-[minmax(200px,1fr)_minmax(560px,1fr)_minmax(200px,1fr)] xl:gap-x-9',
)

const modernPageSectionNarrowCardClass =
  'w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#e9eaeb] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.04)]'
const modernPageSectionWideCardClass =
  'w-full min-w-0 overflow-hidden rounded-2xl border border-[#e9eaeb] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.04)]'

function ModernPageSection({
  title,
  children,
  first,
  headerActions,
}: {
  title: string
  children: ReactNode
  first?: boolean
  headerActions?: ReactNode
}) {
  const sectionClass = cn(first ? 'pt-0' : 'border-t border-[#e9eaeb] pt-10')

  const titleBlock = (
    <div className="flex items-stretch gap-2.5">
      <span className="w-px shrink-0 rounded-full bg-[#15b8b0]" aria-hidden />
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold leading-5 tracking-tight text-[#101828]">{title}</h3>
      </div>
    </div>
  )

  if (headerActions) {
    return (
      <section className={sectionClass}>
        <div className="w-full min-w-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">{titleBlock}</div>
            <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
              {headerActions}
            </div>
          </div>
          <div className={modernPageSectionWideCardClass}>
            <div className="bg-white">{children}</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={sectionClass}>
      <div className={modernPageSectionGridClass}>
        <div className="min-w-0">{titleBlock}</div>
        <div className="flex min-w-0 w-full justify-center">
          <div className={modernPageSectionNarrowCardClass}>
            <div className="bg-white">{children}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ModernFieldRow({
  field,
  value,
  isEditing,
  onChange,
}: {
  field: FieldConfig
  value: string
  isEditing: boolean
  onChange: (value: string) => void
}) {
  const isTextarea = field.type === 'textarea'
  return (
    <div
      className={cn(
        'relative grid grid-cols-[minmax(0,148px)_minmax(0,1fr)] gap-x-6 px-5 lg:grid-cols-[minmax(0,168px)_minmax(0,1fr)] lg:gap-x-8',
        isTextarea ? 'items-start py-2' : 'items-center py-2',
        'border-b border-[#f0f2f5] last:border-b-0',
      )}
    >
      <label
        className={cn(
          'text-[14px] font-medium leading-5 text-[#475467]',
          isTextarea ? 'pt-0.5' : '',
        )}
      >
        {field.label}
        {field.required ? <span className="text-[#15b8b0]"> *</span> : null}
      </label>
      <div className="min-w-0">
        <ReservationField
          field={field}
          value={value}
          isEditing={isEditing}
          onChange={onChange}
          layoutVariant="modern"
        />
      </div>
    </div>
  )
}

type PaymentChargeDemo = {
  id: string
  name: string
  status: 'Paid' | 'Unpaid'
  dueDate: string
  dueTime: string
  chargeDate: string
  chargeTime: string
  amount: string
}

const PAYMENT_CHARGES_DEMO: PaymentChargeDemo[] = [
  {
    id: '1',
    name: 'Charge 1',
    status: 'Paid',
    dueDate: '16 May 2025',
    dueTime: '10:30 AM',
    chargeDate: '16 May 2025',
    chargeTime: '10:30 AM',
    amount: '$1200.00',
  },
  {
    id: '2',
    name: 'Charge 2',
    status: 'Paid',
    dueDate: '16 May 2025',
    dueTime: '10:30 AM',
    chargeDate: '16 May 2025',
    chargeTime: '10:30 AM',
    amount: '$300.00',
  },
]

function PaymentChargeTypeBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-[#abefc6] bg-[#ecfdf3] px-2 py-0.5 text-[12px] font-medium leading-[18px] text-[#067647]">
      Charge
    </span>
  )
}

function PaymentPaidBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[#d5d7da] bg-white px-1.5 py-0.5 text-[12px] font-medium leading-[18px] text-[#414651]">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#17b26a]" aria-hidden />
      Paid
    </span>
  )
}

function VisaBrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex h-8 w-[46px] shrink-0 items-center justify-center rounded border border-[#e9eaeb] bg-white',
        className,
      )}
      aria-hidden
    >
      <span className="text-[11px] font-bold italic tracking-tight text-[#1a1f71]">VISA</span>
    </span>
  )
}

function MastercardBrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative flex h-8 w-[46px] shrink-0 items-center justify-center overflow-hidden rounded border border-[#e9eaeb] bg-white',
        className,
      )}
      aria-hidden
    >
      <span className="absolute left-[9px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-full bg-[#eb001b]" />
      <span className="absolute right-[9px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-full bg-[#f79e1b]" />
    </span>
  )
}

function PaymentMethodMeta({
  last4,
  expiry,
  cardholder,
}: {
  last4: string
  expiry: string
  cardholder: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] leading-5">
      <span className="inline-flex items-center gap-1 font-medium text-[#414651]">
        <CreditCard01 className="h-4 w-4 shrink-0 text-[#98a2b3]" aria-hidden />
        {last4}
      </span>
      <span className="inline-flex items-center gap-1 text-[#101828]">
        <Clock className="h-4 w-4 shrink-0 text-[#98a2b3]" aria-hidden />
        {expiry}
      </span>
      <span className="inline-flex items-center gap-1 text-[#101828]">
        <UserCircle className="h-4 w-4 shrink-0 text-[#98a2b3]" aria-hidden />
        {cardholder}
      </span>
    </div>
  )
}

function PaymentChargesTable() {
  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
        <thead>
          <tr className="border-b border-[#e9eaeb] bg-[#fafafa]">
            <th className="h-11 w-[12%] whitespace-normal px-4 py-3 text-[12px] font-semibold leading-[18px] text-[#414651] sm:px-5">
              Type
            </th>
            <th className="h-11 w-[18%] whitespace-normal px-4 py-3 text-[12px] font-semibold leading-[18px] text-[#414651] sm:px-5">
              Charge name
            </th>
            <th className="h-11 w-[14%] whitespace-normal px-4 py-3 text-[12px] font-semibold leading-[18px] text-[#414651] sm:px-5">
              Status
            </th>
            <th className="h-11 w-[18%] whitespace-normal px-4 py-3 text-[12px] font-semibold leading-[18px] text-[#414651] sm:px-5">
              Due Date
            </th>
            <th className="h-11 w-[18%] whitespace-normal px-4 py-3 text-[12px] font-semibold leading-[18px] text-[#414651] sm:px-5">
              Charge Date
            </th>
            <th className="h-11 w-[14%] whitespace-normal px-4 py-3 text-[12px] font-semibold leading-[18px] text-[#414651] sm:px-5">
              Amount
            </th>
            <th className="h-11 w-12 px-2 py-3 sm:w-14" aria-hidden />
          </tr>
        </thead>
        <tbody>
          {PAYMENT_CHARGES_DEMO.map((row) => (
            <tr key={row.id} className="border-b border-[#e9eaeb] last:border-b-0">
              <td className="align-middle px-4 py-4 sm:px-5">
                <PaymentChargeTypeBadge />
              </td>
              <td className="align-middle px-4 py-4 sm:px-5">
                <p className="text-[14px] font-medium leading-5 text-[#181d27]">{row.name}</p>
              </td>
              <td className="align-middle px-4 py-4 sm:px-5">
                {row.status === 'Paid' ? <PaymentPaidBadge /> : <StatusPill label="Unpaid" tone="danger" />}
              </td>
              <td className="align-middle px-4 py-4 sm:px-5">
                <p className="text-[14px] font-medium leading-5 text-[#181d27]">{row.dueDate}</p>
                <p className="text-[14px] leading-5 text-[#535862]">{row.dueTime}</p>
              </td>
              <td className="align-middle px-4 py-4 sm:px-5">
                <p className="text-[14px] font-medium leading-5 text-[#181d27]">{row.chargeDate}</p>
                <p className="text-[14px] leading-5 text-[#535862]">{row.chargeTime}</p>
              </td>
              <td className="align-middle px-4 py-4 sm:px-5">
                <p className="text-[14px] leading-5 text-[#535862] tabular-nums">{row.amount}</p>
              </td>
              <td className="align-middle px-2 py-4">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#98a2b3] transition-colors hover:bg-[#f6f9fc] hover:text-[#414651]"
                  aria-label={`Actions for ${row.name}`}
                >
                  <DotsHorizontal className="h-4 w-4" aria-hidden />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PaymentMethodsCards({ guestName }: { guestName: string }) {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full items-start gap-3 rounded-xl border-2 border-[#15b8b0] bg-white p-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <VisaBrandMark />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[14px] font-medium leading-5 text-[#414651]">Visa</p>
            <PaymentMethodMeta last4="**** 8234" expiry="06/25" cardholder={guestName} />
          </div>
        </div>
        <span className="inline-flex shrink-0" role="img" aria-label="Default payment method">
          <Star01 className="h-4 w-4 text-[#eaaa08]" aria-hidden />
        </span>
      </div>
      <div className="flex w-full items-start gap-3 rounded-xl border border-[#e9eaeb] bg-white p-4">
        <MastercardBrandMark />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[14px] font-medium leading-5 text-[#414651]">Mastercard</p>
          <PaymentMethodMeta last4="**** 1234" expiry="06/25" cardholder={guestName} />
        </div>
      </div>
    </div>
  )
}

/** Payment tab — same page shell as Overview; sections use PageSection / Compact / Modern. */
function ReservationPaymentSection({
  guestName,
  layoutVariant,
}: {
  guestName: string
  layoutVariant: PageLayoutVariant
}) {
  const stripeButton = (
    <Button type="button" variant="outline" className="shrink-0 gap-1.5 shadow-sm">
      <LinkExternal02 className="h-5 w-5 shrink-0" aria-hidden />
      Stripe&apos;s guest profile
    </Button>
  )

  const pageTitleRow = (
    <div className="mx-auto mb-10 flex max-w-[900px] flex-col gap-4 border-b border-[#e9eaeb] pb-8 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-[18px] font-medium leading-7 tracking-tight text-[#101828]">Payment</h2>
      {stripeButton}
    </div>
  )

  const paymentStatusComfortable = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] leading-5 text-[#535862]">Status</p>
        <StatusPill label="Unpaid" tone="danger" />
      </div>
      <div className="h-px w-full bg-[#e9eaeb]" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] leading-5 text-[#535862]">Balance due</p>
        <p className="text-[20px] font-semibold leading-[30px] text-[#181d27] tabular-nums">$1,250.00</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] leading-5 text-[#535862]">Remaining charges</p>
        <p className="text-[20px] font-semibold leading-[30px] text-[#d92d20] tabular-nums">$250.00</p>
      </div>
      <div className="h-px w-full bg-[#e9eaeb]" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] leading-5 text-[#535862]">Total</p>
        <p className="text-[20px] font-semibold leading-[30px] text-[#181d27] tabular-nums">$1,500.00</p>
      </div>
    </div>
  )

  const paymentStatusCompact = (
    <div className="space-y-2.5">
      <div className="flex w-full items-center gap-2">
        <p className="w-[168px] shrink-0 text-[13px] leading-4 text-[#535862]">Status</p>
        <div className="flex min-w-0 flex-1 justify-end">
          <StatusPill label="Unpaid" tone="danger" />
        </div>
      </div>
      <div className="h-px w-full bg-[#e9eaeb]" />
      <div className="flex w-full items-center gap-2">
        <p className="w-[168px] shrink-0 text-[13px] leading-4 text-[#535862]">Balance due</p>
        <p className="min-w-0 flex-1 text-right text-[18px] font-semibold leading-7 text-[#181d27] tabular-nums">
          $1,250.00
        </p>
      </div>
      <div className="flex w-full items-center gap-2">
        <p className="w-[168px] shrink-0 text-[13px] leading-4 text-[#535862]">Remaining charges</p>
        <p className="min-w-0 flex-1 text-right text-[18px] font-semibold leading-7 text-[#d92d20] tabular-nums">
          $250.00
        </p>
      </div>
      <div className="h-px w-full bg-[#e9eaeb]" />
      <div className="flex w-full items-center gap-2">
        <p className="w-[168px] shrink-0 text-[13px] leading-4 text-[#535862]">Total</p>
        <p className="min-w-0 flex-1 text-right text-[18px] font-semibold leading-7 text-[#181d27] tabular-nums">
          $1,500.00
        </p>
      </div>
    </div>
  )

  const paymentStatusModern = (
    <div className="divide-y divide-[#f2f4f7]">
      <div className="grid grid-cols-[minmax(0,148px)_minmax(0,1fr)] items-center gap-x-6 px-5 py-3 lg:grid-cols-[minmax(0,168px)_minmax(0,1fr)] lg:gap-x-8">
        <span className="text-[14px] font-medium leading-5 text-[#475467]">Status</span>
        <div className="flex justify-end">
          <StatusPill label="Unpaid" tone="danger" />
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,148px)_minmax(0,1fr)] items-center gap-x-6 px-5 py-3 lg:grid-cols-[minmax(0,168px)_minmax(0,1fr)] lg:gap-x-8">
        <span className="text-[14px] font-medium leading-5 text-[#475467]">Balance due</span>
        <p className="text-right text-[20px] font-semibold leading-[30px] text-[#181d27] tabular-nums">
          $1,250.00
        </p>
      </div>
      <div className="grid grid-cols-[minmax(0,148px)_minmax(0,1fr)] items-center gap-x-6 px-5 py-3 lg:grid-cols-[minmax(0,168px)_minmax(0,1fr)] lg:gap-x-8">
        <span className="text-[14px] font-medium leading-5 text-[#475467]">Remaining charges</span>
        <p className="text-right text-[20px] font-semibold leading-[30px] text-[#d92d20] tabular-nums">
          $250.00
        </p>
      </div>
      <div className="grid grid-cols-[minmax(0,148px)_minmax(0,1fr)] items-center gap-x-6 px-5 py-3 lg:grid-cols-[minmax(0,168px)_minmax(0,1fr)] lg:gap-x-8">
        <span className="text-[14px] font-medium leading-5 text-[#475467]">Total</span>
        <p className="text-right text-[20px] font-semibold leading-[30px] text-[#181d27] tabular-nums">
          $1,500.00
        </p>
      </div>
    </div>
  )

  const couponsComfortable = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] leading-5 text-[#535862]">Cancellation Policy</p>
        <p className="text-[14px] leading-5 text-[#101828]">No Refund</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-[14px] leading-5">
        <p className="text-[#535862]">Select Discounts</p>
        <p className="text-[#101828]">—</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-[14px] leading-5">
        <p className="text-[#535862]">Coupon</p>
        <p className="text-[#101828]">—</p>
      </div>
    </div>
  )

  const couponsCompact = (
    <div className="space-y-2.5">
      <div className="flex w-full items-center gap-2">
        <p className="w-[168px] shrink-0 text-[13px] leading-4 text-[#535862]">Cancellation Policy</p>
        <p className="min-w-0 flex-1 text-[13px] leading-4 text-[#101828]">No Refund</p>
      </div>
      <div className="flex w-full items-start gap-2 text-[13px] leading-4">
        <p className="w-[168px] shrink-0 text-[#535862]">Select Discounts</p>
        <p className="text-[#101828]">—</p>
      </div>
      <div className="flex w-full items-start gap-2 text-[13px] leading-4">
        <p className="w-[168px] shrink-0 text-[#535862]">Coupon</p>
        <p className="text-[#101828]">—</p>
      </div>
    </div>
  )

  const couponsModern = (
    <div className="divide-y divide-[#f2f4f7]">
      <div className="grid grid-cols-[minmax(0,148px)_minmax(0,1fr)] items-center gap-x-6 px-5 py-3 lg:grid-cols-[minmax(0,168px)_minmax(0,1fr)] lg:gap-x-8">
        <span className="text-[14px] font-medium leading-5 text-[#475467]">Cancellation Policy</span>
        <p className="text-right text-[14px] leading-5 text-[#101828]">No Refund</p>
      </div>
      <div className="grid grid-cols-[minmax(0,148px)_minmax(0,1fr)] items-start gap-x-6 px-5 py-3 lg:grid-cols-[minmax(0,168px)_minmax(0,1fr)] lg:gap-x-8">
        <span className="text-[14px] font-medium leading-5 text-[#475467]">Select Discounts</span>
        <p className="text-right text-[14px] leading-5 text-[#101828]">—</p>
      </div>
      <div className="grid grid-cols-[minmax(0,148px)_minmax(0,1fr)] items-start gap-x-6 px-5 py-3 lg:grid-cols-[minmax(0,168px)_minmax(0,1fr)] lg:gap-x-8">
        <span className="text-[14px] font-medium leading-5 text-[#475467]">Coupon</span>
        <p className="text-right text-[14px] leading-5 text-[#101828]">—</p>
      </div>
    </div>
  )

  const chargesToolbar = (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <Button type="button" variant="outline" className="w-full gap-1.5 shadow-sm sm:w-auto">
        <Plus className="h-5 w-5 shrink-0" aria-hidden />
        Add charge
      </Button>
    </div>
  )

  const methodsToolbar = (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <Button type="button" variant="outline" className="w-full gap-1.5 shadow-sm sm:w-auto">
        <Plus className="h-5 w-5 shrink-0" aria-hidden />
        Add payment method
      </Button>
    </div>
  )

  if (layoutVariant === 'comfortable') {
    return (
      <>
        {pageTitleRow}
        <div className="mx-auto max-w-[900px] space-y-12">
          <PageSection title="Payment status" withDivider={false}>
            {paymentStatusComfortable}
          </PageSection>
          <PageSection title="Charges" tableLayout headerActions={chargesToolbar}>
            <PaymentChargesTable />
          </PageSection>
          <PageSection title="Payment methods">
            <div className="flex w-full flex-col gap-4">
              {methodsToolbar}
              <PaymentMethodsCards guestName={guestName} />
            </div>
          </PageSection>
          <PageSection title="Coupons and refunds">
            {couponsComfortable}
          </PageSection>
        </div>
      </>
    )
  }

  if (layoutVariant === 'compact') {
    return (
      <>
        {pageTitleRow}
        <div className="mx-auto max-w-[900px] space-y-8">
          <CompactPageSection title="Payment status" first>
            {paymentStatusCompact}
          </CompactPageSection>
          <CompactPageSection title="Charges" tableLayout headerActions={chargesToolbar}>
            <PaymentChargesTable />
          </CompactPageSection>
          <CompactPageSection title="Payment methods">
            <div className="flex w-full flex-col gap-3">
              {methodsToolbar}
              <PaymentMethodsCards guestName={guestName} />
            </div>
          </CompactPageSection>
          <CompactPageSection title="Coupons and refunds">
            {couponsCompact}
          </CompactPageSection>
        </div>
      </>
    )
  }

  return (
    <>
      {pageTitleRow}
      <div className="mx-auto max-w-[900px] space-y-12">
        <ModernPageSection title="Payment status" first>
          {paymentStatusModern}
        </ModernPageSection>
        <ModernPageSection title="Charges" headerActions={chargesToolbar}>
          <PaymentChargesTable />
        </ModernPageSection>
        <ModernPageSection title="Payment methods">
          <div className="space-y-4 px-5 py-4">
            {methodsToolbar}
            <PaymentMethodsCards guestName={guestName} />
          </div>
        </ModernPageSection>
        <ModernPageSection title="Coupons and refunds">
          {couponsModern}
        </ModernPageSection>
      </div>
    </>
  )
}

export function ReservationTemplatePage({
  onBackToListings,
  summary,
  startInEditMode = false,
  initialValues,
}: {
  onBackToListings?: () => void
  summary?: ReservationDetailsSummary
  startInEditMode?: boolean
  initialValues?: Partial<ReservationForm>
}) {
  const mergedInitialValues = useMemo(
    () => ({ ...initialReservation, ...(initialValues ?? {}) }),
    [initialValues]
  )
  const [activeSection, setActiveSection] = useState('Overview')
  const [savedValues, setSavedValues] = useState(mergedInitialValues)
  const [draftValues, setDraftValues] = useState(mergedInitialValues)
  const [isEditing, setIsEditing] = useState(startInEditMode)
  const [layoutVariant, setLayoutVariant] = useState<PageLayoutVariant>(() => {
    try {
      const raw = sessionStorage.getItem(LAYOUT_STORAGE_KEY)
      if (raw === 'compact') return raw
    } catch {
      /* ignore */
    }
    return 'compact'
  })
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const [messagesPanelOpen, setMessagesPanelOpen] = useState(false)
  const [messageThread, setMessageThread] = useState<TemplateChatMessage[]>(() =>
    buildTemplateInitialMessages(initialReservation.name, 'demo')
  )
  const [messageDraft, setMessageDraft] = useState('')

  const messageThreadId = summary?.reservationId ?? 'template-demo'
  const displayGuestName = summary?.guestName ?? savedValues.name

  useEffect(() => {
    setMessageThread(buildTemplateInitialMessages(displayGuestName, messageThreadId))
  }, [messageThreadId, displayGuestName])

  useEffect(() => {
    setSavedValues(mergedInitialValues)
    setDraftValues(mergedInitialValues)
    setIsEditing(startInEditMode)
  }, [mergedInitialValues, startInEditMode])

  useEffect(() => {
    if (!moreMenuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const node = moreMenuRef.current
      if (!node) return
      if (!node.contains(event.target as Node)) setMoreMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [moreMenuOpen])

  const setLayoutAndPersist = (next: PageLayoutVariant) => {
    setLayoutVariant(next)
    try {
      sessionStorage.setItem(LAYOUT_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    setMoreMenuOpen(false)
  }

  const currentValues = isEditing ? draftValues : savedValues
  const isDirty = useMemo(
    () => JSON.stringify(draftValues) !== JSON.stringify(savedValues),
    [draftValues, savedValues]
  )

  const updateField = (key: keyof ReservationForm, value: string) => {
    setDraftValues((prev) => ({ ...prev, [key]: value }))
  }

  const startEditing = () => {
    setDraftValues(savedValues)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setDraftValues(savedValues)
    setIsEditing(false)
  }

  const saveChanges = () => {
    if (!isDirty) return
    setSavedValues(draftValues)
    setIsEditing(false)
  }

  const replyChannelSource = summary?.source ?? currentValues.source
  const guestAvatarSrc =
    currentValues.profileImageUrl ||
    reservationGuestAvatarUrl(messageThreadId, RESERVATION_AVATAR_SRC_PANEL)

  const sendTemplateMessage = () => {
    const text = messageDraft.trim()
    if (!text) return

    const myMessage: TemplateChatMessage = {
      id: `${messageThreadId}-${Date.now()}-me`,
      author: 'me',
      name: 'You',
      time: 'Just now',
      text,
    }
    setMessageThread((prev) => [...prev, myMessage])
    setMessageDraft('')

    const randomReply =
      TEMPLATE_RANDOM_GUEST_REPLIES[Math.floor(Math.random() * TEMPLATE_RANDOM_GUEST_REPLIES.length)]
    setTimeout(() => {
      setMessageThread((prev) => {
        const guestReply: TemplateChatMessage = {
          id: `${messageThreadId}-${Date.now()}-guest`,
          author: 'guest',
          name: displayGuestName,
          time: 'Just now',
          text: randomReply,
        }
        return [...prev, guestReply]
      })
    }, 500)
  }

  return (
    <div className="flex min-h-0 flex-1 gap-0 transition-[gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e9eaeb] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.05)]">
      <header className="border-b border-[#e9eaeb] px-6 py-3">
        <div className="flex items-end justify-between gap-6">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onBackToListings?.()}
              className="inline-flex items-center gap-1 text-[14px] leading-5 text-[#414651] hover:text-[#181d27]"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              Back to Reservations
            </button>
            <h1 className="mt-1 text-[20px] font-semibold leading-[30px] text-[#181d27]">
              {summary
                ? `${summary.guestName} / ${summary.checkInDate} - ${summary.checkOutDate} / ${summary.guests} guests`
                : 'Emily Johnson / May 1 - May 12 / 5 guests'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <StatusPill label="Reserved" tone="success" />
              <StatusPill label="Unpaid" tone="danger" />
              <HeaderMeta
                icon={<ReservationHeaderSourceIcon source={summary?.source ?? 'Airbnb'} />}
              >
                {summary?.source ?? 'Airbnb'}
              </HeaderMeta>
              <HeaderMeta
                icon={<HomeLine className="h-4 w-4 shrink-0 text-[#98a2b3]" aria-hidden />}
              >
                {summary?.listingName ?? 'House in Barcelona'}
              </HeaderMeta>
              <HeaderMeta icon={<Moon01 className="h-4 w-4 shrink-0 text-[#98a2b3]" aria-hidden />}>
                {summary?.nights ?? '11'}
              </HeaderMeta>
              <HeaderMeta icon={<Calendar className="h-4 w-4 shrink-0 text-[#98a2b3]" aria-hidden />}>
                {summary?.checkInDate ?? 'May 1 2026'}
              </HeaderMeta>
              <HeaderMeta icon={<Calendar className="h-4 w-4 shrink-0 text-[#98a2b3]" aria-hidden />}>
                {summary?.checkOutDate ?? 'May 12 2026'}
              </HeaderMeta>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-center">
            {isEditing ? (
              <>
                <Button type="button" variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
                <Button type="button" onClick={saveChanges} disabled={!isDirty} className="gap-1.5">
                  <Save01 className="h-5 w-5 shrink-0" aria-hidden />
                  Save
                </Button>
              </>
            ) : (
              <>
                <div className="relative shrink-0" ref={moreMenuRef}>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1.5"
                    aria-haspopup="menu"
                    aria-expanded={moreMenuOpen}
                    onClick={() => setMoreMenuOpen((prev) => !prev)}
                  >
                    <DotsHorizontal className="h-5 w-5 shrink-0" aria-hidden />
                    More
                  </Button>
                  {moreMenuOpen ? (
                    <div
                      className="absolute right-0 top-[calc(100%+6px)] z-40 min-w-[220px] rounded-xl border border-[#e9eaeb] bg-white p-1 shadow-[0px_12px_16px_-4px_rgba(10,13,18,0.08),0px_4px_6px_-2px_rgba(10,13,18,0.03)]"
                      role="menu"
                    >
                      <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-[#98a2b3]">
                        Page layout
                      </p>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[14px] font-medium leading-5 bg-[#f6f9fc] text-[#181d27]"
                        onClick={() => setLayoutAndPersist('compact')}
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#15b8b0]">
                          <Check className="h-4 w-4" aria-hidden />
                        </span>
                        Compact
                      </button>
                    </div>
                  ) : null}
                </div>
                <Button type="button" variant="outline" className="!px-2.5" aria-label="Guest options">
                  <UserCircle className="h-5 w-5 shrink-0" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="!px-2.5"
                  aria-label="Comments"
                  aria-expanded={messagesPanelOpen}
                  onClick={() => setMessagesPanelOpen((open) => !open)}
                >
                  <MessageChatSquare className="h-5 w-5 shrink-0" aria-hidden />
                </Button>
                <Button type="button" onClick={startEditing} className="gap-1.5">
                  <Edit01 className="h-5 w-5 shrink-0" aria-hidden />
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[236px] shrink-0 overflow-y-auto border-r border-[#e9eaeb] px-1 py-4">
          <nav className="space-y-1">
            {internalNavItems.map((item) => {
              const selected = item.label === activeSection

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveSection(item.label)}
                  className={`flex w-full items-center gap-2 rounded-md px-5 py-2 text-left transition-colors ${
                    selected ? 'bg-[#f6f9fc] text-[#252b37]' : 'text-[#414651] hover:bg-[#f6f9fc]'
                  }`}
                >
                  <SectionNavIcon label={item.label} />
                  <span className="flex-1 text-[14px] font-medium leading-5">{item.label}</span>
                  {item.badge ? (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-[#e9eaeb] bg-[#f6f9fc] px-2 py-0.5 text-[12px] font-medium leading-[18px] text-[#414651]">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-[clamp(1rem,2.5vw,1.5rem)] py-8 pb-12">
          {activeSection === 'Payment' ? (
            <ReservationPaymentSection guestName={displayGuestName} layoutVariant={layoutVariant} />
          ) : activeSection !== 'Overview' ? (
            <div className="mx-auto max-w-[900px] py-20 text-center">
              <p className="text-[16px] font-medium text-[#101828]">{activeSection}</p>
              <p className="mt-2 text-[14px] leading-5 text-[#535862]">
                This section is not available in the template yet.
              </p>
            </div>
          ) : layoutVariant === 'comfortable' ? (
            <>
              <div className="mx-auto mb-10 max-w-[900px] border-b border-[#e9eaeb] pb-8">
                <h2 className="text-[18px] font-medium leading-7 tracking-tight text-[#101828]">
                  Overview
                </h2>
              </div>

              <div className="mx-auto max-w-[900px] space-y-12">
                <ReservationTemplateKeyInsightsSection
                  layoutVariant="comfortable"
                  values={currentValues}
                />
                <PageSection title="Booked by">
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="mb-2 text-[12px] font-medium leading-4 text-[#667085]">
                        Profile image
                      </p>
                      <div className="flex items-center">
                        {currentValues.profileImageUrl ? (
                          <img
                            src={currentValues.profileImageUrl}
                            alt={currentValues.name}
                            className="h-11 w-11 rounded-full object-cover shadow-[0px_1px_2px_rgba(10,13,18,0.08)] ring-1 ring-inset ring-black/5"
                          />
                        ) : (
                          <div
                            className="h-11 w-11 rounded-full bg-[linear-gradient(145deg,#f1c7a7_0%,#c17854_100%)] shadow-[0px_1px_2px_rgba(10,13,18,0.08)] ring-1 ring-inset ring-black/5"
                            aria-hidden
                          />
                        )}
                      </div>
                    </div>
                    {bookedByFields.map((field) => (
                      <FieldRow
                        key={field.key}
                        field={field}
                        value={currentValues[field.key]}
                        isEditing={isEditing}
                        layoutVariant="comfortable"
                        onChange={(value) => updateField(field.key, value)}
                      />
                    ))}
                  </div>
                </PageSection>

                <PageSection title="Stay">
                  <div className="flex flex-col gap-4">
                    {stayFields.map((field) => (
                      <FieldRow
                        key={field.key}
                        field={field}
                        value={currentValues[field.key]}
                        isEditing={isEditing}
                        layoutVariant="comfortable"
                        onChange={(value) => updateField(field.key, value)}
                      />
                    ))}
                  </div>
                </PageSection>

                <PageSection title="Notes">
                  <div className="flex flex-col gap-4">
                    {notesFields.map((field) => (
                      <FieldRow
                        key={field.key}
                        field={field}
                        value={currentValues[field.key]}
                        isEditing={isEditing}
                        layoutVariant="comfortable"
                        onChange={(value) => updateField(field.key, value)}
                      />
                    ))}
                  </div>
                </PageSection>

                <PageSection title="Operations">
                  <div className="flex flex-col gap-4">
                    {operationsFields.map((field) => (
                      <FieldRow
                        key={field.key}
                        field={field}
                        value={currentValues[field.key]}
                        isEditing={isEditing}
                        layoutVariant="comfortable"
                        onChange={(value) => updateField(field.key, value)}
                      />
                    ))}
                  </div>
                </PageSection>
              </div>
            </>
          ) : layoutVariant === 'compact' ? (
            <>
              <div className="mx-auto mb-10 max-w-[900px] border-b border-[#e9eaeb] pb-8">
                <h2 className="text-[18px] font-medium leading-7 tracking-tight text-[#101828]">
                  Overview
                </h2>
              </div>

              <div className="mx-auto max-w-[900px] space-y-8">
                <ReservationTemplateKeyInsightsSection layoutVariant="compact" values={currentValues} />
                <CompactPageSection title="Booked by">
                  <div className="flex w-full items-center gap-2">
                    <p className="w-[168px] shrink-0 text-[13px] leading-4 text-[#535862]">
                      Profile image
                    </p>
                    <div className="flex min-w-0 flex-1 items-center">
                      {currentValues.profileImageUrl ? (
                        <img
                          src={currentValues.profileImageUrl}
                          alt={currentValues.name}
                          className="size-8 rounded-full border border-black/[0.08] object-cover"
                        />
                      ) : (
                        <div
                          className="size-8 rounded-full border border-black/[0.08] bg-[linear-gradient(145deg,#f1c7a7_0%,#c17854_100%)]"
                          aria-hidden
                        />
                      )}
                    </div>
                  </div>
                  {bookedByFields.map((field) => (
                    <CompactFieldRow
                      key={field.key}
                      field={field}
                      value={currentValues[field.key]}
                      isEditing={isEditing}
                      labelWidthClass="w-[168px]"
                      onChange={(value) => updateField(field.key, value)}
                    />
                  ))}
                </CompactPageSection>

                <CompactPageSection title="Stay">
                  {stayFields.map((field) => (
                    <CompactFieldRow
                      key={field.key}
                      field={field}
                      value={currentValues[field.key]}
                      isEditing={isEditing}
                      labelWidthClass="w-[168px]"
                      onChange={(value) => updateField(field.key, value)}
                    />
                  ))}
                </CompactPageSection>

                <CompactPageSection title="Notes">
                  {notesFields.map((field) => (
                    <CompactFieldRow
                      key={field.key}
                      field={field}
                      value={currentValues[field.key]}
                      isEditing={isEditing}
                      labelWidthClass="w-[168px]"
                      onChange={(value) => updateField(field.key, value)}
                    />
                  ))}
                </CompactPageSection>

                <CompactPageSection title="Operations">
                  {operationsFields.map((field) => (
                    <CompactFieldRow
                      key={field.key}
                      field={field}
                      value={currentValues[field.key]}
                      isEditing={isEditing}
                      labelWidthClass="w-[168px]"
                      onChange={(value) => updateField(field.key, value)}
                    />
                  ))}
                </CompactPageSection>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto mb-10 max-w-[900px] border-b border-[#e9eaeb] pb-8">
                <h2 className="text-[18px] font-medium leading-7 tracking-tight text-[#101828]">
                  Overview
                </h2>
              </div>

              <div className="mx-auto max-w-[900px] space-y-12">
                <ReservationTemplateKeyInsightsSection layoutVariant="modern" values={currentValues} />
                <ModernPageSection title="Booked by">
                  <div
                    className={cn(
                      modernSectionHeaderGridClass,
                      'border-b border-[#f0f2f5]',
                    )}
                  >
                    <p className="text-[14px] font-medium leading-5 text-[#475467]">Profile image</p>
                    <div className="flex min-w-0 items-center">
                      {currentValues.profileImageUrl ? (
                        <img
                          src={currentValues.profileImageUrl}
                          alt={currentValues.name}
                          className="size-8 rounded-full border border-black/[0.06] object-cover"
                        />
                      ) : (
                        <div
                          className="size-8 rounded-full border border-black/[0.06] bg-[linear-gradient(145deg,#f1c7a7_0%,#c17854_100%)]"
                          aria-hidden
                        />
                      )}
                    </div>
                  </div>
                  {bookedByFields.map((field) => (
                    <ModernFieldRow
                      key={field.key}
                      field={field}
                      value={currentValues[field.key]}
                      isEditing={isEditing}
                      onChange={(value) => updateField(field.key, value)}
                    />
                  ))}
                </ModernPageSection>

                <ModernPageSection title="Stay">
                  {stayFields.map((field) => (
                    <ModernFieldRow
                      key={field.key}
                      field={field}
                      value={currentValues[field.key]}
                      isEditing={isEditing}
                      onChange={(value) => updateField(field.key, value)}
                    />
                  ))}
                </ModernPageSection>

                <ModernPageSection title="Notes">
                  {notesFields.map((field) => (
                    <ModernFieldRow
                      key={field.key}
                      field={field}
                      value={currentValues[field.key]}
                      isEditing={isEditing}
                      onChange={(value) => updateField(field.key, value)}
                    />
                  ))}
                </ModernPageSection>

                <ModernPageSection title="Operations">
                  {operationsFields.map((field) => (
                    <ModernFieldRow
                      key={field.key}
                      field={field}
                      value={currentValues[field.key]}
                      isEditing={isEditing}
                      onChange={(value) => updateField(field.key, value)}
                    />
                  ))}
                </ModernPageSection>
              </div>
            </>
          )}
        </div>
      </div>
    </section>

    <SlidingSidePanel show={messagesPanelOpen} motionKey="reservation-template-messages">
      {messagesPanelOpen ? (
        <>
        <header className="flex h-[52px] shrink-0 items-center border-b border-[#e9eaeb] px-4">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <img
                src={guestAvatarSrc}
                alt={displayGuestName}
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-full object-cover shadow-[0px_1px_2px_rgba(10,13,18,0.08)] ring-1 ring-inset ring-black/5"
              />
              <h3 className="min-w-0 truncate text-[20px] font-semibold leading-[30px] text-[#181d27]">
                {displayGuestName}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setMessagesPanelOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#98a2b3] hover:bg-[#f6f9fc]"
              aria-label="Close messages"
            >
              <XClose className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-[#e9eaeb]" />
              <span className="text-[14px] font-medium leading-5 text-[#535862]">Today</span>
              <div className="h-px flex-1 bg-[#e9eaeb]" />
            </div>
            <div className="space-y-4">
              {messageThread.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.author === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[92%] ${message.author === 'me' ? '' : 'flex gap-3'}`}>
                    {message.author === 'guest' ? (
                      <img
                        src={guestAvatarSrc}
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
                <span className="inline-flex shrink-0" aria-hidden>
                  <ReservationHeaderSourceIcon source={replyChannelSource} />
                </span>
                Reply on {replyChannelSource}
              </div>
              <textarea
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    sendTemplateMessage()
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
                  onClick={sendTemplateMessage}
                  className="h-9 gap-1 px-3 text-[14px] leading-5"
                >
                  <Send01 className="h-5 w-5" aria-hidden />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
        </>
      ) : null}
    </SlidingSidePanel>
    </div>
  )
}
