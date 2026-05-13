import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui'

export interface TableFilterOption {
  value: string
  label: string
}

export interface TableFilterType {
  id: string
  label: string
  options: TableFilterOption[]
}

export type TableFilterValue = Record<string, string[]>

interface TableFilterProps {
  types: TableFilterType[]
  value: TableFilterValue
  onChange: (next: TableFilterValue) => void
}

function toSetMap(value: TableFilterValue) {
  return Object.fromEntries(Object.entries(value).map(([key, entries]) => [key, new Set(entries)])) as Record<string, Set<string>>
}

function toArrayMap(value: Record<string, Set<string>>) {
  return Object.fromEntries(Object.entries(value).map(([key, entries]) => [key, Array.from(entries)])) as TableFilterValue
}

export function TableFilter({ types, value, onChange }: TableFilterProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeTypeId, setActiveTypeId] = useState(types[0]?.id ?? '')
  const [searchTerm, setSearchTerm] = useState('')
  const [draft, setDraft] = useState<Record<string, Set<string>>>(() => toSetMap(value))

  useEffect(() => {
    if (!open) setDraft(toSetMap(value))
  }, [open, value])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  useEffect(() => {
    if (!types.some((type) => type.id === activeTypeId)) {
      setActiveTypeId(types[0]?.id ?? '')
    }
  }, [types, activeTypeId])

  const activeCount = useMemo(
    () => Object.values(value).reduce((sum, entries) => sum + entries.length, 0),
    [value]
  )

  const chips = useMemo(() => {
    return types
      .map((type) => {
        const selectedCount = (value[type.id] ?? []).length
        if (selectedCount < 1) return null
        return {
          typeId: type.id,
          label: `${type.label}: ${selectedCount}`,
        }
      })
      .filter((chip): chip is { typeId: string; label: string } => Boolean(chip))
  }, [types, value])

  const activeType = types.find((type) => type.id === activeTypeId) ?? types[0]
  const filteredOptions = useMemo(() => {
    if (!activeType) return []
    const query = searchTerm.trim().toLowerCase()
    if (!query) return activeType.options
    return activeType.options.filter((option) => option.label.toLowerCase().includes(query))
  }, [activeType, searchTerm])

  const toggleDraft = (typeId: string, optionValue: string) => {
    setDraft((prev) => {
      const next = { ...prev, [typeId]: new Set(prev[typeId] ?? []) }
      if (next[typeId].has(optionValue)) next[typeId].delete(optionValue)
      else next[typeId].add(optionValue)
      return next
    })
  }

  const applyDraft = () => {
    onChange(toArrayMap(draft))
    setOpen(false)
  }

  const clearDraft = () => {
    const cleared = Object.fromEntries(types.map((type) => [type.id, new Set<string>()])) as Record<string, Set<string>>
    setDraft(cleared)
  }

  const clearAllApplied = () => {
    onChange(Object.fromEntries(types.map((type) => [type.id, []])) as TableFilterValue)
  }

  const removeChip = (typeId: string) => {
    const next = toSetMap(value)
    next[typeId] = new Set()
    onChange(toArrayMap(next))
  }

  return (
    <div ref={wrapperRef} className="relative flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`h-9 inline-flex items-center gap-2 rounded-lg border border-[#d5d7da] bg-white px-3 text-[14px] font-semibold leading-5 text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] transition-[background-color,border-color,color] duration-[120ms] ease-[var(--motion-ease-default)] hover:bg-[#f6f9fc] ${activeCount > 0 ? 'border-[#b2ddff] bg-[#f5faff]' : ''}`}
      >
        <svg className="w-5 h-5 text-[#717680]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        {activeCount > 0 ? `Filter ${activeCount}` : 'Filter'}
      </button>

      {chips.map((chip) => (
        <span
          key={chip.typeId}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#d5d7da] bg-[#f6f9fc] px-3 text-[14px] font-semibold leading-5 text-[#414651]"
        >
          {chip.label}
          <button type="button" className="text-[#717680] hover:text-[#414651]" onClick={() => removeChip(chip.typeId)} aria-label={`Remove ${chip.label}`}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </span>
      ))}

      {activeCount > 0 && (
        <button type="button" onClick={clearAllApplied} className="h-9 px-2 text-[14px] leading-5 text-[#a4a7ae] hover:text-[#717680]">
          Clear all
        </button>
      )}

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[500px] overflow-hidden rounded-lg border border-[rgba(0,0,0,0.08)] bg-white shadow-[0px_12px_16px_-4px_rgba(10,13,18,0.08),0px_4px_6px_-2px_rgba(10,13,18,0.03),0px_2px_2px_-1px_rgba(10,13,18,0.04)]">
          <div className="flex">
            <div className="w-[250px] border-r border-[#e9eaeb] py-1">
              {types.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setActiveTypeId(type.id)
                    setSearchTerm('')
                  }}
                  className="w-full px-1.5 py-0.5 text-left"
                >
                  <span
                    className={`flex rounded-md px-2.5 py-2 text-[14px] leading-5 ${
                      type.id === activeTypeId
                        ? 'bg-[#f6f9fc] font-semibold text-[#252b37]'
                        : 'font-medium text-[#414651] hover:bg-[#f6f9fc]'
                    }`}
                  >
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="w-[250px]">
              <div className="p-3 pb-1">
                <div className="flex h-9 items-center gap-2 rounded-md border border-[#d5d7da] px-3 shadow-[0px_1px_2px_rgba(10,13,18,0.05)]">
                  <svg className="w-5 h-5 text-[#717680]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search"
                    className="w-full bg-transparent text-[14px] leading-5 text-[#414651] outline-none placeholder:text-[#717680]"
                  />
                </div>
              </div>
              <div className="max-h-[264px] overflow-auto px-1.5 pb-2">
                {filteredOptions.map((option) => {
                  const selected = (draft[activeType.id] ?? new Set()).has(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleDraft(activeType.id, option.value)}
                      className="w-full px-1.5 py-0.5 text-left"
                    >
                      <span className={`flex items-center rounded-md px-2.5 py-2 text-[14px] leading-5 ${selected ? 'bg-[#f6f9fc] font-semibold text-[#252b37]' : 'font-medium text-[#414651] hover:bg-[#f6f9fc]'}`}>
                        <span className="flex-1">{option.label}</span>
                        {selected && (
                          <svg className="w-3 h-3 text-[#181d27]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M2 6.5l2.2 2.2L10 3.5" />
                          </svg>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 border-t border-[#e9eaeb] p-4">
            <button
              type="button"
              onClick={clearDraft}
              className="h-9 flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-[#d5d7da] bg-white text-[14px] font-semibold leading-5 text-[#414651] shadow-[0px_1px_2px_rgba(10,13,18,0.05)] hover:bg-[#f6f9fc]"
            >
              <svg className="w-5 h-5 text-[#98a2b3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="8" />
                <path d="M7 7l10 10" />
              </svg>
              Clear all
            </button>
            <Button
              type="button"
              variant="primary"
              onClick={applyDraft}
              className="h-9 flex-1 gap-2 rounded-lg text-[14px] leading-5"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M8 12.5l2.5 2.5L16 9.5" />
              </svg>
              Apply filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
