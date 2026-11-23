'use client';

import React, { useState, useMemo } from 'react';
import { Search, Zap, X } from 'lucide-react';
import { Category, FoodItem } from '@/types';
import { FoodCard } from './FoodCard';
import { getCartStore } from '@/lib/store/cart-store';

interface MenuSectionProps {
  categories: Category[];
  foodItems: FoodItem[];
  readyToServeFilter: boolean;
  onClearReadyToServe: () => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  categories,
  foodItems,
  readyToServeFilter,
  onClearReadyToServe,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});

  // Subscribe to cart changes for live quantity display
  React.useEffect(() => {
    const cartStore = getCartStore();
    const update = () => {
      const map: Record<string, number> = {};
      cartStore.getItems().forEach(item => {
        map[item.foodItem.id] = item.quantity;
      });
      setCartQuantities(map);
    };

    update();
    return cartStore.subscribe(update);
  }, []);

  // Filter items based on category, search, and ready-to-serve
  const filteredItems = useMemo(() => {
    return foodItems.filter(item => {
      // Ready-to-serve filter (only available and quick prep <= 5 mins)
      if (readyToServeFilter) {
        if (!item.isAvailable || (item.preparationTimeMins || 5) > 5) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }

      // Search keyword matching (supports partial keywords: Tea, Coffee, Rice, Roti, Bread, Burger, Pizza, Snacks, Beverages)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName = item.name.toLowerCase().includes(q);
        const inCat = item.categoryName?.toLowerCase().includes(q);
        const inDesc = item.description?.toLowerCase().includes(q);
        if (!inName && !inCat && !inDesc) {
          return false;
        }
      }

      return true;
    });
  }, [foodItems, selectedCategory, searchQuery, readyToServeFilter]);

  return (
    <section id="menu" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Menu Title */}
      <div className="text-center max-w-xl mx-auto space-y-1">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-coffee-950">
          Our Food Menu
        </h2>
        <p className="text-xs sm:text-sm text-coffee-600">
          Select your dishes and add them to your cart.
        </p>
      </div>

      {/* Ready-to-Serve Active Filter Notice Banner (if active) */}
      {readyToServeFilter && (
        <div className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs sm:text-sm text-amber-950 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 fill-amber-600 text-amber-600" />
            <span className="font-semibold">Showing Ready-to-Serve Food (Instant Service)</span>
          </div>
          <button
            onClick={onClearReadyToServe}
            className="flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 underline"
          >
            <span>Show Full Menu</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Tea, Coffee, Rice, Roti, Bread, Burger, Pizza..."
          className="w-full pl-9 pr-4 py-2.5 rounded-full bg-white border border-cream-300 text-sm text-coffee-950 placeholder-coffee-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50 shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-coffee-400 hover:text-coffee-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills (Horizontal Scroll) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar justify-start sm:justify-center">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-xs ${
            selectedCategory === 'all'
              ? 'bg-coffee-900 text-cream-50 shadow-md border border-gold-500/30'
              : 'bg-white text-coffee-800 hover:bg-cream-200 border border-cream-300'
          }`}
        >
          All Items ({foodItems.length})
        </button>

        {categories.map((cat) => {
          const count = foodItems.filter(i => i.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-xs ${
                selectedCategory === cat.id
                  ? 'bg-coffee-900 text-cream-50 shadow-md border border-gold-500/30'
                  : 'bg-white text-coffee-800 hover:bg-cream-200 border border-cream-300'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Food Cards Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-2">
          {filteredItems.map((item) => (
            <FoodCard
              key={item.id}
              item={item}
              quantityInCart={cartQuantities[item.id] || 0}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-cream-300 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center text-coffee-500 mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-coffee-950">No food items found</h3>
          <p className="text-xs text-coffee-600 max-w-sm mx-auto">
            No dishes match "{searchQuery}". Try searching for Tea, Coffee, Rice, Roti, Bread, Burger, Pizza, or Snacks.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              if (readyToServeFilter) onClearReadyToServe();
            }}
            className="px-4 py-2 rounded-full bg-coffee-900 text-cream-50 text-xs font-semibold shadow-xs"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
};
