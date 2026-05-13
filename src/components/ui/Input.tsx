import { type ChangeEvent, type InputHTMLAttributes, forwardRef } from 'react'
import { Input as RACInput, TextField } from 'react-aria-components'
import { cn } from '@/lib/cn'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'size'> {
  className?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', onChange, ...props }, ref) => (
    <TextField className="w-full">
      <RACInput
        ref={ref}
        type={type}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e)}
        className={cn(
          /* Aligned with TableFilter / channel toolbar controls */
          'flex h-9 w-full min-w-0 rounded-md border border-[#d5d7da] bg-white px-3 py-0 text-[14px] leading-5 text-[#414651]',
          'shadow-[0px_1px_2px_rgba(10,13,18,0.05)] transition-[border-color,box-shadow] duration-100 ease-linear',
          'placeholder:text-[#717680]',
          'focus:border-[#15b8b0] focus:outline-none focus:ring-2 focus:ring-[#15b8b0]/20',
          'disabled:cursor-not-allowed disabled:border-[#e9eaeb] disabled:bg-[#f6f9fc] disabled:text-[#a4a7ae]',
          className
        )}
        {...props}
      />
    </TextField>
  )
)
Input.displayName = 'Input'

export { Input }
