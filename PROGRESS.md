# Beyond Qurban — Progress Tracker
**Last updated:** 2026-05-01

---

## Status Saat Ini

**Fase:** Perencanaan — menulis Implementation Plan  
**Spec:** `docs/superpowers/specs/2026-04-30-beyond-qurban-design.md` ✅ Selesai & disetujui

---

## Yang Sudah Selesai

- [x] Review semua 11 file desain UXPilot (Homepage, Katalog, Detail Produk, Checkout, Lacak Pesanan, Hasil Lacak, Admin Dashboard, Admin Login, Admin Pesanan, Admin Produk, Tentang Kami)
- [x] Sesi brainstorming & klarifikasi kebutuhan
- [x] Design spec lengkap ditulis dan disetujui
- [x] Semua keputusan teknis dikonfirmasi (lihat bagian bawah)

## Yang Sedang Dikerjakan

- [ ] Implementation plan lengkap (`docs/superpowers/plans/`)

## Langkah Berikutnya

1. Selesaikan implementation plan
2. Setup project Next.js 14 + semua dependencies
3. Prisma schema + migration + seed
4. Shared components (Header, Footer, ProductCard)
5. Public pages (Homepage → Katalog → Detail → Lacak → Tentang)
6. Admin dashboard lengkap
7. Integrasi Tripay + OneSender + Facebook CAPI
8. Testing & hardening

---

## Keputusan Teknis yang Disepakati

### Stack
| Komponen | Pilihan |
|----------|---------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL (lokal di VPS) |
| Styling | Tailwind CSS |
| UI Admin | Shadcn/ui |
| Chart | Recharts |
| Auth | NextAuth v4 (Credentials provider) |

### Arsitektur
| Keputusan | Pilihan |
|-----------|---------|
| Data fetching | Server Components → Prisma langsung |
| Mutasi data | Next.js Server Actions |
| Webhook eksternal | Route Handlers (`/api/*`) |
| Upload foto | Local storage `/public/uploads/` (max 5 foto/produk, max 2MB/foto) |
| Deployment target | VPS + PostgreSQL lokal |

### Fitur & Bisnis
| Keputusan | Detail |
|-----------|--------|
| Upload foto | Local `/public/uploads/`, validasi mime + 2MB, max 5 per produk |
| Halaman Tentang Kami | Ya, route `/tentang` |
| Ongkir | Otomatis: Bandung Raya = GRATIS, Luar Bandung Raya = +Rp 150.000 |
| Kota Bandung Raya | Kota Bandung, Kab Bandung, Kab Bandung Barat, Cimahi, Sumedang |
| Real-time ongkir | Tampil saat customer pilih kota di form order |
| deliveryDate options | H-3, H-2, H-1, Hari H (dropdown, hanya muncul jika HOME_DELIVERY) |
| Kategori produk katalog | Domba Lokal, Penyaluran Indonesia, Qurban Afrika, Qurban Palestina |
| allowHomeDelivery | Fitur aktif; produk AFRICA/PALESTINE otomatis false, di-enforce di Server Action |
| Facebook CAPI | Server-side, test mode via Test Event Code di Settings |
| CAPI Purchase trigger | Bisa pilih: Halaman Pembayaran / Konfirmasi Tripay / Keduanya (setting admin) |
| OneSender events | 7 event (order masuk customer, order masuk admin, bayar customer, bayar admin, update status, pengiriman, manual) |
| Admin password | bcrypt, tersimpan di DB (`AdminUser` model) |
| Sensitive credentials | TRIPAY_API_KEY, TRIPAY_PRIVATE_KEY, NEXTAUTH_SECRET, ONESENDER_API_KEY di `.env` saja |
| Settings lainnya | Disimpan di tabel `Settings` (key-value) di DB |

### Database Models
- `Product` — id, slug, name, type, weight, price, stock, description, imageUrl, images[], badge, qurbanLocation, allowHomeDelivery, status
- `Order` — id, orderNumber, customerName, phone, whatsapp, deliveryMethod, qurbanLocation, address fields, sacrificeDate, deliveryDate, notes, productId, quantity, shippingCost, totalAmount, payment fields, status
- `Customer` — id, name, phone, whatsapp, city
- `Settings` — id, key, value
- `AdminUser` — id, email, password (bcrypt), name

### Color System
```
--forest-green (brand-surface):       #1B5E3B
--deep-forest (brand-dark):           #0D3320
--warm-gold (brand-accent):           #C8962A
--light-gold (brand-accent-light):    #F5E6C3
--off-white (brand-light):            #FAFAF8
--mid-grey (brand-muted):             #6B7280
--text-dark (brand-text-dark):        #0D1F17
```
Font: **Playfair Display** (heading) + **DM Sans** (body)

---

## File Referensi
- Spec lengkap: `docs/superpowers/specs/2026-04-30-beyond-qurban-design.md`
- Desain UXPilot: `Qurban App - *.html` (11 file di root)
- Implementation plan: `docs/superpowers/plans/` (sedang ditulis)
