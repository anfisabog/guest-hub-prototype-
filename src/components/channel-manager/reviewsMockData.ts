export type ReviewWorkflowStatus =
  | 'published_replied'
  | 'published'
  | 'submitted'
  | 'awaiting'
  | 'expired'

export interface ReviewDetailPart {
  reviewerName: string
  rating: number
  body: string
  privateNote: string
  submittedAt: string
  status: string
  channel: string
}

export interface ReviewRecord {
  id: string
  guestName: string
  workflowStatus: ReviewWorkflowStatus
  /** 1–5 when visible in list; null shows "—" */
  rating: number | null
  reviewSnippet: string
  checkInDMY: string
  checkOutDMY: string
  listingName: string
  channelsLabel: string
  listingsScopeLabel: string
  guestReview: ReviewDetailPart
  hostReview: ReviewDetailPart
}

const guestFirstNames = [
  'Kevin',
  'Robert',
  'Sofia',
  'Amelia',
  'Marcus',
  'Elena',
  'James',
  'Priya',
  'Lucas',
  'Nina',
  'Oliver',
  'Hannah',
  'Diego',
  'Yuki',
  'Clara',
]

const guestLastNames = [
  'Young',
  'Lewis',
  'Martinez',
  'Patel',
  'Nguyen',
  'Kowalski',
  'Andersson',
  'Silva',
  'Fischer',
  'Cohen',
  'Murphy',
  'Tanaka',
  'Rossi',
  'Bakker',
  'Lopez',
]

const listingPool = [
  'House in Barcelona',
  'City Loft Madrid',
  'Seaside Villa Lisbon',
  'Old Town Apartment',
  'Beachfront Condo Malaga',
  'Central Flat Valencia',
  'Garden Townhouse Porto',
  'Alpine Chalet Andorra',
]

const channelPairs = [
  'Airbnb, Vrbo',
  'Airbnb',
  'Booking.com, Airbnb',
  'Vrbo',
  'Direct, Airbnb',
]

const positiveBodies = [
  (listing: string) =>
    `We loved staying at ${listing}. The space was spotless, the photos matched reality, and the host’s local tips made our trip effortless. Quiet building, comfortable beds, and the kitchen had everything we needed for breakfasts before heading out.`,
  (listing: string) =>
    `${listing} exceeded our expectations. Check-in was seamless, Wi‑Fi was fast for remote work, and the neighborhood had great cafés within a short walk. We would happily book again for our next visit.`,
  (listing: string) =>
    `Wonderful stay — thoughtful touches like extra towels, clear house manual, and responsive communication. ${listing} felt calm and well maintained; we appreciated how spotless the bathrooms and linens were.`,
  (listing: string) =>
    `Ideal location and a very comfortable layout for our group. ${listing} was bright, airy, and stocked with the essentials. The host was proactive about arrival time and made us feel genuinely welcome.`,
  (listing: string) =>
    `Five stars for cleanliness and comfort. ${listing} is exactly as described; AC worked great, water pressure was strong, and we slept really well. Thanks for a memorable stay — we’re already recommending it to friends.`,
  (listing: string) =>
    `Charming place with personality and practical amenities. We enjoyed the balcony mornings and how quiet it was at night. Communication was quick whenever we had a question — ${listing} is a gem.`,
  (listing: string) =>
    `Great value and a host who clearly cares. ${listing} had plenty of storage, good lighting for reading, and easy access to transit. Minor hiccup with parking instructions was resolved in minutes.`,
  (listing: string) =>
    `Perfect base for exploring the area. ${listing} was secure, well heated, and the appliances all worked flawlessly. We appreciated the eco-friendly supplies and the clear recycling guidance.`,
]

const snippets = [
  'Spotless, quiet, and exactly as pictured — would book again in a heartbeat.',
  'Host was incredibly responsive; check-in after a delayed flight was painless.',
  'Loved the neighborhood and the thoughtful welcome basket.',
  'Comfortable beds, great shower pressure, and fast Wi‑Fi for work calls.',
  'Clear instructions, seamless self check-in, and a truly relaxing space.',
  'Ideal for families — plenty of room and kid-friendly touches throughout.',
  'Stylish decor without sacrificing practicality; every detail felt considered.',
  'We appreciated the late checkout flexibility — made our last day stress-free.',
]

