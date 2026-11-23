import { NextRequest, NextResponse } from 'next/server';
import { verifyServerCoupon, redeemServerCoupon } from '@/lib/orders/server-orders';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { code, action = 'verify', redeemedBy = 'Staff' } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    if (action === 'redeem') {
      const result = await redeemServerCoupon(code, redeemedBy);
      return NextResponse.json(result);
    } else {
      const result = await verifyServerCoupon(code);
      return NextResponse.json(result);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
