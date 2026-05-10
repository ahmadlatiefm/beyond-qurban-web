import { formatCurrency, formatDate } from '@/lib/utils'

const LOCATION_LABEL: Record<string, string> = {
  INDONESIA: 'Pelosok Indonesia',
  AFRICA:    'Afrika Sub-Sahara',
  PALESTINE: 'Palestina',
}

export function buildPembelianData(order: {
  orderNumber: string
  customerName: string
  totalAmount: number
  quantity: number
  createdAt: Date
  product: { name: string; weight: number }
}): Record<string, string> {
  return {
    nama_pembeli: order.customerName,
    atas_nama: order.customerName,
    jenis_hewan: order.product.name,
    jumlah_hewan: `${order.quantity} ekor`,
    nomor_order: order.orderNumber,
    tanggal: formatDate(order.createdAt),
    total_harga: formatCurrency(order.totalAmount),
    berat_hewan: order.product.weight ? `${order.product.weight} kg` : '',
    nomor_sertifikat: '',
    lokasi_penyaluran: '',
    campaign: '',
  }
}

export function buildQurbanData(donation: {
  customerName: string
  qurbanName?: string | null
  qurbanNames?: string | null
  orderNumber: string
  nomorSertifikat?: string | null
  quantity: number
  createdAt: Date
  campaign: { title: string; location: string; animalType: string }
}): Record<string, string> {
  let atasNama = donation.customerName
  if (donation.qurbanNames) {
    try {
      const arr = JSON.parse(donation.qurbanNames) as string[]
      const filtered = (Array.isArray(arr) ? arr : []).filter(n => !!(n && n.trim()))
      if (filtered.length > 0) atasNama = filtered.join(', ')
    } catch {}
  } else if (donation.qurbanName) {
    atasNama = donation.qurbanName
  }

  return {
    nama_pembeli: donation.customerName,
    atas_nama: atasNama,
    jenis_hewan: donation.campaign.animalType || 'Hewan Qurban',
    jumlah_hewan: `${donation.quantity} ekor`,
    nomor_order: donation.orderNumber,
    nomor_sertifikat: donation.nomorSertifikat ?? '',
    tanggal: formatDate(donation.createdAt),
    lokasi_penyaluran: LOCATION_LABEL[donation.campaign.location] ?? donation.campaign.title,
    campaign: donation.campaign.title,
    total_harga: '',
    berat_hewan: '',
  }
}
