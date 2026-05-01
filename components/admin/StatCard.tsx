import { LucideIcon } from 'lucide-react'

type Props = {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'green' | 'gold' | 'blue' | 'red'
}

const COLOR_MAP = {
  green: 'bg-[#1B5E3B]/10 text-[#1B5E3B]',
  gold:  'bg-[#C8962A]/10 text-[#C8962A]',
  blue:  'bg-blue-100 text-blue-700',
  red:   'bg-red-100 text-red-700',
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'green' }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-[#6B7280]">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${COLOR_MAP[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="font-serif text-3xl font-bold text-[#0D1F17]">{value}</p>
      {subtitle && <p className="text-xs text-[#6B7280] mt-1">{subtitle}</p>}
    </div>
  )
}
