import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ChannelListingStatus, IntegrationStatus } from '@/types/channel'
import { LinkBrokenIcon, LinkRegularIcon } from './ActionIcons'
import { motionTokens } from '@/lib/motion'

interface StatusBadgeProps {
  status: IntegrationStatus
}

interface AirbnbStatusBadgeProps {
  status: ChannelListingStatus
  muted?: boolean
}

const labelMap: Record<IntegrationStatus, string> = {
  pending: 'Pending',
  connecting: 'Connecting...',
  pending_import: 'Pending import',
  pending_export: 'Pending export',
  not_in_hostaway: 'Not in Hostaway',
  importing: 'Importing...',
  connected: 'Connected',
  ready_to_export: 'Ready to export',
  exporting: 'Exporting',
  published: 'Published',
  missing_requirements: 'Missing requirements',
  disconnected: 'Disconnected',
}

const airbnbLabelMap: Record<ChannelListingStatus, string> = {
  live: 'Live',
  hidden_from_guests: 'Hidden from guests',
  action_required: 'Action required',
}

function DotIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <circle cx="4" cy="4" r="3" fill="currentColor" />
    </svg>
  )
}

function HourglassIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M8 3h8M8 21h8M9 3v3a3 3 0 0 0 .88 2.12L12 10.24l2.12-2.12A3 3 0 0 0 15 6V3M15 21v-3a3 3 0 0 0-.88-2.12L12 13.76l-2.12 2.12A3 3 0 0 0 9 18v3" />
    </svg>
  )
}

function ImportingSpinnerIcon() {
  return (
    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" className="opacity-30" />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  )
}

const flowStatuses: IntegrationStatus[] = ['pending_import', 'pending_export', 'importing', 'exporting', 'connected']

function PendingToConnectedIcon({
  status,
  previousStatus,
}: {
  status: IntegrationStatus
  previousStatus: IntegrationStatus
}) {
  const reduceMotion = useReducedMotion()
  const fromPending = previousStatus === 'pending_import' || previousStatus === 'pending_export'
  const fromActive = previousStatus === 'importing' || previousStatus === 'exporting'
  const justBecameConnected = (fromPending || fromActive) && status === 'connected'

  if (reduceMotion) {
    if (status === 'importing' || status === 'exporting') return <ImportingSpinnerIcon />
    if (status === 'pending_import' || status === 'pending_export') return <HourglassIcon />
    if (status === 'connected') return <LinkRegularIcon className="block h-3 w-3" />
    return null
  }

  return (
    <span className="relative inline-flex h-3 w-3 items-center justify-center">
      <AnimatePresence mode="wait" initial={false}>
        {status === 'pending_import' || status === 'pending_export' ? (
          <motion.span
            key="pending"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: motionTokens.easing.default }}
            className="inline-flex h-3 w-3 items-center justify-center"
          >
            <HourglassIcon />
          </motion.span>
        ) : status === 'importing' || status === 'exporting' ? (
          <motion.span
            key="active"
            initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.28, ease: motionTokens.easing.emphasize }}
            className="inline-flex h-3 w-3 items-center justify-center"
          >
            <ImportingSpinnerIcon />
          </motion.span>
        ) : status === 'connected' && justBecameConnected ? (
          <motion.span
            key="connected"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="inline-flex h-3 w-3 items-center justify-center"
          >
            <LinkRegularIcon className="block h-3 w-3" />
          </motion.span>
        ) : status === 'connected' ? (
          <span className="inline-flex h-3 w-3 items-center justify-center">
            <LinkRegularIcon className="block h-3 w-3" />
          </span>
        ) : null}
      </AnimatePresence>
    </span>
  )
}

const chipBase =
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-medium leading-[18px] whitespace-nowrap'

const linkStatuses: IntegrationStatus[] = ['connected', 'disconnected']

function LinkStatusIcon({
  status,
  previousStatus,
}: {
  status: Extract<IntegrationStatus, 'connected' | 'disconnected'>
  previousStatus: IntegrationStatus
}) {
  const reduceMotion = useReducedMotion()
  const isBreaking = previousStatus === 'connected' && status === 'disconnected'
  const isReconnecting = previousStatus === 'disconnected' && status === 'connected'
  const shouldAnimateTransition = isBreaking || isReconnecting

  if (reduceMotion) {
    return status === 'connected' ? <LinkRegularIcon className="block h-3 w-3" /> : <LinkBrokenIcon className="block h-3 w-3" />
  }

  return (
    <span className="relative inline-flex h-3 w-3 items-center justify-center">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={
            shouldAnimateTransition
              ? { opacity: 0, scale: 0.86, rotate: isBreaking ? -14 : 14, y: -0.5 }
              : { opacity: 1, scale: 1, rotate: 0, y: 0 }
          }
          animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
          exit={
            shouldAnimateTransition
              ? { opacity: 0, scale: 0.86, rotate: isBreaking ? 12 : -12, y: 0.5 }
              : { opacity: 1, scale: 1, rotate: 0, y: 0 }
          }
          transition={{ duration: 0.22, ease: motionTokens.easing.default }}
          className="inline-flex h-3 w-3 items-center justify-center"
        >
          {status === 'connected' ? (
            <LinkRegularIcon className="block h-3 w-3" />
          ) : (
            <LinkBrokenIcon className="block h-3 w-3" />
          )}
        </motion.span>
      </AnimatePresence>
      {isBreaking && (
        <motion.svg
          viewBox="0 0 12 12"
          className="pointer-events-none absolute inset-0 text-[#535862]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.95, 0], scale: [0.95, 1, 1.04] }}
          transition={{ duration: 0.28, ease: motionTokens.easing.default }}
        >
          <motion.path
            d="M2 10L10 2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.2, ease: motionTokens.easing.default }}
          />
        </motion.svg>
      )}
    </span>
  )
}

