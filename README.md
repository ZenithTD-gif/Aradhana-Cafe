# ☕ ARADHANA CAFÉ – Smart QR Ordering & Restaurant Management System

A production-ready, mobile-first restaurant management and QR ordering platform designed for **Aradhana Café** (Bengaluru, India). Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase PostgreSQL, and Razorpay UPI online payment integration.

---

## 🌟 Key Architecture & Portals

The application connects three unified portals operating over a real-time reactive event architecture:

### 1. 📱 Customer Dining Portal (`/`)
* **Table QR Auto-Detection**: Automatically identifies dining table when customer scans table QR (`?table=Table%203` or `/menu?table=3`). Persists seated table across navigation.
* **Premium Brand Aesthetic**: Warm cream (`#FAF7F2`), coffee brown (`#321E12`), and soft golden accents (`#D4AF37`) with typography tailored for high-end hospitality.
* **Artisanal Food & Beverage Menu**: Filter coffees, cold brews, French bakery, sourdough toasts, wood-fired pastas, and heritage breakfasts with high-res photography.
* **Real-time Live Availability Safeguard**: Unavailable or "Sold Out" dishes are automatically greyed out with a clear badge and disabled from ordering in real time.
* **Cart & Billing**: Slide-over cart, quantity controls, special chef cooking notes, and automatic subtotal + 5% GST computation.
* **Online UPI Payment (Razorpay)**: Seamless checkout with dynamic UPI QR code, VPA (`aradhanacafe@icici`), and intent apps (GPay, PhonePe, Paytm, BHIM, Cred).
* **Unique Order Coupon System**: Upon verified payment, generates a cryptographic/random unique coupon code (e.g. `ARD-7429`) displayed on the live tracking screen for waiters to verify before serving.
* **Live Order Tracking**: Real-time status tracker (`Payment Confirmed` → `In Kitchen` → `Ready for Serving` → `Served`).

---

### 2. 🛡️ Admin & Management Portal (`/admin`)
* **Secure Manager Access**: PIN-protected authentication (`Default PIN: 1947`).
* **Dashboard Overview Metrics**: Today's revenue, order counts, pending, preparing, and completed statistics.
* **Continuous Ringing Alert**:
  * Continuous ringing audio tone via synthesized Web Audio API upon incoming verified paid order.
  * Prominent **"Acknowledge Order"** button stops the continuous ringing sound immediately.
  * Browser autoplay policy handled with a one-click **"Enable Sound"** button and persistent visual pulsing indicators.
* **Menu & Real-Time Availability Switch (Critical Requirement)**:
  * Complete CRUD: Add food items, edit names, prices, categories, and images without touching code.
  * **Instant Availability Toggle**: Click *Available / Sold Out* to instantly switch dish availability. Immediately syncs to customer screens in real-time without redeployment.
* **Table & QR Code Generator**:
  * Manage dining tables, capacities, and sections.
  * Generates high-density, printable QR codes encoding direct table URLs (`/?table=Table%201`).
* **Waiter Coupon Verification Terminal**:
  * Waiter enters or scans customer coupon code (e.g. `ARD-7429`).
  * Validates authentic payment and table number.
  * Single-click **"Redeem Coupon"** prevents duplicate reuse or fraud.
* **Daily & Monthly Analytics**: Sales summary, category breakdown, and dish popularity.

---

### 3. 👨‍🍳 Chef / Kitchen Display System (KDS) (`/kitchen`)
* **Chef-Tailored High-Contrast Interface**: Distraction-free dark mode designed for busy kitchen lines.
* **Incoming Paid Orders Ringing Alert**: Urgent audio chime and visual pulsing ticket.
* **Prominent Table Numbers**: Large bold table numbers for rapid ticket identification.
* **Cooking Notes**: Displays customer special dietary instructions (e.g. "less sugar", "extra crispy").
* **Preparation Pipeline**:
  * `Incoming Paid` → `Start Prep (Cooking)` → `Mark as Ready for Serving`.
* **Zero Financial Distractions**: Sensitive admin and revenue metrics hidden from kitchen staff.

---

## 🔒 Security & Payment Verification

* **Server-Side Trusted Signature Verification**: Uses HMAC SHA-256 (`crypto.createHmac('sha256', secret)`) to verify Razorpay signatures. Never trusts frontend status messages alone.
* **Strict Idempotency**: Order state transitions to `paid` once, coupon is minted once, and double-redemption is blocked.
* **Simulated & Live Gateway Modes**: Supports real live/test Razorpay API credentials via environment variables, with a high-fidelity local simulation gateway that allows testing the full end-to-end flow immediately out of the box!

---

## 🛠️ Tech Stack

* **Framework**: Next.js 14 (App Router) with TypeScript
* **Styling**: Tailwind CSS with custom Aradhana design system
* **Realtime Sync**: Supabase Realtime + HTML5 `BroadcastChannel` for multi-tab sync
* **Audio Engine**: Web Audio API synthesizer for zero-dependency ringing bells & chimes
* **QR Codes**: `qrcode.react` (SVG, high-density error correction)
* **Celebration Effects**: `canvas-confetti`
* **Icons**: `lucide-react`
* **Database**: PostgreSQL (Supabase schema with Row Level Security & Indexes)

---

## 🚀 Getting Started

### 1. Installation

```bash
# Clone or navigate to project directory
cd "Aradhana Cafe"

# Install dependencies
npm install
```

### 2. Environment Variables

Create `.env.local` by copying `.env.example`:

```bash
cp .env.example .env.local
```

Configure your parameters:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Optional for local demo; required for hosted Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Razorpay Keys (UPI Online Payments)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Security PINs
NEXT_PUBLIC_ADMIN_PIN=1947
NEXT_PUBLIC_KITCHEN_PIN=1080
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

* **Customer Portal**: `http://localhost:3000/` or with table: `http://localhost:3000/?table=Table%203`
* **Admin Portal**: `http://localhost:3000/admin` (PIN: `1947`)
* **Kitchen Portal**: `http://localhost:3000/kitchen`

---

## 🗄️ Database Setup (Supabase PostgreSQL)

1. Open your [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor**.
3. Run the complete SQL schema script located in `supabase/schema.sql`.
4. This script automatically creates:
   * `restaurant_settings`
   * `categories`
   * `food_items`
   * `tables`
   * `orders` & `order_items`
   * `payments`
   * `coupons`
   * `notifications` & `order_status_history`
   * Full Row Level Security (RLS) policies and indexes
   * Realtime replication publication (`supabase_realtime`)

---

## 🌐 Deployment to Vercel

1. Push your repository to GitHub.
2. In the Vercel dashboard, click **Add New Project** and select the repository.
3. Add the environment variables from `.env.example` in Vercel Project Settings.
4. Deploy! Next.js will build and serve edge/SSR routes automatically.

---

## 📜 License & Credits

Created for **Aradhana Café**, Bengaluru. Designed and engineered for excellence in modern café dining.
