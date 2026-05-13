'use client'

import {
  ChevronLeft,
  ChevronRight,
  DotsVertical,
  HelpCircle,
  SearchSm,
  Settings01,
} from '@untitled-ui/icons-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { cn } from '@/lib/cn'
import type { IntegrationStatus } from '@/types/channel'

type ColKey =
  | 'name'
  | 'email'
  | 'role'
  | 'statusText'
  | 'ref'
  | 'channel'
  | 'updated'
  | 'region'
  | 'guests'
  | 'revenue'
  | 'status'

type DemoRow = {
  id: string
  name: string
  email: string
  role: string
  statusText: string
  ref?: string
  channel?: string
  updated?: string
  region?: string
  guests?: string
  revenue?: string
  integrationStatus?: IntegrationStatus
}

const STORYBOOK_ROWS: DemoRow[] = [
  {
    id: 'sb-1',
    name: 'Olivia',
    email: 'olivia@example.com',
    role: 'Admin',
    statusText: 'active',
  },
  {
    id: 'sb-2',
    name: 'Liam',
    email: 'liam@example.com',
    role: 'User',
    statusText: 'inactive',
  },
]

const PAGINATION_ROWS: DemoRow[] = Array.from({ length: 5 }, (_, i) => ({
  id: `pg-${i + 1}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i === 0 ? 'Admin' : 'User',
  statusText: i % 2 === 0 ? 'active' : 'inactive',
}))

const WIDE_ROWS: DemoRow[] = [
  {
    id: 'w-1',
    name: 'Ocean View Loft',
    email: 'host1@example.com',
    role: 'Host',
    statusText: 'active',
    ref: 'AIR-4492',
    channel: 'Airbnb',
    updated: 'Mar 2, 2026',
    region: 'Algarve',
    guests: '4',
    revenue: '€2.4k',
    integrationStatus: 'connected',
  },
  {
    id: 'w-2',
    name: 'Downtown Studio',
    email: 'host2@example.com',
    role: 'Host',
    statusText: 'active',
    ref: 'BDC-8821',
    channel: 'Booking.com',
    updated: 'Mar 1, 2026',
    region: 'Lisbon',
    guests: '2',
    revenue: '€1.1k',
    integrationStatus: 'pending_import',
  },
  {
    id: 'w-3',
    name: 'Garden Cottage',
    email: 'host3@example.com',
    role: 'Host',
    statusText: 'inactive',
    ref: 'AIR-9910',
    channel: 'Airbnb',
    updated: 'Feb 28, 2026',
    region: 'Porto',
    guests: '6',
    revenue: '€3.2k',
    integrationStatus: 'importing',
  },
  {
    id: 'w-4',
    name: 'Harbor Penthouse',
    email: 'host4@example.com',
    role: 'Host',
    statusText: 'inactive',
    ref: 'VRB-2201',
    channel: 'Vrbo',
    updated: 'Feb 26, 2026',
    region: 'Cascais',
    guests: '8',
    revenue: '€5.0k',
    integrationStatus: 'disconnected',
  },
  {
    id: 'w-5',
    name: 'Old Town Flat',
    email: 'host5@example.com',
    role: 'Host',
    statusText: 'active',
    ref: 'EXP-1044',
    channel: 'Expedia',
    updated: 'Feb 22, 2026',
    region: 'Lisbon',
    guests: '3',
    revenue: '€890',
    integrationStatus: 'connected',
  },
]

const KEYS_NARROW: ColKey[] = ['name', 'email', 'role', 'statusText']
const KEYS_PAGINATION: ColKey[] = ['name', 'email']
const KEYS_WIDE: ColKey[] = [
  'name',
  'email',
  'role',
  'ref',
  'channel',
  'region',
  'guests',
  'revenue',
  'updated',
  'status',
]

const CORE_KEYS: readonly ColKey[] = ['name', 'email', 'role']

function columnForKey(k: ColKey): Column<DemoRow> {
  switch (k) {
    case 'name':
      return {
        id: 'name',
        header: 'Name',
        sortable: true,
        render: (row) => <span className="font-medium text-zinc-900">{row.name}</span>,
      }
    case 'email':
      return { id: 'email', header: 'Email', sortable: true, render: (row) => row.email }
    case 'role':
      return {
        id: 'role',
        header: (
          <span className="inline-flex items-center gap-1.5">
            Role
            <HelpCircle className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
          </span>
        ),
        render: (row) => row.role,
      }
    case 'statusText':
      return {
        id: 'statusText',
        header: 'Status',
        render: (row) => <span className="lowercase text-zinc-700">{row.statusText}</span>,
      }
    case 'ref':
      return { id: 'ref', header: 'Ref', render: (row) => row.ref ?? '—' }
    case 'channel':
      return { id: 'channel', header: 'Channel', sortable: true, render: (row) => row.channel ?? '—' }
    case 'region':
      return { id: 'region', header: 'Region', render: (row) => row.region ?? '—' }
    case 'guests':
      return { id: 'guests', header: 'Guests', render: (row) => row.guests ?? '—' }
    case 'revenue':
      return { id: 'revenue', header: '30d', render: (row) => row.revenue ?? '—' }
    case 'updated':
      return { id: 'updated', header: 'Updated', sortable: true, render: (row) => row.updated ?? '—' }
    case 'status':
      return { id: 'status', header: 'Status', render: () => null }
    default:
      return { id: 'name', header: 'Name', render: (row) => row.name }
  }
}

function TableEmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-16">
      <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
        <span
          className="absolute rounded-full border border-zinc-200/80 bg-white"
          style={{ width: 112, height: 112 }}
          aria-hidden
        />
        <span
          className="absolute rounded-full border border-zinc-100"
          style={{ width: 88, height: 88 }}
          aria-hidden
        />
        <span
          className="absolute rounded-full border border-zinc-100"
          style={{ width: 64, height: 64 }}
          aria-hidden
        />
        <div className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm">
          <SearchSm className="h-5 w-5 text-zinc-400" aria-hidden />
        </div>
      </div>
      <h3 className="text-base font-semibold text-zinc-900">No Data Available</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-zinc-500">
        There is currently no data to display in the table.
      </p>
    </div>
  )
}

function RowActionsMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="relative inline-flex" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="!h-8 !w-8 !p-0"
        aria-label="Row actions"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <DotsVertical className="h-4 w-4 text-zinc-500" aria-hidden />
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 min-w-[168px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
        >
          {['View', 'Edit', 'Remove'].map((label) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
              onClick={() => setOpen(false)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ColumnsPanel({
  title,
  keys,
  visible,
  locked,
  onToggle,
  tabbed,
  activeTab,
  onTab,
}: {
  title?: string
  keys: ColKey[]
  visible: Set<ColKey>
  locked?: Set<ColKey>
  onToggle: (k: ColKey) => void
  tabbed?: boolean
  activeTab?: 'core' | 'extra'
  onTab?: (t: 'core' | 'extra') => void
}) {
  const coreList = keys.filter((k) => (CORE_KEYS as readonly ColKey[]).includes(k))
  const extraList = keys.filter((k) => !(CORE_KEYS as readonly ColKey[]).includes(k))
  const labels: Record<ColKey, string> = {
    name: 'Name',
    email: 'Email',
    role: 'Role',
    statusText: 'Status',
    ref: 'Ref',
    channel: 'Channel',
    region: 'Region',
    guests: 'Guests',
    revenue: '30d revenue',
    updated: 'Updated',
    status: 'Status (badge)',
  }

  const renderKeys = (list: ColKey[]) =>
    list.map((k) => {
      const isLocked = locked?.has(k)
      const on = visible.has(k)
      return (
        <label
          key={k}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-md py-1.5',
            isLocked && 'cursor-not-allowed opacity-60',
          )}
        >
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
            checked={on || !!isLocked}
            disabled={isLocked}
            onChange={() => !isLocked && onToggle(k)}
          />
          <span className="text-sm text-zinc-800">{labels[k]}</span>
          {isLocked ? <span className="text-xs text-zinc-400">Always visible</span> : null}
        </label>
      )
    })

  return (
    <div className="min-w-[220px] rounded-lg border border-zinc-200 bg-white p-3 shadow-lg ring-1 ring-black/5">
      {title ? <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</p> : null}
      {tabbed && onTab ? (
        <div className="mb-3 flex gap-1 rounded-md bg-zinc-100 p-0.5">
          {(
            [
              ['core', 'Core'],
              ['extra', 'Extra'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={cn(
                'flex-1 rounded px-2 py-1.5 text-xs font-medium',
                activeTab === id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800',
              )}
              onClick={() => onTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-col gap-0.5">
        {tabbed ? renderKeys(activeTab === 'core' ? coreList : extraList) : renderKeys(keys)}
      </div>
    </div>
  )
}

function StorybookPaginationFooter() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
      <p className="text-sm text-zinc-600">
        20 of <span className="font-semibold text-zinc-900">200</span>
      </p>
      <nav className="flex flex-wrap items-center justify-center gap-1" aria-label="Pagination">
        <Button type="button" variant="outline" size="sm" className="gap-1 border-zinc-200 text-zinc-700">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous
        </Button>
        {[1, 2, 3, 4, 5].map((p) => (
          <Button
            key={p}
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'min-w-[2rem] border-zinc-200 px-2 text-zinc-700',
              p === 1 && 'border-zinc-300 bg-zinc-100 font-semibold text-zinc-900',
            )}
          >
            {p}
          </Button>
        ))}
        <span className="px-1 text-sm text-zinc-400" aria-hidden>
          …
        </span>
        <Button type="button" variant="outline" size="sm" className="min-w-[2rem] border-zinc-200 px-2 text-zinc-700">
          10
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-1 border-zinc-200 text-zinc-700">
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </nav>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-600">Items per page:</span>
        <select
          className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-800 shadow-sm"
          aria-label="Items per page"
          defaultValue="20"
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export function DesignSystemTableLivePreview({
  axes,
  className,
}: {
  axes: Record<string, string>
  className?: string
}) {
  const story = axes.story ?? 'default'
  const density = axes.density === 'compact' ? 'compact' : 'comfortable'
  const selection = axes.selection === 'none' ? 'none' : 'multiple'
  const footerMode = axes.footer === 'pagination' ? 'pagination' : 'none'

  const keysPool = useMemo(() => {
    if (story === 'sticky-columns') return KEYS_WIDE
    if (footerMode === 'pagination') return KEYS_PAGINATION
    return KEYS_NARROW
  }, [story, footerMode])

  const [visibleKeys, setVisibleKeys] = useState<Set<ColKey>>(() => new Set(KEYS_NARROW))
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [columnTab, setColumnTab] = useState<'core' | 'extra'>('core')
  const columnsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (story === 'columns-selector') {
      const hidden =
        keysPool.length <= 2 ? ['email'] : (['email', 'statusText'] as ColKey[])
      setVisibleKeys(new Set(keysPool.filter((k) => !hidden.includes(k))))
    } else {
      setVisibleKeys(new Set(keysPool))
    }
    setColumnsOpen(false)
    setColumnTab('core')
  }, [story, keysPool])

  useEffect(() => {
    if (!columnsOpen) return
    const fn = (e: MouseEvent) => {
      if (!columnsRef.current?.contains(e.target as Node)) setColumnsOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [columnsOpen])

  const data = useMemo(() => {
    if (story === 'empty') return []
    if (footerMode === 'pagination') return PAGINATION_ROWS
    if (story === 'sticky-columns') return WIDE_ROWS
    return STORYBOOK_ROWS
  }, [story, footerMode])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState<string | undefined>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const storyKey = `${story}-${selection}-${density}-${footerMode}`
  useEffect(() => {
    setSelectedIds(new Set())
    setSearchValue('')
    if (story === 'sorting') {
      setSortColumn(keysPool.includes('email') ? 'email' : 'name')
      setSortDirection('desc')
    } else {
      setSortColumn(keysPool.includes('name') ? 'name' : (keysPool[0] ?? 'name'))
      setSortDirection('asc')
    }
  }, [storyKey, story, keysPool])

  const toggleColumn = useCallback(
    (k: ColKey) => {
      const locked = story === 'columns-always-visible' || story === 'columns-tabbed'
      if (locked && (k === 'name' || k === 'email')) return
      setVisibleKeys((prev) => {
        const next = new Set(prev)
        if (next.has(k)) {
          if (next.size <= 1) return next
          next.delete(k)
        } else {
          next.add(k)
        }
        return next
      })
    },
    [story],
  )

  const onSort = useCallback((columnId: string) => {
    setSortColumn((prev) => {
      if (prev === columnId) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDirection('asc')
      return columnId
    })
  }, [])

  const columns = useMemo(() => {
    const ordered = keysPool.filter((k) => visibleKeys.has(k))
    return ordered.map(columnForKey)
  }, [keysPool, visibleKeys])

  const hasStatusBadgeCol = columns.some((c) => c.id === 'status')
  const statusColumn = hasStatusBadgeCol
    ? {
        id: 'status' as const,
        getStatus: (row: DemoRow) => row.integrationStatus ?? 'connected',
        display: 'badge' as const,
      }
    : undefined

  const showColumnPicker =
    story === 'columns-selector' || story === 'columns-always-visible' || story === 'columns-tabbed'

  const lockedKeys =
    story === 'columns-always-visible' || story === 'columns-tabbed'
      ? new Set<ColKey>(['name', 'email'])
      : undefined

  const toolbarTrailing =
    showColumnPicker && data.length > 0 ? (
      <div className="relative" ref={columnsRef}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-zinc-200"
          onClick={() => setColumnsOpen((o) => !o)}
        >
          Columns
        </Button>
        {columnsOpen ? (
          <div className="absolute right-0 top-full z-40 mt-1">
            <ColumnsPanel
              keys={keysPool}
              visible={visibleKeys}
              locked={lockedKeys}
              onToggle={toggleColumn}
              tabbed={story === 'columns-tabbed'}
              activeTab={columnTab}
              onTab={story === 'columns-tabbed' ? setColumnTab : undefined}
            />
          </div>
        ) : null}
      </div>
    ) : null

  const rowActionsColumn =
    story === 'dropdown-actions' && data.length > 0
      ? {
          header: '',
          headerClassName: 'w-12',
          cellClassName: 'w-12',
          render: () => <RowActionsMenu />,
        }
      : undefined

  const sortedData = useMemo(() => {
    if (!sortColumn) return data
    const col = columns.find((c) => c.id === sortColumn)
    if (!col?.sortable) return data
    const dir = sortDirection === 'asc' ? 1 : -1
    const key = sortColumn as keyof DemoRow
    return [...data].sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * dir)
  }, [data, sortColumn, sortDirection, columns])

  const stickyColumns = story === 'sticky-columns'
  const usePaginationChrome = footerMode === 'pagination' && data.length > 0
  const headerTrailing =
    usePaginationChrome && keysPool.length <= 2 ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="!h-8 !w-8 !p-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
        aria-label="Column settings"
      >
        <Settings01 className="h-4 w-4" aria-hidden />
      </Button>
    ) : undefined

  const emptyContent = story === 'empty' ? <TableEmptyState /> : undefined

  return (
    <div className={className}>
      <DataTable<DemoRow>
        columns={columns}
        data={sortedData}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onSort={onSort}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        searchPlaceholder="search term"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusColumn={statusColumn}
        emptyMessage="No listings match your filters."
        emptyContent={emptyContent}
        selectionMode={selection}
        density={density}
        stickyColumns={stickyColumns}
        footer={usePaginationChrome ? <StorybookPaginationFooter /> : undefined}
        rowActionsColumn={rowActionsColumn}
        toolbarTrailing={toolbarTrailing ?? undefined}
        toolbarSearchEnd={usePaginationChrome}
        headerTrailing={headerTrailing}
      />
    </div>
  )
}
