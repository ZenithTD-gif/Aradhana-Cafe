import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { code, action = 'verify', redeemedBy = 'Staff' } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: code.trim().toUpperCase(),
      message: 'Coupon query received',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
