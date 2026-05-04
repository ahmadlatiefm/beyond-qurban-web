'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartData { label: string; orders: number; paid: number }

export default function DashboardChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barSize={16} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107,114,128,0.1)" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#6B7280' }}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(107,114,128,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          labelStyle={{ color: '#0D1F17', fontWeight: 700 }}
        />
        <Bar dataKey="orders" name="Pesanan" fill="#1B5E3B" radius={[4, 4, 0, 0]} />
        <Bar dataKey="paid" name="Lunas" fill="#C8962A" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
