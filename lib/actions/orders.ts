'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { calculateShipping } from '@/lib/shipping'
import { DeliveryMethod, OrderStatus } from '@prisma/client'
import { createTripayTransaction } from '@/lib/tripay'
import { sendOrderNotification } from '@/lib/onesender'
import { sendFbCapiEvent } from '@/lib/facebook-capi'

const OrderSchema = z.object({
  productId: z.string().min(1),
  quantity: z.literal(1),
  customerName: z.string().min(2).max(100),
  phone: z.string().min(9).max(16),
  whatsapp: z.string().min(9).max(16),
  deliveryMethod: z.nativeEnum(DeliveryMethod),
  address: z.string().optional(),
  kelurahan: z.string().optional(),
  kecamatan: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  deliveryNotes: z.string().optional(),
  sacrificeDate: z.string().min(1),
  deliveryDate: z.string().optional(),
  notes: z.string().max(500).optional(),
}).refine((data) => {
  if (data.deliveryMethod === 'HOME_DELIVERY') {
    return !!data.address && !!data.city && !!data.province
  }
  return true
}, { message: 'Alamat wajib diisi untuk pengiriman ke rumah', path: ['address'] })

async function generateOrderNumber(): Promise<string> {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const count = await prisma.order.count()
  const seq = String(count + 1).padStart(4, '0')
  return `ORD-${dateStr}-${seq}`
}

export async function createOrder(formData: unknown) {
  const parsed = OrderSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const data = parsed.data

  const product = await prisma.product.findUnique({ where: { id: data.productId } })
  if (!product) return { error: 'Produk tidak ditemukan.' }
  if (product.stock < 1) return { error: 'Stok produk habis.' }

  if (data.deliveryMethod === 'HOME_DELIVERY' && !product.allowHomeDelivery) {
    return { error: 'Produk ini tidak mendukung pengiriman ke rumah.' }
  }

  const shippingCost =
    data.deliveryMethod === 'HOME_DELIVERY' && data.city
      ? calculateShipping(data.city)
      : 0

  const totalAmount = product.price * data.quantity + shippingCost
  const orderNumber = await generateOrderNumber()

  try {
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: data.customerName,
        phone: data.phone,
        whatsapp: data.whatsapp,
        deliveryMethod: data.deliveryMethod,
        qurbanLocation: product.qurbanLocation,
        address: data.address,
        kelurahan: data.kelurahan,
        kecamatan: data.kecamatan,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        deliveryNotes: data.deliveryNotes,
        sacrificeDate: new Date(data.sacrificeDate),
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        notes: data.notes,
        productId: data.productId,
        quantity: data.quantity,
        shippingCost,
        totalAmount,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
      },
    })

    await prisma.customer.upsert({
      where: { phone: data.phone },
      update: { name: data.customerName, whatsapp: data.whatsapp, city: data.city ?? '' },
      create: {
        name: data.customerName,
        phone: data.phone,
        whatsapp: data.whatsapp,
        city: data.city ?? '',
      },
    })

    // FB CAPI InitiateCheckout
    void sendFbCapiEvent('InitiateCheckout', {
      phone: data.phone,
      customerName: data.customerName,
      value: totalAmount,
      contentIds: [data.productId],
      contentName: product.name,
    })

    // WA notifications — fire-and-forget
    void sendOrderNotification('order_created_customer', {
      customerName: data.customerName,
      whatsapp: data.whatsapp,
      orderNumber,
      productName: product.name,
      totalAmount,
    })
    void sendOrderNotification('order_created_admin', {
      customerName: data.customerName,
      whatsapp: data.whatsapp,
      orderNumber,
      productName: product.name,
      totalAmount,
    })

    // Create Tripay transaction
    const expiredTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60

    const tripayResult = await createTripayTransaction({
      merchantRef: order.orderNumber,
      amount: order.totalAmount,
      customerName: data.customerName,
      customerEmail: `${data.whatsapp.replace(/\D/g, '')}@wa.beyond-qurban.id`,
      customerPhone: data.phone,
      orderItems: [{ name: product.name, price: product.price, quantity: data.quantity }],
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/lacak?order=${order.orderNumber}`,
      expiredTime,
    })

    if (tripayResult.success && tripayResult.data) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          tripayReference: tripayResult.data.reference,
          tripayPaymentUrl: tripayResult.data.payment_url,
        },
      })
      return {
        success: true,
        order: {
          ...order,
          tripayPaymentUrl: tripayResult.data.payment_url,
        },
      }
    }

    revalidatePath('/admin/pesanan')
    return { success: true, order }
  } catch {
    return { error: 'Gagal membuat pesanan. Coba lagi.' }
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { product: true },
    })

    if (status === 'SHIPPED') {
      void sendOrderNotification('shipping_customer', {
        customerName: order.customerName,
        whatsapp: order.whatsapp,
        orderNumber: order.orderNumber,
        productName: order.product.name,
        totalAmount: order.totalAmount,
        status,
      })
    } else if (status !== 'CANCELLED') {
      void sendOrderNotification('status_updated_customer', {
        customerName: order.customerName,
        whatsapp: order.whatsapp,
        orderNumber: order.orderNumber,
        productName: order.product.name,
        totalAmount: order.totalAmount,
        status,
      })
    }

    revalidatePath('/admin/pesanan')
    return { success: true, order }
  } catch {
    return { error: 'Gagal update status pesanan.' }
  }
}
