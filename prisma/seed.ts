import { PrismaClient, ProductType, QurbanLocation, ProductStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  await prisma.adminUser.upsert({
    where: { email: 'admin@beyondqurban.com' },
    update: {},
    create: {
      email: 'admin@beyondqurban.com',
      password: hashedPassword,
      name: 'Admin Beyond Qurban',
    },
  })

  // Products
  const products = [
    {
      slug: 'domba-garut-super',
      name: 'Domba Garut Super',
      type: ProductType.GARUT,
      weight: 35,
      price: 3500000,
      stock: 10,
      description: 'Domba Garut asli dengan berat optimal untuk kurban. Dipelihara dengan standar syariat, sehat dan tidak cacat.',
      imageUrl: '/uploads/placeholder.jpg',
      images: [] as string[],
      badge: 'Best Seller',
      qurbanLocation: QurbanLocation.INDONESIA,
      allowHomeDelivery: true,
      status: ProductStatus.ACTIVE,
    },
    {
      slug: 'domba-merino-cross',
      name: 'Domba Merino Cross',
      type: ProductType.LOKAL,
      weight: 28,
      price: 2800000,
      stock: 8,
      description: 'Domba lokal persilangan Merino, dagingnya berkualitas tinggi. Cocok untuk keluarga yang ingin kurban berkah.',
      imageUrl: '/uploads/placeholder.jpg',
      images: [] as string[],
      badge: 'Premium',
      qurbanLocation: QurbanLocation.INDONESIA,
      allowHomeDelivery: true,
      status: ProductStatus.ACTIVE,
    },
    {
      slug: 'domba-penyaluran-indonesia',
      name: 'Domba Penyaluran Indonesia',
      type: ProductType.LOKAL,
      weight: 25,
      price: 2200000,
      stock: 20,
      description: 'Kurban disalurkan ke daerah pelosok Indonesia yang membutuhkan. Amanah dan terverifikasi.',
      imageUrl: '/uploads/placeholder.jpg',
      images: [] as string[],
      badge: null,
      qurbanLocation: QurbanLocation.INDONESIA,
      allowHomeDelivery: false,
      status: ProductStatus.ACTIVE,
    },
    {
      slug: 'domba-qurban-afrika',
      name: 'Domba Qurban Afrika',
      type: ProductType.LOKAL,
      weight: 30,
      price: 1800000,
      stock: 15,
      description: 'Kurban disalurkan ke saudara muslim di Afrika yang membutuhkan. Proses penyembelihan sesuai syariat.',
      imageUrl: '/uploads/placeholder.jpg',
      images: [] as string[],
      badge: null,
      qurbanLocation: QurbanLocation.AFRICA,
      allowHomeDelivery: false,
      status: ProductStatus.ACTIVE,
    },
    {
      slug: 'domba-qurban-palestina',
      name: 'Domba Qurban Palestina',
      type: ProductType.LOKAL,
      weight: 28,
      price: 2000000,
      stock: 12,
      description: 'Wujudkan kepedulian untuk saudara di Palestina. Kurban Anda disalurkan langsung ke Gaza.',
      imageUrl: '/uploads/placeholder.jpg',
      images: [] as string[],
      badge: null,
      qurbanLocation: QurbanLocation.PALESTINE,
      allowHomeDelivery: false,
      status: ProductStatus.ACTIVE,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    })
  }

  // Default Settings
  const defaultSettings = [
    { key: 'tripay_mode', value: 'sandbox' },
    { key: 'tripay_api_key', value: '' },
    { key: 'tripay_private_key', value: '' },
    { key: 'tripay_merchant_code', value: '' },
    { key: 'onesender_api_key', value: '' },
    { key: 'onesender_sender_number', value: '' },
    { key: 'notif_order_customer', value: 'true' },
    { key: 'notif_order_admin', value: 'true' },
    { key: 'notif_payment_customer', value: 'true' },
    { key: 'notif_payment_admin', value: 'true' },
    { key: 'notif_status_customer', value: 'true' },
    { key: 'notif_shipping_customer', value: 'true' },
    { key: 'fb_pixel_id', value: '' },
    { key: 'fb_pixel_enabled', value: 'false' },
    { key: 'fb_capi_token', value: '' },
    { key: 'fb_capi_enabled', value: 'false' },
    { key: 'fb_capi_test_event_code', value: '' },
    { key: 'fb_capi_purchase_trigger', value: 'tripay_callback' },
    { key: 'tiktok_pixel_id', value: '' },
    { key: 'tiktok_pixel_enabled', value: 'false' },
    { key: 'gtm_container_id', value: '' },
    { key: 'gtm_enabled', value: 'false' },
    { key: 'store_name', value: 'Beyond Qurban' },
    { key: 'store_whatsapp', value: '6281234567890' },
    { key: 'store_email', value: 'info@beyondqurban.com' },
    { key: 'store_address', value: 'Bandung, Jawa Barat' },
    { key: 'store_hours', value: 'Senin–Sabtu, 08.00–17.00 WIB' },
    { key: 'store_logo', value: '' },
    { key: 'admin_whatsapp', value: '6281234567890' },
  ]

  for (const setting of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log('✅ Seed selesai')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
