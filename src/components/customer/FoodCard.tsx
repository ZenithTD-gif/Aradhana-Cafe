'use client';

import React from 'react';
import { Plus, Minus, Flame, Star, Clock, AlertCircle } from 'lucide-react';
import { FoodItem } from '@/types';
import { getCartStore } from '@/lib/store/cart-store';

interface FoodCardProps {
  item: FoodItem;
  quantityInCart: number;
  onOpenDetail?: (item: FoodItem) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ item, quantityInCart, onOpenDetail }) => {
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
      onClick={() => onOpenDetail?.(item)}
      className={`group relative flex flex-col rounded-2xl bg-white border transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer overflow-hidden ${
        item.isAvailable 
          ? 'border-cream-300 hover:border-gold-400' 
          : 'border-red-200/70 bg-stone-50/80 opacity-80'
      }`}
    >
      {/* Food Image Container */}
      <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-cream-100">
        <img
          src={item.imageUrl}
          alt={item.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            item.isAvailable ? 'group-hover:scale-105' : 'grayscale-[40%]'
          }`}
          loading="lazy"
        />

        {/* Gradient Overlay for badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

        {/* Veg / Non-Veg Indicator Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <div className="w-5 h-5 rounded-md bg-white/95 p-0.5 flex items-center justify-center border border-stone-200 shadow-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
          </div>
          {item.isVeg && (
            <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-100 backdrop-blur-sm">
              Pure Veg
            </span>
          )}
        </div>

        {/* Special Tags (Chef Special, Spicy) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-10">
          {item.isChefSpecial && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-500 text-coffee-950 font-bold text-[10px] uppercase shadow-sm">
              <Star className="w-3 h-3 fill-coffee-950" />
              Special
            </span>
          )}
          {item.isSpicy && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px] uppercase shadow-sm">
              <Flame className="w-3 h-3 fill-white" />
              Spicy
            </span>
          )}
        </div>

        {/* CRITICAL: Sold Out / Unavailable Overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-coffee-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-3 z-20">
            <div className="w-9 h-9 rounded-full bg-rose-600/90 text-white flex items-center justify-center mb-1 shadow-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-sm tracking-wide uppercase">
              Sold Out
            </span>
            <span className="text-stone-300 text-[11px] mt-0.5">
              Unavailable today
            </span>
          </div>
        )}
      </div>

      {/* Content Details */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-serif text-base sm:text-lg font-bold leading-snug line-clamp-1 ${
              item.isAvailable ? 'text-coffee-950 group-hover:text-gold-700' : 'text-stone-600 line-through'
            }`}>
              {item.name}
            </h3>
          </div>

          <p className="text-xs text-coffee-600/90 line-clamp-2 mt-1.5 leading-relaxed">
            {item.description}
          </p>

          {item.preparationTimeMins && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-coffee-500 font-medium">
              <Clock className="w-3 h-3 text-gold-600" />
              <span>Prep: {item.preparationTimeMins} mins</span>
              {item.calories && <span className="text-coffee-400 ml-2">• {item.calories} kcal</span>}
            </div>
          )}
        </div>

        {/* Price & Action Button */}
        <div className="mt-4 pt-3 border-t border-cream-200 flex items-center justify-between">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs font-semibold text-gold-700">₹</span>
            <span className="text-lg sm:text-xl font-bold text-coffee-950">{item.price}</span>
          </div>

          {/* Add to Cart or Quantity Controls */}
          {item.isAvailable ? (
            quantityInCart > 0 ? (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 bg-coffee-900 text-cream-50 rounded-full px-2 py-1 shadow-sm border border-gold-500/30"
              >
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
                className="px-3.5 py-1.5 rounded-full bg-cream-200 hover:bg-gold-500 hover:text-coffee-950 text-coffee-900 text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-1 border border-cream-400/60"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            )
          ) : (
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
              Not Orderable
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
