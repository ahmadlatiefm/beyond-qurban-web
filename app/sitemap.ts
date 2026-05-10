import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://beyondqurban.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, campaigns] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.campaign.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ])

  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,             lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/katalog`,      lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/penyaluran`,   lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/tentang-kami`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const productRoutes: MetadataRoute.Sitemap = products.map(p => ({
    url: `${BASE_URL}/produk/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const campaignRoutes: MetadataRoute.Sitemap = campaigns.map(c => ({
    url: `${BASE_URL}/penyaluran/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...productRoutes, ...campaignRoutes]
}
