# Beyond Qurban — Rebuild Design Spec
**Date:** 2026-05-03
**Branch:** claude/magical-tharp-55ac6c
**Stack:** Next.js 14 (App Router) · TypeScript · Prisma · PostgreSQL · Tailwind CSS · Shadcn/ui · NextAuth v4 · Font Awesome 6.5

---

## 1. Konteks & Keputusan Utama

Rebuild dari 0 mengikuti mockup HTML baru dari handoff ZIP (`beyond-qurban-design-system-handoff.zip`).

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| Pendekatan | Hybrid: baca semua mockup → foundation minimal → halaman satu per satu | Pixel-perfect dari source HTML, tidak over-engineer |
| Data layer | Prisma + PostgreSQL + Tripay + NextAuth | Bukan localStorage — production-ready |
| Icons | Font Awesome 6.5 (`@fortawesome/react-fontawesome`) | Mockup pakai FA secara ekstensif; Lucide tidak pixel-perfect |
| Fonts | `next/font/google` (DM Sans + Playfair Display) | Next.js optimasi otomatis; TTF lokal dari ZIP tidak diperlukan |
| Styling | Tailwind CSS dengan brand tokens di `tailwind.config.ts` | Sesuai pattern mockup HTML |
| Client Components | Hanya form interaktif & state UI | Server Components by default |

---

## 2. Color & Design Tokens

Dari `colors_and_type.css` di ZIP. Semua masuk `tailwind.config.ts` sebagai `extend`:

```ts
colors: {
  'brand-dark':          '#0D3320', // nav, hero, footer, admin sidebar
  'brand-surface':       '#1B5E3B', // cards, feature sections
  'brand-surface-light': '#3D7A56', // hovers, borders, dividers
  'brand-accent':        '#C8962A', // primary CTA, prices, active states
  'brand-accent-light':  '#F5E6C3', // tags, soft CTA, text-on-dark muted
  'brand-light':         '#FAFAF8', // page background
  'brand-muted':         '#6B7280', // secondary text, placeholders
  'brand-text-dark':     '#0D1F17', // primary body text on light bg
}
backgroundImage: {
  'cta-gradient':  'linear-gradient(135deg, #F5E6C3, #C8962A)',
  'hero-gradient': 'linear-gradient(145deg, #1B5E3B, #0D3320)',
  'soft-gradient': 'linear-gradient(180deg, #FAFAF8, #E8F4EE, #F5E6C3)',
}
boxShadow: {
  'premium': '0 4px 20px rgba(13,51,32,0.10)',
  'glow':    '0 0 30px rgba(200,150,42,0.15)',
  'card-hover': '0 12px 30px rgba(13,51,32,0.15)',
}
borderRadius: {
  'sm':   '8px',
  'card': '12px',
  'pill': '20px',
}
fontFamily: {
  'serif': ['Playfair Display', 'serif'],
  'sans':  ['DM Sans', 'sans-serif'],
}
```

`globals.css` hanya berisi CSS animations dan base reset:

```css
@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
.fade-up { animation: fadeUp .6s ease forwards; }
::-webkit-scrollbar { display: none; }
```

---

## 3. Route Structure

```
app/
├── layout.tsx                             root layout — font vars, html class
├── not-found.tsx                          → 404.html
├── (customer)/
│   ├── layout.tsx                         Header + Footer wrapper
│   ├── page.tsx                           → index.html
│   ├── katalog/page.tsx                   → katalog.html
│   ├── produk/[slug]/page.tsx             → Qurban App - Detail Produk.html
│   ├── checkout/page.tsx                  → Checkout _ Form P.html
│   ├── checkout/pembayaran/page.tsx       → detail-pembayaran.html
│   ├── penyaluran/page.tsx                → qurban-penyaluran.html
│   ├── penyaluran/checkout/page.tsx       → checkout-penyaluran.html
│   ├── penyaluran/pembayaran/page.tsx     → detail-pembayaran-penyaluran.html
│   ├── terimakasih/page.tsx               → terimakasih.html
│   ├── lacak-pesanan/page.tsx             → lacak-pesanan.html
│   └── tentang-kami/page.tsx             → tentang-kami.html
├── admin/
│   ├── login/page.tsx                     → admin-login.html
│   └── (protected)/
│       ├── layout.tsx                     AdminSidebar + auth guard
│       ├── page.tsx                       redirect → /admin/dashboard
│       ├── dashboard/page.tsx             → admin-dashboard.html
│       ├── produk/page.tsx                → admin-produk.html
│       ├── pesanan/page.tsx               → Qurban App - Admin Pesanan.html
│       ├── konfirmasi/page.tsx            → konfirmasi-pembayaran.html
│       ├── penyaluran/page.tsx            → admin-penyaluran.html
│       └── pengaturan/page.tsx            → Qurban App - Admin Pengaturan.html
└── api/
    ├── auth/[...nextauth]/route.ts
    ├── tripay/callback/route.ts
    └── uploads/route.ts
```

