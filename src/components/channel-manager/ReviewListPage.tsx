import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowNarrowLeft,
  ArrowNarrowRight,
  CheckCircle,
  ChevronDown,
  Download01,
  Hourglass03,
  SearchLg,
  Send03,
  SlashCircle01,
  Star01,
  Stars02,
} from '@untitled-ui/icons-react'
import { Button, Input } from '@/components/ui'
import { PageHeader } from './PageHeader'
import { TableFilter, type TableFilterValue } from './TableFilter'
import { cn } from '@/lib/cn'
import {
  reviewRows,
  type ReviewRecord,
  type ReviewWorkflowStatus,
} from './reviewsMockData'

type PageToken = number | 'ellipsis'

function buildPageTokens(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 0) return []
  if (totalPages === 1) return [1]
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const c = currentPage
  const n = totalPages
  if (c <= 3) return [1, 2, 3, 'ellipsis', n]
  if (c >= n - 2) return [1, 'ellipsis', n - 2, n - 1, n]
  return [1, 'ellipsis', c - 1, c, 'ellipsis', n]
}

const TABLE_SECTION_COMPACT_PX = 800

const TABLE_HEAD_BG = 'bg-[#f9fafb]'

const WORKFLOW_LABEL: Record<ReviewWorkflowStatus, string> = {
  published_replied: 'Published & Replied',
  published: 'Published',
  submitted: 'Submitted',
  awaiting: 'Awaiting',
  expired: 'Expired',
}

const WORKFLOW_BADGE: Record<
  ReviewWorkflowStatus,
  { className: string; Icon: typeof CheckCircle }
> = {
  published_replied: {
    className: 'border-[#abefc6] bg-[#ecfdf3] text-[#067647]',
    Icon: CheckCircle,
  },
  published: {
    className: 'border-[#b2ddff] bg-[#eff8ff] text-[#175cd3]',
    Icon: CheckCircle,
  },
  submitted: {
    className: 'border-[#d9d6fe] bg-[#f4f3ff] text-[#5925dc]',
    Icon: Send03,
  },
  awaiting: {
    className: 'border-[#fedf89] bg-[#fffaeb] text-[#b54708]',
    Icon: Hourglass03,
  },
  expired: {
    className: 'border-[#fecdca] bg-[#fef3f2] text-[#b42318]',
    Icon: SlashCircle01,
  },
}

function ReviewStatusBadge({ status }: { status: ReviewWorkflowStatus }) {
  const { className, Icon } = WORKFLOW_BADGE[status]
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-medium leading-[18px]',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">{WORKFLOW_LABEL[status]}</span>
    </span>
  )
}

function StarRatingCell({ rating }: { rating: number | null }) {
  if (rating == null) {
    return <span className="text-[14px] leading-5 text-[#98a2b3]">—</span>
  }
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star01
          key={i}
          className={cn(
            'h-4 w-4 shrink-0',
            i < rating ? 'text-[#eaaa08]' : 'text-[#e9eaeb]',
          )}
          style={i < rating ? { fill: 'currentColor' } : undefined}
          aria-hidden
        />
      ))}
    </div>
  )
}

function truncateCell(s: string, max = 64): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

