export interface ShippingZone {
  id: string
  name: string      // display name, e.g. "Bandung Raya"
  keywords: string  // comma-separated, e.g. "bandung,cimahi,sumedang"
  cost: number      // 0 = gratis
}

export type ShippingResult =
  | { available: true;  cost: number; zoneName: string }
  | { available: false; cost: null;   zoneName: null }

/** Default zones — used as seed data if admin hasn't configured yet */
export const DEFAULT_SHIPPING_ZONES: ShippingZone[] = [
  { id: '1', name: 'Bandung Raya',   keywords: 'bandung,cimahi,sumedang,bandung barat', cost: 0 },
  { id: '2', name: 'Garut',          keywords: 'garut',                                 cost: 150000 },
  { id: '3', name: 'Subang',         keywords: 'subang',                                cost: 150000 },
  { id: '4', name: 'Purwakarta',     keywords: 'purwakarta',                            cost: 100000 },
  { id: '5', name: 'Tasikmalaya',    keywords: 'tasik,tasikmalaya',                     cost: 150000 },
]

/**
 * Parse zones JSON from Settings (key: shipping_zones).
 * Falls back to DEFAULT_SHIPPING_ZONES if not set.
 */
export function parseShippingZones(json: string | undefined): ShippingZone[] {
  try {
    const parsed = JSON.parse(json ?? '[]')
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch {}
  return DEFAULT_SHIPPING_ZONES
}

/**
 * Get shipping info for a given city against a zones array.
 */
export function getShippingInfo(city: string, zones: ShippingZone[]): ShippingResult {
  if (!city.trim()) return { available: true, cost: 0, zoneName: '' }
  const normalized = city.toLowerCase().trim()
  for (const zone of zones) {
    const keywords = zone.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    if (keywords.some(k => normalized.includes(k))) {
      return { available: true, cost: zone.cost, zoneName: zone.name }
    }
  }
  return { available: false, cost: null, zoneName: null }
}

/** Convenience — returns cost or 0 (for server actions that need a number) */
export function calculateShipping(city: string, zones?: ShippingZone[]): number {
  const z = zones ?? DEFAULT_SHIPPING_ZONES
  const result = getShippingInfo(city, z)
  return result.available ? result.cost : 0
}
