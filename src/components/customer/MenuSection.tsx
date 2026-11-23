'use client';

import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Filter, Check } from 'lucide-react';
import { Category, FoodItem } from '@/types';
import { FoodCard } from './FoodCard';
import { getCartStore } from '@/lib/store/cart-store';

interface MenuSectionProps {
  categories: Category[];
  foodItems: FoodItem[];
  onOpenDetail?: (item: FoodItem) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  categories,
  foodItems,
  onOpenDetail,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});

  // Subscribe to cart changes for quantity displays
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

  // Filter food items
  const filteredItems = useMemo(() => {
    return foodItems.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }
      // Veg only toggle
      if (vegOnly && !item.isVeg) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesCat = item.categoryName?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [foodItems, selectedCategory, vegOnly, searchQuery]);

  return (
    <section id="menu" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-xs uppercase tracking-widest font-bold text-gold-600 block mb-1">
          Handcrafted & Freshly Sourced
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-coffee-950">
          The Aradhana Menu
        </h2>
        <p className="text-sm text-coffee-600 mt-2">
          From fragrant filter roasts to wood-fired delicacies, choose your favorites and order directly to your table.
        </p>
      </div>

      {/* Search Bar & Veg Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-white p-3 rounded-2xl border border-cream-300 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coffee, breakfast, toast..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-cream-50 border border-cream-200 text-sm text-coffee-900 placeholder-coffee-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Veg Only Toggle */}
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              vegOnly
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                : 'bg-cream-100 text-coffee-700 border-cream-300 hover:bg-cream-200'
            }`}
          >
            <div className={`w-3.5 h-3.5 rounded-full border border-emerald-700 flex items-center justify-center ${vegOnly ? 'bg-emerald-600' : ''}`}>
              {vegOnly && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            <span>Pure Veg Only</span>
          </button>
        </div>
      </div>

      {/* Horizontal Category Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-8">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm ${
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
              className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <FoodCard
              key={item.id}
              item={item}
              quantityInCart={cartQuantities[item.id] || 0}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-cream-300 p-8">
          <div className="w-12 h-12 rounded-full bg-cream-200 flex items-center justify-center text-coffee-500 mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-coffee-950">No dishes match your criteria</h3>
          <p className="text-xs text-coffee-600 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords or toggle off the pure veg filter to see all dishes.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setVegOnly(false);
            }}
            className="mt-4 px-4 py-2 rounded-full bg-coffee-900 text-cream-50 text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
};
