'use client'

import { useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { deleteProduct } from '@/lib/actions/products'
import ProductForm from './ProductForm'

type Product = {
  id: string
  name: string
  slug: string
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

const TYPE_LABEL: Record<string, string> = { LOKAL: 'Lokal', ETAWA: 'Etawa', GARUT: 'Garut', BATUR: 'Batur' }
const LOCATION_LABEL: Record<string, string> = { INDONESIA: 'Indonesia', AFRICA: 'Afrika', PALESTINE: 'Palestina' }

export default function AdminProdukPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [isPending, startTransition] = useTransition()

  async function loadProducts() {
    setLoading(true)
    const res = await fetch('/api/admin/products')
    if (res.ok) setProducts(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadProducts() }, [])

  function handleEdit(product: Product) {
    setEditProduct(product)
    setShowForm(true)
  }

  function handleClose() {
    setShowForm(false)
    setEditProduct(null)
    loadProducts()
  }

  function handleDelete(id: string) {
    if (!confirm('Hapus produk ini? Tindakan tidak bisa dibatalkan.')) return
    startTransition(async () => {
      await deleteProduct(id)
      loadProducts()
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0D1F17]">Produk</h1>
          <p className="text-sm text-[#6B7280] mt-1">{products.length} produk terdaftar</p>
        </div>
        <button
          onClick={() => { setEditProduct(null); setShowForm(true) }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B5E3B] text-white text-sm font-semibold hover:bg-[#0D3320] transition-colors"
        >
          <Plus size={16} />
          Tambah Produk
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6B7280]">Memuat...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[#6B7280] text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-medium">Produk</th>
                  <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Jenis</th>
                  <th className="text-left px-6 py-3 font-medium hidden lg:table-cell">Lokasi</th>
                  <th className="text-right px-6 py-3 font-medium">Harga</th>
                  <th className="text-center px-6 py-3 font-medium">Stok</th>
                  <th className="text-center px-6 py-3 font-medium">Status</th>
                  <th className="text-right px-6 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-[#0D1F17] leading-snug">{product.name}</p>
                          {product.badge && (
                            <span className="text-xs text-[#C8962A] font-semibold">{product.badge}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#6B7280] hidden md:table-cell">
                      {TYPE_LABEL[product.type] ?? product.type}
                    </td>
                    <td className="px-6 py-4 text-[#6B7280] hidden lg:table-cell">
                      {LOCATION_LABEL[product.qurbanLocation] ?? product.qurbanLocation}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-[#0D1F17]">
                      Rp {product.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-semibold ${product.stock === 0 ? 'text-red-600' : 'text-[#0D1F17]'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        product.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {product.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-[#6B7280] hover:text-[#1B5E3B] transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={isPending}
                          className="p-2 hover:bg-red-50 rounded-lg text-[#6B7280] hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="text-center py-12 text-[#6B7280] text-sm">Belum ada produk</div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <ProductForm product={editProduct ?? undefined} onClose={handleClose} />
      )}
    </div>
  )
}
