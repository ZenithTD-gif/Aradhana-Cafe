'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Coffee, MapPin, ChefHat, Shield, QrCode } from 'lucide-react';
import { getCartStore } from '@/lib/store/cart-store';
import { getCafeStore } from '@/lib/store/cafe-store';

interface NavbarProps {
  onOpenCart?: () => void;
  onOpenTableSelector?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart, onOpenTableSelector }) => {
  const [cartCount, setCartCount] = useState(0);
  const [activeTable, setActiveTable] = useState('Table 1');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const cartStore = getCartStore();
    const cafeStore = getCafeStore();

    const update = () => {
      setCartCount(cartStore.getItemCount());
      setActiveTable(cafeStore.getActiveTable());
    };

    update();
    const unsubCart = cartStore.subscribe(update);
    const unsubCafe = cafeStore.subscribe(update);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      unsubCart();
      unsubCafe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${
      isScrolled ? 'bg-[#FCFBF7]/95 backdrop-blur-md shadow-md py-3' : 'bg-[#FAF7F2] py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-coffee-800 to-coffee-950 flex items-center justify-center text-gold-400 shadow-md group-hover:scale-105 transition-transform border border-gold-500/30">
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-coffee-900 group-hover:text-coffee-700 transition-colors">
                ARADHANA
              </span>
              <span className="block text-[10px] sm:text-xs uppercase tracking-widest text-gold-600 font-semibold -mt-1">
                Café & Roastery
              </span>
            </div>
          </Link>

          {/* Center Table Indicator (Mobile & Desktop) */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onOpenTableSelector}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-200/80 hover:bg-cream-300 text-coffee-900 text-xs sm:text-sm font-medium border border-coffee-200 transition-all shadow-sm active:scale-95"
              title="Click to change or scan Table QR"
            >
              <QrCode className="w-3.5 h-3.5 text-gold-600" />
              <span className="text-coffee-600 hidden xs:inline">Seated at:</span>
              <span className="font-bold text-coffee-900">{activeTable}</span>
            </button>
          </div>

          {/* Right Action Icons & Portal Shortcuts */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Portals Switcher */}
            <div className="hidden md:flex items-center gap-1.5 mr-1 text-xs">
              <Link
                href="/admin"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-coffee-700 hover:text-coffee-950 hover:bg-cream-200 transition-colors"
                title="Admin Management Portal"
              >
                <Shield className="w-3.5 h-3.5 text-coffee-600" />
                <span>Admin</span>
              </Link>
              <Link
                href="/kitchen"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-coffee-700 hover:text-coffee-950 hover:bg-cream-200 transition-colors"
                title="Kitchen Display System"
              >
                <ChefHat className="w-3.5 h-3.5 text-coffee-600" />
                <span>Kitchen</span>
              </Link>
            </div>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 sm:px-4 sm:py-2 rounded-full bg-coffee-900 hover:bg-coffee-800 text-cream-50 flex items-center gap-2 transition-all shadow-md active:scale-95 border border-gold-500/20"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-gold-400" />
              <span className="hidden sm:inline font-medium text-sm">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:static sm:top-auto sm:right-auto bg-gold-500 text-coffee-950 font-bold text-[11px] sm:text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
