# Beyond Qurban — Design Spec
**Date:** 2026-04-30
**Stack:** Next.js 14 (App Router) · TypeScript · Prisma · PostgreSQL · Tailwind CSS · Shadcn/ui

---

## 1. Overview

Platform penjualan domba kurban online production-ready dengan fitur:
- Katalog produk multi-kategori (Lokal, Penyaluran Indonesia, Afrika, Palestina)
- Checkout dengan integrasi Tripay payment gateway
- Notifikasi WhatsApp otomatis via OneSender
- Order tracking real-time
- Admin dashboard lengkap
- Facebook CAPI server-side tracking

---

## 2. Keputusan Teknis

| Keputusan | Pilihan |
|-----------|---------|
| Upload foto | Local storage `/public/uploads/` |
| Deployment | VPS + PostgreSQL lokal |
| Data fetching | Server Components + Prisma langsung |
| Mutasi data | Next.js Server Actions |
| Webhook (Tripay, dll) | Route Handlers `/api/*` |
| Auth | NextAuth Credentials + bcrypt |
| Chart admin | Recharts |
| Halaman Tentang Kami | Ya, `/tentang` |

---

## 3. Color System & Fonts

```css
--forest-green: #1B5E3B   (brand-surface)
--deep-forest:  #0D3320   (brand-dark)
--warm-gold:    #C8962A   (brand-accent)
--light-gold:   #F5E6C3   (brand-accent-light)
--off-white:    #FAFAF8   (brand-light)
--mid-grey:     #6B7280   (brand-muted)
--text-dark:    #0D1F17   (brand-text-dark)
```

Font: **Playfair Display** (heading/serif) + **DM Sans** (body/sans)

---

## 4. Struktur Project

```
beyond-qurban/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  → Homepage
│   │   ├── katalog/
│   │   │   ├── page.tsx              → Katalog list + tab kategori
│   │   │   └── [slug]/page.tsx       → Detail produk + form order
│   │   ├── lacak/page.tsx            → Lacak pesanan
│   │   └── tentang/page.tsx          → Tentang Kami
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── layout.tsx                → Sidebar + auth guard
│   │   └── (dashboard)/
│   │       ├── page.tsx              → Dashboard stats + chart
│   │       ├── produk/page.tsx       → CRUD produk
│   │       ├── pesanan/page.tsx      → Manajemen pesanan
│   │       ├── pembeli/page.tsx      → List pembeli
│   │       └── pengaturan/page.tsx   → Settings
│   └── api/
│       ├── tripay/callback/route.ts  → Webhook Tripay (HMAC verified)
│       └── uploads/route.ts          → File upload handler
├── lib/
│   ├── actions/
│   │   ├── orders.ts     → createOrder, updateOrderStatus
│   │   ├── products.ts   → createProduct, updateProduct, deleteProduct
│   │   └── settings.ts   → getSettings, updateSettings
│   ├── tripay.ts         → Tripay API wrapper
│   ├── onesender.ts      → OneSender WhatsApp wrapper
│   ├── facebook-capi.ts  → FB Conversions API wrapper
│   └── prisma.ts         → Prisma client singleton
├── components/
│   ├── public/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ProductCard.tsx
│   │   ├── TrackingStepper.tsx
│   │   └── OrderForm.tsx
│   └── admin/
│       ├── Sidebar.tsx
│       ├── BottomNav.tsx
│       ├── StatCard.tsx
│       ├── DataTable.tsx
│       └── OrderStatusBadge.tsx
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

---

## 5. Database Schema

```prisma
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
  imageUrl          String         // Foto utama
  images            String[]       // Array URL untuk gallery (max 5)
  badge             String?        // "Premium" | "Best Seller" | null
  qurbanLocation    QurbanLocation @default(INDONESIA)
  allowHomeDelivery Boolean        @default(true)
  // Rule: jika qurbanLocation != INDONESIA → allowHomeDelivery di-enforce false
  // di Server Action createProduct/updateProduct, bukan di schema
  status            ProductStatus  @default(ACTIVE)
  orders            Order[]
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}

