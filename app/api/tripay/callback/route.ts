import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTripayCallback } from '@/lib/tripay'
import { sendOrderNotification } from '@/lib/onesender'
import { sendFbCapiEvent } from '@/lib/facebook-capi'
import { createPengirimanFromPaidOrder } from '@/lib/order-to-pengiriman'

type TripayCallbackPayload = {
  reference: string
  merchant_ref: string
  payment_method: string
  total_amount: number
  status: 'PAID' | 'UNPAID' | 'EXPIRED' | 'REFUNDED'
}

export async function POST(req: NextRequest) {
  const signatureHeader = req.headers.get('X-Callback-Signature') ?? ''
  const rawBody = await req.text()

  const row = await prisma.settings.findUnique({ where: { key: 'tripay_private_key' } })
  const privateKey = row?.value ?? ''

  if (!verifyTripayCallback(privateKey, rawBody, signatureHeader)) {
    return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 })
  }

  let payload: TripayCallbackPayload
  try {
    payload = JSON.parse(rawBody) as TripayCallbackPayload
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: payload.merchant_ref },
    include: { product: true },
  })

  if (!order) {
    return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
  }

  if (payload.status === 'PAID') {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: payload.payment_method,
        status: 'CONFIRMED',
        tripayReference: payload.reference,
      },
    })

    // Auto-create Pengiriman record for HOME_DELIVERY + send form link via WA
    void createPengirimanFromPaidOrder(order.id)

    // WA notifications
    void sendOrderNotification('payment_confirmed_customer', {
      customerName: order.customerName,
      whatsapp: order.whatsapp,
      orderNumber: order.orderNumber,
      productName: order.product.name,
      totalAmount: order.totalAmount,
    })
    void sendOrderNotification('payment_confirmed_admin', {
      customerName: order.customerName,
      whatsapp: order.whatsapp,
      orderNumber: order.orderNumber,
      productName: order.product.name,
      totalAmount: order.totalAmount,
    })

    // FB CAPI Purchase
    const capiTriggerRow = await prisma.settings.findUnique({
      where: { key: 'fb_capi_purchase_trigger' },
    })
    const capiTrigger = capiTriggerRow?.value ?? 'tripay_callback'

    if (capiTrigger === 'tripay_callback' || capiTrigger === 'both') {
      void sendFbCapiEvent('Purchase', {
        phone: order.phone,
        customerName: order.customerName,
        value: order.totalAmount,
        contentIds: [order.productId],
        contentName: order.product.name,
      })
    }
  } else if (payload.status === 'EXPIRED') {
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'EXPIRED' } })
  } else if (payload.status === 'REFUNDED') {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'REFUNDED', status: 'CANCELLED' },
    })
  }

  return NextResponse.json({ success: true })
}
