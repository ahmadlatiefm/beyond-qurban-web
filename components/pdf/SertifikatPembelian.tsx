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
    padding: 28,
    fontFamily: 'NotoSans',
    color: COLORS.text,
  },
  border: {
    flex: 1,
    borderWidth: 3,
    borderColor: COLORS.gold,
    padding: 18,
    position: 'relative',
  },
  innerBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.forest,
    padding: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  logo: { width: 38, height: 38 },
  brandName: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 14,
    color: COLORS.forest,
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gold,
    marginVertical: 8,
  },
  title: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 22,
    color: COLORS.forest,
    textAlign: 'center',
    marginTop: 14,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 14,
    color: COLORS.gold,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 2,
  },
  givenTo: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 18,
  },
  nameBox: {
    marginTop: 8,
    marginHorizontal: 30,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.gold,
    backgroundColor: '#FFFDF6',
  },
  nameText: {
    fontFamily: 'NotoSans', fontWeight: 'bold',
    fontSize: 20,
    color: COLORS.forest,
    textAlign: 'center',
    letterSpacing: 1,
  },
  introText: {
    marginTop: 14,
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
  },
  detailsBlock: {
    marginTop: 10,
    paddingHorizontal: 40,
  },
  row: {
    flexDirection: 'row',
    fontSize: 11,
    color: COLORS.text,
    marginVertical: 2,
  },
  label: {
    width: 80,
    color: COLORS.muted,
  },
  value: {
    flex: 1,
    fontFamily: 'NotoSans', fontWeight: 'bold',
    color: COLORS.text,
  },
  closing: {
    marginTop: 14,
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 22,
    right: 22,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: COLORS.gold,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: COLORS.muted,
  },
})

export interface SertifikatPembelianData {
  orderNumber: string
  customerName: string
  qurbanName: string
  animalName: string
  animalWeight: number | string
  totalAmount: string
  date: string
  logoUrl: string
}

export default function SertifikatPembelian({ data }: { data: SertifikatPembelianData }) {
  return (
    <Document>
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <View style={styles.innerBorder}>
            <View style={styles.headerRow}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={data.logoUrl} style={styles.logo} />
              <Text style={styles.brandName}>BEYOND QURBAN</Text>
            </View>
            <View style={styles.divider} />

            <Text style={styles.title}>SERTIFIKAT PEMBELIAN</Text>
            <Text style={styles.subtitle}>HEWAN QURBAN</Text>

            <Text style={styles.givenTo}>Diberikan kepada:</Text>
            <View style={styles.nameBox}>
              <Text style={styles.nameText}>{data.qurbanName}</Text>
            </View>

            <Text style={styles.introText}>Telah melakukan pembelian:</Text>

            <View style={styles.detailsBlock}>
              <View style={styles.row}>
                <Text style={styles.label}>Hewan</Text>
                <Text style={styles.value}>: {data.animalName}{data.animalWeight ? ` — ${data.animalWeight} kg` : ''}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>No. Order</Text>
                <Text style={styles.value}>: {data.orderNumber}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Tanggal</Text>
                <Text style={styles.value}>: {data.date}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total</Text>
                <Text style={styles.value}>: {data.totalAmount}</Text>
              </View>
            </View>

            <Text style={styles.closing}>
              Semoga menjadi qurban yang diterima Allah SWT. Aamiin.
            </Text>

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
