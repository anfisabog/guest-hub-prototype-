import { getChannelById, getChannelLogoBackground } from '@/config/channels'

const HEADER_ICON_SIZE = 18

interface ChannelAvatarCircleProps {
  channelId: string
  size?: number
}

/** Small circular channel avatar for table header (brand circle + logo). Header use: 18px, 6px gap to label. */
export function ChannelAvatarCircle({ channelId, size = HEADER_ICON_SIZE }: ChannelAvatarCircleProps) {
  const channel = getChannelById(channelId)
  if (!channel) return null

  return (
    <div
      className="flex shrink-0 overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: getChannelLogoBackground(channel),
      }}
    >
      {channel.logo ? (
        <img
          src={channel.logo}
          alt={channel.name}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span
          className="text-[10px] font-semibold text-white"
          style={{ fontSize: Math.round(size * 0.4) }}
        >
          {channel.name[0]}
        </span>
      )}
    </div>
  )
}

interface HostawayAvatarCircleProps {
  size?: number
}

/** Hostaway icon for table header (18px, 6px gap to label). */
export function HostawayAvatarCircle({ size = HEADER_ICON_SIZE }: HostawayAvatarCircleProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden
    >
      <circle cx="8" cy="8" r="8" fill="#FF8537" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.1041 10.667C13.0412 10.8978 12.8173 11.2196 12.6354 11.4295C12.4256 11.6743 12.2017 11.8422 11.9429 11.9122C11.2293 12.122 11.1034 11.5274 11.2433 10.8559C11.3273 10.4571 11.4462 10.0444 11.5511 9.68762C12.2227 7.40709 12.9782 5.24549 13.6777 2.99994C13.223 2.69214 12.5725 2.80406 12.2157 3.04891C11.8239 3.31473 11.698 3.81841 11.5161 4.37805C11.2153 5.30845 10.8446 6.53266 10.5648 7.30915C9.69032 7.31615 8.80889 7.32314 7.92746 7.31615C8.06737 6.86844 8.20728 6.42772 8.34019 5.98701C8.55005 5.39939 8.76691 4.80477 8.95579 4.21016C9.06072 3.89536 9.22862 3.37769 9.08871 3.09088C8.91382 2.72012 8.34719 2.79707 7.93445 2.83205C6.24155 2.97895 4.89142 3.60854 3.92604 4.61589C3.5273 5.02863 3.12856 5.54629 3.0586 6.25284C3.05161 6.32979 3.05161 6.39974 3.05161 6.47669C3.10058 6.95238 3.5273 7.30915 4.00299 7.26019C4.12891 7.24619 4.24783 7.21122 4.35277 7.14826C4.35277 7.14826 4.35277 7.14826 4.35976 7.14826C4.63259 6.99436 4.79348 6.70055 4.79348 6.39275C4.79348 6.32979 4.78649 6.26683 4.7725 6.21086C4.74451 6.03598 4.74451 5.85409 4.77949 5.67921C4.93339 4.85374 5.70289 4.17518 6.3115 3.86038C6.53536 3.74146 6.94109 3.57357 7.14396 3.6785C7.40979 3.81141 7.03903 4.58791 6.95508 4.82576C6.54235 5.994 5.94774 8.34448 5.59097 9.51273C5.18523 10.5551 4.66057 11.6883 3.92604 12.1011C3.73017 12.213 3.47134 12.3179 3.24048 12.199C2.99564 11.6953 3.69519 11.1287 3.56228 10.576C3.50631 10.3522 3.25448 10.2612 2.93968 10.2263C2.54094 10.681 1.8204 11.9052 2.33807 12.5837C2.51295 12.8216 2.86972 12.9405 3.29645 12.9545C4.35277 12.9825 5.24819 12.4019 5.86379 11.7653C6.52836 11.0797 6.94109 10.1423 7.30486 9.17695C7.34683 9.05802 7.3888 8.9391 7.43078 8.82018H7.43777C7.45176 8.7782 7.45876 8.74323 7.47275 8.70125C7.54271 8.51238 7.60566 8.3235 7.66862 8.13462C7.68261 8.08565 7.7036 8.04368 7.72459 7.99471C8.61301 7.99471 9.50144 7.99471 10.3829 7.98771C10.11 8.7852 9.90018 9.59667 9.75328 10.4291C9.52942 11.7233 9.7113 12.9405 11.0824 12.9055C12.0898 12.8776 12.6984 12.0381 13.1881 11.3665C13.2901 11.2266 13.2569 10.7499 13.1041 10.667Z"
        fill="white"
      />
    </svg>
  )
}
