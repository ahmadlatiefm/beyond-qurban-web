'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { calculateShipping } from '@/lib/shipping'
import { generateOrderNumber } from '@/lib/utils'

export async function createOrder(formData: FormData) {
  const slug = formData.get('slug') as string
  const customerName = formData.get('customerName') as string
  const whatsapp = formData.get('whatsapp') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const deliveryDateStr = formData.get('deliveryDate') as string
  const notes = formData.get('notes') as string
  const paymentMethod = formData.get('paymentMethod') as string

  if (!slug || !customerName || !whatsapp || !paymentMethod) {
    throw new Error('Data tidak lengkap — pastikan semua field wajib terisi')
  }

  const product = await prisma.product.findUnique({ where: { slug } })
  if (!product) throw new Error('Produk tidak ditemukan')

  const shippingCost = city ? calculateShipping(city) : 0
  const totalAmount = product.price + shippingCost
  const orderNumber = generateOrderNumber()

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName,
      phone: whatsapp,
      whatsapp,
      deliveryMethod: address ? 'HOME_DELIVERY' : 'ONE_UMMAH',
      qurbanLocation: product.qurbanLocation,
      address: address || null,
      city: city || null,
      notes: notes || null,
      sacrificeDate: new Date('2025-06-17'),
      deliveryDate: deliveryDateStr ? new Date(deliveryDateStr) : null,
      productId: product.id,
      quantity: 1,
      shippingCost,
      totalAmount,
      paymentMethod,
      paymentStatus: 'UNPAID',
      status: 'PENDING',
    },
  })

  // Create Tripay transaction
  try {
    const { createTripayTransaction, getDemoPaymentData } = await import('@/lib/tripay')
    let tripayData = await createTripayTransaction({
      method: paymentMethod,
      merchantRef: order.orderNumber,
      amount: order.totalAmount,
      customerName: order.customerName,
      customerPhone: order.whatsapp,
      productName: product.name,
    })
    if (!tripayData) {
      tripayData = getDemoPaymentData(paymentMethod, order.totalAmount, order.orderNumber) as any
    }
    await prisma.order.update({
      where: { id: order.id },
      data: {
        tripayReference: tripayData?.pay_code ?? (tripayData as any)?.reference ?? null,
        tripayPaymentUrl: (tripayData as any)?.checkout_url ?? null,
      },
    })
  } catch (err) {
    console.error('[Order] Tripay error (non-fatal):', err)
  }

  revalidatePath('/admin/pesanan')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/konfirmasi')
  redirect(`/checkout/pembayaran?order=${order.orderNumber}`)
}

export async function updateOrderStatus(id: string, status: string) {
  await prisma.order.update({
    where: { id },
    data: { status: status as any },
  })
  revalidatePath('/admin/pesanan')
}

export async function confirmPayment(id: string) {
  await prisma.order.update({
    where: { id },
    data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
  })
  revalidatePath('/admin/konfirmasi')
  revalidatePath('/admin/pesanan')
}

export async function rejectPayment(id: string) {
  await prisma.order.update({
    where: { id },
    data: { paymentStatus: 'EXPIRED', status: 'CANCELLED' },
  })
  revalidatePath('/admin/konfirmasi')
}
