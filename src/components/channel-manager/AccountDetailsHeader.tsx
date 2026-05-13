import { Badge } from '@/components/ui'
import { getChannelLogoBackground } from '@/config/channels'
import type { ChannelConfig } from '@/types/channel'
import type { IntegrationStatus } from '@/types/channel'

export interface AccountDetailsHeaderProps {
  channel: ChannelConfig
  accountName: string
  email: string
  avatarUrl?: string | null
  status: IntegrationStatus
  accountListings: number
  synced: number
  notSynced: number
  isConnecting?: boolean
}

export function AccountDetailsHeader({
  channel,
  accountName,
  email,
  avatarUrl,
  status,
  accountListings,
  synced,
  notSynced,
  isConnecting = false,
}: AccountDetailsHeaderProps) {
  const isConnected = [
    'connected',
    'published',
    'ready_to_export',
    'exporting',
    'pending_import',
    'importing',
    'pending_export',
  ].includes(status)
  const showProfileImage = isConnected && avatarUrl

  return (
    <div className="px-6 py-6 border-b border-border">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 shrink-0 rounded-full bg-white border border-[#e9eaeb] flex items-center justify-center overflow-hidden">
          {showProfileImage ? (
            <img src={avatarUrl} alt={accountName} className="w-full h-full object-cover" />
          ) : (
            <>
              <img
                src={channel.logo}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
              <div
                className="hidden w-full h-full rounded-full"
                style={{ backgroundColor: getChannelLogoBackground(channel) }}
              />
            </>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{accountName}</h2>
            {isConnecting ? (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Connecting...
              </span>
            ) : (
              <Badge variant={status as never}>{formatStatus(status)}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{email}</p>
          {!isConnecting && (
            <div className="flex gap-6 mt-4 text-sm">
              <span>
                <span className="font-medium">{accountListings}</span>
                <span className="text-muted-foreground ml-1">account listings</span>
              </span>
              <span>
                <span className="font-medium text-green-600">{synced}</span>
                <span className="text-muted-foreground ml-1">synced</span>
              </span>
              <span>
                <span className="font-medium text-amber-600">{notSynced}</span>
                <span className="text-muted-foreground ml-1">not synced</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatStatus(s: IntegrationStatus): string {
  const map: Record<IntegrationStatus, string> = {
    not_in_hostaway: 'Not in Hostaway',
    pending: 'Pending',
    connecting: 'Connecting…',
    pending_import: 'Pending import',
    pending_export: 'Pending export',
    importing: 'Importing…',
    connected: 'Connected',
    ready_to_export: 'Ready to export',
    exporting: 'Exporting…',
    published: 'Published',
    missing_requirements: 'Missing requirements',
    disconnected: 'Disconnected',
  }
  return map[s] ?? s
}
