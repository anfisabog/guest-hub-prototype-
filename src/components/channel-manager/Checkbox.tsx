interface CheckboxProps {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  'aria-label': string
}

export function Checkbox({ checked, indeterminate = false, onChange, 'aria-label': ariaLabel }: CheckboxProps) {
  const isActive = checked || indeterminate
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
        isActive
          ? 'border-[#344054] bg-[#344054]'
          : 'border-[#cfd4dc] bg-white hover:border-[#98a2b3]'
      }`}
    >
      {checked && (
        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M4.5 10.5l3.5 3.5 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {!checked && indeterminate && <span className="w-2.5 h-0.5 rounded bg-white" />}
    </button>
  )
}
