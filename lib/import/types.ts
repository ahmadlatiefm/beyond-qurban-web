// Row shapes accepted by the CSV import endpoints.
// Both rows are passed straight from the client after Papaparse normalizes
// header names to snake_case (lowercased).

export interface PesananImportRow {
  nomor_order?: string
  nama_pembeli: string
  no_whatsapp: string
  produk_id?: string
  nama_produk?: string
  jumlah: string | number
  total_harga: string | number
  status_bayar?: string  // PAID | UNPAID | EXPIRED | REFUNDED
  metode_bayar?: string
  tanggal_pesan?: string
  catatan?: string
  atas_nama?: string
  alamat?: string
}

export interface PenyaluranImportRow {
  nomor_donasi?: string
  nama_donatur: string
  no_whatsapp: string
  campaign_id?: string
  nama_campaign?: string
  jumlah_donasi: string | number  // total_amount in IDR
  status_bayar?: string
  tanggal_donasi?: string
  atas_nama?: string
  catatan?: string
  metode_bayar?: string
  jumlah_hewan?: string | number  // optional: ekor count, defaults to 1
}

export interface ImportFailure {
  row: number          // 1-indexed (matches the row number in the CSV body, not header)
  reason: string
}

export interface ImportResult {
  success: number
  failed: ImportFailure[]
}
