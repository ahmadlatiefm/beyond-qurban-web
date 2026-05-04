import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Admin user
  await prisma.adminUser.upsert({
    where: { email: 'admin@beyondqurban.com' },
    update: {},
    create: {
      email: 'admin@beyondqurban.com',
      name: 'Admin',
      password: await bcrypt.hash('admin123', 10),
    },
  })

  // Products
  const products = [
    {
      slug: 'domba-garut-super',
      name: 'Domba Garut Super',
      weight: 37.5,
      price: 3500000,
      badge: 'Premium',
      qurbanLocation: 'INDONESIA' as const,
      allowHomeDelivery: true,
      imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-633c0c42c771a49f61b6.png',
      description: 'Domba Garut berkualitas super, terseleksi ketat dan memenuhi syarat syariat Islam.',
    },
    {
      slug: 'domba-priangan-a',
      name: 'Domba Priangan A',
      weight: 32.5,
      price: 2800000,
      badge: null,
      qurbanLocation: 'INDONESIA' as const,
      allowHomeDelivery: true,
      imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-c4fe96d3e4365e7ee53c.png',
      description: 'Domba Priangan pilihan, sehat dan siap kurban dengan berat ideal.',
    },
    {
      slug: 'domba-merino-cross',
      name: 'Domba Merino Cross',
      weight: 42.5,
      price: 4200000,
      badge: 'Best Seller',
      qurbanLocation: 'INDONESIA' as const,
      allowHomeDelivery: true,
      imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/b1788dd218-c7de4a2e4e38fbf7061a.png',
      description: 'Merino Cross premium dengan berat di atas rata-rata, pilihan terbaik untuk kurban.',
    },
    {
      slug: 'domba-penyaluran-indonesia',
      name: 'Domba Penyaluran Indonesia',
      weight: 30.0,
      price: 2500000,
      badge: null,
      qurbanLocation: 'INDONESIA' as const,
      allowHomeDelivery: false,
      imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-633c0c42c771a49f61b6.png',
      description: 'Program penyaluran kurban ke pedalaman Indonesia yang membutuhkan.',
    },
    {
      slug: 'domba-ekor-gemuk',
      name: 'Domba Ekor Gemuk',
      weight: 40.0,
      price: 3800000,
      badge: null,
      qurbanLocation: 'INDONESIA' as const,
      allowHomeDelivery: true,
      imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/f43ecc8b00-1e2c261de24584ca2dce.png',
      description: 'Domba ekor gemuk, padat dan berkualitas tinggi untuk ibadah kurban.',
    },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        stock: 10,
        images: [p.imageUrl],
        status: 'ACTIVE',
      },
    })
  }

  // Campaigns
  await prisma.campaign.upsert({
    where: { slug: 'qurban-indonesia-2025' },
    update: {},
    create: {
      slug: 'qurban-indonesia-2025',
      title: 'Qurban Pedalaman Indonesia 2025',
      location: 'INDONESIA',
      targetCount: 200,
      price: 1900000,
      imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-633c0c42c771a49f61b6.png',
      description: 'Hewan akan disembelih dan didistribusikan langsung ke komunitas adat terpencil di Papua, NTT, dan Kalimantan. Anda akan menerima foto dan laporan via WhatsApp.',
    },
  })

  await prisma.campaign.upsert({
    where: { slug: 'qurban-afrika-2025' },
    update: {},
    create: {
      slug: 'qurban-afrika-2025',
      title: 'Qurban Afrika 2025',
      location: 'AFRICA',
      targetCount: 100,
      price: 2000000,
      imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-633c0c42c771a49f61b6.png',
      description: 'Salurkan qurban ke saudara Muslim di Afrika sub-Sahara yang membutuhkan.',
    },
  })

  await prisma.campaign.upsert({
    where: { slug: 'qurban-palestina-2025' },
    update: {},
    create: {
      slug: 'qurban-palestina-2025',
      title: 'Qurban Palestina 2025',
      location: 'PALESTINE',
      targetCount: 50,
      price: 2500000,
      imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/b1788dd218-c7de4a2e4e38fbf7061a.png',
      description: 'Salurkan qurban untuk saudara Muslim di Palestina yang membutuhkan bantuan.',
    },
  })

  // Settings defaults
  const settings = [
    { key: 'store_name', value: 'Beyond Qurban' },
    { key: 'store_whatsapp', value: '6281234567890' },
    { key: 'store_email', value: 'info@beyondqurban.com' },
    { key: 'store_address', value: 'Bandung, Jawa Barat' },
    { key: 'tripay_mode', value: 'sandbox' },
    { key: 'onesender_enabled', value: 'true' },
  ]

  for (const s of settings) {
    await prisma.settings.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    })
  }

  console.log('✅ Seed selesai:')
  console.log('   - 1 admin user')
  console.log('   - 5 produk')
  console.log('   - 2 campaign')
  console.log('   - 6 settings')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
