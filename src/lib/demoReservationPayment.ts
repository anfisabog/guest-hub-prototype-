/**
 * Demo rules: past stays = Paid; check-in within 7 days = 95% Paid;
 * farther future = more Partially paid / Unpaid (smooth ramp).
 */
export type DemoPaymentStatus = 'Paid' | 'Unpaid' | 'Partially paid'

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function demoPaymentStatusForCheckIn(checkIn: Date, rng: () => number): DemoPaymentStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const ci = new Date(checkIn)
  ci.setHours(0, 0, 0, 0)
  if (ci.getTime() < today.getTime()) {
    return 'Paid'
  }
  const daysAhead = Math.round((ci.getTime() - today.getTime()) / 86400000)
  if (daysAhead <= 7) {
    if (rng() < 0.95) return 'Paid'
    return rng() < 0.5 ? 'Partially paid' : 'Unpaid'
  }
  const paidProb = Math.max(0.18, 0.95 - (daysAhead - 7) * 0.014)
  const r = rng()
  if (r < paidProb) return 'Paid'
  const denom = 1 - paidProb
  if (denom <= 0) return 'Unpaid'
  const rem = (r - paidProb) / denom
  if (rem < 0.62) return 'Partially paid'
  return 'Unpaid'
}

/** Stable status for a calendar block (same inputs → same dot / tooltip). */
export function demoPaymentStatusForBookingBlock(checkIn: Date, reservationId: string): DemoPaymentStatus {
  let h = 0
  for (let i = 0; i < reservationId.length; i++) {
    h = Math.imul(31, h) + reservationId.charCodeAt(i)
  }
  const rng = mulberry32((h ^ Math.floor(checkIn.getTime() / 86400000)) >>> 0)
  return demoPaymentStatusForCheckIn(checkIn, rng)
}
