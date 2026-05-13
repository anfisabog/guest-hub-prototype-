import { useEffect, useMemo, useState } from 'react'
import { Modal, Checkbox, Button } from '@/components/ui'
import type { ChannelConfig } from '@/types/channel'
import type { ChannelListingStatus, Listing } from '@/types/channel'
import { HostawayAvatarCircle } from './TableColumnAvatar'

const EXPORT_CANDIDATE_NAMES = [
  'Sunset Villa', 'Mountain Lodge', 'Beach House', 'City Loft', 'Garden Cottage',
  'Lakeside Retreat', 'Downtown Studio', 'Riverside Apartment', 'Park View Suite', 'Harbor Penthouse',
  'Alpine Cabin', 'Coastal Bungalow', 'Skyline Terrace', 'Forest Hideaway', 'Urban Oasis',
  'Seaside Escape', 'Hilltop Manor', 'Canal House', 'Plaza Residence', 'Meadow View',
]

function generateRandomExportCandidates(count: number): Array<{ id: string; name: string }> {
  const names = [...EXPORT_CANDIDATE_NAMES].sort(() => Math.random() - 0.5)
  return Array.from({ length: count }, (_, i) => {
    const name = names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : '')
    const id = `export-cand-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`
    return { id, name }
  })
}

export interface ExportModalProps {
  open: boolean
  onClose: () => void
  channel: ChannelConfig
  listings: Listing[]
  onExport: (
    listingIds: string[],
    visibilityById: Record<string, ChannelListingStatus>,
    newListings?: Array<{ id: string; name: string }>
  ) => void
}

