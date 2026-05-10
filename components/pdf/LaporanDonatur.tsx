import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import '@/lib/pdf/fonts'

const COLORS = {
  forest: '#0D3320',
  forestMid: '#1B5E3B',
  gold: '#C8962A',
  goldLight: '#F5E6C3',
  cream: '#FAFAF8',
  text: '#0D1F17',
  muted: '#6B7280',
  border: '#E5E7EB',
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 36,
    fontFamily: 'NotoSans',
    color: COLORS.text,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: { width: 38, height: 38, objectFit: 'contain' },
  logoRight: { width: 70, height: 38, objectFit: 'contain' },
  brandName: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 14,
    color: COLORS.forest,
    letterSpacing: 1,
  },
  divider: { height: 2, backgroundColor: COLORS.gold, marginTop: 10, marginBottom: 14 },
  title: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 18,
    color: COLORS.forest,
    letterSpacing: 1.5,
  },
  subtitle: { fontSize: 11, color: COLORS.gold, marginTop: 2, letterSpacing: 1 },
  infoBox: {
    marginTop: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.cream,
  },
  infoRow: { flexDirection: 'row', marginBottom: 4 },
  infoLabel: { width: 110, fontSize: 10, color: COLORS.muted },
  infoValue: { fontSize: 11, fontFamily: 'NotoSans', fontWeight: 'bold', color: COLORS.text, flex: 1 },
  patunganRow: { fontSize: 10, color: COLORS.muted, marginTop: 4, lineHeight: 1.5 },
  sectionTitle: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 12,
    color: COLORS.forest,
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: 1,
  },
  photoBig: {
    width: '100%',
    height: 220,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    objectFit: 'cover',
  },
  photoMed: {
    width: '100%',
    height: 180,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    objectFit: 'cover',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoGridItem: {
    width: '48%',
    height: 160,
    borderWidth: 1,
    borderColor: COLORS.border,
    objectFit: 'cover',
  },
  closing: {
    marginTop: 14,
    fontSize: 10,
    fontStyle: 'italic',
    color: COLORS.muted,
    lineHeight: 1.5,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: COLORS.muted,
  },
  // Penyaluran page
  recipientBox: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
    backgroundColor: COLORS.cream,
  },
  recipientNum: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 22,
    color: COLORS.forest,
  },
  recipientLabel: { fontSize: 10, color: COLORS.muted, marginTop: 2 },
  desc: { fontSize: 10, marginTop: 10, lineHeight: 1.5, color: COLORS.text },
})

export interface LaporanDonaturData {
  orderNumber: string
  customerName: string
  atasNama: string
  jenisHewan: string
  jumlahHewan: number
  tanggal: string
  lokasi: string
  campaignTitle: string
  isPatungan: boolean
  namaPatungan: string[]
  fotoPenyembelihan: string[]
  // Optional shared penyaluran section
  penyaluran?: {
    judul: string
    lokasi: string
    jumlahPenerima: number | null
    deskripsi: string
    fotoUrls: string[]
    tandaTerima: string | null
  } | null
  logoUrl: string
  logoRightUrl?: string | null
}