model Order {
  id               String         @id @default(cuid())
  orderNumber      String         @unique  // Format: ORD-20240610-0001
  customerName     String
  phone            String
  whatsapp         String

  // Metode penerima kurban
  deliveryMethod   DeliveryMethod

  // Lokasi kurban (dari produk, disimpan di order untuk referensi)
  qurbanLocation   QurbanLocation

  // Alamat pengiriman — hanya wajib jika deliveryMethod = HOME_DELIVERY
  address          String?        @db.Text  // Jalan, nomor, RT/RW
  kelurahan        String?
  kecamatan        String?
  city             String?
  province         String?
  postalCode       String?
  deliveryNotes    String?        @db.Text  // Petunjuk arah/patokan

  // Jadwal
  sacrificeDate    DateTime       // Tanggal hari H Idul Adha
  deliveryDate     DateTime?      // Tanggal antar ke rumah (H-3 s/d H)

  notes            String?        @db.Text

  // Produk
  product          Product        @relation(fields: [productId], references: [id])
  productId        String
  quantity         Int            @default(1)

  // Harga
  shippingCost     Int            @default(0)
  totalAmount      Int

  // Payment
  paymentMethod    String?        // BANK_TRANSFER | QRIS | VA
  paymentStatus    PaymentStatus  @default(UNPAID)
  tripayReference  String?
  tripayPaymentUrl String?
  paymentProofUrl  String?

  // Status
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
  password  String   // bcrypt hashed
  name      String
  createdAt DateTime @default(now())
}
```

---

## 6. Halaman Publik

### `/` — Homepage
Server Component. Data dari Prisma: 4 produk featured, stats aggregasi (total produk, pesanan, % terkirim, pelanggan).

Sections: Hero → Trust Stats → Mengapa Kami (3 cards) → Produk Terpopuler (4 cards) → Cara Pesan (4 langkah) → Footer

### `/katalog` — Katalog
Tab kategori di bagian atas:

| Tab | Filter |
|-----|--------|
| Semua | Semua produk ACTIVE |
| Domba Lokal | `INDONESIA` + `allowHomeDelivery = true` |
| Penyaluran Indonesia | `INDONESIA` + `allowHomeDelivery = false` |
| Qurban Afrika | `qurbanLocation = AFRICA` |
| Qurban Palestina | `qurbanLocation = PALESTINE` |

Filter tambahan: jenis domba, rentang harga, sorting. Pagination 12/halaman. Grid 4 kolom desktop / 2 kolom mobile.

Badge per card:
- Lokal → hijau "Antar Rumah"
- Penyaluran Indonesia → biru "Penyaluran"
- Afrika → oranye "Kurban Afrika"
- Palestina → merah "Kurban Palestina"

### `/katalog/[slug]` — Detail Produk + Form Order
- Gallery foto dengan thumbnail (images[])
- Specs grid: berat, jenis, kondisi, lokasi kurban
- Deskripsi & informasi pengiriman
- Form order inline:
  - Data customer (nama, HP, WA)
  - Pilihan metode: ONE_UMMAH atau HOME_DELIVERY (jika `allowHomeDelivery = true` dan `INDONESIA`)
  - Field alamat muncul hanya jika HOME_DELIVERY
  - Field deliveryDate muncul hanya jika HOME_DELIVERY
  - Pilihan tanggal sacrificeDate (date picker)
  - deliveryDate: dropdown pilihan tetap (H-3, H-2, H-1, Hari H) — hanya muncul jika HOME_DELIVERY
  - Catatan tambahan
- shippingCost: dihitung otomatis berdasarkan kota customer:
  - Bandung Raya (Kota Bandung, Kab Bandung, Kab Bandung Barat, Cimahi, Sumedang) → GRATIS (Rp 0)
  - Luar Bandung Raya → +Rp 150.000
  - Daftar kota Bandung Raya hardcode di `lib/shipping.ts`
  - Real-time feedback di form: "✅ Gratis ongkir!" atau "🚚 + Rp 150.000 ongkir luar Bandung Raya"
  - Validasi ulang di Server Action `createOrder()` sebelum simpan ke DB
- Submit → Server Action → Tripay → redirect payment URL

### `/lacak` — Lacak Pesanan
Input nomor order → query DB → tampilkan:
- Progress stepper 5 langkah: Menunggu Bayar → Dikonfirmasi → Disiapkan → Dikirim → Terkirim
- Detail order: produk, metode pengiriman, lokasi kurban, total

### `/tentang` — Tentang Kami
Static page. Data info toko dari `Settings` DB. Sections: profil, visi misi, keunggulan, kontak.

---

## 7. Admin Dashboard

### Layout
- Desktop: Sidebar fixed 280px (dark green) + main content
- Mobile: Bottom navigation 5 tab
- Auth guard: `middleware.ts` — semua `/admin/*` → redirect `/admin/login` jika no session

### `/admin` — Dashboard
- Stats cards: Pesanan Hari Ini, Menunggu Pembayaran, Produk Tersedia, Pengiriman Berhasil
- Chart pesanan (Recharts — area chart)
- Recent activity feed
- Quick actions: Tambah Produk, Lihat Pesanan

### `/admin/produk` — CRUD Produk
- Tabel: Foto, Nama, Jenis, Lokasi Kurban, Berat, Harga (inline edit), Stok (inline edit), Status toggle, Aksi
- Form tambah/edit: upload foto multiple (max 5, local `/public/uploads/`), semua field, toggle `allowHomeDelivery`, dropdown `qurbanLocation`

### `/admin/pesanan` — Manajemen Pesanan
- Tab filter status: Semua / Pending / Dikonfirmasi / Disiapkan / Dikirim / Terkirim / Dibatalkan
- Per baris: nomor order, nama, produk, metode pengiriman, lokasi kurban, total, payment status
- Aksi: update status, kirim WA manual, upload bukti bayar
- Export CSV

### `/admin/pembeli` — List Pembeli
Tabel read-only: nama, WA, kota, jumlah pesanan, total belanja.

### `/admin/pengaturan` — Settings
4 tab:

**Tripay:**
- API Key, Private Key, Merchant Code
- Mode: sandbox / production
- Callback URL (auto-generated, read-only)

**OneSender:**
- API Key, Nomor Pengirim
- Toggle per event: Order masuk (customer), Order masuk (admin), Pembayaran diterima (customer), Pembayaran diterima (admin), Update status (customer), Pengiriman (customer)

**Pixel & Tracking:**
- Facebook Pixel ID + toggle
- Meta CAPI Access Token + toggle
- CAPI Test Event Code (kosongkan untuk production)
- CAPI Purchase trigger: `○ Halaman pembayaran` `● Konfirmasi Tripay` `○ Keduanya`
- TikTok Pixel ID + toggle
- GTM Container ID + toggle

**Info Toko:**
- Nama toko, WA CS, Email, Alamat, Jam Operasional, Upload Logo

---

## 8. Integrasi Tripay

**Flow:**
1. Customer submit form → `createOrder()` Server Action
2. Simpan Order ke DB (status: PENDING, paymentStatus: UNPAID)
3. POST ke Tripay API → dapat `payment_url` + `reference`
4. Update Order dengan `tripayReference` + `tripayPaymentUrl`
5. Redirect customer ke `tripayPaymentUrl`
6. Customer bayar di halaman Tripay
7. Tripay POST ke `/api/tripay/callback`
8. Verifikasi HMAC signature
9. Update `paymentStatus = PAID`, `status = CONFIRMED`
10. Trigger OneSender notifikasi
11. Trigger FB CAPI `Purchase` (jika setting = "Konfirmasi Tripay" atau "Keduanya")

Mode (sandbox/production) diambil dari `Settings` DB key `tripay_mode`.

---

## 9. Integrasi OneSender (WhatsApp)

7 event (tabel di bawah), masing-masing bisa di-toggle dari admin settings:

| Event | Penerima | Trigger |
|-------|----------|---------|
| Order masuk | Customer | Setelah `createOrder()` |
| Order masuk | Admin | Setelah `createOrder()` |
| Pembayaran diterima | Customer | Tripay webhook confirmed |
| Pembayaran diterima | Admin | Tripay webhook confirmed |
| Update status | Customer | Admin update status pesanan |
| Pengiriman | Customer | Admin set status = SHIPPED |
| Manual | Customer | Tombol "Kirim WA" di admin |

Template WA mencakup: nomor order, nama produk, total, link bayar (untuk order masuk), status terkini.

---

## 10. Facebook CAPI (Server-side)

**Events:**
- `ViewContent` → halaman detail produk (Server Component, via `facebook-capi.ts`)
- `InitiateCheckout` → Server Action `createOrder()` dipanggil
- `Purchase` → trigger sesuai setting admin (halaman pembayaran / Tripay webhook / keduanya)

**Test mode:** Jika `capi_test_event_code` diisi di Settings → semua event dikirim dengan `test_event_code` field → verifikasi di Facebook Events Manager > Test Events.

**Data yang dikirim:** event_name, event_time, user_data (phone hash SHA256, nama), custom_data (value, currency, content_ids).

---

## 11. Security

- **Auth:** NextAuth Credentials, bcrypt password, JWT session expire 8 jam
- **Middleware:** Proteksi semua `/admin/*` kecuali `/admin/login`
- **Tripay webhook:** Verifikasi HMAC-SHA256 signature sebelum proses
- **Validation:** Zod schema di semua Server Actions
- **Rate limiting:** Form order max 5 req/menit per IP (header-based, tanpa Redis)
- **Upload:** Validasi mime type (image/jpeg, image/png, image/webp) + max 2MB + sanitize filename
- **SQL injection:** Prisma parameterized queries
- **Sensitive env:** `TRIPAY_API_KEY`, `TRIPAY_PRIVATE_KEY`, `NEXTAUTH_SECRET`, `ONESENDER_API_KEY` tetap di `.env`

---

## 12. Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/beyond_qurban

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://yourdomain.com

# Tripay
TRIPAY_API_KEY=
TRIPAY_PRIVATE_KEY=
TRIPAY_MERCHANT_CODE=
TRIPAY_MODE=sandbox

# OneSender
ONESENDER_API_KEY=
ONESENDER_SENDER_NUMBER=

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 13. Seed Data

Seed akan membuat:
- 1 AdminUser default (email: admin@beyondqurban.com, password: admin123)
- 5 produk contoh:
  - Domba Garut Super (INDONESIA, allowHomeDelivery: true, GARUT)
  - Domba Merino Cross (INDONESIA, allowHomeDelivery: true, LOKAL)
  - Domba Penyaluran Indonesia (INDONESIA, allowHomeDelivery: false, LOKAL)
  - Domba Qurban Afrika (AFRICA, allowHomeDelivery: false, LOKAL)
  - Domba Qurban Palestina (PALESTINE, allowHomeDelivery: false, LOKAL)
- Settings default (tripay_mode: sandbox, semua notif toggle: true)
