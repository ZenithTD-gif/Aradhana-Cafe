import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#321E12',
};

export const metadata: Metadata = {
  title: 'Aradhana Café | Artisanal Coffee & Smart QR Dining',
  description: 'Experience handcrafted Mysore filter roasts, gourmet sourdoughs, and heritage delicacies. Scan your table QR to order online with instant UPI payment.',
  keywords: ['Aradhana Cafe', 'Smart QR Ordering', 'Indiranagar Cafe', 'Filter Coffee', 'Artisanal Roasts', 'Bengaluru Cafe'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FAF7F2] text-coffee-900 selection:bg-gold-200 selection:text-coffee-950 font-['Plus_Jakarta_Sans',sans-serif]">
        {children}
      </body>
    </html>
  );
}
