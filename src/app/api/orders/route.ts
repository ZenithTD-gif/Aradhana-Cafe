import { NextRequest, NextResponse } from 'next/server';
import { 
  getServerOrders, 
  createServerPaidOrder, 
  updateServerOrderStatus, 
  acknowledgeServerOrder 
} from '@/lib/orders/server-orders';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const orders = await getServerOrders();
    return NextResponse.json({
      success: true,
      orders,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('API /api/orders GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableNumber, items, customerName, customerPhone, customerNotes, paymentId } = body;

    if (!tableNumber || !items || items.length === 0) {
      return NextResponse.json({ error: 'tableNumber and items are required' }, { status: 400 });
    }

    const order = await createServerPaidOrder({
      tableNumber,
      items,
      customerName,
      customerPhone,
      customerNotes,
      paymentId: paymentId || `pay_${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error('API /api/orders POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, status, acknowledgeRole, role } = body;
    const ackRole = (acknowledgeRole || role) as 'admin' | 'kitchen' | undefined;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    if (ackRole) {
      await acknowledgeServerOrder(orderId, ackRole);
    }

    if (status) {
      await updateServerOrderStatus(orderId, status);
    }

    const allOrders = await getServerOrders();
    const updatedOrder = allOrders.find(o => o.id === orderId || o.orderNumber === orderId);

    return NextResponse.json({
      success: true,
      orderId,
      status: updatedOrder?.status || status,
      order: updatedOrder,
      acknowledged: Boolean(ackRole),
    });
  } catch (error: any) {
    console.error('API /api/orders PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}
