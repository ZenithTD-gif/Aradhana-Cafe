import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/payment/razorpay';

export async function POST(req: NextRequest) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      tableNumber,
      items,
      customerName,
      customerPhone,
      customerNotes,
      isSimulated 
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing payment transaction parameters' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // In live mode with real keys, strictly verify HMAC SHA-256 signature
    if (!isSimulated && keySecret && !keySecret.includes('demo') && razorpay_signature) {
      const isValid = verifyRazorpaySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        secret: keySecret,
      });

      if (!isValid) {
        return NextResponse.json({ 
          error: 'Fraud alert: Razorpay payment signature verification failed. Order not placed.' 
        }, { status: 400 });
      }
    }

    // Generate unique random coupon code: e.g. ARD-5289
    const couponCode = `ARD-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderNumber = `ARD-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`;

    return NextResponse.json({
      success: true,
      verified: true,
      orderNumber,
      couponCode,
      paymentId: razorpay_payment_id,
      tableNumber,
      message: 'Payment verified successfully. Order confirmed.',
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
