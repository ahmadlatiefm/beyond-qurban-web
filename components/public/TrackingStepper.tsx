import { Check } from 'lucide-react'

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'PENDING', label: 'Menunggu Bayar' },
  { key: 'CONFIRMED', label: 'Dikonfirmasi' },
  { key: 'PREPARING', label: 'Disiapkan' },
  { key: 'SHIPPED', label: 'Dikirim' },
  { key: 'DELIVERED', label: 'Terkirim' },
]

const STATUS_INDEX: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
}

export default function TrackingStepper({ status }: { status: OrderStatus }) {
  const currentIndex = STATUS_INDEX[status]

  if (status === 'CANCELLED') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl font-semibold">
          Pesanan Dibatalkan
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between w-full gap-2">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex
        const isActive = index === currentIndex

        return (
          <div key={step.key} className="flex flex-col items-center flex-1 relative">
            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={`absolute top-4 left-1/2 w-full h-0.5 ${
                  isDone ? 'bg-[#1B5E3B]' : 'bg-gray-200'
                }`}
              />
            )}

            {/* Circle */}
            <div
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                isDone
                  ? 'bg-[#1B5E3B] border-[#1B5E3B] text-white'
                  : isActive
                  ? 'bg-white border-[#1B5E3B] text-[#1B5E3B]'
                  : 'bg-white border-gray-200 text-gray-300'
              }`}
            >
              {isDone ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>

            {/* Label */}
            <p
              className={`mt-2 text-center text-xs leading-tight ${
                isActive
                  ? 'text-[#1B5E3B] font-semibold'
                  : isDone
                  ? 'text-[#1B5E3B]'
                  : 'text-gray-400'
              }`}
            >
              {step.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
