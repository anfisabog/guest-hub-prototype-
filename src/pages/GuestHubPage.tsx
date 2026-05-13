import React, { useState, useEffect, useRef, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell, PageHeader } from '@/components/channel-manager'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  ArrowLeft,
  Save01,
  Rocket01,
  HomeLine,
  FileCheck01,
  Lock01,
  List,
  Eye,
  CheckCircle,
  Circle,
  Shield01,
  CreditCard01,
} from '@untitled-ui/icons-react'

// ─── Preview panel icons (from Figma) ────────────────────────────────────────

function IconLayoutRight({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12.5 2.5V17.5M6.5 2.5H13.5C14.9001 2.5 15.6002 2.5 16.135 2.77248C16.6054 3.01217 16.9878 3.39462 17.2275 3.86502C17.5 4.3998 17.5 5.09987 17.5 6.5V13.5C17.5 14.9001 17.5 15.6002 17.2275 16.135C16.9878 16.6054 16.6054 16.9878 16.135 17.2275C15.6002 17.5 14.9001 17.5 13.5 17.5H6.5C5.09987 17.5 4.3998 17.5 3.86502 17.2275C3.39462 16.9878 3.01217 16.6054 2.77248 16.135C2.5 15.6002 2.5 14.9001 2.5 13.5V6.5C2.5 5.09987 2.5 4.3998 2.77248 3.86502C3.01217 3.39462 3.39462 3.01217 3.86502 2.77248C4.3998 2.5 5.09987 2.5 6.5 2.5Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconExpand({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M13.3333 6.66667L17.5 2.5M17.5 2.5H13.3333M17.5 2.5V6.66667M6.66667 6.66667L2.5 2.5M2.5 2.5L2.5 6.66667M2.5 2.5L6.66667 2.5M6.66667 13.3333L2.5 17.5M2.5 17.5H6.66667M2.5 17.5L2.5 13.3333M13.3333 13.3333L17.5 17.5M17.5 17.5V13.3333M17.5 17.5H13.3333" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PortalStatus = 'Published' | 'Draft'

type Portal = {
  id: string
  name: string
  listings: number
  lastEdited: string
  status: PortalStatus
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_PORTALS: Portal[] = [
  { id: '1', name: 'Default Guest Portal', listings: 8, lastEdited: 'Apr 24, 2026', status: 'Published' },
  { id: '2', name: 'Luxury Properties',    listings: 3, lastEdited: 'Apr 18, 2026', status: 'Draft' },
  { id: '3', name: 'Budget Stays',         listings: 5, lastEdited: 'Mar 30, 2026', status: 'Draft' },
]

type AccessType = 'smart_lock' | 'manual_code' | 'key_handoff' | null

type MockListing = {
  id: string
  name: string
  hostawayId: string
  currentPortal: string
  accessType: AccessType
  hasArrivalGuide: boolean
  tags: string[]
}

const MOCK_LISTINGS: MockListing[] = [
  { id: 'l1', name: 'Cozy Downtown Apartment', hostawayId: '81069', currentPortal: 'Default Guest Portal', accessType: 'smart_lock',  hasArrivalGuide: true,  tags: ['urban'] },
  { id: 'l2', name: 'Beachfront Villa',         hostawayId: '81070', currentPortal: 'Default Guest Portal', accessType: 'manual_code', hasArrivalGuide: true,  tags: ['beach'] },
  { id: 'l3', name: 'Mountain Cabin Retreat',   hostawayId: '81071', currentPortal: 'Luxury Properties',   accessType: null,          hasArrivalGuide: false, tags: ['nature'] },
  { id: 'l4', name: 'Sunny Studio Loft',        hostawayId: '81072', currentPortal: 'Default Guest Portal', accessType: 'manual_code', hasArrivalGuide: true,  tags: ['urban'] },
  { id: 'l5', name: 'Harbor View Suite',        hostawayId: '81073', currentPortal: 'Budget Stays',        accessType: null,          hasArrivalGuide: false, tags: ['beach'] },
  { id: 'l6', name: 'Forest Treehouse',         hostawayId: '81074', currentPortal: 'Default Guest Portal', accessType: 'key_handoff', hasArrivalGuide: true,  tags: ['nature'] },
]

// ─── Wizard steps ─────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  'Branding', 'Security', 'Compliance', 'Agreement',
  'Locks', 'Guides', 'Listings', 'Preview & Share',
]

// ─── Preview stages ───────────────────────────────────────────────────────────

const STAGES = [
  { id: 'pre-arrival',  label: 'Pre-arrival' },
  { id: 'check-in',     label: 'Check-in' },
  { id: 'during-stay',  label: 'During stay' },
  { id: 'checkout',     label: 'Checkout' },
]

// ─── Nav types ────────────────────────────────────────────────────────────────

type NavItem =
  | { type: 'link';  id: string; label: string; icon: React.ReactNode }
  | { type: 'group'; id: string; label: string; icon: React.ReactNode; children: { id: string; label: string; badge?: string }[] }

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconMonitor() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  )
}
function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>
    </svg>
  )
}
function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-5"/>
    </svg>
  )
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={cn('transition-transform duration-200', open ? 'rotate-180' : '')}>
      <path d="M6 9l6 6 6-6"/>
    </svg>
  )
}
function IconCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  )
}
function IconAlertTriangle() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}
function IconDots() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
    </svg>
  )
}
function IconDuplicate() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}
function IconArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  )
}

function ChevDown() {
  return (
    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98a2b3]">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
  )
}

// ─── Booking Websites types + data ───────────────────────────────────────────

type BWStatus = 'Published' | 'Draft'
type BWPlan   = 'Standard' | 'Pro'

type BookingWebsite = {
  id: string
  name: string
  status: BWStatus
  website: string | null
  listings: number
  lastPublished: string | null
  plan: BWPlan
}

const BW_MOCK: BookingWebsite[] = [
  { id:'1', name:"Varduhi's Booking Portal", status:'Published', website:'varduhi.com',           listings:12, lastPublished:'Apr 22, 2026', plan:'Standard' },
  { id:'2', name:"Gaby's website",           status:'Draft',     website: null,                   listings:0,  lastPublished: null,           plan:'Standard' },
  { id:'3', name:"Julia's guest portal",     status:'Published', website:'juliasguestportal.com', listings:6,  lastPublished:'Apr 15, 2026',  plan:'Pro'      },
  { id:'4', name:"Travel Solutions",         status:'Draft',     website: null,                   listings:4,  lastPublished: null,           plan:'Pro'      },
]

// ─── Booking Websites badge ───────────────────────────────────────────────────

function BWStatusBadge({ status }: { status: BWStatus }) {
  if (status === 'Published') return (
    <span className="inline-flex items-center rounded-full border border-[#abefc6] bg-[#ecfcf2] px-2.5 py-0.5 text-[12px] font-medium leading-[18px] text-[#057647] whitespace-nowrap">
      Published
    </span>
  )
  return (
    <span className="inline-flex items-center rounded-full border border-[#fedf89] bg-[#fff9eb] px-2.5 py-0.5 text-[12px] font-medium leading-[18px] text-[#b54707] whitespace-nowrap">
      Draft
    </span>
  )
}

// ─── External link icon ───────────────────────────────────────────────────────

function IconExternalLink() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

// ─── Booking Websites view ────────────────────────────────────────────────────

function ChooseYourPlanButton() {
  return (
    <Button variant="primary">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 shrink-0">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      Choose your plan
    </Button>
  )
}

