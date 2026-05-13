import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { SlidingSidePanel } from '@/lib/motion'
import { cn } from '@/lib/cn'
import {
  DESIGN_SYSTEM_COMPONENTS,
  catalogVariantCount,
  getDefaultDemoAxes,
  resolveDemoVariant,
  type CatalogComponent,
  type DesignSystemComponentId,
} from './designSystem/catalogData'
import { DesignSystemVariantPanel } from './designSystem/DesignSystemVariantPanel'
import { DesignSystemVariationControls } from './designSystem/DesignSystemVariationControls'

const LAYOUTS_AND_PATTERNS = [
  { name: 'PageHeader', summary: 'Title, tabs, and action toolbar.' },
  { name: 'Pagination', summary: 'Page controls for long lists.' },
  { name: 'EmptyState', summary: 'Zero-data messaging with actions.' },
  { name: 'PageLayout (legacy)', summary: 'Older Hostaway page scaffolding.' },
] as const

const PANEL_WIDTH_RATIO = 0.56
const PANEL_MIN_PX = 560
const PANEL_MAX_PX = 1200

export function DesignSystemRepositoryPage() {
  const rowRef = useRef<HTMLDivElement>(null)
  const [panelWidthPx, setPanelWidthPx] = useState(720)
  const [selectedId, setSelectedId] = useState<DesignSystemComponentId>('avatar')
  const [demoAxes, setDemoAxes] = useState<Record<string, string>>(() =>
    getDefaultDemoAxes(DESIGN_SYSTEM_COMPONENTS[0]!),
  )
  const [panelOpen, setPanelOpen] = useState(true)

  const selected = useMemo(
    () => DESIGN_SYSTEM_COMPONENTS.find((c) => c.id === selectedId) ?? DESIGN_SYSTEM_COMPONENTS[0]!,
    [selectedId],
  )

  const focusedVariant = useMemo(() => resolveDemoVariant(selected, demoAxes), [selected, demoAxes])

  useLayoutEffect(() => {
    const el = rowRef.current
    if (!el) return
    const measure = () => {
      const w = el.getBoundingClientRect().width
      const next = Math.min(PANEL_MAX_PX, Math.max(PANEL_MIN_PX, Math.round(w * PANEL_WIDTH_RATIO)))
      setPanelWidthPx(next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    setDemoAxes(getDefaultDemoAxes(selected))
  }, [selectedId, selected])

  const selectComponent = (id: DesignSystemComponentId) => {
    setSelectedId(id)
    setPanelOpen(true)
  }

  return (
    <div
      ref={rowRef}
      className="flex min-h-0 flex-1 gap-0 transition-[gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
    >
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e9eaeb] bg-white">
        <header className="shrink-0 border-b border-[#e9eaeb] px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">Repository</p>
          <h1 className="mt-0.5 text-[18px] font-semibold leading-7 text-[#181d27]">
            Hostaway design system
          </h1>
          <p className="mt-1 max-w-[640px] text-[13px] leading-5 text-[#535862]">
            Atoms from <span className="font-medium text-[#414651]">@hostaway/design-system</span>. The center
            column lists every variation axis and option; the inspector mirrors the same controls and hosts the
            live demo.
          </p>
        </header>

        <div className="flex min-h-0 flex-1">
          <nav
            className="flex w-[220px] shrink-0 flex-col border-r border-[#e9eaeb] bg-[#fafafa]"
            aria-label="Design system components"
          >
            <p className="px-4 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">
              Atoms
            </p>
            <ul className="flex flex-col gap-0.5 px-2 pb-4">
              {DESIGN_SYSTEM_COMPONENTS.map((c: CatalogComponent) => {
                const active = c.id === selectedId
                const nTypes = c.types.length
                const nVar = catalogVariantCount(c)
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => selectComponent(c.id)}
                      className={cn(
                        'flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors',
                        active
                          ? 'bg-white ring-1 ring-inset ring-[#e9eaeb]'
                          : 'hover:bg-white/80',
                      )}
                    >
                      <span
                        className={cn(
                          'text-[14px] font-semibold leading-5',
                          active ? 'text-[#101828]' : 'text-[#414651]',
                        )}
                      >
                        {c.name}
                      </span>
                      <span className="text-[11px] text-[#98a2b3]">
                        {nTypes} {nTypes === 1 ? 'type' : 'types'} ·{' '}
                        {c.id === 'button' || c.id === 'table' ? (
                          <>
                            {nVar} <span className="text-[#b0b8c4]">combinations</span>
                          </>
                        ) : (
                          <>
                            {nVar} {nVar === 1 ? 'variation' : 'variations'}
                          </>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-auto border-t border-[#e9eaeb] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">
                Layouts
              </p>
              <ul className="mt-2 space-y-1.5 text-[12px] leading-4 text-[#98a2b3]">
                {LAYOUTS_AND_PATTERNS.map((p) => (
                  <li key={p.name}>{p.name}</li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
            <div className="shrink-0 border-b border-[#e9eaeb] px-8 py-8">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">
                {selected.layer}
              </p>
              <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-[#101828]">{selected.name}</h2>
              <p className="mt-2 max-w-[52ch] text-[15px] leading-7 text-[#535862]">{selected.summary}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {!panelOpen ? (
                  <Button type="button" onClick={() => setPanelOpen(true)}>
                    Open inspector
                  </Button>
                ) : (
                  <p className="text-[13px] text-[#717680]">
                    Inspector open — <span className="font-medium text-[#414651]">Demo</span> shows the live
                    preview for the same selection.
                  </p>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
              <DesignSystemVariationControls
                component={selected}
                demoAxes={demoAxes}
                onDemoAxesChange={setDemoAxes}
                title="Variations"
                description="Every axis and option for this component. Changes here update the demo in the inspector."
              />
            </div>
          </div>
        </div>
      </section>

      <SlidingSidePanel
        show={panelOpen}
        motionKey="design-system-variant-panel"
        panelWidthPx={panelWidthPx}
        className="shadow-none"
      >
        <DesignSystemVariantPanel
          component={selected}
          focusedVariant={focusedVariant}
          onClose={() => setPanelOpen(false)}
        />
      </SlidingSidePanel>
    </div>
  )
}
