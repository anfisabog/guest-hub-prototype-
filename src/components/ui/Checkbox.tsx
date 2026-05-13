import { type ChangeEvent, type ComponentProps, type InputHTMLAttributes, forwardRef } from 'react'
import { Checkbox as RACCheckbox } from 'react-aria-components'
import { cn } from '@/lib/cn'

type RacCheckboxProps = ComponentProps<typeof RACCheckbox>

export interface CheckboxProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'children' | 'className' | 'onChange' | 'value'
  > {
  className?: string
  /** Partial selection (header “select all” rows). */
  isIndeterminate?: boolean
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}

const Checkbox = forwardRef<HTMLLabelElement, CheckboxProps>(
  ({ className = '', checked, defaultChecked, onChange, isIndeterminate, disabled, ...props }, ref) => {
    return (
      <RACCheckbox
        ref={ref}
        isSelected={checked}
        defaultSelected={defaultChecked}
        isIndeterminate={isIndeterminate}
        isDisabled={disabled}
        onChange={(selected) => {
          onChange?.({ target: { checked: selected } } as ChangeEvent<HTMLInputElement>)
        }}
        className={cn('group relative inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center', className)}
        {...(props as unknown as RacCheckboxProps)}
      >
        {({ isSelected, isIndeterminate: indeterminate, isDisabled, isFocusVisible }) => (
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-[6px] border bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.05)] transition-colors',
              'border-zinc-300',
              (isSelected || indeterminate) && 'border-[#344054] bg-[#344054]',
              isDisabled && 'opacity-50',
              isFocusVisible && 'ring-2 ring-[#15b8b0] ring-offset-0'
            )}
          >
            {indeterminate ? (
              <span className="h-0.5 w-2 rounded-full bg-white" aria-hidden />
            ) : isSelected ? (
              <svg
                className="h-3 w-3 text-white"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 8.5l3 3 7-7" />
              </svg>
            ) : null}
          </span>
        )}
      </RACCheckbox>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
