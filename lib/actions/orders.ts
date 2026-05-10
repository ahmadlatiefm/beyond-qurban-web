'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { calculateShipping, parseShippingZones } from '@/lib/shipping'
import { formatCurrency, formatDate, generateOrderNumber } from '@/lib/utils'
import { applyGlobalDiscount, applyCategoryDiscount, applyVoucher } from '@/lib/discount'
import { sendWhatsApp, sendWhatsAppImage, toAbsoluteUrl, renderTemplate } from '@/lib/onesender'
import { resolvePaymentInfo } from '@/lib/payment-info'
import { sendCapiEvent } from '@/lib/meta-conversion'

const DEFAULT_FIRST_PRODUCT = `Halo Kak {{nama}}, 👋\n\nTerima kasih telah memesan kurban di *Beyond Qurban* 🐑\n\nBerikut detail pesanan Anda:\n📋 No. Pesanan: *{{nomor_pesanan}}*\n🐑 Produk: {{produk}}\n💰 Total: *{{total}}*\n🚚 Jadwal Kirim: {{tanggal_kirim}}\n💳 Metode: {{metode_bayar}}\n🏦 Rekening: {{rekening}}\n\nSegera selesaikan pembayaran Anda ya, Kak!\n\n_Beyond Qurban — Amanah & Berkualitas_`

