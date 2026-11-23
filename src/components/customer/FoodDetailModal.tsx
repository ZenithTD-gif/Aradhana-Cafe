'use client';

import React from 'react';
import { X, Clock, Flame, Star, Plus, Minus, Check } from 'lucide-react';
import { FoodItem } from '@/types';
import { getCartStore } from '@/lib/store/cart-store';

interface FoodDetailModalProps {
  item: FoodItem | null;
  onClose: () => void;
  quantityInCart: number;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  item,
  onClose,
  quantityInCart,
}) => {
  if (!item) return null;

  const cartStore = getCartStore();

  const handleAdd = () => {
    cartStore.addItem(item, 1);
  };

  const handleIncrement = () => {
    cartStore.updateQuantity(item.id, 1);
  };

  const handleDecrement = () => {
    cartStore.updateQuantity(item.id, -1);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-coffee-950/70 backdrop-blur-sm transition-opacity" 
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-cream-300 overflow-hidden z-10 animate-fade-in">
        {/* Image */}
        <div className="relative w-full h-56 bg-cream-100">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-coffee-950/70 text-white flex items-center justify-center hover:bg-coffee-950 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badges */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full bg-white/90 text-coffee-950 text-xs font-bold backdrop-blur-sm shadow-sm">
              {item.categoryName}
            </span>
            {item.isChefSpecial && (
              <span className="px-2.5 py-1 rounded-full bg-gold-500 text-coffee-950 text-xs font-bold shadow-sm flex items-center gap-1">
                <Star className="w-3 h-3 fill-coffee-950" /> Special
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                <span className="text-xs font-semibold text-coffee-600">{item.isVeg ? 'Vegetarian' : 'Non-Veg'}</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-coffee-950 mt-1">
                {item.name}
              </h3>
            </div>
            <div className="text-xl font-bold text-gold-700 font-serif">
              ₹{item.price}
            </div>
          </div>

          <p className="text-sm text-coffee-700 leading-relaxed">
            {item.description}
          </p>

          {/* Specifications */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-cream-200 text-xs text-coffee-700">
            {item.preparationTimeMins && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold-600" />
                <span>Prep: {item.preparationTimeMins} minutes</span>
              </div>
            )}
            {item.calories && (
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-gold-600" />
                <span>Energy: {item.calories} kcal</span>
              </div>
            )}
          </div>

          {/* Add / Action */}
          <div className="pt-2">
            {item.isAvailable ? (
              quantityInCart > 0 ? (
                <div className="flex items-center justify-between bg-coffee-900 text-cream-50 rounded-2xl p-2 px-4 shadow-md">
                  <span className="text-xs font-semibold">Added to your order</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDecrement}
                      className="w-7 h-7 rounded-full bg-coffee-800 text-white flex items-center justify-center hover:bg-coffee-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-gold-400">{quantityInCart}</span>
                    <button
                      onClick={handleIncrement}
                      className="w-7 h-7 rounded-full bg-gold-500 text-coffee-950 flex items-center justify-center hover:bg-gold-400"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleAdd}
                  className="w-full py-3.5 px-4 rounded-full bg-coffee-900 hover:bg-coffee-800 text-cream-50 font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 border border-gold-500/30"
                >
                  <Plus className="w-4 h-4 text-gold-400" />
                  <span>Add to Cart (₹{item.price})</span>
                </button>
              )
            ) : (
              <div className="w-full py-3 text-center rounded-2xl bg-rose-50 text-rose-700 font-bold text-sm border border-rose-200">
                Currently Sold Out / Unavailable Today
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
