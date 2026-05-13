import { Button } from '@/components/ui'
import type { ChannelListingStatus, IntegrationStatus } from '@/types/channel'
import { ImportIcon, LinkBrokenIcon, LinkRegularIcon } from './ActionIcons'

interface ListingRowActionsProps {
  integrationStatus: IntegrationStatus
  channelStatus?: ChannelListingStatus
  onImport: () => void
  onConnect: () => void
  onDisconnect: () => void
  onToggleVisibility: () => void
}

export function ListingRowActions({
  integrationStatus,
  channelStatus = 'live',
  onImport,
  onConnect,
  onDisconnect,
  onToggleVisibility,
}: ListingRowActionsProps) {
  const primaryAction =
    integrationStatus === 'not_in_hostaway'
      ? { onClick: onImport, ariaLabel: 'Import listing', Icon: ImportIcon, disabled: false }
      : integrationStatus === 'connected'
        ? { onClick: onDisconnect, ariaLabel: 'Disconnect listing', Icon: LinkBrokenIcon, disabled: false }
        : integrationStatus === 'disconnected'
          ? { onClick: onConnect, ariaLabel: 'Connect listing', Icon: LinkRegularIcon, disabled: false }
          : { onClick: onImport, ariaLabel: 'Import in progress', Icon: ImportIcon, disabled: true }

  return (
    <div className="inline-flex h-9 items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-9 h-9 p-1.5 text-[#717680] hover:bg-[#f6f9fc]"
        onClick={primaryAction.onClick}
        aria-label={primaryAction.ariaLabel}
        disabled={primaryAction.disabled}
      >
        <span className="w-6 h-6 inline-flex items-center justify-center">
          <primaryAction.Icon className={`w-5 h-5 ${integrationStatus === 'importing' ? 'animate-spin' : ''}`} />
        </span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-9 h-9 p-1.5 text-[#717680] hover:bg-[#f6f9fc]"
        onClick={onToggleVisibility}
        aria-label={channelStatus === 'hidden_from_guests' ? 'Make listing live' : 'Hide listing'}
      >
        <span className="w-6 h-6 inline-flex items-center justify-center">
          {channelStatus === 'hidden_from_guests' ? (
            <svg className="block w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg className="block w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 3l18 18" />
              <path d="M10.58 10.58A2 2 0 0 0 13.42 13.42" />
              <path d="M9.88 5.09A10.94 10.94 0 0 1 12 4.9c5.52 0 9.4 5.1 10.2 6.3a1.3 1.3 0 0 1 0 1.4 17.23 17.23 0 0 1-3.3 3.7" />
              <path d="M6.61 6.61A17.77 17.77 0 0 0 1.8 11.2a1.3 1.3 0 0 0 0 1.4C2.6 13.8 6.48 18.9 12 18.9c1.86 0 3.49-.57 4.89-1.4" />
            </svg>
          )}
        </span>
      </Button>
    </div>
  )
}
