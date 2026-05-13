import { cn } from '@/lib/cn'
import {
  getComponentDemoSchema,
  type CatalogComponent,
} from './catalogData'

const labelClass = 'text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]'

/** Native radios: accent + focus ring aligned with product teal. */
const radioClass = cn(
  'h-4 w-4 shrink-0 border-[#d5d7da] accent-[#15b8b0]',
  'focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/25 focus:ring-offset-0',
)

export function DesignSystemVariationControls({
  component,
  demoAxes,
  onDemoAxesChange,
  title = 'Variations',
  description,
  className,
}: {
  component: CatalogComponent
  demoAxes: Record<string, string>
  onDemoAxesChange: (next: Record<string, string>) => void
  title?: string
  description?: string
  className?: string
}) {
  const schema = getComponentDemoSchema(component)

  const setAxis = (dimId: string, value: string) => {
    onDemoAxesChange({ ...demoAxes, [dimId]: value })
  }

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">{title}</h3>
        {description ? (
          <p className="mt-1 max-w-[52ch] text-[13px] leading-5 text-[#535862]">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        {schema.dimensions.map((dim) => {
          const v = demoAxes[dim.id] ?? dim.options[0]!.value
          const groupName = `ds-var-${component.id}-${dim.id}`
          return (
            <fieldset key={dim.id} className="min-w-0 border-0 p-0">
              <legend className={cn(labelClass, 'mb-3 block w-full')}>{dim.label}</legend>
              <div className="flex flex-col gap-2.5">
                {dim.options.map((opt) => {
                  const id = `${groupName}-${opt.value}`
                  const checked = v === opt.value
                  return (
                    <label
                      key={opt.value}
                      htmlFor={id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-md py-0.5 pr-2',
                        checked && 'text-[#101828]',
                      )}
                    >
                      <input
                        id={id}
                        type="radio"
                        name={groupName}
                        value={opt.value}
                        checked={checked}
                        onChange={() => setAxis(dim.id, opt.value)}
                        className={radioClass}
                      />
                      <span
                        className={cn(
                          'text-[14px] leading-5',
                          checked ? 'font-medium text-[#101828]' : 'text-[#535862]',
                        )}
                      >
                        {opt.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )
        })}
      </div>
    </div>
  )
}
