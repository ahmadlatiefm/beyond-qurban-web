import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import AnalyticsScripts from '@/components/public/AnalyticsScripts'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Beyond Qurban — Kurban Online Terpercaya',
  description: 'Platform kurban online dengan domba lokal dan penyaluran ke mancanegara',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <AnalyticsScripts />
      </body>
    </html>
  )
}
