import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { DotsHorizontal, Plus } from '@untitled-ui/icons-react'
import { Button } from '@/components/ui'
import { LinkRegularIcon } from './ActionIcons'

interface HeaderTab {
  key: string
  label: string
  count?: number
}

interface PageHeaderProps {
  title: string
  tabs?: HeaderTab[]
  activeTabKey?: string
  onTabChange?: (key: string) => void
  actionLabel?: string
  onActionClick?: () => void
  secondaryActionLabel?: string
  onSecondaryActionClick?: () => void
  /** When set, replaces the default secondary + primary action buttons (e.g. custom toolbar). */
  headerEnd?: ReactNode
  embedded?: boolean
  showTabCounts?: boolean
  compactPrimaryActionOnSmallScreens?: boolean
}

export function PageHeader({
  title,
  tabs,
  activeTabKey,
  onTabChange,
  actionLabel,
  onActionClick,
  secondaryActionLabel,
  onSecondaryActionClick,
  headerEnd,
  embedded = false,
  showTabCounts = true,
  compactPrimaryActionOnSmallScreens = false,
}: PageHeaderProps) {
  const navRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })

  const updateIndicator = useCallback(() => {
    if (!tabs?.length || !activeTabKey) {
      setIndicator((prev) => ({ ...prev, ready: false }))
      return
    }

    const navNode = navRef.current
    const activeTabNode = tabRefs.current[activeTabKey]
    if (!navNode || !activeTabNode) {
      setIndicator((prev) => ({ ...prev, ready: false }))
      return
    }

    const navRect = navNode.getBoundingClientRect()
    const activeRect = activeTabNode.getBoundingClientRect()
    setIndicator({
      left: activeRect.left - navRect.left,
      width: activeRect.width,
      ready: true,
    })
  }, [activeTabKey, tabs])

  useEffect(() => {
    updateIndicator()
    const frame = requestAnimationFrame(updateIndicator)
    window.addEventListener('resize', updateIndicator)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', updateIndicator)
    }
  }, [updateIndicator])

  return (
    <header
      className={
        embedded
          ? 'bg-white overflow-hidden'
          : 'bg-white rounded-xl overflow-hidden border border-[#eceef2]'
      }
    >
      <div className="flex items-center h-[52px] px-6">
        <h1 className="text-[20px] leading-[30px] font-semibold text-[#181d27]">{title}</h1>
      </div>
      {(tabs || actionLabel) && (
        <>
          <div className={`h-px bg-[#e9eaeb] ${embedded ? '' : 'mx-6'}`} />
          <div className="flex h-[56px] items-end justify-between border-b border-[#e9eaeb] px-6 gap-6">
            <nav ref={navRef} className="relative flex items-end min-w-0 h-full gap-4">
              {tabs?.map((tab) => {
                const active = tab.key === activeTabKey
                return (
                  <button
                    key={tab.key}
                    ref={(node) => {
                      tabRefs.current[tab.key] = node
                    }}
                    type="button"
                    onClick={() => onTabChange?.(tab.key)}
                    className="relative z-10 flex items-center gap-2 h-full shrink-0 transition-colors duration-[120ms] ease-[var(--motion-ease-default)]"
                    style={{
                      fontSize: 14,
                      lineHeight: '20px',
                      color: active ? '#181d27' : '#535862',
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    {tab.label}
                    {showTabCounts && typeof tab.count === 'number' && (
                      <span
                        className="inline-flex items-center justify-center rounded-md shrink-0 min-w-6 h-6 px-2 text-[14px] leading-5 font-medium transition-colors duration-[120ms] ease-[var(--motion-ease-default)]"
                        style={{
                          background: active ? 'rgba(21, 184, 176, 0.12)' : '#f5f5f6',
                          color: active ? '#15b8b0' : '#535862',
                        }}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
              {!!tabs?.length && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 h-[2px] transition-[left,width,opacity] duration-[180ms] ease-[var(--motion-ease-default)]"
                  style={{
                    left: indicator.left,
                    width: indicator.width,
                    opacity: indicator.ready ? 1 : 0,
                  }}
                >
                  <div className="h-full w-full rounded-full bg-[#15b8b0]" />
                </div>
              )}
            </nav>
            {headerEnd ? (
              <div className="flex shrink-0 items-center gap-2 self-center">{headerEnd}</div>
            ) : (secondaryActionLabel || actionLabel) ? (
              <div className="shrink-0 self-center flex items-center gap-2">
                {secondaryActionLabel && onSecondaryActionClick && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onSecondaryActionClick}
                    className="shrink-0 text-[#535862]"
                  >
                    <DotsHorizontal width={20} height={20} className="mr-1 shrink-0" aria-hidden />
                    {secondaryActionLabel}
                  </Button>
                )}
                {actionLabel && onActionClick && (
                  <Button
                    onClick={onActionClick}
                    className={`shrink-0 ${compactPrimaryActionOnSmallScreens ? 'px-2.5 sm:px-3' : ''}`}
                    aria-label={actionLabel}
                  >
                    {actionLabel.toLowerCase().includes('connect') ? (
                      <LinkRegularIcon className={`w-5 h-5 ${compactPrimaryActionOnSmallScreens ? '' : 'mr-1.5'}`} />
                    ) : (
                      <Plus
                        width={20}
                        height={20}
                        className={`shrink-0 ${compactPrimaryActionOnSmallScreens ? '' : 'mr-1.5'}`}
                        aria-hidden
                      />
                    )}
                    <span className={compactPrimaryActionOnSmallScreens ? 'hidden sm:inline' : ''}>
                      {actionLabel}
                    </span>
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </>
      )}
    </header>
  )
}
