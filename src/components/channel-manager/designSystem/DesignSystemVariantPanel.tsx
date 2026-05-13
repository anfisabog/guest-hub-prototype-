import { useEffect, useState } from 'react'
import { XClose } from '@untitled-ui/icons-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import {
  catalogTypeForVariant,
  catalogVariantCount,
  type CatalogComponent,
  type CatalogVariant,
} from './catalogData'
import { DesignSystemLivePreview } from './DesignSystemLivePreview'

type PanelTab = 'demo' | 'properties' | 'usage'

const sectionLabel = 'text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]'

export function DesignSystemVariantPanel({
  component,
  focusedVariant,
  onClose,
}: {
  component: CatalogComponent
  focusedVariant: CatalogVariant
  onClose: () => void
}) {
  const [tab, setTab] = useState<PanelTab>('demo')
  const focusedType = catalogTypeForVariant(component, focusedVariant.id)
  const totalVariations = catalogVariantCount(component)

  useEffect(() => {
    setTab('demo')
  }, [component.id])

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e9eaeb] px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">Inspector</p>
          <h2 className="mt-1 text-[18px] font-semibold leading-7 tracking-tight text-[#101828]">
            {component.name}
          </h2>
          <p className="mt-0.5 text-[12px] leading-4 text-[#717680]">
            {component.types.length} {component.types.length === 1 ? 'type' : 'types'}
            <span className="text-[#d5d7da]"> · </span>
            {component.id === 'button' || component.id === 'table' ? (
              <>
                {totalVariations} <span className="text-[#98a2b3]">matrix combinations</span>
              </>
            ) : (
              <>
                {totalVariations} {totalVariations === 1 ? 'variation' : 'variations'}
              </>
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="!h-9 !w-9 shrink-0 !rounded-md !p-0 hover:bg-[#f2f4f7]"
          aria-label="Close panel"
          onClick={onClose}
        >
          <XClose className="h-5 w-5 text-[#667085]" aria-hidden />
        </Button>
      </div>

      <div className="flex shrink-0 gap-0 border-b border-[#e9eaeb] px-3">
        {(
          [
            ['demo', 'Demo'] as const,
            ['properties', 'Properties'] as const,
            ['usage', 'Usage and rules'] as const,
          ] satisfies readonly (readonly [PanelTab, string])[]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              '-mb-px border-b-2 px-4 py-3 text-[13px] font-semibold transition-colors',
              tab === id
                ? 'border-[#15b8b0] text-[#101828]'
                : 'border-transparent text-[#717680] hover:text-[#414651]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'demo' ? (
          <div className="flex min-h-0 flex-col gap-8 p-5">
            <div
              className={cn(
                'flex min-h-[min(48vh,420px)] flex-1 py-6',
                component.id === 'table' ? 'items-start justify-stretch' : 'items-center justify-center',
              )}
            >
              <DesignSystemLivePreview
                componentId={component.id}
                variant={focusedVariant}
                className={cn(
                  'flex min-h-[200px] w-full max-w-full border-0 bg-transparent p-6',
                  component.id === 'table'
                    ? 'items-start justify-start'
                    : 'items-center justify-center',
                )}
              />
            </div>

            {focusedType && focusedType.tokens.length > 0 ? (
              <section>
                <p className={sectionLabel}>Tokens · {focusedType.label}</p>
                <div className="mt-3 overflow-hidden rounded-md border border-[#e9eaeb] bg-white">
                  <table className="w-full border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-[#e9eaeb] bg-[#fafafa]">
                        <th className="py-2.5 pl-4 pr-3 font-semibold text-[#414651]">Token / spec</th>
                        <th className="py-2.5 pr-4 font-semibold text-[#414651]">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {focusedType.tokens.map((row) => (
                        <tr key={row.name} className="border-b border-[#f2f4f7] last:border-0">
                          <td className="py-2.5 pl-4 pr-3 align-top">
                            <span className="font-mono text-[12px] text-[#414651]">{row.name}</span>
                            {row.tokenRef ? (
                              <span className="mt-0.5 block text-[11px] text-[#98a2b3]">{row.tokenRef}</span>
                            ) : null}
                          </td>
                          <td className="py-2.5 pr-4 font-medium text-[#181d27]">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            <section>
              <p className={sectionLabel}>Props snapshot</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {focusedVariant.props.map((p) => (
                  <div
                    key={p.name}
                    className="inline-flex items-center gap-2 rounded-md border border-[#e9eaeb] bg-white px-3 py-2 text-[12px]"
                  >
                    <span className="font-medium text-[#98a2b3]">{p.name}</span>
                    <span className="font-semibold text-[#414651]">{p.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {tab === 'properties' ? (
          <div className="p-5">
            <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#98a2b3]">
              Component · type · variation
            </p>
            <p className="text-[15px] font-semibold text-[#101828]">
              {component.name}
              {focusedType ? (
                <>
                  <span className="font-normal text-[#98a2b3]"> · </span>
                  {focusedType.label}
                </>
              ) : null}
              <span className="font-normal text-[#98a2b3]"> · </span>
              {focusedVariant.label}
            </p>

            {focusedType && focusedType.tokens.length > 0 ? (
              <div className="mt-6">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">
                  Tokens for type · {focusedType.label}
                </p>
                <table className="w-full border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#e9eaeb]">
                      <th className="py-2 pr-4 font-semibold text-[#414651]">Token / spec</th>
                      <th className="py-2 font-semibold text-[#414651]">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {focusedType.tokens.map((row) => (
                      <tr key={row.name} className="border-b border-[#f2f4f7]">
                        <td className="py-2.5 pr-4 align-top">
                          <span className="font-mono text-[12px] text-[#414651]">{row.name}</span>
                          {row.tokenRef ? (
                            <span className="mt-0.5 block text-[11px] text-[#98a2b3]">{row.tokenRef}</span>
                          ) : null}
                        </td>
                        <td className="py-2.5 font-medium text-[#181d27]">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="mt-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">
                Variation props
              </p>
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#e9eaeb]">
                    <th className="py-2 pr-4 font-semibold text-[#414651]">Property</th>
                    <th className="py-2 font-semibold text-[#414651]">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {focusedVariant.props.map((row) => (
                    <tr key={row.name} className="border-b border-[#f2f4f7]">
                      <td className="py-2.5 pr-4 text-[#667085]">{row.name}</td>
                      <td className="py-2.5 font-medium text-[#181d27]">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-[12px] leading-4 text-[#98a2b3]">
              Values reflect this in-app prototype. Wire to{' '}
              <code className="rounded bg-[#f5f5f6] px-1 py-px text-[11px]">@hostaway/design-system</code>{' '}
              for production parity.
            </p>
          </div>
        ) : null}

        {tab === 'usage' ? (
          <article className="max-w-[65ch] p-5">
            <h3 className="text-[20px] font-semibold leading-7 tracking-tight text-[#101828]">
              How to use {component.name}
            </h3>
            <p className="mt-2 text-[14px] leading-6 text-[#717680]">
              Practical guidance for product and engineering. This is living documentation—adjust as the library
              evolves.
            </p>
            <div className="mt-8 space-y-6">
              {component.usageAndRules.map((paragraph, i) => (
                <p key={i} className="text-[15px] leading-[1.75] text-[#374151]">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        ) : null}
      </div>
    </div>
  )
}
