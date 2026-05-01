'use client'

type Props = {
  productName: string
  price: number
  stock: number
  formId?: string
}

export default function StickyBar({ productName, price, stock, formId = 'order-form' }: Props) {
  function scrollToForm() {
    const el = document.getElementById(formId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Focus first input inside form
      const firstInput = el.querySelector<HTMLInputElement>('input')
      setTimeout(() => firstInput?.focus(), 600)
    }
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-3">
      <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
        <div className="min-w-0">
          <p className="text-xs text-[#6B7280] truncate">{productName}</p>
          <p className="font-bold text-[#1B5E3B] text-lg leading-tight">
            Rp {price.toLocaleString('id-ID')}
          </p>
        </div>
        <button
          onClick={scrollToForm}
          disabled={stock === 0}
          className="flex-shrink-0 px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{
            background: stock === 0 ? '#d1d5db' : 'linear-gradient(135deg, #F5E6C3, #C8962A)',
            color: stock === 0 ? '#9ca3af' : '#0D3320',
          }}
        >
          {stock === 0 ? 'Habis' : 'Pesan Sekarang'}
        </button>
      </div>
    </div>
  )
}
