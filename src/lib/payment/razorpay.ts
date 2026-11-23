import crypto from 'crypto';

/**
 * Server-side trusted Razorpay signature verifier
 * Ensures no frontend forged payment success can create a confirmed order
 */
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}): boolean {
  try {
    const body = `${params.orderId}|${params.paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', params.secret)
      .update(body)
      .digest('hex');

    return expectedSignature === params.signature;
  } catch (error) {
    console.error('Razorpay signature verification error:', error);
    return false;
  }
}

/**
 * Verifies Razorpay Webhook Signature
 */
export function verifyRazorpayWebhook(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}
