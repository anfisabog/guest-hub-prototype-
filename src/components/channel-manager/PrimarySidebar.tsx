import type { ComponentType, SVGProps } from 'react'
import {
  BankNote01,
  Calendar,
  CalendarCheck02,
  CreditCardRefresh,
  File02,
  Globe02,
  HomeLine,
  List,
  MessageChatSquare,
  Star01,
  User01,
} from '@untitled-ui/icons-react'
import { cn } from '@/lib/cn'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

// Index 0–8 = existing pages, Index 9 = Post-booking experience
const sidebarItems: Array<{ label: string; Icon: IconComponent }> = [
  { label: 'Overview', Icon: HomeLine },
  { label: 'Calendar', Icon: Calendar },
  { label: 'Inbox', Icon: MessageChatSquare },
  { label: 'Reservation', Icon: CalendarCheck02 },
  { label: 'Listings', Icon: List },
  { label: 'Financial Reporting', Icon: BankNote01 },
  { label: 'Expenses and Extras', Icon: CreditCardRefresh },
  { label: 'Owner Statements', Icon: File02 },
  { label: 'Reviews', Icon: Star01 },
  { label: 'Post-booking experience', Icon: User01 },
  { label: 'Booking website settings', Icon: Globe02 },
]

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
  activeIndex?: number
  onSelectItem?: (index: number) => void
}

export function PrimarySidebar({ activeIndex = 4, onSelectItem }: PrimarySidebarProps) {
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
            {sidebarItems.map((item, index) => {
              const active = index === activeIndex
              const { Icon } = item
              return (
                <button
                  key={`${item.label}-${index}`}
                  type="button"
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onSelectItem?.(index)}
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center overflow-hidden transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fd853a] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--figma-bg)]',
                    /* Figma: active = 40×40 rounded-xl white + shadow; inactive = rounded-md (6px) + 8px padding */
                    active
                      ? 'rounded-xl bg-white p-0'
                      : 'rounded-[6px] p-2',
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
