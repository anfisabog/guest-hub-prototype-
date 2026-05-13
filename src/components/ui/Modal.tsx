import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from './Button'
import { MotionPresence, motionTokens } from '@/lib/motion'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    full: 'w-screen h-screen max-w-none max-h-none',
  }

  return createPortal(
    <MotionModalContainer
      open={open}
      onClose={onClose}
      title={title}
      children={children}
      footer={footer}
      sizeClass={sizes[size]}
      isFull={size === 'full'}
    />,
    document.body
  )
}

interface MotionModalContainerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  sizeClass: string
  isFull: boolean
}

function MotionModalContainer({
  open,
  onClose,
  title,
  children,
  footer,
  sizeClass,
  isFull,
}: MotionModalContainerProps) {
  const reduceMotion = useReducedMotion()

  return (
    <MotionPresence mode="wait">
      {open ? (
        <motion.div key="modal-root" className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.default }}
          />
          <motion.div
            className={`relative z-10 bg-white shadow-lg flex flex-col ${sizeClass} ${isFull ? 'rounded-none' : 'rounded-lg'}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.default }}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-[background-color,color] duration-[120ms] ease-[var(--motion-ease-default)]"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex-1 overflow-auto p-6">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </MotionPresence>
  )
}

export interface ModalFooterProps {
  cancelLabel?: string
  onCancel: () => void
  primaryLabel?: string
  onPrimary: () => void
  primaryDisabled?: boolean
}

export function ModalFooter({
  cancelLabel = 'Cancel',
  onCancel,
  primaryLabel = 'Confirm',
  onPrimary,
  primaryDisabled = false,
}: ModalFooterProps) {
  return (
    <>
      <Button variant="outline" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button onClick={onPrimary} disabled={primaryDisabled}>
        {primaryLabel}
      </Button>
    </>
  )
}
