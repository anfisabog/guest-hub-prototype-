import { type ButtonHTMLAttributes, forwardRef, type ComponentProps } from 'react'
import { Button as RACButton } from 'react-aria-components'
import { cn } from '@/lib/cn'

type RacButtonProps = ComponentProps<typeof RACButton>

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'value'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', disabled, type = 'button', ...props }, ref) => {
    const base = cn(
      'group relative inline-flex cursor-pointer items-center justify-center gap-1 whitespace-nowrap font-semibold outline-none transition duration-100 ease-linear',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15b8b0]',
      'data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40'
    )
    const variants = {
      primary: cn(
        /* Cool slate default (softer than zinc-900); hover to product ink for clear press affordance */
        'bg-[#344054] text-white shadow-sm ring-1 ring-inset ring-black/[0.08] hover:bg-[#101828] active:bg-[#0c111d]',
        'before:pointer-events-none before:absolute before:inset-px before:rounded-[7px] before:border before:border-white/[0.12]'
      ),
      secondary: cn(
        'bg-white text-zinc-700 shadow-sm ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
      ),
      outline: cn(
        'border border-zinc-300 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50'
      ),
      ghost: cn('text-zinc-700 hover:bg-zinc-100'),
      destructive: cn(
        'bg-red-600 text-white shadow-sm ring-1 ring-inset ring-black/10 hover:bg-red-700'
      ),
    }
    const sizes = {
      sm: 'h-8 rounded-lg px-3 py-2 text-sm leading-5',
      md: 'h-9 rounded-lg px-3.5 py-2 text-sm leading-5',
      lg: 'h-11 rounded-lg px-4 py-2.5 text-base',
    }
    return (
      <RACButton
        ref={ref}
        type={type}
        isDisabled={disabled}
        className={cn(base, variants[variant], sizes[size], className)}
        {...(props as unknown as RacButtonProps)}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
