import { Checkbox as UiCheckbox } from '@/components/ui'
import { getChannelById } from '@/config/channels'
import type { Listing } from '@/types/channel'
import { AirbnbStatusBadge, StatusBadge } from './StatusBadge'
import { ChannelAvatarCircle, HostawayAvatarCircle } from './TableColumnAvatar'
import { ListingRowActions } from './ListingRowActions'

interface ListingsTableProps {
  channelId?: string
  rows: Listing[]
  selectedIds: Set<string>
  allSelected: boolean
  someSelected: boolean
  onToggleSelectAll: () => void
  onToggleRowSelection: (listingId: string) => void
  onImportSingle: (listingId: string) => void
  onConnectSingle: (listingId: string) => void
  onDisconnectSingle: (listingId: string) => void
  onToggleVisibility: (listingId: string) => void
}

export function ListingsTable({
  channelId: channelIdProp,
  rows,
  selectedIds,
  allSelected,
  someSelected,
  onToggleSelectAll,
  onToggleRowSelection,
  onImportSingle,
  onConnectSingle,
  onDisconnectSingle,
  onToggleVisibility,
}: ListingsTableProps) {
  const channelId = channelIdProp ?? rows[0]?.channelId ?? 'airbnb'
  const channel = getChannelById(channelId)

  const getChannelListingId = (row: Listing, index: number) => row.channelListingId ?? `1234561${String(11 + index)}`

  const getHostawayName = (row: Listing) => {
    if (row.hostawayName) return row.hostawayName
    if (row.integrationStatus === 'connected') return row.name
    if (row.integrationStatus === 'importing') return 'Creating listing in Hostaway...'
    return '-'
  }

  const getHostawayId = (row: Listing, index: number) => {
    if (row.hostawayId) return row.hostawayId
    if (row.integrationStatus === 'connected') return `1231231241${String(20 + index)}`
    return '-'
  }

  return (
    <div className="mt-2 rounded-xl border border-[#e9eaeb] overflow-auto">
      <table className="w-full min-w-[1268px] border-collapse table-fixed">
        <colgroup>
          <col style={{ width: 320 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 180 }} />
          <col style={{ width: 160 }} />
          <col style={{ width: 320 }} />
          <col style={{ width: 160 }} />
          <col style={{ width: 120 }} />
        </colgroup>
        <thead>
          <tr className="border-b border-[#e9eaeb]">
            <th className="sticky left-0 z-30 h-11 bg-[#f6f9fc] px-3 text-left">
              <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center shrink-0">
                  <UiCheckbox
                    isIndeterminate={someSelected}
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    aria-label="Select all listings"
                  />
                </span>
                {channel ? (
                  <div className="flex items-center" style={{ gap: 6 }}>
                    <ChannelAvatarCircle channelId={channelId} size={18} />
                    <span className="text-[12px] leading-[18px] font-semibold text-[#414651]">
                      {channel.name} listing
                    </span>
                  </div>
                ) : (
                  <span className="text-[12px] leading-[18px] font-semibold text-[#414651]">Airbnb listing</span>
                )}
              </div>
            </th>
            <th className="h-11 bg-[#f6f9fc] px-6 text-left text-[12px] leading-[18px] font-semibold text-[#717680]">
              {channel ? `${channel.name} ID` : 'Airbnb ID'}
            </th>
            <th className="h-11 bg-[#f6f9fc] px-6 text-left text-[12px] leading-[18px] font-semibold text-[#717680]">
              {channel ? `${channel.name} status` : 'Airbnb status'}
            </th>
            <th className="h-11 bg-[#f6f9fc] px-6 text-left text-[12px] leading-[18px] font-semibold text-[#717680]">
              Integration Status
            </th>
            <th className="h-11 bg-[#f6f9fc] px-6 text-left text-[12px] leading-[18px] font-semibold text-[#717680]">
              <div className="flex items-center" style={{ gap: 6 }}>
                <HostawayAvatarCircle size={18} />
                <span className="text-[#414651]">Hostaway listing</span>
              </div>
            </th>
            <th className="h-11 bg-[#f6f9fc] px-6 text-left text-[12px] leading-[18px] font-semibold text-[#717680]">
              Hostaway ID
            </th>
            <th className="sticky right-0 z-30 h-11 bg-[#f6f9fc]" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const hostawayName = getHostawayName(row)
            const hostawayId = getHostawayId(row, index)
            return (
              <tr key={row.id} className="group h-[72px] border-b border-[#e9eaeb]">
                <td className="sticky left-0 z-20 bg-white px-3 group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">
                  <div className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center shrink-0">
                      <UiCheckbox
                        checked={selectedIds.has(row.id)}
                        onChange={() => onToggleRowSelection(row.id)}
                        aria-label={`Select ${row.name}`}
                      />
                    </span>
                    <span className="text-[14px] leading-5 font-medium text-[#181d27]">{row.name}</span>
                  </div>
                </td>
                <td className="bg-white px-6 text-[14px] leading-5 text-[#535862] group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">
                  {getChannelListingId(row, index)}
                </td>
                <td className="bg-white px-6 group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">
                  <AirbnbStatusBadge
                    status={row.channelStatus ?? 'live'}
                    muted={row.integrationStatus === 'pending_export' || row.integrationStatus === 'exporting'}
                  />
                </td>
                <td className="bg-white px-6 group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">
                  <StatusBadge status={row.integrationStatus} />
                </td>
                <td className="bg-white px-6 text-[14px] leading-5 group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">
                  <span className={row.integrationStatus === 'importing' ? 'italic text-[#717680]' : 'text-[#181d27]'}>
                    {hostawayName}
                  </span>
                </td>
                <td className="bg-white px-6 text-[14px] leading-5 text-[#535862] group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">
                  {hostawayId}
                </td>
                <td className="sticky right-0 z-20 bg-white px-6 relative group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">
                  <div className="absolute inset-y-0 -left-6 w-6 bg-gradient-to-l from-white to-transparent group-hover:from-[#f6f9fc]" />
                  <div className="absolute inset-y-0 right-6 inline-flex items-center gap-0.5 opacity-0 pointer-events-none transition-opacity duration-[120ms] ease-[var(--motion-ease-default)] motion-reduce:transition-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
                    <ListingRowActions
                      integrationStatus={row.integrationStatus}
                      channelStatus={row.channelStatus}
                      onImport={() => onImportSingle(row.id)}
                      onConnect={() => onConnectSingle(row.id)}
                      onDisconnect={() => onDisconnectSingle(row.id)}
                      onToggleVisibility={() => onToggleVisibility(row.id)}
                    />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
