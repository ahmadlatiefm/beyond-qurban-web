import { prisma } from '@/lib/prisma'

async function getCustomersWithStats() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const stats = await Promise.all(
    customers.map(async (c) => {
      const orders = await prisma.order.findMany({
        where: { phone: c.phone },
        select: { totalAmount: true },
      })
      return {
        ...c,
        jumlahPesanan: orders.length,
        totalBelanja: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      }
    })
  )

  return stats
}

export default async function AdminPembeliPage() {
  const customers = await getCustomersWithStats()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-[#0D1F17]">Pembeli</h1>
        <p className="text-sm text-[#6B7280] mt-1">{customers.length} pembeli terdaftar</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-[#6B7280] text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-3 font-medium">Nama</th>
                <th className="text-left px-6 py-3 font-medium hidden md:table-cell">WhatsApp</th>
                <th className="text-left px-6 py-3 font-medium hidden lg:table-cell">Kota</th>
                <th className="text-center px-6 py-3 font-medium">Pesanan</th>
                <th className="text-right px-6 py-3 font-medium">Total Belanja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-[#0D1F17]">{c.name}</td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <a
                      href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1B5E3B] hover:underline"
                    >
                      {c.whatsapp}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-[#6B7280] hidden lg:table-cell">
                    {c.city || '-'}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-[#0D1F17]">
                    {c.jumlahPesanan}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-[#1B5E3B]">
                    Rp {c.totalBelanja.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && (
            <div className="text-center py-12 text-[#6B7280] text-sm">Belum ada pembeli</div>
          )}
        </div>
      </div>
    </div>
  )
}
