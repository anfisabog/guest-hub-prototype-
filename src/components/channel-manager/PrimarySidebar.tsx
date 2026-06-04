import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { NAV_ITEMS, indexFromPathname } from '@/lib/navItems'

const iconProps = {
  width: 20,
  height: 20,
  className: 'text-[#667085]',
} as const

function BrandMark() {
  return (
    <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="size-8 shrink-0 rounded-lg object-cover" />
  )
}

export interface PrimarySidebarProps {
  /** Override active index. If omitted, derived from current pathname. */
  activeIndex?: number
  /** Optional extra handler. Sidebar still navigates by default. */
  onSelectItem?: (index: number) => void
}

export function PrimarySidebar({ activeIndex, onSelectItem }: PrimarySidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const effectiveActive = activeIndex ?? indexFromPathname(location.pathname)

  const handleClick = (index: number) => {
    // Always navigate — guarantees every tab is functional regardless of caller wiring
    navigate(`/${NAV_ITEMS[index].slug}`)
    // Still allow optional side-effects from the consumer
    onSelectItem?.(index)
  }

  return (
    <aside className="sticky top-2 h-[calc(100vh-16px)] w-[72px] shrink-0 self-start px-1 py-1">
      <div className="flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-xl bg-[var(--figma-bg)]">
        <div className="flex min-h-0 flex-1 flex-col gap-4 pt-5">
          <div className="flex w-full shrink-0 flex-col items-center px-3">
            <div className="flex items-start">
              <BrandMark />
            </div>
          </div>
          <nav
            aria-label="Primary"
            className="flex min-h-0 flex-1 flex-col items-center gap-0.5 overflow-y-auto overflow-x-hidden px-3 pb-2 [scrollbar-width:thin]"
          >
            {NAV_ITEMS.map((item, index) => {
              const active = index === effectiveActive
              const { Icon } = item
              return (
                <button
                  key={`${item.label}-${index}`}
                  type="button"
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => handleClick(index)}
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center overflow-hidden transition-colors cursor-pointer',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fd853a] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--figma-bg)]',
                    active
                      ? 'rounded-xl bg-white p-0'
                      : 'rounded-[6px] p-2 hover:bg-white/60',
                  )}
                >
                  <Icon {...iconProps} />
                </button>
              )
            })}
          </nav>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-4 px-3 pb-5">
          <div className="size-10 shrink-0" aria-hidden />
          <div className="relative size-10 shrink-0">
            <img
              alt=""
              src="https://i.pravatar.cc/96?img=32"
              className="size-10 rounded-[40px] object-cover"
            />
            <span
              className="absolute bottom-0 right-0 size-2.5 rounded-full border-[1.5px] border-white bg-[#17b26a]"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
