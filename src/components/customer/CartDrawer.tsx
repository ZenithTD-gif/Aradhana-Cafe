'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag, Sparkles, MessageSquare } from 'lucide-react';
import { getCartStore } from '@/lib/store/cart-store';
import { CartItem } from '@/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
  tableNumber: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
  tableNumber,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const cartStore = getCartStore();
    const update = () => {
      setItems(cartStore.getItems());
      setSubtotal(cartStore.getSubtotal());
      setTax(cartStore.getTaxAmount());
      setTotal(cartStore.getTotal());
    };

    update();
    return cartStore.subscribe(update);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-coffee-950/60 backdrop-blur-sm transition-opacity" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F2] shadow-2xl flex flex-col border-l border-cream-300">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-white border-b border-cream-300 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-coffee-900 text-gold-400 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-coffee-950">Your Cart</h3>
                <p className="text-xs text-coffee-500">Seated at: <strong className="text-coffee-900">{tableNumber}</strong></p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-cream-100 text-coffee-600 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-cream-200 flex items-center justify-center text-coffee-400 mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-serif text-lg font-bold text-coffee-950">Your cart is empty</h4>
                <p className="text-xs text-coffee-600 mt-1 max-w-xs mx-auto">
                  Scan the menu and add your favorite filter coffee, sourdough toasts, or bowls!
                </p>
                <button
                  onClick={onClose}
                  className="mt-5 px-5 py-2.5 rounded-full bg-coffee-900 text-cream-50 text-xs font-semibold shadow-md"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div 
                  key={item.foodItem.id}
                  className="p-3.5 rounded-2xl bg-white border border-cream-300 shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={item.foodItem.imageUrl}
                        alt={item.foodItem.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 bg-cream-100"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${item.foodItem.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                          <h4 className="font-semibold text-sm text-coffee-950 line-clamp-1">
                            {item.foodItem.name}
                          </h4>
                        </div>
                        <p className="text-xs text-gold-700 font-bold mt-0.5">
                          ₹{item.foodItem.price} × {item.quantity} = ₹{item.foodItem.price * item.quantity}
                        </p>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-cream-100 rounded-full p-1 border border-cream-300">
                      <button
                        onClick={() => getCartStore().updateQuantity(item.foodItem.id, -1)}
                        className="w-6 h-6 rounded-full bg-white hover:bg-cream-200 text-coffee-800 flex items-center justify-center transition-colors shadow-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center text-coffee-950">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => getCartStore().updateQuantity(item.foodItem.id, 1)}
                        className="w-6 h-6 rounded-full bg-coffee-900 hover:bg-coffee-800 text-cream-50 flex items-center justify-center transition-colors shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Special Cooking Instructions for Kitchen */}
                  <div className="pt-2 border-t border-cream-100 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3 text-coffee-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Special note (e.g., less sugar, extra crisp)..."
                      value={item.specialNotes || ''}
                      onChange={(e) => getCartStore().updateSpecialNotes(item.foodItem.id, e.target.value)}
                      className="w-full text-xs bg-cream-50 rounded-lg px-2 py-1 text-coffee-800 placeholder-coffee-400 border border-cream-200 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Bill Calculation & Checkout Button */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-white border-t border-cream-300 space-y-3">
              {/* Breakdown */}
              <div className="space-y-1.5 text-xs text-coffee-700">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span className="font-semibold text-coffee-950">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Restaurant GST (5%)</span>
                  <span className="font-semibold text-coffee-950">₹{tax.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-cream-200 flex justify-between items-baseline text-sm font-bold text-coffee-950">
                  <span className="font-serif text-base">Grand Total</span>
                  <span className="text-xl text-gold-700">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Proceed Button */}
              <button
                onClick={onProceedToCheckout}
                className="w-full py-3.5 px-4 rounded-full bg-coffee-900 hover:bg-coffee-800 text-cream-50 font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 border border-gold-500/30"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 text-gold-400" />
              </button>

              <p className="text-[10px] text-center text-coffee-500">
                🔒 Safe & Instant UPI Payment with Razorpay
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
