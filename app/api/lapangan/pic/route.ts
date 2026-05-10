import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkLapanganCode } from '@/lib/lapangan-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!(await checkLapanganCode(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.pICPengiriman.findMany({
    where: { aktif: true },
    orderBy: { nama: 'asc' },
    select: { id: true, nama: true, noTelepon: true, keterangan: true, aktif: true },
  })
  return NextResponse.json(items)
}
