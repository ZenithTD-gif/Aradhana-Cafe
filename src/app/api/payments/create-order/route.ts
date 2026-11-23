import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'INR', tableNumber, customerNotes } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Check if real live/test Razorpay API credentials are configured
    const isLiveConfigured = 
      keyId && 
      keySecret && 
      !keyId.includes('placeholder') && 
      !keyId.includes('demo');

    if (isLiveConfigured) {
      // Call official Razorpay Orders API
      const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Razorpay uses paise
          currency,
          receipt: `rcpt_ard_${Date.now()}`,
          notes: {
            table: tableNumber || 'Unassigned',
            customerNotes: customerNotes || '',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json({ error: errorData.error?.description || 'Razorpay order creation failed' }, { status: 400 });
      }

      const orderData = await response.json();
      return NextResponse.json({
        success: true,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        key: keyId,
        isSimulated: false,
      });
    }

    // High fidelity test mode order for instant local testing & demonstration
    const mockOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return NextResponse.json({
      success: true,
      orderId: mockOrderId,
      amount: Math.round(amount * 100),
      currency: 'INR',
      key: keyId || 'rzp_test_aradhana_demo',
      isSimulated: true,
      tableNumber,
    });
  } catch (error: any) {
    console.error('Create payment order error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