export default function LaporanDonatur({ data }: { data: LaporanDonaturData }) {
  return (
    <Document>
      {/* Page 1 — Penyembelihan */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {data.logoUrl ? <Image src={data.logoUrl} style={styles.logo} /> : null}
            <Text style={styles.brandName}>BEYOND QURBAN</Text>
          </View>
          {data.logoRightUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={data.logoRightUrl} style={styles.logoRight} />
          ) : null}
        </View>
        <View style={styles.divider} />

        <Text style={styles.title}>LAPORAN PENYEMBELIHAN QURBAN</Text>
        <Text style={styles.subtitle}>1446 H · {data.campaignTitle}</Text>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nomor Order</Text>
            <Text style={styles.infoValue}>: {data.orderNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pemohon</Text>
            <Text style={styles.infoValue}>: {data.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Atas Nama</Text>
            <Text style={styles.infoValue}>: {data.atasNama}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Jenis & Jumlah</Text>
            <Text style={styles.infoValue}>: {data.jumlahHewan}× {data.jenisHewan}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tanggal</Text>
            <Text style={styles.infoValue}>: {data.tanggal}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lokasi</Text>
            <Text style={styles.infoValue}>: {data.lokasi}</Text>
          </View>
          {data.isPatungan && data.namaPatungan.length > 0 && (
            <Text style={styles.patunganRow}>
              Peserta Patungan ({data.namaPatungan.length} orang): {data.namaPatungan.join(', ')}
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>DOKUMENTASI PENYEMBELIHAN</Text>
        {data.fotoPenyembelihan.length === 0 ? (
          <Text style={styles.desc}>Foto penyembelihan belum tersedia.</Text>
        ) : data.fotoPenyembelihan.length === 1 ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={data.fotoPenyembelihan[0]} style={styles.photoBig} />
        ) : (
          <View style={styles.photoGrid}>
            {data.fotoPenyembelihan.slice(0, 4).map((src, i) => (
              // eslint-disable-next-line jsx-a11y/alt-text, react/jsx-key
              <Image key={i} src={src} style={styles.photoGridItem} />
            ))}
          </View>
        )}

        <Text style={styles.closing}>
          &quot;Alhamdulillah, hewan qurban Anda telah disembelih dengan sah sesuai syariat Islam.&quot;
        </Text>

        <View style={styles.footer}>
          <Text>Beyond Qurban</Text>
          <Text>beyondqurban.com</Text>
        </View>
      </Page>

      {/* Halaman foto penyembelihan tambahan (>4 foto) — 4 foto per halaman */}
      {data.fotoPenyembelihan.length > 4 && (() => {
        const extra = data.fotoPenyembelihan.slice(4)
        const pages: string[][] = []
        for (let i = 0; i < extra.length; i += 4) pages.push(extra.slice(i, i + 4))
        return pages.map((group, pageIdx) => (
          <Page key={`extra-${pageIdx}`} size="A4" style={styles.page}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                {data.logoUrl ? <Image src={data.logoUrl} style={styles.logo} /> : null}
                <Text style={styles.brandName}>BEYOND QURBAN</Text>
              </View>
              {data.logoRightUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={data.logoRightUrl} style={styles.logoRight} />
              ) : null}
            </View>
            <View style={styles.divider} />

            <Text style={styles.title}>DOKUMENTASI PENYEMBELIHAN</Text>
            <Text style={styles.subtitle}>Foto Tambahan · Halaman {pageIdx + 2}</Text>

            <View style={[styles.photoGrid, { marginTop: 14 }]}>
              {group.map((src, i) => (
                // eslint-disable-next-line jsx-a11y/alt-text, react/jsx-key
                <Image key={i} src={src} style={styles.photoGridItem} />
              ))}
            </View>

            <View style={styles.footer}>
              <Text>Beyond Qurban</Text>
              <Text>beyondqurban.com</Text>
            </View>
          </Page>
        ))
      })()}

      {/* Halaman terakhir — Penyaluran (jika ada laporan tertaut) */}
      {data.penyaluran && (
        <Page size="A4" style={styles.page}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              {data.logoUrl ? <Image src={data.logoUrl} style={styles.logo} /> : null}
              <Text style={styles.brandName}>BEYOND QURBAN</Text>
            </View>
            {data.logoRightUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={data.logoRightUrl} style={styles.logoRight} />
            ) : null}
          </View>
          <View style={styles.divider} />

          <Text style={styles.title}>DOKUMENTASI PENYALURAN</Text>
          <Text style={styles.subtitle}>{data.penyaluran.judul}</Text>

          <View style={styles.recipientBox}>
            <Text style={styles.recipientLabel}>Daging qurban Anda telah disalurkan kepada</Text>
            <Text style={styles.recipientNum}>
              {data.penyaluran.jumlahPenerima ?? '—'} penerima manfaat
            </Text>
            <Text style={styles.recipientLabel}>di {data.penyaluran.lokasi}</Text>
          </View>

          {data.penyaluran.deskripsi ? (
            <Text style={styles.desc}>{data.penyaluran.deskripsi}</Text>
          ) : null}

          <Text style={styles.sectionTitle}>FOTO PENYALURAN</Text>
          {data.penyaluran.fotoUrls.length === 0 ? (
            <Text style={styles.desc}>Foto penyaluran belum tersedia.</Text>
          ) : (
            <View style={styles.photoGrid}>
              {data.penyaluran.fotoUrls.slice(0, 4).map((src, i) => (
                // eslint-disable-next-line jsx-a11y/alt-text, react/jsx-key
                <Image key={i} src={src} style={styles.photoGridItem} />
              ))}
            </View>
          )}

          {data.penyaluran.tandaTerima && (
            <>
              <Text style={styles.sectionTitle}>TANDA TERIMA</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={data.penyaluran.tandaTerima} style={styles.photoMed} />
            </>
          )}

          <View style={styles.footer}>
            <Text>Beyond Qurban</Text>
            <Text>beyondqurban.com</Text>
          </View>
        </Page>
      )}
    </Document>
  )
}
