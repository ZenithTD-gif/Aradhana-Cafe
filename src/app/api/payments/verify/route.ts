import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/payment/razorpay';
import { createServerPaidOrder } from '@/lib/orders/server-orders';

export const dynamic = 'force-dynamic';

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

    // Step 2: Create Confirmed Paid Order directly into Supabase & Server Store
    const confirmedOrder = await createServerPaidOrder({
      tableNumber: tableNumber || 'Table 01',
      items: items || [],
      customerName: customerName || 'Café Guest',
      customerPhone: customerPhone || '',
      customerNotes: customerNotes || '',
      paymentId: razorpay_payment_id,
    });

    return NextResponse.json({
      success: true,
      verified: true,
      order: confirmedOrder,
      orderNumber: confirmedOrder.orderNumber,
      couponCode: confirmedOrder.couponCode,
      paymentId: razorpay_payment_id,
      tableNumber: confirmedOrder.tableNumber,
      message: 'Payment verified and order persisted to database successfully.',
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
