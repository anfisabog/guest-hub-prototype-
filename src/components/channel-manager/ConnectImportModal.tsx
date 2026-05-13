import { useEffect, useMemo, useState } from 'react'
import { Button, Modal } from '@/components/ui'
import type { ChannelConfig } from '@/types/channel'
import type { ChannelListingStatus } from '@/types/channel'
import type { ConnectionCandidateRow } from '@/lib/connectionCandidates'
import { ChannelAvatarCircle, HostawayAvatarCircle } from './TableColumnAvatar'

type RowAction = 'import' | 'map' | 'do_nothing'

interface HostawayOption {
  id: string
  name: string
}

export interface ConnectionFinalizePlan {
  rowId: string
  action: RowAction
  mappedHostawayName?: string
}

interface ConnectImportModalProps {
  open: boolean
  onClose: () => void
  channel: ChannelConfig
  rows: ConnectionCandidateRow[]
  hostawayOptions: HostawayOption[]
  onFinalize: (plans: ConnectionFinalizePlan[]) => void
}

function ChannelStatusChip({ status }: { status: ChannelListingStatus }) {
  const label = status === 'hidden_from_guests' ? 'Hidden from guests' : status === 'action_required' ? 'Action required' : 'Live'
  const dot =
    status === 'hidden_from_guests'
      ? 'bg-[#f79009]'
      : status === 'action_required'
        ? 'bg-[#f04438]'
        : 'bg-[#17b26a]'

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#d5d7da] bg-white px-2 py-0.5 text-[12px] leading-[18px] text-[#344054]">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

export function ConnectImportModal({
  open,
  onClose,
  channel,
  rows,
  hostawayOptions,
  onFinalize,
}: ConnectImportModalProps) {
  const isBookingOrVrbo = channel.id === 'booking' || channel.id === 'vrbo'
  const [actionByRowId, setActionByRowId] = useState<Record<string, RowAction>>({})
  const [mapByRowId, setMapByRowId] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return

    const initialActions: Record<string, RowAction> = {}
    const initialMaps: Record<string, string> = {}

    rows.forEach((row, index) => {
      if (isBookingOrVrbo) {
        if (index === 0) {
          initialActions[row.id] = 'import'
          return
        }
        initialActions[row.id] = 'map'
        const siblingOption = hostawayOptions[index]?.name
        const exactMatch = hostawayOptions.find((option) => option.name.toLowerCase() === row.name.toLowerCase())?.name
        initialMaps[row.id] = exactMatch ?? siblingOption ?? row.name
      } else {
        initialActions[row.id] = 'import'
        const exactMatch = hostawayOptions.find((option) => option.name.toLowerCase() === row.name.toLowerCase())?.name
        const siblingOption = hostawayOptions[index]?.name
        initialMaps[row.id] = exactMatch ?? siblingOption ?? row.name
      }
    })

    setActionByRowId(initialActions)
    setMapByRowId(initialMaps)
  }, [open, rows, hostawayOptions, isBookingOrVrbo])

  const plans = useMemo<ConnectionFinalizePlan[]>(() => {
    return rows.map((row, index) => {
      const defaultAction = isBookingOrVrbo ? (index === 0 ? 'import' : 'map') : 'import'
      const action = actionByRowId[row.id] ?? defaultAction

      const siblingOption = hostawayOptions[index]?.name
      const exactMatch = hostawayOptions.find((option) => option.name.toLowerCase() === row.name.toLowerCase())?.name
      const defaultMappedName = exactMatch ?? siblingOption ?? row.name

      return {
        rowId: row.id,
        action,
        mappedHostawayName: action === 'map' ? mapByRowId[row.id] ?? defaultMappedName : undefined,
      }
    })
  }, [rows, actionByRowId, mapByRowId, hostawayOptions, isBookingOrVrbo])

  const handleFinalize = () => {
    onFinalize(plans)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Map & Import listings to ${channel.name}`} size="full">
      <div className="flex flex-col h-full">
        <div className="pb-4">
          <h3 className="text-[18px] leading-7 font-semibold text-[#181d27]">
            Select how to handle listings from this account
          </h3>
          <p className="mt-1 text-[14px] leading-5 text-[#535862]">
            Choose whether each channel listing should be imported as new, mapped to an existing Hostaway listing,
            or ignored for now.
          </p>
        </div>

        <div className="flex-1 overflow-auto border border-[#e9eaeb] rounded-lg">
          <table className="w-full min-w-[980px] table-fixed border-collapse">
            <colgroup>
              <col style={{ width: 280 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 300 }} />
            </colgroup>
            <thead>
              <tr className="border-b border-[#e9eaeb] bg-[#f6f9fc]">
                <th className="sticky left-0 z-30 bg-[#f6f9fc] px-6 py-3 text-left text-[12px] leading-[18px] font-semibold text-[#414651]">
                  <div className="flex items-center" style={{ gap: 6 }}>
                    <ChannelAvatarCircle channelId={channel.id} size={18} />
                    <span>{channel.name} listing</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-[12px] leading-[18px] font-semibold text-[#414651]">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-[12px] leading-[18px] font-semibold text-[#414651]">
                  {channel.name} status
                </th>
                <th className="px-6 py-3 text-left text-[12px] leading-[18px] font-semibold text-[#414651]">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-[12px] leading-[18px] font-semibold text-[#414651]">
                  <div className="flex items-center" style={{ gap: 6 }}>
                    <HostawayAvatarCircle size={18} />
                    <span>Hostaway listing</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rowIndex = rows.findIndex((candidate) => candidate.id === row.id)
                const defaultAction = isBookingOrVrbo ? (rowIndex === 0 ? 'import' : 'map') : 'import'
                const action = actionByRowId[row.id] ?? defaultAction
                const siblingOption = hostawayOptions[rowIndex]?.name
                const exactMatch = hostawayOptions.find((option) => option.name.toLowerCase() === row.name.toLowerCase())?.name
                const selectedMap = mapByRowId[row.id] ?? exactMatch ?? siblingOption ?? row.name
                return (
                  <tr key={row.id} className="border-b border-[#e9eaeb]">
                    <td className="sticky left-0 z-20 bg-white px-6 py-3 text-[14px] leading-5 text-[#181d27]">
                      {row.name}
                    </td>
                    <td className="px-6 py-3 text-[14px] leading-5 text-[#535862]">{row.channelListingId}</td>
                    <td className="px-6 py-3">
                      <ChannelStatusChip status={row.channelStatus} />
                    </td>
                    <td className="px-6 py-3">
                      <select
                        value={action}
                        onChange={(event) => {
                          const nextAction = event.target.value as RowAction
                          setActionByRowId((prev) => ({ ...prev, [row.id]: nextAction }))

                          if (nextAction === 'map') {
                            setMapByRowId((prev) => {
                              if (prev[row.id]) return prev
                              const sibling = hostawayOptions[rowIndex]?.name
                              const exact = hostawayOptions.find((option) => option.name.toLowerCase() === row.name.toLowerCase())?.name
                              return {
                                ...prev,
                                [row.id]: exact ?? sibling ?? row.name,
                              }
                            })
                          }
                        }}
                        className="inline-flex h-9 items-center rounded-lg border border-[#d5d7da] bg-white px-3 py-0 text-[14px] leading-5 text-[#181d27] outline-none"
                      >
                        <option value="import">Import</option>
                        <option value="map">Map</option>
                        <option value="do_nothing">Do nothing</option>
                      </select>
                    </td>
                    <td className="px-6 py-3">
                      {action === 'map' ? (
                        <select
                          value={selectedMap}
                          onChange={(event) =>
                            setMapByRowId((prev) => ({
                              ...prev,
                              [row.id]: event.target.value,
                            }))
                          }
                          className="inline-flex h-9 min-w-[280px] items-center rounded-lg border border-[#d5d7da] bg-white px-3 py-0 text-[14px] leading-5 text-[#181d27] outline-none"
                        >
                          {[{ id: 'same-name', name: row.name }, ...hostawayOptions].map((option) => (
                            <option key={`${row.id}-${option.id}-${option.name}`} value={option.name}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[14px] leading-5 text-[#98a2b3]">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end mt-6 pt-4 border-t border-[#e9eaeb]">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleFinalize}>Finalize connection</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

