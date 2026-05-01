# Beyond Qurban App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun platform penjualan domba kurban online production-ready dengan katalog, checkout Tripay, notifikasi WhatsApp OneSender, order tracking, dan admin dashboard.

**Architecture:** Next.js 14 App Router dengan Server Components untuk data fetching langsung ke Prisma/PostgreSQL. Mutasi data via Server Actions. Integrasi eksternal (Tripay webhook, upload) via Route Handlers.

**Tech Stack:** Next.js 14 · TypeScript · Prisma · PostgreSQL · Tailwind CSS · Shadcn/ui · NextAuth v4 · Recharts · Zod

---

## File Structure Overview

```
(project root = current dir D:\2. Arsip\2026 - Work\Qurban\Qurban App)
├── app/
│   ├── layout.tsx                          MODIFY — root layout, font setup
│   ├── globals.css                         MODIFY — CSS variables brand colors
│   ├── (public)/
│   │   ├── layout.tsx                      CREATE — public layout (Header + Footer)
│   │   ├── page.tsx                        CREATE — Homepage
│   │   ├── katalog/
│   │   │   ├── page.tsx                    CREATE — Katalog + filter tabs
│   │   │   └── [slug]/page.tsx             CREATE — Detail produk + form order
│   │   ├── lacak/page.tsx                  CREATE — Lacak pesanan
│   │   └── tentang/page.tsx                CREATE — Tentang Kami
│   ├── admin/
│   │   ├── login/page.tsx                  CREATE — Admin login form
│   │   ├── layout.tsx                      CREATE — Sidebar + auth guard
│   │   ├── page.tsx                        CREATE — Dashboard stats + chart
│   │   ├── produk/page.tsx                 CREATE — CRUD produk
│   │   ├── pesanan/page.tsx                CREATE — Manajemen pesanan
│   │   ├── pembeli/page.tsx                CREATE — List pembeli
│   │   └── pengaturan/page.tsx             CREATE — Settings 4 tab
│   └── api/
│       ├── auth/[...nextauth]/route.ts     CREATE — NextAuth handler
│       ├── tripay/callback/route.ts        CREATE — Tripay webhook (HMAC verified)
│       └── uploads/route.ts               CREATE — File upload handler
├── components/
│   ├── public/
│   │   ├── Header.tsx                      CREATE
│   │   ├── Footer.tsx                      CREATE
│   │   ├── ProductCard.tsx                 CREATE
│   │   ├── TrackingStepper.tsx             CREATE
│   │   └── OrderForm.tsx                  CREATE — client component, form + real-time ongkir
│   └── admin/
│       ├── Sidebar.tsx                     CREATE
│       ├── BottomNav.tsx                   CREATE
│       ├── StatCard.tsx                    CREATE
│       ├── DataTable.tsx                   CREATE
│       └── OrderStatusBadge.tsx            CREATE
├── lib/
│   ├── prisma.ts                           CREATE — singleton Prisma client
│   ├── shipping.ts                         CREATE — Bandung Raya list + calculateShipping()
│   ├── auth.ts                             CREATE — NextAuth config
│   ├── tripay.ts                           CREATE — Tripay API wrapper
│   ├── onesender.ts                        CREATE — OneSender WA wrapper
│   └── facebook-capi.ts                   CREATE — FB CAPI wrapper
├── lib/actions/
│   ├── orders.ts                           CREATE — createOrder, updateOrderStatus
│   ├── products.ts                         CREATE — createProduct, updateProduct, deleteProduct
│   └── settings.ts                         CREATE — getSettings, updateSettings
├── middleware.ts                           CREATE — proteksi /admin/* routes
├── prisma/
│   ├── schema.prisma                       CREATE — semua models + enums
│   └── seed.ts                             CREATE — admin user + 5 produk + settings default
├── .env.example                            CREATE
└── next.config.ts                          MODIFY — allowed image domains
```

---

## PART 1: FOUNDATION

---

### Task 1: Inisialisasi Project Next.js 14

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `app/globals.css`, `app/layout.tsx`

- [ ] **Step 1: Buat project Next.js baru**

Jalankan di direktori `D:\2. Arsip\2026 - Work\Qurban\Qurban App`:

```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Jawab prompt:
- `Would you like to customize the default import alias?` → No (sudah set `@/*`)

- [ ] **Step 2: Install dependencies utama**

```bash
npm install @prisma/client prisma zod next-auth@4 bcryptjs
npm install @types/bcryptjs --save-dev
```

- [ ] **Step 3: Install Shadcn/ui**

```bash
npx shadcn-ui@latest init
```

Pilihan saat init:
- Style: Default
- Base color: Slate
- CSS variables: Yes

Lalu install komponen yang dibutuhkan:

```bash
npx shadcn-ui@latest add button input label select textarea badge table tabs card dialog form toast separator
```

- [ ] **Step 4: Install library tambahan**

```bash
npm install recharts lucide-react date-fns slugify
npm install @hookform/resolvers react-hook-form
```

- [ ] **Step 5: Setup CSS variables brand color**

Edit `app/globals.css`, tambahkan di bawah `:root`:

```css
:root {
  --forest-green: #1B5E3B;
  --deep-forest: #0D3320;
  --warm-gold: #C8962A;
  --light-gold: #F5E6C3;
  --off-white: #FAFAF8;
  --mid-grey: #6B7280;
  --text-dark: #0D1F17;
}

body {
  background-color: var(--off-white);
  color: var(--text-dark);
}
```

- [ ] **Step 6: Setup root layout dengan Google Fonts**

Ganti isi `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Beyond Qurban — Kurban Online Terpercaya',
  description: 'Platform kurban online dengan domba lokal dan penyaluran ke mancanegara',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 7: Update tailwind.config.ts untuk custom fonts dan colors**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          surface: '#1B5E3B',
          dark: '#0D3320',
          accent: '#C8962A',
          'accent-light': '#F5E6C3',
          light: '#FAFAF8',
          muted: '#6B7280',
          'text-dark': '#0D1F17',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

- [ ] **Step 8: Buat .env.example**

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/beyond_qurban

# Auth
NEXTAUTH_SECRET=generate-dengan-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Tripay
TRIPAY_API_KEY=
TRIPAY_PRIVATE_KEY=
TRIPAY_MERCHANT_CODE=
TRIPAY_MODE=sandbox

# OneSender
ONESENDER_API_KEY=
ONESENDER_SENDER_NUMBER=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Salin ke `.env`:
```bash
cp .env.example .env
```

Isi `DATABASE_URL` dan `NEXTAUTH_SECRET` dengan nilai nyata.

- [ ] **Step 9: Verifikasi dev server berjalan**

```bash
npm run dev
```

Buka `http://localhost:3000` — harus tampil halaman Next.js default.

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "feat: init Next.js 14 project with Tailwind, Shadcn/ui, brand tokens"
```

---

### Task 2: Prisma Schema + Migration

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Init Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Ini membuat `prisma/schema.prisma` dan menambahkan `DATABASE_URL` ke `.env`.

- [ ] **Step 2: Tulis schema lengkap**

Ganti isi `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ProductType {
  LOKAL
  ETAWA
  GARUT
  BATUR
}

enum ProductStatus {
  ACTIVE
  INACTIVE
}

enum QurbanLocation {
  INDONESIA
  AFRICA
  PALESTINE
}

enum DeliveryMethod {
  ONE_UMMAH
  HOME_DELIVERY
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  UNPAID
  PAID
  EXPIRED
  REFUNDED
}

model Product {
  id                String         @id @default(cuid())
  slug              String         @unique
  name              String
  type              ProductType
  weight            Float
  price             Int
  stock             Int            @default(1)
  description       String         @db.Text
  imageUrl          String
  images            String[]
  badge             String?
  qurbanLocation    QurbanLocation @default(INDONESIA)
  allowHomeDelivery Boolean        @default(true)
  status            ProductStatus  @default(ACTIVE)
  orders            Order[]
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}

model Order {
  id               String         @id @default(cuid())
  orderNumber      String         @unique
  customerName     String
  phone            String
  whatsapp         String
  deliveryMethod   DeliveryMethod
  qurbanLocation   QurbanLocation
  address          String?        @db.Text
  kelurahan        String?
  kecamatan        String?
  city             String?
  province         String?
  postalCode       String?
  deliveryNotes    String?        @db.Text
  sacrificeDate    DateTime
  deliveryDate     DateTime?
  notes            String?        @db.Text
  product          Product        @relation(fields: [productId], references: [id])
  productId        String
  quantity         Int            @default(1)
  shippingCost     Int            @default(0)
  totalAmount      Int
  paymentMethod    String?
  paymentStatus    PaymentStatus  @default(UNPAID)
  tripayReference  String?
  tripayPaymentUrl String?
  paymentProofUrl  String?
  status           OrderStatus    @default(PENDING)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
}

model Customer {
  id        String   @id @default(cuid())
  name      String
  phone     String   @unique
  whatsapp  String
  city      String
  createdAt DateTime @default(now())
}

model Settings {
  id    String @id @default(cuid())
  key   String @unique
  value String @db.Text
}

model AdminUser {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
}
```

- [ ] **Step 3: Jalankan migration**

Pastikan PostgreSQL sudah running dan `DATABASE_URL` di `.env` sudah benar, lalu:

```bash
npx prisma migrate dev --name init
```

Expected output:
```
✔ Generated Prisma Client
Your database is now in sync with your schema.
```

- [ ] **Step 4: Verifikasi tabel terbuat**

```bash
npx prisma studio
```

Buka `http://localhost:5555` — semua tabel harus tampil: Product, Order, Customer, Settings, AdminUser.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Prisma schema with all models and enums"
```

---

### Task 3: Seed Data

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Tambahkan seed script ke package.json**

Tambahkan ke `package.json`:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Install `ts-node`:

```bash
npm install ts-node --save-dev
```

- [ ] **Step 2: Tulis seed file**

Buat `prisma/seed.ts`:

```ts
import { PrismaClient, ProductType, QurbanLocation, ProductStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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
      images: [],
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
      images: [],
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
      images: [],
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
      images: [],
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
      images: [],
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
```

- [ ] **Step 3: Buat placeholder image**

```bash
mkdir -p public/uploads
# Salin satu gambar placeholder ke public/uploads/placeholder.jpg
# (bisa dari mana saja, atau buat kosong dulu)
```

- [ ] **Step 4: Jalankan seed**

```bash
npx prisma db seed
```

Expected output:
```
✅ Seed selesai
```

- [ ] **Step 5: Verifikasi di Prisma Studio**

```bash
npx prisma studio
```

Cek tabel `Product` → harus ada 5 baris. Cek `AdminUser` → 1 baris. Cek `Settings` → 27 baris.

- [ ] **Step 6: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add seed data — admin user, 5 products, default settings"
```

---

### Task 4: Core Library Files

**Files:**
- Create: `lib/prisma.ts`
- Create: `lib/shipping.ts`

- [ ] **Step 1: Buat Prisma singleton client**

Buat `lib/prisma.ts`:

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 2: Buat shipping calculator**

Buat `lib/shipping.ts`:

```ts
export const BANDUNG_RAYA_CITIES = [
  'Kota Bandung',
  'Kabupaten Bandung',
  'Kabupaten Bandung Barat',
  'Kota Cimahi',
  'Kabupaten Sumedang',
] as const

export const SHIPPING_COST_OUTSIDE = 150_000

export function calculateShipping(city: string): number {
  const normalized = city.trim().toLowerCase()
  const isBandungRaya = BANDUNG_RAYA_CITIES.some((c) =>
    normalized.includes(c.toLowerCase().replace('kota ', '').replace('kabupaten ', ''))
  )
  return isBandungRaya ? 0 : SHIPPING_COST_OUTSIDE
}

export function formatShippingLabel(cost: number): string {
  return cost === 0
    ? '✅ Gratis ongkir Bandung Raya!'
    : `🚚 +Rp ${cost.toLocaleString('id-ID')} ongkir luar Bandung Raya`
}
```

- [ ] **Step 3: Verifikasi tidak ada TypeScript error**

```bash
npx tsc --noEmit
```

Expected: tidak ada error.

- [ ] **Step 4: Commit**

```bash
git add lib/prisma.ts lib/shipping.ts
git commit -m "feat: add Prisma singleton and shipping calculator"
```

---

### Task 5: NextAuth Setup

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Buat NextAuth config**

Buat `lib/auth.ts`:

```ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.adminUser.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 jam
  },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
}
```

- [ ] **Step 2: Buat NextAuth route handler**

Buat `app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 3: Tambah type augmentation untuk session**

Buat `types/next-auth.d.ts`:

```ts
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
  }
}
```

- [ ] **Step 4: Buat middleware proteksi admin**

Buat `middleware.ts`:

```ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/admin/login',
    },
  }
)

export const config = {
  matcher: ['/admin/((?!login).*)'],
}
```

- [ ] **Step 5: Verifikasi TypeScript**

```bash
npx tsc --noEmit
```

Expected: tidak ada error.

- [ ] **Step 6: Commit**

```bash
git add lib/auth.ts app/api/auth/ middleware.ts types/
git commit -m "feat: add NextAuth credentials auth with JWT session and admin middleware"
```

---

**(End of Part 1 — Foundation)**

---

## PART 2: PUBLIC PAGES

---

### Task 6: Public Layout + Shared Components

**Files:**
- Create: `app/(public)/layout.tsx`
- Create: `components/public/Header.tsx`
- Create: `components/public/Footer.tsx`
- Create: `components/public/ProductCard.tsx`
- Create: `components/public/TrackingStepper.tsx`

- [ ] **Step 1: Buat public layout wrapper**

Buat `app/(public)/layout.tsx`:

```tsx
import Header from '@/components/public/Header'
import Footer from '@/components/public/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Buat Header component**

Buat `components/public/Header.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Beranda' },
  { href: '/katalog', label: 'Katalog' },
  { href: '/lacak', label: 'Lacak Pesanan' },
  { href: '/tentang', label: 'Tentang Kami' },
]

export default function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-[#1B5E3B] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-xl font-bold text-white tracking-tight">
              Beyond<span className="text-[#C8962A]">Qurban</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-[#C8962A]'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA desktop */}
          <Link
            href="/katalog"
            className="hidden md:inline-flex items-center px-4 py-2 rounded-lg bg-[#C8962A] text-white text-sm font-semibold hover:bg-[#b07e20] transition-colors"
          >
            Pesan Sekarang
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0D3320] border-t border-white/10">
          <nav className="flex flex-col px-4 py-4 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`text-sm font-medium py-2 ${
                  pathname === link.href ? 'text-[#C8962A]' : 'text-white/80'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/katalog"
              onClick={() => setOpen(false)}
              className="mt-2 text-center px-4 py-2 rounded-lg bg-[#C8962A] text-white text-sm font-semibold"
            >
              Pesan Sekarang
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
```

- [ ] **Step 3: Buat Footer component**

Buat `components/public/Footer.tsx`:

```tsx
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#0D3320] text-white/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <p className="font-serif text-xl font-bold text-white mb-3">
              Beyond<span className="text-[#C8962A]">Qurban</span>
            </p>
            <p className="text-sm leading-relaxed">
              Platform kurban online terpercaya. Domba lokal berkualitas, penyaluran amanah ke seluruh dunia.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Menu</p>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/', label: 'Beranda' },
                { href: '/katalog', label: 'Katalog Domba' },
                { href: '/lacak', label: 'Lacak Pesanan' },
                { href: '/tentang', label: 'Tentang Kami' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-[#C8962A] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Kontak</p>
            <ul className="space-y-2 text-sm">
              <li>WhatsApp: <a href="https://wa.me/6281234567890" className="hover:text-[#C8962A]">0812-3456-7890</a></li>
              <li>Email: info@beyondqurban.com</li>
              <li>Bandung, Jawa Barat</li>
              <li>Senin–Sabtu, 08.00–17.00 WIB</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Beyond Qurban. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Buat ProductCard component**

Buat `components/public/ProductCard.tsx`:

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { QurbanLocation } from '@prisma/client'

type Props = {
  id: string
  slug: string
  name: string
  type: string
  weight: number
  price: number
  imageUrl: string
  badge: string | null
  qurbanLocation: QurbanLocation
  allowHomeDelivery: boolean
  stock: number
}

const locationBadge: Record<QurbanLocation, { label: string; color: string }> = {
  INDONESIA: { label: 'Antar Rumah', color: 'bg-green-100 text-green-800' },
  AFRICA: { label: 'Kurban Afrika', color: 'bg-orange-100 text-orange-800' },
  PALESTINE: { label: 'Kurban Palestina', color: 'bg-red-100 text-red-800' },
}

function getCategoryBadge(loc: QurbanLocation, allowHome: boolean) {
  if (loc === QurbanLocation.INDONESIA && !allowHome) {
    return { label: 'Penyaluran', color: 'bg-blue-100 text-blue-800' }
  }
  return locationBadge[loc]
}

export default function ProductCard(props: Props) {
  const catBadge = getCategoryBadge(props.qurbanLocation, props.allowHomeDelivery)

  return (
    <Link href={`/katalog/${props.slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={props.imageUrl}
            alt={props.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {props.badge && (
            <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold bg-[#C8962A] text-white">
              {props.badge}
            </span>
          )}
          {props.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">Habis Terjual</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${catBadge.color}`}>
            {catBadge.label}
          </span>
          <h3 className="font-serif font-semibold text-[#0D1F17] text-base leading-snug mb-1 line-clamp-2">
            {props.name}
          </h3>
          <p className="text-sm text-[#6B7280] mb-3">{props.weight} kg · {props.type}</p>
          <p className="font-bold text-[#1B5E3B] text-lg">
            Rp {props.price.toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 5: Buat TrackingStepper component**

Buat `components/public/TrackingStepper.tsx`:

```tsx
import { OrderStatus } from '@prisma/client'
import { Check } from 'lucide-react'

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'PENDING', label: 'Menunggu Bayar' },
  { key: 'CONFIRMED', label: 'Dikonfirmasi' },
  { key: 'PREPARING', label: 'Disiapkan' },
  { key: 'SHIPPED', label: 'Dikirim' },
  { key: 'DELIVERED', label: 'Terkirim' },
]

const STATUS_INDEX: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
}

export default function TrackingStepper({ status }: { status: OrderStatus }) {
  const currentIndex = STATUS_INDEX[status]

  if (status === 'CANCELLED') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl font-semibold">
          Pesanan Dibatalkan
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between w-full">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex
        const isActive = index === currentIndex

        return (
          <div key={step.key} className="flex flex-col items-center flex-1">
            {/* Circle */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                isDone
                  ? 'bg-[#1B5E3B] border-[#1B5E3B] text-white'
                  : isActive
                  ? 'bg-white border-[#1B5E3B] text-[#1B5E3B]'
                  : 'bg-white border-gray-200 text-gray-300'
              }`}
            >
              {isDone ? (
                <Check size={16} strokeWidth={3} />
              ) : (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>

            {/* Line */}
            {index < STEPS.length - 1 && (
              <div
                className={`hidden sm:block h-0.5 w-full mt-4 ${
                  isDone ? 'bg-[#1B5E3B]' : 'bg-gray-200'
                }`}
                style={{ marginTop: '-20px', marginLeft: '50%', width: '100%' }}
              />
            )}

            {/* Label */}
            <p
              className={`mt-2 text-center text-xs leading-tight ${
                isActive ? 'text-[#1B5E3B] font-semibold' : isDone ? 'text-[#1B5E3B]' : 'text-gray-400'
              }`}
            >
              {step.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 6: Verifikasi tidak ada TypeScript error**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add app/\(public\)/layout.tsx components/public/
git commit -m "feat: add public layout, Header, Footer, ProductCard, TrackingStepper"
```

---

### Task 7: Server Actions

**Files:**
- Create: `lib/actions/products.ts`
- Create: `lib/actions/orders.ts`
- Create: `lib/actions/settings.ts`

- [ ] **Step 1: Buat products actions**

Buat `lib/actions/products.ts`:

```ts
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
  const slug = generateSlug(data.name)

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
```

- [ ] **Step 2: Buat orders actions**

Buat `lib/actions/orders.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { calculateShipping } from '@/lib/shipping'
import { DeliveryMethod, OrderStatus } from '@prisma/client'

const OrderSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.literal(1),
  customerName: z.string().min(2).max(100),
  phone: z.string().min(9).max(16),
  whatsapp: z.string().min(9).max(16),
  deliveryMethod: z.nativeEnum(DeliveryMethod),
  address: z.string().optional(),
  kelurahan: z.string().optional(),
  kecamatan: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  deliveryNotes: z.string().optional(),
  sacrificeDate: z.string().datetime(),
  deliveryDate: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
})
.refine((data) => {
  if (data.deliveryMethod === 'HOME_DELIVERY') {
    return !!data.address && !!data.city && !!data.province
  }
  return true
}, { message: 'Alamat wajib diisi untuk pengiriman ke rumah', path: ['address'] })

async function generateOrderNumber(): Promise<string> {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const count = await prisma.order.count()
  const seq = String(count + 1).padStart(4, '0')
  return `ORD-${dateStr}-${seq}`
}

export async function createOrder(formData: unknown) {
  const parsed = OrderSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const data = parsed.data

  const product = await prisma.product.findUnique({ where: { id: data.productId } })
  if (!product) return { error: 'Produk tidak ditemukan.' }
  if (product.stock < 1) return { error: 'Stok produk habis.' }

  if (data.deliveryMethod === 'HOME_DELIVERY' && !product.allowHomeDelivery) {
    return { error: 'Produk ini tidak mendukung pengiriman ke rumah.' }
  }

  // Hitung ongkir — validasi ulang di server
  const shippingCost =
    data.deliveryMethod === 'HOME_DELIVERY' && data.city
      ? calculateShipping(data.city)
      : 0

  const totalAmount = product.price * data.quantity + shippingCost
  const orderNumber = await generateOrderNumber()

  try {
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: data.customerName,
        phone: data.phone,
        whatsapp: data.whatsapp,
        deliveryMethod: data.deliveryMethod,
        qurbanLocation: product.qurbanLocation,
        address: data.address,
        kelurahan: data.kelurahan,
        kecamatan: data.kecamatan,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        deliveryNotes: data.deliveryNotes,
        sacrificeDate: new Date(data.sacrificeDate),
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        notes: data.notes,
        productId: data.productId,
        quantity: data.quantity,
        shippingCost,
        totalAmount,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
      },
    })

    // Upsert customer record
    await prisma.customer.upsert({
      where: { phone: data.phone },
      update: { name: data.customerName, whatsapp: data.whatsapp, city: data.city ?? '' },
      create: {
        name: data.customerName,
        phone: data.phone,
        whatsapp: data.whatsapp,
        city: data.city ?? '',
      },
    })

    revalidatePath('/admin/pesanan')
    return { success: true, order }
  } catch {
    return { error: 'Gagal membuat pesanan. Coba lagi.' }
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { product: true },
    })
    revalidatePath('/admin/pesanan')
    return { success: true, order }
  } catch {
    return { error: 'Gagal update status pesanan.' }
  }
}
```

- [ ] **Step 3: Buat settings actions**

Buat `lib/actions/settings.ts`:

```ts
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
```

- [ ] **Step 4: Verifikasi TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add lib/actions/
git commit -m "feat: add server actions — products, orders, settings"
```

