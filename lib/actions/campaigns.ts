'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import slugify from 'slugify'

export async function createCampaign(formData: FormData) {
  const title = formData.get('title') as string
  const location = formData.get('location') as string
  const targetCount = parseInt(formData.get('targetCount') as string)
  const description = formData.get('description') as string
  const imageUrl = formData.get('imageUrl') as string
  const animalType = formData.get('animalType') as string
  const programType = formData.get('programType') as string
  const ctaButtonText = (formData.get('ctaButtonText') as string) || null
  const allowShare = formData.get('allowShare') === 'true'
  const richContent = (formData.get('richContent') as string) || null
  const animals = (formData.get('animals') as string) || null
  const gallery = (formData.get('gallery') as string) || null
  const videoUrlsRaw = formData.get('videoUrls') as string | null
  let videoUrls: string[] = []
  try { if (videoUrlsRaw) videoUrls = JSON.parse(videoUrlsRaw) } catch {}

  if (!title || !location) throw new Error('Data tidak lengkap')

  // Animal cards are mandatory: at least 1 with a valid price.
  let parsedAnimals: { price?: number; name?: string }[] = []
  try { parsedAnimals = JSON.parse(animals || '[]') } catch {}
  if (!Array.isArray(parsedAnimals) || parsedAnimals.length === 0) {
    throw new Error('Minimal 1 pilihan hewan wajib ditambahkan')
  }
  if (parsedAnimals.some(a => !a.name || !a.price || a.price <= 0)) {
    throw new Error('Setiap pilihan hewan wajib memiliki nama dan harga yang valid')
  }

  const baseSlug = slugify(title, { lower: true, strict: true })
  const existing = await prisma.campaign.findUnique({ where: { slug: baseSlug } })
  const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug

  await prisma.campaign.create({
    data: {
      slug,
      title,
      location: location as any,
      targetCount: isNaN(targetCount) ? 0 : targetCount,
      description: description || '',
      imageUrl: imageUrl || 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-633c0c42c771a49f61b6.png',
      animalType: animalType || 'domba',
      programType: programType || 'qurban',
      ctaButtonText,
      allowShare,
      richContent,
      animals: animals || null,
      gallery: gallery || null,
      videoUrls,
      isActive: true,
    },
  })
  revalidatePath('/admin/campaign')
  revalidatePath('/penyaluran')
  revalidatePath('/penyaluran', 'layout')
  revalidatePath('/penyaluran/[slug]', 'page')
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

  const ctaButtonText = formData.get('ctaButtonText') as string | null
  if (ctaButtonText !== null) data.ctaButtonText = ctaButtonText || null
  const allowShareRaw = formData.get('allowShare') as string | null
  if (allowShareRaw !== null) data.allowShare = allowShareRaw === 'true'
  const richContent = formData.get('richContent') as string | null
  if (richContent !== null) data.richContent = richContent || null
  const animals = formData.get('animals') as string | null
  if (animals !== null) {
    let parsed: { price?: number; name?: string }[] = []
    try { parsed = JSON.parse(animals || '[]') } catch {}
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Minimal 1 pilihan hewan wajib ditambahkan')
    }
    if (parsed.some(a => !a.name || !a.price || a.price <= 0)) {
      throw new Error('Setiap pilihan hewan wajib memiliki nama dan harga yang valid')
    }
    data.animals = animals
  }
  const gallery = formData.get('gallery') as string | null
  if (gallery !== null) data.gallery = gallery || null
  const videoUrlsRaw = formData.get('videoUrls') as string | null
  if (videoUrlsRaw !== null) {
    try { data.videoUrls = JSON.parse(videoUrlsRaw) } catch { data.videoUrls = [] }
  }

  if (Object.keys(data).length === 0) return

  await prisma.campaign.update({ where: { id }, data })
  revalidatePath('/admin/campaign')
  revalidatePath('/penyaluran')
  revalidatePath('/penyaluran', 'layout')
  revalidatePath('/penyaluran/[slug]', 'page')
}

export async function deleteCampaign(id: string): Promise<{ success: boolean; error?: string; deletedDonations?: number }> {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id }, select: { id: true } })
    if (!campaign) {
      return { success: false, error: 'Campaign tidak ditemukan.' }
    }
    const [deletedDonations] = await prisma.$transaction([
      prisma.donation.deleteMany({ where: { campaignId: id } }),
      prisma.campaign.delete({ where: { id } }),
    ])
    revalidatePath('/admin/campaign')
    revalidatePath('/admin/penyaluran')
    revalidatePath('/penyaluran')
    revalidatePath('/penyaluran', 'layout')
    return { success: true, deletedDonations: deletedDonations.count }
  } catch (err) {
    console.error('[deleteCampaign] error:', err)
    return { success: false, error: 'Terjadi kesalahan saat menghapus campaign. Silakan coba lagi.' }
  }
}
