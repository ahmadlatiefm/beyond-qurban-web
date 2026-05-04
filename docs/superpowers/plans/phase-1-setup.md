# Beyond Qurban Rebuild — Phase 1: Setup & Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reset codebase lama dan establish foundation (Tailwind tokens, fonts, Prisma schema baru, lib layer) sehingga Phase 2 (halaman customer) bisa langsung mulai tanpa blocker.

**Architecture:** Next.js 14 App Router · Prisma + PostgreSQL · Tailwind CSS brand tokens dari design system ZIP · Font Awesome 6.5 via npm.

**Spec:** `docs/superpowers/specs/2026-05-03-beyond-qurban-rebuild-design.md`
**Mockup ZIP:** `E:\Downloads\Beyond Qurban Design System-handoff.zip`

---

## Task 1: Install Font Awesome + reset direktori lama

**Files:**
- Modify: `package.json`
- Delete: `app/(public)/`, `components/public/`, `components/admin/`, `lib/actions/`, `lib/auth.ts`, `lib/facebook-capi.ts`, `lib/onesender.ts`, `lib/prisma.ts`, `lib/rate-limit.ts`, `lib/shipping.ts`, `lib/tripay.ts`

- [ ] **Step 1: Install Font Awesome packages**

```bash
npm install @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/free-brands-svg-icons @fortawesome/react-fontawesome
```

Expected: 4 packages added to `node_modules`.

- [ ] **Step 2: Hapus folder dan file lama**

```bash
# Windows PowerShell
Remove-Item -Recurse -Force app\(public) -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force components\public -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force components\admin -ErrorAction SilentlyContinue
Remove-Item -Force lib\auth.ts, lib\facebook-capi.ts, lib\onesender.ts -ErrorAction SilentlyContinue
Remove-Item -Force lib\prisma.ts, lib\rate-limit.ts, lib\shipping.ts, lib\tripay.ts -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force lib\actions -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force app\admin -ErrorAction SilentlyContinue
Remove-Item -Force app\globals.css, app\layout.tsx -ErrorAction SilentlyContinue
```

- [ ] **Step 3: Buat folder struktur baru**

```bash
mkdir -p app\(customer) app\admin\login app\admin\(protected)\dashboard
mkdir -p app\admin\(protected)\produk app\admin\(protected)\pesanan
mkdir -p app\admin\(protected)\konfirmasi app\admin\(protected)\penyaluran
mkdir -p app\admin\(protected)\pengaturan
mkdir -p app\(customer)\katalog "app\(customer)\produk\[slug]"
mkdir -p app\(customer)\checkout\pembayaran
mkdir -p app\(customer)\penyaluran\checkout app\(customer)\penyaluran\pembayaran
mkdir -p app\(customer)\terimakasih app\(customer)\lacak-pesanan app\(customer)\tentang-kami
mkdir -p components\ui components\layout components\customer components\admin
mkdir -p lib\actions hooks
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: install font awesome, reset old code, scaffold folder structure"
```

---

## Task 2: Tailwind config + globals.css

**Files:**
- Modify: `tailwind.config.ts`
- Create: `app/globals.css`

- [ ] **Step 1: Tulis ulang `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans:  ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand tokens — sesuai mockup HTML
        'brand-dark':          '#0D3320',
        'brand-surface':       '#1B5E3B',
        'brand-surface-light': '#3D7A56',
        'brand-accent':        '#C8962A',
        'brand-accent-light':  '#F5E6C3',
        'brand-light':         '#FAFAF8',
        'brand-muted':         '#6B7280',
        'brand-text-dark':     '#0D1F17',
        // Shadcn/ui tokens (dipertahankan untuk komponen UI)
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary:     { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary:   { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent:      { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card:        { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      backgroundImage: {
        'cta-gradient':  'linear-gradient(135deg, #F5E6C3, #C8962A)',
        'hero-gradient': 'linear-gradient(145deg, #1B5E3B, #0D3320)',
        'soft-gradient': 'linear-gradient(180deg, #FAFAF8, #E8F4EE, #F5E6C3)',
      },
      boxShadow: {
        'premium':    '0 4px 20px rgba(13,51,32,0.10)',
        'glow':       '0 0 30px rgba(200,150,42,0.15)',
        'card-hover': '0 12px 30px rgba(13,51,32,0.15)',
      },
      borderRadius: {
        lg:   'var(--radius)',
        md:   'calc(var(--radius) - 2px)',
        sm:   'calc(var(--radius) - 4px)',
        card: '12px',
        pill: '20px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

- [ ] **Step 2: Tulis `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #FAFAF8; }
  ::-webkit-scrollbar { display: none; }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-10px); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.fade-up   { animation: fadeUp 0.6s ease forwards; }
