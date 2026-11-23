'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroBanner } from '@/components/customer/HeroBanner';
import { MenuSection } from '@/components/customer/MenuSection';
import { CartDrawer } from '@/components/customer/CartDrawer';
import { CheckoutModal } from '@/components/customer/CheckoutModal';
import { TableSelectorModal } from '@/components/customer/TableSelectorModal';
import { FoodDetailModal } from '@/components/customer/FoodDetailModal';
import { getCafeStore } from '@/lib/store/cafe-store';
import { getCartStore } from '@/lib/store/cart-store';
import { Category, FoodItem, Order, RestaurantSettings } from '@/types';
import { Coffee, MapPin, Award, Clock, Sparkles } from 'lucide-react';

function CustomerHomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [settings, setSettings] = useState<RestaurantSettings>(getCafeStore().getSettings());
  const [categories, setCategories] = useState<Category[]>(getCafeStore().getCategories());
  const [foodItems, setFoodItems] = useState<FoodItem[]>(getCafeStore().getFoodItems());
  const [activeTable, setActiveTable] = useState<string>(getCafeStore().getActiveTable());

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);

  // Detect table from URL parameters (e.g. ?table=3 or ?table=Table%203)
  useEffect(() => {
    const tableParam = searchParams.get('table');
    if (tableParam) {
      const formattedTable = tableParam.toLowerCase().startsWith('table') 
        ? tableParam 
        : `Table ${tableParam}`;
      getCafeStore().setActiveTable(formattedTable);
      setActiveTable(formattedTable);
    }
  }, [searchParams]);

  // Subscribe to live cafe store changes (availability updates, new items, etc.)
  useEffect(() => {
    const cafeStore = getCafeStore();
    const update = () => {
      setSettings(cafeStore.getSettings());
      setCategories(cafeStore.getCategories());
      setFoodItems(cafeStore.getFoodItems());
      setActiveTable(cafeStore.getActiveTable());
    };

    update();
    return cafeStore.subscribe(update);
  }, []);

  const handleSelectTable = (tableNumber: string) => {
    getCafeStore().setActiveTable(tableNumber);
    setActiveTable(tableNumber);
  };

  const handlePaymentSuccess = (confirmedOrder: Order) => {
    // Navigate to live tracking & unique coupon code page
    router.push(`/order/${confirmedOrder.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      {/* Navigation */}
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTableSelector={() => setIsTableModalOpen(true)}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroBanner
          activeTable={activeTable}
          onOpenTableSelector={() => setIsTableModalOpen(true)}
          bannerText={settings.bannerText}
        />

        {/* Café Highlights */}
        <section className="border-y border-cream-300 bg-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200">
                <div className="w-10 h-10 rounded-full bg-gold-500/15 text-gold-600 flex items-center justify-center mx-auto mb-2">
                  <Coffee className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-coffee-950 text-sm">Estate Beans</h4>
                <p className="text-[11px] text-coffee-600 mt-0.5">Shade-grown Chikmagalur Arabica</p>
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200">
                <div className="w-10 h-10 rounded-full bg-gold-500/15 text-gold-600 flex items-center justify-center mx-auto mb-2">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-coffee-950 text-sm">Artisan Bakery</h4>
                <p className="text-[11px] text-coffee-600 mt-0.5">Fresh French butter croissants</p>
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200">
                <div className="w-10 h-10 rounded-full bg-gold-500/15 text-gold-600 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-coffee-950 text-sm">Zero Waiting</h4>
                <p className="text-[11px] text-coffee-600 mt-0.5">Table QR ordering & fast prep</p>
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200">
                <div className="w-10 h-10 rounded-full bg-gold-500/15 text-gold-600 flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-coffee-950 text-sm">Instant UPI Pay</h4>
                <p className="text-[11px] text-coffee-600 mt-0.5">Verified server confirmation</p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Food Menu Section */}
        <MenuSection
          categories={categories}
          foodItems={foodItems}
          onOpenDetail={(item) => setSelectedFoodItem(item)}
        />

        {/* Café Story & Heritage Section */}
        <section id="story" className="py-16 bg-gradient-to-b from-coffee-950 to-coffee-900 text-cream-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs uppercase tracking-widest font-bold text-gold-400">
                  Our Legacy & Passion
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-cream-50 leading-tight">
                  Born from a reverence for the sacred morning brew.
                </h2>
                <p className="text-sm sm:text-base text-cream-300 leading-relaxed font-light">
                  At Aradhana Café, coffee isn't merely a morning beverage; it is an intimate daily ritual. Every morning, our baristas calibrate single-origin Arabica roasts nurtured under silver oak canopies in Chikmagalur.
                </p>
                <p className="text-sm sm:text-base text-cream-300 leading-relaxed font-light">
                  From traditional brass dabarah filter coffee to hand-pulled espresso shots and slow-proofed sourdough loaves, each creation pays homage to craft and community.
                </p>
              </div>

              <div className="lg:col-span-6 grid grid-cols-2 gap-4">
                <img
                  src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80"
                  alt="Coffee roasting process"
                  className="rounded-2xl object-cover h-56 w-full shadow-lg border border-gold-500/20"
                />
                <img
                  src="https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80"
                  alt="Artisanal dining table"
                  className="rounded-2xl object-cover h-56 w-full shadow-lg border border-gold-500/20 mt-6"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Location & Google Maps Section */}
        <section id="location" className="py-14 bg-white border-t border-cream-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-xs uppercase tracking-widest font-bold text-gold-600 block mb-1">
                Visit Aradhana Café
              </span>
              <h2 className="font-serif text-3xl font-bold text-coffee-950">
                Location & Ambiance
              </h2>
              <p className="text-xs sm:text-sm text-coffee-600 mt-2">
                Nestled amidst verdant rain trees on Indiranagar’s 12th Main, featuring an open courtyard and private dining alcoves.
              </p>
            </div>

            <div className="rounded-3xl overflow-hidden border border-cream-300 shadow-md h-80 relative bg-cream-100">
              <iframe
                title="Aradhana Cafe Location Map"
                src="https://maps.google.com/maps?q=Indiranagar%20Bengaluru&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
              />
              <div className="absolute bottom-4 left-4 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-cream-300 shadow-lg max-w-xs text-xs text-coffee-900">
                <div className="flex items-center gap-2 font-bold text-sm text-coffee-950 mb-1">
                  <MapPin className="w-4 h-4 text-gold-600" />
                  <span>Aradhana Café</span>
                </div>
                <p className="text-coffee-600 leading-tight">108 Heritage Blvd, Indiranagar, Bengaluru</p>
                <div className="mt-2 text-[11px] font-semibold text-emerald-700">Open 7:00 AM – 11:00 PM Daily</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        tableNumber={activeTable}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        tableNumber={activeTable}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Table Selector Modal */}
      <TableSelectorModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        currentTable={activeTable}
        onSelectTable={handleSelectTable}
      />

      {/* Food Detail Modal */}
      <FoodDetailModal
        item={selectedFoodItem}
        onClose={() => setSelectedFoodItem(null)}
        quantityInCart={0}
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
