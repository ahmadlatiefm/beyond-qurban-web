'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ProductType, QurbanLocation, ProductStatus } from '@prisma/client'

const ProductSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.nativeEnum(ProductType),
  weight: z.number().positive(),
  price: z.number().int().positive(),
  stock: z.number().int().min(0),
  description: z.string().min(10),
  imageUrl: z.string().min(1),
  images: z.array(z.string()).max(5),
  badge: z.string().nullable(),
  qurbanLocation: z.nativeEnum(QurbanLocation),
  allowHomeDelivery: z.boolean(),
  status: z.nativeEnum(ProductStatus),
})

function enforceDeliveryRule(data: z.infer<typeof ProductSchema>) {
  if (data.qurbanLocation !== 'INDONESIA') {
    return { ...data, allowHomeDelivery: false }
  }
  return data
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function createProduct(formData: unknown) {
  const parsed = ProductSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const data = enforceDeliveryRule(parsed.data)
  const baseSlug = generateSlug(data.name)

  // Ensure slug uniqueness
  let slug = baseSlug
  let counter = 1
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`
  }

  try {
    const product = await prisma.product.create({
      data: { ...data, slug },
    })
    revalidatePath('/katalog')
    revalidatePath('/admin/produk')
    return { success: true, product }
  } catch {
    return { error: 'Gagal membuat produk. Coba lagi.' }
  }
}

export async function updateProduct(id: string, formData: unknown) {
  const parsed = ProductSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const data = enforceDeliveryRule(parsed.data)

  try {
    const product = await prisma.product.update({
      where: { id },
      data,
    })
    revalidatePath('/katalog')
    revalidatePath(`/katalog/${product.slug}`)
    revalidatePath('/admin/produk')
    return { success: true, product }
  } catch {
    return { error: 'Gagal update produk.' }
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } })
    revalidatePath('/katalog')
    revalidatePath('/admin/produk')
    return { success: true }
  } catch {
    return { error: 'Gagal hapus produk.' }
  }
}
