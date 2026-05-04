'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import slugify from 'slugify'

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string
  const weight = parseFloat(formData.get('weight') as string)
  const price = parseInt(formData.get('price') as string)
  const stock = parseInt(formData.get('stock') as string)
  const description = formData.get('description') as string
  const imageUrl = formData.get('imageUrl') as string
  const status = formData.get('status') === 'true' ? 'ACTIVE' : 'INACTIVE'

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
      images: [imageUrl || 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-633c0c42c771a49f61b6.png'],
      status: status as 'ACTIVE' | 'INACTIVE',
    },
  })

  revalidatePath('/admin/produk')
}

export async function updateProduct(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const weight = parseFloat(formData.get('weight') as string)
  const price = parseInt(formData.get('price') as string)
  const stock = parseInt(formData.get('stock') as string)
  const description = formData.get('description') as string
  const imageUrl = formData.get('imageUrl') as string
  const status = formData.get('status') === 'true' ? 'ACTIVE' : 'INACTIVE'

  await prisma.product.update({
    where: { id },
    data: {
      name,
      weight,
      price,
      stock: isNaN(stock) ? 0 : stock,
      description,
      ...(imageUrl && { imageUrl, images: [imageUrl] }),
      status: status as 'ACTIVE' | 'INACTIVE',
    },
  })

  revalidatePath('/admin/produk')
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } })
  revalidatePath('/admin/produk')
}
