'use client';

import React from 'react';
import { Sparkles, QrCode, ArrowDown, Clock, MapPin, Coffee } from 'lucide-react';

interface HeroBannerProps {
  activeTable: string;
  onOpenTableSelector: () => void;
  bannerText?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  activeTable,
  onOpenTableSelector,
  bannerText,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#FAF6F0] via-[#F5EFEB] to-[#FAF7F2] pb-12 pt-6 sm:pt-10">
      {/* Background Subtle Pattern & Blur orbs */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-gold-200/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 rounded-full bg-coffee-200/30 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Announcement Bar */}
        {bannerText && (
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/25 text-coffee-900 text-xs sm:text-sm font-medium shadow-sm animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-gold-600 shrink-0" />
              <span>{bannerText}</span>
            </div>
          </div>
        )}

        {/* Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-coffee-900 text-cream-100 text-xs tracking-wider uppercase font-semibold">
              <Coffee className="w-3.5 h-3.5 text-gold-400" />
              <span>Estate Grown Chikmagalur Beans & Artisan Roastery</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-coffee-950 leading-[1.15] tracking-tight">
              A Symphony of <span className="text-gold-600 italic">Heritage Roast</span> & Fine Taste.
            </h1>

            <p className="text-sm sm:text-lg text-coffee-700/90 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Welcome to <span className="font-semibold text-coffee-950">Aradhana Café</span>. Browse our artisanal menu, order directly from your table, and pay seamlessly via UPI.
            </p>

            {/* Table QR Card & Call to Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <div className="flex items-center gap-3 p-2.5 px-4 rounded-2xl bg-white border border-coffee-200/80 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center text-gold-600">
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] text-coffee-500 font-medium uppercase tracking-wider">Your Table</p>
                  <p className="text-sm font-bold text-coffee-950">{activeTable}</p>
                </div>
                <button
                  onClick={onOpenTableSelector}
                  className="ml-2 text-xs text-gold-700 hover:text-gold-800 font-semibold underline underline-offset-2"
                >
                  Change
                </button>
              </div>

              <a
                href="#menu"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-coffee-900 hover:bg-coffee-800 text-cream-50 text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95 border border-gold-500/30"
              >
                <span>Explore Menu & Order</span>
                <ArrowDown className="w-4 h-4 text-gold-400 animate-bounce" />
              </a>
            </div>

            {/* Quick Highlights */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-coffee-600 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gold-600" /> Open: 7 AM – 11 PM
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gold-600" /> Indiranagar, Bengaluru
              </span>
            </div>
          </div>

          {/* Right Visual Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none">
              <div className="absolute inset-0 bg-gold-500/20 rounded-3xl transform rotate-3 scale-95 filter blur-xl"></div>
              <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-coffee-900">
                <img
                  src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80"
                  alt="Aradhana Cafe Signature Coffee Experience"
                  className="w-full h-72 sm:h-80 object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-coffee-950/80 via-transparent to-transparent flex items-end p-5">
                  <div className="text-white">
                    <span className="px-2.5 py-0.5 rounded-full bg-gold-500 text-coffee-950 text-[10px] font-bold tracking-wider uppercase">
                      CHEF'S SIGNATURE
                    </span>
                    <h3 className="font-serif text-lg font-semibold mt-1">Mysore Gold Brass Filter Brew</h3>
                    <p className="text-xs text-cream-200/90 mt-0.5">Slow-dripped with creamy frothed A2 dairy.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
