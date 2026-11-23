import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_CATEGORIES, INITIAL_FOOD_ITEMS } from '@/lib/data/seed-menu';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const availableOnly = searchParams.get('availableOnly') === 'true';

    let items = INITIAL_FOOD_ITEMS;
    if (availableOnly) {
      items = items.filter(i => i.isAvailable);
    }

    return NextResponse.json({
      success: true,
      categories: INITIAL_CATEGORIES,
      items,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
