import { prisma } from '@/lib/prisma'
import StatCard from '@/components/admin/StatCard'
import OrdersChart from '@/components/admin/OrdersChart'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import Link from 'next/link'
import { ShoppingCart, Clock, Package, Truck } from 'lucide-react'

function formatDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

function subDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

async function getDashboardData() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [todayOrders, pendingPayment, activeProducts, deliveredOrders, recentOrders] =
    await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { paymentStatus: 'UNPAID', status: { not: 'CANCELLED' } } }),
      prisma.product.count({ where: { status: 'ACTIVE', stock: { gt: 0 } } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true } } },
      }),
    ])

  // 7-day chart data
  const now = new Date()
  const chartData = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i)
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      return prisma.order
        .count({ where: { createdAt: { gte: start, lte: end } } })
        .then((count) => ({ date: formatDate(date), pesanan: count }))
    })
  )

  return { todayOrders, pendingPayment, activeProducts, deliveredOrders, recentOrders, chartData }
}

export default async function AdminDashboardPage() {
  const { todayOrders, pendingPayment, activeProducts, deliveredOrders, recentOrders, chartData } =
    await getDashboardData()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-[#0D1F17]">Dashboard</h1>
        <p className="text-sm text-[#6B7280] mt-1">Selamat datang kembali</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Pesanan Hari Ini"     value={todayOrders}      icon={ShoppingCart} color="green" />
        <StatCard title="Menunggu Bayar"        value={pendingPayment}   icon={Clock}        color="red" />
        <StatCard title="Produk Tersedia"       value={activeProducts}   icon={Package}      color="gold" />
        <StatCard title="Terkirim"              value={deliveredOrders}  icon={Truck}        color="blue" />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
        <h2 className="font-serif font-bold text-[#0D1F17] text-lg mb-6">
          Pesanan 7 Hari Terakhir
        </h2>
        <OrdersChart data={chartData} />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-serif font-bold text-[#0D1F17] text-lg">Pesanan Terbaru</h2>
          <Link
            href="/admin/pesanan"
            className="text-[#1B5E3B] text-sm font-medium hover:underline"
          >
            Lihat Semua →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-[#6B7280] text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-3 font-medium">No. Order</th>
                <th className="text-left px-6 py-3 font-medium">Nama</th>
                <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Produk</th>
                <th className="text-right px-6 py-3 font-medium">Total</th>
                <th className="text-center px-6 py-3 font-medium">Bayar</th>
                <th className="text-center px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-[#1B5E3B] font-semibold">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 font-medium text-[#0D1F17]">{order.customerName}</td>
                  <td className="px-6 py-4 text-[#6B7280] hidden md:table-cell">
                    {order.product.name}
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
                </tr>
              ))}
            </tbody>
          </table>
          {recentOrders.length === 0 && (
            <div className="text-center py-12 text-[#6B7280] text-sm">Belum ada pesanan</div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex gap-3">
        <Link
          href="/admin/produk"
          className="px-5 py-2.5 rounded-xl bg-[#1B5E3B] text-white text-sm font-semibold hover:bg-[#0D3320] transition-colors"
        >
          + Tambah Produk
        </Link>
        <Link
          href="/admin/pesanan"
          className="px-5 py-2.5 rounded-xl border border-[#1B5E3B] text-[#1B5E3B] text-sm font-semibold hover:bg-[#1B5E3B]/5 transition-colors"
        >
          Lihat Pesanan
        </Link>
      </div>
    </div>
  )
}
