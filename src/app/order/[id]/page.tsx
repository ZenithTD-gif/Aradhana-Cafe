'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  UtensilsCrossed, 
  ArrowLeft, 
  Ticket, 
  Copy, 
  Check, 
  ShieldCheck, 
  Phone, 
  RefreshCw 
} from 'lucide-react';
import { getCafeStore } from '@/lib/store/cafe-store';
import { supabase } from '@/lib/supabase/client';
import { Order, OrderStatus } from '@/types';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchOrder = async () => {
      // 1. Try local store
      const cafeStore = getCafeStore();
      const local = cafeStore.getOrderById(orderId);
      if (local && isMounted) {
        setOrder({ ...local });
      }

      // 2. Fetch latest from API & Supabase
      try {
        const res = await fetch('/api/orders', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.orders && Array.isArray(data.orders)) {
            const found = data.orders.find((o: Order) => o.id === orderId || o.orderNumber === orderId);
            if (found && isMounted) {
              setOrder({ ...found });
            }
          }
        }
      } catch (e) {
        console.warn('Order fetch error:', e);
      }
    };

    fetchOrder();

    // Poll every 3 seconds for live kitchen updates
    const pollInterval = setInterval(fetchOrder, 3000);

    // Supabase Realtime channel subscription
    let realtimeChannel: any = null;
    if (supabase) {
      try {
        realtimeChannel = supabase
          .channel(`order_track_${orderId}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
            if (payload.new && (payload.new.id === orderId || payload.new.order_number === orderId)) {
              fetchOrder();
            }
          })
          .subscribe();
      } catch (err) {
        console.warn('Realtime subscription error:', err);
      }
    }

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [orderId]);

  const handleCopyCoupon = () => {
    if (order?.couponCode) {
      navigator.clipboard.writeText(order.couponCode);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2000);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-cream-200 flex items-center justify-center text-coffee-500 mb-4">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-coffee-950">Locating Order Details...</h2>
          <p className="text-sm text-coffee-600 mt-1 max-w-sm">
            Fetching order #{orderId}. Confirming with kitchen...
          </p>
          <Link
            href="/"
            className="mt-6 px-6 py-2.5 rounded-full bg-coffee-900 text-cream-50 text-xs font-semibold"
          >
            Return to Café Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const statusSteps: { key: OrderStatus; label: string; desc: string; icon: any }[] = [
    { key: 'paid', label: 'Payment Confirmed', desc: 'Order transmitted to chef', icon: CheckCircle2 },
    { key: 'preparing', label: 'In the Kitchen', desc: 'Chef is crafting your food', icon: ChefHat },
    { key: 'ready', label: 'Ready for Pickup', desc: 'Plated & garnishes added', icon: Clock },
    { key: 'served', label: 'Served to Table', desc: 'Enjoy your meal!', icon: UtensilsCrossed },
  ];

  const currentStepIdx = statusSteps.findIndex(s => s.key === order.status);
  const activeIndex = currentStepIdx >= 0 ? currentStepIdx : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-coffee-700 hover:text-coffee-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Order More Dishes</span>
          </Link>
          <span className="text-xs text-coffee-500">
            Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* UNIQUE ORDER COUPON CODE CARD */}
        <div className="relative rounded-3xl bg-gradient-to-br from-coffee-900 via-coffee-950 to-coffee-900 text-cream-50 p-6 sm:p-8 shadow-2xl border-2 border-gold-400 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-gold-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/20 text-gold-300 text-xs font-bold tracking-wider uppercase border border-gold-500/30">
                <Ticket className="w-3.5 h-3.5" />
                <span>Unique Order Verification Coupon</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
                Show Coupon to Waiter
              </h2>
              <p className="text-xs sm:text-sm text-cream-300/90 max-w-sm">
                Your waiter will scan or verify this code before serving your order at <strong className="text-gold-300">{order.tableNumber}</strong>.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="p-4 px-6 rounded-2xl bg-white/10 backdrop-blur-md border border-gold-400/50 shadow-inner text-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gold-400 block">
                  COUPON CODE
                </span>
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-gold-300 tracking-wider">
                  {order.couponCode || 'ARD-CONFIRMED'}
                </span>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={handleCopyCoupon}
                  className="px-3 py-1.5 rounded-full bg-gold-500 hover:bg-gold-400 text-coffee-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  {copiedCoupon ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                {order.isCouponRedeemed && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                    Redeemed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Status Tracker Bar */}
        <div className="p-6 rounded-3xl bg-white border border-cream-300 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-cream-200 pb-4">
            <div>
              <span className="text-xs font-semibold text-gold-600 uppercase tracking-wider block">
                Live Kitchen Status
              </span>
              <h3 className="font-serif text-lg font-bold text-coffee-950">
                Order #{order.orderNumber}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-coffee-500 block">Seated at</span>
              <span className="font-bold text-sm text-coffee-950">{order.tableNumber}</span>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-4 gap-2 text-center">
              {statusSteps.map((step, idx) => {
                const IconComponent = step.icon;
                const isPassed = idx <= activeIndex;
                const isCurrent = idx === activeIndex;

                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-gold-500 text-coffee-950 ring-4 ring-gold-200 shadow-lg scale-110'
                        : isPassed
                        ? 'bg-coffee-900 text-cream-50'
                        : 'bg-cream-200 text-coffee-400'
                    }`}>
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className={`text-[11px] sm:text-xs font-bold mt-2.5 ${
                      isCurrent ? 'text-gold-700' : isPassed ? 'text-coffee-950' : 'text-coffee-400'
                    }`}>
                      {step.label}
                    </span>
                    <span className="text-[10px] text-coffee-500 hidden sm:block mt-0.5">
                      {step.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Details & Bill Summary */}
        <div className="p-6 rounded-3xl bg-white border border-cream-300 shadow-sm space-y-4">
          <h4 className="font-serif text-base font-bold text-coffee-950">
            Ordered Items ({order.items.length})
          </h4>

          <div className="divide-y divide-cream-200">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-cream-200 font-bold text-coffee-800 flex items-center justify-center text-xs">
                    {item.quantity}×
                  </span>
                  <div>
                    <span className="font-semibold text-coffee-950">{item.itemName}</span>
                    {item.specialNotes && (
                      <p className="text-[11px] text-coffee-500 italic mt-0.5">
                        Note: "{item.specialNotes}"
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-bold text-coffee-900">₹{item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-cream-200 space-y-1.5 text-xs text-coffee-700">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-coffee-950">₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Restaurant GST (5%):</span>
              <span className="font-semibold text-coffee-950">₹{order.taxAmount.toFixed(2)}</span>
            </div>
            <div className="pt-2 flex justify-between items-baseline font-bold text-coffee-950 text-base">
              <span>Total Paid via UPI:</span>
              <span className="text-xl text-emerald-700 font-serif">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-cream-100 flex items-center justify-between text-[11px] text-coffee-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Payment Verified & Authorized</span>
            </div>
            <span>Status: <strong className="text-emerald-700 uppercase font-bold">{order.paymentStatus}</strong></span>
          </div>
        </div>

        {/* Assistance Help Bar */}
        <div className="p-4 rounded-2xl bg-cream-100/70 border border-cream-300 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-coffee-950">Need waiter assistance?</p>
            <p className="text-coffee-600 text-[11px]">Our team is delighted to help your table.</p>
          </div>
          <a
            href="tel:+919876543210"
            className="px-3.5 py-1.5 rounded-full bg-coffee-900 text-cream-50 font-semibold flex items-center gap-1.5 hover:bg-coffee-800"
          >
            <Phone className="w-3.5 h-3.5 text-gold-400" />
            <span>Call Server</span>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
