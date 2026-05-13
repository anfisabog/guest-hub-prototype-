/** Stable pravatar seed — matches list, quick panel, messages, and details page. */
export function reservationGuestAvatarSeed(reservationId: string): string {
  return `guest-${reservationId}`
}

/**
 * `sizePx` is the requested image dimensions from pravatar (use 2–3× display size for sharp retina).
 * Display sizes: table/panel ~32px → use {@link RESERVATION_AVATAR_SRC_TABLE};
 * details profile ~36px → {@link RESERVATION_AVATAR_SRC_DETAIL}.
 */
export function reservationGuestAvatarUrl(reservationId: string, sizePx: number): string {
  const u = encodeURIComponent(reservationGuestAvatarSeed(reservationId))
  return `https://i.pravatar.cc/${sizePx}?u=${u}`
}

/** Owner-stay pills use a separate pravatar pool so they read as "host" not guest. */
export function ownerStayAvatarSeed(reservationId: string, listingId: string): string {
  return `host-${listingId}-${reservationId}`
}

export function ownerStayAvatarUrl(reservationId: string, listingId: string, sizePx: number): string {
  const u = encodeURIComponent(ownerStayAvatarSeed(reservationId, listingId))
  return `https://i.pravatar.cc/${sizePx}?u=${u}`
}

/** ~32px CSS avatar — request larger bitmap for crisp rendering */
export const RESERVATION_AVATAR_SRC_TABLE = 96
/** Sidebar header + chat bubbles (32px CSS) */
export const RESERVATION_AVATAR_SRC_PANEL = 96
/** Full details “Profile image” row (36px CSS) */
export const RESERVATION_AVATAR_SRC_DETAIL = 128
