'use client'

import { useEffect, useState, useTransition } from 'react'
import { updateOrderStatus } from '@/lib/actions/orders'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import { Download, MessageCircle } from 'lucide-react'

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
type PaymentStatus = 'UNPAID' | 'PAID' | 'EXPIRED' | 'REFUNDED'

type OrderRow = {
  id: string
  orderNumber: string
  customerName: string
  whatsapp: string
  deliveryMethod: string
  totalAmount: number
  paymentStatus: PaymentStatus
  status: OrderStatus
  createdAt: string
  product: { name: string }
}

const STATUS_TABS: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',       label: 'Semua' },
  { value: 'PENDING',   label: 'Pending' },
  { value: 'CONFIRMED', label: 'Dikonfirmasi' },
  { value: 'PREPARING', label: 'Disiapkan' },
  { value: 'SHIPPED',   label: 'Dikirim' },
  { value: 'DELIVERED', label: 'Terkirim' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
]

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING:   ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPED'],
  SHIPPED:   ['DELIVERED'],
}

const DELIVERY_LABEL: Record<string, string> = {
  ONE_UMMAH:    'Penyaluran',
  HOME_DELIVERY:'Antar Rumah',
}

function exportCSV(orders: OrderRow[]) {
  const headers = ['No Order', 'Nama', 'Produk', 'Metode', 'Total', 'Bayar', 'Status', 'Tanggal']
  const rows = orders.map((o) => [
    o.orderNumber,
    o.customerName,
    o.product.name,
    DELIVERY_LABEL[o.deliveryMethod] ?? o.deliveryMethod,
    o.totalAmount,
    o.paymentStatus,
    o.status,
    new Date(o.createdAt).toLocaleDateString('id-ID'),
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pesanan-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminPesananPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  async function loadOrders(status: OrderStatus | 'ALL') {
    setLoading(true)
    const url = status === 'ALL' ? '/api/admin/orders' : `/api/admin/orders?status=${status}`
    const res = await fetch(url)
    if (res.ok) setOrders(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadOrders(activeTab) }, [activeTab])

  function handleStatusUpdate(orderId: string, newStatus: OrderStatus) {
    if (!confirm(`Ubah status ke "${newStatus}"?`)) return
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus)
      loadOrders(activeTab)
    })
  }

  function handleWAManual(order: OrderRow) {
    const phone = order.whatsapp.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Halo ${order.customerName}, update pesanan *${order.orderNumber}*:\nProduk: ${order.product.name}\nStatus: ${order.status}\n\nTerima kasih sudah memesan di Beyond Qurban 🐑`
    )
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0D1F17]">Pesanan</h1>
          <p className="text-sm text-[#6B7280] mt-1">{orders.length} pesanan</p>
        </div>
        <button
          onClick={() => exportCSV(orders)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-[#1B5E3B] text-white'
                : 'bg-white border border-gray-200 text-[#6B7280] hover:border-[#1B5E3B] hover:text-[#1B5E3B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6B7280]">Memuat...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[#6B7280] text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-medium">No. Order</th>
                  <th className="text-left px-6 py-3 font-medium">Nama</th>
                  <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Produk</th>
                  <th className="text-left px-6 py-3 font-medium hidden lg:table-cell">Metode</th>
                  <th className="text-right px-6 py-3 font-medium">Total</th>
                  <th className="text-center px-6 py-3 font-medium">Bayar</th>
                  <th className="text-center px-6 py-3 font-medium">Status</th>
                  <th className="text-center px-6 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const nextStatuses = STATUS_NEXT[order.status] ?? []
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-[#1B5E3B] font-semibold">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#0D1F17]">{order.customerName}</p>
                        <p className="text-xs text-[#6B7280]">{order.whatsapp}</p>
                      </td>
                      <td className="px-6 py-4 text-[#6B7280] hidden md:table-cell">
                        {order.product.name}
                      </td>
                      <td className="px-6 py-4 text-[#6B7280] hidden lg:table-cell">
                        {DELIVERY_LABEL[order.deliveryMethod] ?? order.deliveryMethod}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-[#0D1F17]">
                        Rp {order.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {nextStatuses.length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleStatusUpdate(order.id, e.target.value as OrderStatus)
                                  e.target.value = ''
                                }
                              }}
                              defaultValue=""
                              disabled={isPending}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B5E3B]"
                            >
                              <option value="" disabled>Update</option>
                              {nextStatuses.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          )}
                          <button
                            onClick={() => handleWAManual(order)}
                            className="p-1.5 hover:bg-green-50 rounded-lg text-[#6B7280] hover:text-green-600 transition-colors"
                            title="Kirim WA manual"
                          >
                            <MessageCircle size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="text-center py-12 text-[#6B7280] text-sm">Tidak ada pesanan</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
