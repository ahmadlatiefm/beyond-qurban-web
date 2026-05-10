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
    padding: 40,
    fontFamily: 'NotoSans',
    color: COLORS.text,
  },
  // ---------------- Cover ----------------
  coverPage: {
    backgroundColor: COLORS.forest,
    padding: 40,
    fontFamily: 'NotoSans',
    color: '#FFFFFF',
    position: 'relative',
  },
  coverGoldBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: COLORS.gold,
  },
  coverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 30,
  },
  coverLogo: { width: 56, height: 56 },
  coverBrand: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  coverDivider: {
    height: 2,
    backgroundColor: COLORS.gold,
    marginTop: 28,
    marginBottom: 16,
    width: 90,
  },
  coverTitle: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  coverSubtitle: {
    fontSize: 14,
    color: COLORS.goldLight,
    marginTop: 6,
    letterSpacing: 3,
  },
  coverReportTitle: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 18,
    color: COLORS.gold,
    marginTop: 26,
  },
  coverInfoBox: {
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  coverInfoRow: {
    flexDirection: 'row',
    fontSize: 11,
    color: '#FFFFFF',
    marginVertical: 3,
  },
  coverInfoLabel: {
    width: 90,
    color: COLORS.goldLight,
  },
  coverInfoValue: {
    flex: 1,
    fontFamily: 'NotoSans', fontWeight: 'bold',
  },
  coverImageWrap: {
    marginTop: 22,
    height: 240,
    backgroundColor: COLORS.forestMid,
    borderRadius: 4,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  coverFooter: {
    position: 'absolute',
    bottom: 28,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    color: COLORS.goldLight,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gold,
  },
  // ---------------- Inner pages ----------------
  innerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold,
    marginBottom: 18,
  },
  innerLogo: { width: 22, height: 22 },
  innerBrand: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 10,
    color: COLORS.forest,
    letterSpacing: 2,
  },
  innerHeaderRight: {
    marginLeft: 'auto',
    fontSize: 9,
    color: COLORS.muted,
  },
  sectionTitle: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.forest,
    marginBottom: 12,
  },
  sectionDivider: {
    height: 2,
    width: 40,
    backgroundColor: COLORS.gold,
    marginBottom: 14,
  },
  paragraph: {
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 1.6,
    marginBottom: 8,
    textAlign: 'justify',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 18,
  },
  metaCard: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
  },
  metaCardLabel: {
    fontSize: 9,
    color: COLORS.muted,
    marginBottom: 3,
  },
  metaCardValue: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 12,
    color: COLORS.forest,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoItem: {
    width: '100%',
    marginBottom: 14,
  },
  photoFrame: {
    width: '100%',
    height: 220,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoCaption: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  signatureBlock: {
    marginTop: 20,
    padding: 16,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  signatureText: {
    fontSize: 10,
    color: COLORS.text,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 1.5,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 18,
    right: 40,
    fontSize: 9,
    color: COLORS.muted,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    fontSize: 9,
    color: COLORS.muted,
  },
})

export interface LaporanPenyaluranData {
  judul: string
  programLabel: string
  lokasi: string
  tanggalKirim: string
  jumlahHewan: number
  jumlahPenerima?: number | null
  deskripsi: string
  fotoUrls: string[]
  tandaTerima?: string | null
  logoUrl: string
}

function InnerHeader({ judul }: { judul: string }) {
  return (
    <View style={styles.innerHeader} fixed>
      {/* logo intentionally omitted on header for memory; brand only */}
      <Text style={styles.innerBrand}>BEYOND QURBAN</Text>
      <Text style={styles.innerHeaderRight}>{judul}</Text>
    </View>
  )
}

function PageFooter() {
  return (
    <>
      <Text
        style={styles.pageFooter}
        fixed
      >
        beyondqurban.com
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </>
  )
}