export async function createOrder(formData: FormData) {
  const slug = formData.get('slug') as string
  const customerName = formData.get('customerName') as string
  const whatsapp = formData.get('whatsapp') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const deliveryDateStr = formData.get('deliveryDate') as string
  const notes = formData.get('notes') as string
  const paymentMethod = formData.get('paymentMethod') as string
  const voucherCode = (formData.get('voucherCode') as string | null) ?? ''

  if (!slug || !customerName || !whatsapp || !paymentMethod) {
    throw new Error('Data tidak lengkap — pastikan semua field wajib terisi')
  }

  const product = await prisma.product.findUnique({ where: { slug } })
  if (!product) throw new Error('Produk tidak ditemukan')
  if (product.stock < 1) {
    throw new Error('Stok tidak tersedia. Silakan pilih produk lain.')
  }

  // Read discount + shipping settings from DB
  const discSettings = await prisma.settings.findMany({
    where: {
      key: {
        in: [
          'diskon_global_enabled','diskon_type','diskon_value','diskon_start','diskon_end',
          'vouchers','shipping_zones',
          'disc_sapi','disc_kambing','disc_domba','disc_unta',
          'disc_sapi_until','disc_kambing_until','disc_domba_until','disc_unta_until',
          'discount_category_sapi_active','discount_category_kambing_active','discount_category_domba_active','discount_category_unta_active',
        ],
      },
    },
  })
  const discMap: Record<string, string> = {}
  discSettings.forEach(s => { discMap[s.key] = s.value })

  const zones = parseShippingZones(discMap.shipping_zones)
  const shippingCost = city ? calculateShipping(city, zones) : 0
  const basePrice = product.price
  const { finalPrice: afterGlobal } = applyGlobalDiscount(basePrice, discMap)
  const { finalPrice: discountedPrice } = applyCategoryDiscount(afterGlobal, product.category, discMap)
  const subtotal = discountedPrice + shippingCost
  const { discountAmount: voucherDiscount } = applyVoucher(discMap.vouchers, voucherCode, subtotal)
  const totalAmount = subtotal - voucherDiscount
  const orderNumber = generateOrderNumber()

  // Atomically decrement stock and create the order in a single transaction.
  // updateMany with a stock>=1 guard prevents overselling under concurrent checkout.
  const order = await prisma.$transaction(async (tx) => {
    const upd = await tx.product.updateMany({
      where: { id: product.id, stock: { gte: 1 } },
      data: { stock: { decrement: 1 } },
    })
    if (upd.count === 0) {
      throw new Error('Stok tidak tersedia. Silakan pilih produk lain.')
    }
    return tx.order.create({
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
  })

  // Skip Tripay for manual transfers and manual QRIS — they're handled by admin verification
  const isManual = paymentMethod === 'MANUAL_TRANSFER' || paymentMethod === 'MANUAL_QRIS' || paymentMethod.startsWith('MANUAL_')
  if (!isManual) {
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
  }

  // Fire WA "first message" — non-blocking on errors so checkout never fails
  // because of OneSender. Skipped silently if disabled in pengaturan.
  try {
    const payInfo = await resolvePaymentInfo(paymentMethod)
    const totalFmt = formatCurrency(order.totalAmount)
    const appUrl = (process.env.NEXTAUTH_URL ?? '').replace(/\/+$/, '')

    if (payInfo.isManualQris && payInfo.qrisImageUrl) {
      // Single image-with-caption — no separate text. The QR image *is* the message.
      const caption = `Halo Kak ${customerName}, 🤝\nJazakallah khairan telah berqurban melalui *Beyond Qurban* 🐑\n\nDetail pesanan Anda:\n📋 No. Pesanan: *${order.orderNumber}*\n🐑 Produk/Program: ${product.name}\n💰 Total: *${totalFmt}*\n\n🔲 *QR Code Pembayaran Beyond Qurban*\nScan QR di atas → masukkan nominal *${totalFmt}* → bayar\n\nSetelah bayar, upload bukti di:\n${appUrl}/checkout/pembayaran?order=${order.orderNumber}\n\n_Beyond Qurban — Amanah & Berkualitas_`
      await sendWhatsAppImage(whatsapp, toAbsoluteUrl(payInfo.qrisImageUrl), caption)
    } else {
      const tplRow = await prisma.settings.findUnique({ where: { key: 'msg_first' } })
      const tpl = tplRow?.value || DEFAULT_FIRST_PRODUCT
      const message = renderTemplate(tpl, {
        nama: customerName,
        nomor_pesanan: order.orderNumber,
        produk: product.name,
        total: totalFmt,
        tanggal_kirim: order.deliveryDate ? formatDate(order.deliveryDate) : '-',
        metode_bayar: payInfo.label,
        rekening: payInfo.account,
      })
      await sendWhatsApp(whatsapp, message)
    }
  } catch (err) {
    console.error('[Order] OneSender first-message failed (non-fatal):', err)
  }

  // Meta Conversions API — Purchase event. orderNumber doubles as event_id
  // so the browser pixel call on /terimakasih dedupes against this server event.
  try {
    await sendCapiEvent('Purchase', {
      eventId: order.orderNumber,
      eventSourceUrl: `${process.env.NEXTAUTH_URL ?? ''}/terimakasih?order=${order.orderNumber}&type=regular`,
      userData: { phone: whatsapp },
      customData: {
        currency: 'IDR',
        value: order.totalAmount,
        content_ids: [product.slug],
        content_name: product.name,
        content_type: 'product',
        num_items: 1,
        order_id: order.orderNumber,
      },
    })
  } catch (err) {
    console.error('[Order] Meta CAPI Purchase failed (non-fatal):', err)
  }

  revalidatePath('/admin/pesanan')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/konfirmasi')
  revalidatePath('/admin/produk')
  revalidatePath('/katalog')
  revalidatePath(`/produk/${product.slug}`)
  redirect(`/checkout/pembayaran?order=${order.orderNumber}`)
}

export async function updateOrderStatus(id: string, status: string) {
  await prisma.order.update({
    where: { id },
    data: { status: status as any },
  })
  revalidatePath('/admin/pesanan')
  revalidatePath('/lacak-pesanan')  // refresh customer tracking page
}

export async function confirmPayment(id: string) {
  await prisma.order.update({
    where: { id },
    data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
  })
  // Auto-create Pengiriman record for HOME_DELIVERY orders + send form link.
  // Imported lazily to avoid pulling onesender/prisma chain into modules that
  // don't need it.
  const { createPengirimanFromPaidOrder } = await import('@/lib/order-to-pengiriman')
  void createPengirimanFromPaidOrder(id)
  revalidatePath('/admin/konfirmasi')
  revalidatePath('/admin/pesanan')
  revalidatePath('/admin/pengiriman')
}

export async function rejectPayment(id: string) {
  await prisma.order.update({
    where: { id },
    data: { paymentStatus: 'EXPIRED', status: 'CANCELLED' },
  })
  revalidatePath('/admin/konfirmasi')
}

export async function deleteOrders(ids: string[]) {
  if (!ids.length) return { count: 0 }
  const result = await prisma.order.deleteMany({ where: { id: { in: ids } } })
  revalidatePath('/admin/pesanan')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/konfirmasi')
  return { count: result.count }
}
