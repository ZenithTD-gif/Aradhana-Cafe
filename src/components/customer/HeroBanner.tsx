'use client';

import React from 'react';
import { ArrowDown, Clock, MapPin, Zap } from 'lucide-react';

interface HeroBannerProps {
  onExploreReadyToServe: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExploreReadyToServe }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#FAF6F0] via-[#F5EFEB] to-[#FAF7F2] pt-8 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        
        {/* SECTION 1: WELCOME HERO & SECTION 5: CAFÉ IMAGE (CLEAN GRID) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Text & Information (Sections 1, 2, 3, 4, 6) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Section 1: Welcome Heading & Description */}
            <div className="space-y-3">
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-coffee-950 leading-[1.15] tracking-tight">
                Welcome to <span className="text-gold-600">Aradhana Café</span>
              </h1>

              <p className="text-base sm:text-lg text-coffee-700/90 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                A sanctuary of handcrafted Mysore filter roasts, heritage recipes, and gourmet delicacies, prepared fresh with warmth and artisanal care.
              </p>
            </div>

            {/* Section 2: Main CTA Button & Section 6: Ready-to-Serve Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              {/* Section 2: Main CTA Button */}
              <a
                href="#menu"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-coffee-900 hover:bg-coffee-800 text-cream-50 text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95 border border-gold-500/30"
              >
                <span>Explore Menu & Order Your Food</span>
                <ArrowDown className="w-4 h-4 text-gold-400 animate-bounce" />
              </a>

              {/* Section 6: Instant Food / Ready-to-Serve Button */}
              <button
                onClick={onExploreReadyToServe}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-coffee-950 text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95 border border-amber-600/30"
              >
                <Zap className="w-4 h-4 fill-coffee-950" />
                <span>Explore Ready-to-Serve Food</span>
              </button>
            </div>

            {/* Section 3 & 4: Opening Hours & Café Location */}
            <div className="pt-3 border-t border-cream-300/80 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm text-coffee-800 font-medium">
              {/* Section 3: Opening Hours */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold-600 shrink-0" />
                <span className="font-bold text-coffee-950">Open 7 AM to 11 PM</span>
              </div>

              {/* Section 4: Café Location */}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-600 shrink-0" />
                <span className="text-coffee-700">108 Heritage Boulevard, 12th Main, Indiranagar, Bengaluru</span>
              </div>
            </div>

          </div>

          {/* Section 5: Café Image (High-Quality Photograph) */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none">
              <div className="absolute inset-0 bg-gold-500/15 rounded-3xl transform rotate-2 scale-95 filter blur-lg"></div>
              <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-coffee-950">
                <img
                  src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80"
                  alt="Aradhana Café Ambiance & Artisanal Brew"
                  className="w-full h-64 sm:h-80 object-cover object-center"
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