export default function LaporanPenyaluran({ data }: { data: LaporanPenyaluranData }) {
  const photoChunks: string[][] = []
  for (let i = 0; i < data.fotoUrls.length; i += 2) {
    photoChunks.push(data.fotoUrls.slice(i, i + 2))
  }

  return (
    <Document>
      {/* ---------- Cover ---------- */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverGoldBar} />
        <View style={styles.coverHeader}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={data.logoUrl} style={styles.coverLogo} />
          <Text style={styles.coverBrand}>BEYOND QURBAN</Text>
        </View>

        <View style={styles.coverDivider} />
        <Text style={styles.coverTitle}>LAPORAN PENYALURAN</Text>
        <Text style={styles.coverSubtitle}>{data.programLabel}</Text>

        <Text style={styles.coverReportTitle}>{data.judul}</Text>

        <View style={styles.coverInfoBox}>
          <View style={styles.coverInfoRow}>
            <Text style={styles.coverInfoLabel}>Lokasi</Text>
            <Text style={styles.coverInfoValue}>: {data.lokasi}</Text>
          </View>
          <View style={styles.coverInfoRow}>
            <Text style={styles.coverInfoLabel}>Tanggal</Text>
            <Text style={styles.coverInfoValue}>: {data.tanggalKirim}</Text>
          </View>
          <View style={styles.coverInfoRow}>
            <Text style={styles.coverInfoLabel}>Hewan</Text>
            <Text style={styles.coverInfoValue}>: {data.jumlahHewan} ekor</Text>
          </View>
          {data.jumlahPenerima ? (
            <View style={styles.coverInfoRow}>
              <Text style={styles.coverInfoLabel}>Penerima</Text>
              <Text style={styles.coverInfoValue}>: {data.jumlahPenerima} jiwa</Text>
            </View>
          ) : null}
        </View>

        {data.fotoUrls[0] && (
          <View style={styles.coverImageWrap}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={data.fotoUrls[0]} style={styles.coverImage} />
          </View>
        )}

        <View style={styles.coverFooter}>
          <Text>Laporan Pertanggungjawaban Penyaluran Qurban</Text>
          <Text>beyondqurban.com</Text>
        </View>
      </Page>

      {/* ---------- Narasi ---------- */}
      <Page size="A4" style={styles.page}>
        <InnerHeader judul={data.judul} />
        <Text style={styles.sectionTitle}>Laporan Pelaksanaan</Text>
        <View style={styles.sectionDivider} />

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaCardLabel}>Lokasi Penyaluran</Text>
            <Text style={styles.metaCardValue}>{data.lokasi}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaCardLabel}>Tanggal Penyaluran</Text>
            <Text style={styles.metaCardValue}>{data.tanggalKirim}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaCardLabel}>Jumlah Hewan</Text>
            <Text style={styles.metaCardValue}>{data.jumlahHewan} ekor</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaCardLabel}>Penerima Manfaat</Text>
            <Text style={styles.metaCardValue}>{data.jumlahPenerima ? `${data.jumlahPenerima} jiwa` : '-'}</Text>
          </View>
        </View>

        {data.deskripsi.split(/\n{2,}/).map((para, idx) => (
          <Text key={idx} style={styles.paragraph}>{para}</Text>
        ))}

        <PageFooter />
      </Page>

      {/* ---------- Foto ---------- */}
      {photoChunks.length > 0 && photoChunks.map((chunk, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          <InnerHeader judul={data.judul} />
          {pageIdx === 0 && (
            <>
              <Text style={styles.sectionTitle}>Dokumentasi Penyaluran</Text>
              <View style={styles.sectionDivider} />
            </>
          )}
          <View style={styles.photoGrid}>
            {chunk.map((url, i) => (
              <View key={i} style={styles.photoItem}>
                <View style={styles.photoFrame}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={url} style={styles.photoImage} />
                </View>
                <Text style={styles.photoCaption}>
                  Foto {pageIdx * 2 + i + 1}
                </Text>
              </View>
            ))}
          </View>
          <PageFooter />
        </Page>
      ))}

      {/* ---------- Tanda Terima ---------- */}
      {data.tandaTerima && (
        <Page size="A4" style={styles.page}>
          <InnerHeader judul={data.judul} />
          <Text style={styles.sectionTitle}>Bukti Serah Terima</Text>
          <View style={styles.sectionDivider} />

          <View style={[styles.photoFrame, { height: 460 }]}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={data.tandaTerima} style={styles.photoImage} />
          </View>

          <View style={styles.signatureBlock}>
            <Text style={styles.signatureText}>
              Laporan ini dibuat sebagai pertanggungjawaban penyaluran qurban kepada pequrban.
              {'\n\n'}
              Beyond Qurban — beyondqurban.com
            </Text>
          </View>

          <PageFooter />
        </Page>
      )}
    </Document>
  )
}
