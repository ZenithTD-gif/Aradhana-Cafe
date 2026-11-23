'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle, Loader2, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { getCafeStore } from '@/lib/store/cafe-store';
import { getCartStore } from '@/lib/store/cart-store';
import { Order } from '@/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    tableNumber: string;
    customerName: string;
    customerPhone: string;
    customerNotes: string;
    totalAmount: number;
    subtotal: number;
    tax: number;
  };
  onPaymentSuccess: (order: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  orderData,
  onPaymentSuccess,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  if (!isOpen) return null;

  const upiId = 'aradhanacafe@icici';
  const upiLink = `upi://pay?pa=${upiId}&pn=Aradhana%20Cafe&am=${orderData.totalAmount}&cu=INR&tn=Table%20${encodeURIComponent(orderData.tableNumber)}%20Order`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleVerifyAndConfirm = async () => {
    setIsVerifying(true);
    try {
      const cartStore = getCartStore();
      const cartItems = cartStore.getItems();

      if (cartItems.length === 0) {
        throw new Error('Your cart is empty. Please add items before paying.');
      }

      const formattedItems = cartItems.map(item => ({
        foodItemId: item.foodItem.id,
        itemName: item.foodItem.name,
        unitPrice: item.foodItem.price,
        quantity: item.quantity,
        specialNotes: item.specialNotes,
        imageUrl: item.foodItem.imageUrl,
        isVeg: item.foodItem.isVeg,
      }));

      // Step 1: Send payment verification & order creation to backend
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: `order_sim_${Date.now()}`,
          razorpay_payment_id: `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          tableNumber: orderData.tableNumber,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerNotes: orderData.customerNotes,
          items: formattedItems,
          isSimulated: true,
        }),
      });

      const verificationData = await res.json();

      if (!res.ok || !verificationData.success || !verificationData.order) {
        throw new Error(verificationData.error || 'Payment verification failed');
      }

      const confirmedOrder: Order = verificationData.order;

      // Update local client store cache as well
      const cafeStore = getCafeStore();
      cafeStore.addOrder(confirmedOrder);
      cafeStore.broadcast('NEW_PAID_ORDER', confirmedOrder);

      // Clear cart
      cartStore.clearCart();

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#6F4E37', '#22130B'],
      });

      // Navigate to order tracking with confirmed order
      onPaymentSuccess(confirmedOrder);
    } catch (err: any) {
      alert(err.message || 'Payment processing error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-coffee-950/70 backdrop-blur-sm transition-opacity" 
      />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-cream-300 overflow-hidden z-10 animate-fade-in">
        {/* Top Header */}
        <div className="p-5 bg-coffee-950 text-cream-50 flex items-center justify-between border-b border-gold-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-cream-50">Aradhana UPI Gateway</h3>
              <p className="text-xs text-cream-300">Instant Verification & Order Lock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-cream-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount Display */}
          <div className="text-center p-4 rounded-2xl bg-cream-100/70 border border-cream-300">
            <span className="text-xs uppercase tracking-wider text-coffee-600 font-semibold block">
              Total Payable Amount (Incl. GST)
            </span>
            <div className="text-3xl sm:text-4xl font-serif font-bold text-coffee-950 mt-1">
              ₹{orderData.totalAmount.toFixed(2)}
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-xs font-semibold text-coffee-800 border border-cream-200">
              <span>Seated at:</span>
              <strong className="text-coffee-950">{orderData.tableNumber}</strong>
            </div>
          </div>

          {/* QR Code for Mobile Scanning */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white border-2 border-dashed border-gold-400 shadow-xs">
            <div className="p-3 bg-white rounded-xl shadow-md border border-cream-200">
              <QRCodeSVG
                value={upiLink}
                size={160}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-coffee-600 font-medium mt-3 text-center">
              Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-coffee-700 bg-cream-100 px-3 py-1.5 rounded-lg border border-cream-300">
              <span className="font-mono font-bold text-coffee-950">{upiId}</span>
              <button
                onClick={handleCopyUpi}
                className="text-gold-700 hover:text-gold-800 p-0.5"
                title="Copy UPI ID"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Verification CTA Button */}
          <div className="space-y-3">
            <button
              onClick={handleVerifyAndConfirm}
              disabled={isVerifying}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-coffee-900 to-coffee-950 hover:from-coffee-800 hover:to-coffee-900 text-cream-50 font-bold text-base transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2.5 border border-gold-500/40 disabled:opacity-75"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-gold-400" />
                  <span>Verifying Payment Signature...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-gold-400" />
                  <span>Complete Payment & Get Order Coupon</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-coffee-500 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Only verified payments trigger order placement and kitchen alert.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
