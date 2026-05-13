import type { Listing } from '@/types/channel'

const BARCELONA_LISTING_POOL = [
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

export function createBarcelonaExportCandidates(accountId: string, channelId: string) {
  const picked = shuffle(BARCELONA_LISTING_POOL).slice(0, 8)
  const missingIndex = Math.floor(Math.random() * picked.length)

  return picked.map((name, index): Listing => ({
    id: `export-${accountId}-${index + 1}`,
    name,
    channelId,
    accountId,
    integrationStatus: index === missingIndex ? 'missing_requirements' : 'ready_to_export',
    channelStatus: 'hidden_from_guests',
    hostawayId: `HA-BCN-${String(1200 + index)}`,
    publishStatus: 'draft',
    missingRequirements: index === missingIndex ? ['Missing photo gallery'] : undefined,
  }))
}

