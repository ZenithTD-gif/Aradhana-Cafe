import { Order, OrderStatus, OrderItem, Coupon } from '@/types';
import { supabaseServer } from '@/lib/supabase/server';
import crypto from 'crypto';

// In-memory persistent server cache on globalThis across API requests
declare global {
  var __aradhana_server_orders__: Order[] | undefined;
  var __aradhana_server_coupons__: Coupon[] | undefined;
}

if (!globalThis.__aradhana_server_orders__) {
  globalThis.__aradhana_server_orders__ = [];
}
if (!globalThis.__aradhana_server_coupons__) {
  globalThis.__aradhana_server_coupons__ = [];
}

const serverOrders = globalThis.__aradhana_server_orders__;
const serverCoupons = globalThis.__aradhana_server_coupons__;

export async function createServerPaidOrder(params: {
  tableNumber: string;
  items: {
    foodItemId?: string;
    itemName?: string;
    name?: string;
    unitPrice?: number;
    price?: number;
    quantity: number;
    specialNotes?: string;
    imageUrl?: string;
    isVeg?: boolean;
    foodItem?: any;
  }[];
  customerName?: string;
  customerPhone?: string;
  customerNotes?: string;
  paymentId: string;
}): Promise<Order> {
  const orderId = crypto.randomUUID();
  const orderNum = `ARD-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`;
  const couponCode = `ARD-${Math.floor(1000 + Math.random() * 9000)}`;

  const normalizedItems = params.items.map(it => {
    const unitPrice = Number(it.unitPrice ?? it.price ?? it.foodItem?.price ?? 0);
    const quantity = Number(it.quantity || 1);
    return {
      id: crypto.randomUUID(),
      orderId,
      foodItemId: it.foodItemId || (it as any).id || it.foodItem?.id || '',
      itemName: it.itemName || it.name || it.foodItem?.name || 'Dish',
      unitPrice,
      quantity,
      totalPrice: unitPrice * quantity,
      specialNotes: it.specialNotes || (it as any).notes || '',
      imageUrl: it.imageUrl || it.foodItem?.imageUrl || '',
      isVeg: Boolean(it.isVeg ?? it.foodItem?.isVeg ?? true),
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = Number((subtotal * 0.05).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));

  const newOrder: Order = {
    id: orderId,
    orderNumber: orderNum,
    tableNumber: params.tableNumber,
    status: 'paid',
    customerName: params.customerName || 'Café Guest',
    customerPhone: params.customerPhone || '',
    customerNotes: params.customerNotes || '',
    subtotal,
    taxAmount,
    totalAmount,
    paymentStatus: 'successful',
    acknowledgedByAdmin: false,
    acknowledgedByKitchen: false,
    couponCode,
    isCouponRedeemed: false,
    items: normalizedItems,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const newCoupon: Coupon = {
    id: crypto.randomUUID(),
    couponCode,
    orderId,
    orderNumber: orderNum,
    tableNumber: params.tableNumber,
    totalAmount,
    isRedeemed: false,
    createdAt: new Date().toISOString(),
  };

  // 1. Save in server cache immediately
  serverOrders.unshift(newOrder);
  serverCoupons.unshift(newCoupon);

  // 2. Persist to Supabase PostgreSQL database
  if (supabaseServer) {
    try {
      const { error: orderError } = await supabaseServer.from('orders').insert({
        id: orderId,
        order_number: orderNum,
        table_number: params.tableNumber,
        status: 'paid',
        customer_name: newOrder.customerName,
        customer_phone: newOrder.customerPhone,
        customer_notes: newOrder.customerNotes,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_status: 'successful',
        acknowledged_by_admin: false,
        acknowledged_by_kitchen: false,
        created_at: newOrder.createdAt,
        updated_at: newOrder.updatedAt,
      });

      if (orderError) {
        console.warn('Supabase orders insert warning:', orderError.message);
      } else {
        // Insert order items
        const dbOrderItems = normalizedItems.map(oi => ({
          id: oi.id,
          order_id: orderId,
          item_name: oi.itemName,
          unit_price: oi.unitPrice,
          quantity: oi.quantity,
          total_price: oi.totalPrice,
          special_notes: oi.specialNotes || null,
        }));

        const { error: itemsError } = await supabaseServer.from('order_items').insert(dbOrderItems);
        if (itemsError) {
          console.warn('Supabase order_items insert warning:', itemsError.message);
        }

        // Insert coupon
        const { error: couponError } = await supabaseServer.from('coupons').insert({
          id: newCoupon.id,
          coupon_code: couponCode,
          order_id: orderId,
          table_number: params.tableNumber,
          is_redeemed: false,
          created_at: newCoupon.createdAt,
        });
        if (couponError) {
          console.warn('Supabase coupons insert warning:', couponError.message);
        }
      }
    } catch (dbErr: any) {
      console.error('Supabase DB execution error:', dbErr.message);
    }
  }

  return newOrder;
}

export async function getServerOrders(): Promise<Order[]> {
  // If Supabase is available, query orders from Supabase database
  if (supabaseServer) {
    try {
      const { data: dbOrders, error: orderErr } = await supabaseServer
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (!orderErr && Array.isArray(dbOrders)) {
        // Transform database rows to domain Order objects
        const mappedOrders: Order[] = dbOrders.map(row => {
          const matchingCoupon = serverCoupons.find(c => c.orderId === row.id);
          const items: OrderItem[] = (row.order_items || []).map((it: any) => ({
            id: it.id,
            orderId: it.order_id,
            foodItemId: it.food_item_id || '',
            itemName: it.item_name,
            unitPrice: Number(it.unit_price),
            quantity: Number(it.quantity),
            totalPrice: Number(it.total_price),
            specialNotes: it.special_notes,
          }));

          return {
            id: row.id,
            orderNumber: row.order_number,
            tableNumber: row.table_number,
            status: row.status as OrderStatus,
            customerName: row.customer_name,
            customerPhone: row.customer_phone,
            customerNotes: row.customer_notes,
            subtotal: Number(row.subtotal),
            taxAmount: Number(row.tax_amount),
            totalAmount: Number(row.total_amount),
            paymentStatus: row.payment_status,
            acknowledgedByAdmin: Boolean(row.acknowledged_by_admin),
            acknowledgedByKitchen: Boolean(row.acknowledged_by_kitchen),
            couponCode: matchingCoupon?.couponCode || `ARD-${row.order_number?.replace(/\D/g, '').slice(-4)}`,
            isCouponRedeemed: matchingCoupon ? matchingCoupon.isRedeemed : false,
            items,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        });

        // Merge any recent orders from server cache not yet in db
        for (const localOrd of serverOrders) {
          if (!mappedOrders.some(m => m.id === localOrd.id || m.orderNumber === localOrd.orderNumber)) {
            mappedOrders.unshift(localOrd);
          }
        }

        return mappedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch (e: any) {
      console.warn('Supabase fetch error, using server cache:', e.message);
    }
  }

  // Fallback to server cache
  return [...serverOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateServerOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  const order = serverOrders.find(o => o.id === orderId || o.orderNumber === orderId);
  if (order) {
    order.status = status;
    // Any progression beyond 'paid' implies order acceptance in both portals
    if (status !== 'paid') {
      order.acknowledgedByAdmin = true;
      order.acknowledgedByKitchen = true;
    }
    order.updatedAt = new Date().toISOString();
  }

  if (supabaseServer) {
    try {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (status !== 'paid') {
        updateData.acknowledged_by_admin = true;
        updateData.acknowledged_by_kitchen = true;
      }
      await supabaseServer
        .from('orders')
        .update(updateData)
        .or(`id.eq.${orderId},order_number.eq.${orderId}`);
    } catch (e) {
      console.warn('Supabase order status update error:', e);
    }
  }

  return true;
}

export async function acknowledgeServerOrder(orderId: string, role: 'admin' | 'kitchen'): Promise<boolean> {
  const order = serverOrders.find(o => o.id === orderId || o.orderNumber === orderId);
  if (order) {
    // When accepted in either Admin or Kitchen, both portals reflect accepted status
    // and stop the notification sound for this specific order
    order.acknowledgedByAdmin = true;
    order.acknowledgedByKitchen = true;
    order.updatedAt = new Date().toISOString();
  }

  if (supabaseServer) {
    try {
      await supabaseServer
        .from('orders')
        .update({
          acknowledged_by_admin: true,
          acknowledged_by_kitchen: true,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${orderId},order_number.eq.${orderId}`);
    } catch (e) {
      console.warn('Supabase acknowledge error:', e);
    }
  }

  return true;
}

export async function verifyServerCoupon(code: string): Promise<{ valid: boolean; coupon?: any; order?: any; message: string }> {
  const cleanCode = code.trim().toUpperCase();
  const coupon = serverCoupons.find(c => c.couponCode === cleanCode);
  
  if (!coupon) {
    return { valid: false, message: 'Invalid coupon code. No matching order found.' };
  }

  const order = serverOrders.find(o => o.id === coupon.orderId || o.orderNumber === coupon.orderNumber);

  if (coupon.isRedeemed) {
    return {
      valid: false,
      coupon,
      order,
      message: `Coupon was ALREADY REDEEMED on ${coupon.redeemedAt ? new Date(coupon.redeemedAt).toLocaleTimeString() : 'earlier'}. Cannot be reused.`,
    };
  }

  return {
    valid: true,
    coupon,
    order,
    message: `Verified! Table ${coupon.tableNumber} - ₹${coupon.totalAmount} (Paid & Authentic)`,
  };
}

export async function redeemServerCoupon(code: string, redeemedBy: string = 'Staff'): Promise<{ success: boolean; valid: boolean; message: string }> {
  const cleanCode = code.trim().toUpperCase();
  const coupon = serverCoupons.find(c => c.couponCode === cleanCode);

  if (!coupon) {
    return { success: false, valid: false, message: 'Coupon code not found.' };
  }

  if (coupon.isRedeemed) {
    return { success: false, valid: false, message: 'Coupon has already been redeemed previously!' };
  }

  coupon.isRedeemed = true;
  coupon.redeemedAt = new Date().toISOString();
  coupon.redeemedBy = redeemedBy;

  const order = serverOrders.find(o => o.id === coupon.orderId);
  if (order) {
    order.isCouponRedeemed = true;
  }

  if (supabaseServer) {
    try {
      await supabaseServer
        .from('coupons')
        .update({
          is_redeemed: true,
          redeemed_at: coupon.redeemedAt,
          redeemed_by: redeemedBy,
        })
        .eq('coupon_code', cleanCode);
    } catch (e) {
      console.warn('Supabase coupon update error:', e);
    }
  }

  return {
    success: true,
    valid: true,
    message: `Coupon ${cleanCode} successfully redeemed for Table ${coupon.tableNumber}!`,
  };
}
