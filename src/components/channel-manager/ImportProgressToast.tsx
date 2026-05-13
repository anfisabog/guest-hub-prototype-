import { Toast } from '@/components/ui'

interface ImportProgressToastProps {
  open: boolean
  current: number
  total: number
  onCancel: () => void
}

export function ImportProgressToast({ open, current, total, onCancel }: ImportProgressToastProps) {
  return (
    <Toast
      open={open}
      title="Importing listings"
      variant="progress"
      progress={{ current, total }}
      onCancel={onCancel}
      cancelLabel="Cancel import"
    />
  )
}
