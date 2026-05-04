'use client'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faHashtag } from '@fortawesome/free-solid-svg-icons'

export default function LacakForm({ defaultOrder }: { defaultOrder?: string }) {
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const orderNum = fd.get('orderNumber') as string
    if (orderNum.trim()) {
      router.push(`/lacak-pesanan?order=${encodeURIComponent(orderNum.trim())}`)
    }
  }

  return (
    <div className="bg-white rounded-[14px] shadow-premium border border-brand-muted/10 p-8 mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider">Nomor Pesanan <span className="text-brand-surface">*</span></label>
          <div className="relative">
            <FontAwesomeIcon icon={faHashtag} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted text-sm" />
            <input
              name="orderNumber"
              type="text"
              defaultValue={defaultOrder}
              placeholder="Contoh: BQ-20250512-1234"
              className="w-full h-12 pl-10 pr-4 border border-brand-muted/20 rounded-[8px] bg-brand-light text-brand-text-dark text-sm focus:outline-none focus:border-brand-accent focus:shadow-[0_0_0_1px_#C8962A]"
            />
          </div>
        </div>
        <button type="submit" className="w-full h-12 bg-cta-gradient text-brand-text-dark font-bold text-base rounded-[12px] shadow-premium hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
          <FontAwesomeIcon icon={faMagnifyingGlass} /> Lacak Sekarang
        </button>
      </form>
    </div>
  )
}
