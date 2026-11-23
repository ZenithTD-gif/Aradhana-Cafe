'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowRight, User, Phone, FileText, QrCode, Check, AlertCircle } from 'lucide-react';
import { getCartStore } from '@/lib/store/cart-store';
import { getCafeStore } from '@/lib/store/cafe-store';
import { PaymentModal } from './PaymentModal';
import { Order, TableItem } from '@/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const cafeStore = getCafeStore();
  const tables = cafeStore.getTables();
  const isQRIdentified = cafeStore.getIsTableIdentifiedFromQR();
  const existingActiveTable = cafeStore.getActiveTable();

  // If table was identified through QR, use it; otherwise start unselected
  const [selectedTable, setSelectedTable] = useState<string>(existingActiveTable || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [tableError, setTableError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const cartStore = getCartStore();
  const subtotal = cartStore.getSubtotal();
  const tax = cartStore.getTaxAmount();
  const total = cartStore.getTotal();

  useEffect(() => {
    if (existingActiveTable) {
      setSelectedTable(existingActiveTable);
    }
  }, [existingActiveTable]);

  if (!isOpen) return null;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();

    // REQUIRE Table Selection
    if (!selectedTable.trim()) {
      setTableError('Please select the table number you are seated at.');
      return;
    }

    setTableError('');
    // Save selected table in store
    cafeStore.setActiveTable(selectedTable);
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
              <h3 className="font-serif text-xl font-bold text-coffee-950">Checkout & Table Selection</h3>
              <p className="text-xs text-coffee-500">Confirm your dining table and details</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-cream-100 text-coffee-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleProceedToPayment} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* STEP 8 & 9: TABLE SELECTION SECTION */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-coffee-950 uppercase tracking-wider">
                Which table are you sitting at? <span className="text-rose-600">*</span>
              </label>

              {isQRIdentified && selectedTable ? (
                /* QR-Identified Table Banner */
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Auto-Identified from QR</span>
                      <h4 className="font-bold text-base text-emerald-950">{selectedTable}</h4>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-700 font-bold bg-white px-2.5 py-1 rounded-full border border-emerald-200">
                    Verified
                  </span>
                </div>
              ) : (
                /* Manual Table Selection Grid: Table 01, Table 02, etc. */
                <div className="space-y-2">
                  <p className="text-xs text-coffee-600">
                    Please tap the table number printed on your table stand:
                  </p>

                  <div className="grid grid-cols-4 gap-2">
                    {tables.map((tbl) => {
                      const isSelected = selectedTable === tbl.tableNumber;
                      return (
                        <button
                          key={tbl.id}
                          type="button"
                          onClick={() => {
                            setSelectedTable(tbl.tableNumber);
                            setTableError('');
                          }}
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border text-center flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'bg-coffee-900 text-gold-300 border-gold-500 shadow-md ring-2 ring-gold-400/50'
                              : 'bg-cream-50 hover:bg-cream-100 text-coffee-900 border-cream-300'
                          }`}
                        >
                          <span className="leading-tight">{tbl.tableNumber}</span>
                          {isSelected && <Check className="w-3 h-3 text-gold-400 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>

                  {tableError && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold pt-1">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{tableError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Customer Contact Details (Optional) */}
            <div className="space-y-3 pt-2 border-t border-cream-200">
              <div>
                <label className="block text-xs font-semibold text-coffee-800 uppercase tracking-wider mb-1">
                  Your Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter guest name"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-cream-50 border border-cream-300 text-xs sm:text-sm text-coffee-950 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-coffee-800 uppercase tracking-wider mb-1">
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-cream-50 border border-cream-300 text-xs sm:text-sm text-coffee-950 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>
            </div>

            {/* STEP 10: REVIEW FINAL ORDER BILL */}
            <div className="pt-3 border-t border-cream-200 space-y-1.5 text-xs text-coffee-700">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-coffee-950">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Restaurant GST (5%):</span>
                <span className="font-semibold text-coffee-950">₹{tax.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-cream-200 flex justify-between items-baseline font-bold text-coffee-950 text-sm sm:text-base">
                <span className="font-serif">Final Amount Payable:</span>
                <span className="text-xl text-gold-700 font-serif">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* STEP 11: PROCEED TO ONLINE UPI PAYMENT */}
            <button
              type="submit"
              disabled={!selectedTable}
              className={`w-full py-3.5 px-4 rounded-full font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 border ${
                selectedTable
                  ? 'bg-coffee-900 hover:bg-coffee-800 text-cream-50 border-gold-500/30'
                  : 'bg-stone-300 text-stone-600 border-stone-400 cursor-not-allowed'
              }`}
            >
              <span>Continue to Online UPI Payment (₹{total.toFixed(2)})</span>
              <ArrowRight className="w-4 h-4 text-gold-400" />
            </button>

            {!selectedTable && (
              <p className="text-[11px] text-center text-rose-600 font-medium -mt-2">
                * Please select your table number above to continue to payment.
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderData={{
            tableNumber: selectedTable,
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
