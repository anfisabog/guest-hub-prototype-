import { Link } from 'react-router-dom'
import { ChannelIcon } from './ChannelIcon'
import { Checkbox as UiCheckbox } from '@/components/ui'
import { getChannelById } from '@/config/channels'
import type { ConnectedAccount } from '@/types/channel'
import { TableRowActions } from './TableRowActions'
import { ExportIcon } from './ActionIcons'

export interface AccountTableRow {
  account: ConnectedAccount
  totalListings: number
  listingsInHostaway: number
  listingsNotInHostaway: number
}

interface AccountTableProps {
  rows: AccountTableRow[]
  selectedAccountIds: Set<string>
  allPageSelected: boolean
  somePageSelected: boolean
  onToggleSelectAll: () => void
  onToggleRowSelection: (accountId: string) => void
  onExportAccount: (accountId: string) => void
  onRemoveAccount: (accountId: string) => void
}

export function AccountTable({
  rows,
  selectedAccountIds,
  allPageSelected,
  somePageSelected,
  onToggleSelectAll,
  onToggleRowSelection,
  onExportAccount,
  onRemoveAccount,
}: AccountTableProps) {
  const visibleCount = rows.length

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[1180px] table-fixed border-collapse">
          <colgroup>
            <col style={{ width: 52 }} />
            <col style={{ width: 280 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 180 }} />
            <col style={{ width: 180 }} />
            <col style={{ width: 180 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 120 }} />
          </colgroup>
          <thead>
            <tr className="bg-[#f6f9fc] border-b border-[#e9eaeb]">
              <th className="sticky top-0 left-0 z-30 h-11 pl-6 pr-3 text-center bg-[#f6f9fc]">
                <span className="flex h-5 w-5 items-center justify-center mx-auto">
                  <UiCheckbox
                    isIndeterminate={somePageSelected && !allPageSelected}
                    checked={allPageSelected}
                    onChange={onToggleSelectAll}
                    aria-label="Select all accounts on current page"
                  />
                </span>
              </th>
              <th className="sticky top-0 left-[52px] z-30 h-11 pl-0 pr-6 text-left text-[12px] leading-[18px] font-semibold text-[#414651] bg-[#f6f9fc]">
                Account
              </th>
              <th className="sticky top-0 z-10 h-11 px-6 text-left text-[12px] leading-[18px] font-semibold text-[#414651] bg-[#f6f9fc]">
                Channel
              </th>
              <th className="sticky top-0 z-10 h-11 px-6 text-left text-[12px] leading-[18px] font-semibold text-[#414651] bg-[#f6f9fc]">Connection status</th>
              <th className="sticky top-0 z-10 h-11 px-6 text-left text-[12px] leading-[18px] font-semibold text-[#414651] bg-[#f6f9fc]">Account listings</th>
              <th className="sticky top-0 z-10 h-11 px-6 text-left text-[12px] leading-[18px] font-semibold text-[#414651] bg-[#f6f9fc]">Listings in Hostaway</th>
              <th className="sticky top-0 z-10 h-11 px-6 text-left text-[12px] leading-[18px] font-semibold text-[#414651] bg-[#f6f9fc]">Listings not in Hostaway</th>
              <th className="sticky top-0 right-0 z-30 bg-[#f6f9fc]" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const channel = getChannelById(row.account.channelId)
              return (
                <tr key={row.account.id} className="group h-[72px] border-b border-[#e9eaeb]">
                  <td className="sticky left-0 z-20 pl-6 pr-3 text-center bg-white group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">
                    <span className="flex h-5 w-5 items-center justify-center mx-auto">
                      <UiCheckbox
                        checked={selectedAccountIds.has(row.account.id)}
                        onChange={() => onToggleRowSelection(row.account.id)}
                        aria-label={`Select ${row.account.accountName}`}
                      />
                    </span>
                  </td>
                  <td className="sticky left-[52px] z-20 pl-0 pr-6 bg-white group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">
                    <Link to={`/accounts/${row.account.id}`} className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-white border border-[#e9eaeb] flex items-center justify-center overflow-hidden">
                        {row.account.avatarUrl ? (
                          <img
                            src={row.account.avatarUrl}
                            alt={row.account.accountName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[12px] font-semibold text-[#535862]">
                            {row.account.accountName?.[0] ?? '?'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 truncate">
                        <p className="text-[14px] leading-5 font-semibold text-[#0086a8] truncate">{row.account.accountName}</p>
                        <p className="text-[14px] leading-5 font-normal text-[#535862] truncate">{row.account.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6">
                    {channel && (
                      <div className="inline-flex items-center gap-1.5">
                        <ChannelIcon channelId={row.account.channelId} size={24} />
                        <span className="text-[14px] leading-5 text-[#535862]">{channel.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6">
                    {row.account.status === 'connected' ? (
                      <span className="inline-flex rounded-full border px-2 py-0.5 text-[12px] leading-[18px] font-medium bg-[#ecfdf3] border-[#abefc6] text-[#067647]">
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-[#fedf89] bg-[#fffaeb] px-2 py-0.5 text-[12px] font-medium leading-[18px] text-[#b54708]">
                        Not connected
                      </span>
                    )}
                  </td>
                  <td className="px-6 text-[14px] leading-5 text-[#535862]">{row.totalListings}</td>
                  <td className="px-6 text-[14px] leading-5 text-[#535862]">{row.listingsInHostaway}</td>
                  <td className="px-6 text-[14px] leading-5 text-[#535862]">{row.listingsNotInHostaway}</td>
                  <td className="sticky right-0 z-20 px-6 relative bg-white group-hover:bg-[#f6f9fc] transition-[background-color] duration-[120ms] ease-[var(--motion-ease-default)]">
                    <div className="absolute inset-y-0 -left-6 w-6 bg-gradient-to-l from-white to-transparent group-hover:from-[#f6f9fc]" />
                    <TableRowActions
                      actions={[
                        {
                          label: `Export ${row.account.accountName}`,
                          onClick: () => onExportAccount(row.account.id),
                          icon: <ExportIcon />,
                        },
                        {
                          label: `Remove ${row.account.accountName}`,
                          onClick: () => onRemoveAccount(row.account.id),
                          icon: (
                            <svg className="block w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14" />
                            </svg>
                          ),
                        },
                      ]}
                    />
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="h-24 text-center text-[14px] text-[#717680]">
                  No connected accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex h-12 shrink-0 items-center justify-between border-t border-[#e9eaeb] bg-white px-6">
        <p className="text-[14px] leading-5 text-[#535862]">
          {visibleCount} {visibleCount === 1 ? 'account' : 'accounts'}
        </p>
        <p className="text-[14px] leading-5 text-[#535862]">Page 1 of 1</p>
      </div>
    </div>
  )
}