---

## 4. Prisma Schema

### Model Tetap (dengan adjustment)

```prisma
enum QurbanLocation { INDONESIA  AFRICA  PALESTINE }
enum DeliveryMethod  { ONE_UMMAH  HOME_DELIVERY }
enum OrderStatus     { PENDING  CONFIRMED  PREPARING  SHIPPED  DELIVERED  CANCELLED }
enum PaymentStatus   { UNPAID  PAID  EXPIRED  REFUNDED }
enum ProductStatus   { ACTIVE  INACTIVE }

model Product {
  id                String        @id @default(cuid())
  slug              String        @unique
  name              String
  weight            Float
  price             Int
  stock             Int           @default(1)
  description       String        @db.Text
  imageUrl          String
  images            String[]
  badge             String?       // "Premium" | "Best Seller" | null
  qurbanLocation    QurbanLocation @default(INDONESIA)
  allowHomeDelivery Boolean       @default(true)
  status            ProductStatus @default(ACTIVE)
  orders            Order[]
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
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

model Settings {
  id    String @id @default(cuid())
  key   String @unique
  value String @db.Text
}

model AdminUser {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  name      String
  createdAt DateTime @default(now())
}
```

### Model Baru

```prisma
model Campaign {
  id          String         @id @default(cuid())
  slug        String         @unique
  title       String
  location    QurbanLocation
  targetCount Int
  price       Int
  imageUrl    String
  description String         @db.Text
  isActive    Boolean        @default(true)
  donations   Donation[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model Donation {
  id               String        @id @default(cuid())
  orderNumber      String        @unique
  campaign         Campaign      @relation(fields: [campaignId], references: [id])
  campaignId       String
  customerName     String
  phone            String
  whatsapp         String
  quantity         Int           @default(1)
  totalAmount      Int
  paymentMethod    String?
  paymentStatus    PaymentStatus @default(UNPAID)
  tripayReference  String?
  tripayPaymentUrl String?
  status           OrderStatus   @default(PENDING)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
}
```

### Dihapus
- Model `Customer` — tidak ada di desain baru

---

## 5. Komponen

### `components/ui/` — Atoms

| File | Deskripsi |
|------|-----------|
| `Badge.tsx` | Tag status produk, lokasi kurban — varian: green, gold, blue, red, gray |
| `Button.tsx` | 3 varian: `cta` (gradient), `outline`, `ghost` |
| `ProductCard.tsx` | Card di homepage + katalog — image, badge, nama, berat, harga, arrow button |
| `StatusBadge.tsx` | Status pesanan admin |

Shadcn/ui diinstall fresh untuk: `Input`, `Select`, `Textarea`, `Dialog`, `Toast`, `Table`, `Tabs`.

### `components/layout/`

| File | Deskripsi |
|------|-----------|
| `Header.tsx` | Fixed navbar, dark green, mobile drawer |
| `Footer.tsx` | Dark green footer |
| `AdminSidebar.tsx` | 280px fixed, dark green, 6 nav items + logout |
| `AdminBottomNav.tsx` | Mobile bottom nav admin |

### `components/customer/` — diextract organik saat build

| File | Halaman |
|------|---------|
| `OrderForm.tsx` | `/checkout` — Client Component |
| `ProductGallery.tsx` | `/produk/[slug]` |
| `StickyBar.tsx` | `/produk/[slug]` — sticky CTA bar |
| `TrackingStepper.tsx` | `/lacak-pesanan` |
| `CampaignCard.tsx` | `/penyaluran` |
| `DonationForm.tsx` | `/penyaluran/checkout` — Client Component |
| `PaymentDetail.tsx` | `/checkout/pembayaran` + `/penyaluran/pembayaran` |

### `components/admin/`

| File | Halaman |
|------|---------|
| `StatCard.tsx` | Dashboard |
| `OrdersTable.tsx` | Pesanan |
| `ProductForm.tsx` | Produk — modal tambah/edit |
| `KonfirmasiTable.tsx` | Konfirmasi |
| `PenyaluranTable.tsx` | Admin penyaluran |

---

## 6. lib/ Structure

