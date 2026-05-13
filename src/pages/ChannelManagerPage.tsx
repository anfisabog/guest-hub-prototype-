import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  PageShell,
  AccountTable,
  BulkActionBar,
  CalendarPage,
  EmptyState,
  ExportModal,
  PageHeader,
  ReservationListPage,
  ReservationSlidingPreviewPanel,
  ReservationTemplatePage,
  ReviewDetailPage,
  ReviewListPage,
  reservationRows,
  SelectChannelModal,
  TableFilter,
  LinkRegularIcon,
  type ReservationDetailsSummary,
  type ReservationForm,
  type ReservationListItem,
  type OpenReservationOptions,
  type ReviewRecord,
  type TableFilterValue,
} from '@/components/channel-manager'
import { Button, Input, Modal } from '@/components/ui'
import { useChannelManagerContext } from '@/context/ChannelManagerContext'
import { getChannelById } from '@/config/channels'
import type { Listing } from '@/types/channel'
import { RESERVATION_AVATAR_SRC_DETAIL, reservationGuestAvatarUrl } from '@/lib/reservationGuestAvatar'

export function ChannelManagerPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'connected' | 'channels'>(
    searchParams.get('tab') === 'channels' ? 'channels' : 'connected'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [primaryNavIndex, setPrimaryNavIndex] = useState(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'design-system'
      ? 13
      : 1
  )
  const [activeReservation, setActiveReservation] = useState<ReservationListItem | null>(null)
  const [activeReview, setActiveReview] = useState<ReviewRecord | null>(null)
  const [reservationStartInEditMode, setReservationStartInEditMode] = useState(false)
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set())
  const [connectedFilters, setConnectedFilters] = useState<TableFilterValue>({
    channel: [],
    connection_status: [],
  })
  const [removeAccountId, setRemoveAccountId] = useState<string | null>(null)
  const [exportAccountId, setExportAccountId] = useState<string | null>(null)
  const [calendarPreviewReservationId, setCalendarPreviewReservationId] = useState<string | null>(null)
  const [calendarReservationOverrides, setCalendarReservationOverrides] = useState<
    Record<string, Partial<ReservationListItem>>
  >({})
  const {
    accounts,
    listings,
    exportModalOpen,
    selectChannelOpen,
    openSelectChannel,
    closeSelectChannel,
    handleSelectChannel,
    openExportModal,
    startExport,
    setExportModalOpen,
    removeAccount,
  } = useChannelManagerContext()

  const onSelectChannel = (channel: Parameters<typeof handleSelectChannel>[0]) => {
    handleSelectChannel(channel, (accountId) => navigate(`/accounts/${accountId}`))
  }

  const connectedRows = useMemo(() => {
    const inHostaway = (rows: Listing[]) =>
      rows.filter((listing) => listing.integrationStatus === 'connected').length
    return accounts.map((account) => {
      const accountListings = listings[account.id] ?? []
      const listingsInHostaway = inHostaway(accountListings)
      const listingsNotInHostaway = Math.max(0, accountListings.length - listingsInHostaway)
      return {
        account,
        totalListings: accountListings.length,
        listingsInHostaway,
        listingsNotInHostaway,
      }
    })
  }, [accounts, listings])

  const filteredRows = useMemo(() => {
    const byFilter = connectedRows.filter((row) => {
      const channelMatch =
        connectedFilters.channel.length === 0 || connectedFilters.channel.includes(row.account.channelId)
      const statusMatch =
        connectedFilters.connection_status.length === 0 ||
        connectedFilters.connection_status.includes(row.account.status)
      return channelMatch && statusMatch
    })

    const query = searchQuery.trim().toLowerCase()
    if (!query) return byFilter
    return byFilter.filter((row) =>
      `${row.account.accountName} ${row.account.email}`.toLowerCase().includes(query)
    )
  }, [connectedRows, connectedFilters, searchQuery])

  const connectedFilterTypes = useMemo(() => {
    const channelOptions = Array.from(
      new Map(
        connectedRows
          .map((row) => {
            const channel = getChannelById(row.account.channelId)
            return channel ? [channel.id, { value: channel.id, label: channel.name }] : null
          })
          .filter(Boolean) as Array<[string, { value: string; label: string }]>
      ).values()
    )

    const statusLabelMap: Record<string, string> = {
      connected: 'Connected',
      connecting: 'Not connected',
      disconnected: 'Disconnected',
      importing: 'Importing',
    }

    const statusOptions = Array.from(
      new Set(connectedRows.map((row) => row.account.status))
    ).map((status) => ({
      value: status,
      label: statusLabelMap[status] ?? status,
    }))

    return [
      { id: 'channel', label: 'Channel', options: channelOptions },
      { id: 'connection_status', label: 'Connection status', options: statusOptions },
    ]
  }, [connectedRows])

  const visibleAccountIds = filteredRows.map((row) => row.account.id)
  const allPageSelected =
    visibleAccountIds.length > 0 && visibleAccountIds.every((id) => selectedAccountIds.has(id))
  const somePageSelected =
    visibleAccountIds.some((id) => selectedAccountIds.has(id)) && !allPageSelected

  const toggleSelectAllOnPage = () => {
    setSelectedAccountIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) visibleAccountIds.forEach((id) => next.delete(id))
      else visibleAccountIds.forEach((id) => next.add(id))
      return next
    })
  }

  const toggleRowSelection = (accountId: string) => {
    setSelectedAccountIds((prev) => {
      const next = new Set(prev)
      if (next.has(accountId)) next.delete(accountId)
      else next.add(accountId)
      return next
    })
  }

  const openExportForAccount = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    if (!account) return
    const channel = getChannelById(account.channelId)
    if (!channel) return
    setExportAccountId(accountId)
    openExportModal(channel)
  }

  const confirmRemoveAccount = () => {
    if (!removeAccountId) return
    removeAccount(removeAccountId)
    setSelectedAccountIds((prev) => {
      const next = new Set(prev)
      next.delete(removeAccountId)
      return next
    })
    setRemoveAccountId(null)
  }

  const removeSelectedAccounts = () => {
    selectedAccountIds.forEach((accountId) => removeAccount(accountId))
    setSelectedAccountIds(new Set())
  }

  const exportAccount = exportAccountId
    ? accounts.find((account) => account.id === exportAccountId) ?? null
    : null
  const exportChannel = exportAccount ? getChannelById(exportAccount.channelId) ?? null : null
  const exportListings = exportAccountId ? listings[exportAccountId] ?? [] : []
  const showCalendar = primaryNavIndex === 1
  const showReservationTemplate = primaryNavIndex === 3
  const showReviews = primaryNavIndex === 8
  const reservationSummary: ReservationDetailsSummary | undefined = activeReservation
    ? {
        reservationId: activeReservation.id,
        guestName: activeReservation.guestName,
        checkInDate: activeReservation.checkIn,
        checkOutDate: activeReservation.checkOut,
        guests: activeReservation.guests,
        source: activeReservation.source,
        listingName: activeReservation.listingName,
        nights: activeReservation.nights,
      }
    : undefined
  const reservationFormValues: Partial<ReservationForm> | undefined = activeReservation
    ? {
        profileImageUrl: reservationGuestAvatarUrl(activeReservation.id, RESERVATION_AVATAR_SRC_DETAIL),
        reservationStatus: activeReservation.status,
        paymentStatus: activeReservation.paymentStatus,
        balanceDue: activeReservation.balanceDue,
        remainingCharges: activeReservation.remainingCharges,
        totalAmount: activeReservation.totalAmount,
        doorCode: activeReservation.doorCode,
        rentalAgreementStatus: activeReservation.rentalAgreementStatus,
        baseRate: activeReservation.baseRate,
        pmCommission: activeReservation.pmCommission,
        name: activeReservation.guestName,
        email: activeReservation.email,
        phone: activeReservation.phone,
        country: activeReservation.country,
        city: activeReservation.city,
        language: activeReservation.language,
        currency: activeReservation.currency,
        listing: activeReservation.listingName,
        checkInDate: activeReservation.checkIn,
        checkInTime: activeReservation.checkInTime,
        checkOutDate: activeReservation.checkOut,
        checkOutTime: activeReservation.checkOutTime,
        nights: String(activeReservation.nights),
        adults: String(activeReservation.guests),
        children: String(activeReservation.children),
        infants: String(activeReservation.infants),
        pets: String(activeReservation.pets),
        source: activeReservation.source,
        confirmationCode: activeReservation.confirmationCode,
        bookingType: activeReservation.bookingType,
        checkInMethod: activeReservation.checkInMethod,
        roomType: activeReservation.roomType,
        notes: activeReservation.notes,
        specialRequests: activeReservation.specialRequests,
        assignedTeam: activeReservation.assignedTeam,
        cleaningStatus: activeReservation.cleaningStatus,
        arrivalWindow: activeReservation.arrivalWindow,
        departureWindow: activeReservation.departureWindow,
        host: activeReservation.host,
        houseRules: activeReservation.houseRules,
      }
    : undefined

  useEffect(() => {
    if (primaryNavIndex !== 3) {
      setActiveReservation(null)
      setReservationStartInEditMode(false)
    }
  }, [primaryNavIndex])

  useEffect(() => {
    if (primaryNavIndex !== 10) setActiveReview(null)
  }, [primaryNavIndex])

  useEffect(() => {
    if (primaryNavIndex !== 1) {
      setCalendarPreviewReservationId(null)
    }
  }, [primaryNavIndex])

  useEffect(() => {
    if (searchParams.get('view') === 'design-system') {
      setPrimaryNavIndex(13)
    }
  }, [searchParams])

  const mergedReservationsForCalendar = useMemo(
    () => reservationRows.map((r) => ({ ...r, ...(calendarReservationOverrides[r.id] ?? {}) })),
    [calendarReservationOverrides]
  )

  const calendarPreviewReservation = useMemo(
    () =>
      calendarPreviewReservationId
        ? mergedReservationsForCalendar.find((r) => r.id === calendarPreviewReservationId) ?? null
        : null,
    [calendarPreviewReservationId, mergedReservationsForCalendar]
  )

  const openReservationDetails = (
    reservation: ReservationListItem,
    options?: OpenReservationOptions
  ) => {
    setReservationStartInEditMode(Boolean(options?.startInEditMode))
    setActiveReservation(reservation)
  }

  const toggleCalendarReservationPreview = useCallback((reservationId: string) => {
    setCalendarPreviewReservationId((prev) => (prev === reservationId ? null : reservationId))
  }, [])

  /**
   * Shared reservation date formatter — keep in lockstep with how {@link reservationRows}
   * emits `checkIn` / `checkOut` strings (e.g. "May 3 2026") so the sidebar panel can parse
   * and display them without extra normalization.
   */
  const formatReservationDate = useCallback((date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`
  }, [])

  const syncCalendarBookingPreview = useCallback(
    (reservationId: string, booking: { start: Date; end: Date }) => {
      const nights = Math.max(
        1,
        Math.round((booking.end.getTime() - booking.start.getTime()) / 86400000),
      )
      setCalendarReservationOverrides((prev) => ({
        ...prev,
        [reservationId]: {
          ...prev[reservationId],
          checkIn: formatReservationDate(booking.start),
          checkOut: formatReservationDate(booking.end),
          nights,
        },
      }))
    },
    [formatReservationDate],
  )

  const handleSidebarSelect = (index: number) => {
    if (index === 9) {
      navigate('/guest-hub')
      return
    }
    if (index === 3) setActiveReservation(null)
    if (index === 8) setActiveReview(null)
    setPrimaryNavIndex(index)
  }

  return (
    <PageShell sidebarActiveIndex={primaryNavIndex} onSidebarSelectItem={handleSidebarSelect} mainGap={0}>
      {showCalendar ? (
        <div className="flex min-h-0 min-w-0 flex-1 gap-0">
          <CalendarPage
            reservations={mergedReservationsForCalendar}
            previewReservationId={calendarPreviewReservationId}
            onToggleReservationPreview={toggleCalendarReservationPreview}
            onSyncBookingPreview={syncCalendarBookingPreview}
            onManageDatesOpenChange={(open) => {
              if (open) setCalendarPreviewReservationId(null)
            }}
            onCloseReservationPreview={() => setCalendarPreviewReservationId(null)}
          />
          <ReservationSlidingPreviewPanel
            reservation={calendarPreviewReservation}
            onClose={() => setCalendarPreviewReservationId(null)}
            onOpenFullscreen={(r) => {
              setCalendarPreviewReservationId(null)
              setPrimaryNavIndex(3)
              openReservationDetails(r)
            }}
            onApplyReservationPatch={(id, partial) =>
              setCalendarReservationOverrides((prev) => ({
                ...prev,
                [id]: { ...prev[id], ...partial },
              }))
            }
          />
        </div>
      ) : showReservationTemplate ? (
        activeReservation ? (
          <ReservationTemplatePage
            summary={reservationSummary}
            startInEditMode={reservationStartInEditMode}
            initialValues={reservationFormValues}
            onBackToListings={() => setActiveReservation(null)}
          />
        ) : (
          <ReservationListPage onOpenReservation={openReservationDetails} />
        )
      ) : showReviews ? (
        activeReview ? (
          <ReviewDetailPage review={activeReview} onBack={() => setActiveReview(null)} />
        ) : (
          <ReviewListPage onOpenReview={(r) => setActiveReview(r)} />
        )
      ) : (
        <>
          <div className="flex-1 bg-white rounded-xl flex flex-col min-h-0 overflow-hidden border border-[#eceef2]">
            <PageHeader
              embedded
              title="Channel Manager"
              tabs={[
                { key: 'connected', label: 'Connected accounts', count: accounts.length },
                { key: 'channels', label: 'Channels' },
              ]}
              activeTabKey={activeTab}
              onTabChange={(key) => setActiveTab(key as 'connected' | 'channels')}
              headerEnd={
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 text-[#414651]"
                    onClick={() => setPrimaryNavIndex(13)}
                  >
                    Design system
                  </Button>
                  <Button
                    type="button"
                    onClick={openSelectChannel}
                    className="shrink-0"
                    aria-label="Connect account"
                  >
                    <LinkRegularIcon className="mr-1.5 h-5 w-5 shrink-0" />
                    Connect account
                  </Button>
                </>
              }
            />
            {activeTab === 'connected' && accounts.length === 0 ? (
              <EmptyState onConnectAccount={openSelectChannel} />
            ) : activeTab === 'connected' ? (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="h-[72px] flex items-center justify-between px-6 border-b border-[#e9eaeb]">
                  <TableFilter
                    types={connectedFilterTypes}
                    value={connectedFilters}
                    onChange={setConnectedFilters}
                  />
                  <div className="w-[250px] relative">
                    <svg className="w-5 h-5 text-[#717680] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-3.5-3.5" />
                    </svg>
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by account name"
                      className="pl-10"
                    />
                  </div>
                </div>
                <AccountTable
                  rows={filteredRows}
                  selectedAccountIds={selectedAccountIds}
                  allPageSelected={allPageSelected}
                  somePageSelected={somePageSelected}
                  onToggleSelectAll={toggleSelectAllOnPage}
                  onToggleRowSelection={toggleRowSelection}
                  onExportAccount={openExportForAccount}
                  onRemoveAccount={setRemoveAccountId}
                />
              </div>
            ) : (
              <div className="p-6">
                <p className="text-[#535861]" style={{ fontSize: 14, lineHeight: 20 }}>
                  Channels tab content
                </p>
              </div>
            )}
          </div>

          <BulkActionBar
            count={selectedAccountIds.size}
            actions={[
              {
                label: 'Remove',
                onClick: removeSelectedAccounts,
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14" />
                  </svg>
                ),
              },
            ]}
          />

          <Modal
            open={Boolean(removeAccountId)}
            onClose={() => setRemoveAccountId(null)}
            title="Remove account"
            footer={
              <>
                <Button type="button" onClick={() => setRemoveAccountId(null)} variant="outline">
                  Cancel
                </Button>
                <Button type="button" onClick={confirmRemoveAccount} variant="destructive">
                  Remove account
                </Button>
              </>
            }
          >
            <p className="text-[14px] leading-5 text-[#535862]">
              This will remove the account and all associated listings data from Channel Manager.
            </p>
          </Modal>

          {exportChannel && exportAccountId && (
            <ExportModal
              open={exportModalOpen}
              onClose={() => {
                setExportModalOpen(false)
                setExportAccountId(null)
              }}
              channel={exportChannel}
              listings={exportListings}
              onExport={(listingIds, visibilityById, newListings) => {
                startExport(
                  exportAccountId,
                  listingIds,
                  visibilityById,
                  newListings,
                  exportChannel?.id
                )
                setExportModalOpen(false)
                setExportAccountId(null)
                navigate(`/accounts/${exportAccountId}`)
              }}
            />
          )}

          <SelectChannelModal open={selectChannelOpen} onClose={closeSelectChannel} onSelect={onSelectChannel} />
        </>
      )}
    </PageShell>
  )
}
