'use client';

import React, { useState } from 'react';
import { X, ArrowRight, Shield, User, Phone, FileText, QrCode } from 'lucide-react';
import { getCartStore } from '@/lib/store/cart-store';
import { PaymentModal } from './PaymentModal';
import { Order } from '@/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
  onPaymentSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  tableNumber,
  onPaymentSuccess,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const cartStore = getCartStore();
  const subtotal = cartStore.getSubtotal();
  const tax = cartStore.getTaxAmount();
  const total = cartStore.getTotal();

  if (!isOpen) return null;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPaymentModal(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-coffee-950/60 backdrop-blur-sm transition-opacity" 
        />

        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-cream-300 overflow-hidden z-10 animate-fade-in">
          {/* Header */}
          <div className="p-5 bg-white border-b border-cream-300 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-coffee-950">Confirm Table & Order</h3>
              <p className="text-xs text-coffee-500">Quick details for your order token</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-cream-100 text-coffee-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleProceedToPayment} className="p-6 space-y-5">
            {/* Table confirmation card */}
            <div className="p-3.5 rounded-2xl bg-cream-100/80 border border-cream-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-coffee-900 text-gold-400 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-coffee-500 font-medium uppercase tracking-wider">Identified Table</span>
                  <h4 className="font-bold text-base text-coffee-950">{tableNumber}</h4>
                </div>
              </div>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
                Verified QR
              </span>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-coffee-800 uppercase tracking-wider mb-1.5">
                  Your Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter guest name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm text-coffee-950 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-coffee-800 uppercase tracking-wider mb-1.5">
                  Mobile Number (For SMS / WhatsApp Bill)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm text-coffee-950 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-coffee-800 uppercase tracking-wider mb-1.5">
                  Chef Instructions / Dietary Notes
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-coffee-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="E.g., extra hot coffee, gluten allergy, no sugar in shake..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-cream-50 border border-cream-300 text-sm text-coffee-950 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="pt-3 border-t border-cream-200 space-y-1 text-xs text-coffee-700">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-coffee-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%):</span>
                <span className="font-semibold text-coffee-900">₹{tax.toFixed(2)}</span>
              </div>
              <div className="pt-2 flex justify-between items-baseline font-bold text-coffee-950 text-base">
                <span className="font-serif">Amount Payable:</span>
                <span className="text-xl text-gold-700 font-serif">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Pay Now Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-full bg-coffee-900 hover:bg-coffee-800 text-cream-50 font-bold text-sm tracking-wide transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 border border-gold-500/30"
            >
              <span>Pay Online via UPI (₹{total.toFixed(2)})</span>
              <ArrowRight className="w-4 h-4 text-gold-400" />
            </button>
          </form>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderData={{
            tableNumber,
            customerName,
            customerPhone,
            customerNotes,
            totalAmount: total,
            subtotal,
            tax,
          }}
          onPaymentSuccess={(order) => {
            setShowPaymentModal(false);
            onClose();
            onPaymentSuccess(order);
          }}
        />
      )}
    </>
  );
};