```
lib/
├── prisma.ts          singleton Prisma client
├── auth.ts            NextAuth config (Credentials provider, bcrypt)
├── tripay.ts          Tripay API wrapper (createTransaction, verifyCallback)
├── onesender.ts       WhatsApp notification wrapper
├── shipping.ts        calculateShipping() — Bandung Raya = 0, luar = 150000
├── utils.ts           formatCurrency, formatDate, generateOrderNumber
└── actions/
    ├── orders.ts      createOrder, updateOrderStatus
    ├── products.ts    createProduct, updateProduct, deleteProduct, getProducts
    ├── campaigns.ts   getCampaigns, getCampaignBySlug
    ├── donations.ts   createDonation, updateDonationStatus
    └── settings.ts    getSettings, updateSettings
```

---

## 7. API Routes

| Route | Fungsi |
|-------|--------|
| `/api/auth/[...nextauth]` | NextAuth handler |
| `/api/tripay/callback` | Webhook Tripay — HMAC verified, update Order + Donation |
| `/api/uploads` | File upload — validasi mime, max 2MB, save ke `/public/uploads/` |

---

## 8. Build Order

### Phase 0 — Foundation
1. Reset `tailwind.config.ts` → brand tokens
2. Reset `app/globals.css` → animations + reset
3. Reset `app/layout.tsx` → next/font, html class
4. Update `prisma/schema.prisma` → tambah Campaign/Donation, hapus Customer
5. `prisma migrate dev --name rebuild`
6. Update `prisma/seed.ts` → 5 produk + 2 campaign + admin user + settings
7. Reset semua `lib/` files
8. Reset `middleware.ts`

### Phase 1 — Customer (urutan)
1. `Header` + `Footer` component
2. `(customer)/layout.tsx`
3. Homepage `/`
4. Katalog `/katalog`
5. Detail Produk `/produk/[slug]`
6. Checkout `/checkout`
7. Pembayaran `/checkout/pembayaran`
8. Penyaluran `/penyaluran`
9. Checkout Penyaluran `/penyaluran/checkout`
10. Pembayaran Penyaluran `/penyaluran/pembayaran`
11. Terima Kasih `/terimakasih`
12. Lacak Pesanan `/lacak-pesanan`
13. Tentang Kami `/tentang-kami`
14. 404

### Phase 2 — Admin (urutan)
1. `AdminSidebar` + `AdminBottomNav`
2. `(admin)/(protected)/layout.tsx`
3. Login `/admin/login`
4. Dashboard `/admin/dashboard`
5. Produk `/admin/produk`
6. Pesanan `/admin/pesanan`
7. Konfirmasi `/admin/konfirmasi`
8. Penyaluran `/admin/penyaluran`
9. Pengaturan `/admin/pengaturan`

---

## 9. Aturan Implementasi

- **Pixel-perfect priority:** Setiap halaman dimulai dengan membaca HTML mockup → extract Tailwind classes persis → konversi ke JSX. Tidak ada redesign, tidak ada perubahan warna/spacing/layout.
- **Server Components by default.** `'use client'` hanya untuk: form dengan state, interactive UI (gallery, drawer, tabs).
- **Extract organik:** Komponen baru hanya dibuat saat pola muncul di >1 halaman.
- **Shadcn/ui untuk form primitives.** Tidak diganti, tidak dikustom visual kecuali wajib match mockup.
- **Font Awesome** via `@fortawesome/react-fontawesome` + `@fortawesome/free-solid-svg-icons` + `@fortawesome/free-brands-svg-icons`.

---

## 10. Mockup Referensi per Halaman

| Halaman | File Mockup di ZIP |
|---------|--------------------|
| Homepage | `uploads/index.html` |
| Katalog | `uploads/katalog.html` |
| Detail Produk | `uploads/Qurban App - Detail Produk.html` |
| Checkout | `uploads/Qurban App - Checkout _ Form P.html` |
| Pembayaran reguler | `uploads/detail-pembayaran.html` |
| Penyaluran | `uploads/qurban-penyaluran.html` |
| Checkout Penyaluran | `uploads/checkout-penyaluran.html` |
| Pembayaran Penyaluran | `uploads/detail-pembayaran-penyaluran.html` |
| Terima Kasih | `uploads/terimakasih.html` |
| Lacak Pesanan | `uploads/lacak-pesanan.html` |
| Tentang Kami | `uploads/tentang-kami.html` |
| 404 | `uploads/404.html` |
| Admin Login | `uploads/admin-login.html` |
| Admin Dashboard | `uploads/admin-dashboard.html` |
| Admin Produk | `uploads/admin-produk.html` |
| Admin Pesanan | `uploads/Qurban App - Admin Pesanan.html` |
| Admin Konfirmasi | `uploads/konfirmasi-pembayaran.html` |
| Admin Penyaluran | `uploads/admin-penyaluran.html` |
| Admin Pengaturan | `uploads/Qurban App - Admin Pengaturan.html` |