.fade-up-2 { animation: fadeUp 0.7s 0.15s ease both; }
.fade-up-3 { animation: fadeUp 0.7s 0.30s ease both; }
.fade-up-4 { animation: fadeUp 0.7s 0.45s ease both; }
.float     { animation: float 3s ease-in-out infinite; }
.shimmer-text {
  background: linear-gradient(90deg, #C8962A, #F5E6C3, #C8962A);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s linear infinite;
}
.product-card { transition: all 0.3s ease; }
.product-card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(13,51,32,.15); }
.filter-chip {
  transition: all 0.2s; cursor: pointer;
  border: 1.5px solid rgba(107,114,128,.25); border-radius: 9999px;
  padding: 6px 16px; font-size: .8rem; font-weight: 500;
  background: white; color: #6B7280;
}
.filter-chip.active, .filter-chip:hover {
  border-color: #1B5E3B; background: #1B5E3B; color: white;
}
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts app/globals.css
git commit -m "feat: setup tailwind brand tokens + globals.css animations"
```

---

## Task 3: Root layout + Prisma schema

**Files:**
- Create: `app/layout.tsx`
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Tulis `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Beyond Qurban — Qurban Mudah, Amanah & Transparan',
  description: 'Platform penjualan hewan kurban online terpercaya.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased text-brand-text-dark">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Tulis ulang `prisma/schema.prisma`** — hapus `ProductType` enum dan model `Customer`, tambah `Campaign` + `Donation`:

Ganti isi file dengan schema lengkap dari spec: `docs/superpowers/specs/2026-05-03-beyond-qurban-rebuild-design.md` bagian **Section 4 — Prisma Schema**.

Pastikan `generator client` tetap:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
datasource db {
  provider = "postgresql"
}
```

- [ ] **Step 3: Jalankan migration**

```bash
npx prisma migrate dev --name rebuild-schema
```

Expected output: `✔ Your database is now in sync with your schema.`

- [ ] **Step 4: Generate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx prisma/schema.prisma prisma/migrations/
git commit -m "feat: root layout with next/font, rebuilt prisma schema (Campaign+Donation)"
```

---

## Task 4: lib/ layer — prisma, utils, shipping, auth

**Files:**
- Create: `lib/prisma.ts`, `lib/utils.ts`, `lib/shipping.ts`, `lib/auth.ts`, `middleware.ts`

- [ ] **Step 1: `lib/prisma.ts`**

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 2: `lib/utils.ts`**

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))
}

export function generateOrderNumber(): string {
  const date = new Date()
  const ymd = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `BQ-${ymd}-${rand}`
}
```

- [ ] **Step 3: `lib/shipping.ts`**

```ts
const BANDUNG_RAYA = ['kota bandung','kabupaten bandung','kab. bandung','kab bandung',
  'kabupaten bandung barat','kab. bandung barat','kab bandung barat','cimahi','sumedang']

