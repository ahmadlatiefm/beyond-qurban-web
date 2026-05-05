import HeaderWrapper from '@/components/layout/HeaderWrapper'
import Footer from '@/components/layout/Footer'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeaderWrapper />
      <main>{children}</main>
      <Footer />
    </>
  )
}
