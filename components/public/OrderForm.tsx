'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { calculateShipping, formatShippingLabel, BANDUNG_RAYA_CITIES } from '@/lib/shipping'
import { createOrder } from '@/lib/actions/orders'

type Product = {
  id: string
  name: string
  price: number
  stock: number
  allowHomeDelivery: boolean
  qurbanLocation: string
}

type Props = { product: Product }

const DELIVERY_DATE_OPTIONS = [
  { value: 'H-3', label: 'H-3 (3 hari sebelum Idul Adha)' },
  { value: 'H-2', label: 'H-2 (2 hari sebelum Idul Adha)' },
  { value: 'H-1', label: 'H-1 (1 hari sebelum Idul Adha)' },
  { value: 'H', label: 'Hari H (Idul Adha)' },
]

export default function OrderForm({ product }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deliveryMethod, setDeliveryMethod] = useState<'ONE_UMMAH' | 'HOME_DELIVERY'>('ONE_UMMAH')
  const [city, setCity] = useState('')
  const [shippingCost, setShippingCost] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const showDeliveryChoice = product.allowHomeDelivery && product.qurbanLocation === 'INDONESIA'

  const handleCityChange = (value: string) => {
    setCity(value)
    if (deliveryMethod === 'HOME_DELIVERY') {
      setShippingCost(value.trim() ? calculateShipping(value) : 0)
    }
  }

  const handleMethodChange = (method: 'ONE_UMMAH' | 'HOME_DELIVERY') => {
    setDeliveryMethod(method)
    if (method === 'ONE_UMMAH') setShippingCost(0)
    else if (city.trim()) setShippingCost(calculateShipping(city))
  }

  const totalAmount = product.price + shippingCost

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    const sacrificeDateRaw = fd.get('sacrificeDate') as string
    const deliveryDateOffset = fd.get('deliveryDate') as string | null

    let deliveryDateISO: string | undefined
    if (deliveryMethod === 'HOME_DELIVERY' && sacrificeDateRaw && deliveryDateOffset) {
      const sacrificeMs = new Date(sacrificeDateRaw).getTime()
      const offsets: Record<string, number> = { 'H-3': -3, 'H-2': -2, 'H-1': -1, 'H': 0 }
      const days = offsets[deliveryDateOffset] ?? 0
      deliveryDateISO = new Date(sacrificeMs + days * 86_400_000).toISOString()
    }

    const payload = {
      productId: product.id,
      quantity: 1 as const,
      customerName: (fd.get('customerName') as string).trim(),
      phone: (fd.get('phone') as string).trim(),
      whatsapp: (fd.get('whatsapp') as string).trim(),
      deliveryMethod,
      address: (fd.get('address') as string) || undefined,
      kelurahan: (fd.get('kelurahan') as string) || undefined,
      kecamatan: (fd.get('kecamatan') as string) || undefined,
      city: city || undefined,
      province: (fd.get('province') as string) || undefined,
      postalCode: (fd.get('postalCode') as string) || undefined,
      deliveryNotes: (fd.get('deliveryNotes') as string) || undefined,
      sacrificeDate: sacrificeDateRaw ? new Date(sacrificeDateRaw).toISOString() : '',
      deliveryDate: deliveryDateISO,
      notes: (fd.get('notes') as string) || undefined,
    }

    startTransition(async () => {
      const result = await createOrder(payload)

      if ('error' in result && result.error) {
        setError(typeof result.error === 'string' ? result.error : 'Data tidak valid. Periksa kembali.')
        return
      }

      if ('success' in result && result.success && result.order) {
        if ('tripayPaymentUrl' in result.order && result.order.tripayPaymentUrl) {
          window.location.href = result.order.tripayPaymentUrl as string
        } else {
          router.push(`/lacak?order=${result.order.orderNumber}`)
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Data Customer */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-serif font-bold text-[#0D1F17] text-lg mb-5">Data Pemesan</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Nama Lengkap *</label>
            <input name="customerName" required className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" placeholder="Nama sesuai identitas" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">No. HP *</label>
              <input name="phone" required type="tel" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" placeholder="08xxxxxxxxxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">No. WhatsApp *</label>
              <input name="whatsapp" required type="tel" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" placeholder="08xxxxxxxxxx" />
            </div>
          </div>
        </div>
      </div>

      {/* Metode */}
      {showDeliveryChoice && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-serif font-bold text-[#0D1F17] text-lg mb-5">Metode Penerimaan Kurban</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'ONE_UMMAH', label: 'Penyaluran One Ummah', desc: 'Daging dibagikan ke penerima manfaat' },
              { value: 'HOME_DELIVERY', label: 'Antar ke Rumah', desc: 'Daging dikirim ke alamat Anda' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleMethodChange(opt.value as 'ONE_UMMAH' | 'HOME_DELIVERY')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  deliveryMethod === opt.value
                    ? 'border-[#1B5E3B] bg-[#1B5E3B]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-sm text-[#0D1F17]">{opt.label}</p>
                <p className="text-xs text-[#6B7280] mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alamat — hanya HOME_DELIVERY */}
      {deliveryMethod === 'HOME_DELIVERY' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-serif font-bold text-[#0D1F17] text-lg mb-5">Alamat Pengiriman</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Alamat Lengkap *</label>
              <textarea name="address" required rows={2} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] resize-none" placeholder="Jalan, nomor rumah, RT/RW" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Kelurahan</label>
                <input name="kelurahan" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Kecamatan</label>
                <input name="kecamatan" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Kota/Kabupaten *</label>
                <select
                  value={city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] bg-white"
                >
                  <option value="">Pilih kota...</option>
                  {BANDUNG_RAYA_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Lainnya">Lainnya (Luar Bandung Raya)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Provinsi *</label>
                <input name="province" required className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" placeholder="Jawa Barat" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Kode Pos</label>
              <input name="postalCode" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
            </div>
            {city && (
              <div className={`text-sm font-medium px-4 py-3 rounded-lg ${shippingCost === 0 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                {formatShippingLabel(shippingCost)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Jadwal */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-serif font-bold text-[#0D1F17] text-lg mb-5">Jadwal Kurban</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Tanggal Idul Adha *</label>
            <input name="sacrificeDate" required type="date" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
          </div>
          {deliveryMethod === 'HOME_DELIVERY' && (
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Tanggal Antar ke Rumah *</label>
              <select name="deliveryDate" required className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] bg-white">
                {DELIVERY_DATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Catatan Tambahan</label>
            <textarea name="notes" rows={3} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] resize-none" placeholder="Pesan khusus untuk tim kami..." />
          </div>
        </div>
      </div>

      {/* Ringkasan + Submit */}
      <div className="bg-[#1B5E3B] text-white rounded-2xl p-6">
        <h3 className="font-serif font-bold text-lg mb-4">Ringkasan Pesanan</h3>
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-white/70">Harga domba</span>
            <span>Rp {product.price.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Ongkir</span>
            <span>{shippingCost === 0 ? 'Gratis' : `Rp ${shippingCost.toLocaleString('id-ID')}`}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-white/20 pt-2 mt-2">
            <span>Total</span>
            <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-100 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || product.stock === 0}
          className="w-full py-4 rounded-xl bg-[#C8962A] text-white font-bold text-lg hover:bg-[#b07e20] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Memproses...' : product.stock === 0 ? 'Stok Habis' : 'Pesan & Bayar Sekarang'}
        </button>
      </div>
    </form>
  )
}
