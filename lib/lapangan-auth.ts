import { prisma } from '@/lib/prisma'

export const LAPANGAN_CODE_KEY = 'lapangan_access_code'
export const DEFAULT_LAPANGAN_CODE = 'QURBAN2026'

export async function getLapanganCode(): Promise<string> {
  const row = await prisma.settings.findUnique({ where: { key: LAPANGAN_CODE_KEY } })
  return (row?.value || DEFAULT_LAPANGAN_CODE).trim()
}

export async function checkLapanganCode(req: Request): Promise<boolean> {
  const provided = (req.headers.get('x-lapangan-code') || '').trim()
  if (!provided) return false
  const stored = await getLapanganCode()
  return provided === stored
}
