import crypto from 'crypto'

/**
 * Verify a Tripay callback signature.
 * Tripay signs callbacks with HMAC-SHA256(privateKey, rawBody).
 */
export function verifyTripayCallback(
  privateKey: string,
  rawBody: string,
  signatureHeader: string
): boolean {
  const expected = crypto
    .createHmac('sha256', privateKey)
    .update(rawBody)
    .digest('hex')
  return expected === signatureHeader
}
