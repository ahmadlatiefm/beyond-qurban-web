import { getSettings } from '@/lib/actions/settings'

export default async function TentangPage() {
  const settings = await getSettings()

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1B5E3B] to-[#0D3320] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-serif text-4xl font-bold mb-4">
            Tentang {settings.store_name || 'Beyond Qurban'}
          </h1>
          <p className="text-white/70 text-lg">
            Platform kurban online yang menghadirkan kemudahan, keamanan, dan kepercayaan
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-16">
        {/* Profil */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <h2 className="font-serif text-2xl font-bold text-[#0D1F17] mb-4">Profil Kami</h2>
          <p className="text-[#6B7280] leading-relaxed">
            {settings.store_name || 'Beyond Qurban'} adalah platform penjualan domba kurban online yang
            berdedikasi menyediakan hewan kurban berkualitas. Kami bekerja sama dengan peternak terpercaya
            di Jawa Barat untuk menghadirkan domba yang sehat, tidak cacat, dan memenuhi syarat kurban sesuai
            syariat Islam.
          </p>
        </section>

        {/* Visi & Misi */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-[#0D1F17] mb-8 text-center">Visi & Misi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1B5E3B] text-white rounded-2xl p-8">
              <h3 className="font-serif font-bold text-xl mb-4 text-[#C8962A]">Visi</h3>
              <p className="text-white/80 leading-relaxed">
                Menjadi platform kurban online terpercaya yang menghubungkan shohibul qurban dengan
                penerima manfaat di seluruh dunia dengan cara yang amanah dan transparan.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <h3 className="font-serif font-bold text-xl mb-4 text-[#1B5E3B]">Misi</h3>
              <ul className="text-[#6B7280] space-y-2 text-sm leading-relaxed">
                <li>• Menyediakan hewan kurban berkualitas dan sesuai syariat</li>
                <li>• Memudahkan proses pemesanan dan pembayaran kurban</li>
                <li>• Menjangkau penerima manfaat hingga pelosok dunia</li>
                <li>• Memberikan transparansi penuh kepada shohibul qurban</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Keunggulan */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-[#0D1F17] mb-8 text-center">Keunggulan Kami</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '✅', title: 'Terverifikasi Syariat', desc: 'Setiap hewan kurban dipastikan memenuhi syarat sesuai fiqih Islam' },
              { icon: '🔒', title: 'Pembayaran Aman', desc: 'Terintegrasi Tripay dengan berbagai pilihan metode pembayaran' },
              { icon: '📲', title: 'Notifikasi Real-time', desc: 'Update status pesanan otomatis via WhatsApp' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-serif font-bold text-[#0D1F17] mb-2">{item.title}</h3>
                <p className="text-sm text-[#6B7280]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Kontak */}
        <section className="bg-[#F5E6C3] rounded-2xl p-8">
          <h2 className="font-serif text-2xl font-bold text-[#0D1F17] mb-6 text-center">Hubungi Kami</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm max-w-lg mx-auto">
            {[
              { label: 'WhatsApp CS', value: settings.store_whatsapp || '-', href: settings.store_whatsapp ? `https://wa.me/${settings.store_whatsapp}` : null },
              { label: 'Email', value: settings.store_email || '-', href: settings.store_email ? `mailto:${settings.store_email}` : null },
              { label: 'Alamat', value: settings.store_address || '-', href: null },
              { label: 'Jam Operasional', value: settings.store_hours || '-', href: null },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[#6B7280] mb-0.5">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="font-semibold text-[#1B5E3B] hover:underline">{item.value}</a>
                ) : (
                  <p className="font-semibold text-[#0D1F17]">{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
