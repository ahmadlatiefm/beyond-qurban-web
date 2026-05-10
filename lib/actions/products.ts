'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import slugify from 'slugify'

const VALID_CATEGORIES = ['SAPI', 'KAMBING', 'DOMBA', 'UNTA'] as const
type ValidCategory = typeof VALID_CATEGORIES[number]
function normalizeCategory(raw: string | null): ValidCategory | null {
  if (!raw) return null
  const up = raw.toUpperCase()
  return (VALID_CATEGORIES as readonly string[]).includes(up) ? (up as ValidCategory) : null
}

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string
  const weight = parseFloat(formData.get('weight') as string)
  const price = parseInt(formData.get('price') as string)
  const stock = parseInt(formData.get('stock') as string)
  const description = formData.get('description') as string
  const imageUrl = formData.get('imageUrl') as string
  const category = normalizeCategory(formData.get('category') as string | null)
  const status = formData.get('status') === 'true' ? 'ACTIVE' : 'INACTIVE'
  const imagesRaw = formData.get('images') as string | null
  let extraImages: string[] = []
  try { if (imagesRaw) extraImages = JSON.parse(imagesRaw) } catch {}
  const videoUrlsRaw = formData.get('videoUrls') as string | null
  let videoUrls: string[] = []
  try { if (videoUrlsRaw) videoUrls = JSON.parse(videoUrlsRaw) } catch {}

  if (!name || !weight || !price) throw new Error('Data tidak lengkap')

  const baseSlug = slugify(name, { lower: true, strict: true })
  const existing = await prisma.product.findUnique({ where: { slug: baseSlug } })
  const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug

  await prisma.product.create({
    data: {
      slug,
      name,
      weight,
      price,
      stock: isNaN(stock) ? 0 : stock,
      description: description || '',
      imageUrl: imageUrl || 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-633c0c42c771a49f61b6.png',
      images: extraImages,
      category,
      status: status as 'ACTIVE' | 'INACTIVE',
      videoUrls,
    },
  })

  revalidatePath('/admin/produk')
  revalidatePath('/katalog')
}

export async function updateProduct(id: string, formData: FormData) {
  // Partial update — hanya update field yang ada di formData
  const data: Record<string, any> = {}

  const name = formData.get('name') as string | null
  const weightRaw = formData.get('weight') as string | null
  const priceRaw = formData.get('price') as string | null
  const stockRaw = formData.get('stock') as string | null
  const description = formData.get('description') as string | null
  const imageUrl = formData.get('imageUrl') as string | null
  const statusRaw = formData.get('status') as string | null

  const imagesRaw = formData.get('images') as string | null

  if (name !== null && name !== '') data.name = name
  if (weightRaw !== null) { const v = parseFloat(weightRaw); if (!isNaN(v)) data.weight = v }
  if (priceRaw !== null) { const v = parseInt(priceRaw); if (!isNaN(v)) data.price = v }
  if (stockRaw !== null) { const v = parseInt(stockRaw); data.stock = isNaN(v) ? 0 : v }
  if (description !== null) data.description = description
  if (imageUrl) data.imageUrl = imageUrl
  if (imagesRaw !== null) { try { data.images = JSON.parse(imagesRaw) } catch {} }
  if (statusRaw !== null) data.status = statusRaw === 'true' ? 'ACTIVE' : 'INACTIVE'
  const categoryRaw = formData.get('category') as string | null
  if (categoryRaw !== null) data.category = normalizeCategory(categoryRaw)
  const videoUrlsRaw = formData.get('videoUrls') as string | null
  if (videoUrlsRaw !== null) {
    try { data.videoUrls = JSON.parse(videoUrlsRaw) } catch { data.videoUrls = [] }
  }

  if (Object.keys(data).length === 0) return

  await prisma.product.update({ where: { id }, data })
  revalidatePath('/admin/produk')
  revalidatePath('/katalog')
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string; deletedOrders?: number }> {
  try {
    const product = await prisma.product.findUnique({ where: { id }, select: { id: true } })
    if (!product) {
      return { success: false, error: 'Produk tidak ditemukan.' }
    }
    const [deletedOrders] = await prisma.$transaction([
      prisma.order.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ])
    revalidatePath('/admin/produk')
    revalidatePath('/admin/pesanan')
    revalidatePath('/admin/dashboard')
    revalidatePath('/katalog')
    return { success: true, deletedOrders: deletedOrders.count }
  } catch (err) {
    console.error('[deleteProduct] error:', err)
    return { success: false, error: 'Terjadi kesalahan saat menghapus produk. Silakan coba lagi.' }
  }
}

export async function deleteProducts(ids: string[]): Promise<{ success: boolean; error?: string; count?: number; deletedOrders?: number }> {
  if (!Array.isArray(ids) || ids.length === 0) return { success: true, count: 0, deletedOrders: 0 }
  try {
    const [deletedOrders, deletedProducts] = await prisma.$transaction([
      prisma.order.deleteMany({ where: { productId: { in: ids } } }),
      prisma.product.deleteMany({ where: { id: { in: ids } } }),
    ])
    revalidatePath('/admin/produk')
    revalidatePath('/admin/pesanan')
    revalidatePath('/admin/dashboard')
    revalidatePath('/katalog')
    return { success: true, count: deletedProducts.count, deletedOrders: deletedOrders.count }
  } catch (err) {
    console.error('[deleteProducts] error:', err)
    return { success: false, error: 'Terjadi kesalahan saat menghapus produk. Silakan coba lagi.' }
  }
}
