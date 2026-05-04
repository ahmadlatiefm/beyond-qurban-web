'use server'
import { redirect } from 'next/navigation'
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
    throw new Error('Data tidak lengkap')
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

  redirect(`/checkout/pembayaran?order=${order.orderNumber}`)
}
