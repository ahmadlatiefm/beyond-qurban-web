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
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: 32,
    fontFamily: 'NotoSans',
    color: COLORS.text,
  },
  outer: {
    flex: 1,
    borderWidth: 4,
    borderColor: COLORS.gold,
    padding: 14,
  },
  inner: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.forest,
    padding: 26,
    alignItems: 'center',
  },
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 6,
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gold,
  },
  ornamentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
    marginHorizontal: 6,
  },
  logo: {
    width: 64,
    height: 64,
    marginTop: 4,
    marginBottom: 8,
  },
  brandName: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 11,
    color: COLORS.forest,
    letterSpacing: 3,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 26,
    color: COLORS.forest,
    textAlign: 'center',
    marginTop: 14,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 14,
    color: COLORS.gold,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 4,
  },
  givenTo: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 24,
  },
  recipientName: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 26,
    color: COLORS.forest,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 1,
  },
  underline: {
    height: 2,
    width: 220,
    backgroundColor: COLORS.gold,
    marginTop: 8,
    marginBottom: 18,
  },
  forName: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
  },
  forNameValue: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 14,
    color: COLORS.forest,
    textAlign: 'center',
    marginTop: 3,
  },
  introText: {
    marginTop: 18,
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
  },
  amountText: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.forest,
    textAlign: 'center',
    marginTop: 6,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 10,
  },
  locationValue: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 13,
    color: COLORS.gold,
    textAlign: 'center',
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 18,
    paddingHorizontal: 30,
    fontSize: 10,
    color: COLORS.muted,
  },
  metaCol: {
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    color: COLORS.muted,
  },
  metaValue: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 11,
    color: COLORS.forest,
    marginTop: 2,
  },
  ayatBox: {
    marginTop: 18,
    paddingTop: 14,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderColor: COLORS.gold,
    width: '100%',
  },
  ayatArabic: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 13,
    color: COLORS.forest,
    textAlign: 'center',
  },
  ayatTrans: {
    fontStyle: 'italic',
    fontSize: 10,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 4,
  },
  ayatRef: {
    fontSize: 9,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 3,
  },
  footer: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: COLORS.gold,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: COLORS.muted,
  },
})

export interface SertifikatQurbanData {
  certificateNumber: string
  donorName: string
  qurbanName: string
  animalType: string
  quantity: number
  campaignTitle: string
  campaignLocation: string
  date: string
  logoUrl: string
}

function Ornament() {
  return (
    <View style={styles.ornamentRow}>
      <View style={styles.ornamentLine} />
      <View style={styles.ornamentDot} />
      <View style={styles.ornamentDot} />
      <View style={styles.ornamentDot} />
      <View style={styles.ornamentLine} />
    </View>
  )
}

export default function SertifikatQurban({ data }: { data: SertifikatQurbanData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.outer}>
          <View style={styles.inner}>
            <Ornament />
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={data.logoUrl} style={styles.logo} />
            <Text style={styles.brandName}>BEYOND QURBAN</Text>

            <Text style={styles.title}>SERTIFIKAT QURBAN</Text>
            <Text style={styles.subtitle}>PELOSOK NEGERI 1446 H</Text>

            <Ornament />

            <Text style={styles.givenTo}>Diberikan kepada:</Text>
            <Text style={styles.recipientName}>{data.donorName}</Text>
            <View style={styles.underline} />

            <Text style={styles.forName}>Atas nama qurban:</Text>
            <Text style={styles.forNameValue}>{data.qurbanName}</Text>

            <Text style={styles.introText}>Telah berqurban:</Text>
            <Text style={styles.amountText}>{data.quantity} ekor {data.animalType}</Text>

            <Text style={styles.locationText}>yang disalurkan di:</Text>
            <Text style={styles.locationValue}>{data.campaignLocation}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Tanggal</Text>
                <Text style={styles.metaValue}>{data.date}</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>No. Sertifikat</Text>
                <Text style={styles.metaValue}>{data.certificateNumber}</Text>
              </View>
            </View>

            <View style={styles.ayatBox}>
              <Text style={styles.ayatArabic}>{'وَلِكُلِّ أُمَّةٍ جَعَلْنَا مَنسَكًا'}</Text>
              <Text style={styles.ayatTrans}>
                &quot;Dan bagi tiap-tiap umat telah Kami syariatkan penyembelihan qurban&quot;
              </Text>
              <Text style={styles.ayatRef}>(QS. Al-Hajj: 34)</Text>
            </View>

            <View style={styles.footer}>
              <Text>Beyond Qurban</Text>
              <Text>beyondqurban.com</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
