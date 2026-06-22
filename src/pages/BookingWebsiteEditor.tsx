import { useState, useRef, useEffect } from 'react'
import {
  ArrowLeft,
  Save01,
  Rocket01,
  List,
  DotsVertical,
  Translate01,
  EyeOff,
  CheckCircle,
  XCircle,
  Edit03,
  Trash01,
} from '@untitled-ui/icons-react'
import { Button, Checkbox } from '@/components/ui'
import { cn } from '@/lib/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

type BWStatus = 'Published' | 'Draft'

export type BookingWebsite = {
  id: string
  name: string
  status: BWStatus
  website: string | null
  listings: number
  lastPublished: string | null
}

// ─── Shared primitives (mirrors GuestHubPage patterns) ───────────────────────

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
        'block h-4 w-4 rounded-full bg-white shadow-[0px_1px_3px_rgba(10,13,18,0.1)] transition-transform duration-200',
        checked ? 'translate-x-4' : 'translate-x-0'
      )} />
    </button>
  )
}

function UploadDropzone({ hint }: { hint: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#d5d7da] bg-white px-6 py-5 cursor-pointer hover:bg-[#fafafa] transition-colors">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d5d7da] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.05)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-[#535862]">
          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
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

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-5 shrink-0 w-full">
      <p className="text-[16px] font-semibold leading-6 text-[#181d27]">{title}</p>
      <div className="h-px bg-[#e9eaeb]" />
    </div>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 items-start">
      <span className="w-[200px] shrink-0 text-[14px] leading-5 text-[#535862] pt-0.5">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function BWStatusBadge({ status }: { status: BWStatus }) {
  if (status === 'Published') return (
    <span className="inline-flex items-center rounded-full border border-[#abefc6] bg-[#ecfcf2] px-2.5 py-0.5 text-[12px] font-medium leading-[18px] text-[#057647] whitespace-nowrap">
      Published
    </span>
  )
  return (
    <span className="inline-flex items-center rounded-full border border-[#d0d5dd] bg-white px-2.5 py-0.5 text-[12px] font-medium leading-[18px] text-[#414651] whitespace-nowrap">
      Draft
    </span>
  )
}

// ─── Left nav ─────────────────────────────────────────────────────────────────

function IconLayout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
    </svg>
  )
}
function IconPages() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
function IconTranslate() {
  return <Translate01 width={18} height={18} />
}
function IconScript() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  )
}
function ChevDown({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={cn('shrink-0 transition-transform duration-150', open ? 'rotate-180' : '')}>
      <path d="M6 9l6 6 6-6"/>
    </svg>
  )
}

type NavItem =
  | { type: 'link';  id: string; label: string; icon: React.ReactNode }
  | { type: 'group'; id: string; label: string; icon: React.ReactNode; children: { id: string; label: string }[] }

const BW_NAV: NavItem[] = [
  { type: 'link',  id: 'design',          label: 'Design',           icon: <IconLayout /> },
  { type: 'link',  id: 'listings',        label: 'Listings',         icon: <List width={18} height={18} /> },
  { type: 'group', id: 'pages',           label: 'Pages',            icon: <IconPages />,   children: [
    { id: 'pages-home', label: 'Home' },
    { id: 'pages-listing', label: 'Listing page' },
    { id: 'pages-about', label: 'About' },
    { id: 'pages-contact', label: 'Contact' },
  ]},
  { type: 'group', id: 'settings',        label: 'Settings',         icon: <IconSettings />, children: [
    { id: 'settings-domain', label: 'Domain' },
    { id: 'settings-seo', label: 'SEO' },
    { id: 'settings-analytics', label: 'Analytics' },
  ]},
  { type: 'group', id: 'translations',    label: 'Translations',     icon: <IconTranslate />, children: [
    { id: 'translations-en', label: 'English' },
    { id: 'translations-fr', label: 'French' },
  ]},
  { type: 'group', id: 'scripts-widgets', label: 'Scripts & Widgets', icon: <IconScript />,  children: [
    { id: 'scripts-custom', label: 'Custom scripts' },
    { id: 'scripts-chat', label: 'Chat widget' },
  ]},
]

