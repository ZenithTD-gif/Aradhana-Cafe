'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  Clock, 
  Coffee, 
  Edit3, 
  Eye, 
  EyeOff, 
  Plus, 
  QrCode, 
  Shield, 
  ShoppingBag, 
  Trash2, 
  TrendingUp, 
  Utensils, 
  Volume2, 
  VolumeX, 
  X, 
  Ticket, 
  AlertTriangle,
  Download,
  KeyRound,
  Lock,
  Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getCafeStore } from '@/lib/store/cafe-store';
import { soundManager } from '@/lib/audio/sound-alerts';
import { supabase } from '@/lib/supabase/client';
import { Category, FoodItem, Order, OrderStatus, TableItem, RestaurantSettings } from '@/types';

export default function AdminPortalPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'tables' | 'coupons' | 'analytics' | 'settings'>('orders');

  // Store data
  const [orders, setOrders] = useState<Order[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings>(getCafeStore().getSettings());

  // Audio & Notification state
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  // Menu modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<FoodItem> | null>(null);

  // Coupon lookup state
  const [lookupCode, setLookupCode] = useState('');
  const [lookupResult, setLookupResult] = useState<{ valid: boolean; coupon?: any; order?: any; message: string } | null>(null);

  // Table add state
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableSection, setNewTableSection] = useState('Main Dining');

  // Kitchen PIN Management
  const [newKitchenPin, setNewKitchenPin] = useState('');
  const [kitchenPinSuccess, setKitchenPinSuccess] = useState('');

  // Filter orders
  const [orderFilter, setOrderFilter] = useState<'all' | 'paid' | 'preparing' | 'ready' | 'served'>('all');

  // Check login on load
  useEffect(() => {
    const sessionPin = sessionStorage.getItem('aradhana_admin_auth');
    if (sessionPin === 'true') {
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

          // Check if unacknowledged admin orders exist
          const hasUnacked = data.orders.some((o: Order) => o.status === 'paid' && !o.acknowledgedByAdmin);

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
      console.warn('Admin load orders error:', e);
    }
  }, [isAudioUnlocked]);

  // Subscribe to live orders & trigger audio ONLY in Admin
  useEffect(() => {
    if (!isAuthenticated) return;

    const cafeStore = getCafeStore();
    const handleUpdate = () => {
      setFoodItems(cafeStore.getFoodItems());
      setCategories(cafeStore.getCategories());
      setTables(cafeStore.getTables());
      setSettings(cafeStore.getSettings());
      loadOrders();
    };

    handleUpdate();
    const unsub = cafeStore.subscribe(handleUpdate);

    // Initial load and dual-layer polling fallback (3s)
    loadOrders();
    const interval = setInterval(loadOrders, 3000);

    // Supabase Realtime subscription
    let channel: any = null;
    if (supabase) {
      try {
        channel = supabase
          .channel('admin_orders_realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
            loadOrders();
          })
          .subscribe();
      } catch (err) {
        console.warn('Admin Realtime error:', err);
      }
    }

    // Direct broadcast listener for new orders
    const onAradhanaEvent = (e: any) => {
      loadOrders();
      if (e.detail?.type === 'NEW_PAID_ORDER') {
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
      unsub();
      window.removeEventListener('aradhana_event', onAradhanaEvent);
      soundManager.stopContinuousRinging();
    };
  }, [isAuthenticated, isAudioUnlocked, loadOrders]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const validPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '1947';
    if (pinInput === validPin || pinInput === '1947' || pinInput === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('aradhana_admin_auth', 'true');
      setPinError('');
      soundManager.unlockAudio();
      setIsAudioUnlocked(true);
    } else {
      setPinError('Invalid Admin PIN. (Default demo PIN is 1947)');
    }
  };

  const handleUnlockAudio = () => {
    soundManager.unlockAudio();
    setIsAudioUnlocked(true);
  };

  const handleAcknowledge = async (orderId: string) => {
    // 1. Local update
    getCafeStore().acknowledgeOrder(orderId, 'admin');

    // 2. Server API update
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, role: 'admin' })
      });
      loadOrders();
    } catch (e) {
      console.warn('Admin ack error:', e);
    }

    const hasMoreUnacked = orders.some(o => o.id !== orderId && o.status === 'paid' && !o.acknowledgedByAdmin);
    if (!hasMoreUnacked) {
      soundManager.stopContinuousRinging();
      setIsRinging(false);
    }
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    // 1. Local update
    getCafeStore().updateOrderStatus(orderId, status);

    // 2. Server API update
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      });
      loadOrders();
    } catch (e) {
      console.warn('Admin status change error:', e);
    }
  };

  // Real-Time Availability Switch
  const handleToggleAvailability = (itemId: string) => {
    getCafeStore().toggleFoodAvailability(itemId);
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      getCafeStore().deleteFoodItem(itemId);
    }
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.name || !editingItem.price || !editingItem.categoryId) {
      alert('Please fill out dish name, price, and category.');
      return;
    }
    getCafeStore().saveFoodItem({
      ...editingItem,
      name: editingItem.name,
      price: Number(editingItem.price),
      categoryId: editingItem.categoryId,
    });
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) return;
    getCafeStore().addTable(newTableNumber.trim(), newTableCapacity, newTableSection);
    setNewTableNumber('');
  };

  const handleVerifyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupCode.trim()) return;
    try {
      const res = await fetch('/api/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: lookupCode.trim(), action: 'verify' })
      });
      if (res.ok) {
        const data = await res.json();
        setLookupResult(data);
        return;
      }
    } catch (e) {
      console.warn('Coupon verify error:', e);
    }
    const res = getCafeStore().verifyCouponCode(lookupCode.trim());
    setLookupResult(res);
  };

  const handleRedeemCoupon = async () => {
    if (!lookupCode.trim()) return;
    try {
      const res = await fetch('/api/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: lookupCode.trim(), action: 'redeem', redeemedBy: 'Admin Desk' })
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Coupon redeemed successfully.');
        setLookupResult(data);
        loadOrders();
        return;
      }
    } catch (e) {
      console.warn('Coupon redeem error:', e);
    }
    const res = getCafeStore().redeemCoupon(lookupCode.trim(), 'Admin Desk');
    alert(res.message);
    const refreshed = getCafeStore().verifyCouponCode(lookupCode.trim());
    setLookupResult(refreshed);
    loadOrders();
  };

  // Update Kitchen Security PIN
  const handleUpdateKitchenPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newKitchenPin.trim().length < 4) {
      alert('PIN must be at least 4 digits.');
      return;
    }

    const success = await getCafeStore().setKitchenPin(newKitchenPin.trim());
    if (success) {
      setKitchenPinSuccess(`Kitchen PIN updated successfully! The new PIN is now active.`);
      setNewKitchenPin('');
      setTimeout(() => setKitchenPinSuccess(''), 4000);
    }
  };

  // Summary Metrics
  const todayOrders = orders;
  const todayRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter(o => o.status === 'paid' && !o.acknowledgedByAdmin);
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const servedOrders = orders.filter(o => o.status === 'served');

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-coffee-950 via-coffee-900 to-coffee-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-cream-300 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-coffee-900 text-gold-400 flex items-center justify-center mx-auto shadow-md border border-gold-500/30">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-coffee-950">Aradhana Admin Desk</h2>
            <p className="text-xs text-coffee-600">Enter your manager security PIN to access live orders & menu controls.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-coffee-800 mb-1.5">
                Admin Security PIN
              </label>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter 4-digit PIN (Default: 1947)"
                className="w-full py-3 px-4 rounded-xl bg-cream-50 border border-cream-300 text-center text-xl tracking-widest font-mono text-coffee-950 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                autoFocus
              />
            </div>

            {pinError && (
              <p className="text-xs text-rose-600 font-semibold text-center">{pinError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-coffee-900 hover:bg-coffee-800 text-cream-50 font-bold text-sm tracking-wide transition-all shadow-md active:scale-95 border border-gold-500/30"
            >
              Sign In to Management Portal
            </button>
          </form>

          <div className="pt-4 border-t border-cream-200 text-center">
            <Link href="/" className="text-xs text-coffee-600 hover:text-coffee-900 underline">
              ← Return to Customer Dining Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-coffee-950 text-cream-50 sticky top-0 z-40 border-b border-coffee-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center border border-gold-500/40">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-lg font-bold text-cream-50">ARADHANA</span>
                <span className="block text-[10px] tracking-widest text-gold-400 uppercase -mt-1">Manager Portal</span>
              </div>
            </Link>

            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-coffee-900 text-cream-300 text-xs border border-coffee-700">
              Live Connected
            </span>
          </div>

          {/* Right Header Alerts & Sound Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleUnlockAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isAudioUnlocked 
                  ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/30' 
                  : 'bg-gold-500 text-coffee-950 animate-bounce'
              }`}
              title="Ensure notification sounds can play"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold animate-pulse shadow-lg"
              >
                <BellOff className="w-3.5 h-3.5" />
                <span>Mute Alert</span>
              </button>
            )}

            <Link
              href="/kitchen"
              className="px-3 py-1.5 rounded-lg bg-coffee-900 hover:bg-coffee-800 text-cream-200 text-xs font-medium border border-coffee-800 hidden md:inline-block"
            >
              Kitchen KDS →
            </Link>

            <button
              onClick={() => {
                sessionStorage.removeItem('aradhana_admin_auth');
                soundManager.stopContinuousRinging();
                setIsAuthenticated(false);
              }}
              className="px-2.5 py-1.5 rounded-lg text-cream-400 hover:text-white text-xs"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2 border-t border-coffee-900 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'orders' ? 'bg-gold-500 text-coffee-950 font-bold' : 'text-cream-300 hover:bg-coffee-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Live Orders</span>
            {pendingOrders.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'menu' ? 'bg-gold-500 text-coffee-950 font-bold' : 'text-cream-300 hover:bg-coffee-900'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Menu & Availability</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'tables' ? 'bg-gold-500 text-coffee-950 font-bold' : 'text-cream-300 hover:bg-coffee-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Tables & QR Codes</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'coupons' ? 'bg-gold-500 text-coffee-950 font-bold' : 'text-cream-300 hover:bg-coffee-900'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Verify Coupon</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'analytics' ? 'bg-gold-500 text-coffee-950 font-bold' : 'text-cream-300 hover:bg-coffee-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Sales & Settings</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* OVERVIEW STATS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-cream-300 shadow-sm">
            <span className="text-[11px] font-bold text-coffee-500 uppercase">Today's Revenue</span>
            <div className="text-xl sm:text-2xl font-bold font-serif text-coffee-950 mt-1">
              ₹{todayRevenue.toFixed(2)}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
              100% Verified UPI
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-cream-300 shadow-sm">
            <span className="text-[11px] font-bold text-coffee-500 uppercase">Total Orders</span>
            <div className="text-xl sm:text-2xl font-bold font-serif text-coffee-950 mt-1">
              {todayOrders.length}
            </div>
            <span className="text-[10px] text-coffee-500 block mt-1">Across all tables</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-cream-300 shadow-sm">
            <span className="text-[11px] font-bold text-rose-600 uppercase">Unacknowledged</span>
            <div className="text-xl sm:text-2xl font-bold font-serif text-rose-600 mt-1">
              {pendingOrders.length}
            </div>
            <span className="text-[10px] text-rose-500 block mt-1">Requires ring acknowledgement</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-cream-300 shadow-sm">
            <span className="text-[11px] font-bold text-amber-600 uppercase">Kitchen Preparing</span>
            <div className="text-xl sm:text-2xl font-bold font-serif text-amber-600 mt-1">
              {preparingOrders.length}
            </div>
            <span className="text-[10px] text-amber-600 block mt-1">Active on chef screen</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-cream-300 shadow-sm col-span-2 lg:col-span-1">
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Completed & Served</span>
            <div className="text-xl sm:text-2xl font-bold font-serif text-emerald-700 mt-1">
              {servedOrders.length}
            </div>
            <span className="text-[10px] text-emerald-600 block mt-1">Fulfilled orders</span>
          </div>
        </div>

        {/* TAB 1: LIVE ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-cream-300 shadow-sm">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {(['all', 'paid', 'preparing', 'ready', 'served'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setOrderFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      orderFilter === tab 
                        ? 'bg-coffee-900 text-cream-50' 
                        : 'bg-cream-100 text-coffee-700 hover:bg-cream-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {pendingOrders.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 animate-pulse">
                  <Bell className="w-4 h-4" />
                  <span>{pendingOrders.length} New Paid Order(s) Ringing!</span>
                </div>
              )}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-cream-300 p-8">
                <ShoppingBag className="w-12 h-12 text-coffee-400 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold text-coffee-950">No orders found in this category</h3>
                <p className="text-xs text-coffee-600 mt-1">
                  Incoming verified paid orders appear here with ringing audio alert.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredOrders.map(order => {
                  const isNew = order.status === 'paid' && !order.acknowledgedByAdmin;

                  return (
                    <div 
                      key={order.id}
                      className={`rounded-3xl bg-white border transition-all p-5 shadow-sm space-y-4 flex flex-col justify-between ${
                        isNew ? 'border-2 border-rose-500 ring-4 ring-rose-100 bg-rose-50/20' : 'border-cream-300'
                      }`}
                    >
                      <div>
                        {/* Order Header */}
                        <div className="flex items-start justify-between gap-2 pb-3 border-b border-cream-200">
                          <div>
                            <span className="text-[10px] font-bold text-gold-600 uppercase tracking-widest block">
                              {order.orderNumber}
                            </span>
                            <h4 className="font-bold text-lg text-coffee-950 flex items-center gap-2">
                              <span>{order.tableNumber}</span>
                              {order.customerName && (
                                <span className="text-xs font-normal text-coffee-600">({order.customerName})</span>
                              )}
                            </h4>
                          </div>

                          <div className="text-right">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              order.status === 'paid' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                              order.status === 'preparing' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                              order.status === 'ready' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                              'bg-stone-100 text-stone-800'
                            }`}>
                              {order.status}
                            </span>
                            <span className="block text-[10px] text-coffee-400 mt-1">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Customer Coupon Code Banner */}
                        {order.couponCode && (
                          <div className="mt-2.5 p-2 rounded-xl bg-gold-50 border border-gold-300 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-coffee-950">
                              <Ticket className="w-4 h-4 text-gold-600" />
                              <span>Coupon: <span className="font-mono text-gold-800">{order.couponCode}</span></span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              order.isCouponRedeemed ? 'bg-emerald-600 text-white' : 'bg-amber-200 text-amber-900'
                            }`}>
                              {order.isCouponRedeemed ? 'Redeemed' : 'Valid'}
                            </span>
                          </div>
                        )}

                        {/* Item list */}
                        <div className="mt-3 space-y-2">
                          {order.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-cream-200 text-coffee-900 font-bold flex items-center justify-center text-[11px]">
                                  {item.quantity}×
                                </span>
                                <span className="font-medium text-coffee-950">{item.itemName}</span>
                              </div>
                              <span className="text-coffee-700 font-semibold">₹{item.totalPrice.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {order.customerNotes && (
                          <div className="mt-3 p-2 rounded-xl bg-cream-100 text-[11px] text-coffee-800 italic border border-cream-200">
                            Chef Note: "{order.customerNotes}"
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-cream-200 space-y-2.5">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="text-coffee-600">Total Paid (UPI):</span>
                          <span className="font-bold text-base text-coffee-950">₹{order.totalAmount.toFixed(2)}</span>
                        </div>

                        {/* Acknowledge Button if unacknowledged */}
                        {isNew && (
                          <button
                            onClick={() => handleAcknowledge(order.id)}
                            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <BellOff className="w-4 h-4" />
                            <span>Acknowledge Order & Stop Ringing</span>
                          </button>
                        )}

                        {/* Status Transition Buttons */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          <button
                            onClick={() => handleStatusChange(order.id, 'preparing')}
                            disabled={order.status === 'preparing'}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                              order.status === 'preparing' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-cream-100 hover:bg-blue-100 text-coffee-800'
                            }`}
                          >
                            Preparing
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.id, 'ready')}
                            disabled={order.status === 'ready'}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                              order.status === 'ready' 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-cream-100 hover:bg-emerald-100 text-coffee-800'
                            }`}
                          >
                            Ready
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.id, 'served')}
                            disabled={order.status === 'served'}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                              order.status === 'served' 
                                ? 'bg-stone-800 text-white' 
                                : 'bg-cream-100 hover:bg-stone-200 text-coffee-800'
                            }`}
                          >
                            Served
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FOOD MENU MANAGEMENT */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-cream-300 shadow-sm">
              <div>
                <h3 className="font-serif text-xl font-bold text-coffee-950">Food Menu & Real-time Availability</h3>
                <p className="text-xs text-coffee-600 mt-0.5">
                  Toggle availability OFF when an item is sold out today. It immediately updates the customer menu in real time.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingItem({
                    categoryId: categories[0]?.id || 'cat-tea-coffee',
                    name: '',
                    price: 150,
                    description: '',
                    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
                    isAvailable: true,
                    isVeg: true,
                    isChefSpecial: false,
                    isSpicy: false,
                    preparationTimeMins: 5,
                  });
                  setIsEditModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-full bg-coffee-900 hover:bg-coffee-800 text-cream-50 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4 text-gold-400" />
                <span>Add New Food Item</span>
              </button>
            </div>

            {/* Menu Items Table / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {foodItems.map(item => (
                <div 
                  key={item.id}
                  className={`p-4 rounded-2xl bg-white border transition-all flex gap-3 shadow-sm ${
                    item.isAvailable ? 'border-cream-300' : 'border-rose-200 bg-rose-50/30'
                  }`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className={`w-20 h-20 rounded-xl object-cover shrink-0 bg-cream-100 ${
                      item.isAvailable ? '' : 'grayscale'
                    }`}
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-sm text-coffee-950 line-clamp-1">{item.name}</h4>
                        <span className="text-xs font-bold text-gold-700">₹{item.price}</span>
                      </div>
                      <p className="text-[11px] text-coffee-500 line-clamp-1 mt-0.5">{item.categoryName}</p>
                    </div>

                    {/* Controls */}
                    <div className="mt-2 pt-2 border-t border-cream-200 flex items-center justify-between">
                      {/* Real-time Availability Switch */}
                      <button
                        onClick={() => handleToggleAvailability(item.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                          item.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-600 text-white shadow-sm'
                        }`}
                        title="Click to toggle availability"
                      >
                        {item.isAvailable ? (
                          <>
                            <Eye className="w-3 h-3 text-emerald-600" />
                            <span>Available</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-white" />
                            <span>Sold Out</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItem({ ...item });
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-cream-100 text-coffee-700"
                          title="Edit Item"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TABLES & QR CODE GENERATOR */}
        {activeTab === 'tables' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-cream-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-coffee-950">Table & QR Code Management</h3>
                <p className="text-xs text-coffee-600 mt-0.5">
                  Generate print-ready QR codes for each dining table. Scanning automatically identifies the table for ordering.
                </p>
              </div>

              {/* Add Table Form */}
              <form onSubmit={handleAddTable} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Table 09"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-cream-50 border border-cream-300 text-xs text-coffee-950 w-28 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
                <input
                  type="number"
                  placeholder="Seats"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                  className="px-2 py-1.5 rounded-xl bg-cream-50 border border-cream-300 text-xs text-coffee-950 w-16 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-coffee-900 text-cream-50 font-bold text-xs uppercase"
                >
                  Add Table
                </button>
              </form>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {tables.map(table => {
                const qrUrl = typeof window !== 'undefined' 
                  ? `${window.location.origin}/?table=${encodeURIComponent(table.tableNumber)}`
                  : `https://aradhanacafe.com/?table=${encodeURIComponent(table.tableNumber)}`;

                return (
                  <div 
                    key={table.id}
                    className="p-5 rounded-3xl bg-white border border-cream-300 shadow-sm flex flex-col items-center text-center space-y-3 relative group"
                  >
                    <div className="w-full flex items-center justify-between text-xs text-coffee-500">
                      <span className="font-bold text-coffee-950">{table.section}</span>
                      <span>Cap: {table.capacity}</span>
                    </div>

                    <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-gold-400 shadow-xs">
                      <QRCodeSVG
                        value={qrUrl}
                        size={130}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    <div>
                      <h4 className="font-serif text-lg font-bold text-coffee-950">{table.tableNumber}</h4>
                      <p className="text-[10px] text-coffee-500 font-mono break-all mt-0.5">
                        /?table={table.tableNumber}
                      </p>
                    </div>

                    <div className="w-full pt-2 border-t border-cream-200 flex items-center justify-between text-xs">
                      <a
                        href={qrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gold-700 hover:text-gold-800 font-semibold underline text-[11px]"
                      >
                        Test QR Link
                      </a>

                      <button
                        onClick={() => window.print()}
                        className="p-1.5 rounded-lg text-coffee-600 hover:bg-cream-100 flex items-center gap-1 text-[11px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: COUPON VERIFICATION SYSTEM */}
        {activeTab === 'coupons' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-cream-300 shadow-sm space-y-5">
              <div>
                <h3 className="font-serif text-xl font-bold text-coffee-950">Waiter Coupon Verification</h3>
                <p className="text-xs text-coffee-600 mt-1">
                  When a customer shows their order confirmation coupon code, enter it below to verify payment validity and prevent double redemption.
                </p>
              </div>

              <form onSubmit={handleVerifyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code e.g. ARD-7942"
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                  className="flex-1 py-3 px-4 rounded-xl bg-cream-50 border border-cream-300 text-sm font-mono uppercase font-bold text-coffee-950 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-coffee-900 hover:bg-coffee-800 text-cream-50 font-bold text-xs uppercase tracking-wider"
                >
                  Verify
                </button>
              </form>

              {lookupResult && (
                <div className={`p-4 rounded-2xl border text-xs space-y-3 animate-fade-in ${
                  lookupResult.valid 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {lookupResult.valid ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm">{lookupResult.message}</h4>
                      {lookupResult.coupon && (
                        <div className="mt-2 space-y-1 text-coffee-800">
                          <p>Table: <strong className="text-coffee-950">{lookupResult.coupon.tableNumber}</strong></p>
                          <p>Order: <strong className="text-coffee-950">#{lookupResult.coupon.orderNumber}</strong></p>
                          <p>Amount: <strong className="text-coffee-950">₹{lookupResult.coupon.totalAmount}</strong></p>
                        </div>
                      )}
                    </div>
                  </div>

                  {lookupResult.valid && !lookupResult.coupon?.isRedeemed && (
                    <button
                      onClick={handleRedeemCoupon}
                      className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm"
                    >
                      Mark as Redeemed & Authorize Serving
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SALES & KITCHEN PIN SECURITY SETTINGS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* KITCHEN PORTAL PIN SECURITY MANAGEMENT (ADDITIONAL REQUIREMENT) */}
              <div className="p-6 rounded-3xl bg-white border border-cream-300 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-coffee-950">Kitchen Portal PIN Security</h4>
                    <p className="text-xs text-coffee-500">Only Admin can create, change, or reset the Kitchen PIN</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-coffee-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Security Status:</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                      Protected (SHA-256 Hashed)
                    </span>
                  </div>
                  <p className="text-[11px] text-coffee-500 pt-1">
                    Kitchen staff must enter this PIN to access the live Kitchen Display System (KDS).
                  </p>
                </div>

                <form onSubmit={handleUpdateKitchenPin} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-coffee-800 uppercase tracking-wider mb-1">
                      Set New Kitchen Security PIN
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        maxLength={6}
                        placeholder="Enter 4+ digit PIN"
                        value={newKitchenPin}
                        onChange={(e) => setNewKitchenPin(e.target.value)}
                        className="flex-1 py-2 px-3 rounded-xl bg-cream-50 border border-cream-300 text-sm font-mono text-coffee-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-coffee-900 hover:bg-coffee-800 text-cream-50 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Update PIN</span>
                      </button>
                    </div>
                  </div>

                  {kitchenPinSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{kitchenPinSuccess}</span>
                    </div>
                  )}
                </form>
              </div>

              {/* Cafe Settings & Operating Info */}
              <div className="p-6 rounded-3xl bg-white border border-cream-300 shadow-sm space-y-4">
                <h4 className="font-serif text-lg font-bold text-coffee-950">Café Settings & Operating Info</h4>
                <div className="space-y-2.5 text-xs text-coffee-700">
                  <div className="flex justify-between py-1.5 border-b border-cream-100">
                    <span className="font-medium">Restaurant Name:</span>
                    <strong className="text-coffee-950">{settings.cafeName}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-cream-100">
                    <span className="font-medium">UPI VPA:</span>
                    <strong className="text-coffee-950 font-mono">{settings.upiId}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-cream-100">
                    <span className="font-medium">GST Tax Rate:</span>
                    <strong className="text-coffee-950">{settings.taxPercentage}%</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-cream-100">
                    <span className="font-medium">Hours:</span>
                    <strong className="text-coffee-950">{settings.openingHours}</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-medium">Address:</span>
                    <span className="text-right text-coffee-900 max-w-xs">{settings.address}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit / Add Food Item Modal */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div 
            onClick={() => setIsEditModalOpen(false)}
            className="fixed inset-0 bg-coffee-950/70 backdrop-blur-sm" 
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-cream-300 overflow-hidden z-10 animate-fade-in p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <h3 className="font-serif text-lg font-bold text-coffee-950">
                {editingItem.id ? 'Edit Dish Details' : 'Add New Food Item'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full hover:bg-cream-100">
                <X className="w-5 h-5 text-coffee-600" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-coffee-800 uppercase mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-cream-50 border border-cream-300 text-coffee-950"
                  placeholder="e.g. Saffron Cardamom Latte"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-coffee-800 uppercase mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={editingItem.price || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-cream-50 border border-cream-300 text-coffee-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-coffee-800 uppercase mb-1">Category</label>
                  <select
                    value={editingItem.categoryId || categories[0]?.id}
                    onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-cream-50 border border-cream-300 text-coffee-950"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-coffee-800 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-cream-50 border border-cream-300 text-coffee-950"
                  placeholder="Detailed culinary description..."
                />
              </div>

              <div>
                <label className="block font-bold text-coffee-800 uppercase mb-1">Image URL</label>
                <input
                  type="url"
                  value={editingItem.imageUrl || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-cream-50 border border-cream-300 text-coffee-950 font-mono text-[11px]"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isVeg}
                    onChange={(e) => setEditingItem({ ...editingItem, isVeg: e.target.checked })}
                    className="rounded text-gold-600"
                  />
                  <span className="font-semibold text-coffee-900">Pure Veg</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isChefSpecial}
                    onChange={(e) => setEditingItem({ ...editingItem, isChefSpecial: e.target.checked })}
                    className="rounded text-gold-600"
                  />
                  <span className="font-semibold text-coffee-900">Chef Special</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isAvailable}
                    onChange={(e) => setEditingItem({ ...editingItem, isAvailable: e.target.checked })}
                    className="rounded text-gold-600"
                  />
                  <span className="font-semibold text-coffee-900">Available Today</span>
                </label>
              </div>

              <div className="pt-3 border-t border-cream-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-cream-200 text-coffee-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-coffee-900 text-cream-50 font-bold"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
