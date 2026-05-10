export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import PengirimanFormClient from './PengirimanFormClient'

export default async function PublicPengirimanPage({ params }: { params: { token: string } }) {
  const item = await prisma.pengiriman.findUnique({
    where: { token: params.token },
    select: {
      id: true,
      token: true,
      namaPemesan: true,
      noWhatsapp: true,
      alamatLengkap: true,
      kecamatan: true,
      kota: true,
      gmapsPin: true,
      atasNama: true,
      catatan: true,
      jenisHewan: true,
      jumlahHewan: true,
      tanggalKirim: true,
      jamKirim: true,
      requestTanggalKirim: true,
      requestJamKirim: true,
      formDiisi: true,
      formDiisiAt: true,
    },
  })

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="bg-white border border-brand-muted/10 rounded-[14px] shadow-premium max-w-md w-full text-center p-8">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="font-serif text-xl font-bold text-brand-dark mb-2">Link tidak valid</h1>
          <p className="text-sm text-brand-muted mb-5">Silakan hubungi CS kami melalui WhatsApp untuk mendapatkan link yang benar.</p>
          <Link href="/" className="inline-block px-4 py-2 bg-brand-dark text-brand-accent-light rounded-[8px] text-sm font-medium">Kembali ke Beranda</Link>
        </div>
      </div>
    )
  }

  // Form is locked within H-3 of scheduled delivery (only after first fill)
  let locked = false
  if (item.tanggalKirim && item.formDiisi) {
    const threshold = new Date(item.tanggalKirim)
    threshold.setDate(threshold.getDate() - 3)
    locked = Date.now() > threshold.getTime()
  }

  return (
    <PengirimanFormClient
      item={JSON.parse(JSON.stringify(item))}
      locked={locked}
    />
  )
}
