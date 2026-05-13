import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell, PageHeader } from '@/components/channel-manager'
import { Button } from '@/components/ui'
import { BookingWebsiteEditor, type BookingWebsite } from './BookingWebsiteEditor'

// ─── Mock data ────────────────────────────────────────────────────────────────

const BW_MOCK: BookingWebsite[] = [
  { id: '1', name: "Varduhi's Booking Portal", status: 'Published', website: 'varduhi.com',            listings: 12, lastPublished: 'Apr 22, 2026' },
  { id: '2', name: "Gaby's website",           status: 'Draft',     website: null,                    listings: 0,  lastPublished: null            },
  { id: '3', name: "Julia's guest portal",     status: 'Published', website: 'juliasguestportal.com',  listings: 6,  lastPublished: 'Apr 15, 2026'  },
  { id: '4', name: 'Travel Solutions',         status: 'Draft',     website: null,                    listings: 4,  lastPublished: null            },
]

// ─── Status badge ─────────────────────────────────────────────────────────────

function BWStatusBadge({ status }: { status: BookingWebsite['status'] }) {
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

function IconExternalLink() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

// ─── Tab content ──────────────────────────────────────────────────────────────

function BookingTab({ onRowClick }: { onRowClick: (site: BookingWebsite) => void }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#fafafa] border-b border-[#e9eaeb]">
            <th className="px-6 py-3 text-left text-[12px] font-semibold leading-[18px] text-[#414651] w-full">Name</th>
            <th className="px-6 py-3 text-left text-[12px] font-semibold leading-[18px] text-[#414651] whitespace-nowrap">Status</th>
            <th className="px-6 py-3 text-left text-[12px] font-semibold leading-[18px] text-[#414651] whitespace-nowrap">Website</th>
            <th className="px-6 py-3 text-left text-[12px] font-semibold leading-[18px] text-[#414651] whitespace-nowrap">Listings</th>
            <th className="px-6 py-3 text-left text-[12px] font-semibold leading-[18px] text-[#414651] whitespace-nowrap">Last published</th>
          </tr>
        </thead>
        <tbody>
          {BW_MOCK.map(site => (
            <tr
              key={site.id}
              onClick={() => onRowClick(site)}
              className="h-[72px] border-b border-[#e9eaeb] hover:bg-[#fafafa] transition-colors cursor-pointer"
            >
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
                  <span className="text-[14px] leading-[20px] text-[#98a2b3]">Not published</span>
                )}
              </td>
              <td className="px-6 whitespace-nowrap">
                <span className="text-[14px] leading-[20px] text-[#535861]">{site.listings}</span>
              </td>
              <td className="px-6 whitespace-nowrap">
                <span className="text-[14px] leading-[20px] text-[#535861]">{site.lastPublished ?? '—'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center text-[14px] text-[#717680]">
      {label} — coming soon
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type BWTab = 'booking' | 'website' | 'listing'

export function BookingWebsiteSettingsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<BWTab>('booking')
  const [editingSite, setEditingSite] = useState<BookingWebsite | null>(null)

  const handleSidebarNav = (i: number) => {
    if (i === 9) navigate('/guest-hub')
    else if (i !== 10) navigate('/')
  }

  if (editingSite) {
    return (
      <PageShell sidebarActiveIndex={10} onSidebarSelectItem={handleSidebarNav}>
        <BookingWebsiteEditor site={editingSite} onBack={() => setEditingSite(null)} />
      </PageShell>
    )
  }

  const headerEnd = tab === 'booking' ? (
    <Button variant="primary">New website</Button>
  ) : null

  return (
    <PageShell sidebarActiveIndex={10} onSidebarSelectItem={handleSidebarNav}>
      <div className="flex-1 bg-white rounded-xl flex flex-col min-h-0 overflow-hidden border border-[#eceef2]">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <PageHeader
            embedded
            title="Booking website settings"
            tabs={[
              { key: 'booking', label: 'Booking' },
              { key: 'website', label: 'Website' },
              { key: 'listing', label: 'Listing' },
            ]}
            activeTabKey={tab}
            onTabChange={(key: string) => setTab(key as BWTab)}
            headerEnd={headerEnd}
            showTabCounts={false}
          />
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {tab === 'booking' && <BookingTab onRowClick={setEditingSite} />}
            {tab === 'website' && <PlaceholderTab label="Website" />}
            {tab === 'listing' && <PlaceholderTab label="Listing" />}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
