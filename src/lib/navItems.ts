/**
 * Single source of truth for the primary sidebar.
 * Each item has a route slug, label, and icon.
 * Index in this array = `sidebarActiveIndex` in PageShell.
 */
import type { ComponentType, SVGProps } from 'react'
import {
  BankNote01,
  Calendar,
  CalendarCheck02,
  CreditCardRefresh,
  File02,
  Globe02,
  HomeLine,
  List,
  MessageChatSquare,
  Star01,
  User01,
} from '@untitled-ui/icons-react'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export interface NavItem {
  slug: string
  label: string
  Icon: IconComponent
}

export const NAV_ITEMS: NavItem[] = [
  { slug: 'overview',             label: 'Overview',                Icon: HomeLine },
  { slug: 'calendar',             label: 'Calendar',                Icon: Calendar },
  { slug: 'inbox',                label: 'Inbox',                   Icon: MessageChatSquare },
  { slug: 'reservations',         label: 'Reservation',             Icon: CalendarCheck02 },
  { slug: 'listings',             label: 'Listings',                Icon: List },
  { slug: 'financial-reporting',  label: 'Financial Reporting',     Icon: BankNote01 },
  { slug: 'expenses',             label: 'Expenses and Extras',     Icon: CreditCardRefresh },
  { slug: 'owner-statements',     label: 'Owner Statements',        Icon: File02 },
  { slug: 'reviews',              label: 'Reviews',                 Icon: Star01 },
  { slug: 'post-booking-experience', label: 'Post-booking experience', Icon: User01 },
  { slug: 'booking-website',      label: 'Booking website settings', Icon: Globe02 },
]

export const DEFAULT_INDEX = 9 // post-booking-experience

/**
 * Derive the active sidebar index from a pathname (e.g. '/calendar' → 1).
 * Falls back to DEFAULT_INDEX for unknown paths.
 */
export function indexFromPathname(pathname: string): number {
  const seg = pathname.split('/').filter(Boolean)[0] || ''
  const idx = NAV_ITEMS.findIndex(item => item.slug === seg)
  return idx >= 0 ? idx : DEFAULT_INDEX
}
