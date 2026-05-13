import { getChannelById } from '@/config/channels'

interface ChannelIconProps {
  channelId: string
  size?: number
}

export function ChannelIcon({ channelId, size = 24 }: ChannelIconProps) {
  const channel = getChannelById(channelId)
  if (!channel) return null

  return (
    <div className="inline-flex items-center justify-center overflow-hidden" style={{ width: size, height: size }}>
      {channel.logo ? (
        <img src={channel.logo} alt={channel.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px] font-semibold" style={{ color: channel.brandColor }}>
          {channel.name[0]}
        </span>
      )}
    </div>
  )
}
