import type { ChannelConfig } from '@/types/channel'

const channelAsset = (filename: string) => `${import.meta.env.BASE_URL}channels/${filename}`

export const channels: ChannelConfig[] = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    logo: channelAsset('airbnb.svg'),
    brandColor: '#FF5A5F',
    connectionSteps: ['Sign in to Airbnb', 'Authorize connection', 'Select listings to sync'],
  },
  {
    id: 'booking',
    name: 'Booking.com',
    logo: channelAsset('booking.svg'),
    brandColor: '#003580',
    logoBackgroundColor: '#0C3B7C',
    connectionSteps: ['Sign in to Booking.com', 'Authorize connection', 'Select listings to sync'],
  },
  {
    id: 'vrbo',
    name: 'Vrbo',
    logo: channelAsset('vrbo.svg'),
    brandColor: '#00A699',
    connectionSteps: ['Sign in to VRBO', 'Authorize connection', 'Select listings to sync'],
  },
  {
    id: 'expedia',
    name: 'Expedia',
    logo: channelAsset('expedia.svg'),
    brandColor: '#00355F',
    logoBackgroundColor: '#072F54',
    connectionSteps: ['Sign in to Expedia', 'Authorize connection', 'Select listings to sync'],
  },
  {
    id: 'marriott',
    name: 'Marriott',
    logo: channelAsset('marriott.svg'),
    brandColor: '#A57A5A',
    logoBackgroundColor: '#FFFFFF',
    connectionSteps: ['Sign in to Marriott', 'Authorize connection', 'Select listings to sync'],
  },
  {
    id: 'google',
    name: 'Google',
    logo: channelAsset('google.svg'),
    brandColor: '#4285F4',
    logoBackgroundColor: '#FFFFFF',
    connectionSteps: ['Sign in to Google', 'Authorize connection', 'Select listings to sync'],
  },
  {
    id: 'ical',
    name: 'iCal',
    logo: '',
    brandColor: '#22B8CF',
    connectionSteps: ['Share your iCal URL', 'Validate feed', 'Start syncing listings'],
  },
]

export const getChannelById = (id: string): ChannelConfig | undefined =>
  channels.find((c) => c.id === id)

/** Circular logo chip background — matches the SVG asset’s own backdrop when set. */
export function getChannelLogoBackground(channel: ChannelConfig): string {
  return channel.logoBackgroundColor ?? channel.brandColor
}