export function AirbnbStatusBadge({ status, muted = false }: AirbnbStatusBadgeProps) {
  if (muted) {
    return (
      <span className={`${chipBase} border-[#eaecf0] bg-[#f6f9fc] text-[#98a2b3]`}>
        <DotIcon className="h-2 w-2 text-[#98a2b3]" />
        {airbnbLabelMap[status]}
      </span>
    )
  }

  const colorClass =
    status === 'live'
      ? 'border-[#d5d7da] bg-white text-[#344054]'
      : status === 'hidden_from_guests'
        ? 'border-[#d5d7da] bg-white text-[#344054]'
        : 'border-[#d5d7da] bg-white text-[#344054]'

  const dotClass =
    status === 'live'
      ? 'text-[#17b26a]'
      : status === 'hidden_from_guests'
        ? 'text-[#f79009]'
        : 'text-[#f04438]'

  return (
    <span className={`${chipBase} ${colorClass}`}>
      <DotIcon className={`h-2 w-2 ${dotClass}`} />
      {airbnbLabelMap[status]}
    </span>
  )
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const previousStatusRef = useRef<IntegrationStatus>(status)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    previousStatusRef.current = status
  }, [status])

  const previousStatus = previousStatusRef.current
  const isLinkStatus = linkStatuses.includes(status)
  const linkStatus = isLinkStatus ? (status as Extract<IntegrationStatus, 'connected' | 'disconnected'>) : null

  const isFlowStatus = flowStatuses.includes(status)
  const isPending = status === 'pending_import' || status === 'pending_export'

  const config =
    status === 'connected'
      ? {
          className: 'border-[#abefc6] bg-[#ecfdf3] text-[#067647]',
          icon: linkStatus ? (
            isFlowStatus ? (
              <PendingToConnectedIcon status={status} previousStatus={previousStatus} />
            ) : (
              <LinkStatusIcon status={linkStatus} previousStatus={previousStatus} />
            )
          ) : (
            isFlowStatus ? (
              <PendingToConnectedIcon status={status} previousStatus={previousStatus} />
            ) : (
              <LinkRegularIcon className="block h-3 w-3" />
            )
          ),
        }
      : status === 'importing' || status === 'exporting'
        ? {
            className: 'border-[#d5d7da] bg-[#f6f9fc] text-[#535862]',
            icon: <PendingToConnectedIcon status={status} previousStatus={previousStatus} />,
          }
        : status === 'pending_import' || status === 'pending_export'
          ? {
              className: 'border-[#d5d7da] bg-[#f6f9fc] text-[#535862]',
              icon: <PendingToConnectedIcon status={status} previousStatus={previousStatus} />,
            }
          : status === 'not_in_hostaway' || status === 'disconnected'
            ? {
                className: 'border-[#d5d7da] bg-[#f6f9fc] text-[#535862]',
                icon: linkStatus ? (
                  <LinkStatusIcon status={linkStatus} previousStatus={previousStatus} />
                ) : (
                  <LinkBrokenIcon className="block h-3 w-3" />
                ),
              }
            : { className: 'border-[#d5d7da] bg-white text-[#535862]', icon: <DotIcon className="h-2 w-2 text-[#98a2b3]" /> }

  const chipContent = (
    <>
      <span>{config.icon}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, y: -1 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 1 }}
          transition={{ duration: motionTokens.duration.fast, ease: motionTokens.easing.default }}
        >
          {labelMap[status]}
        </motion.span>
      </AnimatePresence>
    </>
  )

  if (isPending && !reduceMotion) {
    return (
      <motion.span
        className={`${chipBase} ${config.className} transition-colors duration-[220ms] ease-[var(--motion-ease-default)]`}
        animate={{ scale: [1, 1.015, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {chipContent}
      </motion.span>
    )
  }

  const justBecameConnected =
    status === 'connected' && (previousStatus === 'importing' || previousStatus === 'exporting')
  if (justBecameConnected && !reduceMotion) {
    return (
      <motion.span
        className={`${chipBase} ${config.className}`}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 0.35, ease: motionTokens.easing.emphasize }}
      >
        {chipContent}
      </motion.span>
    )
  }

  return (
    <span className={`${chipBase} ${config.className} transition-colors duration-[220ms] ease-[var(--motion-ease-default)]`}>
      {chipContent}
    </span>
  )
}
