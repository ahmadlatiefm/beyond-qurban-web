'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.settings.findMany()
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export async function updateSettings(updates: Record<string, string>) {
  const ops = Object.entries(updates).map(([key, value]) =>
    prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  )
  await prisma.$transaction(ops)
  revalidatePath('/admin/pengaturan')
  return { success: true }
}
