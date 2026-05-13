import { useState, useCallback } from 'react'
import type { ChannelConfig, ConnectedAccount, Listing, IntegrationStatus, ChannelListingStatus } from '@/types/channel'

const MOCK_PROFILES = [
  { name: 'Olivia Rhye', email: 'olivia@untitledui.com', avatarUrl: 'https://i.pravatar.cc/96?img=32' },
  { name: 'Lana Steiner', email: 'lana@untitledui.com', avatarUrl: 'https://i.pravatar.cc/96?img=47' },
  { name: 'Phoenix Baker', email: 'phoenix@untitledui.com', avatarUrl: 'https://i.pravatar.cc/96?img=14' },
  { name: 'Demi Wilkinson', email: 'demi@untitledui.com', avatarUrl: 'https://i.pravatar.cc/96?img=39' },
  { name: 'Candice Wu', email: 'candice@untitledui.com', avatarUrl: 'https://i.pravatar.cc/96?img=5' },
]

function getRandomProfile() {
  return MOCK_PROFILES[Math.floor(Math.random() * MOCK_PROFILES.length)]
}

const IMPORT_STEP_MS = 5_000

export function useChannelManager() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [listings, setListings] = useState<Record<string, Listing[]>>({})
  const [selectChannelOpen, setSelectChannelOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportChannel, setExportChannel] = useState<ChannelConfig | null>(null)
  const [importToast, setImportToast] = useState<{
    show: boolean
    current: number
    total: number
    accountId?: string
  }>({ show: false, current: 0, total: 0 })
  const [exportToast, setExportToast] = useState<{
    show: boolean
    current: number
    total: number
    accountId?: string
  }>({ show: false, current: 0, total: 0 })
  const [successToast, setSuccessToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: '',
  })

  const openSelectChannel = useCallback(() => setSelectChannelOpen(true), [])
  const closeSelectChannel = useCallback(() => setSelectChannelOpen(false), [])

  const handleSelectChannel = useCallback((channel: ChannelConfig, onCreated?: (accountId: string) => void) => {
    const profile = getRandomProfile()
    const account: ConnectedAccount = {
      id: `acc-${Date.now()}`,
      channelId: channel.id,
      accountName: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      status: 'connecting',
      accountListings: 0,
      synced: 0,
      notSynced: 0,
    }
    setAccounts((prev) => [...prev, account])
    setListings((prev) => ({ ...prev, [account.id]: [] }))
    onCreated?.(account.id)
  }, [])

  const simulateConnection = useCallback((accountId: string, channelId = '') => {
    setListings((prev) => {
      const existing = prev[accountId] ?? []
      if (existing.length > 0) return prev
      const seedListings: Listing[] = [
        {
          id: 'seed-1',
          name: 'Chic Apartment in El Born',
          channelId,
          accountId,
          integrationStatus: 'not_in_hostaway',
          channelStatus: 'live',
          channelListingId: '123456111',
        },
        {
          id: 'seed-2',
          name: 'Cozy Loft in Gracia',
          channelId,
          accountId,
          integrationStatus: 'not_in_hostaway',
          channelStatus: 'live',
          channelListingId: '123456112',
        },
        {
          id: 'seed-3',
          name: 'Modern Apartment in Eixample',
          channelId,
          accountId,
          integrationStatus: 'not_in_hostaway',
          channelStatus: 'live',
          channelListingId: '123456113',
        },
        {
          id: 'seed-4',
          name: 'Unique Studio in Poble Sec',
          channelId,
          accountId,
          integrationStatus: 'not_in_hostaway',
          channelStatus: 'live',
          channelListingId: '123456114',
        },
        {
          id: 'seed-5',
          name: 'Stylish Room in Gothic Quarter',
          channelId,
          accountId,
          integrationStatus: 'not_in_hostaway',
          channelStatus: 'hidden_from_guests',
          channelListingId: '123456115',
        },
        {
          id: 'seed-6',
          name: 'Modern Studio in Ciutat Vella',
          channelId,
          accountId,
          integrationStatus: 'not_in_hostaway',
          channelStatus: 'action_required',
          channelListingId: '123456116',
        },
        {
          id: 'seed-7',
          name: 'Trendy Loft in Sant Antoni',
          channelId,
          accountId,
          integrationStatus: 'not_in_hostaway',
          channelStatus: 'hidden_from_guests',
          channelListingId: '123456117',
        },
        {
          id: 'seed-8',
          name: 'Spacious Apartment in Les Corts',
          channelId,
          accountId,
          integrationStatus: 'not_in_hostaway',
          channelStatus: 'live',
          channelListingId: '123456118',
        },
      ]
      return { ...prev, [accountId]: seedListings }
    })
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== accountId) return a
        const fallbackProfile = getRandomProfile()
        return {
          ...a,
          status: 'connected' as IntegrationStatus,
          accountListings: 8,
          synced: 0,
          notSynced: 8,
          ...(a.avatarUrl
            ? {}
            : {
                accountName: fallbackProfile.name,
                email: fallbackProfile.email,
                avatarUrl: fallbackProfile.avatarUrl,
              }),
        }
      })
    )
    setSuccessToast({ show: true, message: 'Account connected successfully' })
  }, [])

  const finalizeConnectionWithPlans = useCallback(
    (
      accountId: string,
      channelId: string,
      rows: Array<{ id: string; name: string; channelListingId: string; channelStatus: ChannelListingStatus }>,
      plans: Array<{ rowId: string; action: 'import' | 'map' | 'do_nothing'; mappedHostawayName?: string }>
    ) => {
      const planById = new Map(plans.map((plan) => [plan.rowId, plan]))
      const nextListings: Listing[] = rows.map((row, index) => {
        const plan = planById.get(row.id) ?? { action: 'import' as const }
        const isMapped = plan.action === 'map'
        return {
          id: row.id,
          name: row.name,
          channelId,
          accountId,
          integrationStatus: isMapped ? 'connected' : 'not_in_hostaway',
          channelStatus: row.channelStatus,
          channelListingId: row.channelListingId,
          hostawayName: isMapped ? plan.mappedHostawayName ?? row.name : null,
          hostawayId: isMapped ? `HA-MAP-${String(8800 + index)}` : null,
        }
      })

      const importIds = plans.filter((plan) => plan.action === 'import').map((plan) => plan.rowId)
      const mappedCount = plans.filter((plan) => plan.action === 'map').length
      const notSynced = plans.filter((plan) => plan.action !== 'map').length

      setListings((prev) => ({ ...prev, [accountId]: nextListings }))
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId
            ? {
                ...a,
                status: 'connected' as IntegrationStatus,
                accountListings: nextListings.length,
                synced: mappedCount,
                notSynced,
              }
            : a
        )
      )
      setSuccessToast({ show: true, message: 'Connection established successfully' })

      return importIds
    },
    []
  )

  const startImport = useCallback((accountId: string, listingIds: string[]) => {
    const total = listingIds.length
    if (total === 0) return
    const queue = [...listingIds]
    const queuedIds = new Set(queue)
    setListings((prev) => {
      const existing = prev[accountId] ?? []
      return {
        ...prev,
        [accountId]: existing.map((l) =>
          queuedIds.has(l.id)
            ? { ...l, integrationStatus: 'pending_import' as IntegrationStatus }
            : l
        ),
      }
    })
    setImportToast({ show: true, current: 0, total, accountId })

    const markImporting = (listingId: string) => {
      setListings((prev) => {
        const existing = prev[accountId] ?? []
        return {
          ...prev,
          [accountId]: existing.map((l) =>
            l.id === listingId ? { ...l, integrationStatus: 'importing' as IntegrationStatus } : l
          ),
        }
      })
    }

    const markConnected = (listingId: string) => {
      setListings((prev) => {
        const existing = prev[accountId] ?? []
        return {
          ...prev,
          [accountId]: existing.map((l) =>
            l.id === listingId ? { ...l, integrationStatus: 'connected' as IntegrationStatus } : l
          ),
        }
      })
    }

    const processStep = (index: number) => {
      const listingId = queue[index]
      if (!listingId) {
        setAccounts((prev) =>
          prev.map((a) => {
            if (a.id !== accountId) return a
            return {
              ...a,
              status: 'connected' as IntegrationStatus,
              synced: a.synced + total,
              notSynced: Math.max(0, (a.notSynced ?? 0) - total),
            }
          })
        )
        setImportToast((t) => ({ ...t, show: false }))
        setSuccessToast({ show: true, message: 'Import completed successfully' })
        return
      }

      markImporting(listingId)
      setTimeout(() => {
        markConnected(listingId)
        const completed = index + 1
        setImportToast((t) => ({ ...t, current: completed }))
        processStep(completed)
      }, IMPORT_STEP_MS)
    }

    processStep(0)
  }, [])

  const openExportModal = useCallback((channel: ChannelConfig) => {
    setExportChannel(channel)
    setExportModalOpen(true)
  }, [])

  const executeExport = useCallback((listingIds: string[], _visibilityById?: Record<string, ChannelListingStatus>) => {
    const total = listingIds.length
    setExportModalOpen(false)
    setExportToast({ show: true, current: 0, total })

    let current = 0
    const interval = setInterval(() => {
      current += 1
      setExportToast((t) => ({ ...t, current }))
      if (current >= total) {
        clearInterval(interval)
        setExportToast((t) => ({ ...t, show: false }))
        setSuccessToast({ show: true, message: 'Export completed successfully' })
        setExportChannel(null)
      }
    }, 400)
  }, [])

  const startExport = useCallback(
    (
      accountId: string,
      listingIds: string[],
      visibilityById: Record<string, ChannelListingStatus>,
      newListings?: Array<{ id: string; name: string }>,
      channelId?: string
    ) => {
    const total = listingIds.length
    if (total === 0) return

    const queue = [...listingIds]
    const queuedIds = new Set(queue)
    const newListingsMap = new Map((newListings ?? []).map((n) => [n.id, n]))

    setListings((prev) => {
      const existing = prev[accountId] ?? []
      const updated = existing.map((l) =>
        queuedIds.has(l.id)
          ? {
              ...l,
              integrationStatus:
                l.integrationStatus === 'missing_requirements'
                  ? ('missing_requirements' as IntegrationStatus)
                  : ('pending_export' as IntegrationStatus),
              channelStatus: visibilityById[l.id] ?? l.channelStatus ?? 'hidden_from_guests',
            }
          : l
      )
      return { ...prev, [accountId]: updated }
    })

    const eligibleQueue = queue.filter((listingId) => {
      const listing = (listings[accountId] ?? []).find((l) => l.id === listingId)
      if (listing) return listing.integrationStatus !== 'missing_requirements'
      return newListingsMap.has(listingId)
    })
    const eligibleTotal = eligibleQueue.length
    if (eligibleTotal === 0) return

    setExportToast({ show: true, current: 0, total: eligibleTotal, accountId })

    const accountChannelId = channelId ?? ''

    const markExporting = (listingId: string) => {
      setListings((prev) => {
        const existing = prev[accountId] ?? []
        const isNew = newListingsMap.has(listingId)
        if (isNew) return prev
        return {
          ...prev,
          [accountId]: existing.map((l) =>
            l.id === listingId ? { ...l, integrationStatus: 'exporting' as IntegrationStatus } : l
          ),
        }
      })
    }

    const markConnected = (listingId: string) => {
      const newListing = newListingsMap.get(listingId)
      setListings((prev) => {
        const existing = prev[accountId] ?? []
        if (newListing) {
          const added: Listing = {
            id: newListing.id,
            name: newListing.name,
            channelId: accountChannelId,
            accountId,
            integrationStatus: 'connected',
            channelStatus: visibilityById[listingId] ?? 'hidden_from_guests',
            channelListingId: `HA-${listingId.slice(-6)}`,
          }
          return { ...prev, [accountId]: [...existing, added] }
        }
        return {
          ...prev,
          [accountId]: existing.map((l) =>
            l.id === listingId
              ? {
                  ...l,
                  integrationStatus: 'connected' as IntegrationStatus,
                  channelStatus: visibilityById[listingId] ?? l.channelStatus ?? 'hidden_from_guests',
                }
              : l
          ),
        }
      })
    }

    const processStep = (index: number) => {
      const listingId = eligibleQueue[index]
      if (!listingId) {
        setAccounts((prev) =>
          prev.map((a) => {
            if (a.id !== accountId) return a
            return {
              ...a,
              status: 'connected' as IntegrationStatus,
              synced: a.synced + eligibleTotal,
              notSynced: Math.max(0, (a.notSynced ?? 0) - eligibleTotal),
            }
          })
        )
        setExportToast((t) => ({ ...t, show: false }))
        setSuccessToast({ show: true, message: 'Export completed successfully' })
        return
      }

      markExporting(listingId)
      setTimeout(() => {
        markConnected(listingId)
        const completed = index + 1
        setExportToast((t) => ({ ...t, current: completed }))
        processStep(completed)
      }, IMPORT_STEP_MS)
    }

    processStep(0)
  },
  [listings]
)

  const removeAccount = useCallback((accountId: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountId))
    setListings((prev) => {
      const next = { ...prev }
      delete next[accountId]
      return next
    })
  }, [])

  return {
    accounts,
    listings,
    selectChannelOpen,
    exportModalOpen,
    exportChannel,
    importToast,
    exportToast,
    successToast,
    openSelectChannel,
    closeSelectChannel,
    handleSelectChannel,
    simulateConnection,
    finalizeConnectionWithPlans,
    startImport,
    startExport,
    openExportModal,
    executeExport,
    removeAccount,
    setExportModalOpen,
    setSuccessToast,
    setImportToast,
    setExportToast,
    setListings,
    setAccounts,
  }
}
