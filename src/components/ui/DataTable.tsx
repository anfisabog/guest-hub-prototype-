import { type ReactNode } from 'react'
import { SearchSm } from '@untitled-ui/icons-react'
import { Checkbox } from './Checkbox'
import { Input } from './Input'
import { Badge } from './Badge'
import { Button } from './Button'
import { cn } from '@/lib/cn'
import type { IntegrationStatus } from '@/types/channel'

export interface Column<T> {
  id: string
  /** Column title; may include icons (e.g. help next to “Role”). */
  header: ReactNode
  sortable?: boolean
  render: (row: T) => ReactNode
}

export interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[]
  data: T[]
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  onSort?: (columnId: string) => void
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  /** When omitted, the Filter button is not shown. */
  onFilterClick?: () => void
  statusColumn?: {
    id: string
    getStatus: (row: T) => IntegrationStatus
    /** `text` matches design-system docs (plain lowercase); `badge` for product status chips. */
    display?: 'badge' | 'text'
  }
  /** Single-line fallback when `emptyContent` is not provided. */
  emptyMessage?: string
  /** Replaces the default empty table cell (e.g. illustration + title). */
  emptyContent?: ReactNode
  selectionMode?: 'multiple' | 'none'
  density?: 'comfortable' | 'compact'
  stickyColumns?: boolean
  footer?: ReactNode
  rowActionsColumn?: {
    header: string
    render: (row: T) => ReactNode
    headerClassName?: string
    cellClassName?: string
  }
  toolbarTrailing?: ReactNode
  /** Place search (+ trailing) at the end of the toolbar row (Storybook “With pagination”). */
  toolbarSearchEnd?: boolean
  /** Leading magnifying glass in the search field. */
  showSearchIcon?: boolean
  /** Extra header cell on the right of column headers (e.g. settings cog). */
  headerTrailing?: ReactNode
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  selectedIds,
  onSelectionChange,
  onSort,
  sortColumn,
  sortDirection = 'asc',
  searchPlaceholder = 'search term',
  searchValue = '',
  onSearchChange,
  onFilterClick,
  statusColumn,
  emptyMessage = 'No data',
  emptyContent,
  selectionMode = 'multiple',
  density = 'comfortable',
  stickyColumns = false,
  footer,
  rowActionsColumn,
  toolbarTrailing,
  toolbarSearchEnd = false,
  showSearchIcon = true,
  headerTrailing,
}: DataTableProps<T>) {
  const showSelection = selectionMode === 'multiple'
  const pad = density === 'compact' ? 'px-4 py-2.5' : 'px-5 py-3'
  const cellText = density === 'compact' ? 'text-xs' : 'text-sm'
  const headerText = density === 'compact' ? 'text-xs' : 'text-xs'

  const allSelected = data.length > 0 && selectedIds.size === data.length
  const someSelected = selectedIds.size > 0

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(data.map((r) => r.id)))
    }
  }

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  const stickyCheckbox = stickyColumns && showSelection
  const stickyFirstData = stickyColumns && columns.length > 0
  const firstColId = columns[0]?.id

  const headerBg = 'bg-zinc-50'
  const cellBg = 'bg-white group-hover:bg-zinc-50/90'
  const stickyHeaderBg = cn(headerBg, stickyColumns && 'shadow-[2px_0_8px_-4px_rgba(0,0,0,0.06)]')
  const stickyCellBg = cn(cellBg, stickyColumns && 'shadow-[2px_0_8px_-4px_rgba(0,0,0,0.04)]')

  const extraHeaderCells = (headerTrailing ? 1 : 0) + (rowActionsColumn ? 1 : 0)
  const colSpan = columns.length + (showSelection ? 1 : 0) + extraHeaderCells

  const searchField = onSearchChange ? (
    <div
      className={cn(
        'relative w-full min-w-[200px] max-w-sm',
        toolbarSearchEnd && 'sm:max-w-[280px]',
      )}
    >
      {showSearchIcon ? (
        <SearchSm
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
      ) : null}
      <Input
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        className={cn(showSearchIcon && 'pl-9')}
      />
    </div>
  ) : null

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      {onSearchChange ? (
        <div
          className={cn(
            'flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-5 py-3',
            toolbarSearchEnd ? 'justify-end' : 'justify-start',
          )}
        >
          {!toolbarSearchEnd ? (
            <>
              {searchField}
              {onFilterClick ? (
                <Button variant="outline" size="sm" onClick={onFilterClick}>
                  Filter
                </Button>
              ) : null}
              {toolbarTrailing ? (
                <div className="ml-auto flex shrink-0 items-center gap-2">{toolbarTrailing}</div>
              ) : null}
            </>
          ) : (
            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              {toolbarTrailing}
              {searchField}
            </div>
          )}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className={cn('border-b border-zinc-200', headerBg)}>
              {showSelection ? (
                <th
                  scope="col"
                  className={cn(
                    'w-12 min-w-[3rem] text-left',
                    pad,
                    stickyCheckbox && 'sticky left-0 z-30',
                    stickyCheckbox ? stickyHeaderBg : headerBg,
                  )}
                >
                  <Checkbox
                    checked={allSelected}
                    isIndeterminate={someSelected && !allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </th>
              ) : null}
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={cn(
                    pad,
                    'text-left font-semibold text-zinc-900',
                    headerText,
                    stickyFirstData && firstColId === col.id && 'sticky z-30',
                    stickyFirstData && firstColId === col.id && (showSelection ? 'left-12' : 'left-0'),
                    stickyFirstData && firstColId === col.id ? stickyHeaderBg : headerBg,
                  )}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-sm text-inherit hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                      onClick={() => onSort(col.id)}
                    >
                      {col.header}
                      {sortColumn === col.id ? (
                        <span className="font-normal tabular-nums text-zinc-500">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      ) : null}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
              {headerTrailing ? (
                <th scope="col" className={cn(pad, 'w-12 text-right font-semibold text-zinc-900', headerBg)}>
                  {headerTrailing}
                </th>
              ) : null}
              {rowActionsColumn ? (
                <th
                  scope="col"
                  className={cn(
                    pad,
                    'text-right font-semibold text-zinc-900',
                    headerText,
                    headerBg,
                    rowActionsColumn.headerClassName,
                  )}
                >
                  {rowActionsColumn.header}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="border-b border-zinc-200 p-0">
                  {emptyContent ?? (
                    <div className={cn(pad, 'text-center text-sm text-zinc-500', cellText)}>
                      {emptyMessage}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  className="group border-b border-zinc-200 transition-colors duration-100 ease-out last:border-b-0"
                >
                  {showSelection ? (
                    <td
                      className={cn(
                        pad,
                        stickyCheckbox && 'sticky left-0 z-20',
                        stickyCheckbox ? stickyCellBg : cellBg,
                      )}
                    >
                      <Checkbox
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        aria-label={`Select row ${row.id}`}
                      />
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        pad,
                        cellText,
                        'text-zinc-900',
                        stickyFirstData && firstColId === col.id && 'sticky z-20',
                        stickyFirstData && firstColId === col.id && (showSelection ? 'left-12' : 'left-0'),
                        stickyFirstData && firstColId === col.id ? stickyCellBg : cellBg,
                      )}
                    >
                      {statusColumn?.id === col.id ? (
                        (statusColumn.display ?? 'badge') === 'badge' ? (
                          <Badge variant={statusColumn.getStatus(row) as never}>
                            {formatStatus(statusColumn.getStatus(row))}
                          </Badge>
                        ) : (
                          <span className="text-zinc-700">
                            {formatStatusPlain(statusColumn.getStatus(row))}
                          </span>
                        )
                      ) : (
                        col.render(row)
                      )}
                    </td>
                  ))}
                  {headerTrailing ? (
                    <td className={cn(pad, cellBg, 'text-right')} aria-hidden /> 
                  ) : null}
                  {rowActionsColumn ? (
                    <td
                      className={cn(pad, 'text-right', cellText, cellBg, rowActionsColumn.cellClassName)}
                    >
                      {rowActionsColumn.render(row)}
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer ? (
        <div className="border-t border-zinc-200 bg-white px-5 py-3 text-sm text-zinc-600">{footer}</div>
      ) : null}
    </div>
  )
}

function formatStatusPlain(s: IntegrationStatus): string {
  return formatStatus(s).toLowerCase()
}

function formatStatus(s: IntegrationStatus): string {
  const map: Record<IntegrationStatus, string> = {
    not_in_hostaway: 'Not in Hostaway',
    pending: 'Pending',
    connecting: 'Connecting…',
    pending_import: 'Pending import',
    pending_export: 'Pending export',
    importing: 'Importing…',
    connected: 'Connected',
    ready_to_export: 'Ready to export',
    exporting: 'Exporting…',
    published: 'Published',
    missing_requirements: 'Missing requirements',
    disconnected: 'Disconnected',
  }
  return map[s] ?? s
}
