'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Upload } from 'lucide-react'
import { createProduct, updateProduct } from '@/lib/actions/products'

type Product = {
  id: string
  name: string
  type: string
  weight: number
  price: number
  stock: number
  description: string
  imageUrl: string
  images: string[]
  badge: string | null
  qurbanLocation: string
  allowHomeDelivery: boolean
  status: string
}

type Props = { product?: Product; onClose: () => void }

const PRODUCT_TYPES = [
  { value: 'LOKAL', label: 'Lokal' },
  { value: 'ETAWA', label: 'Etawa' },
  { value: 'GARUT', label: 'Garut' },
  { value: 'BATUR', label: 'Batur' },
]

const QURBAN_LOCATIONS = [
  { value: 'INDONESIA', label: 'Indonesia' },
  { value: 'AFRICA', label: 'Afrika' },
  { value: 'PALESTINE', label: 'Palestina' },
]

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/uploads', { method: 'POST', body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data.url as string
}

export default function ProductForm({ product, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '')
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [qurbanLocation, setQurbanLocation] = useState(product?.qurbanLocation ?? 'INDONESIA')

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    isMain: boolean
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      if (isMain) {
        setImageUrl(url)
      } else if (images.length < 5) {
        setImages((prev) => [...prev, url])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal upload')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    const payload = {
      name: fd.get('name') as string,
      type: fd.get('type') as 'LOKAL' | 'ETAWA' | 'GARUT' | 'BATUR',
      weight: parseFloat(fd.get('weight') as string),
      price: parseInt(fd.get('price') as string, 10),
      stock: parseInt(fd.get('stock') as string, 10),
      description: fd.get('description') as string,
      imageUrl,
      images,
      badge: (fd.get('badge') as string) || null,
      qurbanLocation: fd.get('qurbanLocation') as 'INDONESIA' | 'AFRICA' | 'PALESTINE',
      allowHomeDelivery: fd.get('allowHomeDelivery') === 'true',
      status: fd.get('status') as 'ACTIVE' | 'INACTIVE',
    }

    startTransition(async () => {
      const result = product
        ? await updateProduct(product.id, payload)
        : await createProduct(payload)

      if ('error' in result && result.error) {
        setError(typeof result.error === 'string' ? result.error : 'Data tidak valid.')
        return
      }

      onClose()
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end">
      <div className="h-full w-full max-w-lg bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-serif font-bold text-[#0D1F17] text-lg">
            {product ? 'Edit Produk' : 'Tambah Produk'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Foto utama */}
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-2">Foto Utama *</label>
            {imageUrl ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                <Image src={imageUrl} alt="Foto utama" fill className="object-cover" sizes="500px" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1B5E3B] transition-colors">
                <Upload size={24} className="text-gray-400 mb-2" />
                <span className="text-sm text-[#6B7280]">Upload foto utama (max 2MB)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, true)}
                />
              </label>
            )}
          </div>

          {/* Galeri */}
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-2">
              Galeri ({images.length}/5)
            </label>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                  <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-[#1B5E3B]">
                  <Upload size={18} className="text-gray-400" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, false)}
                  />
                </label>
              )}
            </div>
            {uploading && <p className="text-xs text-[#6B7280] mt-1">Mengupload...</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Nama Produk *</label>
            <input
              name="name"
              required
              defaultValue={product?.name}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Jenis *</label>
              <select
                name="type"
                required
                defaultValue={product?.type ?? 'LOKAL'}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] bg-white"
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Berat (kg) *</label>
              <input
                name="weight"
                required
                type="number"
                step="0.5"
                min="1"
                defaultValue={product?.weight}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Harga (Rp) *</label>
              <input
                name="price"
                required
                type="number"
                min="0"
                defaultValue={product?.price}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Stok *</label>
              <input
                name="stock"
                required
                type="number"
                min="0"
                defaultValue={product?.stock ?? 1}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Deskripsi *</label>
            <textarea
              name="description"
              required
              rows={4}
              defaultValue={product?.description}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Badge</label>
              <input
                name="badge"
                defaultValue={product?.badge ?? ''}
                placeholder="Best Seller / Premium"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Status</label>
              <select
                name="status"
                defaultValue={product?.status ?? 'ACTIVE'}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] bg-white"
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Lokasi Kurban *</label>
            <select
              name="qurbanLocation"
              value={qurbanLocation}
              onChange={(e) => setQurbanLocation(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] bg-white"
            >
              {QURBAN_LOCATIONS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {qurbanLocation === 'INDONESIA' && (
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Metode Pengiriman</label>
              <select
                name="allowHomeDelivery"
                defaultValue={product?.allowHomeDelivery ? 'true' : 'false'}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] bg-white"
              >
                <option value="true">Bisa Antar Rumah &amp; Penyaluran</option>
                <option value="false">Penyaluran Saja</option>
              </select>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || uploading || !imageUrl}
              className="flex-1 py-3 rounded-xl bg-[#1B5E3B] text-white text-sm font-semibold hover:bg-[#0D3320] disabled:opacity-60 transition-colors"
            >
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
