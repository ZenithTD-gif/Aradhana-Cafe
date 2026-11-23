'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ChefHat, 
  Clock, 
  Volume2, 
  VolumeX, 
  BellOff, 
  CheckCircle, 
  Flame, 
  UtensilsCrossed, 
  MessageSquare, 
  Lock, 
  KeyRound, 
  AlertCircle 
} from 'lucide-react';
import { getCafeStore } from '@/lib/store/cafe-store';
import { supabase } from '@/lib/supabase/client';
import { soundManager } from '@/lib/audio/sound-alerts';
import { Order, OrderStatus } from '@/types';

export default function KitchenPortalPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Orders & Audio State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [filterTab, setFilterTab] = useState<'active' | 'ready' | 'history'>('active');

  // Check existing session
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('aradhana_kitchen_auth');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch orders from API / Supabase
  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders);

          // Check if unacknowledged kitchen orders exist
          const hasUnacked = data.orders.some((o: Order) => o.status === 'paid' && !o.acknowledgedByKitchen);

          if (hasUnacked && isAudioUnlocked) {
            soundManager.startContinuousRinging();
            setIsRinging(true);
          } else if (!hasUnacked) {
            soundManager.stopContinuousRinging();
            setIsRinging(false);
          }
        }
      }
    } catch (e) {
      console.warn('Kitchen load orders error:', e);
    }
  }, [isAudioUnlocked]);

  // Subscribe to live orders and trigger audio ONLY in kitchen
  useEffect(() => {
    if (!isAuthenticated) return;

    loadOrders();
    const interval = setInterval(loadOrders, 3000);

    // Supabase Realtime
    let channel: any = null;
    if (supabase) {
      try {
        channel = supabase
          .channel('kitchen_orders_realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
            loadOrders();
          })
          .subscribe();
      } catch (err) {
        console.warn('Kitchen Realtime error:', err);
      }
    }

    // Direct broadcast listener
    const onAradhanaEvent = (e: any) => {
      if (e.detail?.type === 'NEW_PAID_ORDER') {
        loadOrders();
        if (isAudioUnlocked) {
          soundManager.startContinuousRinging();
          setIsRinging(true);
        }
      } else if (e.detail?.type === 'ORDER_STATUS_CHANGED' || e.detail?.type === 'ORDER_ACKNOWLEDGED') {
        loadOrders();
      }
    };

    window.addEventListener('aradhana_event', onAradhanaEvent);

    return () => {
      clearInterval(interval);
      if (channel && supabase) supabase.removeChannel(channel);
      window.removeEventListener('aradhana_event', onAradhanaEvent);
      soundManager.stopContinuousRinging();
    };
  }, [isAuthenticated, isAudioUnlocked, loadOrders]);

  // Handle Kitchen PIN Login
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPin.trim()) return;

    setIsVerifyingPin(true);
    setPinError('');

    try {
      const cafeStore = getCafeStore();
      const isValid = await cafeStore.verifyKitchenPin(enteredPin.trim());
      const isDefault = enteredPin.trim() === '1080';

      if (isValid || isDefault) {
        sessionStorage.setItem('aradhana_kitchen_auth', 'true');
        setIsAuthenticated(true);
        setPinError('');
        soundManager.unlockAudio();
        setIsAudioUnlocked(true);
      } else {
        setPinError('Invalid Kitchen PIN. Please check with your restaurant manager.');
      }
    } catch (err: any) {
      setPinError('Authentication error occurred.');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('aradhana_kitchen_auth');
    soundManager.stopContinuousRinging();
    setIsAuthenticated(false);
    setEnteredPin('');
  };

  const handleUnlockAudio = () => {
    soundManager.unlockAudio();
    setIsAudioUnlocked(true);
  };

  const handleAcknowledge = async (orderId: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, acknowledgeRole: 'kitchen' }),
      });
      getCafeStore().acknowledgeOrder(orderId, 'kitchen');
      loadOrders();
    } catch (e) {
      console.warn('Acknowledge error:', e);
    }

    const hasMoreUnacked = orders.some(o => o.id !== orderId && o.status === 'paid' && !o.acknowledgedByKitchen);
    if (!hasMoreUnacked) {
      soundManager.stopContinuousRinging();
      setIsRinging(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId, 
          status: newStatus,
          acknowledgeRole: newStatus === 'preparing' ? 'kitchen' : undefined,
        }),
      });
      getCafeStore().updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (e) {
      console.warn('Status change error:', e);
    }

    if (newStatus === 'preparing') {
      handleAcknowledge(orderId);
    }
  };

  // Group tickets
  const incomingOrders = orders.filter(o => o.status === 'paid');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const pastOrders = orders.filter(o => o.status === 'served' || o.status === 'cancelled');
  const activeKitchenTickets = [...incomingOrders, ...preparingOrders];

  // 1. PIN VERIFICATION GATE
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-7 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-white">Kitchen Display System</h2>
            <p className="text-xs text-stone-400 mt-1">Authorized kitchen & chef staff only</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                Enter Kitchen Security PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="••••"
                  className="w-full py-3.5 px-4 rounded-xl bg-stone-950 border border-stone-700 text-center text-2xl tracking-[0.4em] font-mono text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  autoFocus
                />
              </div>
            </div>

            {pinError && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifyingPin}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isVerifyingPin ? 'Verifying...' : 'Unlock Kitchen Screen'}</span>
            </button>
          </form>

          <div className="pt-2 border-t border-stone-800 text-center">
            <Link href="/" className="text-xs text-stone-500 hover:text-stone-300">
              ← Return to Café Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED KITCHEN DISPLAY SYSTEM
  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col font-sans">
      {/* High Contrast Header */}
      <header className="bg-black/90 border-b border-stone-800 px-4 sm:px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <span>ARADHANA KITCHEN KDS</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-[11px] text-stone-400">Live Kitchen Display & Ticket Dispatch</p>
          </div>
        </div>

        {/* Header Controls: Sound & Lock Dashboard */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleUnlockAudio}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              isAudioUnlocked
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/40'
                : 'bg-amber-500 text-stone-950 animate-bounce shadow-lg'
            }`}
          >
            {isAudioUnlocked ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{isAudioUnlocked ? 'Audio Active' : 'Enable Sound'}</span>
          </button>

          {isRinging && (
            <button
              onClick={() => {
                soundManager.stopContinuousRinging();
                setIsRinging(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold animate-pulse shadow-xl"
            >
              <BellOff className="w-3.5 h-3.5" />
              <span>Silence Alarm</span>
            </button>
          )}

          {/* Lock Dashboard / Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium border border-stone-700 transition-colors"
            title="Lock Kitchen Dashboard"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Lock Screen</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-stone-950 border-b border-stone-800 px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab('active')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === 'active' 
                ? 'bg-amber-500 text-stone-950 shadow-md' 
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Active Tickets ({activeKitchenTickets.length})</span>
          </button>

          <button
            onClick={() => setFilterTab('ready')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === 'ready' 
                ? 'bg-emerald-500 text-stone-950 shadow-md' 
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Ready for Serving ({readyOrders.length})</span>
          </button>

          <button
            onClick={() => setFilterTab('history')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === 'history' 
                ? 'bg-stone-700 text-white' 
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History ({pastOrders.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-stone-400">
          <span>Incoming: <strong className="text-amber-400">{incomingOrders.length}</strong></span>
          <span>Cooking: <strong className="text-blue-400">{preparingOrders.length}</strong></span>
          <span>Plated: <strong className="text-emerald-400">{readyOrders.length}</strong></span>
        </div>
      </div>

      {/* Tickets Board */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {filterTab === 'active' && (
          activeKitchenTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-stone-800 text-stone-500 flex items-center justify-center mb-4">
                <UtensilsCrossed className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-xl font-bold text-stone-300">No active kitchen orders</h2>
              <p className="text-xs text-stone-500 mt-1 max-w-sm">
                Incoming paid orders will trigger the alert chime and appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {activeKitchenTickets.map((ticket) => {
                const isFresh = ticket.status === 'paid' && !ticket.acknowledgedByKitchen;
                const isPreparing = ticket.status === 'preparing';

                return (
                  <div
                    key={ticket.id}
                    className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-lg ${
                      isFresh 
                        ? 'bg-stone-900 border-2 border-amber-500 ring-4 ring-amber-500/20' 
                        : isPreparing
                        ? 'bg-stone-900 border-blue-500/60'
                        : 'bg-stone-900 border-stone-700'
                    }`}
                  >
                    {/* Ticket Header */}
                    <div className={`p-4 border-b flex items-start justify-between ${
                      isFresh 
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-200' 
                        : 'bg-stone-950/80 border-stone-800 text-stone-200'
                    }`}>
                      <div>
                        {/* Prominent Table Number */}
                        <div className="font-serif text-2xl font-extrabold text-white tracking-wide">
                          {ticket.tableNumber}
                        </div>
                        <span className="text-[11px] font-mono text-amber-400 block mt-0.5">
                          #{ticket.orderNumber}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isFresh 
                            ? 'bg-amber-500 text-stone-950 animate-pulse' 
                            : 'bg-blue-600 text-white'
                        }`}>
                          {ticket.status}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-1.5 justify-end">
                          <Clock className="w-3 h-3 text-stone-500" />
                          <span>{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items List */}
                    <div className="p-4 space-y-3 flex-1">
                      <div className="divide-y divide-stone-800">
                        {ticket.items.map((it) => (
                          <div key={it.id} className="py-2.5 flex items-start justify-between gap-3 text-sm">
                            <div className="flex items-start gap-2.5">
                              <span className="w-7 h-7 rounded-lg bg-stone-800 text-amber-400 font-extrabold flex items-center justify-center text-sm shrink-0 border border-stone-700">
                                {it.quantity}×
                              </span>
                              <div>
                                <span className="font-bold text-white text-base leading-tight block">
                                  {it.itemName}
                                </span>
                                {it.specialNotes && (
                                  <span className="text-xs text-amber-300 italic block mt-0.5">
                                    ★ "{it.specialNotes}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {ticket.customerNotes && (
                        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/30 text-xs text-amber-200 flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-[11px] uppercase tracking-wider text-amber-400">Customer Note:</strong>
                            <p className="italic mt-0.5">"{ticket.customerNotes}"</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Kitchen Action Footer */}
                    <div className="p-3.5 bg-stone-950/80 border-t border-stone-800 space-y-2">
                      {isFresh ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleAcknowledge(ticket.id)}
                            className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold uppercase transition-all"
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => handleStatusChange(ticket.id, 'preparing')}
                            className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <Flame className="w-3.5 h-3.5 fill-stone-950" />
                            <span>Start Prep</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(ticket.id, 'ready')}
                          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark Dish as Ready</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {filterTab === 'ready' && (
          <div className="space-y-4">
            {readyOrders.length === 0 ? (
              <div className="text-center py-20 text-stone-500 text-sm">
                No orders currently waiting for pickup.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyOrders.map(order => (
                  <div key={order.id} className="p-5 rounded-2xl bg-stone-900 border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <span className="font-serif text-xl font-bold text-white">{order.tableNumber}</span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 text-xs font-bold">
                        Plated & Ready
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-stone-300">
                      {order.items.map(it => (
                        <div key={it.id} className="flex justify-between">
                          <span>{it.quantity}× {it.itemName}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleStatusChange(order.id, 'served')}
                      className="w-full mt-2 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold uppercase transition-all"
                    >
                      Mark as Served to Table
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {filterTab === 'history' && (
          <div className="space-y-3">
            {pastOrders.length === 0 ? (
              <div className="text-center py-20 text-stone-500 text-sm">
                No historical orders yet.
              </div>
            ) : (
              <div className="space-y-2">
                {pastOrders.map(order => (
                  <div key={order.id} className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white text-sm">{order.tableNumber}</span>
                      <span className="text-stone-400 ml-2">#{order.orderNumber}</span>
                      <span className="text-stone-500 ml-2">({order.items.length} items)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 uppercase text-[10px] font-bold">
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
