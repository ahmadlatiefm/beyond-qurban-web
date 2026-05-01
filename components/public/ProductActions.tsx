'use client'

import { Share2, MessageCircle } from 'lucide-react'

type Props = {
  productName: string
  productPrice: number
  adminWhatsapp: string
  slug: string
}

export default function ProductActions({ productName, productPrice, adminWhatsapp, slug }: Props) {
  function handleWA() {
    const phone = adminWhatsapp.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Assalamualaikum, saya tertarik dengan *${productName}* (Rp ${productPrice.toLocaleString('id-ID')}).\n\nBoleh minta info lebih lanjut? Terima kasih 🐑`
    )
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  async function handleShare() {
    const url = `${window.location.origin}/katalog/${slug}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Kurban berkah dengan ${productName} — Beyond Qurban`,
          url,
        })
      } catch {
        // user cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link produk berhasil disalin!')
    }
  }

  return (
    <div className="flex gap-3 mt-4">
      <button
        onClick={handleWA}
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1ebe5d] transition-colors"
      >
        <MessageCircle size={18} />
        Tanya via WhatsApp
      </button>
      <button
        onClick={handleShare}
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-[#1B5E3B] text-[#1B5E3B] font-semibold text-sm hover:bg-[#1B5E3B]/5 transition-colors"
        aria-label="Bagikan produk"
      >
        <Share2 size={18} />
        <span className="hidden sm:inline">Bagikan</span>
      </button>
    </div>
  )
}
