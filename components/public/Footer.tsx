import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#0D3320] text-white/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <p className="font-serif text-xl font-bold text-white mb-3">
              Beyond<span className="text-[#C8962A]">Qurban</span>
            </p>
            <p className="text-sm leading-relaxed">
              Platform kurban online terpercaya. Domba lokal berkualitas, penyaluran amanah ke seluruh dunia.
            </p>
          </div>

          <div>
            <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Menu</p>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/', label: 'Beranda' },
                { href: '/katalog', label: 'Katalog Domba' },
                { href: '/lacak', label: 'Lacak Pesanan' },
                { href: '/tentang', label: 'Tentang Kami' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-[#C8962A] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Kontak</p>
            <ul className="space-y-2 text-sm">
              <li>WhatsApp: <a href="https://wa.me/6281234567890" className="hover:text-[#C8962A]">0812-3456-7890</a></li>
              <li>Email: info@beyondqurban.com</li>
              <li>Bandung, Jawa Barat</li>
              <li>Senin–Sabtu, 08.00–17.00 WIB</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Beyond Qurban. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
