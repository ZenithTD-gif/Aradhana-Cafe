'use client';

import React from 'react';
import { Plus, Minus, AlertCircle } from 'lucide-react';
import { FoodItem } from '@/types';
import { getCartStore } from '@/lib/store/cart-store';

interface FoodCardProps {
  item: FoodItem;
  quantityInCart: number;
}

export const FoodCard: React.FC<FoodCardProps> = ({ item, quantityInCart }) => {
  const cartStore = getCartStore();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAvailable) return;
    cartStore.addItem(item, 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAvailable) return;
    cartStore.updateQuantity(item.id, 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    cartStore.updateQuantity(item.id, -1);
  };

  return (
    <div 
      className={`relative flex flex-col rounded-2xl bg-white border transition-all duration-200 shadow-sm overflow-hidden ${
        item.isAvailable 
          ? 'border-cream-300 hover:border-gold-400' 
          : 'border-red-200/70 bg-stone-50/80 opacity-80'
      }`}
    >
      {/* 1. Food Image */}
      <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-cream-100">
        <img
          src={item.imageUrl}
          alt={item.name}
          className={`w-full h-full object-cover ${item.isAvailable ? '' : 'grayscale-[40%]'}`}
          loading="lazy"
        />

        {/* Veg / Non-Veg Indicator Badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className="w-5 h-5 rounded-md bg-white/95 p-0.5 flex items-center justify-center border border-stone-200 shadow-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
          </div>
        </div>

        {/* Sold Out / Unavailable Overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-coffee-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-3 z-20">
            <AlertCircle className="w-6 h-6 text-rose-400 mb-1" />
            <span className="font-bold text-white text-xs tracking-wider uppercase">
              Sold Out
            </span>
            <span className="text-stone-300 text-[10px]">
              Unavailable today
            </span>
          </div>
        )}
      </div>

      {/* Content: 2. Food Name, 3. Food Price, 4. Add Button */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-3">
        {/* 2. Food Name */}
        <h3 className={`font-serif text-base font-bold leading-snug line-clamp-1 ${
          item.isAvailable ? 'text-coffee-950' : 'text-stone-500 line-through'
        }`}>
          {item.name}
        </h3>

        {/* Bottom Bar: 3. Price & 4. Add Button */}
        <div className="pt-2 border-t border-cream-200 flex items-center justify-between">
          {/* 3. Food Price */}
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs font-semibold text-gold-700">₹</span>
            <span className="text-lg font-bold text-coffee-950">{item.price}</span>
          </div>

          {/* 4. Add Button / Quantity Controls */}
          {item.isAvailable ? (
            quantityInCart > 0 ? (
              <div className="flex items-center gap-2 bg-coffee-900 text-cream-50 rounded-full px-2 py-1 shadow-sm border border-gold-500/30">
                <button
                  onClick={handleDecrement}
                  className="w-6 h-6 rounded-full bg-coffee-800 hover:bg-coffee-700 flex items-center justify-center text-cream-100 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold w-4 text-center text-gold-300">
                  {quantityInCart}
                </span>
                <button
                  onClick={handleIncrement}
                  className="w-6 h-6 rounded-full bg-gold-500 hover:bg-gold-400 text-coffee-950 flex items-center justify-center transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                className="px-4 py-1.5 rounded-full bg-coffee-900 hover:bg-coffee-800 text-cream-50 text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-1 border border-gold-500/30"
              >
                <Plus className="w-3.5 h-3.5 text-gold-400" />
                <span>Add</span>
              </button>
            )
          ) : (
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
