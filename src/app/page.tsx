'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroBanner } from '@/components/customer/HeroBanner';
import { MenuSection } from '@/components/customer/MenuSection';
import { CartDrawer } from '@/components/customer/CartDrawer';
import { CheckoutModal } from '@/components/customer/CheckoutModal';
import { getCafeStore } from '@/lib/store/cafe-store';
import { Category, FoodItem, Order } from '@/types';

function CustomerHomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>(getCafeStore().getCategories());
  const [foodItems, setFoodItems] = useState<FoodItem[]>(getCafeStore().getFoodItems());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [readyToServeFilter, setReadyToServeFilter] = useState(false);

  // Detect table from QR code URL parameters (e.g. ?table=03 or ?table=Table%2003)
  useEffect(() => {
    const tableParam = searchParams.get('table');
    if (tableParam) {
      const formattedTable = tableParam.toLowerCase().startsWith('table')
        ? tableParam
        : `Table ${tableParam.padStart(2, '0')}`;
      getCafeStore().setActiveTable(formattedTable, true); // true = identified from QR
    }
  }, [searchParams]);

  // Subscribe to live menu updates & availability changes
  useEffect(() => {
    const cafeStore = getCafeStore();
    const update = () => {
      setCategories(cafeStore.getCategories());
      setFoodItems(cafeStore.getFoodItems());
    };

    update();
    return cafeStore.subscribe(update);
  }, []);

  const handleExploreReadyToServe = () => {
    setReadyToServeFilter(true);
    // Smooth scroll to menu
    const menuEl = document.getElementById('menu');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePaymentSuccess = (confirmedOrder: Order) => {
    router.push(`/order/${confirmedOrder.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      {/* Navigation Bar */}
      <Navbar onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1">
        {/* Sections 1 to 6: Clean, Minimal, Premium Welcome Hero */}
        <HeroBanner onExploreReadyToServe={handleExploreReadyToServe} />

        {/* Clean Menu Section */}
        <MenuSection
          categories={categories}
          foodItems={foodItems}
          readyToServeFilter={readyToServeFilter}
          onClearReadyToServe={() => setReadyToServeFilter(false)}
        />
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal (Enforces Table Selection if not QR identified) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function CustomerHome() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-serif text-coffee-900">Loading Aradhana Café...</div>}>
      <CustomerHomeContent />
    </Suspense>
  );
}
