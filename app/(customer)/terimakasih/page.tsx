export const dynamic = 'force-dynamic'
export const revalidate = 0
import { prisma } from '@/lib/prisma'
import TerimakasihClient from './TerimakasihClient'

export default async function TerimakasihPage({
  searchParams,
}: {
  searchParams: { order?: string }
}) {
  let paymentMethod: string | null = null
  let paymentStatus: string | null = null
  let donationType: 'qurban' | 'sedekah' | null = null
  let purchaseValue: number | null = null
  let purchaseContentId: string | null = null
  let purchaseContentName: string | null = null

  if (searchParams.order) {
    const order = await prisma.order.findFirst({
      where: { orderNumber: searchParams.order },
      select: {
        paymentMethod: true, paymentStatus: true, totalAmount: true,
        product: { select: { slug: true, name: true } },
      },
    })
    if (order) {
      paymentMethod = order.paymentMethod
      paymentStatus = order.paymentStatus
      purchaseValue = order.totalAmount
      purchaseContentId = order.product?.slug ?? null
      purchaseContentName = order.product?.name ?? null
    } else {
      const donation = await prisma.donation.findFirst({
        where: { orderNumber: searchParams.order },
        select: {
          paymentMethod: true,
          paymentStatus: true,
          donationType: true,
          totalAmount: true,
          campaign: { select: { programType: true, slug: true, title: true } },
        },
      })
      if (donation) {
        paymentMethod = donation.paymentMethod
        paymentStatus = donation.paymentStatus
        purchaseValue = donation.totalAmount
        purchaseContentId = donation.campaign?.slug ?? null
        purchaseContentName = donation.campaign?.title ?? null
        const resolved = donation.donationType
          || (donation.campaign.programType === 'sedekah' ? 'sedekah' : 'qurban')
        donationType = resolved === 'sedekah' ? 'sedekah' : 'qurban'
      }
    }
  }

  return (
    <TerimakasihClient
      paymentMethod={paymentMethod}
      paymentStatus={paymentStatus}
      donationType={donationType}
      purchaseValue={purchaseValue}
      purchaseContentId={purchaseContentId}
      purchaseContentName={purchaseContentName}
    />
  )
}
