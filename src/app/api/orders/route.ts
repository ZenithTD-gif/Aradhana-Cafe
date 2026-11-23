import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    system: 'Aradhana Cafe Orders API',
    timestamp: new Date().toISOString(),
  });
}