export function ReviewListPage({
  onOpenReview,
}: {
  onOpenReview: (review: ReviewRecord) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<
    'guest' | 'host' | 'auto' | 'templates'
  >('guest')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [filters, setFilters] = useState<TableFilterValue>({ review_status: [] })
  const [viewportPaginationCompact, setViewportPaginationCompact] = useState(false)
  const [tableSectionNarrow, setTableSectionNarrow] = useState(false)
  const tableSectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setViewportPaginationCompact(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const el = tableSectionRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      setTableSectionNarrow(w > 0 && w < TABLE_SECTION_COMPACT_PX)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const paginationCompact = viewportPaginationCompact || tableSectionNarrow

  const filterTypes = useMemo(
    () => [
      {
        id: 'review_status',
        label: 'Status',
        options: (Object.keys(WORKFLOW_LABEL) as ReviewWorkflowStatus[]).map((value) => ({
          value,
          label: WORKFLOW_LABEL[value],
        })),
      },
    ],
    [],
  )

  const filteredRows = useMemo(() => {
    const byFilter = reviewRows.filter((row) => {
      if (filters.review_status.length === 0) return true
      return filters.review_status.includes(row.workflowStatus)
    })
    const q = searchQuery.trim().toLowerCase()
    if (!q) return byFilter
    return byFilter.filter((row) =>
      `${row.guestName} ${row.listingName} ${row.reviewSnippet} ${row.channelsLabel}`
        .toLowerCase()
        .includes(q),
    )
  }, [filters.review_status, searchQuery])

  const totalRows = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / itemsPerPage))

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, filters.review_status, searchQuery, itemsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredRows.slice(start, start + itemsPerPage)
  }, [currentPage, filteredRows, itemsPerPage])

  const visibleCount = Math.min(currentPage * itemsPerPage, totalRows)
  const pageTokens = useMemo(
    () => buildPageTokens(currentPage, totalPages),
    [currentPage, totalPages],
  )

  const showTable = activeTab === 'guest'

  return (
    <div className="flex min-h-0 flex-1 gap-0 transition-[gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
      <section
        ref={tableSectionRef}
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e9eaeb] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.05)]"
      >
        <PageHeader
          embedded
          showTabCounts={false}
          title="Reviews"
          tabs={[
            { key: 'guest', label: 'Guest Reviews' },
            { key: 'host', label: 'Host Reviews' },
            { key: 'auto', label: 'Auto-Reviews' },
            { key: 'templates', label: 'Review Templates' },
          ]}
          activeTabKey={activeTab}
          onTabChange={(key) =>
            setActiveTab(key as 'guest' | 'host' | 'auto' | 'templates')
          }
          headerEnd={
            <>
              <Button type="button" variant="outline" className="gap-1.5" onClick={() => undefined}>
                <Download01 className="h-5 w-5 shrink-0" aria-hidden />
                Download
              </Button>
              <Button type="button" className="gap-1.5 bg-[#344054] hover:bg-[#101828]" onClick={() => undefined}>
                <Stars02 className="h-5 w-5 shrink-0 text-white" aria-hidden />
                AI Insights
              </Button>
            </>
          }
        />

        <div className="flex h-[72px] items-center justify-between gap-4 border-b border-[#e9eaeb] px-6">
          <TableFilter types={filterTypes} value={filters} onChange={setFilters} />
          <div className="relative w-[280px] shrink-0">
            <SearchLg
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#717680]"
              aria-hidden
            />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter name"
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {showTable ? (
            <>
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[960px] table-fixed border-collapse">
                  <thead>
                    <tr className={cn('border-b border-[#e9eaeb]', TABLE_HEAD_BG)}>
                      <th className="h-11 w-[160px] px-6 text-left text-[12px] font-semibold leading-[18px] text-[#414651]">
                        Guest name
                      </th>
                      <th className="h-11 w-[200px] px-6 text-left text-[12px] font-semibold leading-[18px] text-[#414651]">
                        Status
                      </th>
                      <th className="h-11 w-[120px] px-6 text-left text-[12px] font-semibold leading-[18px] text-[#414651]">
                        Rating
                      </th>
                      <th className="h-11 min-w-0 px-6 text-left text-[12px] font-semibold leading-[18px] text-[#414651]">
                        Review
                      </th>
                      <th className="h-11 w-[200px] px-6 text-left text-[12px] font-semibold leading-[18px] text-[#414651]">
                        <span className="inline-flex items-center gap-1">
                          Check-in — Check-out
                          <ChevronDown className="h-4 w-4 text-[#98a2b3]" aria-hidden />
                        </span>
                      </th>
                      <th className="h-11 w-[200px] px-6 text-left text-[12px] font-semibold leading-[18px] text-[#414651]">
                        Listing
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map((row) => (
                      <tr
                        key={row.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onOpenReview(row)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onOpenReview(row)
                          }
                        }}
                        className="h-[72px] cursor-pointer border-b border-[#e9eaeb] transition-colors hover:bg-[#f6f9fc]"
                      >
                        <td className="px-6 align-middle text-[14px] font-medium leading-5 text-[#181d27]">
                          {row.guestName}
                        </td>
                        <td className="px-6 align-middle">
                          <ReviewStatusBadge status={row.workflowStatus} />
                        </td>
                        <td className="px-6 align-middle">
                          <StarRatingCell rating={row.rating} />
                        </td>
                        <td className="px-6 align-middle text-[14px] leading-5 text-[#535862]">
                          <span className="line-clamp-2" title={row.reviewSnippet}>
                            {truncateCell(row.reviewSnippet, 72)}
                          </span>
                        </td>
                        <td className="px-6 align-middle text-[14px] leading-5 text-[#535862]">
                          {row.checkInDMY} — {row.checkOutDMY}
                        </td>
                        <td className="px-6 align-middle text-[14px] leading-5 text-[#535862]">
                          <span className="line-clamp-2" title={row.listingName}>
                            {row.listingName}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {pagedRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="h-24 text-center text-[14px] text-[#717680]"
                        >
                          No reviews found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <footer
                className={cn(
                  'flex shrink-0 flex-col gap-3 border-t border-[#e9eaeb] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-6',
                  paginationCompact
                    ? 'min-h-[52px] sm:h-auto sm:min-h-[52px] sm:py-2'
                    : 'min-h-[60px] sm:h-[60px] sm:py-0',
                )}
              >
                <p
                  className={cn(
                    'font-semibold text-[#414651]',
                    paginationCompact ? 'text-[12px] leading-4' : 'text-[14px] leading-5',
                  )}
                >
                  {visibleCount} of {totalRows} reviews
                </p>
                <div
                  className={cn(
                    'flex flex-wrap items-center',
                    paginationCompact ? 'gap-1' : 'gap-2 sm:gap-3',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-lg border bg-white font-semibold shadow-[0px_1px_2px_rgba(10,13,18,0.05)] disabled:cursor-not-allowed',
                      paginationCompact
                        ? 'h-8 w-8 justify-center border-[#e9eaeb] p-0 text-[#a4a7ae]'
                        : 'h-9 border-[#e9eaeb] px-2.5 text-[14px] leading-5 text-[#a4a7ae] sm:px-3',
                    )}
                  >
                    <ArrowNarrowLeft
                      className={cn('shrink-0', paginationCompact ? 'h-4 w-4' : 'h-5 w-5')}
                      aria-hidden
                    />
                    <span className={paginationCompact ? 'sr-only' : 'hidden md:inline'}>
                      Previous
                    </span>
                  </button>
                  <div className="flex flex-wrap items-center gap-0.5">
                    {pageTokens.map((token, idx) =>
                      token === 'ellipsis' ? (
                        <span
                          key={`e-${idx}`}
                          className={cn(
                            'inline-flex items-center justify-center text-[#717680]',
                            paginationCompact
                              ? 'h-8 w-8 text-[13px] leading-4'
                              : 'h-10 w-10 text-[14px] leading-5',
                          )}
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={token}
                          type="button"
                          onClick={() => setCurrentPage(token)}
                          className={cn(
                            'inline-flex items-center justify-center rounded-lg font-medium',
                            paginationCompact
                              ? 'h-8 w-8 min-w-8 text-[13px] leading-4'
                              : 'h-10 w-10 text-[14px] leading-5',
                            token === currentPage
                              ? 'bg-[#f6f9fc] text-[#414651]'
                              : 'text-[#717680] hover:bg-[#f6f9fc]',
                          )}
                        >
                          {token}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#d5d7da] bg-white font-semibold text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] disabled:cursor-not-allowed disabled:text-[#a4a7ae]',
                      paginationCompact
                        ? 'h-8 w-8 justify-center p-0'
                        : 'h-9 px-2.5 text-[14px] leading-5 sm:px-3',
                    )}
                  >
                    <span className={paginationCompact ? 'sr-only' : 'hidden md:inline'}>
                      Next
                    </span>
                    <ArrowNarrowRight
                      className={cn('shrink-0', paginationCompact ? 'h-4 w-4' : 'h-5 w-5')}
                      aria-hidden
                    />
                  </button>
                </div>
                <div
                  className={cn(
                    'flex flex-wrap items-center',
                    paginationCompact ? 'gap-1.5' : 'gap-2 sm:gap-3',
                  )}
                >
                  <p
                    className={cn(
                      'font-semibold text-[#414651]',
                      paginationCompact ? 'text-[12px] leading-4' : 'text-[14px] leading-5',
                    )}
                  >
                    Items per page:
                  </p>
                  <div className="relative">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className={cn(
                        'appearance-none rounded-lg border border-[#d5d7da] bg-white font-semibold text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)]',
                        paginationCompact
                          ? 'h-8 pl-3 pr-8 text-[13px] leading-4'
                          : 'h-9 pl-4 pr-9 text-[14px] leading-5',
                      )}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span
                      className={cn(
                        'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#717680]',
                        paginationCompact ? 'right-2' : 'right-3',
                      )}
                    >
                      <ChevronDown
                        className={cn(paginationCompact ? 'h-4 w-4' : 'h-5 w-5')}
                        aria-hidden
                      />
                    </span>
                  </div>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 py-16">
              <p className="text-center text-[14px] leading-5 text-[#717680]">
                This section is not available in the demo yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
