export type FbCapiEventName = 'Purchase' | 'InitiateCheckout' | 'Lead' | 'ViewContent'

export type FbCapiEventData = {
  phone?: string | null
  customerName?: string
  value?: number
  contentIds?: string[]
  contentName?: string
  [key: string]: unknown
}

/**
 * Send a Facebook Conversions API (CAPI) event.
 * Reads pixel ID and access token from the Settings table at call time.
 */
export async function sendFbCapiEvent(
  eventName: FbCapiEventName,
  data: FbCapiEventData
): Promise<void> {
  // TODO: implement Facebook CAPI integration
  console.log('[facebook-capi] sendFbCapiEvent', eventName, data)
}
