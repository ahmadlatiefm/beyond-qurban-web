export type NotificationTemplate =
  | 'payment_confirmed_customer'
  | 'payment_confirmed_admin'
  | 'order_shipped'
  | 'order_completed'

export type NotificationPayload = {
  customerName: string
  whatsapp: string
  orderNumber: string
  productName: string
  totalAmount: number
  [key: string]: unknown
}

/**
 * Send a WhatsApp notification via Onesender.
 * Reads API credentials from the Settings table at call time.
 */
export async function sendOrderNotification(
  template: NotificationTemplate,
  payload: NotificationPayload
): Promise<void> {
  // TODO: implement Onesender API integration
  console.log('[onesender] sendOrderNotification', template, payload)
}