---

### Task 8: Homepage

**Files:**
- Create: `app/(public)/page.tsx`

- [ ] **Step 1: Buat Homepage (Server Component)**

Buat `app/(public)/page.tsx`:

```tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/public/ProductCard'

async function getHomepageData() {
  const [products, totalOrders, totalCustomers, deliveredCount] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      take: 4,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count(),
    prisma.customer.count(),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
  ])
  return { products, totalOrders, totalCustomers, deliveredCount }
}

export default async function HomePage() {
  const { products, totalOrders, totalCustomers, deliveredCount } = await getHomepageData()
  const deliveredPercent = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 100

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B5E3B] to-[#0D3320] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#C8962A] text-sm font-semibold uppercase tracking-widest mb-4">
            Platform Kurban Online Terpercaya
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Kurban Berkah,<br />
            <span className="text-[#C8962A]">Amanah & Terjangkau</span>
          </h1>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Domba lokal pilihan dengan penyaluran ke Indonesia, Afrika, dan Palestina.
            Proses mudah, pembayaran aman via Tripay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/katalog"
              className="px-8 py-4 rounded-xl bg-[#C8962A] text-white font-semibold text-lg hover:bg-[#b07e20] transition-colors"
            >
              Lihat Katalog Domba
            </Link>
            <Link
              href="/lacak"
              className="px-8 py-4 rounded-xl border border-white/30 text-white font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              Lacak Pesanan
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="bg-[#F5E6C3] py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: `${products.length}+`, label: 'Pilihan Domba' },
            { value: `${totalOrders}+`, label: 'Total Pesanan' },
            { value: `${deliveredPercent}%`, label: 'Terkirim Tepat Waktu' },
            { value: `${totalCustomers}+`, label: 'Pelanggan Puas' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-serif text-3xl font-bold text-[#1B5E3B]">{stat.value}</p>
              <p className="text-sm text-[#6B7280] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mengapa Kami */}
      <section className="py-20 px-4 bg-[#FAFAF8]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-center text-[#0D1F17] mb-12">
            Mengapa Memilih Kami?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🐑',
                title: 'Domba Berkualitas',
                desc: 'Dipilih langsung dari peternak terpercaya. Sehat, tidak cacat, sesuai syariat Islam.',
              },
              {
                icon: '🛡️',
                title: 'Pembayaran Aman',
                desc: 'Terintegrasi dengan Tripay — mendukung transfer bank, QRIS, dan virtual account.',
              },
              {
                icon: '🌍',
                title: 'Penyaluran Luas',
                desc: 'Kurban bisa disalurkan di Indonesia, Afrika, maupun Palestina sesuai pilihan Anda.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="font-serif text-lg font-bold text-[#0D1F17] mb-2">{item.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Produk Terpopuler */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-serif text-3xl font-bold text-[#0D1F17]">Produk Terpopuler</h2>
            <Link href="/katalog" className="text-[#1B5E3B] font-semibold text-sm hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Cara Pesan */}
      <section className="py-20 px-4 bg-[#FAFAF8]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-center text-[#0D1F17] mb-12">
            Cara Memesan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Pilih Domba', desc: 'Pilih dari katalog domba lokal atau penyaluran mancanegara.' },
              { step: '02', title: 'Isi Data', desc: 'Lengkapi nama, nomor WA, dan metode pengiriman.' },
              { step: '03', title: 'Bayar', desc: 'Pilih metode pembayaran via Tripay — bank transfer atau QRIS.' },
              { step: '04', title: 'Terima Laporan', desc: 'Notifikasi WA otomatis + laporan penyembelihan.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#1B5E3B] text-white flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-serif font-bold text-[#0D1F17] mb-2">{item.title}</h3>
                <p className="text-sm text-[#6B7280]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 2: Update `next.config.ts` untuk lokal images**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    // Lokal uploads via /public/uploads sudah otomatis ter-serve
  },
}

export default nextConfig
```

- [ ] **Step 3: Test homepage di browser**

```bash
npm run dev
```

Buka `http://localhost:3000` — harus tampil Hero, Stats, Produk cards, Cara Pesan.

- [ ] **Step 4: Commit**

```bash
git add app/\(public\)/page.tsx next.config.ts
git commit -m "feat: add homepage with hero, stats, product grid, how-to-order"
```

---

### Task 9: Katalog Page

**Files:**
- Create: `app/(public)/katalog/page.tsx`

- [ ] **Step 1: Buat halaman Katalog**

Buat `app/(public)/katalog/page.tsx`:

