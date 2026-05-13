export type IntegrationStatus =
  | 'pending'
  | 'connecting'
  | 'pending_import'
  | 'pending_export'
  | 'not_in_hostaway'
  | 'importing'
  | 'connected'
  | 'ready_to_export'
  | 'exporting'
  | 'published'
  | 'missing_requirements'
  | 'disconnected'

export type ChannelListingStatus = 'live' | 'hidden_from_guests' | 'action_required'

export type PublishStatus = 'draft' | 'published' | 'unpublished'

export interface ChannelConfig {
  id: string
  name: string
  logo: string
  brandColor: string
  /** Chip background behind the logo; use when the SVG’s own background differs from `brandColor`. */
  logoBackgroundColor?: string
  connectionSteps?: string[]
}

export interface ConnectedAccount {
  id: string
  channelId: string
  accountName: string
  email: string
  avatarUrl?: string
  status: IntegrationStatus
  accountListings: number
  synced: number
  notSynced: number
  connectedAt?: string
}

export interface Listing {
  id: string
  name: string
  channelId: string
  accountId: string
  integrationStatus: IntegrationStatus
  channelStatus?: ChannelListingStatus
  channelListingId?: string
  hostawayName?: string | null
  hostawayId?: string | null
  publishStatus?: PublishStatus
  missingRequirements?: string[]
}