export function ExportModal({ open, onClose, channel, listings, onExport }: ExportModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [visibilityById, setVisibilityById] = useState<Record<string, ChannelListingStatus>>({})

  const generatedCandidates = useMemo(
    () => (open ? generateRandomExportCandidates(10) : []),
    [open]
  )

  const displayListings = useMemo<Listing[]>(() => {
    const existingIds = new Set(listings.map((l) => l.id))
    const newOnes: Listing[] = generatedCandidates
      .filter((c) => !existingIds.has(c.id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        channelId: channel.id,
        accountId: '',
        integrationStatus: 'not_in_hostaway' as const,
        channelStatus: 'live' as const,
        channelListingId: `HA-${c.id.slice(-6)}`,
      }))
    return [...listings, ...newOnes]
  }, [listings, generatedCandidates, channel.id])

  useEffect(() => {
    if (!open) return
    setVisibilityById((prev) => {
      const next = { ...prev }
      displayListings.forEach((listing) => {
        if (!next[listing.id]) next[listing.id] = 'hidden_from_guests'
      })
      return next
    })
  }, [open, displayListings])

  const handleExport = () => {
    const selectedVisibility = Object.fromEntries(
      Array.from(selectedIds).map((id) => [id, visibilityById[id] ?? 'hidden_from_guests'])
    ) as Record<string, ChannelListingStatus>
    onExport(Array.from(selectedIds), selectedVisibility, generatedCandidates)
    setSelectedIds(new Set())
    onClose()
  }

  const handleClose = () => {
    setSelectedIds(new Set())
    onClose()
  }

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return displayListings
    return displayListings.filter((listing) => listing.name.toLowerCase().includes(q))
  }, [displayListings, search])

  const selectableFilteredListings = useMemo(
    () => filteredListings.filter((listing) => listing.integrationStatus !== 'missing_requirements'),
    [filteredListings]
  )

  const allSelected =
    selectableFilteredListings.length > 0 &&
    selectableFilteredListings.every((listing) => selectedIds.has(listing.id))

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        selectableFilteredListings.forEach((listing) => next.delete(listing.id))
      } else {
        selectableFilteredListings.forEach((listing) => next.add(listing.id))
      }
      return next
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Export listings to ${channel.name}`} size="full">
      <div className="flex flex-col h-full">
        <div className="pb-4">
          <h3 className="text-[18px] leading-7 font-semibold text-[#181d27]">Select listings to export</h3>
          <p className="mt-1 text-[14px] leading-5 text-[#535862]">
            These Hostaway listings aren&apos;t on this {channel.name} account yet. Select the ones you want to
            publish. If a listing is missing required data, you&apos;ll need to add it before publishing.
          </p>
        </div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#d5d7da] bg-white px-3 text-[14px] font-semibold leading-5 text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)]"
          >
            <svg className="w-5 h-5 text-[#717680]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            Filter
          </button>
          <div className="relative w-[280px] max-w-full">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717680]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name"
              className="h-9 w-full rounded-lg border border-[#d5d7da] bg-white pl-10 pr-3 text-[14px] leading-5 text-[#181d27] outline-none placeholder:text-[#717680]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto border border-[#e9eaeb] rounded-lg">
          <table className="w-full min-w-[980px] table-fixed border-collapse">
            <colgroup>
              <col style={{ width: 48 }} />
              <col style={{ width: 280 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 220 }} />
              <col style={{ width: 152 }} />
            </colgroup>
            <thead>
              <tr className="border-b border-[#e9eaeb] bg-[#f6f9fc]">
                <th className="sticky left-0 z-30 w-12 px-4 py-3 text-left bg-[#f6f9fc]">
                  <Checkbox checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="sticky left-12 z-30 pl-0 pr-6 py-3 text-left text-[12px] leading-[18px] font-semibold text-[#414651] bg-[#f6f9fc]">
                  <div className="flex items-center" style={{ gap: 6 }}>
                    <HostawayAvatarCircle size={18} />
                    <span>Hostaway listing</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-[12px] leading-[18px] font-semibold text-[#414651]">
                  Hostaway ID
                </th>
                <th className="px-6 py-3 text-left text-[12px] leading-[18px] font-semibold text-[#414651]">
                  Publish status
                </th>
                <th className="px-6 py-3 text-left text-[12px] leading-[18px] font-semibold text-[#414651]">
                  Visibility
                </th>
                <th className="px-6 py-3 text-left text-[12px] leading-[18px] font-semibold text-[#414651]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.map((listing) => {
                const isMissing = listing.integrationStatus === 'missing_requirements'
                const isSelected = selectedIds.has(listing.id)
                const hostawayId = listing.hostawayId ?? listing.channelListingId ?? '123456111'
                return (
                <tr key={listing.id} className="group h-[72px] border-b border-[#e9eaeb]">
                  <td className="sticky left-0 z-20 w-12 px-4 py-3 bg-white group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">
                    <Checkbox
                      checked={selectedIds.has(listing.id)}
                      onChange={() => toggleRow(listing.id)}
                      disabled={isMissing}
                    />
                  </td>
                  <td className="sticky left-12 z-20 pl-0 pr-6 py-3 bg-white group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">
                    <span className="text-[14px] leading-5 font-medium text-[#181d27]">{listing.name}</span>
                  </td>
                  <td className="bg-white px-6 py-3 text-[14px] leading-5 text-[#535862] group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">{hostawayId}</td>
                  <td className="bg-white px-6 py-3 group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">
                    {isMissing ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#fecdca] bg-[#fef3f2] px-2 py-0.5 text-[12px] font-medium leading-[18px] text-[#f04438]">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        Missing requirements
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#abefc6] bg-[#ecfdf3] px-2 py-0.5 text-[12px] font-medium leading-[18px] text-[#067647]">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        Ready to export
                      </span>
                    )}
                  </td>
                  <td className="bg-white px-6 py-3 group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">
                    <select
                      value={visibilityById[listing.id] ?? 'hidden_from_guests'}
                      onChange={(event) =>
                        setVisibilityById((prev) => ({
                          ...prev,
                          [listing.id]: event.target.value as ChannelListingStatus,
                        }))
                      }
                      disabled={!isSelected}
                      className={`inline-flex h-9 w-full max-w-full min-w-0 items-center gap-1 rounded-lg border border-[#d5d7da] bg-white px-3 py-0 text-[14px] leading-5 text-[#181d27] outline-none ${!isSelected ? 'invisible' : ''}`}
                    >
                      <option value="hidden_from_guests">Hidden from guests</option>
                      <option value="live">Live</option>
                    </select>
                  </td>
                  <td className="bg-white px-6 py-3 group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">
                    {isMissing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        disabled
                      >
                        See what&apos;s missing
                      </Button>
                    ) : (
                      <span className="text-[14px] leading-5 text-[#98a2b3]">—</span>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#e9eaeb]">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} of {filteredListings.length} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={selectedIds.size === 0}>
              {`Export ${selectedIds.size} listings`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