const hostReviewerNames = [
  'Host Smith',
  'Maria Lopez',
  'Javier Ruiz',
  'Alex Morgan',
  'Taylor Brooks',
  'Jordan Lee',
]

function monthShort(i: number): string {
  const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return m[i % 12]
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** Deterministic “random” in [0, max) */
function rnd(seed: number, max: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return Math.floor((x - Math.floor(x)) * max)
}

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[rnd(seed, arr.length)]!
}

function workflowForIndex(index: number): ReviewWorkflowStatus {
  const r = rnd(index + 11, 100)
  if (r < 38) return 'published_replied'
  if (r < 62) return 'published'
  if (r < 78) return 'submitted'
  if (r < 92) return 'awaiting'
  return 'expired'
}

function ratingForWorkflow(status: ReviewWorkflowStatus, index: number): number | null {
  if (status === 'awaiting' || status === 'expired') return null
  if (status === 'submitted') return rnd(index + 3, 2) === 0 ? null : pick([4, 5], index)
  const bias = rnd(index + 99, 100)
  if (bias < 78) return 5
  if (bias < 94) return 4
  return 3
}

function dmy(seed: number): string {
  const day = 1 + (seed % 26)
  const month = 1 + ((seed * 5) % 12)
  const year = 2025 + (seed % 2)
  return `${pad2(day)}/${pad2(month)}/${year}`
}

function submittedAtLabel(index: number): string {
  const d = 1 + (index % 27)
  const m = monthShort(index + 4)
  const y = 2026 + (index % 2)
  return `${m} ${d}, ${y}`
}

export function buildReviewRecord(index: number): ReviewRecord {
  const id = `rev-${5000 + index}`
  const guestName = `${pick(guestFirstNames, index)} ${pick(guestLastNames, index + 50)}`
  const listingName = pick(listingPool, index + 2)
  const workflowStatus = workflowForIndex(index)
  const rating = ratingForWorkflow(workflowStatus, index)
  const checkInDMY = dmy(index * 11)
  const checkOutDMY = dmy(index * 11 + 5 + rnd(index, 5))
  const channelsLabel = pick(channelPairs, index + 7)
  const listingsScopeLabel = rnd(index + 21, 5) === 0 ? 'All listings' : listingName
  const bodyFn = pick(positiveBodies, index + 13)
  const body = bodyFn(listingName)
  const snippet = pick(snippets, index + 31)
  const guestReviewer = guestName
  const hostReviewer = pick(hostReviewerNames, index + 44)
  const submitted = submittedAtLabel(index)
  const guestRating = rating ?? pick([4, 5], index + 60)
  const hostRating = pick([5, 5, 5, 4], index + 71)
  const guestStatusLabel =
    workflowStatus === 'published_replied' || workflowStatus === 'published'
      ? 'Published'
      : workflowStatus === 'submitted'
        ? 'Submitted'
        : workflowStatus === 'awaiting'
          ? 'Awaiting'
          : 'Expired'

  return {
    id,
    guestName,
    workflowStatus,
    rating,
    reviewSnippet: snippet,
    checkInDMY,
    checkOutDMY,
    listingName,
    channelsLabel,
    listingsScopeLabel,
    guestReview: {
      reviewerName: guestReviewer,
      rating: guestRating,
      body,
      privateNote: 'Thank you for your help!',
      submittedAt: submitted,
      status: guestStatusLabel,
      channel: 'Hostaway',
    },
    hostReview: {
      reviewerName: hostReviewer,
      rating: hostRating,
      body,
      privateNote: 'Thank you for your help!',
      submittedAt: submitted,
      status: 'Published',
      channel: 'Hostaway',
    },
  }
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

export const reviewRows: ReviewRecord[] = shuffle(
  Array.from({ length: 92 }, (_, i) => buildReviewRecord(i)),
)
