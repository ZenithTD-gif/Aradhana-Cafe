import React from 'react';
import Link from 'next/link';
import { Coffee, MapPin, Phone, Mail, Clock, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-coffee-950 text-cream-200 pt-16 pb-12 mt-auto border-t border-coffee-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-coffee-900">
          {/* Brand & Story */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 border border-gold-500/40">
                <Coffee className="w-5 h-5" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-cream-50">
                ARADHANA CAFÉ
              </span>
            </div>
            <p className="text-sm text-cream-300/80 leading-relaxed">
              Rooted in the timeless heritage of South Indian coffee culture, elevated with modern artisanal craftsmanship and warm hospitality.
            </p>
            <div className="flex items-center gap-2 text-xs text-gold-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Certified Arabica & Desi A2 Dairy</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider uppercase text-gold-400 mb-4">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-sm text-cream-300">
              <li>
                <Link href="/#menu" className="hover:text-gold-400 transition-colors">
                  Food & Beverage Menu
                </Link>
              </li>
              <li>
                <Link href="/#story" className="hover:text-gold-400 transition-colors">
                  Our Coffee Philosophy
                </Link>
              </li>
              <li>
                <Link href="/#location" className="hover:text-gold-400 transition-colors">
                  Find Our Café Location
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-gold-400 transition-colors flex items-center gap-1.5">
                  <span>Manager / Admin Portal</span>
                </Link>
              </li>
              <li>
                <Link href="/kitchen" className="hover:text-gold-400 transition-colors flex items-center gap-1.5">
                  <span>Kitchen Display System (KDS)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Café Timings & Address */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider uppercase text-gold-400 mb-4">
              Hours & Location
            </h4>
            <div className="space-y-3 text-sm text-cream-300">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-cream-100">Everyday</p>
                  <p className="text-xs text-cream-400">7:00 AM – 11:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <p className="text-xs text-cream-300/90 leading-normal">
                  108 Heritage Boulevard, 12th Main Road, Indiranagar, Bengaluru, Karnataka 560038
                </p>
              </div>
            </div>
          </div>

          {/* Contact & Orders */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider uppercase text-gold-400 mb-4">
              Reservations & Inquiries
            </h4>
            <div className="space-y-2.5 text-sm text-cream-300">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gold-400 shrink-0" />
                <a href="tel:+919876543210" className="hover:text-gold-400 transition-colors">
                  +91 98765 43210
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gold-400 shrink-0" />
                <a href="mailto:hello@aradhanacafe.com" className="hover:text-gold-400 transition-colors">
                  hello@aradhanacafe.com
                </a>
              </div>
              <div className="pt-2">
                <div className="p-3 rounded-lg bg-coffee-900 border border-coffee-800 text-xs">
                  <p className="text-gold-300 font-medium">Smart Table Ordering</p>
                  <p className="text-cream-400 text-[11px] mt-0.5">
                    Scan the QR code printed on your table stand for contactless ordering & instant UPI checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-cream-400/80 gap-4">
          <p>© {new Date().getFullYear()} Aradhana Café. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400 inline" />
            <span>for culinary excellence</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