function BWLeftNav({ activeId, onSelect, listingsVariant, onToggleVariant }: {
  activeId: string
  onSelect: (id: string) => void
  listingsVariant: 'A' | 'B' | 'C'
  onToggleVariant: (v: 'A' | 'B' | 'C') => void
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (id: string) => setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <aside className="w-[236px] shrink-0 overflow-y-auto border-r border-[#e9eaeb] px-1 py-4 flex flex-col">
      <nav className="flex-1 space-y-0.5">
        {BW_NAV.map(item => {
          if (item.type === 'link') {
            const active = activeId === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors',
                  active ? 'bg-[#f6f9fc] text-[#252b37]' : 'text-[#414651] hover:bg-[#f6f9fc]'
                )}
              >
                <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center', active ? 'text-[#414651]' : 'text-[#98a2b3]')}>
                  {item.icon}
                </span>
                <span className="flex-1 text-[14px] font-medium leading-5">{item.label}</span>
              </button>
            )
          }

          const isOpen = !!openGroups[item.id]
          const anyChildActive = item.children.some(c => c.id === activeId)
          const groupActive = anyChildActive

          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => toggleGroup(item.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors',
                  groupActive ? 'text-[#252b37]' : 'text-[#414651] hover:bg-[#f6f9fc]'
                )}
              >
                <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center', groupActive ? 'text-[#414651]' : 'text-[#98a2b3]')}>
                  {item.icon}
                </span>
                <span className="flex-1 text-[14px] font-medium leading-5">{item.label}</span>
                <ChevDown open={isOpen} />
              </button>
              {isOpen && (
                <div className="ml-[28px] space-y-0.5 pt-0.5">
                  {item.children.map(child => {
                    const active = activeId === child.id
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => onSelect(child.id)}
                        className={cn(
                          'flex w-full items-center rounded-md px-3 py-1.5 text-left text-[13px] transition-colors',
                          active ? 'bg-[#f6f9fc] font-medium text-[#252b37]' : 'text-[#667085] hover:bg-[#f6f9fc]'
                        )}
                      >
                        {child.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      {false && activeId === 'listings' && (
        <div className="px-3 pt-4 pb-1 border-t border-[#f2f4f7] mt-4 shrink-0">
          <div className="flex w-full items-center justify-between rounded-lg border border-[#e9eaeb] bg-white px-3 py-2">
            <span className="text-[12px] text-[#98a2b3]">Categories variant</span>
            <div className="flex items-center gap-1">
              {(['A', 'B', 'C'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onToggleVariant(v)}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded border text-[11px] font-semibold transition-colors',
                    listingsVariant === v
                      ? 'border-[#d0d5dd] bg-[#f9fafb] text-[#344054] shadow-[0_1px_2px_rgba(16,24,40,0.05)]'
                      : 'border-transparent text-[#c8cdd5] hover:text-[#98a2b3]'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

// ─── Design section content ───────────────────────────────────────────────────

function DesignSection() {
  const [darken, setDarken] = useState(false)
  const [primaryColor, setPrimaryColor]   = useState('#181d27')
  const [secondaryColor, setSecondaryColor] = useState('#1570ef')

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-[18px] font-semibold text-[#101828]">Design</h3>
      <div className="h-px bg-[#e9eaeb]" />

      {/* Background image/video */}
      <SectionDivider title="Background image/video" />

      <FormRow label="Image">
        <UploadDropzone hint="SVG, PNG, JPG or GIF (max. 800×400px)" />
      </FormRow>

      <div className="h-px bg-[#e9eaeb]" />

      <FormRow label="Darken to highlight search bar">
        <div className="pt-0.5">
          <DesignToggle checked={darken} onChange={setDarken} />
        </div>
      </FormRow>

      <div className="h-px bg-[#e9eaeb]" />

      {/* Colors */}
      <SectionDivider title="Colors" />

      <FormRow label="Primary color">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg border border-[#d0d5dd] shadow-sm cursor-pointer"
            style={{ background: primaryColor }}
          />
          <input
            type="text"
            value={primaryColor}
            onChange={e => setPrimaryColor(e.target.value)}
            className="w-[110px] rounded-lg border border-[#d0d5dd] px-3 py-2 text-[13px] font-mono text-[#344054] shadow-sm focus:border-[#15b8b0] transition-colors"
          />
        </div>
      </FormRow>

      <div className="h-px bg-[#e9eaeb]" />

      <FormRow label="Secondary color">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg border border-[#d0d5dd] shadow-sm cursor-pointer"
            style={{ background: secondaryColor }}
          />
          <input
            type="text"
            value={secondaryColor}
            onChange={e => setSecondaryColor(e.target.value)}
            className="w-[110px] rounded-lg border border-[#d0d5dd] px-3 py-2 text-[13px] font-mono text-[#344054] shadow-sm focus:border-[#15b8b0] transition-colors"
          />
        </div>
      </FormRow>
    </div>
  )
}

// ─── Useberry task constants ──────────────────────────────────────────────────
// Sea view listings (10)
const SEA_VIEW_IDS = ['2', '3', '9', '10', '16', '19', '21', '24', '33', '39']
// 3 named (non-sea-view) used in task 3 starting state
const TASK_NAMED_IDS = ['1', '7', '13']
// Tasks 2 & 3: 3 named + 10 sea view = 13 total
const TASK_2_3_IDS = [...TASK_NAMED_IDS, ...SEA_VIEW_IDS]
// Task 4: 8 listings — looks like 5 were already removed from the 13.
// Uses '19' instead of '10' (Sunset Terrace) so all 9 Italy listings are free to add.
const TASK_4_IDS = ['1', '7', '13', '2', '3', '9', '16', '19']

// ─── Mock listing data ────────────────────────────────────────────────────────

const MOCK_LISTINGS_DATA = [
  { id: '1',  listingId: 81069234, location: 'Madrid, ES',       name: 'Travel Innovations',       img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=80&h=80&fit=crop', tags: [{ label: 'City Center', color: 'yellow' }, { label: 'Multi-units', color: 'purple' }], status: 'Live' },
  { id: '2',  listingId: 81070481, location: 'Barcelona, ES',    name: "Varduhi's Booking Oasis",  img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=80&h=80&fit=crop', tags: [{ label: 'Sea view', color: 'teal' }, { label: 'Multi-units', color: 'purple' }], status: 'Live' },
  { id: '3',  listingId: 81071028, location: 'Marbella, ES',     name: 'Beachfront Villa',          img: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=80&h=80&fit=crop', tags: [{ label: 'Beachfront', color: 'teal' }, { label: 'Luxury', color: 'indigo' }, { label: 'Sea view', color: 'teal' }], status: 'Live' },
  { id: '4',  listingId: 81071029, location: 'Amsterdam, NL',    name: 'Modern Studio',             img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=80&h=80&fit=crop', tags: [{ label: 'Multi-units', color: 'purple' }, { label: 'Family Friendly', color: 'pink' }], status: 'Live' },
  { id: '5',  listingId: 81072145, location: 'Florence, IT',     name: 'Cozy Cottage',              img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=80&h=80&fit=crop', tags: [{ label: 'Pet Friendly', color: 'green' }, { label: 'Mountain View', color: 'gray' }], status: 'Draft' },
  { id: '6',  listingId: 81073391, location: 'Mallorca, ES',     name: 'Beachfront Bungalow',       img: 'https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?w=80&h=80&fit=crop', tags: [{ label: 'Beachfront', color: 'teal' }, { label: 'Family Friendly', color: 'pink' }], status: 'Live' },
  { id: '7',  listingId: 81074582, location: 'London, GB',       name: 'Urban Loft',                img: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=80&h=80&fit=crop', tags: [{ label: 'City Center', color: 'yellow' }, { label: 'Multi-units', color: 'purple' }], status: 'Live' },
  { id: '8',  listingId: 81075039, location: 'Asturias, ES',     name: 'Mountain Retreat',          img: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=80&h=80&fit=crop', tags: [{ label: 'Mountain View', color: 'gray' }, { label: 'Pet Friendly', color: 'green' }], status: 'Live' },
  { id: '9',  listingId: 81075902, location: 'Porto, PT',        name: 'Harbor Suite',              img: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=80&h=80&fit=crop', tags: [{ label: 'Sea view', color: 'teal' }, { label: 'Luxury', color: 'indigo' }], status: 'Draft' },
  { id: '10', listingId: 81076431, location: 'Amalfi, IT',       name: 'Sunset Terrace',            img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=80&h=80&fit=crop', tags: [{ label: 'Sea view', color: 'teal' }, { label: 'Luxury', color: 'indigo' }], status: 'Live' },
  { id: '11', listingId: 81077200, location: 'Seville, ES',      name: 'The Garden Flat',           img: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=80&h=80&fit=crop', tags: [{ label: 'Pet Friendly', color: 'green' }, { label: 'City Center', color: 'yellow' }], status: 'Live' },
  { id: '12', listingId: 81077841, location: 'Interlaken, CH',   name: 'Lakeside Cabin',            img: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=80&h=80&fit=crop', tags: [{ label: 'Mountain View', color: 'gray' }, { label: 'Family Friendly', color: 'pink' }], status: 'Draft' },
  { id: '13', listingId: 81078554, location: 'Paris, FR',        name: 'Rooftop Penthouse',         img: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=80&h=80&fit=crop', tags: [{ label: 'City Center', color: 'yellow' }, { label: 'Luxury', color: 'indigo' }, { label: 'Multi-units', color: 'purple' }, { label: 'Family Friendly', color: 'pink' }], status: 'Live' },
  { id: '14', listingId: 81079012, location: 'Tuscany, IT',      name: 'Olive Grove Villa',         img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=80&h=80&fit=crop', tags: [{ label: 'Family Friendly', color: 'pink' }, { label: 'Pet Friendly', color: 'green' }, { label: 'Mountain View', color: 'gray' }], status: 'Live' },
  { id: '15', listingId: 81079483, location: 'Ibiza, ES',        name: 'The Blue Door',             img: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=80&h=80&fit=crop', tags: [{ label: 'Beachfront', color: 'teal' }, { label: 'City Center', color: 'yellow' }], status: 'Live' },
  { id: '16', listingId: 81080124, location: 'Santorini, GR',    name: 'Cliffside Escape',          img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=80&h=80&fit=crop', tags: [{ label: 'Sea view', color: 'teal' }, { label: 'Luxury', color: 'indigo' }], status: 'Live' },
  { id: '17', listingId: 81080671, location: 'New York, US',     name: 'Soho Studio',               img: 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=80&h=80&fit=crop', tags: [{ label: 'City Center', color: 'yellow' }, { label: 'Multi-units', color: 'purple' }], status: 'Live' },
  { id: '18', listingId: 81081294, location: 'Siena, IT',        name: 'Tuscan Farmhouse',          img: 'https://images.unsplash.com/photo-1557177324-56c542165309?w=80&h=80&fit=crop', tags: [{ label: 'Pet Friendly', color: 'green' }, { label: 'Mountain View', color: 'gray' }], status: 'Live' },
  { id: '19', listingId: 81081900, location: 'Monaco, MC',       name: 'The Grand Suite',           img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=80&h=80&fit=crop', tags: [{ label: 'Luxury', color: 'indigo' }, { label: 'Sea view', color: 'teal' }], status: 'Live' },
  { id: '20', listingId: 81082543, location: 'Tenerife, ES',     name: 'Palm View Apartment',       img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=80&h=80&fit=crop', tags: [{ label: 'Beachfront', color: 'teal' }, { label: 'Family Friendly', color: 'pink' }], status: 'Live' },
  { id: '21', listingId: 81083017, location: 'Lisbon, PT',       name: "Fisherman's Cottage",       img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=80&h=80&fit=crop', tags: [{ label: 'Sea view', color: 'teal' }, { label: 'Pet Friendly', color: 'green' }], status: 'Live' },
  { id: '22', listingId: 81083642, location: 'Dubai, AE',        name: 'Skyline Penthouse',         img: 'https://images.unsplash.com/photo-1600607687939-7b37c73a2cd7?w=80&h=80&fit=crop', tags: [{ label: 'City Center', color: 'yellow' }, { label: 'Luxury', color: 'indigo' }, { label: 'Multi-units', color: 'purple' }, { label: 'Pet Friendly', color: 'green' }], status: 'Live' },
  { id: '23', listingId: 81084205, location: 'Barolo, IT',       name: 'Vineyard Guest House',      img: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=80&h=80&fit=crop', tags: [{ label: 'Mountain View', color: 'gray' }, { label: 'Pet Friendly', color: 'green' }], status: 'Live' },
  { id: '24', listingId: 81084801, location: 'Costa Brava, ES',  name: 'Seaside Retreat',           img: 'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=80&h=80&fit=crop', tags: [{ label: 'Beachfront', color: 'teal' }, { label: 'Sea view', color: 'teal' }], status: 'Live' },
  { id: '25', listingId: 81085392, location: 'Bavaria, DE',      name: 'The Forest Hideaway',       img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=80&h=80&fit=crop', tags: [{ label: 'Mountain View', color: 'gray' }, { label: 'Pet Friendly', color: 'green' }], status: 'Live' },
  { id: '26', listingId: 81085941, location: 'Nerja, ES',        name: 'Casa Miramar',              img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=80&h=80&fit=crop', tags: [{ label: 'Beachfront', color: 'teal' }], status: 'Live' },
  { id: '27', listingId: 81086504, location: 'Rome, IT',         name: 'Cobblestone Apartment',     img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=80&h=80&fit=crop', tags: [{ label: 'City Center', color: 'yellow' }, { label: 'Luxury', color: 'indigo' }], status: 'Live' },
  { id: '28', listingId: 81087123, location: 'Provence, FR',     name: 'The Old Mill House',        img: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=80&h=80&fit=crop', tags: [{ label: 'Mountain View', color: 'gray' }, { label: 'Family Friendly', color: 'pink' }], status: 'Live' },
  { id: '29', listingId: 81087688, location: 'Marrakech, MA',    name: 'Desert Bloom Villa',        img: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=80&h=80&fit=crop', tags: [{ label: 'Luxury', color: 'indigo' }, { label: 'Pet Friendly', color: 'green' }], status: 'Live' },
  { id: '30', listingId: 81088291, location: 'Amsterdam, NL',    name: 'Riverside Studio',          img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=80&h=80&fit=crop', tags: [{ label: 'City Center', color: 'yellow' }, { label: 'Multi-units', color: 'purple' }], status: 'Live' },
  { id: '31', listingId: 81088840, location: 'Bilbao, ES',       name: 'Terraced Townhouse',        img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=80&h=80&fit=crop', tags: [{ label: 'Family Friendly', color: 'pink' }, { label: 'City Center', color: 'yellow' }], status: 'Live' },
  { id: '32', listingId: 81089411, location: 'Lake Como, IT',    name: 'Hilltop Villa',             img: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=80&h=80&fit=crop', tags: [{ label: 'Mountain View', color: 'gray' }, { label: 'Luxury', color: 'indigo' }], status: 'Live' },
  { id: '33', listingId: 81089976, location: 'Cornwall, GB',     name: 'The Lighthouse Room',       img: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=80&h=80&fit=crop', tags: [{ label: 'Sea view', color: 'teal' }, { label: 'Beachfront', color: 'teal' }], status: 'Live' },
  { id: '34', listingId: 81090523, location: 'Granada, ES',      name: 'Secret Garden Suite',       img: 'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=80&h=80&fit=crop', tags: [{ label: 'Pet Friendly', color: 'green' }, { label: 'Mountain View', color: 'gray' }], status: 'Live' },
  { id: '35', listingId: 81091088, location: 'Bergen, NO',       name: 'Nordic Cabin',              img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=80&h=80&fit=crop', tags: [{ label: 'Mountain View', color: 'gray' }, { label: 'Family Friendly', color: 'pink' }, { label: 'Pet Friendly', color: 'green' }], status: 'Live' },
  { id: '36', listingId: 81091657, location: 'Venice, IT',       name: 'Canal View Studio',         img: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=80&h=80&fit=crop', tags: [{ label: 'City Center', color: 'yellow' }, { label: 'Luxury', color: 'indigo' }], status: 'Live' },
  { id: '37', listingId: 81092218, location: 'Cannes, FR',       name: 'The Pink Palace',           img: 'https://images.unsplash.com/photo-1560185007-d554ab56d6f8?w=80&h=80&fit=crop', tags: [{ label: 'Luxury', color: 'indigo' }, { label: 'Beachfront', color: 'teal' }], status: 'Live' },
  { id: '38', listingId: 81092779, location: 'Kyoto, JP',        name: 'Zen Garden House',          img: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=80&h=80&fit=crop', tags: [{ label: 'Pet Friendly', color: 'green' }, { label: 'Multi-units', color: 'purple' }], status: 'Live' },
  { id: '39', listingId: 81093340, location: 'Dubrovnik, HR',    name: 'Bay View Bungalow',         img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=80&h=80&fit=crop', tags: [{ label: 'Sea view', color: 'teal' }, { label: 'Family Friendly', color: 'pink' }], status: 'Live' },
  { id: '40', listingId: 81093901, location: 'Sardinia, IT',     name: 'The Coral Suite',           img: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=80&h=80&fit=crop', tags: [{ label: 'Beachfront', color: 'teal' }, { label: 'Luxury', color: 'indigo' }], status: 'Live' },
  { id: '41', listingId: 81094462, location: 'Alajuela, CR',     name: 'Treetop Retreat',           img: 'https://images.unsplash.com/photo-1531971589569-0d9370cbe1e5?w=80&h=80&fit=crop', tags: [{ label: 'Mountain View', color: 'gray' }, { label: 'Pet Friendly', color: 'green' }], status: 'Live' },
  { id: '42', listingId: 81095021, location: 'Menorca, ES',      name: 'Whitewashed Farmhouse',     img: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=80&h=80&fit=crop', tags: [{ label: 'Beachfront', color: 'teal' }, { label: 'Family Friendly', color: 'pink' }], status: 'Live' },
  { id: '43', listingId: 81095582, location: 'Berlin, DE',       name: 'Downtown Loft',             img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=80&h=80&fit=crop', tags: [{ label: 'City Center', color: 'yellow' }, { label: 'Multi-units', color: 'purple' }], status: 'Live' },
]

const TAG_COLORS: Record<string, string> = {
  blue:   'border-[#b2ddff] bg-[#eff8ff] text-[#175cd3]',
  teal:   'border-[#99f6e0] bg-[#f0fdf9] text-[#107569]',
  purple: 'border-[#d9d6fe] bg-[#f4f3ff] text-[#5925dc]',
  pink:   'border-[#fcceee] bg-[#fff0f9] text-[#c11574]',
  orange: 'border-[#fddcab] bg-[#fff6ed] text-[#b93815]',
  gray:   'border-[#d0d5dd] bg-[#f9fafb] text-[#344054]',
  green:  'border-[#abefc6] bg-[#ecfdf3] text-[#067647]',
  yellow: 'border-[#fedf89] bg-[#fffaeb] text-[#b54708]',
  indigo: 'border-[#c7d7fe] bg-[#eef4ff] text-[#3538cd]',
}

function TagPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center shrink-0 bg-white border border-[#d5d7da] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] rounded-full px-1.5 py-[1px] text-[11px] font-medium text-[#414651] whitespace-nowrap leading-tight">
      {label}
    </span>
  )
}

// Build label→color map from mock data (used by modal tag filter chips)
const TAG_LABEL_COLOR: Record<string, string> = {}
MOCK_LISTINGS_DATA.forEach(l => l.tags.forEach(t => { TAG_LABEL_COLOR[t.label] = t.color }))
const ALL_TAG_LABELS = [...new Set(MOCK_LISTINGS_DATA.flatMap(l => l.tags.map(t => t.label)))]

// Country helpers — derived from ISO country code in location string ("Madrid, ES" → "Spain")
const COUNTRY_CODE_NAME: Record<string, string> = {
  ES: 'Spain', IT: 'Italy', PT: 'Portugal', GB: 'United Kingdom',
  FR: 'France', GR: 'Greece', US: 'United States', CH: 'Switzerland',
  DE: 'Germany', NL: 'Netherlands', MC: 'Monaco', AE: 'UAE',
  MA: 'Morocco', NO: 'Norway', HR: 'Croatia', JP: 'Japan', CR: 'Costa Rica',
}
function getCountry(location: string): string {
  const lastComma = location.lastIndexOf(', ')
  const code = lastComma >= 0 ? location.slice(lastComma + 2) : location
  return COUNTRY_CODE_NAME[code] ?? code
}
function getCity(location: string): string {
  const lastComma = location.lastIndexOf(', ')
  return lastComma >= 0 ? location.slice(0, lastComma) : location
}

type ActiveFilters = { countries: Set<string>; cities: Set<string>; tags: Set<string> }
const EMPTY_FILTERS: ActiveFilters = { countries: new Set(), cities: new Set(), tags: new Set() }
const ALL_CITIES = [...new Set(MOCK_LISTINGS_DATA.map(l => l.location))].sort((a, b) => a.localeCompare(b))
const ALL_COUNTRIES = [...new Set(MOCK_LISTINGS_DATA.map(l => getCountry(l.location)))].sort((a, b) => a.localeCompare(b))

function FilterDropdown({
  applied,
  onApply,
  availableCountries = ALL_COUNTRIES,
  availableCities = ALL_CITIES,
  availableTags = ALL_TAG_LABELS,
  countryCounts = {},
  cityCounts = {},
  tagCounts = {},
}: {
  applied: ActiveFilters
  onApply: (f: ActiveFilters) => void
  availableCountries?: string[]
  availableCities?: string[]
  availableTags?: string[]
  countryCounts?: Record<string, number>
  cityCounts?: Record<string, number>
  tagCounts?: Record<string, number>
}) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<'country' | 'city' | 'tags'>('country')
  const [draft, setDraft] = useState<ActiveFilters>({ countries: new Set(), cities: new Set(), tags: new Set() })
  const [itemSearch, setItemSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const handleOpen = () => {
    setDraft({ countries: new Set(applied.countries), cities: new Set(applied.cities), tags: new Set(applied.tags) })
    setItemSearch('')
    setCategory('country')
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const items = (category === 'country' ? availableCountries : category === 'city' ? availableCities : availableTags)
    .filter(i => i.toLowerCase().includes(itemSearch.toLowerCase()))

  const toggle = (item: string) => {
    const key = category === 'country' ? 'countries' : category === 'city' ? 'cities' : 'tags'
    setDraft(prev => {
      const next = new Set(prev[key])
      next.has(item) ? next.delete(item) : next.add(item)
      return { ...prev, [key]: next }
    })
  }

  const isSelected = (item: string) =>
    category === 'country' ? draft.countries.has(item) : category === 'city' ? draft.cities.has(item) : draft.tags.has(item)

  const getCount = (item: string) =>
    category === 'country' ? countryCounts[item] : category === 'city' ? cityCounts[item] : tagCounts[item]

  const appliedCount = applied.countries.size + applied.cities.size + applied.tags.size

  const handleClearAll = () => {
    onApply({ countries: new Set(), cities: new Set(), tags: new Set() })
    setOpen(false)
  }

  const handleApply = () => {
    onApply({ countries: new Set(draft.countries), cities: new Set(draft.cities), tags: new Set(draft.tags) })
    setOpen(false)
  }

  const CAT_LABELS: Record<'country' | 'city' | 'tags', string> = { country: 'Country', city: 'City', tags: 'Tags' }
  const selectedCountPerCat = { country: draft.countries.size, city: draft.cities.size, tags: draft.tags.size }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={open ? () => setOpen(false) : handleOpen}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/>
          <line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/>
          <line x1="14" y1="2" x2="14" y2="6"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="16" y1="18" x2="16" y2="22"/>
        </svg>
        Filter
      </Button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-30 w-[420px] rounded-xl border border-[#e9eaeb] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.1)] overflow-hidden">
          <div className="flex h-[280px]">
            <div className="w-[130px] shrink-0 border-r border-[#e9eaeb] py-1">
              {(['country', 'city', 'tags'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setCategory(cat); setItemSearch('') }}
                  className={cn(
                    'flex w-full items-center justify-between px-4 py-2.5 text-[13px] transition-colors border-l-2',
                    category === cat
                      ? 'border-l-[#344054] bg-[#f9fafb] font-semibold text-[#101828]'
                      : 'border-l-transparent text-[#535862] hover:bg-[#fafafa]'
                  )}
                >
                  <span>{CAT_LABELS[cat]}</span>
                  {selectedCountPerCat[cat] > 0 && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#344054] text-[10px] font-semibold text-white px-0.5">
                      {selectedCountPerCat[cat]}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex flex-1 flex-col min-w-0">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#e9eaeb] shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#98a2b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  value={itemSearch}
                  onChange={e => setItemSearch(e.target.value)}
                  placeholder="Search"
                  className="flex-1 text-[13px] text-[#344054] placeholder-[#98a2b3] outline-none bg-transparent"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {items.map(item => {
                  const count = getCount(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggle(item)}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-3 py-2.5 text-[13px] text-left transition-colors',
                        isSelected(item) ? 'bg-[#f9fafb] font-medium text-[#101828]' : 'text-[#344054] hover:bg-[#fafafa]'
                      )}
                    >
                      {isSelected(item)
                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#344054]"><path d="M20 6L9 17l-5-5"/></svg>
                        : <span className="w-3 shrink-0" />
                      }
                      <span className="flex-1">{item}</span>
                      {count !== undefined && (
                        <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#f2f4f7] px-1 text-[10px] font-medium text-[#667085]">
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
                {items.length === 0 && (
                  <p className="px-3 py-4 text-[13px] text-[#98a2b3]">No results</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 border-t border-[#e9eaeb]">
            <button type="button" onClick={handleClearAll} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#d0d5dd] bg-white px-3 py-1.5 text-[13px] font-medium text-[#344054] hover:bg-[#f9fafb] transition-colors shadow-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
              </svg>
              Clear all
            </button>
            <button type="button" onClick={handleApply} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#344054] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#101828] transition-colors shadow-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
              </svg>
              Apply filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ListingSelectorModal({ onClose, onAdd, excludeIds = [] }: {
  onClose: () => void
  onAdd: (ids: string[]) => void
  excludeIds?: string[]
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS)
  const [locationSort, setLocationSort] = useState<'none' | 'asc' | 'desc'>('none')
  const cycleLocationSort = () => setLocationSort(s => s === 'none' ? 'asc' : s === 'asc' ? 'desc' : 'none')

  const pool = MOCK_LISTINGS_DATA.filter(l => !excludeIds.includes(l.id))

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const poolCountries = [...new Set(pool.map(l => getCountry(l.location)))].sort((a, b) => a.localeCompare(b))
  const poolCities = [...new Set(pool.map(l => l.location))].sort((a, b) => a.localeCompare(b))
  const poolTags = [...new Set(pool.flatMap(l => l.tags.map(t => t.label)))].sort()
  const poolCountryCounts = Object.fromEntries(poolCountries.map(c => [c, pool.filter(l => getCountry(l.location) === c).length]))
  const poolCityCounts = Object.fromEntries(poolCities.map(loc => [loc, pool.filter(l => l.location === loc).length]))
  const poolTagCounts = Object.fromEntries(poolTags.map(tag => [tag, pool.filter(l => l.tags.some(t => t.label === tag)).length]))

  const filtered = pool
    .filter(l => {
      const q = search.toLowerCase()
      const matchSearch = !q || l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || l.location.toLowerCase().includes(q) || getCountry(l.location).toLowerCase().includes(q) || getCity(l.location).toLowerCase().includes(q) || l.tags.some(t => t.label.toLowerCase().includes(q))
      const matchCountry = filters.countries.size === 0 || filters.countries.has(getCountry(l.location))
      const matchCity = filters.cities.size === 0 || filters.cities.has(l.location)
      const matchTag = filters.tags.size === 0 || [...filters.tags].every(tag => l.tags.some(t => t.label === tag))
      return matchSearch && matchCountry && matchCity && matchTag
    })
    .sort((a, b) => {
      if (locationSort === 'none') return 0
      const cmp = a.location.localeCompare(b.location)
      return locationSort === 'asc' ? cmp : -cmp
    })

  const allFilteredSelected = filtered.length > 0 && filtered.every(l => selected.has(l.id))
  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(l => next.delete(l.id)); return next })
    } else {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(l => next.add(l.id)); return next })
    }
  }

  const addCount = selected.size
  const idsToAdd = [...selected]

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
      <div className="w-[860px] max-h-[82vh] bg-white rounded-2xl flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.18)]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-3 shrink-0">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[18px] font-semibold text-[#101828]">Include listings</h2>
            <span className="text-[18px] font-semibold text-[#101828]">({filtered.length})</span>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#98a2b3] hover:text-[#667085] hover:bg-[#f9fafb] transition-colors mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Filter + search toolbar */}
        <div className="flex items-center justify-between px-6 py-3 gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <FilterDropdown applied={filters} onApply={setFilters} availableCountries={poolCountries} availableCities={poolCities} availableTags={poolTags} countryCounts={poolCountryCounts} cityCounts={poolCityCounts} tagCounts={poolTagCounts} />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#d0d5dd] bg-white px-3 py-1.5 w-52">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#98a2b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter name"
              className="flex-1 text-[13px] text-[#344054] placeholder-[#98a2b3] outline-none bg-transparent" />
          </div>
        </div>

        <div className="h-px bg-[#e9eaeb] shrink-0" />

        {/* Table — outer scrolls both axes; inner sized to content width */}
        <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0">
          <div className="min-w-max">
            {/* Header */}
            <div className="grid grid-cols-[20px_220px_110px_130px_auto] items-center gap-3 px-6 py-2.5 border-b border-[#e9eaeb] bg-[#fafafa] sticky top-0 z-10">
              <Checkbox
                checked={allFilteredSelected}
                isIndeterminate={selected.size > 0 && !allFilteredSelected}
                onChange={toggleAll}
              />
              <span className="text-[12px] font-semibold text-[#414651]">Name</span>
              <span className="text-[12px] font-semibold text-[#414651]">Country</span>
              <button type="button" onClick={cycleLocationSort} className={cn('flex items-center gap-1 text-[12px] font-semibold transition-colors', locationSort !== 'none' ? 'text-[#344054]' : 'text-[#414651] hover:text-[#344054]')}>
                City
                {locationSort === 'none' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 shrink-0"><path d="M12 19V5M5 12l7-7 7 7"/></svg>}
                {locationSort === 'asc'  && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M12 19V5M5 12l7-7 7 7"/></svg>}
                {locationSort === 'desc' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M12 5v14M5 12l7 7 7-7"/></svg>}
              </button>
              <span className="text-[12px] font-semibold text-[#414651]">Tags</span>
            </div>

            {/* Rows */}
            {filtered.map((listing, i) => (
              <div
                key={listing.id}
                onClick={() => toggle(listing.id)}
                className={cn(
                  'grid grid-cols-[20px_220px_110px_130px_auto] items-center gap-3 px-6 py-4 cursor-pointer transition-colors',
                  i < filtered.length - 1 ? 'border-b border-[#f2f4f7]' : '',
                  selected.has(listing.id) ? 'bg-[#f8f9fc]' : 'hover:bg-[#fafafa]'
                )}
              >
                <span onClick={e => e.stopPropagation()} className="self-center flex"><Checkbox checked={selected.has(listing.id)} onChange={() => toggle(listing.id)} /></span>
                <div className="flex items-center gap-3 min-w-0">
                  <img src={listing.img} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `https://picsum.photos/seed/${listing.id}/80/80` }} />
                  <span className="text-[14px] font-medium text-[#181d27] truncate">{listing.name}</span>
                </div>
                <span className="text-[13px] text-[#535862]">{getCountry(listing.location)}</span>
                <span className="text-[13px] text-[#535862]">{getCity(listing.location)}</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {listing.tags.slice(0, 3).map(t => (
                    <TagPill key={t.label} label={t.label} />
                  ))}
                  {listing.tags.length > 3 && (
                    <span className="relative group/tip inline-flex items-center bg-white border border-[#d5d7da] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] rounded-full px-1.5 py-[1px] text-[11px] font-medium text-[#414651] whitespace-nowrap leading-tight cursor-default">
                      +{listing.tags.length - 3}
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tip:flex flex-col gap-0.5 rounded-lg bg-[#101828] px-2.5 py-2 shadow-lg z-50 min-w-max">
                        {listing.tags.slice(3).map(t => (
                          <span key={t.label} className="text-[11px] text-white whitespace-nowrap">{t.label}</span>
                        ))}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#101828]" />
                      </span>
                    </span>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center px-6 py-12 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[420px] h-[420px] rounded-full border border-[#f2f4f7] absolute" />
                  <div className="w-[300px] h-[300px] rounded-full border border-[#f2f4f7] absolute" />
                  <div className="w-[180px] h-[180px] rounded-full border border-[#f2f4f7] absolute" />
                </div>
                <div className="relative z-10 mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-[#e9eaeb] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.1)]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                </div>
                <p className="relative z-10 text-[15px] font-semibold text-[#101828] mb-1">
                  {pool.length === 0 ? 'All listings added' : 'No listings match the selected filters'}
                </p>
                <p className="relative z-10 text-[13px] text-[#535862] max-w-[280px] leading-snug">
                  {pool.length === 0
                    ? 'All available listings have already been added to this booking website.'
                    : 'No listings match the current combination of filters. Try adjusting your selection.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-[#e9eaeb] shrink-0" />

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={addCount === 0} onClick={() => onAdd(idsToAdd)}>
            {addCount === 0 ? 'Include listings' : `Include ${addCount} listing${addCount === 1 ? '' : 's'}`}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Categories panel ─────────────────────────────────────────────────────────

// Preset swatches matching Figma color picker design
// Row 1: primary (black/gray) family — light → medium, all pass WCAG AA with black text as background
// Row 2: secondary (deep blue) family — darkest accessible → lightest, all pass WCAG AA with black text
// Two lines of 9. Badge text is always white, so every fill must clear 3:1 against
// white (WCAG AA large text). Line 1: neutral/black shades, line 2: blue shades.
// Lightest in each (#8a93a6 ≈3.1, #2e90fa ≈3.2) still pass.
const CATEGORY_COLORS = [
  '#0c111d', '#1d2939', '#2b3648', '#344054', '#475467', '#586679', '#69768c', '#7a899f', '#8a93a6',
  '#0b1f3a', '#102a56', '#15366f', '#1a4087', '#1d4ba1', '#175cd3', '#1570ef', '#2680f6', '#2e90fa',
]

// Contrast ratio of white (#fff) text on a hex background. Threshold used = 3:1
// (WCAG AA for large/bold text; badge text qualifies). Looser than the 4.5:1 normal-text bar.
function whiteContrastRatio(hex: string): number {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return 21
  const n = parseInt(m[1], 16)
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  const L = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  return 1.05 / (L + 0.05)
}

type Category = {
  id: string
  name: string
  color: string
  listingIds: string[]
}

function CategoryForm({
  title, initialName, initialColor, submitLabel, onSubmit, onCancel, assignedListingIds, selectedIds = new Set(),
}: {
  title: string
  initialName: string
  initialColor: string
  submitLabel: string
  onSubmit: (name: string, color: string, removedIds?: string[], addedIds?: string[]) => void
  onCancel: () => void
  assignedListingIds?: string[]
  selectedIds?: Set<string>
}) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set())
  const [pendingAdditions, setPendingAdditions] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const [customHex, setCustomHex] = useState(
    CATEGORY_COLORS.includes(initialColor) ? '#1570ef' : initialColor
  )
  const isPreset = CATEGORY_COLORS.includes(color)
  const failsContrast = whiteContrastRatio(color) < 3

  useEffect(() => {
    if (!pickerOpen) return
    const handle = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [pickerOpen])

  const handleCustomHexChange = (raw: string) => {
    setCustomHex(raw)
    if (/^#[0-9A-Fa-f]{6}$/.test(raw)) setColor(raw)
  }
  const handleNativePicker = (hex: string) => { setColor(hex); setCustomHex(hex) }

  const handleSave = () => {
    onSubmit(name.trim(), color, [...pendingRemovals], pendingAdditions)
  }

  const isDirty = name.trim() !== initialName.trim() || color !== initialColor || pendingRemovals.size > 0 || pendingAdditions.length > 0

  // Only listing assignment changes are high-stakes enough to confirm.
  // Name / color edits can be left without saving silently.
  const hasListingChanges = pendingRemovals.size > 0 || pendingAdditions.length > 0
  const handleBack = () => { if (hasListingChanges) setShowDiscardConfirm(true); else onCancel() }

  const visibleListingIds = [
    ...(assignedListingIds ?? []).filter(id => !pendingRemovals.has(id)),
    ...pendingAdditions,
  ]

  return (
    <>
      <div className="w-[313px] shrink-0 rounded-xl border border-[#e9eaeb] bg-white flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e9eaeb] shrink-0">
          <Button variant="outline" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={handleBack}>
            <ArrowLeft width={14} height={14} />
          </Button>
          <h3 className="text-[14px] font-semibold text-[#101828]">{title}</h3>
        </div>
        <div className="flex flex-col gap-4 px-4 py-5 flex-1 overflow-y-auto">
          {/* Tag name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#344054]">Tag name</label>
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value.slice(0, 16))}
                maxLength={16}
                onKeyDown={e => e.key === 'Enter' && name.trim() && handleSave()}
                placeholder="e.g. Popular choice, Best value, Guest favorite"
                className="flex-1 h-8 rounded-lg border border-[#d0d5dd] px-2.5 text-[13px] text-[#344054] placeholder-[#98a2b3] outline-none focus:border-[#181d27] transition-colors"
              />
              {/* Color circle trigger + popover */}
              <div className="relative shrink-0" ref={pickerRef}>
                <button
                  type="button"
                  onClick={() => setPickerOpen(v => !v)}
                  className="flex items-center justify-center p-1.5 rounded-md hover:bg-[#f9fafb] transition-colors"
                  title="Pick colour"
                >
                  <div className={cn(
                    'w-5 h-5 shrink-0 rounded-full bg-white transition-colors flex items-center justify-center',
                    pickerOpen ? 'border-[1.5px] border-[#181d27]' : 'border-[1.5px] border-transparent hover:border-[#d5d7da]'
                  )}>
                    <div className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ background: color }} />
                  </div>
                </button>
                {pickerOpen && (
                  <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl border border-black/[0.08] shadow-[0_12px_16px_-4px_rgba(10,13,18,0.08),0_4px_6px_-2px_rgba(10,13,18,0.03),0_2px_2px_-1px_rgba(10,13,18,0.04)] p-3 flex flex-col gap-2">
                    {/* Preset swatches */}
                    <div className="grid grid-cols-9 gap-1">
                      {CATEGORY_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={cn(
                            'w-5 h-5 shrink-0 rounded-full flex items-center justify-center transition-colors',
                            color === c ? 'border-[1.5px] border-[#181d27] bg-white' : 'border-[1.5px] border-transparent'
                          )}
                        >
                          <div className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ background: c }} />
                        </button>
                      ))}
                    </div>
                    {/* Custom row */}
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-[14px] font-semibold text-[#181d27] flex-1">Custom</span>
                      <div className="flex items-center gap-2">
                        <label className={cn(
                          'w-5 h-5 shrink-0 rounded-full cursor-pointer transition-colors flex items-center justify-center',
                          !isPreset ? 'border-[1.5px] border-[#181d27] bg-white' : 'border-[1.5px] border-transparent'
                        )}>
                          <div className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ background: isPreset ? customHex : color }} />
                          <input type="color" value={isPreset ? customHex : color} onChange={e => handleNativePicker(e.target.value)} className="sr-only" />
                        </label>
                        <input
                          value={isPreset ? customHex : color}
                          onChange={e => handleCustomHexChange(e.target.value)}
                          spellCheck={false}
                          className="w-[92px] rounded-lg border border-[#d5d7da] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] px-3 py-1.5 text-[14px] text-[#181d27] outline-none focus:border-[#181d27] transition-colors"
                        />
                      </div>
                    </div>
                    {failsContrast ? (
                      <p className="text-[12px] leading-[16px] text-[#b54708]">This color is too light for white text to read clearly. Pick a darker shade.</p>
                    ) : (
                      <p className="text-[12px] text-[#667085]">The tag text is always white, so pick a shade dark enough to stay readable.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            {name.length >= 16 ? (
              <p className="text-[12px] leading-[18px] text-[#b54708]">
                Tag names can be up to 16 characters.
              </p>
            ) : failsContrast ? (
              <p className="text-[12px] leading-[18px] text-[#b54708]">
                This color is too light for white text to read clearly. Pick a darker shade.
              </p>
            ) : (
              <p className="text-[12px] leading-[18px] text-[#98a2b3]">
                Appears on top of the listing photo.
              </p>
            )}
          </div>

          {/* Assigned listings — only shown when listings exist */}
          {assignedListingIds !== undefined && visibleListingIds.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-4 border-t border-[#e9eaeb]">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-[#344054]">Assigned listings</label>
                <button type="button" onClick={() => { setPendingRemovals(new Set(visibleListingIds)); setPendingAdditions([]) }} className="text-[12px] text-[#667085] hover:text-[#344054] transition-colors">Remove all</button>
              </div>
              <div className="flex flex-col rounded-lg border border-[#e9eaeb] overflow-hidden">
                {visibleListingIds.map(id => {
                  const listing = MOCK_LISTINGS_DATA.find(l => l.id === id)
                  if (!listing) return null
                  return (
                    <div key={id} className="flex items-center gap-2 px-3 py-2 border-b border-[#f2f4f7] last:border-0 hover:bg-[#fafafa] transition-colors group">
                      <img src={listing.img} alt="" className="w-7 h-7 rounded-md object-cover shrink-0" />
                      <span className="flex-1 text-[13px] text-[#344054] truncate">{listing.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onPress={() => setPendingRemovals(prev => { const next = new Set(prev); next.add(id); return next })}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-[#e9eaeb] shrink-0">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button className="flex-1" disabled={!name.trim() || failsContrast} onClick={handleSave}>{submitLabel}</Button>
        </div>
      </div>

      {/* Confirmation modal — only shown when saving with pending removals */}
      {showAddModal && (
        <ListingSelectorModal
          onClose={() => setShowAddModal(false)}
          excludeIds={[...(assignedListingIds ?? []), ...pendingAdditions]}
          onAdd={ids => { setPendingAdditions(prev => [...new Set([...prev, ...ids])]); setShowAddModal(false) }}
        />
      )}

      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDiscardConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] w-[360px] p-6 flex flex-col gap-4 mx-4">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-[16px] font-semibold text-[#101828]">Leave without saving?</h3>
              <p className="text-[14px] leading-[20px] text-[#667085]">Your changes to this tag haven't been saved yet and will be lost.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowDiscardConfirm(false)}>Keep editing</Button>
              <Button className="flex-1" onClick={() => { setShowDiscardConfirm(false); onCancel() }}>Leave</Button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

function CategoriesPanel({
  categories,
  selectedIds,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  onAssignToCategory,
  onRemoveFromCategory,
  onRemoveListingFromCategory,
  onAddListingsToCategory,
  onToast,
  onClose,
  compact = false,
  modalMode = false,
}: {
  categories: Category[]
  selectedIds: Set<string>
  onCreateCategory: (name: string, color: string) => string
  onEditCategory: (id: string, name: string, color: string) => void
  onDeleteCategory: (id: string) => void
  onAssignToCategory: (categoryId: string) => void
  onRemoveFromCategory: (categoryId: string, listingIds: string[]) => void
  onRemoveListingFromCategory: (categoryId: string, listingId: string) => void
  onAddListingsToCategory?: (categoryId: string, ids: string[]) => void
  onToast?: (msg: string) => void
  onClose?: () => void
  compact?: boolean
  modalMode?: boolean
}) {
  const [mode, setMode] = useState<'list' | 'creating' | 'editing'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)


  const editingCat = categories.find(c => c.id === editingId)

  if (mode === 'creating') return (
    <CategoryForm
      title="New label"
      initialName=""
      initialColor={CATEGORY_COLORS[15]}
      submitLabel="Create"
      onSubmit={(name, color) => { onCreateCategory(name, color); setMode('list') }}
      onCancel={() => setMode('list')}
    />
  )

  if (mode === 'editing' && editingCat) return (
    <CategoryForm
      title="Edit tag"
      initialName={editingCat.name}
      initialColor={editingCat.color}
      submitLabel="Save changes"
      onSubmit={(name, color, removedIds = [], addedIds = []) => {
        onEditCategory(editingCat.id, name, color)
        removedIds.forEach(id => onRemoveListingFromCategory(editingCat.id, id))
        if (addedIds.length > 0) onAddListingsToCategory?.(editingCat.id, addedIds)
        if (removedIds.length > 0) onToast?.(removedIds.length === 1 ? '1 listing removed from listing label' : `${removedIds.length} listings removed from listing label`)
        setMode('list')
      }}
      onCancel={() => setMode('list')}
      assignedListingIds={editingCat.listingIds}
      selectedIds={selectedIds}
    />
  )

  const iconBtn = 'flex h-6 w-6 items-center justify-center rounded-md text-[#98a2b3] hover:text-[#667085] hover:bg-[#f2f4f7] transition-colors shrink-0'

  return (
    <div className={cn('flex flex-col overflow-hidden', modalMode ? 'flex-1' : 'w-[313px] h-full shrink-0 rounded-xl border border-[#e9eaeb] bg-white')}>
      {!modalMode && <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e9eaeb] shrink-0 sticky top-0 z-10 bg-white">
        <h3 className={cn('font-semibold text-[#414651]', compact ? 'text-[12px]' : 'text-[14px]')}>Listing labels</h3>
        <div className="flex items-center gap-2">
          {categories.length > 0 && (
            <Button variant="outline" size="sm" className={cn('gap-1', compact && 'h-7 px-2 text-[12px]')} onClick={() => setMode('creating')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              New tag
            </Button>
          )}
        </div>
      </div>}

      {/* In modal mode: show Add button in the content area when list is populated */}
      {modalMode && categories.length > 0 && (
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#e9eaeb] shrink-0">
          <span className="text-[13px] text-[#667085]">{categories.length} listing label{categories.length === 1 ? '' : 's'}</span>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setMode('creating')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            New tag
          </Button>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="flex flex-col flex-1 items-center justify-center px-4 py-6 gap-3 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[320px] h-[320px] rounded-full border border-[#f2f4f7] absolute" />
            <div className="w-[220px] h-[220px] rounded-full border border-[#f2f4f7] absolute" />
            <div className="w-[120px] h-[120px] rounded-full border border-[#f2f4f7] absolute" />
          </div>
          <div className="relative z-10 text-center">
            <p className="text-[14px] font-semibold text-[#101828]">Help guests find the right stay</p>
            <p className="text-[12px] leading-[18px] text-[#667085] mt-1">
              Group listings under labels like "Popular choice" or "Cancel anytime" so guests can browse with ease.
            </p>
          </div>
          <Button className="relative z-10" size="sm" onClick={() => setMode('creating')}>New tag</Button>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-y-auto min-h-0 pb-6">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className="group flex items-center gap-3 px-4 py-3 border-b border-[#f2f4f7] last:border-0 transition-colors hover:bg-[#fafafa]"
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-[#181d27] truncate">{cat.name}</p>
                <p className="text-[12px] text-[#667085]">
                  {cat.listingIds.length === 0 ? 'No listings yet' : `${cat.listingIds.length} listing${cat.listingIds.length > 1 ? 's' : ''}`}
                </p>
              </div>
              {selectedIds.size > 0 ? (() => {
                const selectedArr = [...selectedIds]
                const allAssigned = selectedArr.every(id => cat.listingIds.includes(id))
                return (
                  <div className="relative shrink-0 group/tip">
                    {allAssigned ? (
                      <button
                        type="button"
                        onClick={() => onRemoveFromCategory(cat.id, selectedArr)}
                        className="flex items-center justify-center h-7 w-7 rounded-lg border border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb] transition-colors shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAssignToCategory(cat.id)}
                        className="flex items-center justify-center h-7 w-7 rounded-lg border border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb] transition-colors shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                      </button>
                    )}
                  </div>
                )
              })() : (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingId(cat.id); setMode('editing') }}>
                    <Edit03 width={14} height={14} />
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => cat.listingIds.length === 0 ? onDeleteCategory(cat.id) : setPendingDeleteId(cat.id)}>
                    <Trash01 width={14} height={14} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {pendingDeleteId && (() => {
        const cat = categories.find(c => c.id === pendingDeleteId)
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
            <div className="w-[400px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden">
              <div className="px-6 pt-6 pb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1f0] border border-[#fecdca] mb-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d92d20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </div>
                <h2 className="text-[16px] font-semibold text-[#101828] mb-1.5">
                  Delete "{cat?.name}"?
                </h2>
                <p className="text-[14px] leading-[22px] text-[#535862]">
                  {cat && cat.listingIds.length > 0
                    ? `All ${cat.listingIds.length} listing${cat.listingIds.length === 1 ? '' : 's'} will be untagged. This can't be undone. The change goes live on your website once you save.`
                    : 'This tag will be removed. The change goes live on your website once you save.'
                  }
                </p>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <Button variant="outline" className="flex-1" onClick={() => setPendingDeleteId(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[#d92d20] hover:bg-[#b42318] border-[#d92d20] hover:border-[#b42318]"
                  onClick={() => { onDeleteCategory(pendingDeleteId); setPendingDeleteId(null) }}
                >
                  Delete tag
                </Button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function ListingStatusTag({ status }: { status: string }) {
  if (status === 'Live') return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#abefc6] bg-[#ecfcf2] px-2 py-0.5 text-[11px] font-medium text-[#057647] whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-[#17b26a] shrink-0" />
      Live
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d0d5dd] bg-[#f9fafb] px-2 py-0.5 text-[11px] font-medium text-[#667085] whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-[#98a2b3] shrink-0" />
      Draft
    </span>
  )
}

export function ListingsSection({ onDirty }: { onDirty?: () => void }) {
  const [state, setState] = useState<'empty' | 'loading' | 'filled'>('empty')
  const [listings, setListings] = useState<typeof MOCK_LISTINGS_DATA>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const selectedRef = useRef<Set<string>>(new Set())
  selectedRef.current = selected
  const [filter, setFilter] = useState('')
  const [statusSort, setStatusSort] = useState<'none' | 'live-first' | 'draft-first'>('none')
  const [locationSort, setLocationSort] = useState<'none' | 'asc' | 'desc'>('none')
  const cycleLocationSort = () => setLocationSort(s => s === 'none' ? 'asc' : s === 'asc' ? 'desc' : 'none')
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS)
  const [listingTab, setListingTab] = useState<'included' | 'excluded'>('included')
  const [showExcludeConfirm, setShowExcludeConfirm] = useState(false)

  const listingIdSet = new Set(listings.map(l => l.id))
  const excludedListings = MOCK_LISTINGS_DATA.filter(l => !listingIdSet.has(l.id))
  const activeListings = listingTab === 'included' ? listings : excludedListings

  // Drop stale filter values when active listing pool changes
  useEffect(() => {
    const validCountries = new Set(activeListings.map(l => getCountry(l.location)))
    const validCities = new Set(activeListings.map(l => l.location))
    const validTags = new Set(activeListings.flatMap(l => l.tags.map(t => t.label)))
    setFilters(prev => {
      const nextCountry = new Set([...prev.countries].filter(c => validCountries.has(c)))
      const nextCity = new Set([...prev.cities].filter(c => validCities.has(c)))
      const nextTag = new Set([...prev.tags].filter(t => validTags.has(t)))
      if (nextCountry.size === prev.countries.size && nextCity.size === prev.cities.size && nextTag.size === prev.tags.size) return prev
      return { countries: nextCountry, cities: nextCity, tags: nextTag }
    })
  }, [listings, listingTab]) // eslint-disable-line react-hooks/exhaustive-deps


  const [toasts, setToasts] = useState<Array<{ id: string; message: string; visible: boolean }>>([])

  const triggerToast = (msg: string) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message: msg, visible: false }])
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: true } : t))
    }))
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320)
    }, 4000)
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320)
  }
  const [addedCount, setAddedCount] = useState(0)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalExcludeIds, setModalExcludeIds] = useState<string[]>([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Categories state
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false)
  const assignDropdownRef = useRef<HTMLDivElement>(null)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [modalView, setModalView] = useState<'list' | 'add' | 'editing'>('list')
  const [modalCategoryName, setModalCategoryName] = useState('')
  const [modalCategoryColor, setModalCategoryColor] = useState('#1570ef')
  const [modalEditingCatId, setModalEditingCatId] = useState<string | null>(null)
  const [modalEditName, setModalEditName] = useState('')
  const [modalEditColor, setModalEditColor] = useState('#1570ef')

  useEffect(() => {
    if (showCategoriesModal) {
      setModalView(categories.length === 0 ? 'add' : 'list')
      setModalCategoryName(''); setModalCategoryColor('#1570ef')
      setModalEditingCatId(null); setModalEditName(''); setModalEditColor('#1570ef')
    }
  }, [showCategoriesModal])

  useEffect(() => {
    if (!assignDropdownOpen) return
    const handle = (e: MouseEvent) => {
      if (assignDropdownRef.current && !assignDropdownRef.current.contains(e.target as Node)) setAssignDropdownOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [assignDropdownOpen])
  const handleCreateCategory = (name: string, color: string) => {
    const newId = crypto.randomUUID()
    const ids = [...selectedRef.current]
    setCategories(prev => [...prev, { id: newId, name, color, listingIds: ids }])
    if (ids.length > 0) {
      setSelected(new Set())
      triggerToast(ids.length === 1 ? '1 listing added to new listing label' : `${ids.length} listings added to new listing label`)
    }
    return newId
  }
  const handleEditCategory = (id: string, name: string, color: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name, color } : c))
  }
  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id))
  }
  const handleAssignToCategory = (categoryId: string) => {
    const ids = [...selectedRef.current]
    setCategories(prev => prev.map(c => c.id === categoryId
      ? { ...c, listingIds: [...new Set([...c.listingIds, ...ids])] }
      : c
    ))
    triggerToast(ids.length === 1 ? '1 listing added to listing label' : `${ids.length} listings added to listing label`)
  }
  const handleRemoveListingFromCategory = (categoryId: string, listingId: string) => {
    setCategories(prev => prev.map(c => c.id === categoryId
      ? { ...c, listingIds: c.listingIds.filter(id => id !== listingId) }
      : c
    ))
  }
  // Creates without auto-assigning — keeps selection intact so "Tag listings" dropdown stays usable
  const handleCreateCategoryOnly = (name: string, color: string) => {
    setCategories(prev => [...prev, { id: crypto.randomUUID(), name, color, listingIds: [] }])
  }

  const handleAddAll = () => {
    setState('loading')
    setTimeout(() => {
      setState('filled')
      setListings(MOCK_LISTINGS_DATA)
      setAddedCount(MOCK_LISTINGS_DATA.length)
      triggerToast(MOCK_LISTINGS_DATA.length === 1 ? '1 listing added' : `${MOCK_LISTINGS_DATA.length} listings added`)
    }, 1200)
  }

  const handleAddSpecific = (ids: string[]) => {
    setShowModal(false)
    setState('loading')
    setTimeout(() => {
      setState('filled')
      const existingIds = new Set(listings.map(l => l.id))
      const newOnes = MOCK_LISTINGS_DATA.filter(l => ids.includes(l.id) && !existingIds.has(l.id))
      setListings(prev => [...prev, ...newOnes])
      setAddedCount(newOnes.length)
      triggerToast(newOnes.length === 1 ? '1 listing added' : `${newOnes.length} listings added`)
    }, 1200)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleRemoveSelected = () => {
    const count = selected.size
    let removedAll = false
    setListings(prev => {
      const next = prev.filter(l => !selected.has(l.id))
      if (next.length === 0) { setState('empty'); removedAll = true }
      return next
    })
    setSelected(new Set())
    setActionsOpen(false)
    triggerToast(count === 1 ? '1 listing removed' : `${count} listings removed`)
    if (!removedAll) onDirty?.()
  }

  const listingCountries = [...new Set(activeListings.map(l => getCountry(l.location)))].sort((a, b) => a.localeCompare(b))
  const listingCities = [...new Set(activeListings.map(l => l.location))].sort((a, b) => a.localeCompare(b))
  const listingTags = [...new Set(activeListings.flatMap(l => l.tags.map(t => t.label)))].sort()
  const listingCountryCounts = Object.fromEntries(listingCountries.map(c => [c, activeListings.filter(l => getCountry(l.location) === c).length]))
  const listingCityCounts = Object.fromEntries(listingCities.map(loc => [loc, activeListings.filter(l => l.location === loc).length]))
  const listingTagCounts = Object.fromEntries(listingTags.map(tag => [tag, activeListings.filter(l => l.tags.some(t => t.label === tag)).length]))

  const filtered = activeListings
    .filter(l => {
      const q = filter.toLowerCase()
      const matchName = !q || l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || l.location.toLowerCase().includes(q)
      const matchCountry = filters.countries.size === 0 || filters.countries.has(getCountry(l.location))
      const matchCity = filters.cities.size === 0 || filters.cities.has(l.location)
      const matchTag = filters.tags.size === 0 || [...filters.tags].every(tag => l.tags.some(t => t.label === tag))
      return matchName && matchCountry && matchCity && matchTag
    })
    .sort((a, b) => {
      if (locationSort !== 'none') {
        const cmp = a.location.localeCompare(b.location)
        return locationSort === 'asc' ? cmp : -cmp
      }
      if (statusSort === 'none') return 0
      if (statusSort === 'live-first') return a.status === 'Live' ? -1 : b.status === 'Live' ? 1 : 0
      return a.status === 'Draft' ? -1 : b.status === 'Draft' ? 1 : 0
    })
  const allFilteredSelected = filtered.length > 0 && filtered.every(l => selected.has(l.id))

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(l => next.delete(l.id)); return next })
    } else {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(l => next.add(l.id)); return next })
    }
  }

  const count = state === 'filled' ? listings.length : 0

  // Shared header (same across all states, buttons only shown when filled)
  const header = (
    <div className="flex items-center justify-between mb-4 shrink-0 min-h-[32px]">
      <h3 className="text-[18px] font-semibold text-[#101828]">Listings</h3>
    </div>
  )

  if (state === 'empty') return (
    <div className="flex flex-col">
      {header}
      <div className="h-px bg-[#e9eaeb] mb-5" />
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#e9eaeb] bg-white py-14 px-8 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[420px] h-[420px] rounded-full border border-[#f2f4f7] absolute" />
          <div className="w-[300px] h-[300px] rounded-full border border-[#f2f4f7] absolute" />
          <div className="w-[180px] h-[180px] rounded-full border border-[#f2f4f7] absolute" />
        </div>
        <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-[#e9eaeb] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.1)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        <p className="relative z-10 text-[16px] font-semibold text-[#101828] mb-1">Choose what guests can book</p>
        <p className="relative z-10 text-[14px] text-[#535862] text-center max-w-[340px] mb-6 leading-snug">
          The listings you include appear on your booking website, where guests can find and book them.
        </p>
        <div className="relative z-10">
          <Button onClick={() => { setModalExcludeIds([]); setShowModal(true) }}>Include listings</Button>
        </div>
      </div>
      {showModal && <ListingSelectorModal onClose={() => setShowModal(false)} onAdd={handleAddSpecific} excludeIds={modalExcludeIds} />}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-2 items-end pointer-events-none">
          {toasts.map(toast => (
            <div key={toast.id} className={cn('flex items-center gap-3 rounded-xl bg-white border border-[#e9eaeb] shadow-[0_8px_24px_rgba(0,0,0,0.12)] px-4 py-3 min-w-[260px] pointer-events-auto transition-transform duration-300 ease-in-out', toast.visible ? 'translate-x-0' : 'translate-x-[calc(100%+24px)]')}>
              <img src={`${import.meta.env.BASE_URL}Featured icon outline.svg`} alt="" className="w-[38px] h-[38px] shrink-0" />
              <span className="text-[14px] font-medium text-[#181d27] flex-1">{toast.message}</span>
              <button onClick={() => dismissToast(toast.id)} className="text-[#98a2b3] hover:text-[#667085] transition-colors ml-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  if (state === 'loading') return (
    <div className="flex flex-col">
      {header}
      <div className="h-px bg-[#e9eaeb] mb-5" />
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-7 w-7 text-[#15b8b0]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      </div>
    </div>
  )

  // Filled state
  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {header}
      <div className="h-px bg-[#e9eaeb] mb-5 shrink-0" />

      <div className="flex gap-4 flex-1 min-h-0 items-stretch">
      {/* Table card */}
      <div className="flex flex-col flex-1 min-w-0 rounded-xl border border-[#e9eaeb] overflow-hidden">
        {/* Tabs: Included / Excluded + Manage categories button */}
        <div className="flex items-center border-b border-[#e9eaeb] bg-white shrink-0">
          <div className="flex flex-1">
            {(['included', 'excluded'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => { setListingTab(tab); setSelected(new Set()); setFilters(EMPTY_FILTERS); setCurrentPage(1) }}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors',
                  listingTab === tab
                    ? 'border-b-[#344054] text-[#101828]'
                    : 'border-b-transparent text-[#667085] hover:text-[#344054]'
                )}
              >
                <span className="capitalize">{tab === 'included' ? 'Included' : 'Excluded'}</span>
                <span className={cn(
                  'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                  listingTab === tab ? 'bg-[#f2f4f7] text-[#344054]' : 'bg-[#f2f4f7] text-[#98a2b3]'
                )}>
                  {tab === 'included' ? listings.length : excludedListings.length}
                </span>
              </button>
            ))}
          </div>
          <div className="px-3">
            <Button variant="outline" size="sm" onClick={() => setShowCategoriesModal(true)}>
              {categories.length === 0 ? 'New label' : 'Listing labels'}
            </Button>
          </div>
        </div>
        {/* Filter bar — hidden when excluded tab is empty */}
        {!(listingTab === 'excluded' && excludedListings.length === 0) && <div className="flex items-center justify-between px-4 py-3 border-b border-[#e9eaeb] bg-white">
          <div className="flex items-center gap-2 flex-wrap">
            <FilterDropdown applied={filters} onApply={setFilters} availableCountries={listingCountries} availableCities={listingCities} availableTags={listingTags} countryCounts={listingCountryCounts} cityCounts={listingCityCounts} tagCounts={listingTagCounts} />
            {(filters.countries.size + filters.cities.size + filters.tags.size) > 0 && (
              <>
                <div className="w-px h-5 bg-[#e9eaeb] shrink-0" />
                {(['countries', 'cities', 'tags'] as const).flatMap(key =>
                  [...filters[key]].map(value => (
                    <span key={`${key}-${value}`} className="inline-flex items-center gap-1.5 rounded-md border border-[#d0d5dd] bg-white px-2.5 py-1.5 text-[13px] font-semibold text-[#344054] shadow-[0_1px_2px_rgba(10,13,18,0.05)]">
                      {value}
                      <button
                        type="button"
                        onClick={() => setFilters(prev => {
                          const next = new Set(prev[key]); next.delete(value); return { ...prev, [key]: next }
                        })}
                        className="text-[#667085] hover:text-[#344054] transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </span>
                  ))
                )}
                <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-[13px] font-semibold text-[#667085] hover:text-[#344054] transition-colors whitespace-nowrap">
                  Clear all
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#d0d5dd] bg-white px-3 py-1.5 w-52">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#98a2b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter name"
              className="flex-1 text-[13px] text-[#344054] placeholder-[#98a2b3] outline-none bg-transparent"
            />
          </div>
        </div>}

        {/* Table header — hidden when excluded tab is empty */}
        {!(listingTab === 'excluded' && excludedListings.length === 0) && <div className={cn('grid items-center gap-3 px-4 py-2.5 border-b border-[#e9eaeb] bg-[#fafafa] sticky top-0 z-10', categories.length > 0 && listingTab === 'included' ? 'grid-cols-[20px_minmax(140px,2fr)_minmax(80px,1fr)_minmax(80px,1fr)_1fr_minmax(110px,1fr)]' : 'grid-cols-[20px_minmax(140px,2fr)_minmax(80px,1fr)_minmax(80px,1fr)_1fr]')}>
          <Checkbox
            checked={allFilteredSelected}
            isIndeterminate={filtered.some(l => selected.has(l.id)) && !allFilteredSelected}
            onChange={toggleAll}
          />
          <span className="text-[12px] font-semibold text-[#414651] flex items-center gap-1">
            Name
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 shrink-0"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </span>
          <span className="text-[12px] font-semibold text-[#414651] flex items-center gap-1 truncate">
            Country
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 shrink-0"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </span>
          <button type="button" onClick={cycleLocationSort} className={cn('flex items-center gap-1 text-[12px] font-semibold truncate transition-colors', locationSort !== 'none' ? 'text-[#344054]' : 'text-[#414651] hover:text-[#344054]')}>
            Location
            {locationSort === 'none' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 shrink-0"><path d="M12 19V5M5 12l7-7 7 7"/></svg>}
            {locationSort === 'asc'  && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M12 19V5M5 12l7-7 7 7"/></svg>}
            {locationSort === 'desc' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M12 5v14M5 12l7 7 7-7"/></svg>}
          </button>
          <span className="text-[12px] font-semibold text-[#414651]">Tags</span>
          {categories.length > 0 && listingTab === 'included' && <span className="text-[12px] font-semibold text-[#414651]">Listing labels</span>}
        </div>}

        {/* Rows */}
        <div className="bg-white flex-1 overflow-y-auto pb-6">
          {filtered.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center px-6 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[420px] h-[420px] rounded-full border border-[#f2f4f7] absolute" />
                <div className="w-[300px] h-[300px] rounded-full border border-[#f2f4f7] absolute" />
                <div className="w-[180px] h-[180px] rounded-full border border-[#f2f4f7] absolute" />
              </div>
              <div className="relative z-10 mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-[#e9eaeb] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.1)]">
                {listingTab === 'excluded' && excludedListings.length === 0 ? (
                  <EyeOff width={24} height={24} stroke="#344054" strokeWidth={1.75} />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                )}
              </div>
              {listingTab === 'excluded' && excludedListings.length === 0 ? (
                <>
                  <p className="relative z-10 text-[15px] font-semibold text-[#101828] mb-1">All listings are visible</p>
                  <p className="relative z-10 text-[13px] text-[#535862] max-w-[280px] leading-snug">
                    Go to the Included tab to select and exclude listings.
                  </p>
                </>
              ) : (
                <>
                  <p className="relative z-10 text-[15px] font-semibold text-[#101828] mb-1">No listings match the selected filters</p>
                  <p className="relative z-10 text-[13px] text-[#535862] max-w-[280px] leading-snug">
                    Try adjusting your filters to find what you're looking for.
                  </p>
                </>
              )}
            </div>
          )}
          {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((listing, i, arr) => (
            <div
              key={listing.id}
              onClick={() => toggleSelect(listing.id)}
              className={cn(
                'grid items-center gap-3 px-4 h-[72px] cursor-pointer',
                categories.length > 0 && listingTab === 'included'
                  ? 'grid-cols-[20px_minmax(140px,2fr)_minmax(80px,1fr)_minmax(80px,1fr)_1fr_minmax(110px,1fr)]'
                  : 'grid-cols-[20px_minmax(140px,2fr)_minmax(80px,1fr)_minmax(80px,1fr)_1fr]',
                i < arr.length - 1 ? 'border-b border-[#f2f4f7]' : '',
                selected.has(listing.id) ? 'bg-[#f8f9fc]' : 'hover:bg-[#fafafa]'
              )}
            >
              <span onClick={e => e.stopPropagation()} className="self-center flex"><Checkbox checked={selected.has(listing.id)} onChange={() => toggleSelect(listing.id)} /></span>
              <div className="flex items-center gap-3 min-w-0">
                <img src={listing.img} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `https://picsum.photos/seed/${listing.id}/80/80` }} />
                <span className="text-[14px] font-medium text-[#181d27] truncate">{listing.name}</span>
              </div>
              <span className="text-[13px] text-[#535862] truncate min-w-0">{getCountry(listing.location)}</span>
              <span className="text-[13px] text-[#535862] truncate min-w-0">{listing.location}</span>
              <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                {listing.tags.slice(0, 2).map(t => <TagPill key={t.label} label={t.label} />)}
                {listing.tags.length > 2 && (
                  <span className="relative group/tip inline-flex items-center shrink-0 bg-white border border-[#d5d7da] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] rounded-full px-1.5 py-[1px] text-[11px] font-medium text-[#414651] whitespace-nowrap leading-tight cursor-default">
                    +{listing.tags.length - 2}
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tip:flex flex-col gap-0.5 rounded-lg bg-[#101828] px-2.5 py-2 shadow-lg z-50 min-w-max">
                      {listing.tags.slice(2).map(t => (
                        <span key={t.label} className="text-[11px] text-white whitespace-nowrap">{t.label}</span>
                      ))}
                      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#101828]" />
                    </span>
                  </span>
                )}
              </div>
              {categories.length > 0 && listingTab === 'included' && (() => {
                const cats = categories.filter(c => c.listingIds.includes(listing.id))
                return cats.length > 0 ? (
                  <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                    {cats.slice(0, 2).map(cat => (
                      <span key={cat.id} className="inline-flex items-center gap-1 shrink-0 bg-white border border-[#d5d7da] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] rounded-full px-1.5 py-[1px] text-[11px] font-medium text-[#414651] whitespace-nowrap leading-tight">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </span>
                    ))}
                    {cats.length > 2 && (
                      <span className="relative group/tip inline-flex items-center shrink-0 bg-white border border-[#d5d7da] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] rounded-full px-1.5 py-[1px] text-[11px] font-medium text-[#414651] whitespace-nowrap leading-tight cursor-default">
                        +{cats.length - 2}
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tip:flex flex-col gap-0.5 rounded-lg bg-[#101828] px-2.5 py-2 shadow-lg z-50 min-w-max">
                          {cats.slice(2).map(c => (
                            <span key={c.id} className="text-[11px] text-white whitespace-nowrap flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                              {c.name}
                            </span>
                          ))}
                          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#101828]" />
                        </span>
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[12px] text-[#d0d5dd]">—</span>
                )
              })()}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (() => {
          const pageCount = Math.ceil(filtered.length / itemsPerPage)
          const pages = Array.from({ length: pageCount }, (_, i) => i + 1)
          return (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#e9eaeb] bg-white shrink-0">
              <span className="text-[13px] text-[#667085]">
                Page {currentPage} of {pageCount}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#d0d5dd] text-[13px] font-medium text-[#344054] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  Previous
                </button>
                {pages.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={cn(
                      'h-8 w-8 rounded-lg text-[13px] font-medium transition-colors',
                      currentPage === p
                        ? 'bg-[#f2f4f7] text-[#344054] font-semibold'
                        : 'text-[#667085] hover:bg-[#f9fafb]'
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === pageCount}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#d0d5dd] text-[13px] font-medium text-[#344054] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#667085]">Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }}
                  className="h-8 rounded-lg border border-[#d0d5dd] px-2 text-[13px] text-[#344054] bg-white outline-none cursor-pointer"
                >
                  {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          )
        })()}
      </div>

      </div>{/* end flex row */}

      {/* Floating selection bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0 rounded-xl bg-[#0c111d] shadow-[0_8px_32px_rgba(0,0,0,0.28)]">
          {/* Count */}
          <span className="text-[14px] font-medium text-white whitespace-nowrap px-4 py-2.5">{selected.size} selected</span>
          <div className="w-px h-9 bg-white/10 shrink-0" />
          {/* Include / Exclude */}
          {listingTab === 'included' ? (
            <button
              type="button"
              onClick={() => setShowExcludeConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <EyeOff width={15} height={15} />
              Exclude
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const toAdd = MOCK_LISTINGS_DATA.filter(l => selected.has(l.id))
                setListings(prev => [...prev, ...toAdd])
                setSelected(new Set())
                triggerToast(toAdd.length === 1 ? '1 listing included' : `${toAdd.length} listings included`)
                onDirty?.()
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
              </svg>
              Include
            </button>
          )}
          {listingTab === 'included' && <>
          <div className="w-px h-9 bg-white/10 shrink-0" />
          {/* Tag listings — dropdown */}
          <div ref={assignDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setAssignDropdownOpen(v => !v)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              Add to listing label
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            {assignDropdownOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[60] bg-white rounded-lg border border-black/[0.08] shadow-[0_12px_16px_-4px_rgba(10,13,18,0.08),0_4px_6px_-2px_rgba(10,13,18,0.03),0_2px_2px_-1px_rgba(10,13,18,0.04)] w-[220px] overflow-hidden">
                <div className="py-1">
                  {categories.length === 0 ? (
                    <div className="px-3 py-4 flex flex-col items-center gap-2">
                      <p className="text-[13px] text-[#667085] text-center">No listing labels yet.</p>
                      <button
                        type="button"
                        onClick={() => { setAssignDropdownOpen(false); setShowCategoriesModal(true) }}
                        className="text-[13px] font-medium text-[#344054] hover:text-[#101828] transition-colors"
                      >
                        Create your first tag →
                      </button>
                    </div>
                  ) : (
                    categories.map(cat => {
                      const alreadyAssigned = [...selected].every(id => cat.listingIds.includes(id))
                      return (
                        <div key={cat.id} className="px-1.5 py-px">
                          <button
                            type="button"
                            disabled={alreadyAssigned}
                            onClick={() => { handleAssignToCategory(cat.id); setAssignDropdownOpen(false) }}
                            className={cn(
                              'w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-left transition-colors',
                              alreadyAssigned
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:bg-[#f9fafb] cursor-pointer'
                            )}
                          >
                            <span className="w-4 h-4 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: cat.color }} />
                            <span className="flex-1 text-[14px] text-[#181d27] truncate">{cat.name}</span>
                            {alreadyAssigned && <span className="text-[11px] text-[#98a2b3] shrink-0">Added</span>}
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          </>}
          <div className="w-px h-9 bg-white/10 shrink-0" />
          {/* Clear */}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="flex items-center justify-center w-10 h-10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Clear selection"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Toast stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-2 items-end pointer-events-none">
          {toasts.map(toast => (
            <div key={toast.id} className={cn('flex items-center gap-3 rounded-xl bg-white border border-[#e9eaeb] shadow-[0_8px_24px_rgba(0,0,0,0.12)] px-4 py-3 min-w-[260px] pointer-events-auto transition-transform duration-300 ease-in-out', toast.visible ? 'translate-x-0' : 'translate-x-[calc(100%+24px)]')}>
              <img src={`${import.meta.env.BASE_URL}Featured icon outline.svg`} alt="" className="w-[38px] h-[38px] shrink-0" />
              <span className="text-[14px] font-medium text-[#181d27] flex-1">{toast.message}</span>
              <button onClick={() => dismissToast(toast.id)} className="text-[#98a2b3] hover:text-[#667085] transition-colors ml-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {showModal && <ListingSelectorModal onClose={() => setShowModal(false)} onAdd={handleAddSpecific} excludeIds={modalExcludeIds} />}

      {/* Exclude confirmation modal */}
      {showExcludeConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="w-[480px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden">
            <div className="px-6 pt-6 pb-5">
              {/* Icon */}
              <div className="relative mb-4 w-12 h-12">
                <div className="absolute inset-0 rounded-full bg-[#fef0c7] opacity-40 scale-[2]" />
                <div className="absolute inset-0 rounded-full bg-[#fef0c7] opacity-60 scale-[1.5]" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#fef0c7]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc6803" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
              </div>
              <p className="text-[16px] font-semibold text-[#101828] mb-1">
                Exclude {selected.size} listing{selected.size !== 1 ? 's' : ''}?
              </p>
              <p className="text-[14px] text-[#535862]">
                {selected.size === 1 ? 'This listing' : `${selected.size} listings`} will be hidden from your booking website immediately.
              </p>
            </div>
            <div className="flex items-center gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => setShowExcludeConfirm(false)}
                className="flex-1 rounded-lg border border-[#d0d5dd] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#344054] hover:bg-[#f9fafb] transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const count = selected.size
                  let removedAll = false
                  setListings(prev => {
                    const next = prev.filter(l => !selected.has(l.id))
                    if (next.length === 0) { setState('empty'); removedAll = true }
                    return next
                  })
                  // Strip excluded listings from all categories
                  setCategories(prev => prev.map(c => ({
                    ...c,
                    listingIds: c.listingIds.filter(id => !selected.has(id)),
                  })))
                  setSelected(new Set())
                  setShowExcludeConfirm(false)
                  triggerToast(count === 1 ? '1 listing excluded' : `${count} listings excluded`)
                  if (!removedAll) onDirty?.()
                }}
                className="flex-1 rounded-lg bg-[#d92d20] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#b42318] transition-colors shadow-sm"
              >
                Exclude
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCategoriesModal(false)} />
          <div className="relative flex flex-col bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.22)] overflow-hidden" style={{ width: 540, maxHeight: '80vh' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-5 shrink-0">
              {modalView === 'editing' ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalView('list')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e9eaeb] text-[#344054] hover:bg-[#f9fafb] transition-colors shrink-0"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#101828]">Edit tag</h2>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-[18px] font-semibold text-[#101828]">
                    {modalView === 'add' ? 'New label' : 'Listing labels'}
                  </h2>
                  {modalView === 'list' && (
                    <button
                      type="button"
                      onClick={() => { setModalCategoryName(''); setModalCategoryColor('#1570ef'); setModalView('add') }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#d0d5dd] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#344054] hover:bg-[#f9fafb] transition-colors shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                      New tag
                    </button>
                  )}
                </div>
              )}
              <button type="button" onClick={() => setShowCategoriesModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#98a2b3] hover:text-[#667085] hover:bg-[#f9fafb] transition-colors shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6">

              {/* LIST view */}
              {modalView === 'list' && (
                <div className="pb-2">
                  {categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <p className="text-[14px] font-semibold text-[#101828]">No listing labels yet</p>
                      <p className="text-[13px] text-[#667085] text-center max-w-[280px]">Create tags to help guests browse your listings by theme or location.</p>
                      <button
                        type="button"
                        onClick={() => { setModalCategoryName(''); setModalCategoryColor('#1570ef'); setModalView('add') }}
                        className="rounded-lg bg-[#344054] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#1d2939] transition-colors"
                      >
                        Create your first tag →
                      </button>
                    </div>
                  ) : (
                    categories.map(cat => (
                      <div key={cat.id} className="group flex items-center gap-3 py-3 border-b border-[#f2f4f7] last:border-0 hover:bg-[#fafafa] -mx-6 px-6 transition-colors">
                        <span className="w-3 h-3 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: cat.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-[#181d27] truncate">{cat.name}</p>
                          <p className="text-[12px] text-[#667085]">
                            {cat.listingIds.length === 0 ? 'No listings yet' : `${cat.listingIds.length} listing${cat.listingIds.length !== 1 ? 's' : ''}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => { setModalEditingCatId(cat.id); setModalEditName(cat.name); setModalEditColor(cat.color); setModalView('editing') }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb] transition-colors shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
                          >
                            <Edit03 width={13} height={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d0d5dd] bg-white text-[#344054] hover:text-[#d92d20] hover:border-[#fecdca] hover:bg-[#fff1f3] transition-colors shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
                          >
                            <Trash01 width={13} height={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ADD view */}
              {modalView === 'add' && (
                <div className="pb-2">
                  <div className="flex flex-wrap gap-2 mb-1.5">
                    {CATEGORY_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setModalCategoryColor(c)}
                        className={cn('w-7 h-7 shrink-0 rounded-full transition-all', modalCategoryColor === c ? 'ring-2 ring-offset-2 ring-[#344054]' : 'hover:scale-110')}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <p className="text-[12px] text-[#667085] mb-3">Color appears on your booking website next to the tag name.</p>
                  <div className="flex items-center gap-2 rounded-lg border border-[#d0d5dd] bg-white px-3 py-2.5 focus-within:border-[#344054] focus-within:ring-1 focus-within:ring-[#344054] transition-colors">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: modalCategoryColor }} />
                    <input
                      type="text"
                      value={modalCategoryName}
                      onChange={e => setModalCategoryName(e.target.value.slice(0, 16))}
                      maxLength={16}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && modalCategoryName.trim()) {
                          handleCreateCategoryOnly(modalCategoryName.trim(), modalCategoryColor)
                          setModalView('list')
                        }
                      }}
                      placeholder="Tag name"
                      className="flex-1 text-[14px] text-[#344054] placeholder-[#98a2b3] outline-none bg-transparent"
                      autoFocus
                    />
                  </div>
                  {categories.length === 0 && (
                    <p className="text-[12px] text-[#98a2b3] mt-1.5">Visible to guests — e.g. "Beachfront", "Pet Friendly".</p>
                  )}
                </div>
              )}

              {/* EDITING view */}
              {modalView === 'editing' && (() => {
                const editingCat = categories.find(c => c.id === modalEditingCatId)
                if (!editingCat) return null
                const assignedListings = MOCK_LISTINGS_DATA.filter(l => editingCat.listingIds.includes(l.id))
                return (
                  <div className="pb-2">
                    <p className="text-[13px] font-semibold text-[#344054] mb-3">Tag name</p>
                    <div className="flex flex-wrap gap-2 mb-1.5">
                      {CATEGORY_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setModalEditColor(c)}
                          className={cn('w-7 h-7 shrink-0 rounded-full transition-all', modalEditColor === c ? 'ring-2 ring-offset-2 ring-[#344054]' : 'hover:scale-110')}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <p className="text-[12px] text-[#667085] mb-3">Color appears on your booking website next to the tag name.</p>
                    <div className="flex items-center gap-2 rounded-lg border border-[#d0d5dd] bg-white px-3 py-2.5 focus-within:border-[#344054] focus-within:ring-1 focus-within:ring-[#344054] transition-colors">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: modalEditColor }} />
                      <input
                        type="text"
                        value={modalEditName}
                        onChange={e => setModalEditName(e.target.value.slice(0, 16))}
                        maxLength={16}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && modalEditName.trim()) {
                            handleEditCategory(modalEditingCatId!, modalEditName.trim(), modalEditColor)
                            setModalView('list')
                          }
                        }}
                        placeholder="Tag name"
                        className="flex-1 text-[14px] text-[#344054] placeholder-[#98a2b3] outline-none bg-transparent"
                        autoFocus
                      />
                    </div>
                    <p className="text-[12px] text-[#98a2b3] mt-1.5 mb-0">Visible to guests — e.g. "Beachfront", "Pet Friendly".</p>
                    {assignedListings.length > 0 && (
                      <>
                        <div className="h-px bg-[#e9eaeb] my-4" />
                        <p className="text-[13px] font-semibold text-[#344054] mb-3">Assigned listings</p>
                        <div className="rounded-xl border border-[#e9eaeb] overflow-hidden mb-2">
                          {assignedListings.map((l, i) => (
                            <div key={l.id} className={cn('flex items-center gap-3 px-3 py-2.5', i < assignedListings.length - 1 && 'border-b border-[#f2f4f7]')}>
                              <img src={l.img} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `https://picsum.photos/seed/${l.id}/80/80` }} />
                              <span className="text-[14px] font-medium text-[#181d27] truncate">{l.name}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })()}

            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-[#e9eaeb] shrink-0">
              {modalView === 'list' && (
                <button type="button" onClick={() => setShowCategoriesModal(false)}
                  className="flex-1 rounded-lg border border-[#d0d5dd] bg-white px-4 py-2.5 text-[14px] font-medium text-[#344054] hover:bg-[#f9fafb] transition-colors">
                  Close
                </button>
              )}
              {modalView === 'add' && (<>
                <button type="button" onClick={() => categories.length > 0 ? setModalView('list') : setShowCategoriesModal(false)}
                  className="flex-1 rounded-lg border border-[#d0d5dd] bg-white px-4 py-2.5 text-[14px] font-medium text-[#344054] hover:bg-[#f9fafb] transition-colors">
                  {categories.length > 0 ? 'Back' : 'Close'}
                </button>
                <button type="button" disabled={!modalCategoryName.trim()}
                  onClick={() => { if (!modalCategoryName.trim()) return; handleCreateCategoryOnly(modalCategoryName.trim(), modalCategoryColor); setModalView('list') }}
                  className="flex-1 rounded-lg bg-[#344054] px-4 py-2.5 text-[14px] font-medium text-white hover:bg-[#1d2939] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Create
                </button>
              </>)}
              {modalView === 'editing' && (<>
                <button type="button" onClick={() => setModalView('list')}
                  className="flex-1 rounded-lg border border-[#d0d5dd] bg-white px-4 py-2.5 text-[14px] font-medium text-[#344054] hover:bg-[#f9fafb] transition-colors">
                  Cancel
                </button>
                <button type="button" disabled={!modalEditName.trim()}
                  onClick={() => { if (!modalEditName.trim()) return; handleEditCategory(modalEditingCatId!, modalEditName.trim(), modalEditColor); setModalView('list') }}
                  className="flex-1 rounded-lg bg-[#344054] px-4 py-2.5 text-[14px] font-medium text-white hover:bg-[#1d2939] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Save changes
                </button>
              </>)}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

// ─── Listings Section B / C ─── B = tab-row toggle · C = side-slice panel ─────

export function ListingsSectionB({ onDirty, sliceMode = false }: { onDirty?: () => void; sliceMode?: boolean }) {
  const [state, setState] = useState<'empty' | 'loading' | 'filled'>('empty')
  const [listings, setListings] = useState<typeof MOCK_LISTINGS_DATA>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const selectedRef = useRef<Set<string>>(new Set())
  selectedRef.current = selected
  const [filter, setFilter] = useState('')
  const [statusSort, setStatusSort] = useState<'none' | 'live-first' | 'draft-first'>('none')
  const [locationSort, setLocationSort] = useState<'none' | 'asc' | 'desc'>('none')
  const cycleLocationSort = () => setLocationSort(s => s === 'none' ? 'asc' : s === 'asc' ? 'desc' : 'none')
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS)
  const [listingTab, setListingTab] = useState<'included' | 'excluded'>('included')
  const [showExcludeConfirm, setShowExcludeConfirm] = useState(false)

  const listingIdSet = new Set(listings.map(l => l.id))
  const excludedListings = MOCK_LISTINGS_DATA.filter(l => !listingIdSet.has(l.id))
  const activeListings = listingTab === 'included' ? listings : excludedListings

  // Drop stale filter values when active listing pool changes
  useEffect(() => {
    const validCountries = new Set(activeListings.map(l => getCountry(l.location)))
    const validCities = new Set(activeListings.map(l => l.location))
    const validTags = new Set(activeListings.flatMap(l => l.tags.map(t => t.label)))
    setFilters(prev => {
      const nextCountry = new Set([...prev.countries].filter(c => validCountries.has(c)))
      const nextCity = new Set([...prev.cities].filter(c => validCities.has(c)))
      const nextTag = new Set([...prev.tags].filter(t => validTags.has(t)))
      if (nextCountry.size === prev.countries.size && nextCity.size === prev.cities.size && nextTag.size === prev.tags.size) return prev
      return { countries: nextCountry, cities: nextCity, tags: nextTag }
    })
  }, [listings, listingTab]) // eslint-disable-line react-hooks/exhaustive-deps

  const [toasts, setToasts] = useState<Array<{ id: string; message: string; visible: boolean }>>([])

  const triggerToast = (msg: string) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message: msg, visible: false }])
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: true } : t))
    }))
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320)
    }, 4000)
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320)
  }

  const [addedCount, setAddedCount] = useState(0)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalExcludeIds, setModalExcludeIds] = useState<string[]>([])

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Categories — panel toggle (no modal, no assign dropdown)
  const [categoriesPanelOpen, setCategoriesPanelOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  const handleCreateCategory = (name: string, color: string) => {
    const newId = crypto.randomUUID()
    const ids = [...selectedRef.current]
    setCategories(prev => [...prev, { id: newId, name, color, listingIds: ids }])
    // Keep the table selection — user may want to assign the same listings to another tag.
    if (ids.length > 0) {
      triggerToast(`Listing label "${name}" created with ${ids.length} listing${ids.length === 1 ? '' : 's'}`)
    } else {
      triggerToast(`Listing label "${name}" created`)
    }
    onDirty?.()
    return newId
  }
  const handleEditCategory = (id: string, name: string, color: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name, color } : c))
    onDirty?.()
  }
  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id))
    onDirty?.()
  }
  const handleAssignToCategory = (categoryId: string) => {
    const ids = [...selectedRef.current]
    const cat = categories.find(c => c.id === categoryId)
    const newlyAdded = ids.filter(id => !cat?.listingIds.includes(id))
    setCategories(prev => prev.map(c => c.id === categoryId
      ? { ...c, listingIds: [...new Set([...c.listingIds, ...ids])] }
      : c
    ))
    if (newlyAdded.length === 0) {
      triggerToast('Already in this listing label')
    } else {
      triggerToast(newlyAdded.length === 1 ? '1 listing added to listing label' : `${newlyAdded.length} listings added to listing label`)
    }
    onDirty?.()
  }
  const handleRemoveListingFromCategory = (categoryId: string, listingId: string) => {
    setCategories(prev => prev.map(c => c.id === categoryId
      ? { ...c, listingIds: c.listingIds.filter(id => id !== listingId) }
      : c
    ))
    onDirty?.()
  }

  const handleAddAll = () => {
    setState('loading')
    setTimeout(() => {
      setState('filled')
      setListings(MOCK_LISTINGS_DATA)
      setAddedCount(MOCK_LISTINGS_DATA.length)
      triggerToast(MOCK_LISTINGS_DATA.length === 1 ? '1 listing added' : `${MOCK_LISTINGS_DATA.length} listings added`)
    }, 1200)
  }

  const handleAddSpecific = (ids: string[]) => {
    setShowModal(false)
    setState('loading')
    setTimeout(() => {
      setState('filled')
      const existingIds = new Set(listings.map(l => l.id))
      const newOnes = MOCK_LISTINGS_DATA.filter(l => ids.includes(l.id) && !existingIds.has(l.id))
      setListings(prev => [...prev, ...newOnes])
      setAddedCount(newOnes.length)
      triggerToast(newOnes.length === 1 ? '1 listing added' : `${newOnes.length} listings added`)
    }, 1200)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleRemoveSelected = () => {
    const count = selected.size
    let removedAll = false
    setListings(prev => {
      const next = prev.filter(l => !selected.has(l.id))
      if (next.length === 0) { setState('empty'); removedAll = true }
      return next
    })
    setSelected(new Set())
    setActionsOpen(false)
    triggerToast(count === 1 ? '1 listing removed' : `${count} listings removed`)
    if (!removedAll) onDirty?.()
  }

  const listingCountries = [...new Set(activeListings.map(l => getCountry(l.location)))].sort((a, b) => a.localeCompare(b))
  const listingCities = [...new Set(activeListings.map(l => l.location))].sort((a, b) => a.localeCompare(b))
  const listingTags = [...new Set(activeListings.flatMap(l => l.tags.map(t => t.label)))].sort()
  const listingCountryCounts = Object.fromEntries(listingCountries.map(c => [c, activeListings.filter(l => getCountry(l.location) === c).length]))
  const listingCityCounts = Object.fromEntries(listingCities.map(loc => [loc, activeListings.filter(l => l.location === loc).length]))
  const listingTagCounts = Object.fromEntries(listingTags.map(tag => [tag, activeListings.filter(l => l.tags.some(t => t.label === tag)).length]))

  const filtered = activeListings
    .filter(l => {
      const q = filter.toLowerCase()
      const matchName = !q || l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || l.location.toLowerCase().includes(q)
      const matchCountry = filters.countries.size === 0 || filters.countries.has(getCountry(l.location))
      const matchCity = filters.cities.size === 0 || filters.cities.has(l.location)
      const matchTag = filters.tags.size === 0 || [...filters.tags].every(tag => l.tags.some(t => t.label === tag))
      return matchName && matchCountry && matchCity && matchTag
    })
    .sort((a, b) => {
      if (locationSort !== 'none') {
        const cmp = a.location.localeCompare(b.location)
        return locationSort === 'asc' ? cmp : -cmp
      }
      if (statusSort === 'none') return 0
      if (statusSort === 'live-first') return a.status === 'Live' ? -1 : b.status === 'Live' ? 1 : 0
      return a.status === 'Draft' ? -1 : b.status === 'Draft' ? 1 : 0
    })
  const allFilteredSelected = filtered.length > 0 && filtered.every(l => selected.has(l.id))

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(l => next.delete(l.id)); return next })
    } else {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(l => next.add(l.id)); return next })
    }
  }

  const header = (
    <div className="flex items-center justify-between mb-4 shrink-0 min-h-[32px]">
      <h3 className="text-[18px] font-semibold text-[#101828]">Listings</h3>
    </div>
  )

  if (state === 'empty') return (
    <div className="flex flex-col">
      {header}
      <div className="h-px bg-[#e9eaeb] mb-5" />
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#e9eaeb] bg-white py-14 px-8 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[420px] h-[420px] rounded-full border border-[#f2f4f7] absolute" />
          <div className="w-[300px] h-[300px] rounded-full border border-[#f2f4f7] absolute" />
          <div className="w-[180px] h-[180px] rounded-full border border-[#f2f4f7] absolute" />
        </div>
        <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-[#e9eaeb] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.1)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        <p className="relative z-10 text-[16px] font-semibold text-[#101828] mb-1">Choose what guests can book</p>
        <p className="relative z-10 text-[14px] text-[#535862] text-center max-w-[340px] mb-6 leading-snug">
          The listings you include appear on your booking website, where guests can find and book them.
        </p>
        <div className="relative z-10">
          <Button onClick={() => { setModalExcludeIds([]); setShowModal(true) }}>Include listings</Button>
        </div>
      </div>
      {showModal && <ListingSelectorModal onClose={() => setShowModal(false)} onAdd={handleAddSpecific} excludeIds={modalExcludeIds} />}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-2 items-end pointer-events-none">
          {toasts.map(toast => (
            <div key={toast.id} className={cn('flex items-center gap-3 rounded-xl bg-white border border-[#e9eaeb] shadow-[0_8px_24px_rgba(0,0,0,0.12)] px-4 py-3 min-w-[260px] pointer-events-auto transition-transform duration-300 ease-in-out', toast.visible ? 'translate-x-0' : 'translate-x-[calc(100%+24px)]')}>
              <img src={`${import.meta.env.BASE_URL}Featured icon outline.svg`} alt="" className="w-[38px] h-[38px] shrink-0" />
              <span className="text-[14px] font-medium text-[#181d27] flex-1">{toast.message}</span>
              <button onClick={() => dismissToast(toast.id)} className="text-[#98a2b3] hover:text-[#667085] transition-colors ml-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  if (state === 'loading') return (
    <div className="flex flex-col">
      {header}
      <div className="h-px bg-[#e9eaeb] mb-5" />
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-7 w-7 text-[#15b8b0]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      </div>
    </div>
  )

  // Filled state
  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {header}
      <div className="h-px bg-[#e9eaeb] mb-5 shrink-0" />

      <div className="flex gap-4 flex-1 min-h-0 items-stretch">
      {/* Table card */}
      <div className="flex flex-col flex-1 min-w-0 rounded-xl border border-[#e9eaeb] overflow-hidden">
        {/* Tabs: Included / Excluded + Categories toggle button */}
        <div className="flex items-center border-b border-[#e9eaeb] bg-white shrink-0">
          <div className="flex flex-1">
            {(['included', 'excluded'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => { setListingTab(tab); setSelected(new Set()); setFilters(EMPTY_FILTERS); setCurrentPage(1) }}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors',
                  listingTab === tab
                    ? 'border-b-[#344054] text-[#101828]'
                    : 'border-b-transparent text-[#667085] hover:text-[#344054]'
                )}
              >
                <span>{tab === 'included' ? 'Included' : 'Excluded'}</span>
                <span className={cn(
                  'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                  listingTab === tab ? 'bg-[#f2f4f7] text-[#344054]' : 'bg-[#f2f4f7] text-[#98a2b3]'
                )}>
                  {tab === 'included' ? listings.length : excludedListings.length}
                </span>
              </button>
            ))}
          </div>
          {/* Categories toggle — Spotify >|/|< icon (tab-row mode only) */}
          {!sliceMode && (
            <div className="px-3">
              <button
                type="button"
                onClick={() => setCategoriesPanelOpen(v => !v)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#d0d5dd] bg-white text-[13px] font-medium text-[#667085] hover:text-[#344054] hover:border-[#c8cdd5] transition-colors shrink-0"
              >
                {/* tag icon — always left */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                Listing labels
                {/* directional arrow — always right, swaps on state */}
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {categoriesPanelOpen
                    ? <><line x1="12" y1="3" x2="12" y2="15"/><polyline points="8,6 5,9 8,12"/></>
                    : <><line x1="6" y1="3" x2="6" y2="15"/><polyline points="10,6 13,9 10,12"/></>
                  }
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Filter bar — hidden when excluded tab is empty */}
        {!(listingTab === 'excluded' && excludedListings.length === 0) && <div className="flex items-center justify-between px-4 py-3 border-b border-[#e9eaeb] bg-white">
          <div className="flex items-center gap-2 flex-wrap">
            <FilterDropdown applied={filters} onApply={setFilters} availableCountries={listingCountries} availableCities={listingCities} availableTags={listingTags} countryCounts={listingCountryCounts} cityCounts={listingCityCounts} tagCounts={listingTagCounts} />
            {(filters.countries.size + filters.cities.size + filters.tags.size) > 0 && (
              <>
                <div className="w-px h-5 bg-[#e9eaeb] shrink-0" />
                {(['countries', 'cities', 'tags'] as const).flatMap(key =>
                  [...filters[key]].map(value => (
                    <span key={`${key}-${value}`} className="inline-flex items-center gap-1.5 rounded-md border border-[#d0d5dd] bg-white px-2.5 py-1.5 text-[13px] font-semibold text-[#344054] shadow-[0_1px_2px_rgba(10,13,18,0.05)]">
                      {value}
                      <button
                        type="button"
                        onClick={() => setFilters(prev => {
                          const next = new Set(prev[key]); next.delete(value); return { ...prev, [key]: next }
                        })}
                        className="text-[#667085] hover:text-[#344054] transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </span>
                  ))
                )}
                <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-[13px] font-semibold text-[#667085] hover:text-[#344054] transition-colors whitespace-nowrap">
                  Clear all
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#d0d5dd] bg-white px-3 py-1.5 w-52">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#98a2b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter name"
              className="flex-1 text-[13px] text-[#344054] placeholder-[#98a2b3] outline-none bg-transparent"
            />
          </div>
        </div>}

        {/* Table — single scroll container; native column alignment + sticky first column */}
        {(() => {
          const showWebsiteTags = categories.length > 0 && listingTab === 'included'
          const colCount = showWebsiteTags ? 6 : 5
          return (
            <div className="flex-1 min-h-0 overflow-auto bg-white">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-11" />
                  <col className="w-[220px]" />
                  <col className="w-[130px]" />
                  <col className="w-[150px]" />
                  <col className="w-[160px]" />
                  {showWebsiteTags && <col className="w-[160px]" />}
                </colgroup>
                {!(listingTab === 'excluded' && excludedListings.length === 0) && (
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-[#fafafa] border-b border-[#e9eaeb]">
                      <th className="sticky left-0 z-[21] bg-[#fafafa] px-4 py-2.5 text-left align-middle">
                        <Checkbox checked={allFilteredSelected} isIndeterminate={filtered.some(l => selected.has(l.id)) && !allFilteredSelected} onChange={toggleAll} />
                      </th>
                      <th className="sticky left-11 z-[21] bg-[#fafafa] py-2.5 text-left align-middle">
                        <span className="text-[12px] font-semibold text-[#414651] flex items-center gap-1">
                          Name
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 shrink-0"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                        </span>
                      </th>
                      <th className="px-3 py-2.5 text-left align-middle">
                        <span className="text-[12px] font-semibold text-[#414651] flex items-center gap-1">
                          Country
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 shrink-0"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                        </span>
                      </th>
                      <th className="px-3 py-2.5 text-left align-middle">
                        <button type="button" onClick={cycleLocationSort} className={cn('flex items-center gap-1 text-[12px] font-semibold transition-colors', locationSort !== 'none' ? 'text-[#344054]' : 'text-[#414651] hover:text-[#344054]')}>
                          Location
                          {locationSort === 'none' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 shrink-0"><path d="M12 19V5M5 12l7-7 7 7"/></svg>}
                          {locationSort === 'asc'  && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M12 19V5M5 12l7-7 7 7"/></svg>}
                          {locationSort === 'desc' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M12 5v14M5 12l7 7 7-7"/></svg>}
                        </button>
                      </th>
                      <th className="px-3 py-2.5 text-left align-middle"><span className="text-[12px] font-semibold text-[#414651]">Tags</span></th>
                      {showWebsiteTags && <th className="px-3 py-2.5 text-left align-middle"><span className="text-[12px] font-semibold text-[#414651]">Listing labels</span></th>}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={colCount} className="p-0">
                        <div className="flex min-h-[420px] flex-col items-center justify-center text-center px-6 relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[420px] h-[420px] rounded-full border border-[#f2f4f7] absolute" />
                            <div className="w-[300px] h-[300px] rounded-full border border-[#f2f4f7] absolute" />
                            <div className="w-[180px] h-[180px] rounded-full border border-[#f2f4f7] absolute" />
                          </div>
                          <div className="relative z-10 mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-[#e9eaeb] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.1)]">
                            {listingTab === 'excluded' && excludedListings.length === 0 ? (
                              <EyeOff width={24} height={24} stroke="#344054" strokeWidth={1.75} />
                            ) : (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                              </svg>
                            )}
                          </div>
                          {listingTab === 'excluded' && excludedListings.length === 0 ? (
                            <>
                              <p className="relative z-10 text-[15px] font-semibold text-[#101828] mb-1">All listings are visible</p>
                              <p className="relative z-10 text-[13px] text-[#535862] max-w-[280px] leading-snug">Go to the Included tab to select and exclude listings.</p>
                            </>
                          ) : (
                            <>
                              <p className="relative z-10 text-[15px] font-semibold text-[#101828] mb-1">No listings match the selected filters</p>
                              <p className="relative z-10 text-[13px] text-[#535862] max-w-[280px] leading-snug">Try adjusting your filters to find what you're looking for.</p>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((listing, i, arr) => (
                    <tr
                      key={listing.id}
                      onClick={() => toggleSelect(listing.id)}
                      className={cn(
                        'h-[72px] cursor-pointer',
                        i < arr.length - 1 ? 'border-b border-[#f2f4f7]' : '',
                        selected.has(listing.id) ? 'bg-[#f8f9fc]' : 'bg-white hover:bg-[#fafafa]'
                      )}
                    >
                      <td className="sticky left-0 z-[1] bg-inherit px-4 align-middle">
                        <span onClick={e => e.stopPropagation()} className="flex"><Checkbox checked={selected.has(listing.id)} onChange={() => toggleSelect(listing.id)} /></span>
                      </td>
                      <td className="sticky left-11 z-[1] bg-inherit align-middle">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={listing.img} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `https://picsum.photos/seed/${listing.id}/80/80` }} />
                          <span className="text-[14px] font-medium text-[#181d27] truncate">{listing.name}</span>
                        </div>
                      </td>
                      <td className="px-3 align-middle"><span className="text-[13px] text-[#535862] truncate block">{getCountry(listing.location)}</span></td>
                      <td className="px-3 align-middle"><span className="text-[13px] text-[#535862] truncate block">{listing.location}</span></td>
                      <td className="px-3 align-middle">
                        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                          {listing.tags.slice(0, 2).map(t => <TagPill key={t.label} label={t.label} />)}
                          {listing.tags.length > 2 && (
                            <span className="relative group/tip inline-flex items-center shrink-0 bg-white border border-[#d5d7da] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] rounded-full px-1.5 py-[1px] text-[11px] font-medium text-[#414651] whitespace-nowrap leading-tight cursor-default">
                              +{listing.tags.length - 2}
                              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tip:flex flex-col gap-0.5 rounded-lg bg-[#101828] px-2.5 py-2 shadow-lg z-50 min-w-max">
                                {listing.tags.slice(2).map(t => (<span key={t.label} className="text-[11px] text-white whitespace-nowrap">{t.label}</span>))}
                                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#101828]" />
                              </span>
                            </span>
                          )}
                        </div>
                      </td>
                      {showWebsiteTags && (() => {
                        const cats = categories.filter(c => c.listingIds.includes(listing.id))
                        return (
                          <td className="px-3 align-middle">
                            {cats.length > 0 ? (
                              <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                                {cats.slice(0, 2).map(cat => (
                                  <span key={cat.id} className="inline-flex items-center gap-1 shrink-0 bg-white border border-[#d5d7da] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] rounded-full px-1.5 py-[1px] text-[11px] font-medium text-[#414651] whitespace-nowrap leading-tight">
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                    {cat.name}
                                  </span>
                                ))}
                                {cats.length > 2 && (
                                  <span className="relative group/tip inline-flex items-center shrink-0 bg-white border border-[#d5d7da] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] rounded-full px-1.5 py-[1px] text-[11px] font-medium text-[#414651] whitespace-nowrap leading-tight cursor-default">
                                    +{cats.length - 2}
                                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tip:flex flex-col gap-0.5 rounded-lg bg-[#101828] px-2.5 py-2 shadow-lg z-50 min-w-max">
                                      {cats.slice(2).map(c => (
                                        <span key={c.id} className="text-[11px] text-white whitespace-nowrap flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                                          {c.name}
                                        </span>
                                      ))}
                                      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#101828]" />
                                    </span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[12px] text-[#d0d5dd]">—</span>
                            )}
                          </td>
                        )
                      })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })()}

        {/* Bulk action bar — bottom of table content, just above pagination */}
        {selected.size > 0 && (
          <div className="flex items-center justify-center px-4 pb-1 shrink-0 bg-white">
            <div className="flex items-center gap-0 rounded-xl bg-[#0c111d] shadow-[0_4px_16px_rgba(0,0,0,0.24)]">
              <span className="text-[14px] font-medium text-white whitespace-nowrap px-4 py-2.5">{selected.size} selected</span>
              <div className="w-px h-9 bg-white/10 shrink-0" />
              {listingTab === 'included' ? (
                <button type="button" onClick={() => setShowExcludeConfirm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors whitespace-nowrap">
                  <EyeOff width={15} height={15} />
                  Exclude
                </button>
              ) : (
                <button type="button" onClick={() => { const toAdd = MOCK_LISTINGS_DATA.filter(l => selected.has(l.id)); setListings(prev => [...prev, ...toAdd]); setSelected(new Set()); triggerToast(toAdd.length === 1 ? '1 listing included' : `${toAdd.length} listings included`); onDirty?.() }} className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors whitespace-nowrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
                  Include
                </button>
              )}
              {listingTab === 'included' && <>
                <div className="w-px h-9 bg-white/10 shrink-0" />
                <button type="button" onClick={() => setCategoriesPanelOpen(v => !v)} className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors whitespace-nowrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  Add to listing label
                </button>
              </>}
              <div className="w-px h-9 bg-white/10 shrink-0" />
              <button type="button" onClick={() => setSelected(new Set())} className="flex items-center justify-center w-10 h-10 text-white/60 hover:text-white hover:bg-white/10 transition-colors" aria-label="Clear selection">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {(() => {
          const pageCount = filtered.length > 0 ? Math.ceil(filtered.length / itemsPerPage) : 0
          const pages = filtered.length > 0 ? Array.from({ length: pageCount }, (_, i) => i + 1) : []
          return (
            <>
              {filtered.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white shrink-0 border-t border-[#e9eaeb]">
                  <span className="text-[13px] text-[#667085]">
                    Page {currentPage} of {pageCount}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#d0d5dd] text-[13px] font-medium text-[#344054] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                      Previous
                    </button>
                    {pages.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={cn(
                          'h-8 w-8 rounded-lg text-[13px] font-medium transition-colors',
                          currentPage === p
                            ? 'bg-[#f2f4f7] text-[#344054] font-semibold'
                            : 'text-[#667085] hover:bg-[#f9fafb]'
                        )}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={currentPage === pageCount}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#d0d5dd] text-[13px] font-medium text-[#344054] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[#667085]">Items per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }}
                      className="h-8 rounded-lg border border-[#d0d5dd] px-2 text-[13px] text-[#344054] bg-white outline-none cursor-pointer"
                    >
                      {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </>
          )
        })()}
      </div>{/* /table card */}

      {/* Categories — tab-row toggle (B) or side slice (C) */}
      {!sliceMode ? (
        categoriesPanelOpen && (
          <CategoriesPanel
            compact
            categories={categories}
            selectedIds={selected}
            onCreateCategory={handleCreateCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onAssignToCategory={handleAssignToCategory}
            onRemoveFromCategory={(catId, ids) => { setCategories(prev => prev.map(c => c.id === catId ? { ...c, listingIds: c.listingIds.filter(id => !ids.includes(id)) } : c)); triggerToast(ids.length === 1 ? '1 listing removed from listing label' : `${ids.length} listings removed from listing label`); onDirty?.() }}
            onRemoveListingFromCategory={handleRemoveListingFromCategory}
            onAddListingsToCategory={(catId, ids) => { setCategories(prev => prev.map(c => c.id === catId ? { ...c, listingIds: [...new Set([...c.listingIds, ...ids])] } : c)); onDirty?.() }}
            onToast={triggerToast}
            onClose={() => setCategoriesPanelOpen(false)}
          />
        )
      ) : (
        <>
          {/* Inject slice animation keyframes once */}
          <style>{`
            @keyframes cat-slice-grow {
              0%   { transform: scaleX(1); }
              30%  { transform: scaleX(1.18); }
              55%  { transform: scaleX(0.95); }
              75%  { transform: scaleX(1.07); }
              90%  { transform: scaleX(0.98); }
              100% { transform: scaleX(1); }
            }
            @keyframes cat-slice-icon-nudge {
              0%   { transform: translateX(0); }
              30%  { transform: translateX(-5px); }
              55%  { transform: translateX(2px); }
              75%  { transform: translateX(-2px); }
              90%  { transform: translateX(0.5px); }
              100% { transform: translateX(0); }
            }
            .cat-slice { transform-origin: right center; }
            .cat-slice:hover { animation: cat-slice-grow 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            .cat-slice:hover .cat-slice-icon { animation: cat-slice-icon-nudge 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            @keyframes cat-panel-in {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
          `}</style>

          {/* Slice — visible when panel is closed */}
          {!categoriesPanelOpen && (
            <button
              type="button"
              onClick={() => setCategoriesPanelOpen(true)}
              className="cat-slice shrink-0 w-5 rounded-xl border border-[#e9eaeb] bg-white flex items-center justify-center cursor-pointer"
              aria-label="Expand categories"
            >
              <span className="cat-slice-icon flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="#98a2b3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="6" y1="3" x2="6" y2="15"/>
                  <polyline points="10,6 13,9 10,12"/>
                </svg>
              </span>
            </button>
          )}

          {/* Panel — animates in, collapses via |< button in header */}
          {categoriesPanelOpen && (
            <div className="h-full" style={{ animation: 'cat-panel-in 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
              <CategoriesPanel
                compact
                categories={categories}
                selectedIds={selected}
                onCreateCategory={handleCreateCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                onAssignToCategory={handleAssignToCategory}
                onRemoveFromCategory={(catId, ids) => { setCategories(prev => prev.map(c => c.id === catId ? { ...c, listingIds: c.listingIds.filter(id => !ids.includes(id)) } : c)); triggerToast(ids.length === 1 ? '1 listing removed from listing label' : `${ids.length} listings removed from listing label`); onDirty?.() }}
                onRemoveListingFromCategory={handleRemoveListingFromCategory}
            onAddListingsToCategory={(catId, ids) => { setCategories(prev => prev.map(c => c.id === catId ? { ...c, listingIds: [...new Set([...c.listingIds, ...ids])] } : c)); onDirty?.() }}
                onToast={triggerToast}
                onClose={() => setCategoriesPanelOpen(false)}
              />
            </div>
          )}
        </>
      )}
      </div>{/* /flex row */}

      {/* Toast stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-2 items-end pointer-events-none">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={cn(
                'flex items-center gap-3 rounded-xl bg-white border border-[#e9eaeb] shadow-[0_8px_24px_rgba(0,0,0,0.12)] px-4 py-3 min-w-[260px] pointer-events-auto',
                'transition-transform duration-300 ease-in-out',
                toast.visible ? 'translate-x-0' : 'translate-x-[calc(100%+24px)]'
              )}
            >
              <img src={`${import.meta.env.BASE_URL}Featured icon outline.svg`} alt="" className="w-[38px] h-[38px] shrink-0" />
              <span className="text-[14px] font-medium text-[#181d27] flex-1">{toast.message}</span>
              <button onClick={() => dismissToast(toast.id)} className="text-[#98a2b3] hover:text-[#667085] transition-colors ml-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {showModal && <ListingSelectorModal onClose={() => setShowModal(false)} onAdd={handleAddSpecific} excludeIds={modalExcludeIds} />}

      {/* Exclude confirmation modal */}
      {showExcludeConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="w-[480px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden">
            <div className="px-6 pt-6 pb-5">
              <div className="relative mb-4 w-12 h-12">
                <div className="absolute inset-0 rounded-full bg-[#fef0c7] opacity-40 scale-[2]" />
                <div className="absolute inset-0 rounded-full bg-[#fef0c7] opacity-60 scale-[1.5]" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#fef0c7]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc6803" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
              </div>
              <p className="text-[16px] font-semibold text-[#101828] mb-1">
                Exclude {selected.size} listing{selected.size !== 1 ? 's' : ''}?
              </p>
              <p className="text-[14px] text-[#535862]">
                {selected.size === 1 ? 'This listing' : `${selected.size} listings`} will be hidden from your booking website immediately.
              </p>
            </div>
            <div className="flex items-center gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => setShowExcludeConfirm(false)}
                className="flex-1 rounded-lg border border-[#d0d5dd] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#344054] hover:bg-[#f9fafb] transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const count = selected.size
                  let removedAll = false
                  setListings(prev => {
                    const next = prev.filter(l => !selected.has(l.id))
                    if (next.length === 0) { setState('empty'); removedAll = true }
                    return next
                  })
                  setCategories(prev => prev.map(c => ({
                    ...c,
                    listingIds: c.listingIds.filter(id => !selected.has(id)),
                  })))
                  setSelected(new Set())
                  setShowExcludeConfirm(false)
                  triggerToast(count === 1 ? '1 listing excluded' : `${count} listings excluded`)
                  if (!removedAll) onDirty?.()
                }}
                className="flex-1 rounded-lg bg-[#d92d20] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#b42318] transition-colors shadow-sm"
              >
                Exclude
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlaceholderContent({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-48 text-[14px] text-[#717680]">
      {title} — coming soon
    </div>
  )
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export function BookingWebsiteEditor({ site, onBack }: { site: BookingWebsite; onBack: () => void }) {
  const [activeSection, setActiveSection] = useState('listings')
  const [isDirty, setIsDirty] = useState(false)
  const [status, setStatus] = useState<BWStatus>(site.status)
  const [listingsVariant, setListingsVariant] = useState<'A' | 'B' | 'C'>('C')
  const [pendingSection, setPendingSection] = useState<string | null>(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [editorToast, setEditorToast] = useState(false)
  const editorToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [editorToastVisible, setEditorToastVisible] = useState(false)

  const triggerEditorToast = () => {
    if (editorToastTimer.current) clearTimeout(editorToastTimer.current)
    setEditorToast(true)
    setEditorToastVisible(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setEditorToastVisible(true)))
    editorToastTimer.current = setTimeout(() => {
      setEditorToastVisible(false)
      setTimeout(() => setEditorToast(false), 320)
    }, 4000)
  }

  const handleNavSelect = (id: string) => {
    if (isDirty && id !== activeSection) {
      setPendingSection(id)
      setShowLeaveConfirm(true)
    } else {
      setActiveSection(id)
    }
  }

  const iconBtn = 'flex h-8 w-8 items-center justify-center rounded-lg text-[#a4a7ae] hover:text-[#667085] hover:bg-[#f9fafb] transition-colors'

  return (
    <div className="flex min-h-0 flex-1 gap-[10px] overflow-hidden">
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e9eaeb] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.05)]">

        {/* Header */}
        <header className="border-b border-[#e9eaeb] px-6 pt-4 pb-3 shrink-0">

          {/* Row 1: back · preview toggle */}
          <div className="flex min-h-[32px] items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-[14px] leading-5 text-[#414651] hover:text-[#181d27] transition-colors pointer-events-none"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              Back to Booking Websites
            </button>
            <button type="button" aria-label="Toggle preview" className={cn(iconBtn, 'pointer-events-none')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>
              </svg>
            </button>
          </div>

          {/* Row 2: title */}
          <h1 className="mt-1 text-[20px] font-semibold leading-[30px] text-[#181d27]">{site.name}</h1>

          {/* Row 3: meta · actions */}
          <div className="mt-2 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-x-3 overflow-hidden">
              <BWStatusBadge status={status} />
              <span className="text-[14px] leading-5 text-[#535861] whitespace-nowrap">Plan Standard</span>
              {site.website && (
                <span className="text-[14px] leading-5 text-[#535861] whitespace-nowrap">Site {site.website}</span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="text-[14px] font-medium text-[#414651] hover:text-[#181d27] px-2 py-1.5 transition-colors pointer-events-none"
              >
                Upgrade
              </button>
              <Button
                type="button"
                variant="outline"
                disabled={!isDirty}
                className="gap-1.5"
                onClick={() => { setIsDirty(false); triggerEditorToast() }}
              >
                <Save01 className="h-4 w-4 shrink-0" aria-hidden />
                Save
              </Button>
              <Button
                type="button"
                className="gap-1.5 pointer-events-none"
                onClick={() => setStatus('Published')}
              >
                <Rocket01 className="h-4 w-4 shrink-0" aria-hidden />
                Publish
              </Button>
              <button type="button" aria-label="More actions" className={cn(iconBtn, 'pointer-events-none')}>
                <DotsVertical className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <BWLeftNav activeId={activeSection} onSelect={handleNavSelect} listingsVariant={listingsVariant} onToggleVariant={setListingsVariant} />

          <div className={cn(
            'min-h-0 min-w-0 flex-1 px-8',
            activeSection === 'listings'
              ? 'overflow-hidden flex flex-col py-6 pb-4'
              : 'overflow-y-auto py-8 pb-12'
          )}>
            {activeSection === 'design' && (
              <div className="mx-auto max-w-[640px]">
                <DesignSection />
              </div>
            )}
            {activeSection === 'listings' && <ListingsSectionB onDirty={() => setIsDirty(true)} />}
            {activeSection.startsWith('pages-') && <PlaceholderContent title="Pages" />}
            {activeSection.startsWith('settings-') && <PlaceholderContent title="Settings" />}
            {activeSection.startsWith('translations-') && <PlaceholderContent title="Translations" />}
            {activeSection.startsWith('scripts-') && <PlaceholderContent title="Scripts & Widgets" />}
          </div>
        </div>
      </section>

      {/* Save toast */}
      {editorToast && (
        <div className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-white border border-[#e9eaeb] shadow-[0_8px_24px_rgba(0,0,0,0.12)] px-4 py-3 min-w-[260px]',
          'transition-transform duration-300 ease-in-out',
          editorToastVisible ? 'translate-x-0' : 'translate-x-[calc(100%+24px)]'
        )}>
          <img src={`${import.meta.env.BASE_URL}Featured icon outline.svg`} alt="" className="w-[38px] h-[38px] shrink-0" />
          <span className="text-[14px] font-medium text-[#181d27] flex-1">Changes saved</span>
          <button onClick={() => { setEditorToastVisible(false); setTimeout(() => setEditorToast(false), 320) }} className="text-[#98a2b3] hover:text-[#667085] transition-colors ml-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Leave without saving confirmation */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40">
          <div className="w-[440px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden">
            <div className="px-6 pt-6 pb-5">
              <p className="text-[16px] font-semibold text-[#101828] mb-1">Leave without saving?</p>
              <p className="text-[14px] text-[#535862] leading-[22px]">You have unsaved changes to your listings and filters. They will be lost if you navigate away.</p>
            </div>
            <div className="flex items-center gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 h-10 rounded-lg border border-[#d0d5dd] bg-white text-[14px] font-semibold text-[#344054] hover:bg-[#f9fafb] transition-colors shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pendingSection) setActiveSection(pendingSection)
                  setIsDirty(false)
                  setPendingSection(null)
                  setShowLeaveConfirm(false)
                }}
                className="flex-1 h-10 rounded-lg bg-[#d92d20] text-[14px] font-semibold text-white hover:bg-[#b42318] transition-colors"
              >
                Leave without saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
