'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function saveSettings(settings: Record<string, string>) {
  for (const [key, value] of Object.entries(settings)) {
    await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }
  revalidatePath('/admin/pengaturan')
}