```tsx
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/public/ProductCard'
import { ProductType } from '@prisma/client'

const TABS = [
  { key: 'semua', label: 'Semua' },
  { key: 'lokal', label: 'Domba Lokal' },
  { key: 'penyaluran', label: 'Penyaluran Indonesia' },
  { key: 'afrika', label: 'Qurban Afrika' },
  { key: 'palestina', label: 'Qurban Palestina' },
] as const

type Tab = typeof TABS[number]['key']

type SearchParams = { tab?: string; sort?: string }

async function getProducts(tab: Tab, sort: string) {
  const where: Parameters<typeof prisma.product.findMany>[0]['where'] = { status: 'ACTIVE' }

  if (tab === 'lokal') {
    where.qurbanLocation = 'INDONESIA'
    where.allowHomeDelivery = true
  } else if (tab === 'penyaluran') {
    where.qurbanLocation = 'INDONESIA'
    where.allowHomeDelivery = false
  } else if (tab === 'afrika') {
    where.qurbanLocation = 'AFRICA'
  } else if (tab === 'palestina') {
    where.qurbanLocation = 'PALESTINE'
  }

  const orderBy =
    sort === 'price_asc'
      ? { price: 'asc' as const }
      : sort === 'price_desc'
      ? { price: 'desc' as const }
      : { createdAt: 'desc' as const }

  return prisma.product.findMany({ where, orderBy })
}

export default async function KatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const tab = (searchParams.tab as Tab) || 'semua'
  const sort = searchParams.sort || 'newest'
  const products = await getProducts(tab, sort)

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header katalog */}
      <div className="bg-[#1B5E3B] text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif text-3xl font-bold mb-2">Katalog Domba Kurban</h1>
          <p className="text-white/70">Pilih domba sesuai kebutuhan dan kemampuan Anda</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab filter */}
        <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
          {TABS.map((t) => (
            <a
              key={t.key}
              href={`/katalog?tab=${t.key}&sort=${sort}`}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-[#1B5E3B] text-white'
                  : 'bg-white text-[#6B7280] border border-gray-200 hover:border-[#1B5E3B] hover:text-[#1B5E3B]'
              }`}
            >
              {t.label}
            </a>
          ))}
        </div>

        {/* Sort + count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[#6B7280]">{products.length} produk ditemukan</p>
          <select
            defaultValue={sort}
            onChange={(e) => {
              window.location.href = `/katalog?tab=${tab}&sort=${e.target.value}`
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
          >
            <option value="newest">Terbaru</option>
            <option value="price_asc">Harga: Rendah ke Tinggi</option>
            <option value="price_desc">Harga: Tinggi ke Rendah</option>
          </select>
        </div>

        {/* Grid produk */}
        {products.length === 0 ? (
          <div className="text-center py-20 text-[#6B7280]">
            <p className="text-4xl mb-4">🐑</p>
            <p className="font-semibold text-lg">Belum ada produk di kategori ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test di browser**

Buka `http://localhost:3000/katalog` — semua tab harus berfungsi, klik tab "Domba Lokal" harus filter.

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/katalog/page.tsx
git commit -m "feat: add katalog page with category tabs and sort"
```

---

### Task 10: Detail Produk + OrderForm

**Files:**
- Create: `app/(public)/katalog/[slug]/page.tsx`
- Create: `components/public/OrderForm.tsx`

- [ ] **Step 1: Buat OrderForm (Client Component)**

Buat `components/public/OrderForm.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Product } from '@prisma/client'
import { calculateShipping, formatShippingLabel, BANDUNG_RAYA_CITIES } from '@/lib/shipping'
import { createOrder } from '@/lib/actions/orders'

type Props = { product: Product }

const DELIVERY_DATE_OPTIONS = [
  { value: 'H-3', label: 'H-3 (3 hari sebelum Idul Adha)' },
  { value: 'H-2', label: 'H-2 (2 hari sebelum Idul Adha)' },
  { value: 'H-1', label: 'H-1 (1 hari sebelum Idul Adha)' },
  { value: 'H',   label: 'Hari H (Idul Adha)' },
]

export default function OrderForm({ product }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deliveryMethod, setDeliveryMethod] = useState<'ONE_UMMAH' | 'HOME_DELIVERY'>('ONE_UMMAH')
  const [city, setCity] = useState('')
  const [shippingCost, setShippingCost] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleCityChange = (value: string) => {
    setCity(value)
    if (deliveryMethod === 'HOME_DELIVERY' && value.trim()) {
      setShippingCost(calculateShipping(value))
    }
  }

  const handleMethodChange = (method: 'ONE_UMMAH' | 'HOME_DELIVERY') => {
    setDeliveryMethod(method)
    if (method === 'ONE_UMMAH') setShippingCost(0)
    else if (city.trim()) setShippingCost(calculateShipping(city))
  }

  const totalAmount = product.price + shippingCost

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    const sacrificeDateRaw = fd.get('sacrificeDate') as string
    const deliveryDateOffset = fd.get('deliveryDate') as string | null

    // Compute deliveryDate from offset
    let deliveryDate: string | undefined
    if (deliveryMethod === 'HOME_DELIVERY' && sacrificeDateRaw && deliveryDateOffset) {
      const sacrificeMs = new Date(sacrificeDateRaw).getTime()
      const offsets: Record<string, number> = { 'H-3': -3, 'H-2': -2, 'H-1': -1, 'H': 0 }
      const days = offsets[deliveryDateOffset] ?? 0
      deliveryDate = new Date(sacrificeMs + days * 86400000).toISOString()
    }

    const payload = {
      productId: product.id,
      quantity: 1 as const,
      customerName: fd.get('customerName') as string,
      phone: fd.get('phone') as string,
      whatsapp: fd.get('whatsapp') as string,
      deliveryMethod,
      address: fd.get('address') as string || undefined,
      kelurahan: fd.get('kelurahan') as string || undefined,
      kecamatan: fd.get('kecamatan') as string || undefined,
      city: city || undefined,
      province: fd.get('province') as string || undefined,
      postalCode: fd.get('postalCode') as string || undefined,
      deliveryNotes: fd.get('deliveryNotes') as string || undefined,
      sacrificeDate: sacrificeDateRaw ? new Date(sacrificeDateRaw).toISOString() : '',
      deliveryDate,
      notes: fd.get('notes') as string || undefined,
    }

    startTransition(async () => {
      const result = await createOrder(payload)
      if ('error' in result && result.error) {
        setError(typeof result.error === 'string' ? result.error : 'Data tidak valid. Periksa kembali.')
        return
      }
      if ('success' in result && result.success && result.order) {
        // Tripay redirect will happen via separate step (Task 18)
        // For now redirect ke halaman lacak
        router.push(`/lacak?order=${result.order.orderNumber}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Data Customer */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-serif font-bold text-[#0D1F17] text-lg mb-5">Data Pemesan</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Nama Lengkap *</label>
            <input name="customerName" required className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" placeholder="Nama sesuai identitas" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">No. HP *</label>
              <input name="phone" required type="tel" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" placeholder="08xxxxxxxxxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">No. WhatsApp *</label>
              <input name="whatsapp" required type="tel" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" placeholder="08xxxxxxxxxx" />
            </div>
          </div>
        </div>
      </div>

      {/* Metode Pengiriman */}
      {product.allowHomeDelivery && product.qurbanLocation === 'INDONESIA' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-serif font-bold text-[#0D1F17] text-lg mb-5">Metode Penerimaan Kurban</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'ONE_UMMAH', label: 'Penyaluran One Ummah', desc: 'Daging dibagikan ke penerima manfaat' },
              { value: 'HOME_DELIVERY', label: 'Antar ke Rumah', desc: 'Daging dikirim ke alamat Anda' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleMethodChange(opt.value as 'ONE_UMMAH' | 'HOME_DELIVERY')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  deliveryMethod === opt.value
                    ? 'border-[#1B5E3B] bg-[#1B5E3B]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-sm text-[#0D1F17]">{opt.label}</p>
                <p className="text-xs text-[#6B7280] mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alamat — hanya jika HOME_DELIVERY */}
      {deliveryMethod === 'HOME_DELIVERY' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-serif font-bold text-[#0D1F17] text-lg mb-5">Alamat Pengiriman</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Alamat Lengkap *</label>
              <textarea name="address" required rows={2} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] resize-none" placeholder="Jalan, nomor rumah, RT/RW" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Kelurahan</label>
                <input name="kelurahan" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Kecamatan</label>
                <input name="kecamatan" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Kota/Kabupaten *</label>
                <select
                  value={city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] bg-white"
                >
                  <option value="">Pilih kota...</option>
                  {BANDUNG_RAYA_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Lainnya">Lainnya (Luar Bandung Raya)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Provinsi *</label>
                <input name="province" required className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" placeholder="Jawa Barat" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Kode Pos</label>
              <input name="postalCode" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
            </div>

            {/* Shipping cost feedback */}
            {city && (
              <div className={`text-sm font-medium px-4 py-3 rounded-lg ${shippingCost === 0 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                {formatShippingLabel(shippingCost)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Jadwal */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-serif font-bold text-[#0D1F17] text-lg mb-5">Jadwal Kurban</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Tanggal Idul Adha *</label>
            <input name="sacrificeDate" required type="date" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
          </div>
          {deliveryMethod === 'HOME_DELIVERY' && (
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Tanggal Antar ke Rumah *</label>
              <select name="deliveryDate" required className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] bg-white">
                {DELIVERY_DATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Catatan Tambahan</label>
            <textarea name="notes" rows={3} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] resize-none" placeholder="Pesan khusus untuk tim kami..." />
          </div>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="bg-[#1B5E3B] text-white rounded-2xl p-6">
        <h3 className="font-serif font-bold text-lg mb-4">Ringkasan Pesanan</h3>
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-white/70">Harga domba</span>
            <span>Rp {product.price.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Ongkir</span>
            <span>{shippingCost === 0 ? 'Gratis' : `Rp ${shippingCost.toLocaleString('id-ID')}`}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-white/20 pt-2 mt-2">
            <span>Total</span>
            <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-100 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || product.stock === 0}
          className="w-full py-4 rounded-xl bg-[#C8962A] text-white font-bold text-lg hover:bg-[#b07e20] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Memproses...' : product.stock === 0 ? 'Stok Habis' : 'Pesan & Bayar Sekarang'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Buat Detail Produk page**

Buat `app/(public)/katalog/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import OrderForm from '@/components/public/OrderForm'

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ select: { slug: true } })
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } })
  if (!product) return { title: 'Produk Tidak Ditemukan' }
  return {
    title: `${product.name} — Beyond Qurban`,
    description: product.description.slice(0, 160),
  }
}

export default async function DetailProdukPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } })
  if (!product || product.status === 'INACTIVE') notFound()

  const locationLabel: Record<string, string> = {
    INDONESIA: 'Indonesia',
    AFRICA: 'Afrika',
    PALESTINE: 'Palestina',
  }
  const typeLabel: Record<string, string> = {
    LOKAL: 'Lokal',
    ETAWA: 'Etawa',
    GARUT: 'Garut',
    BATUR: 'Batur',
  }

  const allImages = [product.imageUrl, ...product.images].filter(Boolean).slice(0, 5)

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Kiri: Gallery */}
          <div>
            {/* Foto utama */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              {product.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-[#C8962A] text-white text-sm font-semibold rounded-full">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Thumbnail gallery */}
            {allImages.length > 1 && (
              <div className="flex gap-2">
                {allImages.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200">
                    <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="80px" />
                  </div>
                ))}
              </div>
            )}

            {/* Specs */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Berat', value: `${product.weight} kg` },
                { label: 'Jenis', value: typeLabel[product.type] },
                { label: 'Kondisi', value: 'Sehat & tidak cacat' },
                { label: 'Lokasi Kurban', value: locationLabel[product.qurbanLocation] },
              ].map((spec) => (
                <div key={spec.label} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                  <p className="text-xs text-[#6B7280] mb-1">{spec.label}</p>
                  <p className="text-sm font-semibold text-[#0D1F17]">{spec.value}</p>
                </div>
              ))}
            </div>

            {/* Deskripsi */}
            <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="font-serif font-bold text-[#0D1F17] text-lg mb-3">Deskripsi Produk</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          </div>

          {/* Kanan: Order Form */}
          <div>
            <div className="mb-6">
              <h1 className="font-serif text-2xl font-bold text-[#0D1F17] mb-2">{product.name}</h1>
              <p className="text-3xl font-bold text-[#1B5E3B]">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
              <p className="text-sm text-[#6B7280] mt-1">
                Stok tersisa: {product.stock} ekor
              </p>
            </div>
            <OrderForm product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Test di browser**

Buka `http://localhost:3000/katalog` → klik salah satu produk → harus tampil detail + form.
Ganti metode ke "Antar ke Rumah" → alamat harus muncul. Pilih kota Bandung → tampil "Gratis ongkir!". Pilih "Lainnya" → tampil "+Rp 150.000".

- [ ] **Step 4: Commit**

```bash
git add app/\(public\)/katalog/ components/public/OrderForm.tsx
git commit -m "feat: add detail produk page with gallery, specs, and real-time shipping OrderForm"
```

---

### Task 11: Lacak Pesanan

**Files:**
- Create: `app/(public)/lacak/page.tsx`

- [ ] **Step 1: Buat halaman Lacak Pesanan**

Buat `app/(public)/lacak/page.tsx`:

```tsx
import { prisma } from '@/lib/prisma'
import TrackingStepper from '@/components/public/TrackingStepper'
import Link from 'next/link'

type SearchParams = { order?: string }

async function findOrder(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: { product: true },
  })
}

const DELIVERY_METHOD_LABEL: Record<string, string> = {
  ONE_UMMAH: 'Penyaluran One Ummah',
  HOME_DELIVERY: 'Antar ke Rumah',
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: 'Belum Bayar',
  PAID: 'Sudah Bayar',
  EXPIRED: 'Kadaluarsa',
  REFUNDED: 'Dikembalikan',
}

export default async function LacakPage({ searchParams }: { searchParams: SearchParams }) {
  const order = searchParams.order
    ? await findOrder(searchParams.order.toUpperCase())
    : null

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="bg-[#1B5E3B] text-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-serif text-3xl font-bold mb-2">Lacak Pesanan</h1>
          <p className="text-white/70">Masukkan nomor pesanan untuk melihat status terkini</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Form input */}
        <form method="get" action="/lacak" className="flex gap-3 mb-10">
          <input
            name="order"
            defaultValue={searchParams.order}
            placeholder="Contoh: ORD-20260606-0001"
            required
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#1B5E3B] text-white font-semibold text-sm hover:bg-[#0D3320] transition-colors"
          >
            Lacak
          </button>
        </form>

        {/* Hasil */}
        {searchParams.order && !order && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-[#0D1F17]">Pesanan tidak ditemukan</p>
            <p className="text-sm text-[#6B7280] mt-1">
              Pastikan nomor pesanan Anda benar, contoh: ORD-20260606-0001
            </p>
          </div>
        )}

        {order && (
          <div className="space-y-6">
            {/* Stepper */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-serif font-bold text-[#0D1F17] text-lg mb-6">Status Pesanan</h2>
              <TrackingStepper status={order.status} />
            </div>

            {/* Detail order */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-serif font-bold text-[#0D1F17] text-lg mb-5">Detail Pesanan</h2>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Nomor Pesanan', value: order.orderNumber },
                  { label: 'Produk', value: order.product.name },
                  { label: 'Nama Pemesan', value: order.customerName },
                  { label: 'Metode Kurban', value: DELIVERY_METHOD_LABEL[order.deliveryMethod] },
                  {
                    label: 'Lokasi Kurban',
                    value: { INDONESIA: 'Indonesia', AFRICA: 'Afrika', PALESTINE: 'Palestina' }[order.qurbanLocation],
                  },
                  {
                    label: 'Tanggal Idul Adha',
                    value: new Date(order.sacrificeDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                  },
                  {
                    label: 'Status Pembayaran',
                    value: PAYMENT_STATUS_LABEL[order.paymentStatus],
                  },
                  {
                    label: 'Total Pembayaran',
                    value: `Rp ${order.totalAmount.toLocaleString('id-ID')}`,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between gap-4">
                    <span className="text-[#6B7280]">{row.label}</span>
                    <span className="font-medium text-[#0D1F17] text-right">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Link bayar jika belum bayar */}
              {order.paymentStatus === 'UNPAID' && order.tripayPaymentUrl && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <a
                    href={order.tripayPaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-3 rounded-xl bg-[#C8962A] text-white font-semibold hover:bg-[#b07e20] transition-colors"
                  >
                    Lanjutkan Pembayaran →
                  </a>
                </div>
              )}
            </div>

            <div className="text-center">
              <Link href="/katalog" className="text-[#1B5E3B] text-sm font-medium hover:underline">
                ← Kembali ke Katalog
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test di browser**

Buka `http://localhost:3000/lacak` → submit form kosong → harus validasi. Input nomor pesanan yang ada → muncul stepper + detail. Input nomor tidak ada → muncul pesan "tidak ditemukan".

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/lacak/page.tsx
git commit -m "feat: add lacak pesanan page with stepper and order detail"
```

---

### Task 12: Tentang Kami

**Files:**
- Create: `app/(public)/tentang/page.tsx`

- [ ] **Step 1: Buat halaman Tentang Kami**

Buat `app/(public)/tentang/page.tsx`:

```tsx
import { getSettings } from '@/lib/actions/settings'

export default async function TentangPage() {
  const settings = await getSettings()

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1B5E3B] to-[#0D3320] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-serif text-4xl font-bold mb-4">
            Tentang {settings.store_name || 'Beyond Qurban'}
          </h1>
          <p className="text-white/70 text-lg">
            Platform kurban online yang menghadirkan kemudahan, keamanan, dan kepercayaan
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-16">
        {/* Profil */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <h2 className="font-serif text-2xl font-bold text-[#0D1F17] mb-4">Profil Kami</h2>
          <p className="text-[#6B7280] leading-relaxed">
            {settings.store_name || 'Beyond Qurban'} adalah platform penjualan domba kurban online yang
            berdedikasi menyediakan hewan kurban berkualitas. Kami bekerja sama dengan peternak terpercaya
            di Jawa Barat untuk menghadirkan domba yang sehat, tidak cacat, dan memenuhi syarat kurban sesuai
            syariat Islam.
          </p>
        </section>

        {/* Visi & Misi */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-[#0D1F17] mb-8 text-center">Visi & Misi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1B5E3B] text-white rounded-2xl p-8">
              <h3 className="font-serif font-bold text-xl mb-4 text-[#C8962A]">Visi</h3>
              <p className="text-white/80 leading-relaxed">
                Menjadi platform kurban online terpercaya yang menghubungkan shohibul qurban dengan
                penerima manfaat di seluruh dunia dengan cara yang amanah dan transparan.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <h3 className="font-serif font-bold text-xl mb-4 text-[#1B5E3B]">Misi</h3>
              <ul className="text-[#6B7280] space-y-2 text-sm leading-relaxed">
                <li>• Menyediakan hewan kurban berkualitas dan sesuai syariat</li>
                <li>• Memudahkan proses pemesanan dan pembayaran kurban</li>
                <li>• Menjangkau penerima manfaat hingga pelosok dunia</li>
                <li>• Memberikan transparansi penuh kepada shohibul qurban</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Keunggulan */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-[#0D1F17] mb-8 text-center">Keunggulan Kami</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '✅', title: 'Terverifikasi Syariat', desc: 'Setiap hewan kurban dipastikan memenuhi syarat sesuai fiqih Islam' },
              { icon: '🔒', title: 'Pembayaran Aman', desc: 'Terintegrasi Tripay dengan berbagai pilihan metode pembayaran' },
              { icon: '📲', title: 'Notifikasi Real-time', desc: 'Update status pesanan otomatis via WhatsApp' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-serif font-bold text-[#0D1F17] mb-2">{item.title}</h3>
                <p className="text-sm text-[#6B7280]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Kontak */}
        <section className="bg-[#F5E6C3] rounded-2xl p-8">
          <h2 className="font-serif text-2xl font-bold text-[#0D1F17] mb-6 text-center">Hubungi Kami</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm max-w-lg mx-auto">
            {[
              { label: 'WhatsApp CS', value: settings.store_whatsapp || '-', href: `https://wa.me/${settings.store_whatsapp}` },
              { label: 'Email', value: settings.store_email || '-', href: `mailto:${settings.store_email}` },
              { label: 'Alamat', value: settings.store_address || '-', href: null },
              { label: 'Jam Operasional', value: settings.store_hours || '-', href: null },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[#6B7280] mb-0.5">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="font-semibold text-[#1B5E3B] hover:underline">{item.value}</a>
                ) : (
                  <p className="font-semibold text-[#0D1F17]">{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test di browser**

Buka `http://localhost:3000/tentang` — harus tampil semua section dengan data dari Settings DB.

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/tentang/page.tsx
git commit -m "feat: add tentang kami page with dynamic settings data"
```

---

**(End of Part 2 — Public Pages)**

---
## PART 3: ADMIN

---

### Task 13: Admin Login Page

**Files:**
- Create: `app/admin/login/page.tsx`

- [ ] **Step 1: Buat halaman login**

Buat `app/admin/login/page.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await signIn('credentials', {
        email: fd.get('email') as string,
        password: fd.get('password') as string,
        redirect: false,
      })

      if (result?.error) {
        setError('Email atau password salah.')
        return
      }

      router.push('/admin')
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-[#0D3320] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="font-serif text-2xl font-bold text-white">
            Beyond<span className="text-[#C8962A]">Qurban</span>
          </p>
          <p className="text-white/50 text-sm mt-1">Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h1 className="font-serif text-xl font-bold text-[#0D1F17] mb-6">Masuk ke Dashboard</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
                placeholder="admin@beyondqurban.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 rounded-xl bg-[#1B5E3B] text-white font-semibold hover:bg-[#0D3320] disabled:opacity-60 transition-colors"
            >
              {isPending ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test login**

```bash
npm run dev
```

Buka `http://localhost:3000/admin/login`. Login dengan `admin@beyondqurban.com` / `admin123` — harus redirect ke `/admin`. Login dengan password salah → muncul pesan error.

- [ ] **Step 3: Commit**

```bash
git add app/admin/login/
git commit -m "feat: add admin login page with NextAuth credentials"
```

---

### Task 14: Admin Shared Components

**Files:**
- Create: `components/admin/Sidebar.tsx`
- Create: `components/admin/BottomNav.tsx`
- Create: `components/admin/OrderStatusBadge.tsx`
- Create: `components/admin/StatCard.tsx`

- [ ] **Step 1: Buat Sidebar**

Buat `components/admin/Sidebar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/produk', label: 'Produk', icon: Package, exact: false },
  { href: '/admin/pesanan', label: 'Pesanan', icon: ClipboardList, exact: false },
  { href: '/admin/pembeli', label: 'Pembeli', icon: Users, exact: false },
  { href: '/admin/pengaturan', label: 'Pengaturan', icon: Settings, exact: false },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-[#0D3320] text-white fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <p className="font-serif text-lg font-bold">
          Beyond<span className="text-[#C8962A]">Qurban</span>
        </p>
        <p className="text-white/40 text-xs mt-0.5">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#1B5E3B] text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 w-full transition-colors"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Buat BottomNav (mobile)**

Buat `components/admin/BottomNav.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ClipboardList, Users, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/produk', label: 'Produk', icon: Package, exact: false },
  { href: '/admin/pesanan', label: 'Pesanan', icon: ClipboardList, exact: false },
  { href: '/admin/pembeli', label: 'Pembeli', icon: Users, exact: false },
  { href: '/admin/pengaturan', label: 'Settings', icon: Settings, exact: false },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D3320] border-t border-white/10 flex">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-[#C8962A]' : 'text-white/50'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 3: Buat OrderStatusBadge**

Buat `components/admin/OrderStatusBadge.tsx`:

```tsx
import { OrderStatus, PaymentStatus } from '@prisma/client'

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  PENDING:   { label: 'Pending',      className: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Dikonfirmasi', className: 'bg-blue-100 text-blue-800' },
  PREPARING: { label: 'Disiapkan',    className: 'bg-purple-100 text-purple-800' },
  SHIPPED:   { label: 'Dikirim',      className: 'bg-orange-100 text-orange-800' },
  DELIVERED: { label: 'Terkirim',     className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Dibatalkan',   className: 'bg-red-100 text-red-800' },
}

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  UNPAID:   { label: 'Belum Bayar', className: 'bg-red-100 text-red-700' },
  PAID:     { label: 'Lunas',       className: 'bg-green-100 text-green-700' },
  EXPIRED:  { label: 'Kadaluarsa', className: 'bg-gray-100 text-gray-600' },
  REFUNDED: { label: 'Dikembalikan', className: 'bg-blue-100 text-blue-700' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = ORDER_STATUS_CONFIG[status]
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = PAYMENT_STATUS_CONFIG[status]
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}
```

- [ ] **Step 4: Buat StatCard**

Buat `components/admin/StatCard.tsx`:

```tsx
import { LucideIcon } from 'lucide-react'

type Props = {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'green' | 'gold' | 'blue' | 'red'
}

const COLOR_MAP = {
  green: 'bg-[#1B5E3B]/10 text-[#1B5E3B]',
  gold:  'bg-[#C8962A]/10 text-[#C8962A]',
  blue:  'bg-blue-100 text-blue-700',
  red:   'bg-red-100 text-red-700',
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'green' }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-[#6B7280]">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${COLOR_MAP[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="font-serif text-3xl font-bold text-[#0D1F17]">{value}</p>
      {subtitle && <p className="text-xs text-[#6B7280] mt-1">{subtitle}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/admin/
git commit -m "feat: add admin shared components — Sidebar, BottomNav, badges, StatCard"
```

---

### Task 15: Admin Layout

**Files:**
- Create: `app/admin/layout.tsx`

- [ ] **Step 1: Buat admin layout**

Buat `app/admin/layout.tsx`:

```tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/admin/Sidebar'
import BottomNav from '@/components/admin/BottomNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      {/* Main content — offset sidebar on desktop */}
      <div className="md:pl-64 pb-16 md:pb-0">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 2: Pastikan login redirect berjalan**

Buka `http://localhost:3000/admin` tanpa login → harus redirect ke `/admin/login`. Login → harus masuk dan sidebar terlihat.

- [ ] **Step 3: Commit**

```bash
git add app/admin/layout.tsx
git commit -m "feat: add admin layout with sidebar and bottom nav"
```

---

### Task 16: Admin Dashboard

**Files:**
- Create: `app/admin/page.tsx`
- Create: `components/admin/OrdersChart.tsx`

- [ ] **Step 1: Buat chart component (Client Component)**

Buat `components/admin/OrdersChart.tsx`:

```tsx
'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type DataPoint = { date: string; pesanan: number }

export default function OrdersChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
        <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          formatter={(value: number) => [`${value} pesanan`, 'Pesanan']}
        />
        <Area
          type="monotone"
          dataKey="pesanan"
          stroke="#1B5E3B"
          fill="#1B5E3B"
          fillOpacity={0.1}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Buat Dashboard page**

Buat `app/admin/page.tsx`:

```tsx
import { prisma } from '@/lib/prisma'
import StatCard from '@/components/admin/StatCard'
import OrdersChart from '@/components/admin/OrdersChart'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import Link from 'next/link'
import { ShoppingCart, Clock, Package, Truck } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { id } from 'date-fns/locale'

async function getDashboardData() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    todayOrders,
    pendingPayment,
    activeProducts,
    deliveredOrders,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { paymentStatus: 'UNPAID', status: { not: 'CANCELLED' } } }),
    prisma.product.count({ where: { status: 'ACTIVE', stock: { gt: 0 } } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true } } },
    }),
  ])

  // Chart data — 7 hari terakhir
  const chartData = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      return prisma.order.count({ where: { createdAt: { gte: start, lte: end } } }).then((count) => ({
        date: format(date, 'dd/MM', { locale: id }),
        pesanan: count,
      }))
    })
  )

  return { todayOrders, pendingPayment, activeProducts, deliveredOrders, recentOrders, chartData }
}

export default async function AdminDashboardPage() {
  const { todayOrders, pendingPayment, activeProducts, deliveredOrders, recentOrders, chartData } =
    await getDashboardData()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-[#0D1F17]">Dashboard</h1>
        <p className="text-sm text-[#6B7280] mt-1">Selamat datang kembali</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Pesanan Hari Ini" value={todayOrders} icon={ShoppingCart} color="green" />
        <StatCard title="Menunggu Bayar" value={pendingPayment} icon={Clock} color="red" />
        <StatCard title="Produk Tersedia" value={activeProducts} icon={Package} color="gold" />
        <StatCard title="Terkirim" value={deliveredOrders} icon={Truck} color="blue" />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
        <h2 className="font-serif font-bold text-[#0D1F17] text-lg mb-6">Pesanan 7 Hari Terakhir</h2>
        <OrdersChart data={chartData} />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-serif font-bold text-[#0D1F17] text-lg">Pesanan Terbaru</h2>
          <Link href="/admin/pesanan" className="text-[#1B5E3B] text-sm font-medium hover:underline">
            Lihat Semua →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-[#6B7280] text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-3 font-medium">No. Order</th>
                <th className="text-left px-6 py-3 font-medium">Nama</th>
                <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Produk</th>
                <th className="text-left px-6 py-3 font-medium">Total</th>
                <th className="text-left px-6 py-3 font-medium">Bayar</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-[#1B5E3B] font-semibold">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 font-medium text-[#0D1F17]">{order.customerName}</td>
                  <td className="px-6 py-4 text-[#6B7280] hidden md:table-cell">
                    {order.product.name}
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#0D1F17]">
                    Rp {order.totalAmount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-6 py-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentOrders.length === 0 && (
            <div className="text-center py-12 text-[#6B7280] text-sm">Belum ada pesanan</div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex gap-3">
        <Link
          href="/admin/produk?action=new"
          className="px-5 py-2.5 rounded-xl bg-[#1B5E3B] text-white text-sm font-semibold hover:bg-[#0D3320] transition-colors"
        >
          + Tambah Produk
        </Link>
        <Link
          href="/admin/pesanan"
          className="px-5 py-2.5 rounded-xl border border-[#1B5E3B] text-[#1B5E3B] text-sm font-semibold hover:bg-[#1B5E3B]/5 transition-colors"
        >
          Lihat Pesanan
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Test di browser**

Buka `http://localhost:3000/admin` — harus tampil 4 stat cards, chart area (flat jika data kosong), dan tabel pesanan terbaru.

- [ ] **Step 4: Commit**

```bash
git add app/admin/page.tsx components/admin/OrdersChart.tsx
git commit -m "feat: add admin dashboard with stats, 7-day chart, recent orders"
```

---

### Task 17: File Upload Route + Admin Produk CRUD

**Files:**
- Create: `app/api/uploads/route.ts`
- Create: `app/admin/produk/page.tsx`
- Create: `app/admin/produk/ProductForm.tsx`

- [ ] **Step 1: Buat upload route handler**

Buat `app/api/uploads/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9.\-_]/gi, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: 'Tipe file tidak didukung. Gunakan JPEG, PNG, atau WebP.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Ukuran file maksimal 2MB.' }, { status: 400 })
  }

  const ext = extname(file.name) || '.jpg'
  const timestamp = Date.now()
  const filename = sanitizeFilename(`${timestamp}${ext}`)
  const uploadDir = join(process.cwd(), 'public', 'uploads')

  await mkdir(uploadDir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(join(uploadDir, filename), Buffer.from(bytes))

  return NextResponse.json({ url: `/uploads/${filename}` })
}
```

- [ ] **Step 2: Buat ProductForm (Client Component)**

Buat `app/admin/produk/ProductForm.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Product, ProductType, QurbanLocation, ProductStatus } from '@prisma/client'
import { createProduct, updateProduct } from '@/lib/actions/products'
import Image from 'next/image'
import { X, Upload } from 'lucide-react'

type Props = { product?: Product; onClose: () => void }

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/uploads', { method: 'POST', body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data.url as string
}

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: 'LOKAL', label: 'Lokal' },
  { value: 'ETAWA', label: 'Etawa' },
  { value: 'GARUT', label: 'Garut' },
  { value: 'BATUR', label: 'Batur' },
]

const QURBAN_LOCATIONS: { value: QurbanLocation; label: string }[] = [
  { value: 'INDONESIA', label: 'Indonesia' },
  { value: 'AFRICA', label: 'Afrika' },
  { value: 'PALESTINE', label: 'Palestina' },
]

export default function ProductForm({ product, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '')
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [qurbanLocation, setQurbanLocation] = useState<QurbanLocation>(product?.qurbanLocation ?? 'INDONESIA')

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, isMain: boolean) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      if (isMain) {
        setImageUrl(url)
      } else if (images.length < 5) {
        setImages((prev) => [...prev, url])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    const payload = {
      name: fd.get('name') as string,
      type: fd.get('type') as ProductType,
      weight: parseFloat(fd.get('weight') as string),
      price: parseInt(fd.get('price') as string, 10),
      stock: parseInt(fd.get('stock') as string, 10),
      description: fd.get('description') as string,
      imageUrl,
      images,
      badge: (fd.get('badge') as string) || null,
      qurbanLocation: fd.get('qurbanLocation') as QurbanLocation,
      allowHomeDelivery: fd.get('allowHomeDelivery') === 'true',
      status: fd.get('status') as ProductStatus,
    }

    startTransition(async () => {
      const result = product
        ? await updateProduct(product.id, payload)
        : await createProduct(payload)

      if ('error' in result && result.error) {
        setError(typeof result.error === 'string' ? result.error : 'Data tidak valid.')
        return
      }

      onClose()
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end">
      <div className="h-full w-full max-w-lg bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-serif font-bold text-[#0D1F17] text-lg">
            {product ? 'Edit Produk' : 'Tambah Produk'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Foto utama */}
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-2">Foto Utama *</label>
            <div className="relative">
              {imageUrl ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <Image src={imageUrl} alt="Foto utama" fill className="object-cover" sizes="500px" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1B5E3B] transition-colors">
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-[#6B7280]">Upload foto utama (max 2MB)</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleImageUpload(e, true)} />
                </label>
              )}
            </div>
          </div>

          {/* Galeri tambahan */}
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-2">Galeri ({images.length}/5)</label>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                  <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-[#1B5E3B]">
                  <Upload size={18} className="text-gray-400" />
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleImageUpload(e, false)} />
                </label>
              )}
            </div>
            {uploading && <p className="text-xs text-[#6B7280] mt-1">Mengupload...</p>}
          </div>

          {/* Field teks */}
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Nama Produk *</label>
            <input name="name" required defaultValue={product?.name} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Jenis *</label>
              <select name="type" required defaultValue={product?.type ?? 'LOKAL'} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] bg-white">
                {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Berat (kg) *</label>
              <input name="weight" required type="number" step="0.5" min="1" defaultValue={product?.weight} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Harga (Rp) *</label>
              <input name="price" required type="number" min="0" defaultValue={product?.price} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Stok *</label>
              <input name="stock" required type="number" min="0" defaultValue={product?.stock ?? 1} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Deskripsi *</label>
            <textarea name="description" required rows={4} defaultValue={product?.description} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Badge</label>
              <input name="badge" defaultValue={product?.badge ?? ''} placeholder="Best Seller / Premium" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Status</label>
              <select name="status" defaultValue={product?.status ?? 'ACTIVE'} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] bg-white">
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Lokasi Kurban *</label>
            <select
              name="qurbanLocation"
              value={qurbanLocation}
              onChange={(e) => setQurbanLocation(e.target.value as QurbanLocation)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] bg-white"
            >
              {QURBAN_LOCATIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          {qurbanLocation === 'INDONESIA' && (
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Metode Pengiriman</label>
              <select name="allowHomeDelivery" defaultValue={product?.allowHomeDelivery ? 'true' : 'false'} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] bg-white">
                <option value="true">Bisa Antar Rumah & Penyaluran</option>
                <option value="false">Penyaluran Saja</option>
              </select>
            </div>
          )}

          {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50">
              Batal
            </button>
            <button type="submit" disabled={isPending || uploading || !imageUrl} className="flex-1 py-3 rounded-xl bg-[#1B5E3B] text-white text-sm font-semibold hover:bg-[#0D3320] disabled:opacity-60 transition-colors">
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Buat Admin Produk page**

Buat `app/admin/produk/page.tsx`:

```tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Product } from '@prisma/client'
import { deleteProduct } from '@/lib/actions/products'
import ProductForm from './ProductForm'

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch('/api/admin/products')
  return res.json()
}
```

> **Catatan:** Halaman Admin Produk butuh API route untuk fetch data dari client. Buat `app/api/admin/products/route.ts`:

```ts
// app/api/admin/products/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(products)
}
```

Lanjutkan `app/admin/produk/page.tsx`:

```tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Product } from '@prisma/client'
import { deleteProduct } from '@/lib/actions/products'
import ProductForm from './ProductForm'

export default function AdminProdukPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(searchParams.get('action') === 'new')
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [isPending, startTransition] = useTransition()

  async function loadProducts() {
    setLoading(true)
    const res = await fetch('/api/admin/products')
    setProducts(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadProducts() }, [])

  function handleEdit(product: Product) {
    setEditProduct(product)
    setShowForm(true)
  }

  function handleClose() {
    setShowForm(false)
    setEditProduct(null)
    loadProducts()
  }

  function handleDelete(id: string) {
    if (!confirm('Hapus produk ini? Tindakan tidak bisa dibatalkan.')) return
    startTransition(async () => {
      await deleteProduct(id)
      loadProducts()
    })
  }

  const TYPE_LABEL: Record<string, string> = { LOKAL: 'Lokal', ETAWA: 'Etawa', GARUT: 'Garut', BATUR: 'Batur' }
  const LOCATION_LABEL: Record<string, string> = { INDONESIA: 'Indonesia', AFRICA: 'Afrika', PALESTINE: 'Palestina' }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0D1F17]">Produk</h1>
          <p className="text-sm text-[#6B7280] mt-1">{products.length} produk terdaftar</p>
        </div>
        <button
          onClick={() => { setEditProduct(null); setShowForm(true) }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B5E3B] text-white text-sm font-semibold hover:bg-[#0D3320] transition-colors"
        >
          <Plus size={16} />
          Tambah Produk
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6B7280]">Memuat...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[#6B7280] text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-medium">Produk</th>
                  <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Jenis</th>
                  <th className="text-left px-6 py-3 font-medium hidden lg:table-cell">Lokasi</th>
                  <th className="text-right px-6 py-3 font-medium">Harga</th>
                  <th className="text-center px-6 py-3 font-medium">Stok</th>
                  <th className="text-center px-6 py-3 font-medium">Status</th>
                  <th className="text-right px-6 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="48px" />
                        </div>
                        <div>
                          <p className="font-medium text-[#0D1F17] leading-snug">{product.name}</p>
                          {product.badge && (
                            <span className="text-xs text-[#C8962A] font-semibold">{product.badge}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#6B7280] hidden md:table-cell">{TYPE_LABEL[product.type]}</td>
                    <td className="px-6 py-4 text-[#6B7280] hidden lg:table-cell">{LOCATION_LABEL[product.qurbanLocation]}</td>
                    <td className="px-6 py-4 text-right font-semibold text-[#0D1F17]">
                      Rp {product.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-semibold ${product.stock === 0 ? 'text-red-600' : 'text-[#0D1F17]'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        product.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {product.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="p-2 hover:bg-gray-100 rounded-lg text-[#6B7280] hover:text-[#1B5E3B] transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} disabled={isPending} className="p-2 hover:bg-red-50 rounded-lg text-[#6B7280] hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="text-center py-12 text-[#6B7280] text-sm">Belum ada produk</div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <ProductForm product={editProduct ?? undefined} onClose={handleClose} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Test CRUD produk**

Buka `http://localhost:3000/admin/produk`. Klik "Tambah Produk" → upload foto → isi form → simpan → produk muncul di tabel. Klik edit → form terbuka dengan data. Klik hapus → konfirmasi dialog.

- [ ] **Step 5: Commit**

```bash
git add app/api/uploads/ app/api/admin/ app/admin/produk/
git commit -m "feat: add admin produk CRUD with file upload (max 5 photos, 2MB, JPEG/PNG/WebP)"
```

---

### Task 18: Admin Pesanan

**Files:**
- Create: `app/admin/pesanan/page.tsx`
- Create: `app/api/admin/orders/route.ts`

- [ ] **Step 1: Buat orders API route**

Buat `app/api/admin/orders/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const status = url.searchParams.get('status') as OrderStatus | null

  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { name: true } } },
  })

  return NextResponse.json(orders)
}
```

- [ ] **Step 2: Buat halaman Admin Pesanan**

Buat `app/admin/pesanan/page.tsx`:

```tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import { OrderStatus } from '@prisma/client'
import { updateOrderStatus } from '@/lib/actions/orders'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import { Download, MessageCircle } from 'lucide-react'

type OrderWithProduct = {
  id: string
  orderNumber: string
  customerName: string
  phone: string
  whatsapp: string
  deliveryMethod: string
  qurbanLocation: string
  totalAmount: number
  paymentStatus: string
  status: OrderStatus
  createdAt: string
  product: { name: string }
  tripayPaymentUrl: string | null
}

const STATUS_TABS: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Dikonfirmasi' },
  { value: 'PREPARING', label: 'Disiapkan' },
  { value: 'SHIPPED', label: 'Dikirim' },
  { value: 'DELIVERED', label: 'Terkirim' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
]

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:   ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPED'],
  SHIPPED:   ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

const DELIVERY_LABEL: Record<string, string> = {
  ONE_UMMAH: 'Penyaluran',
  HOME_DELIVERY: 'Antar Rumah',
}

function exportCSV(orders: OrderWithProduct[]) {
  const headers = ['No Order', 'Nama', 'Produk', 'Metode', 'Total', 'Bayar', 'Status', 'Tanggal']
  const rows = orders.map((o) => [
    o.orderNumber,
    o.customerName,
    o.product.name,
    DELIVERY_LABEL[o.deliveryMethod] ?? o.deliveryMethod,
    o.totalAmount,
    o.paymentStatus,
    o.status,
    new Date(o.createdAt).toLocaleDateString('id-ID'),
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pesanan-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminPesananPage() {
  const [orders, setOrders] = useState<OrderWithProduct[]>([])
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  async function loadOrders(status: OrderStatus | 'ALL') {
    setLoading(true)
    const url = status === 'ALL' ? '/api/admin/orders' : `/api/admin/orders?status=${status}`
    const res = await fetch(url)
    setOrders(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadOrders(activeTab) }, [activeTab])

  function handleTabChange(tab: OrderStatus | 'ALL') {
    setActiveTab(tab)
  }

  function handleStatusUpdate(orderId: string, newStatus: OrderStatus) {
    if (!confirm(`Ubah status ke "${newStatus}"?`)) return
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus)
      loadOrders(activeTab)
    })
  }

  function handleWAManual(order: OrderWithProduct) {
    const msg = encodeURIComponent(
      `Halo ${order.customerName}, update terbaru pesanan Anda:\n\nNomor Pesanan: ${order.orderNumber}\nProduk: ${order.product.name}\nStatus: ${order.status}\n\nTerima kasih sudah memesan di Beyond Qurban 🐑`
    )
    window.open(`https://wa.me/${order.whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0D1F17]">Pesanan</h1>
          <p className="text-sm text-[#6B7280] mt-1">{orders.length} pesanan</p>
        </div>
        <button
          onClick={() => exportCSV(orders)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-[#1B5E3B] text-white'
                : 'bg-white border border-gray-200 text-[#6B7280] hover:border-[#1B5E3B] hover:text-[#1B5E3B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabel */}
      {loading ? (
        <div className="text-center py-12 text-[#6B7280]">Memuat...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[#6B7280] text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-medium">No. Order</th>
                  <th className="text-left px-6 py-3 font-medium">Nama</th>
                  <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Produk</th>
                  <th className="text-left px-6 py-3 font-medium hidden lg:table-cell">Metode</th>
                  <th className="text-right px-6 py-3 font-medium">Total</th>
                  <th className="text-center px-6 py-3 font-medium">Bayar</th>
                  <th className="text-center px-6 py-3 font-medium">Status</th>
                  <th className="text-center px-6 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-[#1B5E3B] font-semibold">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#0D1F17]">{order.customerName}</p>
                      <p className="text-xs text-[#6B7280]">{order.whatsapp}</p>
                    </td>
                    <td className="px-6 py-4 text-[#6B7280] hidden md:table-cell">
                      {order.product.name}
                    </td>
                    <td className="px-6 py-4 text-[#6B7280] hidden lg:table-cell">
                      {DELIVERY_LABEL[order.deliveryMethod] ?? order.deliveryMethod}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-[#0D1F17]">
                      Rp {order.totalAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <PaymentStatusBadge status={order.paymentStatus as any} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {/* Update status */}
                        {STATUS_TRANSITIONS[order.status].length > 0 && (
                          <select
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                            value=""
                            disabled={isPending}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B5E3B]"
                          >
                            <option value="" disabled>Update</option>
                            {STATUS_TRANSITIONS[order.status].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                        {/* WA manual */}
                        <button
                          onClick={() => handleWAManual(order)}
                          className="p-1.5 hover:bg-green-50 rounded-lg text-[#6B7280] hover:text-green-600 transition-colors"
                          title="Kirim WA manual"
                        >
                          <MessageCircle size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="text-center py-12 text-[#6B7280] text-sm">Tidak ada pesanan</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Test halaman pesanan**

Buka `http://localhost:3000/admin/pesanan`. Tab filter harus berfungsi. Klik "Export CSV" → file terunduh. Klik tombol update status → pilih status baru → konfirmasi.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/orders/ app/admin/pesanan/
git commit -m "feat: add admin pesanan with status tabs, update status, WA manual, CSV export"
```

---

### Task 19: Admin Pembeli

**Files:**
- Create: `app/admin/pembeli/page.tsx`

- [ ] **Step 1: Buat halaman Pembeli (Server Component)**

Buat `app/admin/pembeli/page.tsx`:

```tsx
import { prisma } from '@/lib/prisma'

async function getCustomersWithStats() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const stats = await Promise.all(
    customers.map(async (c) => {
      const orders = await prisma.order.findMany({
        where: { phone: c.phone },
        select: { totalAmount: true, status: true },
      })
      const totalBelanja = orders.reduce((sum, o) => sum + o.totalAmount, 0)
      return { ...c, jumlahPesanan: orders.length, totalBelanja }
    })
  )

  return stats
}

export default async function AdminPembeliPage() {
  const customers = await getCustomersWithStats()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-[#0D1F17]">Pembeli</h1>
        <p className="text-sm text-[#6B7280] mt-1">{customers.length} pembeli terdaftar</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-[#6B7280] text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-3 font-medium">Nama</th>
                <th className="text-left px-6 py-3 font-medium hidden md:table-cell">WhatsApp</th>
                <th className="text-left px-6 py-3 font-medium hidden lg:table-cell">Kota</th>
                <th className="text-center px-6 py-3 font-medium">Pesanan</th>
                <th className="text-right px-6 py-3 font-medium">Total Belanja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-[#0D1F17]">{c.name}</td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <a
                      href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1B5E3B] hover:underline"
                    >
                      {c.whatsapp}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-[#6B7280] hidden lg:table-cell">{c.city || '-'}</td>
                  <td className="px-6 py-4 text-center font-semibold text-[#0D1F17]">
                    {c.jumlahPesanan}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-[#1B5E3B]">
                    Rp {c.totalBelanja.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && (
            <div className="text-center py-12 text-[#6B7280] text-sm">Belum ada pembeli</div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/pembeli/
git commit -m "feat: add admin pembeli page with purchase stats"
```

---

### Task 20: Admin Pengaturan (4 Tab)

**Files:**
- Create: `app/admin/pengaturan/page.tsx`
- Create: `app/admin/pengaturan/SettingsForm.tsx`

- [ ] **Step 1: Buat SettingsForm (Client Component)**

Buat `app/admin/pengaturan/SettingsForm.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { updateSettings } from '@/lib/actions/settings'

type Props = { settings: Record<string, string> }

const TABS = ['Tripay', 'OneSender', 'Pixel & Tracking', 'Info Toko'] as const
type Tab = typeof TABS[number]

const NOTIF_EVENTS = [
  { key: 'notif_order_customer',   label: 'Order masuk — Customer' },
  { key: 'notif_order_admin',      label: 'Order masuk — Admin' },
  { key: 'notif_payment_customer', label: 'Pembayaran diterima — Customer' },
  { key: 'notif_payment_admin',    label: 'Pembayaran diterima — Admin' },
  { key: 'notif_status_customer',  label: 'Update status — Customer' },
  { key: 'notif_shipping_customer',label: 'Pengiriman — Customer' },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#1B5E3B]' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  )
}

export default function SettingsForm({ settings: initial }: Props) {
  const [tab, setTab] = useState<Tab>('Tripay')
  const [settings, setSettings] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function toggle(key: string) {
    set(key, settings[key] === 'true' ? 'false' : 'true')
  }

  async function handleSave() {
    startTransition(async () => {
      await updateSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div>
      {/* Tab header */}
      <div className="flex overflow-x-auto gap-1 border-b border-gray-200 mb-8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-[#1B5E3B] text-[#1B5E3B]'
                : 'border-transparent text-[#6B7280] hover:text-[#0D1F17]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tripay */}
      {tab === 'Tripay' && (
        <div className="space-y-5 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">API Key</label>
            <input value={settings.tripay_api_key ?? ''} onChange={(e) => set('tripay_api_key', e.target.value)} type="password" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" placeholder="T-..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Private Key</label>
            <input value={settings.tripay_private_key ?? ''} onChange={(e) => set('tripay_private_key', e.target.value)} type="password" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Merchant Code</label>
            <input value={settings.tripay_merchant_code ?? ''} onChange={(e) => set('tripay_merchant_code', e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Mode</label>
            <select value={settings.tripay_mode ?? 'sandbox'} onChange={(e) => set('tripay_mode', e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]">
              <option value="sandbox">Sandbox (Testing)</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Callback URL (read-only)</label>
            <input readOnly value={`${appUrl}/api/tripay/callback`} className="w-full border border-gray-100 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-[#6B7280] select-all" />
          </div>
        </div>
      )}

      {/* OneSender */}
      {tab === 'OneSender' && (
        <div className="space-y-6 max-w-lg">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">API Key</label>
              <input value={settings.onesender_api_key ?? ''} onChange={(e) => set('onesender_api_key', e.target.value)} type="password" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Nomor Pengirim (format 628xxx)</label>
              <input value={settings.onesender_sender_number ?? ''} onChange={(e) => set('onesender_sender_number', e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" placeholder="6281234567890" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0D1F17] mb-3">Toggle Notifikasi</p>
            <div className="space-y-3">
              {NOTIF_EVENTS.map((ev) => (
                <div key={ev.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-[#6B7280]">{ev.label}</span>
                  <Toggle checked={settings[ev.key] === 'true'} onChange={() => toggle(ev.key)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pixel & Tracking */}
      {tab === 'Pixel & Tracking' && (
        <div className="space-y-8 max-w-lg">
          {/* Facebook */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#0D1F17]">Facebook Pixel</p>
              <Toggle checked={settings.fb_pixel_enabled === 'true'} onChange={() => toggle('fb_pixel_enabled')} />
            </div>
            <input value={settings.fb_pixel_id ?? ''} onChange={(e) => set('fb_pixel_id', e.target.value)} placeholder="Pixel ID" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
          </div>

          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#0D1F17]">Meta CAPI (Server-side)</p>
              <Toggle checked={settings.fb_capi_enabled === 'true'} onChange={() => toggle('fb_capi_enabled')} />
            </div>
            <input value={settings.fb_capi_token ?? ''} onChange={(e) => set('fb_capi_token', e.target.value)} type="password" placeholder="Access Token" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Test Event Code (kosongkan untuk production)</label>
              <input value={settings.fb_capi_test_event_code ?? ''} onChange={(e) => set('fb_capi_test_event_code', e.target.value)} placeholder="TEST12345" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0D1F17] mb-2">CAPI Purchase Trigger</label>
              {[
                { value: 'payment_page', label: 'Halaman Pembayaran' },
                { value: 'tripay_callback', label: 'Konfirmasi Tripay' },
                { value: 'both', label: 'Keduanya' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 py-1.5 cursor-pointer">
                  <input type="radio" name="capi_trigger" value={opt.value} checked={settings.fb_capi_purchase_trigger === opt.value} onChange={() => set('fb_capi_purchase_trigger', opt.value)} className="accent-[#1B5E3B]" />
                  <span className="text-sm text-[#6B7280]">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* TikTok */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#0D1F17]">TikTok Pixel</p>
              <Toggle checked={settings.tiktok_pixel_enabled === 'true'} onChange={() => toggle('tiktok_pixel_enabled')} />
            </div>
            <input value={settings.tiktok_pixel_id ?? ''} onChange={(e) => set('tiktok_pixel_id', e.target.value)} placeholder="TikTok Pixel ID" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
          </div>

          {/* GTM */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#0D1F17]">Google Tag Manager</p>
              <Toggle checked={settings.gtm_enabled === 'true'} onChange={() => toggle('gtm_enabled')} />
            </div>
            <input value={settings.gtm_container_id ?? ''} onChange={(e) => set('gtm_container_id', e.target.value)} placeholder="GTM-XXXXXXX" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
          </div>
        </div>
      )}

      {/* Info Toko */}
      {tab === 'Info Toko' && (
        <div className="space-y-5 max-w-lg">
          {[
            { key: 'store_name', label: 'Nama Toko', type: 'text' },
            { key: 'store_whatsapp', label: 'WhatsApp CS (format 628xxx)', type: 'text' },
            { key: 'admin_whatsapp', label: 'WhatsApp Admin (format 628xxx)', type: 'text' },
            { key: 'store_email', label: 'Email', type: 'email' },
            { key: 'store_address', label: 'Alamat', type: 'text' },
            { key: 'store_hours', label: 'Jam Operasional', type: 'text' },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">{field.label}</label>
              <input
                type={field.type}
                value={settings[field.key] ?? ''}
                onChange={(e) => set(field.key, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
              />
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-3 rounded-xl bg-[#1B5E3B] text-white font-semibold text-sm hover:bg-[#0D3320] disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">✅ Tersimpan!</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Buat halaman Pengaturan (Server Component)**

Buat `app/admin/pengaturan/page.tsx`:

```tsx
import { getSettings } from '@/lib/actions/settings'
import SettingsForm from './SettingsForm'

export default async function AdminPengaturanPage() {
  const settings = await getSettings()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-[#0D1F17]">Pengaturan</h1>
        <p className="text-sm text-[#6B7280] mt-1">Kelola integrasi, notifikasi, dan info toko</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Test semua tab settings**

Buka `http://localhost:3000/admin/pengaturan`. Klik tiap tab — Tripay, OneSender, Pixel, Info Toko. Edit nilai → klik "Simpan" → muncul "✅ Tersimpan!". Refresh halaman → nilai tetap tersimpan.

- [ ] **Step 4: Commit**

```bash
git add app/admin/pengaturan/
git commit -m "feat: add admin pengaturan with Tripay, OneSender, Pixel, Info Toko tabs"
```

---

**(End of Part 3 — Admin)**

---
## PART 4: INTEGRATIONS

---

### Task 21: Tripay Integration

**Files:**
- Create: `lib/tripay.ts`
- Modify: `lib/actions/orders.ts` — sambungkan ke Tripay setelah order dibuat
- Create: `app/api/tripay/callback/route.ts`

- [ ] **Step 1: Buat Tripay wrapper**

Buat `lib/tripay.ts`:

```ts
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

type TripayMode = 'sandbox' | 'production'

function getBaseUrl(mode: TripayMode): string {
  return mode === 'production'
    ? 'https://tripay.co.id/api'
    : 'https://tripay.co.id/api-sandbox'
}

type TripayConfig = {
  apiKey: string
  privateKey: string
  merchantCode: string
  mode: TripayMode
}

export async function getTripayConfig(): Promise<TripayConfig> {
  const rows = await prisma.settings.findMany({
    where: {
      key: { in: ['tripay_api_key', 'tripay_private_key', 'tripay_merchant_code', 'tripay_mode'] },
    },
  })
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return {
    apiKey: s.tripay_api_key ?? '',
    privateKey: s.tripay_private_key ?? '',
    merchantCode: s.tripay_merchant_code ?? '',
    mode: (s.tripay_mode ?? 'sandbox') as TripayMode,
  }
}

type CreateTransactionInput = {
  merchantRef: string      // orderNumber
  amount: number           // totalAmount
  customerName: string
  customerEmail: string    // gunakan nomor WA sebagai email placeholder
  customerPhone: string
  orderItems: { name: string; price: number; quantity: number }[]
  returnUrl: string
  expiredTime: number      // unix timestamp, +24 jam
}

type TripayTransactionResponse = {
  success: boolean
  data?: {
    reference: string
    payment_url: string
    expired_time: number
  }
  message?: string
}

export async function createTripayTransaction(
  input: CreateTransactionInput
): Promise<TripayTransactionResponse> {
  const config = await getTripayConfig()
  if (!config.apiKey || !config.privateKey || !config.merchantCode) {
    return { success: false, message: 'Konfigurasi Tripay belum lengkap.' }
  }

  // Signature: HMAC-SHA256(merchantCode + merchantRef + amount, privateKey)
  const signature = crypto
    .createHmac('sha256', config.privateKey)
    .update(`${config.merchantCode}${input.merchantRef}${input.amount}`)
    .digest('hex')

  const payload = {
    method: 'QRIS',               // default QRIS; bisa diubah di form checkout nanti
    merchant_ref: input.merchantRef,
    amount: input.amount,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    order_items: input.orderItems,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/tripay/callback`,
    return_url: input.returnUrl,
    expired_time: input.expiredTime,
    signature,
  }

  const res = await fetch(`${getBaseUrl(config.mode)}/transaction/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const json = await res.json() as TripayTransactionResponse
  return json
}

export function verifyTripayCallback(
  privateKey: string,
  rawBody: string,
  signatureHeader: string
): boolean {
  const expected = crypto
    .createHmac('sha256', privateKey)
    .update(rawBody)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))
}
```

- [ ] **Step 2: Sambungkan Tripay ke createOrder**

Edit `lib/actions/orders.ts` — tambahkan blok Tripay setelah order berhasil dibuat. Ganti bagian `return { success: true, order }` di akhir try block:

```ts
// (di dalam try block createOrder, setelah prisma.order.create dan prisma.customer.upsert)

// Buat transaksi Tripay
const expiredTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60 // +24 jam

const tripayResult = await createTripayTransaction({
  merchantRef: order.orderNumber,
  amount: order.totalAmount,
  customerName: data.customerName,
  customerEmail: `${data.whatsapp}@wa.beyond-qurban.id`,
  customerPhone: data.phone,
  orderItems: [
    {
      name: product.name,
      price: product.price,
      quantity: data.quantity,
    },
  ],
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/lacak?order=${order.orderNumber}`,
  expiredTime,
})

if (tripayResult.success && tripayResult.data) {
  await prisma.order.update({
    where: { id: order.id },
    data: {
      tripayReference: tripayResult.data.reference,
      tripayPaymentUrl: tripayResult.data.payment_url,
    },
  })
  revalidatePath('/admin/pesanan')
  return {
    success: true,
    order: {
      ...order,
      tripayPaymentUrl: tripayResult.data.payment_url,
      orderNumber: order.orderNumber,
    },
  }
}

// Tripay gagal — tetap kembalikan order, payment URL bisa dicek di halaman lacak
return { success: true, order }
```

Tambahkan import di atas file `lib/actions/orders.ts`:

```ts
import { createTripayTransaction } from '@/lib/tripay'
```

- [ ] **Step 3: Update OrderForm redirect ke payment URL**

Edit `components/public/OrderForm.tsx` — ganti baris router.push di dalam handleSubmit:

```tsx
if ('success' in result && result.success && result.order) {
  if (result.order.tripayPaymentUrl) {
    // Redirect langsung ke halaman pembayaran Tripay
    window.location.href = result.order.tripayPaymentUrl
  } else {
    // Fallback ke lacak jika Tripay tidak terkonfigurasi
    router.push(`/lacak?order=${result.order.orderNumber}`)
  }
}
```

- [ ] **Step 4: Buat Tripay webhook handler**

Buat `app/api/tripay/callback/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTripayCallback } from '@/lib/tripay'
import { sendOrderNotification } from '@/lib/onesender'
import { sendFbCapiEvent } from '@/lib/facebook-capi'

type TripayCallbackPayload = {
  reference: string
  merchant_ref: string     // orderNumber
  payment_method: string
  total_amount: number
  is_closed_payment: number
  status: 'PAID' | 'UNPAID' | 'EXPIRED' | 'REFUNDED'
}

export async function POST(req: NextRequest) {
  const signatureHeader = req.headers.get('X-Callback-Signature') ?? ''
  const rawBody = await req.text()

  // Ambil private key dari DB
  const row = await prisma.settings.findUnique({ where: { key: 'tripay_private_key' } })
  const privateKey = row?.value ?? ''

  if (!privateKey || !verifyTripayCallback(privateKey, rawBody, signatureHeader)) {
    return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 })
  }

  let payload: TripayCallbackPayload
  try {
    payload = JSON.parse(rawBody) as TripayCallbackPayload
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: payload.merchant_ref },
    include: { product: true },
  })

  if (!order) {
    return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
  }

  // Update payment status
  if (payload.status === 'PAID') {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: payload.payment_method,
        status: 'CONFIRMED',
        tripayReference: payload.reference,
      },
    })

    // Notifikasi WA
    await sendOrderNotification('payment_confirmed_customer', {
      customerName: order.customerName,
      whatsapp: order.whatsapp,
      orderNumber: order.orderNumber,
      productName: order.product.name,
      totalAmount: order.totalAmount,
    })
    await sendOrderNotification('payment_confirmed_admin', {
      customerName: order.customerName,
      whatsapp: order.whatsapp,
      orderNumber: order.orderNumber,
      productName: order.product.name,
      totalAmount: order.totalAmount,
    })

    // Facebook CAPI Purchase — jika trigger = tripay_callback atau both
    const capiTrigger = await prisma.settings
      .findUnique({ where: { key: 'fb_capi_purchase_trigger' } })
      .then((r) => r?.value ?? 'tripay_callback')

    if (capiTrigger === 'tripay_callback' || capiTrigger === 'both') {
      await sendFbCapiEvent('Purchase', {
        phone: order.phone,
        customerName: order.customerName,
        value: order.totalAmount,
        contentIds: [order.productId],
      })
    }
  } else if (payload.status === 'EXPIRED') {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'EXPIRED' },
    })
  } else if (payload.status === 'REFUNDED') {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'REFUNDED', status: 'CANCELLED' },
    })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 5: Test Tripay sandbox**

1. Isi API Key, Private Key, Merchant Code di `/admin/pengaturan` → tab Tripay → Mode: Sandbox.
2. Buat pesanan dari halaman detail produk.
3. Harus redirect ke halaman pembayaran Tripay sandbox.
4. Simulasikan pembayaran dari Tripay dashboard sandbox.
5. Cek di `/admin/pesanan` → status harus berubah ke "Dikonfirmasi".

- [ ] **Step 6: Commit**

```bash
git add lib/tripay.ts lib/actions/orders.ts app/api/tripay/
git commit -m "feat: add Tripay integration — transaction creation, HMAC webhook verification, order status update"
```

---

### Task 22: OneSender WhatsApp Integration

**Files:**
- Create: `lib/onesender.ts`

- [ ] **Step 1: Buat OneSender wrapper**

Buat `lib/onesender.ts`:

```ts
import { prisma } from '@/lib/prisma'

type NotifEvent =
  | 'order_created_customer'
  | 'order_created_admin'
  | 'payment_confirmed_customer'
  | 'payment_confirmed_admin'
  | 'status_updated_customer'
  | 'shipping_customer'
  | 'manual'

type NotifPayload = {
  customerName: string
  whatsapp: string
  orderNumber: string
  productName: string
  totalAmount: number
  status?: string
  paymentUrl?: string
  adminWhatsapp?: string
}

const EVENT_TOGGLE_KEY: Record<NotifEvent, string | null> = {
  order_created_customer:    'notif_order_customer',
  order_created_admin:       'notif_order_admin',
  payment_confirmed_customer:'notif_payment_customer',
  payment_confirmed_admin:   'notif_payment_admin',
  status_updated_customer:   'notif_status_customer',
  shipping_customer:         'notif_shipping_customer',
  manual:                    null, // selalu kirim
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function buildMessage(event: NotifEvent, payload: NotifPayload): string {
  const { customerName, orderNumber, productName, totalAmount, status, paymentUrl } = payload

  switch (event) {
    case 'order_created_customer':
      return [
        `Assalamualaikum ${customerName} 👋`,
        ``,
        `Pesanan Anda telah kami terima! 🐑`,
        ``,
        `📋 *Detail Pesanan:*`,
        `No. Pesanan: ${orderNumber}`,
        `Produk: ${productName}`,
        `Total: ${formatRupiah(totalAmount)}`,
        ``,
        paymentUrl ? `💳 Silakan lakukan pembayaran:\n${paymentUrl}` : '',
        ``,
        `Hubungi kami jika ada pertanyaan. Jazakallahu khairan 🙏`,
      ].filter(Boolean).join('\n')

    case 'order_created_admin':
      return [
        `🔔 *Pesanan Baru Masuk!*`,
        ``,
        `No. Pesanan: ${orderNumber}`,
        `Nama Pembeli: ${customerName}`,
        `Produk: ${productName}`,
        `Total: ${formatRupiah(totalAmount)}`,
        ``,
        `Segera proses dan konfirmasi pesanan ini.`,
      ].join('\n')

    case 'payment_confirmed_customer':
      return [
        `Alhamdulillah, ${customerName}! 🎉`,
        ``,
        `Pembayaran Anda untuk pesanan *${orderNumber}* telah kami terima.`,
        `Produk: ${productName}`,
        `Total: ${formatRupiah(totalAmount)}`,
        ``,
        `Kami akan segera memproses kurban Anda. Semoga berkah! 🐑🌙`,
      ].join('\n')

    case 'payment_confirmed_admin':
      return [
        `✅ *Pembayaran Diterima!*`,
        ``,
        `No. Pesanan: ${orderNumber}`,
        `Nama: ${customerName}`,
        `Produk: ${productName}`,
        `Total: ${formatRupiah(totalAmount)}`,
        ``,
        `Mohon segera proses pesanan ini.`,
      ].join('\n')

    case 'status_updated_customer':
      return [
        `Update pesanan Anda, ${customerName}:`,
        ``,
        `No. Pesanan: ${orderNumber}`,
        `Produk: ${productName}`,
        `Status terbaru: *${status ?? '-'}*`,
        ``,
        `Terima kasih sudah memesan di Beyond Qurban 🐑`,
      ].join('\n')

    case 'shipping_customer':
      return [
        `📦 *Pesanan Sedang Dikirim!*`,
        ``,
        `Halo ${customerName},`,
        `Daging kurban Anda (${productName}) sedang dalam perjalanan.`,
        `No. Pesanan: ${orderNumber}`,
        ``,
        `Mohon pastikan ada yang menerima di alamat tujuan 🙏`,
      ].join('\n')

    case 'manual':
      return [
        `Halo ${customerName},`,
        ``,
        `Update pesanan *${orderNumber}*:`,
        `Produk: ${productName}`,
        `Status: ${status ?? '-'}`,
        ``,
        `Terima kasih sudah mempercayai Beyond Qurban 🐑`,
      ].join('\n')
  }
}

async function getOneSenderConfig() {
  const rows = await prisma.settings.findMany({
    where: { key: { in: ['onesender_api_key', 'onesender_sender_number', 'admin_whatsapp'] } },
  })
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

async function isToggleEnabled(toggleKey: string | null): Promise<boolean> {
  if (toggleKey === null) return true
  const row = await prisma.settings.findUnique({ where: { key: toggleKey } })
  return row?.value === 'true'
}

async function sendWA(to: string, message: string): Promise<void> {
  const config = await getOneSenderConfig()
  if (!config.onesender_api_key || !config.onesender_sender_number) return

  const phone = to.replace(/\D/g, '')

  await fetch('https://api.onesender.id/send', {
    method: 'POST',
    headers: {
      'Authorization': config.onesender_api_key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: config.onesender_sender_number,
      receiver: phone,
      message,
      type: 'text',
    }),
  }).catch(() => {
    // Log error tapi jangan throw — notifikasi WA tidak boleh gagalkan order
    console.error('[OneSender] Gagal kirim WA ke', phone)
  })
}

export async function sendOrderNotification(
  event: NotifEvent,
  payload: NotifPayload
): Promise<void> {
  const toggleKey = EVENT_TOGGLE_KEY[event]
  const enabled = await isToggleEnabled(toggleKey)
  if (!enabled) return

  const message = buildMessage(event, payload)

  // Tentukan penerima
  if (event === 'order_created_admin' || event === 'payment_confirmed_admin') {
    const config = await getOneSenderConfig()
    const adminWA = config.admin_whatsapp
    if (adminWA) await sendWA(adminWA, message)
  } else {
    await sendWA(payload.whatsapp, message)
  }
}
```

- [ ] **Step 2: Trigger notif order_created di createOrder**

Edit `lib/actions/orders.ts` — tambahkan notifikasi setelah order berhasil dibuat dan Tripay respond. Sisipkan setelah blok `prisma.customer.upsert`:

```ts
// Notifikasi WA — order masuk
await sendOrderNotification('order_created_customer', {
  customerName: data.customerName,
  whatsapp: data.whatsapp,
  orderNumber,
  productName: product.name,
  totalAmount,
  paymentUrl: undefined, // akan diisi setelah Tripay
})
await sendOrderNotification('order_created_admin', {
  customerName: data.customerName,
  whatsapp: data.whatsapp,
  orderNumber,
  productName: product.name,
  totalAmount,
})
```

Tambahkan import di atas:

```ts
import { sendOrderNotification } from '@/lib/onesender'
```

- [ ] **Step 3: Trigger notif status_updated di updateOrderStatus**

Edit `lib/actions/orders.ts` — ganti return di `updateOrderStatus`:

```ts
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { product: true },
    })

    // Notifikasi WA status update
    if (status === 'SHIPPED') {
      await sendOrderNotification('shipping_customer', {
        customerName: order.customerName,
        whatsapp: order.whatsapp,
        orderNumber: order.orderNumber,
        productName: order.product.name,
        totalAmount: order.totalAmount,
        status,
      })
    } else if (status !== 'CANCELLED') {
      await sendOrderNotification('status_updated_customer', {
        customerName: order.customerName,
        whatsapp: order.whatsapp,
        orderNumber: order.orderNumber,
        productName: order.product.name,
        totalAmount: order.totalAmount,
        status,
      })
    }

    revalidatePath('/admin/pesanan')
    return { success: true, order }
  } catch {
    return { error: 'Gagal update status pesanan.' }
  }
}
```

- [ ] **Step 4: Test OneSender**

1. Isi `onesender_api_key` dan `onesender_sender_number` di Pengaturan.
2. Buat pesanan baru → cek WA customer (order_created_customer) dan WA admin (order_created_admin) diterima.
3. Di `/admin/pesanan`, ubah status ke SHIPPED → cek WA customer shipping diterima.
4. Klik ikon WA manual → tab baru terbuka ke wa.me dengan pesan pre-filled.

- [ ] **Step 5: Commit**

```bash
git add lib/onesender.ts lib/actions/orders.ts
git commit -m "feat: add OneSender WA notifications — 7 events with toggle, order/payment/status/shipping templates"
```

---

### Task 23: Facebook CAPI Integration

**Files:**
- Create: `lib/facebook-capi.ts`
- Modify: `app/(public)/katalog/[slug]/page.tsx` — tambah ViewContent
- Modify: `lib/actions/orders.ts` — tambah InitiateCheckout
- Modify: `app/api/tripay/callback/route.ts` — Purchase sudah ada, pastikan benar

- [ ] **Step 1: Buat Facebook CAPI wrapper**

Buat `lib/facebook-capi.ts`:

```ts
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

type FbCapiEventName = 'ViewContent' | 'InitiateCheckout' | 'Purchase'

type FbCapiUserData = {
  phone?: string       // akan di-hash SHA256
  customerName?: string
  clientIpAddress?: string
  clientUserAgent?: string
}

type FbCapiCustomData = {
  value?: number
  currency?: string
  contentIds?: string[]
  contentType?: string
  contentName?: string
}

type FbCapiConfig = {
  pixelId: string
  accessToken: string
  testEventCode?: string
  enabled: boolean
}

async function getFbCapiConfig(): Promise<FbCapiConfig | null> {
  const rows = await prisma.settings.findMany({
    where: {
      key: {
        in: ['fb_capi_enabled', 'fb_pixel_id', 'fb_capi_token', 'fb_capi_test_event_code'],
      },
    },
  })
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  if (s.fb_capi_enabled !== 'true' || !s.fb_capi_token || !s.fb_pixel_id) return null

  return {
    pixelId: s.fb_pixel_id,
    accessToken: s.fb_capi_token,
    testEventCode: s.fb_capi_test_event_code || undefined,
    enabled: true,
  }
}

function hashSHA256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export async function sendFbCapiEvent(
  eventName: FbCapiEventName,
  options: {
    phone?: string
    customerName?: string
    value?: number
    contentIds?: string[]
    contentName?: string
    clientIpAddress?: string
    clientUserAgent?: string
  }
): Promise<void> {
  const config = await getFbCapiConfig()
  if (!config) return

  const eventTime = Math.floor(Date.now() / 1000)

  const userData: Record<string, string> = {}
  if (options.phone) {
    userData.ph = hashSHA256(options.phone.replace(/\D/g, ''))
  }
  if (options.customerName) {
    const [fn, ...rest] = options.customerName.split(' ')
    userData.fn = hashSHA256(fn ?? '')
    if (rest.length > 0) userData.ln = hashSHA256(rest.join(' '))
  }
  if (options.clientIpAddress) userData.client_ip_address = options.clientIpAddress
  if (options.clientUserAgent) userData.client_user_agent = options.clientUserAgent

  const customData: Record<string, unknown> = {
    currency: 'IDR',
    content_type: 'product',
  }
  if (options.value !== undefined) customData.value = options.value
  if (options.contentIds) customData.content_ids = options.contentIds
  if (options.contentName) customData.content_name = options.contentName

  const eventData: Record<string, unknown> = {
    event_name: eventName,
    event_time: eventTime,
    action_source: 'website',
    user_data: userData,
    custom_data: customData,
  }
  if (config.testEventCode) eventData.test_event_code = config.testEventCode

  const url = `https://graph.facebook.com/v19.0/${config.pixelId}/events?access_token=${config.accessToken}`

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [eventData] }),
  }).catch(() => {
    console.error('[FB CAPI] Gagal kirim event', eventName)
  })
}
```

- [ ] **Step 2: Tambah ViewContent di detail produk**

Edit `app/(public)/katalog/[slug]/page.tsx` — tambahkan import dan panggil di awal fungsi page:

```tsx
import { sendFbCapiEvent } from '@/lib/facebook-capi'

// Di dalam fungsi DetailProdukPage, setelah product ditemukan:
// (tanpa await, fire-and-forget — tidak boleh slow down SSR)
void sendFbCapiEvent('ViewContent', {
  contentIds: [product.id],
  contentName: product.name,
  value: product.price,
})
```

Sisipkan tepat setelah baris `if (!product || product.status === 'INACTIVE') notFound()`:

```tsx
// Fire-and-forget — ViewContent
void sendFbCapiEvent('ViewContent', {
  contentIds: [product.id],
  contentName: product.name,
  value: product.price,
})
```

- [ ] **Step 3: Tambah InitiateCheckout di createOrder**

Edit `lib/actions/orders.ts` — tambahkan setelah order berhasil dibuat, sebelum Tripay call:

```ts
// FB CAPI InitiateCheckout
void sendFbCapiEvent('InitiateCheckout', {
  phone: data.phone,
  customerName: data.customerName,
  value: totalAmount,
  contentIds: [data.productId],
  contentName: product.name,
})
```

Tambahkan import:

```ts
import { sendFbCapiEvent } from '@/lib/facebook-capi'
```

- [ ] **Step 4: Tambah Purchase trigger halaman pembayaran (opsional)**

Edit `components/public/OrderForm.tsx` — setelah redirect ke tripayPaymentUrl, tambahkan trigger jika setting = "payment_page" atau "both". Karena ini client-side, gunakan fetch ke endpoint ringan:

Buat `app/api/capi/purchase/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { sendFbCapiEvent } from '@/lib/facebook-capi'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { orderNumber } = await req.json() as { orderNumber: string }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { product: { select: { name: true } } },
  })
  if (!order) return NextResponse.json({ ok: false })

  const triggerRow = await prisma.settings.findUnique({
    where: { key: 'fb_capi_purchase_trigger' },
  })
  const trigger = triggerRow?.value ?? 'tripay_callback'

  if (trigger === 'payment_page' || trigger === 'both') {
    await sendFbCapiEvent('Purchase', {
      phone: order.phone,
      customerName: order.customerName,
      value: order.totalAmount,
      contentIds: [order.productId],
      contentName: order.product.name,
    })
  }

  return NextResponse.json({ ok: true })
}
```

Edit `components/public/OrderForm.tsx` — setelah `window.location.href = result.order.tripayPaymentUrl`:

```tsx
// Trigger Purchase CAPI untuk payment_page / both
fetch('/api/capi/purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderNumber: result.order.orderNumber }),
}).catch(() => {})

window.location.href = result.order.tripayPaymentUrl
```

- [ ] **Step 5: Test Facebook CAPI**

1. Isi `fb_pixel_id`, `fb_capi_token`, dan `fb_capi_test_event_code` di Pengaturan → tab Pixel & Tracking.
2. Buka halaman detail produk → cek **Facebook Events Manager > Test Events** → `ViewContent` harus muncul.
3. Submit form pesanan → `InitiateCheckout` harus muncul.
4. Simulasi pembayaran Tripay (sandbox) → `Purchase` harus muncul (sesuai trigger setting).

- [ ] **Step 6: Commit**

```bash
git add lib/facebook-capi.ts app/api/capi/ lib/actions/orders.ts app/\(public\)/katalog/\[slug\]/page.tsx
git commit -m "feat: add Facebook CAPI — ViewContent, InitiateCheckout, Purchase with SHA256 hashing and test event code"
```

---

**(End of Part 4 — Integrations)**

---
## PART 5: SECURITY & HARDENING

---

### Task 24: Rate Limiting Form Order

**Files:**
- Create: `lib/rate-limit.ts`
- Modify: `lib/actions/orders.ts` — panggil rate limiter di createOrder

Rate limiting tanpa Redis: gunakan in-memory Map dengan sliding window. Cukup untuk single-process VPS (tidak perlu multi-instance).

- [ ] **Step 1: Buat rate limiter**

Buat `lib/rate-limit.ts`:

```ts
type WindowEntry = { count: number; resetAt: number }

const store = new Map<string, WindowEntry>()

const WINDOW_MS = 60_000   // 1 menit
const MAX_REQUESTS = 5     // max 5 per IP per menit

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || now >= entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count += 1
  return { allowed: true, retryAfterMs: 0 }
}

// Bersihkan entri lama setiap 5 menit untuk cegah memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now >= entry.resetAt) store.delete(key)
  }
}, 5 * 60_000)
```

- [ ] **Step 2: Ambil IP dari header di createOrder**

Edit `lib/actions/orders.ts` — tambahkan import dan panggil di awal `createOrder`:

```ts
import { headers } from 'next/headers'
import { checkRateLimit } from '@/lib/rate-limit'

export async function createOrder(formData: unknown) {
  // Rate limiting — ambil IP dari header
  const headersList = headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'unknown'

  const { allowed, retryAfterMs } = checkRateLimit(`order:${ip}`)
  if (!allowed) {
    const seconds = Math.ceil(retryAfterMs / 1000)
    return { error: `Terlalu banyak percobaan. Coba lagi dalam ${seconds} detik.` }
  }

  // ... sisa kode existing
```

- [ ] **Step 3: Verifikasi rate limit berjalan**

```bash
npm run dev
```

Buka detail produk, submit form 6 kali dalam 1 menit → request ke-6 harus return error "Terlalu banyak percobaan."

- [ ] **Step 4: Commit**

```bash
git add lib/rate-limit.ts lib/actions/orders.ts
git commit -m "feat: add IP-based rate limiting to createOrder (5 req/min, in-memory sliding window)"
```

---

### Task 25: GTM + TikTok Pixel Script Injection

**Files:**
- Create: `components/public/AnalyticsScripts.tsx`
- Modify: `app/layout.tsx` — inject scripts

Pixel/GTM diambil dari Settings DB, di-render server-side di root layout.

- [ ] **Step 1: Buat AnalyticsScripts component**

Buat `components/public/AnalyticsScripts.tsx`:

```tsx
import Script from 'next/script'
import { prisma } from '@/lib/prisma'

async function getAnalyticsSettings() {
  const rows = await prisma.settings.findMany({
    where: {
      key: {
        in: [
          'fb_pixel_id', 'fb_pixel_enabled',
          'tiktok_pixel_id', 'tiktok_pixel_enabled',
          'gtm_container_id', 'gtm_enabled',
        ],
      },
    },
  })
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export default async function AnalyticsScripts() {
  const s = await getAnalyticsSettings()

  return (
    <>
      {/* Google Tag Manager */}
      {s.gtm_enabled === 'true' && s.gtm_container_id && (
        <>
          <Script id="gtm-head" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${s.gtm_container_id}');`}
          </Script>
          {/* GTM noscript dipasang di body — lihat step 2 */}
        </>
      )}

      {/* Facebook Pixel (client-side) */}
      {s.fb_pixel_enabled === 'true' && s.fb_pixel_id && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${s.fb_pixel_id}');fbq('track','PageView');`}
        </Script>
      )}

      {/* TikTok Pixel */}
      {s.tiktok_pixel_enabled === 'true' && s.tiktok_pixel_id && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._r=ttq._r||{},n&&(ttq._r[e]=n),ttq.load(e);var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${s.tiktok_pixel_id}');ttq.page()}(window,document,'ttq');`}
        </Script>
      )}
    </>
  )
}
```

- [ ] **Step 2: Pasang di root layout**

Edit `app/layout.tsx` — tambahkan import dan pasang `<AnalyticsScripts />` di dalam `<body>`:

```tsx
import AnalyticsScripts from '@/components/public/AnalyticsScripts'

// Di dalam return:
<html lang="id" className={`${playfair.variable} ${dmSans.variable}`}>
  <body className="font-sans antialiased">
    {children}
    <AnalyticsScripts />
  </body>
</html>
```

- [ ] **Step 3: Verifikasi script inject**

Aktifkan GTM di Pengaturan → isi container ID `GTM-TEST123`. Buka `http://localhost:3000` → buka DevTools → cek Network tab → harus ada request ke `googletagmanager.com`.

- [ ] **Step 4: Commit**

```bash
git add components/public/AnalyticsScripts.tsx app/layout.tsx
git commit -m "feat: add dynamic GTM, Facebook Pixel, TikTok Pixel injection from DB settings"
```

---

### Task 26: Production Build Check

**Files:**
- Modify: `next.config.ts` — finalisasi config
- Create: `.gitignore` — pastikan `.env` tidak ikut commit

- [ ] **Step 1: Pastikan .gitignore benar**

Cek `.gitignore` (sudah dibuat oleh create-next-app). Pastikan baris berikut ada:

```
.env
.env.local
.env.production
/public/uploads/
```

Tambahkan baris `/public/uploads/` jika belum ada, agar foto produk tidak masuk ke git:

```bash
echo "/public/uploads/" >> .gitignore
echo "!public/uploads/.gitkeep" >> .gitignore
```

Buat placeholder agar folder uploads dikenali git:

```bash
touch public/uploads/.gitkeep
```

- [ ] **Step 2: Pastikan semua environment variables terdokumentasi**

Verifikasi `.env.example` sudah mencakup semua variabel yang dipakai:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/beyond_qurban

# Auth
NEXTAUTH_SECRET=generate-dengan-openssl-rand-base64-32
NEXTAUTH_URL=https://yourdomain.com

# Tripay (konfigurasi utama via admin settings di DB)
# TRIPAY_MODE=sandbox  ← sudah di DB, tidak perlu di .env

# OneSender (konfigurasi utama via admin settings di DB)
# ONESENDER_API_KEY=   ← sudah di DB, tidak perlu di .env

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

- [ ] **Step 3: Jalankan TypeScript check**

```bash
npx tsc --noEmit
```

Expected: tidak ada error. Jika ada error, fix terlebih dahulu sebelum lanjut.

- [ ] **Step 4: Jalankan production build**

```bash
npm run build
```

Expected output:
```
✓ Compiled successfully
✓ Linting and checking validity of types
Route (app)                              Size
...
```

Jika ada error, baca pesan dan fix. Error umum:
- `useSearchParams()` di Server Component → pindah ke Client Component
- `window is not defined` di Server Component → tambahkan `'use client'` atau cek `typeof window !== 'undefined'`
- Dynamic server usage → tambahkan `export const dynamic = 'force-dynamic'` di page yang butuh

- [ ] **Step 5: Fix error build (jika ada)**

Jika ada halaman yang error karena `searchParams` atau dynamic:

```tsx
// Tambahkan di atas file page.tsx yang error:
export const dynamic = 'force-dynamic'
```

Halaman yang kemungkinan perlu ini:
- `app/(public)/lacak/page.tsx` — menggunakan `searchParams`
- `app/(public)/katalog/page.tsx` — menggunakan `searchParams`
- `app/admin/produk/page.tsx` — menggunakan `useSearchParams`

- [ ] **Step 6: Re-run build setelah fix**

```bash
npm run build
```

Expected: build berhasil tanpa error.

- [ ] **Step 7: Commit**

```bash
git add .gitignore public/uploads/.gitkeep next.config.ts
git commit -m "chore: add .gitignore for uploads, finalize next.config"
```

---

### Task 27: End-to-End Test Checklist

Tidak ada file baru. Ini adalah checklist manual sebelum deploy ke VPS.

- [ ] **Step 1: Test alur order lengkap (sandbox)**

Jalankan `npm run dev` dan ikuti alur:

```
1. Buka http://localhost:3000
   ✓ Homepage tampil — Hero, Stats, 4 Produk, Cara Pesan

2. Klik "Lihat Katalog"
   ✓ Tab Semua tampil semua produk
   ✓ Tab "Domba Lokal" filter produk INDONESIA + allowHomeDelivery=true
   ✓ Tab "Qurban Afrika" filter AFRICA
   ✓ Sort harga berfungsi

3. Klik salah satu produk
   ✓ Gallery foto tampil
   ✓ Specs grid tampil
   ✓ Form order tampil

4. Di form order:
   ✓ Isi nama, HP, WA
   ✓ Pilih "Antar ke Rumah" → field alamat muncul
   ✓ Pilih kota "Kota Bandung" → "✅ Gratis ongkir!" tampil
   ✓ Pilih "Lainnya" → "+Rp 150.000" tampil
   ✓ Isi tanggal Idul Adha → dropdown deliveryDate muncul
   ✓ Total di ringkasan berubah sesuai ongkir

5. Submit form
   ✓ Redirect ke halaman Tripay sandbox
   ✓ Order muncul di /admin/pesanan dengan status PENDING

6. Simulasi bayar di Tripay sandbox
   ✓ Webhook diterima (cek log server)
   ✓ Status order berubah ke CONFIRMED
   ✓ WA notifikasi payment_confirmed diterima

7. Buka /lacak → input nomor order
   ✓ Stepper menunjukkan status CONFIRMED
   ✓ Detail order tampil lengkap

8. Di /admin/pesanan → update status ke SHIPPED
   ✓ WA notifikasi shipping diterima oleh customer

9. Login admin: /admin/login
   ✓ Login berhasil, redirect ke /admin
   ✓ Logout → redirect ke /admin/login
   ✓ Akses /admin tanpa login → redirect ke /admin/login
```

- [ ] **Step 2: Test admin CRUD produk**

```
1. /admin/produk → klik "Tambah Produk"
   ✓ Form slide-over terbuka
   ✓ Upload foto utama → preview muncul
   ✓ Upload galeri (hingga 5 foto)
   ✓ Simpan → produk muncul di tabel dan di /katalog

2. Klik edit produk
   ✓ Form terbuka dengan data existing
   ✓ Edit harga → simpan → tabel terupdate

3. Klik hapus produk
   ✓ Dialog konfirmasi muncul
   ✓ Produk hilang dari tabel

4. Upload file > 2MB
   ✓ Error "Ukuran file maksimal 2MB" tampil

5. Upload file bukan gambar (misal .pdf)
   ✓ Error "Tipe file tidak didukung" tampil
```

- [ ] **Step 3: Test settings**

```
1. /admin/pengaturan → tab Tripay
   ✓ Isi dan simpan → refresh → nilai tetap
   ✓ Callback URL tampil read-only dan benar

2. Tab OneSender → toggle event off
   ✓ Buat order → notif yang di-toggle off tidak terkirim

3. Tab Pixel → isi FB Pixel ID → toggle on
   ✓ Refresh /katalog → fbq dipanggil (cek console browser)

4. Tab Info Toko → ubah nama toko
   ✓ Refresh /tentang → nama toko berubah
```

- [ ] **Step 4: Test keamanan**

```
1. Akses /admin/produk tanpa login
   ✓ Redirect ke /admin/login (middleware berfungsi)

2. POST ke /api/uploads tanpa session
   ✓ Response 401 Unauthorized

3. POST ke /api/tripay/callback dengan signature salah
   ✓ Response 401 Invalid signature

4. Submit form order 6x dalam 1 menit dari IP sama
   ✓ Request ke-6 return error rate limit
```

- [ ] **Step 5: Commit final**

```bash
git add .
git commit -m "chore: end-to-end test checklist passed — ready for VPS deployment"
```

---

### Task 28: Deployment ke VPS

**Files:**
- Create: `ecosystem.config.js` — PM2 config

- [ ] **Step 1: Install PM2 di VPS**

Di VPS (via SSH):

```bash
npm install -g pm2
```

- [ ] **Step 2: Clone dan setup project di VPS**

```bash
git clone <repo-url> /var/www/beyond-qurban
cd /var/www/beyond-qurban
npm install
cp .env.example .env
# Edit .env dengan nilai production:
nano .env
```

Isi `.env` production:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/beyond_qurban
NEXTAUTH_SECRET=<hasil openssl rand -base64 32>
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

- [ ] **Step 3: Setup database production**

```bash
npx prisma migrate deploy
npx prisma db seed
```

Expected:
```
✔ Applied migrations
✅ Seed selesai
```

- [ ] **Step 4: Build production**

```bash
npm run build
```

Expected: build berhasil.

- [ ] **Step 5: Buat PM2 config**

Buat `ecosystem.config.js`:

```js
module.exports = {
  apps: [
    {
      name: 'beyond-qurban',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/beyond-qurban',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
```

- [ ] **Step 6: Start dengan PM2**

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # ikuti instruksi yang muncul untuk auto-restart saat reboot
```

Verifikasi app berjalan:

```bash
pm2 status
# Expected: beyond-qurban — online
curl http://localhost:3000
# Expected: HTML homepage
```

- [ ] **Step 7: Setup Nginx reverse proxy**

```bash
sudo nano /etc/nginx/sites-available/beyond-qurban
```

Isi config Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Upload max 10MB (cover 5 foto x 2MB)
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site dan restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/beyond-qurban /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

- [ ] **Step 8: Setup SSL dengan Certbot**

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Ikuti prompt — masukkan email, setujui TOS. Certbot otomatis update config Nginx untuk HTTPS.

- [ ] **Step 9: Verifikasi production**

```
✓ https://yourdomain.com — homepage tampil
✓ https://yourdomain.com/katalog — produk tampil
✓ https://yourdomain.com/admin/login — halaman login tampil
✓ Login admin → dashboard tampil
✓ Tripay callback URL di settings: https://yourdomain.com/api/tripay/callback
  → Update di Tripay merchant dashboard
```

- [ ] **Step 10: Commit**

```bash
git add ecosystem.config.js
git commit -m "chore: add PM2 ecosystem config for VPS deployment"
```

---

**(End of Part 5 — Security, Hardening & Deployment)**

---

## Self-Review

### Spec Coverage Check

| Requirement dari spec | Task yang implementasikan |
|-----------------------|--------------------------|
| Katalog multi-kategori (tab) | Task 9 |
| Detail produk + form order | Task 10 |
| Real-time ongkir Bandung Raya | Task 4 (shipping.ts) + Task 10 (OrderForm) |
| deliveryDate dropdown H-3/H-2/H-1/H | Task 10 (OrderForm) |
| allowHomeDelivery enforce di server | Task 7 (createOrder) |
| Lacak pesanan + stepper | Task 6 (TrackingStepper) + Task 11 |
| Tentang Kami + data dinamis | Task 12 |
| Tripay payment + redirect | Task 21 |
| Tripay webhook HMAC verify | Task 21 |
| OneSender 7 event + toggle | Task 22 |
| FB CAPI ViewContent | Task 23 |
| FB CAPI InitiateCheckout | Task 23 |
| FB CAPI Purchase (dual trigger) | Task 21 + 23 |
| FB CAPI test event code | Task 23 |
| Admin login bcrypt + JWT 8 jam | Task 5 + 13 |
| Middleware proteksi /admin/* | Task 5 |
| Admin Dashboard stats + chart | Task 16 |
| Admin Produk CRUD + upload foto | Task 17 |
| Upload validasi mime + 2MB + max 5 | Task 17 |
| Admin Pesanan tab + update status | Task 18 |
| Export CSV | Task 18 |
| WA manual dari admin | Task 18 |
| Admin Pembeli read-only | Task 19 |
| Admin Pengaturan 4 tab | Task 20 |
| GTM + TikTok Pixel | Task 25 |
| Rate limit form order 5/menit | Task 24 |
| Seed data (admin + 5 produk + settings) | Task 3 |
| VPS deployment + Nginx + SSL | Task 28 |

### Placeholder Scan

Tidak ada TBD, TODO, atau implementasi parsial di plan ini. Setiap step memiliki kode lengkap.

### Type Consistency Check

- `OrderStatus` enum → digunakan konsisten di `TrackingStepper`, `OrderStatusBadge`, `updateOrderStatus`, `STATUS_TRANSITIONS`
- `QurbanLocation` enum → konsisten di `ProductCard`, `OrderForm`, `createProduct`
- `DeliveryMethod` enum → konsisten di `createOrder`, `OrderForm`, `DELIVERY_LABEL` di pesanan
- `sendOrderNotification(event, payload)` → signature konsisten di semua call site (orders.ts + webhook)
- `sendFbCapiEvent(eventName, options)` → signature konsisten di detail page, createOrder, webhook, capi/purchase route
