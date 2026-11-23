-- ====================================================================
-- ARADHANA CAFÉ - COMPLETE POSTGRESQL SCHEMA WITH RLS & REALTIME
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'paid', 'preparing', 'ready', 'served', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'successful', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('admin', 'chef', 'waiter', 'customer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. RESTAURANT SETTINGS
CREATE TABLE IF NOT EXISTS restaurant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_name TEXT NOT NULL DEFAULT 'Aradhana Café',
    tagline TEXT DEFAULT 'A sanctuary of taste, tradition & warmth',
    phone TEXT DEFAULT '+91 98765 43210',
    email TEXT DEFAULT 'hello@aradhanacafe.com',
    address TEXT DEFAULT '108 Heritage Boulevard, Indiranagar, Bengaluru, Karnataka 560038',
    google_maps_url TEXT DEFAULT 'https://maps.google.com/?q=Aradhana+Cafe',
    opening_hours TEXT DEFAULT 'Open 7 AM to 11 PM',
    tax_percentage NUMERIC(5, 2) DEFAULT 5.00,
    service_charge_percentage NUMERIC(5, 2) DEFAULT 0.00,
    upi_id TEXT DEFAULT 'aradhanacafe@icici',
    banner_text TEXT DEFAULT '✨ Welcome to Aradhana Café! Enjoy handcrafted brew & artisan delicacies.',
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role_type NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- 4. TABLES (QR Dining Tables)
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number TEXT UNIQUE NOT NULL,
    capacity INT DEFAULT 4,
    section TEXT DEFAULT 'Main Dining',
    is_occupied BOOLEAN DEFAULT false,
    qr_code_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FOOD ITEMS
CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_veg BOOLEAN DEFAULT true,
    is_spicy BOOLEAN DEFAULT false,
    is_chef_special BOOLEAN DEFAULT false,
    preparation_time_mins INT DEFAULT 5,
    calories INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    table_number TEXT NOT NULL,
    status order_status DEFAULT 'pending',
    customer_name TEXT,
    customer_phone TEXT,
    customer_notes TEXT,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status payment_status DEFAULT 'pending',
    acknowledged_by_admin BOOLEAN DEFAULT false,
    acknowledged_by_kitchen BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES food_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10, 2) NOT NULL,
    special_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    payment_method TEXT DEFAULT 'UPI',
    gateway_provider TEXT DEFAULT 'razorpay',
    gateway_order_id TEXT,
    gateway_payment_id TEXT UNIQUE,
    gateway_signature TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status payment_status DEFAULT 'pending',
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. COUPONS (Unique Random Order Verification Code)
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_code TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    is_redeemed BOOLEAN DEFAULT false,
    redeemed_at TIMESTAMPTZ,
    redeemed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'new_order',
    target_role user_role_type DEFAULT 'admin',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ORDER STATUS HISTORY
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    previous_status order_status,
    new_status order_status NOT NULL,
    changed_by TEXT DEFAULT 'system',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- SCHEMA PERMISSIONS FOR SUPABASE ROLES (CRITICAL)
-- ====================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ====================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category_id);
CREATE INDEX IF NOT EXISTS idx_food_items_availability ON food_items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_number);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- ====================================================================
-- REALTIME REPLICATION CONFIGURATION (SUPABASE)
-- ====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE food_items;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE coupons;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Public Read for Menu, Settings, Tables
CREATE POLICY "Public read restaurant_settings" ON restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read food_items" ON food_items FOR SELECT USING (true);
CREATE POLICY "Public read tables" ON tables FOR SELECT USING (true);

-- Customer orders access
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public update orders" ON orders FOR UPDATE USING (true);

CREATE POLICY "Public insert order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select order_items" ON order_items FOR SELECT USING (true);

CREATE POLICY "Public insert payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select payments" ON payments FOR SELECT USING (true);

CREATE POLICY "Public select coupons" ON coupons FOR SELECT USING (true);
CREATE POLICY "Public insert coupons" ON coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update coupons" ON coupons FOR UPDATE USING (true);

CREATE POLICY "Public access notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Public access order_status_history" ON order_status_history FOR ALL USING (true);

-- Admin Full Access Policies
CREATE POLICY "Admin update restaurant_settings" ON restaurant_settings FOR ALL USING (true);
CREATE POLICY "Admin full categories" ON categories FOR ALL USING (true);
CREATE POLICY "Admin full food_items" ON food_items FOR ALL USING (true);
CREATE POLICY "Admin full tables" ON tables FOR ALL USING (true);

-- ====================================================================
-- SEED DATA INITIALIZATION
-- ====================================================================
INSERT INTO restaurant_settings (cafe_name, tagline, phone, email, address, opening_hours, upi_id)
VALUES (
    'Aradhana Café',
    'A sanctuary of artisanal coffee, authentic south-indian roasts, & gourmet delicacies',
    '+91 98765 43210',
    'hello@aradhanacafe.com',
    '108 Heritage Boulevard, 12th Main, Indiranagar, Bengaluru, Karnataka 560038',
    'Open 7 AM to 11 PM',
    'aradhanacafe@icici'
) ON CONFLICT DO NOTHING;

-- Initial Tables
INSERT INTO tables (table_number, capacity, section, qr_code_token) VALUES
('Table 01', 2, 'Indoor Courtyard', 'token-tbl-01'),
('Table 02', 4, 'Indoor Courtyard', 'token-tbl-02'),
('Table 03', 4, 'Window View', 'token-tbl-03'),
('Table 04', 6, 'Garden Terrace', 'token-tbl-04'),
('Table 05', 2, 'Balcony Lounge', 'token-tbl-05'),
('Table 06', 4, 'Private Alcove', 'token-tbl-06'),
('Table 07', 8, 'Family Dining', 'token-tbl-07'),
('Table 08', 2, 'Espresso Bar', 'token-tbl-08')
ON CONFLICT (table_number) DO NOTHING;
