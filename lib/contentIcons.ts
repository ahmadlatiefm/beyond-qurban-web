import {
  faShieldHalved,
  faStar,
  faHeart,
  faCheck,
  faTruckFast,
  faAward,
  faCamera,
  faCow,
  faFileInvoiceDollar,
  faHouseCircleCheck,
  faHandHoldingHeart,
  faStarAndCrescent,
  faCertificate,
  faUsers,
  faPhoneVolume,
  faClipboardCheck,
  faBoxOpen,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

// Curated set used by the CMS icon picker; map keys are stored verbatim in
// Settings JSON so renaming an entry will silently break existing content.
export const CONTENT_ICONS: Record<string, { label: string; icon: IconDefinition }> = {
  shield: { label: 'Shield', icon: faShieldHalved },
  star: { label: 'Star', icon: faStar },
  heart: { label: 'Heart', icon: faHeart },
  check: { label: 'Check', icon: faCheck },
  truck: { label: 'Truck', icon: faTruckFast },
  award: { label: 'Award', icon: faAward },
  camera: { label: 'Camera', icon: faCamera },
  cow: { label: 'Cow', icon: faCow },
  invoice: { label: 'Invoice', icon: faFileInvoiceDollar },
  house: { label: 'House Check', icon: faHouseCircleCheck },
  hand: { label: 'Hand Heart', icon: faHandHoldingHeart },
  crescent: { label: 'Star & Crescent', icon: faStarAndCrescent },
  certificate: { label: 'Certificate', icon: faCertificate },
  users: { label: 'Users', icon: faUsers },
  phone: { label: 'Phone', icon: faPhoneVolume },
  clipboard: { label: 'Clipboard', icon: faClipboardCheck },
  box: { label: 'Box', icon: faBoxOpen },
}

export type ContentIconKey = keyof typeof CONTENT_ICONS

export function getContentIcon(key: string | undefined, fallback: ContentIconKey): IconDefinition {
  if (key && key in CONTENT_ICONS) return CONTENT_ICONS[key].icon
  return CONTENT_ICONS[fallback].icon
}
