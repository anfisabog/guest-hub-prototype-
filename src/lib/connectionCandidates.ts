import type { ChannelListingStatus } from '@/types/channel'

export interface ConnectionCandidateRow {
  id: string
  name: string
  channelListingId: string
  channelStatus: ChannelListingStatus
}

const BARCELONA_NAMES = [
  'Sunny Flat in El Born',
  'Modern Loft in Gracia',
  'Cozy Studio in Gothic Quarter',
  'Bright Apartment in Eixample',
  'Penthouse in Poblenou',
  'Designer Home in Sant Antoni',
  'Charming Stay in Poble Sec',
  'City Retreat in Les Corts',
  'Mediterranean Suite in Barceloneta',
  'Family Apartment in Sants',
  'Terrace Flat in Raval',
  'Minimal Home in Diagonal Mar',
  'Classic Apartment in Vila de Gracia',
  'Boutique Loft in Sant Gervasi',
]

function shuffle<T>(items: T[]) {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function createConnectionCandidates(accountId: string) {
  const names = shuffle(BARCELONA_NAMES).slice(0, 8)
  const statuses: ChannelListingStatus[] = ['live', 'hidden_from_guests', 'live', 'live', 'hidden_from_guests', 'live', 'hidden_from_guests', 'live']

  return names.map((name, index): ConnectionCandidateRow => ({
    id: `connect-${accountId}-${index + 1}`,
    name,
    channelListingId: `CH-${String(123456111 + index)}`,
    channelStatus: statuses[index] ?? 'live',
  }))
}

export function createHostawayMapOptions(candidates: ConnectionCandidateRow[]) {
  const candidateNames = [...new Set(candidates.map((c) => c.name))]
  const otherNames = shuffle(BARCELONA_NAMES.filter((n) => !candidateNames.includes(n))).slice(0, Math.max(0, 8 - candidateNames.length))
  const allNames = [...candidateNames, ...otherNames].slice(0, 8)
  return allNames.map((name, index) => ({
    id: `hostaway-${index + 1}`,
    name,
  }))
}