function BookingWebsitesView({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {showHeader && (
        <>
          <div className="flex items-center justify-between px-6 py-3 shrink-0">
            <span className="text-[20px] font-semibold leading-[30px] text-[#181d27]">Booking website</span>
            <ChooseYourPlanButton />
          </div>
          <div className="h-px bg-[#e9eaeb] shrink-0" />
        </>
      )}

      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#fafafa] border-b border-[#e9eaeb]">
              <th className="px-6 py-3 text-left text-[12px] font-semibold leading-[18px] text-[#414651] w-full">Name</th>
              <th className="px-6 py-3 text-left text-[12px] font-semibold leading-[18px] text-[#414651] whitespace-nowrap">Status</th>
              <th className="px-6 py-3 text-left text-[12px] font-semibold leading-[18px] text-[#414651] whitespace-nowrap">Website</th>
              <th className="px-6 py-3 text-left text-[12px] font-semibold leading-[18px] text-[#414651] whitespace-nowrap">Listings</th>
              <th className="px-6 py-3 text-left text-[12px] font-semibold leading-[18px] text-[#414651] whitespace-nowrap">Last published</th>
              <th className="px-6 py-3 text-left text-[12px] font-semibold leading-[18px] text-[#414651] whitespace-nowrap">Plan</th>
              <th className="px-4 py-3 whitespace-nowrap" />
            </tr>
          </thead>
          <tbody>
            {BW_MOCK.map(site => (
              <tr key={site.id} className="h-[72px] border-b border-[#e9eaeb] hover:bg-[#fafafa] transition-colors cursor-pointer">
                <td className="px-6 whitespace-nowrap">
                  <p className="text-[14px] font-medium leading-[20px] text-[#181d27]">{site.name}</p>
                </td>
                <td className="px-6 whitespace-nowrap">
                  <BWStatusBadge status={site.status} />
                </td>
                <td className="px-6 whitespace-nowrap">
                  {site.website ? (
                    <span className="inline-flex items-center gap-1.5 text-[14px] leading-[20px] text-[#535861]">
                      <span>{site.website}</span>
                      <span className="text-[#98a2b3]"><IconExternalLink /></span>
                    </span>
                  ) : (
                    <span className="text-[14px] leading-[20px] text-[#98a2b3]">Website not published</span>
                  )}
                </td>
                <td className="px-6 whitespace-nowrap">
                  <span className="text-[14px] leading-[20px] text-[#535861]">{site.listings}</span>
                </td>
                <td className="px-6 whitespace-nowrap">
                  <span className="text-[14px] leading-[20px] text-[#535861]">{site.lastPublished ?? '—'}</span>
                </td>
                <td className="px-6 whitespace-nowrap">
                  <span className="text-[14px] leading-[20px] text-[#535861]">{site.plan}</span>
                </td>
                <td className="px-4 whitespace-nowrap">
                  {site.plan === 'Standard' && (
                    <button onClick={e => e.stopPropagation()} className="rounded-lg border border-[#d0d5dd] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#414651] hover:bg-[#f9fafb] transition-colors shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                      Upgrade
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Nav data ─────────────────────────────────────────────────────────────────

const NAV: NavItem[] = [
  { type: 'link', id: 'guest-portal',  label: 'Guest portal',  icon: <IconPhone /> },
  { type: 'link', id: 'guides',        label: 'Guides',        icon: <IconChart /> },
  { type: 'link', id: 'integrations',  label: 'Integrations',  icon: <IconSettings /> },
]

// ─── Left nav ─────────────────────────────────────────────────────────────────

function GuestHubNav({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ 'guest-portal': true, 'revenue': true })
  const toggle = (id: string) => setOpen(p => ({ ...p, [id]: !p[id] }))

  return (
    <nav className="w-[220px] shrink-0 flex flex-col gap-0.5 py-2">
      {NAV.map(item => {
        if (item.type === 'link') {
          const active = activeId === item.id
          return (
            <button key={item.id} onClick={() => onSelect(item.id)}
              className={cn('flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-left transition-colors',
                active ? 'bg-[var(--channel-accent-surface)] text-[var(--figma-text)] font-medium'
                       : 'text-[var(--figma-text-muted)] hover:bg-[var(--channel-accent-surface)]/60 hover:text-[var(--figma-text)]')}>
              <span className={active ? 'text-[var(--figma-text)]' : 'text-[var(--figma-icon-muted)]'}>{item.icon}</span>
              {item.label}
            </button>
          )
        }
        const isOpen = open[item.id]
        const anyChildActive = item.children.some(c => c.id === activeId)
        return (
          <div key={item.id}>
            <button onClick={() => toggle(item.id)}
              className={cn('flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-left transition-colors',
                anyChildActive ? 'text-[var(--figma-text)] font-medium'
                               : 'text-[var(--figma-text-muted)] hover:bg-[var(--channel-accent-surface)]/60 hover:text-[var(--figma-text)]')}>
              <span className={anyChildActive ? 'text-[var(--figma-text)]' : 'text-[var(--figma-icon-muted)]'}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              <span className="text-[var(--figma-icon-muted)]"><IconChevron open={isOpen} /></span>
            </button>
            {isOpen && (
              <div className="ml-[30px] flex flex-col gap-0.5 mb-1">
                {item.children.map(child => {
                  const active = activeId === child.id
                  return (
                    <button key={child.id} onClick={() => onSelect(child.id)}
                      className={cn('flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-sm text-left transition-colors',
                        active ? 'bg-[var(--channel-accent-surface)] text-[var(--figma-text)] font-medium'
                               : 'text-[var(--figma-text-muted)] hover:bg-[var(--channel-accent-surface)]/60 hover:text-[var(--figma-text)]')}>
                      <span className="flex-1">{child.label}</span>
                      {child.badge && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#eff4ff] text-[#3538cd]">{child.badge}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

// ─── Portal status badge ──────────────────────────────────────────────────────

function PortalStatusBadge({ status }: { status: PortalStatus }) {
  return <BWStatusBadge status={status} />
}

// ─── Portal list view ─────────────────────────────────────────────────────────

function PortalListView({ portals, onNew, onRowClick, showHeader = true }: {
  portals: Portal[]
  onNew: () => void
  onRowClick: (id: string) => void
  showHeader?: boolean
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {showHeader && (
        <div className="flex items-center justify-between border-b border-[#e9eaeb] px-6 py-3 shrink-0">
          <span className="text-[20px] font-semibold leading-[30px] text-[#181d27]">Guest portals</span>
          <Button variant="primary" onClick={onNew}>New portal</Button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#fafafa] border-b border-[#e9eaeb]">
              <th className="px-6 py-3 text-left text-[12px] font-semibold leading-[18px] text-[#414651] w-full">Name</th>
              <th className="px-6 py-3 text-left text-[12px] font-semibold leading-[18px] text-[#414651] whitespace-nowrap">Status</th>
              <th className="px-6 py-3 text-left text-[12px] font-semibold leading-[18px] text-[#414651] whitespace-nowrap">Listings</th>
              <th className="px-6 py-3 text-left text-[12px] font-semibold leading-[18px] text-[#414651] whitespace-nowrap">Last edited</th>
            </tr>
          </thead>
          <tbody>
            {portals.map(p => (
              <tr key={p.id} onClick={() => onRowClick(p.id)}
                className="h-[72px] border-b border-[#e9eaeb] hover:bg-[#fafafa] transition-colors cursor-pointer">
                <td className="px-6 whitespace-nowrap">
                  <p className="text-[14px] font-medium leading-[20px] text-[#181d27]">{p.name}</p>
                </td>
                <td className="px-6 whitespace-nowrap">
                  <PortalStatusBadge status={p.status} />
                </td>
                <td className="px-6 whitespace-nowrap">
                  <span className="text-[14px] leading-[20px] text-[#535861]">{p.listings}</span>
                </td>
                <td className="px-6 whitespace-nowrap">
                  <span className="text-[14px] leading-[20px] text-[#535861]">{p.lastEdited}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function GuestHubEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--figma-stroke)] px-4 py-3 shrink-0">
        <span className="text-[13px] font-semibold text-[var(--figma-text)]">Guest portals</span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--channel-accent-surface)]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--figma-icon-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>
          </svg>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-[15px] font-semibold text-[var(--figma-text)]">Set up your branding</h2>
          <p className="text-[13px] text-[var(--figma-text-muted)] max-w-[320px] leading-relaxed">
            A Guest Portal is your branded mobile experience — check-in, arrival guides, upsells, and more, all in one place.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={onCreate}>
          Create your first Guest Portal
        </Button>
      </div>
    </div>
  )
}

// ─── Wizard progress bar ──────────────────────────────────────────────────────

function WizardProgressBar({ currentStep, onStepClick }: { currentStep: number; onStepClick: (i: number) => void }) {
  return (
    <div className="flex items-start">
      {WIZARD_STEPS.map((label, i) => {
        const completed = i < currentStep
        const active = i === currentStep
        return (
          <Fragment key={i}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <button type="button"
                onClick={() => { if (completed) onStepClick(i) }}
                disabled={!completed}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-colors',
                  completed ? 'border-[#fd853a] bg-[#fd853a] text-white cursor-pointer hover:bg-[#f57530]' :
                  active    ? 'border-[#fd853a] bg-white text-[#fd853a]' :
                              'border-[#e9eaeb] bg-white text-[#98a2b3] cursor-default',
                )}>
                {completed ? <IconCheck /> : i + 1}
              </button>
              <span className={cn('text-[10px] font-medium text-center max-w-[72px] leading-tight',
                active    ? 'text-[#fd853a] font-semibold' :
                completed ? 'text-[var(--figma-text)]' :
                            'text-[var(--figma-text-muted)]',
              )}>
                {label}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={cn('mt-[13px] flex-1 h-[1.5px] mx-1 min-w-[8px]',
                i < currentStep ? 'bg-[#fd853a]' : 'bg-[#e9eaeb]',
              )} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

// ─── Preview frame ────────────────────────────────────────────────────────────

function PreviewFrame({
  checklist,
  simulateConditionsMet,
  aiEnabled,
}: {
  checklist?: string[]
  simulateConditionsMet?: boolean
  aiEnabled?: boolean
}) {
  const [stage, setStage] = useState('pre-arrival')

  const conditionsMet = simulateConditionsMet ?? false

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Stage selector tabs */}
      <div className="flex w-full rounded-lg bg-[var(--channel-accent-surface)] p-1 gap-0.5">
        {STAGES.map(s => (
          <button key={s.id} onClick={() => setStage(s.id)}
            className={cn(
              'flex-1 rounded-md py-1.5 text-[11px] font-medium transition-colors text-center whitespace-nowrap',
              stage === s.id
                ? 'bg-white text-[var(--figma-text)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-[var(--figma-text-muted)] hover:text-[var(--figma-text)]',
            )}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Phone chrome */}
      <div className="relative w-[200px] h-[432px] rounded-[38px] border-[6px] border-[#1c2939] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Status bar */}
        <div className="absolute inset-x-0 top-0 h-7 bg-[#f9fafb]" />
        {/* Dynamic island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[72px] h-[18px] bg-[#1c2939] rounded-full z-10" />
        {/* Screen content */}
        <div className="absolute inset-0 top-7 bottom-5 overflow-y-auto">
          {stage === 'pre-arrival' && checklist && checklist.length > 0 ? (
            <div className="flex flex-col px-4 pt-4 gap-2">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#98a2b3] mb-1">Pre-arrival checklist</p>
              {checklist.map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-[#e9eaeb] bg-[#fafafa] px-2.5 py-2">
                  <div className="h-4 w-4 rounded-full border-[1.5px] border-[#d0d5dd] shrink-0" />
                  <span className="text-[9px] text-[#181d27] leading-tight">{item}</span>
                </div>
              ))}
            </div>
          ) : stage === 'during-stay' && aiEnabled ? (
            <div className="flex flex-col px-4 pt-4 gap-3 h-full">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#98a2b3]">AI Assistant</p>
              {/* Mock chat bubbles */}
              <div className="flex flex-col gap-2 flex-1">
                <div className="self-end max-w-[120px] rounded-xl rounded-tr-sm bg-[#15b8b0] px-2.5 py-1.5">
                  <span className="text-[9px] text-white leading-tight">How do I connect to WiFi?</span>
                </div>
                <div className="self-start max-w-[130px] rounded-xl rounded-tl-sm bg-[#f2f4f7] px-2.5 py-1.5">
                  <span className="text-[9px] text-[#181d27] leading-tight">The WiFi network is "GuestStay_5G", password: welcome2024</span>
                </div>
              </div>
              {/* Chat input bar */}
              <div className="flex items-center gap-1.5 rounded-full border border-[#e9eaeb] bg-[#f9fafb] px-3 py-1.5 mb-1">
                <span className="flex-1 text-[9px] text-[#98a2b3]">Ask a question…</span>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#15b8b0]">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </div>
              </div>
            </div>
          ) : stage === 'check-in' ? (
            <div className="flex flex-col px-4 pt-4 gap-3">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#98a2b3]">Access</p>
              {conditionsMet ? (
                /* Code revealed */
                <div className="rounded-xl border border-[#d1fadf] bg-[#f6fef9] px-3 py-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#12b76a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    <span className="text-[9px] font-medium text-[#027a48]">Access code</span>
                  </div>
                  <span className="text-[18px] font-bold text-[#101828] tracking-widest">2847</span>
                  <span className="text-[8px] text-[#6ce9a6]">All conditions met</span>
                </div>
              ) : (
                /* Code locked */
                <div className="rounded-xl border border-[#e9eaeb] bg-[#f9fafb] px-3 py-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#98a2b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    <span className="text-[9px] font-medium text-[#667085]">Access code</span>
                  </div>
                  <span className="text-[9px] text-[#98a2b3] leading-tight">
                    Available once check-in time is reached.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4f7]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#98a2b3" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>
                </svg>
              </div>
              <p className="text-[10px] text-center leading-relaxed text-[#98a2b3]">
                Portal preview will update as you configure each section.
              </p>
            </div>
          )}
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[56px] h-[3px] bg-[#1c2939]/70 rounded-full" />
      </div>
    </div>
  )
}

// ─── Wizard shell ─────────────────────────────────────────────────────────────

function GuestHubWizardShell({ onExit, onComplete }: { onExit: () => void; onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const isLast = currentStep === WIZARD_STEPS.length - 1

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--figma-stroke)] px-6 py-4 shrink-0">
        <h1 className="text-base font-semibold text-[var(--figma-text)]">Post-booking experience</h1>
        <button type="button" onClick={onExit}
          className="text-[13px] font-medium text-[var(--figma-text-muted)] hover:text-[var(--figma-text)] transition-colors">
          Save & exit
        </button>
      </div>

      {/* Step progress bar */}
      <div className="border-b border-[var(--figma-stroke)] px-6 py-5 shrink-0">
        <WizardProgressBar currentStep={currentStep} onStepClick={setCurrentStep} />
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Step content */}
        <div className="flex-1 min-w-0 overflow-y-auto flex flex-col items-center justify-center px-10 py-10">
          <div className="w-full max-w-[480px] text-center">
            <p className="text-[18px] font-semibold text-[var(--figma-text)] mb-2">{WIZARD_STEPS[currentStep]}</p>
            <p className="text-[13px] text-[var(--figma-text-muted)] leading-relaxed">
              Step {currentStep + 1} of {WIZARD_STEPS.length} — settings content will appear here in the next session.
            </p>
          </div>
        </div>

        {/* Persistent preview panel */}
        <div className="w-[296px] shrink-0 border-l border-[var(--figma-stroke)] overflow-y-auto px-5 py-5 flex flex-col gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--figma-text-muted)] shrink-0">
            Live preview
          </p>
          <PreviewFrame />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[var(--figma-stroke)] px-6 py-3 shrink-0 bg-white">
        <button type="button" onClick={onExit}
          className="text-[13px] font-medium text-[var(--figma-text-muted)] hover:text-[var(--figma-text)] transition-colors">
          ← Back to portals
        </button>
        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(p => p - 1)}>
              Back
            </Button>
          )}
          <Button variant="primary" size="sm" className="gap-1.5"
            onClick={() => isLast ? onComplete() : setCurrentStep(p => p + 1)}>
            {isLast ? 'Complete setup' : 'Next'}
            {!isLast && <IconArrowRight />}
          </Button>
        </div>
      </div>
    </>
  )
}

// ─── Variant A: Tabs layout ───────────────────────────────────────────────────

type GHTab = 'guest-portal' | 'guides' | 'integrations'

function GuestHubTabsLayout({ portals, onNewPortal, onPortalRowClick, onOpenWizard }: {
  portals: Portal[]
  onNewPortal: () => void
  onPortalRowClick: (id: string) => void
  onOpenWizard: () => void
}) {
  const [tab, setTab] = useState<GHTab>('guest-portal')

  const headerEnd = tab === 'guest-portal' ? (
    <Button variant="primary" onClick={onNewPortal}>New portal</Button>
  ) : null

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <PageHeader
        embedded
        title="Post-booking experience"
        tabs={[
          { key: 'guest-portal',  label: 'Guest portal' },
          { key: 'guides',        label: 'Guides' },
          { key: 'integrations',  label: 'Integrations' },
        ]}
        activeTabKey={tab}
        onTabChange={(key: string) => setTab(key as GHTab)}
        headerEnd={headerEnd}
        showTabCounts={false}
      />
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {tab === 'guest-portal' && (
          portals.length === 0
            ? <GuestHubEmptyState onCreate={onOpenWizard} />
            : <PortalListView portals={portals} onNew={onNewPortal} onRowClick={onPortalRowClick} showHeader={false} />
        )}
        {tab === 'guides' && (
          <div className="flex flex-1 items-center justify-center text-[14px] text-[#717680]">
            Guides — coming soon
          </div>
        )}
        {tab === 'integrations' && (
          <div className="flex flex-1 items-center justify-center text-[14px] text-[#717680]">
            Integrations — coming in Session 08
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Variant B: Panel layout ──────────────────────────────────────────────────

function GuestHubPanelLayout({ portals, onNewPortal, onPortalRowClick, onOpenWizard }: {
  portals: Portal[]
  onNewPortal: () => void
  onPortalRowClick: (id: string) => void
  onOpenWizard: () => void
}) {
  const [activeId, setActiveId] = useState('guest-portal')
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center border-b border-[#e9eaeb] px-6 h-[52px] shrink-0">
        <h1 className="text-[20px] leading-[30px] font-semibold text-[#181d27]">Post-booking experience</h1>
      </div>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-[220px] shrink-0 border-r border-[#e9eaeb] px-3 py-3 overflow-y-auto">
          <GuestHubNav activeId={activeId} onSelect={setActiveId} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {activeId === 'guest-portal' ? (
            portals.length === 0
              ? <GuestHubEmptyState onCreate={onOpenWizard} />
              : <PortalListView portals={portals} onNew={onNewPortal} onRowClick={onPortalRowClick} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-[14px] text-[#717680]">
              {NAV.find(n => n.id === activeId)?.label} — coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Branding / Design section ───────────────────────────────────────────────

// 7 colors per Figma node 50:7434
const COLOR_ROWS = [
  { label: 'Brand color',       hex: '#337ab7', color: '#344054', border: false },
  { label: 'Middle color',      hex: '#337ab7', color: '#175cd3', border: false },
  { label: 'Dark color',        hex: '#337ab7', color: '#0a0d12', border: false },
  { label: 'Header color',      hex: '#337ab7', color: '#ffffff', border: true  },
  { label: 'Header text color', hex: '#337ab7', color: '#0a0d12', border: false },
  { label: 'Footer color',      hex: '#337ab7', color: '#0a0d12', border: false },
  { label: 'Footer text color', hex: '#337ab7', color: '#ffffff', border: true  },
]

function DesignToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200',
        checked ? 'bg-[#17b26a]' : 'bg-[#f2f4f7]'
      )}
    >
      <span className={cn(
        'block h-4 w-4 rounded-full bg-white shadow-[0px_1px_3px_rgba(10,13,18,0.1),0px_1px_2px_-1px_rgba(10,13,18,0.1)] transition-transform duration-200',
        checked ? 'translate-x-4' : 'translate-x-0'
      )} />
    </button>
  )
}

function IconUploadCloud() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  )
}

function IconCopySmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

function IconInfoCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  )
}

// Shared dropzone used for both background image and logo
function UploadDropzone({ hint }: { hint: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#d5d7da] bg-white px-6 py-5 cursor-pointer hover:bg-[#fafafa] transition-colors">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d5d7da] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.05)]">
        <span className="text-[#535862]"><IconUploadCloud /></span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1 flex-wrap justify-center">
          <span className="text-[14px] font-semibold text-[#535862]">Click to upload</span>
          <span className="text-[14px] text-[#535862]">or drag and drop</span>
        </div>
        <span className="text-[12px] text-[#98a2b3] text-center">{hint}</span>
      </div>
    </div>
  )
}

// Sub-section heading used throughout Branding — matches Figma node 50:7434
function BrandSubSection({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-5 shrink-0 w-full">
      <p className="text-[16px] font-semibold leading-6 text-[#181d27]">{title}</p>
      <div className="h-px bg-[#e9eaeb]" />
    </div>
  )
}

const HEADING_FONTS = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Nunito', 'Poppins']
const BODY_FONTS    = ['Noto Sans', 'Inter', 'Roboto', 'Source Sans Pro', 'Open Sans', 'Lato']

function BrandingSection({ portalName }: { portalName: string }) {
  const [bgMode, setBgMode]         = useState<'image' | 'video'>('image')
  const [darken, setDarken]         = useState(false)
  const [headingFont, setHeadingFont] = useState('Inter')
  const [textFont, setTextFont]     = useState('Noto Sans')
  const [roundedEl, setRoundedEl]   = useState(false)
  const [shadowBtn, setShadowBtn]   = useState(false)
  const [welcomeMsg, setWelcomeMsg] = useState(`Welcome to ${portalName}`)
  const [domainType, setDomainType] = useState<'system' | 'subdomain'>('system')
  const [subdomainValue, setSubdomainValue] = useState('')
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const subdomainTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [domainBannerDismissed, setDomainBannerDismissed] = useState(false)

  const handleSubdomainChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSubdomainValue(clean)
    setSubdomainStatus('idle')
    if (subdomainTimer.current) clearTimeout(subdomainTimer.current)
    if (clean.length >= 3) {
      setSubdomainStatus('checking')
      subdomainTimer.current = setTimeout(() => {
        // Mock: "hostaway" is taken, everything else available
        setSubdomainStatus(clean === 'hostaway' ? 'taken' : 'available')
      }, 800)
    }
  }

  // 160px label — matches Figma inline label width
  const lbl    = 'w-[160px] shrink-0 text-[14px] leading-5 text-[#535862]'
  const iconBtn = 'flex h-8 w-8 items-center justify-center rounded-lg text-[#98a2b3] hover:text-[#667085] hover:bg-[#f9fafb] transition-colors'
  const div     = <div className="h-px bg-[#e9eaeb]" />

  return (
    <div className="flex flex-col gap-6">

      {/* ── Guest portal domain ── */}
      <div className="flex items-center justify-between -mb-2">
        <h3 className="text-[16px] font-semibold text-[#101828]">Guest portal domain</h3>
        <button type="button" className="text-[13px] text-[#15b8b0] hover:underline">
          User guide for custom domain
        </button>
      </div>
      <div className="h-px bg-[#e9eaeb]" />

      {/* Site domain row */}
      <div className="flex gap-4 items-start pb-2">
        <div className="w-[160px] shrink-0 flex items-center gap-1.5 pt-2">
          <span className="text-[14px] leading-5 text-[#535862]">Guest portal URL</span>
          <div className="relative group">
            <button type="button" className="flex h-4 w-4 items-center justify-center rounded-full border border-[#d0d5dd] text-[#98a2b3] text-[10px] leading-none">?</button>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-lg bg-[#101828] px-3 py-2 text-[12px] text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-lg leading-relaxed">
              Choose a branded subdomain guests will see in their browser. No DNS setup required.
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-4">
          {/* 2-option segmented control */}
          <div className="flex rounded-lg border border-[#e9eaeb] bg-[#f9fafb] p-1 gap-1 w-fit">
            {([
              { key: 'system',    label: 'System domain' },
              { key: 'subdomain', label: 'Own subdomain' },
            ] as const).map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setDomainType(opt.key)}
                className={cn(
                  'px-4 py-1.5 rounded-md text-[13px] font-medium transition-all',
                  domainType === opt.key
                    ? 'bg-white text-[#101828] shadow-sm border border-[#e9eaeb]'
                    : 'text-[#667085] hover:text-[#535862]'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* System domain state */}
          {domainType === 'system' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[#344054]">Your portal URL</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#ecfdf3] text-[#027a48] border border-[#abefc6]">Active</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#e9eaeb] bg-[#f9fafb] px-3 py-2">
                <span className="flex-1 text-[13px] text-[#535862] font-mono select-all">
                  stay.hostaway.com/p/abc123
                </span>
                <button type="button" aria-label="Copy portal URL" className={iconBtn}>
                  <IconCopySmall />
                </button>
              </div>
            </div>
          )}

          {/* Own subdomain state */}
          {domainType === 'subdomain' && (
            <div className="flex flex-col gap-3">
              {/* Input row */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#344054]">
                  Your subdomain <span className="text-[#15b8b0]">*</span>
                </label>
                <div className={cn(
                  'flex rounded-lg border overflow-hidden transition-colors',
                  subdomainStatus === 'taken' ? 'border-[#fda29b]' : 'border-[#e9eaeb] focus-within:border-[#15b8b0]'
                )}>
                  <input
                    type="text"
                    value={subdomainValue}
                    onChange={e => handleSubdomainChange(e.target.value)}
                    placeholder="anfisarentals"
                    maxLength={40}
                    className="flex-1 px-3 py-2 text-[14px] text-[#101828] bg-white outline-none min-w-0 font-mono"
                  />
                  <div className="flex items-center px-3 py-2 bg-[#f9fafb] border-l border-[#e9eaeb] shrink-0">
                    <span className="text-[13px] font-semibold text-[#344054] whitespace-nowrap">.theguestportal.com</span>
                  </div>
                </div>
                {/* Availability feedback */}
                {subdomainStatus === 'checking' && (
                  <p className="text-[12px] text-[#98a2b3] flex items-center gap-1.5">
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1v2M6 9v2M1 6h2M9 6h2M2.5 2.5l1.4 1.4M8.1 8.1l1.4 1.4M2.5 9.5l1.4-1.4M8.1 3.9l1.4-1.4" stroke="#98a2b3" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Checking availability…
                  </p>
                )}
                {subdomainStatus === 'available' && (
                  <p className="text-[12px] text-[#027a48] flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#027a48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="font-mono font-medium">{subdomainValue}.theguestportal.com</span> is available
                  </p>
                )}
                {subdomainStatus === 'taken' && (
                  <p className="text-[12px] text-[#b42318] flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 2l8 8M10 2l-8 8" stroke="#b42318" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span className="font-mono font-medium">{subdomainValue}.theguestportal.com</span> is already taken
                  </p>
                )}
                {subdomainStatus === 'idle' && subdomainValue.length > 0 && subdomainValue.length < 3 && (
                  <p className="text-[12px] text-[#98a2b3]">Minimum 3 characters</p>
                )}
                {subdomainStatus === 'idle' && subdomainValue.length === 0 && (
                  <p className="text-[12px] text-[#98a2b3]">Letters, numbers, hyphens only. No DNS — goes live instantly.</p>
                )}
              </div>

              {/* Promo banner */}
              {!domainBannerDismissed && (
                <div className="flex gap-3 rounded-xl border border-[#e0f2fe] bg-[#f0f9ff] px-4 py-3">
                  <div className="shrink-0 mt-0.5">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 5v.01M8 7.5v3.5" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#0c4a6e] mb-0.5">Boost check-in completion with your own subdomain</p>
                    <p className="text-[12px] text-[#0369a1] leading-relaxed">
                      94% of guests abandon forms when the URL looks unfamiliar. A branded subdomain signals a verified, trustworthy link — operators who activate one see up to 23% higher online check-in rates.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDomainBannerDismissed(true)}
                    className="shrink-0 flex h-5 w-5 items-center justify-center rounded text-[#7dd3fc] hover:text-[#0284c7] transition-colors -mt-0.5"
                    aria-label="Dismiss"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              )}

              {/* Live preview card — shown once available */}
              {subdomainStatus === 'available' && (
                <div className="rounded-xl border border-[#e9eaeb] bg-[#f9fafb] px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[11px] font-medium text-[#98a2b3] uppercase tracking-wide">Your guest portal URL</p>
                    <p className="text-[14px] font-mono font-semibold text-[#101828]">{subdomainValue}.theguestportal.com</p>
                  </div>
                  <button type="button" className="shrink-0 h-9 px-4 rounded-lg bg-[#101828] text-white text-[13px] font-semibold hover:bg-[#1c2939] transition-colors">
                    Activate
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {div}

      {/* ── Logo ── */}
      <BrandSubSection title="Logo" />

      <div className="flex gap-4 items-start">
        <div className="flex flex-col gap-1 w-[160px] shrink-0">
          <p className={lbl}>Logo file</p>
          <p className="text-[12px] leading-[18px] text-[#98a2b3]">Appears in portal header</p>
        </div>
        <div className="flex-1">
          <UploadDropzone hint="JPG, PNG or SVG — max 5MB" />
        </div>
      </div>

      <div className="flex gap-4 items-start pb-2">
        <div className="flex flex-col gap-1 w-[160px] shrink-0">
          <p className={lbl}>Favicon</p>
          <p className="text-[12px] leading-[18px] text-[#98a2b3]">Shown in browser tabs &amp; bookmarks</p>
        </div>
        <div className="flex-1">
          <UploadDropzone hint="ICO or PNG — 16×16px recommended" />
        </div>
      </div>

      {div}

      {/* ── Colors ── */}
      <BrandSubSection title="Colors" />

      <div className="flex flex-col pb-2">
        {COLOR_ROWS.map(row => (
          <div key={row.label} className="flex items-center gap-4 py-2">
            <p className={lbl}>{row.label}</p>
            <div className={cn(
              'relative h-[38px] w-[38px] shrink-0 overflow-hidden rounded-[4px]',
              row.border ? 'ring-1 ring-[#414651]' : ''
            )}>
              <div className="absolute inset-0" style={{ backgroundColor: row.color, opacity: 0.7 }} />
            </div>
            <span className="flex-1 text-[14px] text-[#535862] whitespace-nowrap">HEX {row.hex}</span>
            <button type="button" aria-label={`Copy ${row.label}`} className={iconBtn}>
              <IconCopySmall />
            </button>
          </div>
        ))}
      </div>

      {div}

      {/* ── Fonts ── */}
      <BrandSubSection title="Fonts" />

      <div className="flex flex-col gap-3 pb-2">
        {[
          { id: 'headings', label: 'Headings', value: headingFont, set: setHeadingFont, opts: HEADING_FONTS },
          { id: 'text',     label: 'Text',     value: textFont,    set: setTextFont,    opts: BODY_FONTS   },
        ].map(row => (
          <div key={row.id} className="flex gap-2 items-center">
            <p className={lbl}>{row.label}</p>
            <div className="relative flex-1">
              <select
                value={row.value}
                onChange={e => row.set(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[#d5d7da] bg-white px-3 py-2 pr-8 text-[14px] font-medium text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:outline-none focus:ring-2 focus:ring-[#15b8b0] cursor-pointer"
              >
                {row.opts.map(f => <option key={f}>{f}</option>)}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98a2b3]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {div}

      {/* ── Background image/video ── */}
      <BrandSubSection title="Background image/video" />

      <div className="flex flex-col gap-4 pb-2">
        {/* Image / Video tab switcher */}
        <div className="flex gap-4 items-center">
          <p className={lbl} />
          <div className="flex w-fit rounded-lg border border-[#e9eaeb] bg-[#f9fafb] p-0.5">
            {(['image', 'video'] as const).map(mode => (
              <button key={mode} type="button" onClick={() => setBgMode(mode)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-[13px] font-medium capitalize transition-colors',
                  bgMode === mode
                    ? 'bg-white text-[#181d27] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                    : 'text-[#535862] hover:text-[#181d27]'
                )}>
                {mode === 'image' ? 'Image' : 'Video'}
              </button>
            ))}
          </div>
        </div>

        {/* Upload area */}
        <div className="flex gap-4 items-start">
          <p className={lbl}>{bgMode === 'image' ? 'Image' : 'Video URL'}</p>
          <div className="flex-1">
            {bgMode === 'image' ? (
              <UploadDropzone hint="SVG, PNG, JPG or GIF (max. 800×400px)" />
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  type="url"
                  placeholder="https://..."
                  className="w-full rounded-lg border border-[#d5d7da] bg-white px-3 py-2 text-[14px] text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:outline-none focus:ring-2 focus:ring-[#15b8b0] placeholder:text-[#98a2b3]"
                />
                <p className="text-[12px] text-[#98a2b3]">Or upload a file</p>
                <UploadDropzone hint="MP4 or WebM (max. 20MB)" />
              </div>
            )}
          </div>
        </div>

        {/* Darken toggle */}
        <div className="flex gap-4 items-center py-2">
          <p className={lbl}>Darken to highlight search bar</p>
          <DesignToggle checked={darken} onChange={setDarken} />
        </div>
      </div>

      {div}

      {/* ── Elements ── */}
      <BrandSubSection title="Elements" />

      <div className="flex flex-col pb-2">
        {[
          { label: 'Rounded elements',      checked: roundedEl, set: setRoundedEl },
          { label: 'Shadow behind buttons', checked: shadowBtn, set: setShadowBtn },
        ].map(row => (
          <div key={row.label} className="flex gap-2 items-center py-2">
            <p className={lbl}>{row.label}</p>
            <DesignToggle checked={row.checked} onChange={row.set} />
          </div>
        ))}
      </div>

      {div}

      {/* ── Welcome message (session spec) ── */}
      <BrandSubSection title="Welcome message" />

      <div className="flex gap-4 items-start pb-2">
        <p className={lbl}>Message</p>
        <div className="flex-1 flex flex-col gap-2">
          <textarea
            value={welcomeMsg}
            onChange={e => setWelcomeMsg(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-[#d5d7da] bg-white px-3 py-2 text-[14px] text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:outline-none focus:ring-2 focus:ring-[#15b8b0] placeholder:text-[#98a2b3]"
          />
          <div className="flex items-center gap-1.5">
            <p className="text-[12px] text-[#98a2b3]">Shown at the top of your guest portal.</p>
            <button
              type="button"
              title="Can be overridden per listing in Guides."
              className="flex h-4 w-4 items-center justify-center text-[#98a2b3] hover:text-[#667085] transition-colors"
            >
              <IconInfoCircle />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

// ─── AI assistant icon (inline — no external dep) ────────────────────────────

function IconAI({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2L13.09 8.26L19 7L14.74 11.26L21 12L14.74 12.74L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12.74L3 12L9.26 11.26L5 7L10.91 8.26L12 2Z"/>
    </svg>
  )
}

// ─── Check-in section constants ───────────────────────────────────────────────

const CHECKIN_CHANNELS = [
  { id: 'airbnb',  label: 'Airbnb' },
  { id: 'vrbo',    label: 'Vrbo' },
  { id: 'booking', label: 'Booking.com' },
  { id: 'direct',  label: 'Direct' },
]

type FieldState = { show: boolean; mandatory: boolean; mainGuestOnly: boolean }

const IDENTITY_FIELDS = [
  'Date of birth', 'Nationality', 'ID number', 'ID photo',
  'Selfie', 'Place of birth', 'Place of issue', 'Travel visa', 'Sex',
]
const CONTACT_FIELDS = ['Mobile phone number']
const STAY_FIELDS    = ['Estimated arrival time', 'Estimated departure time']

const CHEKIN_COUNTRIES = [
  { flag: '🇮🇹', name: 'Italy',    fields: ['Full name', 'Passport / ID number', 'Nationality', 'Date of birth', 'Place of birth', 'Sex', 'Place of issue', 'Expiry date'] },
  { flag: '🇪🇸', name: 'Spain',    fields: ['Full name', 'Passport / ID number', 'Nationality', 'Date of birth', 'Sex'] },
  { flag: '🇵🇹', name: 'Portugal', fields: ['Full name', 'Passport / ID number', 'Nationality', 'Date of birth', 'Sex', 'Country of residence'] },
]

function initFieldStates(labels: string[]): Record<string, FieldState> {
  return Object.fromEntries(labels.map(l => [l, { show: false, mandatory: false, mainGuestOnly: false }]))
}

// ─── Check-in helper components ───────────────────────────────────────────────

function IntegrationEmpty({
  name, description, benefits, onSimulate,
}: {
  name: string; description: string; benefits?: string[]; onSimulate?: () => void
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#e9eaeb] bg-[#fafafa] p-5 flex flex-col gap-3">
      <div>
        <p className="text-[14px] font-medium text-[#181d27]">{name} not connected</p>
        <p className="text-[13px] text-[#535862] mt-1 leading-5">{description}</p>
      </div>
      {benefits && (
        <ul className="flex flex-col gap-1.5">
          {benefits.map(b => (
            <li key={b} className="flex gap-2 text-[13px] text-[#535862]">
              <span className="text-[#17b26a] shrink-0">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-3 pt-1">
        <button type="button" className="text-[13px] font-semibold text-[#0ba5ec] hover:underline text-left">
          Connect {name} in Integrations →
        </button>
        {onSimulate && (
          <button type="button" onClick={onSimulate}
            className="text-[11px] text-[#98a2b3] hover:text-[#667085] border border-[#e9eaeb] bg-white rounded px-2 py-0.5 transition-colors">
            Demo: simulate →
          </button>
        )}
      </div>
    </div>
  )
}

function ConnBadge({ name, onDisconnect }: { name: string; onDisconnect?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf3] px-3 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-[#17b26a] shrink-0" />
        <span className="text-[12px] font-medium text-[#027a48]">Connected via {name}</span>
      </div>
      {onDisconnect && (
        <button type="button" onClick={onDisconnect}
          className="text-[11px] text-[#98a2b3] hover:text-[#667085] border border-[#e9eaeb] bg-white rounded px-2 py-0.5 transition-colors">
          Demo: disconnect
        </button>
      )}
    </div>
  )
}

function FieldCheckbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <span onClick={() => onChange(!checked)} className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
        checked ? 'border-[#15b8b0] bg-[#15b8b0]' : 'border-[#d0d5dd] bg-white hover:border-[#98a2b3]'
      )}>
        {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      <span className="text-[12px] text-[#535862]">{label}</span>
    </label>
  )
}

function GuestFieldRow({
  label, locked, state, onChange,
}: {
  label: string; locked?: boolean; state: FieldState; onChange: (s: FieldState) => void
}) {
  const rowLbl = 'w-[160px] shrink-0 text-[14px] leading-5 text-[#535862]'

  if (locked) {
    return (
      <div className="flex items-center gap-4 py-2.5 border-b border-[#f2f4f7] last:border-0">
        <p className={rowLbl}>{label}</p>
        <button type="button" disabled aria-checked={true} role="switch"
          className="relative inline-flex h-5 w-9 shrink-0 cursor-not-allowed items-center rounded-full p-0.5 bg-[#17b26a] opacity-40">
          <span className="block h-4 w-4 rounded-full bg-white shadow-[0px_1px_3px_rgba(10,13,18,0.1)] translate-x-4" />
        </button>
        <p className="text-[12px] text-[#98a2b3] leading-[18px]">Always required</p>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-[#f2f4f7] last:border-0">
      <p className={cn(rowLbl, 'mt-0.5', !state.show && 'text-[#98a2b3]')}>{label}</p>
      <DesignToggle checked={state.show} onChange={v => onChange({ ...state, show: v })} />
      {state.show && (
        <div className="flex items-center gap-4">
          <FieldCheckbox checked={state.mandatory} onChange={v => onChange({ ...state, mandatory: v })} label="Mandatory" />
          <FieldCheckbox checked={state.mainGuestOnly} onChange={v => onChange({ ...state, mainGuestOnly: v })} label="Main guest only" />
        </div>
      )}
    </div>
  )
}

// ─── ChecklistConfig type (shared with GuestPortalEditor + PreviewFrame) ──────

type ChecklistConfig = {
  formEnabled: boolean
  truviVerification: boolean
  truviDeposit: boolean
  eSignature: boolean
  chekinCompliance: boolean
}

// ─── CheckInSection ───────────────────────────────────────────────────────────

function CheckInSection({ onChecklistChange }: { onChecklistChange?: (c: ChecklistConfig) => void }) {
  const lbl = 'w-[160px] shrink-0 text-[14px] leading-5 text-[#535862]'
  const div = <div className="h-px bg-[#e9eaeb]" />
  const selectCls = 'appearance-none rounded-lg border border-[#d5d7da] bg-white px-3 py-2 pr-8 text-[14px] text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:outline-none focus:ring-2 focus:ring-[#15b8b0] cursor-pointer'


  // ── Form state ──
  const [formSource, setFormSource]       = useState<'hostaway' | 'chekin'>('hostaway')
  const [visibilityAmount, setVisAmt]     = useState(200)
  const [visibilityUnit, setVisUnit]      = useState<'Days' | 'Hours'>('Days')
  const [channels, setChannels]           = useState<Set<string>>(new Set(['airbnb', 'vrbo', 'booking', 'direct']))
  const [identityFields, setIdentityF]    = useState<Record<string, FieldState>>(initFieldStates(IDENTITY_FIELDS))
  const [contactFields, setContactF]      = useState<Record<string, FieldState>>(initFieldStates(CONTACT_FIELDS))
  const [stayFields, setStayF]            = useState<Record<string, FieldState>>(initFieldStates(STAY_FIELDS))
  const [textAbove, setTextAbove]         = useState('')
  const [textBelow, setTextBelow]         = useState('')

  // ── Custom questions ──
  type CQ = { id: string; text: string; mandatory: boolean }
  const [questions, setQuestions]         = useState<CQ[]>([])
  const addQuestion = () => setQuestions(prev => [...prev, { id: Math.random().toString(36).slice(2), text: '', mandatory: false }])
  const removeQuestion = (id: string) => setQuestions(prev => prev.filter(q => q.id !== id))
  const updateQuestion = (id: string, patch: Partial<CQ>) => setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q))

  // ── Chekin state ──
  const [chekinConnected, setChekinOn]    = useState(false)
  const [chekinEnabled, setChekinEnabled] = useState(false)
  const [chekinAutoSubmit, setAutoSubmit] = useState(false)

  // ── Truvi state ──
  const [truviConnected, setTruviOn]      = useState(false)
  const [truviVerif, setTruviVerif]       = useState(false)
  const [truviDeposit, setTruviDeposit]   = useState(false)
  const [depositAmount, setDepAmt]        = useState('')
  const [depositCurrency, setDepCur]      = useState('USD')
  const [depositCollect, setDepCollect]   = useState<'at_booking' | 'days_before'>('at_booking')
  const [depositCollectDays, setDepDays]  = useState(3)
  const [depositReleaseHrs, setDepHrs]    = useState(48)

  // ── Rental agreement ──
  const [rentalMode, setRentalMode]       = useState<'upload' | 'url'>('upload')
  const [rentalUrl, setRentalUrl]         = useState('')
  const [eSignature, setESignature]       = useState(false)

  const hostawayActive = formSource === 'hostaway'
  const chekinActive   = formSource === 'chekin'
  const toggleChannel  = (id: string) =>
    setChannels(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  // Notify parent for preview
  useEffect(() => {
    onChecklistChange?.({
      formEnabled: true,
      truviVerification: truviConnected && truviVerif,
      truviDeposit:      truviConnected && truviDeposit,
      eSignature:        eSignature,
      chekinCompliance:  chekinConnected && chekinEnabled,
    })
  }, [truviConnected, truviVerif, truviDeposit, eSignature, chekinConnected, chekinEnabled])

  // Checkbox — design-system styled
  const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <span
        onClick={() => onChange(!checked)}
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
          checked
            ? 'border-[#15b8b0] bg-[#15b8b0]'
            : 'border-[#d0d5dd] bg-white hover:border-[#98a2b3]'
        )}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span className="text-[13px] text-[#535862]">{label}</span>
    </label>
  )

  return (
    <div className="flex flex-col gap-6">

      {/* ══ 1. Channels & distribution ══ */}
      <BrandSubSection title="Channels & distribution" />

      {/* Visibility timing */}
      <div className="flex gap-4 items-center">
        <p className={lbl}>Show form</p>
        <div className="flex items-center gap-2">
          <input type="number" value={visibilityAmount} min={1}
            onChange={e => setVisAmt(Number(e.target.value))}
            className="w-[72px] rounded-lg border border-[#d5d7da] bg-white px-3 py-2 text-[14px] text-[#181d27] text-center shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]" />
          <div className="relative">
            <select value={visibilityUnit} onChange={e => setVisUnit(e.target.value as 'Days' | 'Hours')} className={cn(selectCls, 'w-[96px]')}>
              <option>Days</option><option>Hours</option>
            </select>
            <ChevDown />
          </div>
          <span className="text-[13px] text-[#535862]">before check-in</span>
          <span className="text-[12px] text-[#98a2b3]">— guests see the form {visibilityAmount} {visibilityUnit.toLowerCase()} before arrival</span>
        </div>
      </div>

      {/* Channel applicability */}
      <div className="flex gap-4 items-start">
        <p className={cn(lbl, 'pt-0.5')}>Channels</p>
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {CHECKIN_CHANNELS.map(ch => (
              <Checkbox key={ch.id} checked={channels.has(ch.id)} onChange={() => toggleChannel(ch.id)} label={ch.label} />
            ))}
          </div>
          {channels.has('airbnb') && (
            <div className="flex gap-2 rounded-lg border border-[#fec84b] bg-[#fffaeb] px-3 py-2.5 mt-1">
              <span className="text-[#b54708] shrink-0 text-[14px]">⚠</span>
              <p className="text-[12px] text-[#b54708] leading-[18px]">
                Airbnb restricts external links in messages. Guests who booked via Airbnb may not receive the portal link automatically. Consider sending the link manually via the Inbox.
              </p>
            </div>
          )}
        </div>
      </div>

      {div}

      {/* ══ Guest data fields ══ */}
      <BrandSubSection title="Guest data fields" />

      {/* Form source — right above the fields */}
      <div className="flex gap-4 items-center">
        <p className={lbl}>Form source</p>
        <div className="flex w-fit rounded-lg border border-[#e9eaeb] bg-[#f9fafb] p-0.5">
          {(['hostaway', 'chekin'] as const).map(src => (
            <button key={src} type="button" onClick={() => setFormSource(src)}
              className={cn(
                'px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
                formSource === src
                  ? 'bg-white text-[#181d27] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-[#535862] hover:text-[#181d27]'
              )}>
              {src === 'hostaway' ? 'Hostaway' : 'Chekin'}
            </button>
          ))}
        </div>
      </div>

      {/* Chekin selected + not connected → marketing card */}
      {chekinActive && !chekinConnected && (
        <IntegrationEmpty
          name="Chekin"
          description="Automatically submit guest data to local authorities. Required in Italy, Portugal, Austria, Spain, and other EU markets."
          onSimulate={() => setChekinOn(true)}
        />
      )}

      {/* Fields — editable when Hostaway, disabled when Chekin connected */}
      {(hostawayActive || (chekinActive && chekinConnected)) && (
        <>
          {chekinActive && chekinConnected && (
            <p className="text-[12px] text-[#98a2b3]">Chekin manages the check-in form. Fields shown for reference only — not editable.</p>
          )}
          {[
            { group: 'Identity',     alwaysOn: ['Full name'],  fields: identityFields, set: setIdentityF, labels: IDENTITY_FIELDS },
            { group: 'Contact',      alwaysOn: ['Email'],      fields: contactFields,  set: setContactF,  labels: CONTACT_FIELDS  },
            { group: 'Stay details', alwaysOn: [],             fields: stayFields,     set: setStayF,     labels: STAY_FIELDS     },
          ].map(grp => (
            <div key={grp.group} className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#98a2b3]">{grp.group}</p>
              <div className={cn(chekinActive && chekinConnected && 'opacity-50 pointer-events-none')}>
                {grp.alwaysOn.map(f => (
                  <GuestFieldRow key={f} label={f} locked state={{ show: true, mandatory: true, mainGuestOnly: false }} onChange={() => {}} />
                ))}
                {grp.labels.map(label => (
                  <GuestFieldRow key={label} label={label}
                    state={grp.fields[label]}
                    onChange={s => grp.set(prev => ({ ...prev, [label]: s }))} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {div}

      {/* Custom questions — Hostaway only */}
      <BrandSubSection title="Custom questions" />
      {chekinActive ? (
        <p className="text-[13px] text-[#98a2b3] -mt-2">Not available when Chekin manages the check-in form.</p>
      ) : (
        <>
          <p className="text-[13px] text-[#535862] -mt-2">Ask guests specific questions as part of the check-in form.</p>
          {questions.map((q, i) => (
            <div key={q.id} className="flex flex-col gap-2 rounded-xl border border-[#e9eaeb] bg-[#fafafa] p-4">
              <div className="flex items-start gap-3">
                <input
                  type="text"
                  value={q.text}
                  onChange={e => updateQuestion(q.id, { text: e.target.value })}
                  placeholder={`Question ${i + 1}`}
                  className="flex-1 rounded-lg border border-[#d5d7da] bg-white px-3 py-2 text-[14px] text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:outline-none focus:ring-2 focus:ring-[#15b8b0] placeholder:text-[#98a2b3]"
                />
                <button type="button" onClick={() => removeQuestion(q.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#98a2b3] hover:text-[#f04438] hover:bg-[#fff1f0] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                  </svg>
                </button>
              </div>
              <Checkbox checked={q.mandatory} onChange={v => updateQuestion(q.id, { mandatory: v })} label="Mandatory" />
            </div>
          ))}
          <button type="button" onClick={addQuestion}
            className="flex items-center gap-2 text-[13px] font-semibold text-[#0ba5ec] hover:text-[#0284c7] transition-colors self-start">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add a custom question
          </button>
        </>
      )}

      {div}

      {/* Text above / below */}
      <BrandSubSection title="Form text" />
      {[
        { id: 'above', label: 'Text above form', value: textAbove, set: setTextAbove },
        { id: 'below', label: 'Text below form', value: textBelow, set: setTextBelow },
      ].map(row => (
        <div key={row.id} className="flex gap-4 items-start">
          <p className={cn(lbl, 'pt-2')}>{row.label}</p>
          <textarea value={row.value} onChange={e => row.set(e.target.value)} rows={2}
            placeholder="Optional — shown to guests in the form"
            className="flex-1 resize-none rounded-lg border border-[#d5d7da] bg-white px-3 py-2 text-[14px] text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:outline-none focus:ring-2 focus:ring-[#15b8b0] placeholder:text-[#98a2b3]" />
        </div>
      ))}

      {div}

      {/* ══ 2. Compliance (Chekin) ══ */}
      <p className="text-[18px] font-semibold leading-7 text-[#181d27]">Compliance</p>
      {div}

      {!chekinConnected ? (
        <IntegrationEmpty
          name="Chekin"
          description="Automatically submit guest data to local authorities. Required in Italy, Portugal, Austria, Spain, and other EU markets."
          onSimulate={() => setChekinOn(true)}
        />
      ) : (
        <div className="flex flex-col gap-5">
          <ConnBadge name="Chekin" onDisconnect={() => { setChekinOn(false); setChekinEnabled(false) }} />

          <div className="flex gap-4 items-center">
            <p className={lbl}>Enable compliance</p>
            <DesignToggle checked={chekinEnabled} onChange={setChekinEnabled} />
            <p className="text-[12px] text-[#98a2b3]">{chekinEnabled ? 'On — collecting compliance data' : 'Off'}</p>
          </div>

          {chekinEnabled && (
            <>
              <p className="text-[12px] text-[#98a2b3]">Fields are defined by local law and cannot be modified.</p>
              {CHEKIN_COUNTRIES.map(c => (
                <div key={c.name} className="rounded-xl border border-[#e9eaeb] bg-[#fafafa] p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px]">{c.flag}</span>
                    <span className="text-[14px] font-semibold text-[#181d27]">{c.name}</span>
                  </div>
                  <div className="rounded-lg border border-[#e9eaeb] bg-white px-3 divide-y divide-[#f2f4f7]">
                    {c.fields.map(f => (
                      <div key={f} className="flex items-center gap-2 py-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
                          <rect x="5" y="11" width="14" height="10" rx="2" fill="#15b8b0" opacity="0.15" stroke="#15b8b0" strokeWidth="1.5"/>
                          <path d="M8 11V7a4 4 0 018 0v4" stroke="#15b8b0" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <span className="flex-1 text-[12px] text-[#535862]">{f}</span>
                        <span className="text-[10px] text-[#15b8b0] font-medium">Required by law</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#98a2b3]">These fields are defined by {c.name} law and cannot be modified.</p>
                </div>
              ))}

              <div className="flex gap-4 items-center">
                <p className={lbl}>Auto-submit</p>
                <DesignToggle checked={chekinAutoSubmit} onChange={setAutoSubmit} />
                <p className="text-[12px] text-[#98a2b3]">
                  {chekinAutoSubmit ? 'Submitted automatically upon form completion.' : 'Manual — download guest data as CSV.'}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {div}

      {/* ══ 3. Identity verification & deposit (Truvi) ══ */}
      <p className="text-[18px] font-semibold leading-7 text-[#181d27]">Identity verification & deposit</p>
      {div}

      {!truviConnected ? (
        <IntegrationEmpty
          name="Truvi"
          description="Verify guest identity with biometric ID checks, and collect security deposits automatically — without the friction of traditional deposits."
          benefits={[
            'ID verification: guests submit a selfie + government ID. Results in your dashboard instantly.',
            'e-Deposit: collect and release deposits automatically via API. No manual handling.',
          ]}
          onSimulate={() => setTruviOn(true)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <ConnBadge name="Truvi" onDisconnect={() => { setTruviOn(false); setTruviVerif(false); setTruviDeposit(false) }} />

          {/* Identity verification card */}
          <div className="rounded-xl border border-[#e9eaeb] bg-[#fafafa] p-4 flex flex-col gap-3">
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <p className="text-[14px] font-medium text-[#181d27]">Require guest identity verification</p>
                <p className="text-[12px] text-[#535862] mt-0.5 leading-5">Guests submit a government ID and real-time selfie. Verified results appear in your Truvi dashboard.</p>
              </div>
              <DesignToggle checked={truviVerif} onChange={setTruviVerif} />
            </div>
            {truviVerif && (
              <div className="flex gap-3 items-center pt-2 border-t border-[#e9eaeb]">
                <span className="text-[13px] text-[#535862]">Verify before</span>
                <div className="relative flex-1">
                  <select className={cn(selectCls, 'w-full')}>
                    <option>Access codes are released</option>
                    <option>Check-in date</option>
                    <option>Custom timing</option>
                  </select>
                  <ChevDown />
                </div>
              </div>
            )}
          </div>

          {/* e-Deposit card */}
          <div className="rounded-xl border border-[#e9eaeb] bg-[#fafafa] p-4 flex flex-col gap-3">
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <p className="text-[14px] font-medium text-[#181d27]">Collect security deposit via Truvi</p>
                <p className="text-[12px] text-[#535862] mt-0.5 leading-5">Deposits are collected and released automatically. Guests see this as part of the pre-arrival checklist.</p>
              </div>
              <DesignToggle checked={truviDeposit} onChange={setTruviDeposit} />
            </div>
            {truviDeposit && (
              <div className="flex flex-col gap-3 pt-2 border-t border-[#e9eaeb]">
                <div className="flex gap-2 items-center">
                  <span className="text-[13px] text-[#535862] w-[100px] shrink-0">Deposit amount</span>
                  <div className="relative">
                    <select value={depositCurrency} onChange={e => setDepCur(e.target.value)} className={cn(selectCls, 'w-[80px]')}>
                      {['USD','EUR','GBP','AUD','CAD'].map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevDown />
                  </div>
                  <input type="number" value={depositAmount} onChange={e => setDepAmt(e.target.value)}
                    placeholder="0.00"
                    className="w-[100px] rounded-lg border border-[#d5d7da] bg-white px-3 py-2 text-[14px] text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:outline-none focus:ring-2 focus:ring-[#15b8b0] placeholder:text-[#98a2b3]" />
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-[13px] text-[#535862] w-[100px] shrink-0">Collect</span>
                  <div className="relative flex-1">
                    <select value={depositCollect} onChange={e => setDepCollect(e.target.value as 'at_booking' | 'days_before')} className={cn(selectCls, 'w-full')}>
                      <option value="at_booking">At booking</option>
                      <option value="days_before">Days before check-in</option>
                    </select>
                    <ChevDown />
                  </div>
                  {depositCollect === 'days_before' && (
                    <input type="number" value={depositCollectDays} min={1} onChange={e => setDepDays(Number(e.target.value))}
                      className="w-[60px] rounded-lg border border-[#d5d7da] bg-white px-2 py-2 text-[14px] text-center text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]" />
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-[13px] text-[#535862] w-[100px] shrink-0">Release after</span>
                  <input type="number" value={depositReleaseHrs} min={1} onChange={e => setDepHrs(Number(e.target.value))}
                    className="w-[60px] rounded-lg border border-[#d5d7da] bg-white px-2 py-2 text-[14px] text-center text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]" />
                  <span className="text-[13px] text-[#535862]">hours after checkout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ 4. Rental agreement ══ */}
      <BrandSubSection title="Rental agreement" />

      <div className="flex gap-4 items-center">
        <p className={lbl}>Agreement</p>
        <div className="flex w-fit rounded-lg border border-[#e9eaeb] bg-[#f9fafb] p-0.5">
          {(['upload', 'url'] as const).map(m => (
            <button key={m} type="button"
              onClick={() => setRentalMode(m)}
              className={cn(
                'px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
                rentalMode === m
                  ? 'bg-white text-[#181d27] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-[#535862] hover:text-[#181d27]'
              )}>
              {m === 'upload' ? 'Upload PDF' : 'Hosted URL'}
            </button>
          ))}
        </div>
      </div>

      {rentalMode === 'upload' && (
        <div className="flex gap-4 items-start">
          <p className={lbl} />
          <div className="flex-1"><UploadDropzone hint="PDF only — max 20MB" /></div>
        </div>
      )}

      {rentalMode === 'url' && (
        <div className="flex gap-4 items-center">
          <p className={lbl} />
          <input type="url" value={rentalUrl} onChange={e => setRentalUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 rounded-lg border border-[#d5d7da] bg-white px-3 py-2 text-[14px] text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:outline-none focus:ring-2 focus:ring-[#15b8b0] placeholder:text-[#98a2b3]" />
        </div>
      )}

      <div className="flex gap-4 items-center">
        <p className={lbl}>E-signature</p>
        <DesignToggle checked={eSignature} onChange={setESignature} />
        <p className="text-[12px] text-[#98a2b3] leading-[18px]">
          {eSignature
            ? 'Guest must sign before access codes are released.'
            : 'Agreement shown as downloadable link only.'}
        </p>
      </div>

      {rentalMode && (
        <div className="flex gap-4 items-center">
          <p className={lbl} />
          <button type="button" className="text-[13px] font-medium text-[#0ba5ec] hover:underline">
            View as guest →
          </button>
        </div>
      )}

    </div>
  )
}

// ─── LockConfig type ─────────────────────────────────────────────────────────

type LockConfig = {
  anyConditionSelected: boolean
}

// ─── LocksSection ─────────────────────────────────────────────────────────────

function LocksSection({
  checklistConfig,
  onLockConfigChange,
}: {
  checklistConfig: ChecklistConfig
  onLockConfigChange?: (c: LockConfig) => void
}) {
  const lbl = 'w-[160px] shrink-0 text-[14px] leading-5 text-[#535862]'
  const selectCls = 'appearance-none rounded-lg border border-[#d5d7da] bg-white pl-3 pr-8 py-2 text-[14px] text-[#181d27] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]'

  const [triggers, setTriggers] = useState({
    formSubmitted: false,
    rentalSigned: false,
    idVerified: false,
    depositPaid: false,
    complianceSubmitted: false,
    checkinTime: true,
  })
  const [addressVisibility, setAddressVisibility] = useState<'always' | 'checkin_time' | 'all_conditions'>('always')
  const [wifiVisibility, setWifiVisibility] = useState<'always' | 'checkin_time' | 'all_conditions'>('always')

  const TRIGGER_LABELS: Record<string, string> = {
    formSubmitted: 'check-in form submitted',
    rentalSigned: 'rental agreement signed',
    idVerified: 'identity verification completed',
    depositPaid: 'security deposit collected',
    complianceSubmitted: 'compliance form submitted',
    checkinTime: 'check-in time reached',
  }

  const visibleTriggers = Object.entries(triggers).filter(([key]) => {
    if (key === 'idVerified') return checklistConfig.truviVerification
    if (key === 'depositPaid') return checklistConfig.truviDeposit
    if (key === 'complianceSubmitted') return checklistConfig.chekinCompliance
    return true
  })

  const selectedLabels = visibleTriggers.filter(([, on]) => on).map(([key]) => TRIGGER_LABELS[key])
  const anySelected = selectedLabels.length > 0

  const liveText = anySelected
    ? `Guests will see access codes when: ${selectedLabels.join(', ')}.`
    : 'No conditions selected — access codes will never appear.'

  useEffect(() => { onLockConfigChange?.({ anyConditionSelected: anySelected }) }, [anySelected])

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[18px] font-semibold leading-7 text-[#101828]">Locks</h2>

      <BrandSubSection title="Release conditions" />
      <p className="text-[13px] text-[#535862] -mt-4 leading-5">
        Access codes are revealed when all selected conditions are met.
      </p>

      <div className="flex flex-col gap-2.5">
        {visibleTriggers.map(([key, on]) => (
          <FieldCheckbox
            key={key}
            checked={on}
            onChange={v => setTriggers(prev => ({ ...prev, [key]: v }))}
            label={TRIGGER_LABELS[key].charAt(0).toUpperCase() + TRIGGER_LABELS[key].slice(1)}
          />
        ))}
      </div>

      {/* Live preview text */}
      <div className={cn('rounded-xl border px-4 py-3', anySelected ? 'border-[#e9eaeb] bg-[#f9fafb]' : 'border-[#fec84b] bg-[#fffcf0]')}>
        <p className={cn('text-[12px] leading-5 italic', anySelected ? 'text-[#535862]' : 'text-[#92400e]')}>{liveText}</p>
      </div>

      {/* Never block entry — permanent product constraint */}
      <p className="text-[12px] text-[#98a2b3] leading-[18px]">
        Guests can always reach their entry instructions from the portal. These conditions determine when access codes appear on their check-in screen.
      </p>

      <div className="h-px bg-[#f2f4f7]" />

      <BrandSubSection title="Visibility settings" />
      <p className="text-[13px] text-[#535862] -mt-4 leading-5">
        Applies to all listings assigned to this portal.
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex gap-4 items-center">
          <p className={lbl}>Show exact address</p>
          <div className="relative">
            <select value={addressVisibility} onChange={e => setAddressVisibility(e.target.value as typeof addressVisibility)} className={selectCls}>
              <option value="always">Always</option>
              <option value="checkin_time">After check-in time</option>
              <option value="all_conditions">After all conditions met</option>
            </select>
            <ChevDown />
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <p className={lbl}>Show WiFi credentials</p>
          <div className="relative">
            <select value={wifiVisibility} onChange={e => setWifiVisibility(e.target.value as typeof wifiVisibility)} className={selectCls}>
              <option value="always">Always</option>
              <option value="checkin_time">After check-in time</option>
              <option value="all_conditions">After all conditions met</option>
            </select>
            <ChevDown />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AIAssistantSection ───────────────────────────────────────────────────────

function AIAssistantSection({ onEnabledChange }: { onEnabledChange?: (enabled: boolean) => void }) {
  const lbl = 'w-[160px] shrink-0 text-[14px] leading-5 text-[#535862]'
  const [enabled, setEnabled] = useState(false)

  const handleChange = (v: boolean) => {
    setEnabled(v)
    onEnabledChange?.(v)
  }

  const EXAMPLE_QUESTIONS = [
    'How do I connect to WiFi?',
    'Where should I park?',
    'What time is check-out?',
    'What\'s the closest restaurant?',
  ]

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[18px] font-semibold leading-7 text-[#101828]">AI assistant</h2>

      {/* Master toggle */}
      <div className="flex gap-4 items-center">
        <p className={lbl}>Enable AI guest assistant</p>
        <DesignToggle checked={enabled} onChange={handleChange} />
        <p className="text-[12px] text-[#98a2b3] leading-[18px]">
          {enabled ? 'Guests can ask questions during their stay.' : 'AI chat is hidden from guests.'}
        </p>
      </div>

      {!enabled && (
        <p className="text-[13px] text-[#535862] leading-5 max-w-[520px]">
          When enabled, guests can ask questions in real time. The assistant answers using each listing's AI knowledge base — no extra setup needed here.
        </p>
      )}

      {enabled && (
        <>
          <div className="h-px bg-[#f2f4f7]" />

          {/* How knowledge works */}
          <BrandSubSection title="How the assistant knows things" />
          <div className="rounded-xl border border-[#e9eaeb] bg-[#fafafa] px-4 py-4 flex flex-col gap-3 -mt-2">
            <p className="text-[13px] text-[#535862] leading-5">
              Each listing has its own <strong className="font-medium text-[#181d27]">AI knowledge base</strong> — facts, local info, house rules, and more. When a guest sends a message, the assistant uses the knowledge base for their specific listing.
            </p>
            <p className="text-[13px] text-[#535862] leading-5">
              Knowledge is managed per listing, not per portal. Once you've assigned listings to this portal, you can review and fill gaps from the Listings tab.
            </p>
            <button type="button" className="self-start text-[13px] font-medium text-[#15b8b0] hover:underline">
              Manage knowledge bases per listing →
            </button>
          </div>

          <div className="h-px bg-[#f2f4f7]" />

          {/* Example questions */}
          <BrandSubSection title="Guests can ask things like" />
          <div className="flex flex-col gap-2 -mt-2">
            {EXAMPLE_QUESTIONS.map((q, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-[#e9eaeb] bg-[#fafafa] px-4 py-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15b8b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <span className="text-[13px] text-[#535862]">"{q}"</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── ListingsSection ─────────────────────────────────────────────────────────

type ListingScope = 'all' | 'specific'

const ACCESS_TYPE_LABEL: Record<string, string> = {
  smart_lock: 'Smart lock',
  manual_code: 'Manual code',
  key_handoff: 'Key handoff',
}

function AccessStatusChip({ accessType }: { accessType: AccessType }) {
  if (!accessType) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1f0] border border-[#fecdca] px-2 py-0.5 text-[11px] font-medium text-[#b42318]">
        <svg width="9" height="9" viewBox="0 0 16 16" fill="none"><path d="M8 5.5v3M8 10.5h.01" stroke="#b42318" strokeWidth="1.5" strokeLinecap="round"/></svg>
        Not configured
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf3] border border-[#a9efc5] px-2 py-0.5 text-[11px] font-medium text-[#027a48]">
      <svg width="9" height="9" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="#027a48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      {ACCESS_TYPE_LABEL[accessType]}
    </span>
  )
}

function ListingsSection({ onAssignedChange }: { onAssignedChange?: (ids: string[]) => void }) {
  const lbl = 'w-[160px] shrink-0 text-[14px] leading-5 text-[#535862]'
  const [scope, setScope] = useState<ListingScope>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set(MOCK_LISTINGS.map(l => l.id)))
  const [confirmRemove, setConfirmRemove] = useState<MockListing | null>(null)
  const [showGapsOnly, setShowGapsOnly] = useState(false)

  const assignedIds = scope === 'all' ? MOCK_LISTINGS.map(l => l.id) : Array.from(selected)
  const assignedListings = MOCK_LISTINGS.filter(l => assignedIds.includes(l.id))
  const assignedCount = assignedIds.length
  const gapListings = assignedListings.filter(l => !l.accessType)

  const toggle = (id: string) => {
    if (selected.has(id)) {
      setConfirmRemove(MOCK_LISTINGS.find(l => l.id === id)!)
    } else {
      setSelected(prev => { const s = new Set(prev); s.add(id); return s })
    }
  }

  const confirmRemoveListing = () => {
    if (!confirmRemove) return
    setSelected(prev => { const s = new Set(prev); s.delete(confirmRemove.id); return s })
    setConfirmRemove(null)
  }

  useEffect(() => { onAssignedChange?.(assignedIds) }, [scope, selected])

  const tableListings = scope === 'specific'
    ? (showGapsOnly ? MOCK_LISTINGS.filter(l => !l.accessType) : MOCK_LISTINGS)
    : (showGapsOnly ? assignedListings.filter(l => !l.accessType) : assignedListings)

  const showTable = scope === 'specific' || gapListings.length > 0

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[18px] font-semibold leading-7 text-[#101828]">Listings</h2>

      {/* Scope selector */}
      <div className="flex gap-4 items-center">
        <p className={lbl}>Apply portal to</p>
        <div className="flex w-fit rounded-lg border border-[#e9eaeb] bg-[#f9fafb] p-0.5">
          {(['all', 'specific'] as ListingScope[]).map(s => (
            <button key={s} type="button" onClick={() => setScope(s)}
              className={cn(
                'px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap',
                scope === s
                  ? 'bg-white text-[#181d27] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-[#535862] hover:text-[#181d27]'
              )}>
              {s === 'all' ? 'All listings' : 'Specific listings'}
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation line */}
      <p className="text-[13px] text-[#535862] -mt-3">
        This portal will be active for <span className="font-medium text-[#181d27]">{assignedCount} listing{assignedCount !== 1 ? 's' : ''}</span>.
      </p>

      {/* Gap summary */}
      {gapListings.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-[#fec84b] bg-[#fffcf0] px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
            <path d="M8 5.5v3M8 10.5h.01M6.3 2.5l-4.55 7.87A1.5 1.5 0 003.05 12.5h9.9a1.5 1.5 0 001.3-2.13L9.7 2.5a1.5 1.5 0 00-2.6.01"
              stroke="#b45309" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-[13px] text-[#92400e] leading-5 flex-1">
            {gapListings.length} listing{gapListings.length > 1 ? 's have' : ' has'} no access method configured — guests won't receive entry instructions.{' '}
            <button type="button" onClick={() => setShowGapsOnly(v => !v)}
              className="font-medium underline hover:no-underline">
              {showGapsOnly ? 'Show all' : 'Show gaps only'}
            </button>
          </p>
        </div>
      )}

      {/* Table */}
      {showTable && (
        <div className="flex flex-col rounded-xl border border-[#e9eaeb] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[16px_1fr_120px_130px_80px] gap-4 px-4 py-2.5 bg-[#f9fafb] border-b border-[#e9eaeb]">
            <div />
            <span className="text-[11px] font-medium text-[#667085] uppercase tracking-wide">Listing</span>
            <span className="text-[11px] font-medium text-[#667085] uppercase tracking-wide">Access type</span>
            <span className="text-[11px] font-medium text-[#667085] uppercase tracking-wide">Status</span>
            <span className="text-[11px] font-medium text-[#667085] uppercase tracking-wide">Action</span>
          </div>
          {tableListings.map((listing, i) => {
            const checked = scope === 'all' || selected.has(listing.id)
            return (
              <div key={listing.id}
                className={cn(
                  'grid grid-cols-[16px_1fr_120px_130px_80px] gap-4 px-4 py-3 items-center transition-colors',
                  i < tableListings.length - 1 && 'border-b border-[#f2f4f7]',
                  !listing.accessType ? 'bg-[#fffcf0]' : checked ? 'bg-white' : 'bg-[#fafafa]'
                )}>
                {/* Checkbox — only interactive in specific mode */}
                {scope === 'specific'
                  ? <FieldCheckbox checked={checked} onChange={() => toggle(listing.id)} label="" />
                  : <div />
                }
                {/* Thumbnail + name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-[#f2f4f7] shrink-0 flex items-center justify-center">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#98a2b3" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-[13px] leading-5 truncate font-medium', checked ? 'text-[#181d27]' : 'text-[#98a2b3]')}>{listing.name}</p>
                    <p className="text-[11px] text-[#98a2b3]">#{listing.hostawayId}</p>
                  </div>
                </div>
                {/* Access type */}
                <span className="text-[13px] text-[#535862]">
                  {listing.accessType ? ACCESS_TYPE_LABEL[listing.accessType] : '—'}
                </span>
                {/* Status chip */}
                <AccessStatusChip accessType={listing.accessType} />
                {/* Action */}
                <button type="button"
                  className={cn(
                    'text-[12px] font-medium whitespace-nowrap transition-colors',
                    listing.accessType ? 'text-[#535862] hover:text-[#181d27]' : 'text-[#15b8b0] hover:underline'
                  )}>
                  {listing.accessType ? 'Edit' : 'Configure →'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Never block entry — permanent reminder */}
      {showTable && (
        <p className="text-[12px] text-[#98a2b3] leading-[18px]">
          Guests can always reach their entry instructions. Access codes appear based on the release conditions set in Locks.
        </p>
      )}

      {/* Confirm remove dialog */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-[360px] rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] flex flex-col gap-4">
            <p className="text-[15px] font-semibold text-[#181d27]">Remove listing?</p>
            <p className="text-[13px] text-[#535862] leading-5">
              <strong className="font-medium">{confirmRemove.name}</strong> will no longer have a guest portal.
            </p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setConfirmRemove(null)}
                className="rounded-lg border border-[#d5d7da] px-4 py-2 text-[13px] font-medium text-[#535862] hover:bg-[#f9fafb] transition-colors">
                Cancel
              </button>
              <button type="button" onClick={confirmRemoveListing}
                className="rounded-lg bg-[#d92d20] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#b42318] transition-colors">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PreviewShareSection ──────────────────────────────────────────────────────

function PreviewShareSection({
  checklistConfig,
  lockConfig,
  assignedListingIds,
}: {
  checklistConfig: ChecklistConfig
  lockConfig: LockConfig
  assignedListingIds: string[]
}) {
  const [copied, setCopied] = useState(false)
  const portalUrl = 'stay.hostaway.com/p/abc123'

  const assignedListings = MOCK_LISTINGS.filter(l => assignedListingIds.includes(l.id))
  const noAccessConfigured = assignedListings.filter(l => !l.accessType)
  const noArrivalGuide = assignedListings.filter(l => !l.hasArrivalGuide)

  type Gap = { message: string; cta: string }
  const gaps: Gap[] = []

  if (assignedListingIds.length === 0) {
    gaps.push({ message: 'This portal has no listings — it won\'t reach any guests.', cta: 'Assign listings' })
  }
  if (!lockConfig.anyConditionSelected) {
    gaps.push({ message: 'No release conditions set — access codes will never appear.', cta: 'Set conditions' })
  }
  if (noAccessConfigured.length > 0) {
    gaps.push({ message: `${noAccessConfigured.length} listing${noAccessConfigured.length > 1 ? 's have' : ' has'} no access method — guests won't receive entry instructions.`, cta: 'Show gaps' })
  }
  if (noArrivalGuide.length > 0) {
    gaps.push({ message: `${noArrivalGuide.length} listing${noArrivalGuide.length > 1 ? 's have' : ' has'} no arrival guide.`, cta: 'Add guides' })
  }

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[18px] font-semibold leading-7 text-[#101828]">Preview & Share</h2>

      {/* Gap summary */}
      <BrandSubSection title="Checklist" />

      {gaps.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#a9efc5] bg-[#f6fef9] px-4 py-3 -mt-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <circle cx="8" cy="8" r="7" fill="#12b76a"/>
            <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-[13px] font-medium text-[#027a48]">Everything looks good. Ready to share.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 -mt-2">
          {gaps.map((gap, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-[#fec84b] bg-[#fffcf0] px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
                <path d="M8 5.5v3M8 10.5h.01M6.3 2.5l-4.55 7.87A1.5 1.5 0 003.05 12.5h9.9a1.5 1.5 0 001.3-2.13L9.7 2.5a1.5 1.5 0 00-2.6.01"
                  stroke="#b45309" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-[13px] text-[#92400e] leading-5 flex-1">
                {gap.message}{' '}
                <button type="button" className="font-medium underline hover:no-underline">{gap.cta} →</button>
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="h-px bg-[#f2f4f7]" />

      {/* Share */}
      <BrandSubSection title="Share portal" />
      <p className="text-[13px] text-[#535862] -mt-4 leading-5">
        Send this link to guests via your comms hub or messaging tool.
      </p>

      <div className="flex items-center gap-2 rounded-xl border border-[#d5d7da] bg-white px-4 py-2.5 shadow-[0px_1px_2px_rgba(10,13,18,0.05)]">
        <span className="flex-1 text-[14px] text-[#181d27] font-medium">{portalUrl}</span>
        <button type="button" onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
            copied
              ? 'bg-[#ecfdf3] text-[#027a48]'
              : 'bg-[#f2f4f7] text-[#535862] hover:bg-[#e9eaeb]'
          )}>
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3 3 7-7" stroke="#027a48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Copy link
            </>
          )}
        </button>
      </div>

      {gaps.length > 0 && (
        <p className="text-[12px] text-[#98a2b3] -mt-3">
          Portal has unresolved issues. You can still share it, but guests may have an incomplete experience.
        </p>
      )}
    </div>
  )
}

// ─── Placeholder section (used for not-yet-built nav items) ──────────────────

function PlaceholderSection({ title, sections }: {
  title: string
  sections: { title: string; description: string }[]
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between -mb-2">
        <h3 className="text-[16px] font-semibold text-[#101828]">{title}</h3>
      </div>
      <div className="h-px bg-[#e9eaeb]" />
      {sections.map((s, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl border border-dashed border-[#d0d5dd] bg-[#fafafa] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#d0d5dd]" />
            <p className="text-[14px] font-semibold text-[#667085]">{s.title}</p>
            <span className="ml-auto text-[11px] font-medium text-[#98a2b3] bg-[#f2f4f7] border border-[#e9eaeb] rounded-md px-2 py-0.5">Coming soon</span>
          </div>
          <p className="text-[13px] text-[#98a2b3] leading-relaxed pl-4">{s.description}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Portal editor nav (spec order: fixed, do not change) ────────────────────

const PORTAL_NAV = [
  { id: 'branding',         label: 'Branding',             icon: HomeLine    },
  { id: 'check-in',         label: 'Check-in',             icon: FileCheck01 },
  { id: 'access-controls',  label: 'Access controls',      icon: Lock01      },
  { id: 'security',         label: 'Security',             icon: Shield01    },
  { id: 'payments',         label: 'Billing',              icon: CreditCard01},
  { id: 'listings',         label: 'Listings',             icon: List        },
  { id: 'preview',          label: 'Preview & Share',      icon: Eye         },
]

// ─── Portal editor ────────────────────────────────────────────────────────────

function GuestPortalEditor({ portal, onBack }: { portal: Portal; onBack: () => void }) {
  const [activeSection, setActiveSection] = useState('branding')
  const [isDirty, setIsDirty] = useState(false)
  const [status, setStatus] = useState<PortalStatus>(portal.status)
  const [completed] = useState<Record<string, boolean>>({ branding: true })
  const [showPreview, setShowPreview] = useState(false)
  const [checklistConfig, setChecklistConfig] = useState<ChecklistConfig>({
    formEnabled: true,
    truviVerification: false,
    truviDeposit: false,
    eSignature: false,
    chekinCompliance: false,
  })
  const [lockConfig, setLockConfig] = useState<LockConfig>({ anyConditionSelected: false })
  const [simulateConditionsMet, setSimulateConditionsMet] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [assignedListingIds, setAssignedListingIds] = useState<string[]>(MOCK_LISTINGS.map(l => l.id))

  const checklistItems = [
    checklistConfig.formEnabled         && 'Complete check-in form',
    checklistConfig.truviVerification   && 'Upload ID verification',
    checklistConfig.truviDeposit        && 'Pay security deposit',
    checklistConfig.eSignature          && 'Sign rental agreement',
    checklistConfig.chekinCompliance    && 'Complete compliance form',
  ].filter(Boolean) as string[]

  const handlePublish = () => setStatus('Published')

  const iconBtn = 'flex h-8 w-8 items-center justify-center rounded-lg text-[#a4a7ae] hover:text-[#667085] hover:bg-[#f9fafb] transition-colors'

  return (
    <div className="flex min-h-0 flex-1 gap-[10px] overflow-hidden">

      {/* ── Main editor card ── */}
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e9eaeb] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.05)]">

        {/* Header */}
        <header className="border-b border-[#e9eaeb] px-6 pt-4 pb-3 shrink-0">

          {/* Row 1: back link · preview toggle (when panel is hidden) */}
          <div className="flex min-h-[32px] items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-[14px] leading-5 text-[#414651] hover:text-[#181d27] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              Back to Guest portals
            </button>
            {!showPreview && (
              <button
                type="button"
                aria-label="Show preview"
                onClick={() => setShowPreview(true)}
                className={iconBtn}
              >
                <IconLayoutRight />
              </button>
            )}
          </div>

          {/* Row 2: title */}
          <h1 className="mt-1 text-[20px] font-semibold leading-[30px] text-[#181d27]">
            {portal.name}
          </h1>

          {/* Row 3: meta (left) · actions (right) — no-wrap keeps header height fixed */}
          <div className="mt-2 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-x-4 overflow-hidden">
              <BWStatusBadge status={status} />
              <span className="text-[14px] leading-5 text-[#535861] whitespace-nowrap">
                {portal.listings} listing{portal.listings !== 1 ? 's' : ''}
              </span>
              <span className="text-[14px] leading-5 text-[#535861] whitespace-nowrap">
                Last edited {portal.lastEdited}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!isDirty}
                className="gap-1.5"
                onClick={() => setIsDirty(false)}
              >
                <Save01 className="h-5 w-5 shrink-0" aria-hidden />
                Save
              </Button>
              <Button type="button" className="gap-1.5" onClick={handlePublish}>
                <Rocket01 className="h-5 w-5 shrink-0" aria-hidden />
                Publish
              </Button>
            </div>
          </div>
        </header>

        {/* Body: left nav + content */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* Left nav */}
          <aside className="w-[236px] shrink-0 overflow-y-auto border-r border-[#e9eaeb] px-1 py-4">
            <nav className="space-y-0.5">
              {PORTAL_NAV.map((item) => {
                const Icon = item.icon
                const active = activeSection === item.id
                const done = !!completed[item.id]
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-5 py-2 text-left transition-colors',
                      active ? 'bg-[#f6f9fc] text-[#252b37]' : 'text-[#414651] hover:bg-[#f6f9fc]'
                    )}
                  >
                    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center', active ? 'text-[#414651]' : 'text-[#98a2b3]')}>
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    <span className="flex-1 text-[14px] font-medium leading-5">{item.label}</span>
                    {done
                      ? <CheckCircle className="h-4 w-4 shrink-0 text-[#17b26a]" aria-hidden />
                      : <Circle className="h-4 w-4 shrink-0 text-[#d0d5dd]" aria-hidden />
                    }
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Settings content */}
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-[clamp(1rem,2.5vw,1.5rem)] py-8 pb-12">
            <div className="mx-auto max-w-[640px]">
              {activeSection === 'branding' && (
                <BrandingSection portalName={portal.name} />
              )}
              {activeSection === 'check-in' && (
                <CheckInSection onChecklistChange={setChecklistConfig} />
              )}
              {activeSection === 'access-controls' && (
                <div className="flex flex-col gap-8">
                  <LocksSection checklistConfig={checklistConfig} onLockConfigChange={setLockConfig} />
                  <div className="h-px bg-[#e9eaeb]" />
                  <PlaceholderSection title="More access controls" sections={[
                    { title: 'Show charges, refunds and receipts', description: 'Only receipts for paid charges and refunds generated on Hostaway will be visible in the guest portal. OTA payments import excluded.' },
                    { title: 'Show payment link for due payments', description: 'This will allow guests to pay due charges in advance.' },
                    { title: 'Show payment link for failed payments', description: 'This will allow guests to pay failed charges.' },
                    { title: 'Guest portal details visibility settings', description: 'Customise when guests will be able to see the door code, Wi-Fi credentials, and exact address in the guest portal.' },
                  ]} />
                </div>
              )}
              {activeSection === 'security' && (
                <PlaceholderSection title="Security" sections={[
                  { title: 'ID verification', description: 'Require guests to verify their identity before check-in using a government-issued ID.' },
                  { title: 'Deposit collection', description: 'Collect a security deposit from guests before or during check-in to cover potential damages.' },
                ]} />
              )}
              {activeSection === 'payments' && (
                <PlaceholderSection title="Payments & invoices" sections={[
                  { title: 'Tax collection', description: 'Configure applicable taxes shown to guests on invoices and payment pages.' },
                  { title: 'Invoices', description: 'Customise invoice templates, numbering, and delivery settings for guest receipts.' },
                ]} />
              )}
              {activeSection === 'listings' && (
                <ListingsSection onAssignedChange={setAssignedListingIds} />
              )}
              {activeSection === 'preview' && (
                <PreviewShareSection
                  checklistConfig={checklistConfig}
                  lockConfig={lockConfig}
                  assignedListingIds={assignedListingIds}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Preview panel — toggled via IconLayoutRight ── */}
      {showPreview && (
        <section className="w-[300px] shrink-0 flex flex-col overflow-hidden rounded-xl border border-[#e9eaeb] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.05)]">
          <div className="flex items-center justify-between px-4 h-[40px] border-b border-[#e9eaeb] shrink-0">
            <span className="text-[14px] font-semibold text-[#181d27]">Preview</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Hide preview"
                onClick={() => setShowPreview(false)}
                className={iconBtn}
              >
                <IconLayoutRight />
              </button>
              <button type="button" aria-label="Fullscreen preview" className={iconBtn}>
                <IconExpand />
              </button>
            </div>
          </div>
          {activeSection === 'access-controls' && (
            <div className="px-4 py-3 border-b border-[#e9eaeb] shrink-0 flex items-center justify-between">
              <span className="text-[12px] text-[#535862]">Simulate: all conditions met</span>
              <DesignToggle checked={simulateConditionsMet} onChange={setSimulateConditionsMet} />
            </div>
          )}
          <div className="flex-1 overflow-y-auto bg-[#f5f5f5] flex flex-col items-center py-6 px-4">
            <PreviewFrame
              checklist={checklistItems}
              simulateConditionsMet={simulateConditionsMet}
              aiEnabled={aiEnabled}
            />
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type LayoutVariant = 'tabs' | 'panel'

export function GuestHubPage() {
  const navigate = useNavigate()
  const [portals, setPortals] = useState<Portal[]>(INITIAL_PORTALS)
  const [wizardActive, setWizardActive] = useState(false)
  const [editingPortal, setEditingPortal] = useState<Portal | null>(null)
  const [variant, setVariant] = useState<LayoutVariant>('tabs')

  const handleWizardComplete = () => {
    setPortals(p => [...p, {
      id: String(Date.now()), name: 'New Portal',
      listings: 0, lastEdited: 'Today', status: 'Draft',
    }])
    setWizardActive(false)
  }

  const handlePortalRowClick = (id: string) => {
    const portal = portals.find(p => p.id === id)
    if (portal) setEditingPortal(portal)
  }

  const sharedProps = {
    portals,
    onNewPortal: () => setWizardActive(true),
    onPortalRowClick: handlePortalRowClick,
    onOpenWizard: () => setWizardActive(true),
  }

  // Editor view — full-width, replaces the hub frame
  if (editingPortal) {
    return (
      <PageShell sidebarActiveIndex={9} onSidebarSelectItem={(i: number) => { if (i === 10) navigate('/booking-website'); else if (i !== 9) navigate('/') }}>
        <GuestPortalEditor
          portal={editingPortal}
          onBack={() => setEditingPortal(null)}
        />
      </PageShell>
    )
  }

  return (
    <PageShell sidebarActiveIndex={9} onSidebarSelectItem={(i: number) => { if (i === 10) navigate('/booking-website'); else if (i !== 9) navigate('/') }}>
      <div className="flex-1 bg-white rounded-xl flex flex-col min-h-0 overflow-hidden border border-[#eceef2]">
        {wizardActive ? (
          <GuestHubWizardShell
            onExit={() => setWizardActive(false)}
            onComplete={handleWizardComplete}
          />
        ) : variant === 'tabs' ? (
          <GuestHubTabsLayout {...sharedProps} />
        ) : (
          <GuestHubPanelLayout {...sharedProps} />
        )}
      </div>

      {/* Layout toggle FAB */}
      {!wizardActive && (
        <button
          onClick={() => setVariant(v => v === 'tabs' ? 'panel' : 'tabs')}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-[#e9eaeb] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#414651] shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:bg-[#f9fafb] transition-colors"
        >
          {variant === 'tabs' ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/>
              </svg>
              Panel view
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
              </svg>
              Tab view
            </>
          )}
        </button>
      )}
    </PageShell>
  )
}
