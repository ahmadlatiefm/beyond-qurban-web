'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import slugify from 'slugify'

export async function createCampaign(formData: FormData) {
  const title = formData.get('title') as string
  const location = formData.get('location') as string
  const price = parseInt(formData.get('price') as string)
  const targetCount = parseInt(formData.get('targetCount') as string)
  const description = formData.get('description') as string
  const imageUrl = formData.get('imageUrl') as string
  const animalType = formData.get('animalType') as string
  const programType = formData.get('programType') as string

  if (!title || !location || !price) throw new Error('Data tidak lengkap')

  const baseSlug = slugify(title, { lower: true, strict: true })
  const existing = await prisma.campaign.findUnique({ where: { slug: baseSlug } })
  const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug

  await prisma.campaign.create({
    data: {
      slug,
      title,
      location: location as any,
      price,
      targetCount: isNaN(targetCount) ? 0 : targetCount,
      description: description || '',
      imageUrl: imageUrl || 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-633c0c42c771a49f61b6.png',
      animalType: animalType || 'domba',
      programType: programType || 'qurban',
      isActive: true,
    },
  })
  revalidatePath('/admin/campaign')
  revalidatePath('/penyaluran')
}

export async function updateCampaign(id: string, formData: FormData) {
  const data: Record<string, any> = {}

  const title = formData.get('title') as string | null
  const priceRaw = formData.get('price') as string | null
  const targetRaw = formData.get('targetCount') as string | null
  const description = formData.get('description') as string | null
  const imageUrl = formData.get('imageUrl') as string | null
  const isActiveRaw = formData.get('isActive') as string | null
  const location = formData.get('location') as string | null

  if (title) data.title = title
  if (priceRaw) { const v = parseInt(priceRaw); if (!isNaN(v)) data.price = v }
  if (targetRaw) { const v = parseInt(targetRaw); if (!isNaN(v)) data.targetCount = v }
  if (description !== null) data.description = description
  if (imageUrl) data.imageUrl = imageUrl
  if (isActiveRaw !== null) data.isActive = isActiveRaw === 'true'
  if (location) data.location = location as any
  const animalType = formData.get('animalType') as string | null
  const programType = formData.get('programType') as string | null
  if (animalType) data.animalType = animalType
  if (programType) data.programType = programType

  if (Object.keys(data).length === 0) return

  await prisma.campaign.update({ where: { id }, data })
  revalidatePath('/admin/campaign')
  revalidatePath('/penyaluran')
}

export async function deleteCampaign(id: string) {
  await prisma.campaign.delete({ where: { id } })
  revalidatePath('/admin/campaign')
  revalidatePath('/penyaluran')
}
