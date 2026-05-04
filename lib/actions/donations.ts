'use server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

export async function createDonation(formData: FormData) {
  const campaignSlug = formData.get('campaignSlug') as string
  const customerName = formData.get('customerName') as string
  const whatsapp = formData.get('whatsapp') as string
  const quantity = parseInt(formData.get('quantity') as string) || 1
  const paymentMethod = formData.get('paymentMethod') as string

  if (!campaignSlug || !customerName || !whatsapp) {
    throw new Error('Data tidak lengkap')
  }

  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug } })
  if (!campaign) throw new Error('Campaign tidak ditemukan')

  const totalAmount = campaign.price * quantity
  const orderNumber = generateOrderNumber()

  const donation = await prisma.donation.create({
    data: {
      orderNumber,
      campaignId: campaign.id,
      customerName,
      phone: whatsapp,
      whatsapp,
      quantity,
      totalAmount,
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      paymentStatus: 'UNPAID',
      status: 'PENDING',
    },
  })

  redirect(`/penyaluran/pembayaran?order=${donation.orderNumber}`)
}
