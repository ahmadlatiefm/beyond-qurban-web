type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
type PaymentStatus = 'UNPAID' | 'PAID' | 'EXPIRED' | 'REFUNDED'

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  PENDING:   { label: 'Pending',      className: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Dikonfirmasi', className: 'bg-blue-100 text-blue-800' },
  PREPARING: { label: 'Disiapkan',    className: 'bg-purple-100 text-purple-800' },
  SHIPPED:   { label: 'Dikirim',      className: 'bg-orange-100 text-orange-800' },
  DELIVERED: { label: 'Terkirim',     className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Dibatalkan',   className: 'bg-red-100 text-red-800' },
}

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  UNPAID:   { label: 'Belum Bayar',  className: 'bg-red-100 text-red-700' },
  PAID:     { label: 'Lunas',        className: 'bg-green-100 text-green-700' },
  EXPIRED:  { label: 'Kadaluarsa',   className: 'bg-gray-100 text-gray-600' },
  REFUNDED: { label: 'Dikembalikan', className: 'bg-blue-100 text-blue-700' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = ORDER_STATUS_CONFIG[status]
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = PAYMENT_STATUS_CONFIG[status]
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}
