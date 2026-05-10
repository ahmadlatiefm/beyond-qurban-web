import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkLapanganCode } from '@/lib/lapangan-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!(await checkLapanganCode(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const dateStr = url.searchParams.get('date')
  const includeTerkirim = url.searchParams.get('includeTerkirim') === 'true'

  // Build where clause: optional date filter (single day), exclude terkirim
  // unless explicitly requested. We return ALL non-terkirim records by default
  // so the lapangan team can see upcoming work; client filters by date.
  const where: Record<string, unknown> = {}
  if (dateStr) {
    const start = new Date(dateStr)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setHours(23, 59, 59, 999)
    where.tanggalKirim = { gte: start, lte: end }
  }
  if (!includeTerkirim) {
    where.statusKirim = { not: 'terkirim' }
  }

  const items = await prisma.pengiriman.findMany({
    where,
    // Closest delivery first; null tanggalKirim sorted last by Postgres default.
    orderBy: [{ tanggalKirim: 'asc' }, { jamKirim: 'asc' }, { createdAt: 'asc' }],
    include: { pic: true },
  })

  return NextResponse.json(items)
}