export function calculateShipping(city: string): number {
  const normalized = city.toLowerCase().trim()
  const isBandungRaya = BANDUNG_RAYA.some(area => normalized.includes(area))
  return isBandungRaya ? 0 : 150000
}
```

- [ ] **Step 4: `lib/auth.ts`**

```ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.adminUser.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/admin/login' },
  secret: process.env.NEXTAUTH_SECRET,
}
```

- [ ] **Step 5: `middleware.ts`**

```ts
export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/admin/((?!login).*)'],
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/ middleware.ts
git commit -m "feat: lib layer — prisma singleton, utils, shipping, auth, middleware"
```

---

## Task 5: Seed data

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Tulis `prisma/seed.ts`**

```ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Admin user
  await prisma.adminUser.upsert({
    where: { email: 'admin@beyondqurban.com' },
    update: {},
    create: { email: 'admin@beyondqurban.com', name: 'Admin', password: await bcrypt.hash('admin123', 10) },
  })

  // Products
  const products = [
    { slug: 'domba-garut-super', name: 'Domba Garut Super', weight: 37.5, price: 3500000, badge: 'Premium', qurbanLocation: 'INDONESIA' as const, allowHomeDelivery: true, imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-633c0c42c771a49f61b6.png', description: 'Domba Garut berkualitas super, terseleksi ketat.' },
    { slug: 'domba-priangan-a', name: 'Domba Priangan A', weight: 32.5, price: 2800000, badge: null, qurbanLocation: 'INDONESIA' as const, allowHomeDelivery: true, imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-c4fe96d3e4365e7ee53c.png', description: 'Domba Priangan pilihan, sehat dan siap kurban.' },
    { slug: 'domba-merino-cross', name: 'Domba Merino Cross', weight: 42.5, price: 4200000, badge: 'Best Seller', qurbanLocation: 'INDONESIA' as const, allowHomeDelivery: true, imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/b1788dd218-c7de4a2e4e38fbf7061a.png', description: 'Merino Cross premium, berat di atas rata-rata.' },
    { slug: 'domba-penyaluran-indonesia', name: 'Domba Penyaluran Indonesia', weight: 30.0, price: 2500000, badge: null, qurbanLocation: 'INDONESIA' as const, allowHomeDelivery: false, imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-633c0c42c771a49f61b6.png', description: 'Program penyaluran ke pedalaman Indonesia.' },
    { slug: 'domba-ekor-gemuk', name: 'Domba Ekor Gemuk', weight: 40.0, price: 3800000, badge: null, qurbanLocation: 'INDONESIA' as const, allowHomeDelivery: true, imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/f43ecc8b00-1e2c261de24584ca2dce.png', description: 'Domba ekor gemuk, padat dan berkualitas.' },
  ]
  for (const p of products) {
    await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: { ...p, stock: 10, images: [p.imageUrl], status: 'ACTIVE' } })
  }

  // Campaigns
  await prisma.campaign.upsert({
    where: { slug: 'qurban-afrika-2025' },
    update: {},
    create: { slug: 'qurban-afrika-2025', title: 'Qurban Afrika 2025', location: 'AFRICA', targetCount: 100, price: 2000000, imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-633c0c42c771a49f61b6.png', description: 'Salurkan qurban ke saudara Muslim di Afrika.' },
  })
  await prisma.campaign.upsert({
    where: { slug: 'qurban-palestina-2025' },
    update: {},
    create: { slug: 'qurban-palestina-2025', title: 'Qurban Palestina 2025', location: 'PALESTINE', targetCount: 50, price: 2500000, imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/b1788dd218-c7de4a2e4e38fbf7061a.png', description: 'Salurkan qurban untuk saudara Muslim di Palestina.' },
  })

  // Settings defaults
  const settings = [
    { key: 'store_name', value: 'Beyond Qurban' },
    { key: 'store_whatsapp', value: '6281234567890' },
    { key: 'tripay_mode', value: 'sandbox' },
    { key: 'onesender_enabled', value: 'true' },
  ]
  for (const s of settings) {
    await prisma.settings.upsert({ where: { key: s.key }, update: {}, create: s })
  }

  console.log('✅ Seed selesai')
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Jalankan seed**

```bash
npx prisma db seed
```

Expected: `✅ Seed selesai`

- [ ] **Step 3: Verifikasi di Prisma Studio**

```bash
npx prisma studio
```

Pastikan tabel `Product` (5 baris), `Campaign` (2 baris), `AdminUser` (1 baris), `Settings` (4 baris) terisi.

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed data — 5 produk, 2 campaign, admin user, settings default"
```

---

**Phase 1 selesai. Lanjut ke Phase 2: Shared Layout & Customer Pages.**
