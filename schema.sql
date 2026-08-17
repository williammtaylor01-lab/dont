-- ============================================================================
-- STORE CHECKOUT & ADMIN BACKOFFICE FULFILLMENT SCHEMA (PostgreSQL / Supabase)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. ENUMS FOR STATUS & DELIVERY
-- ----------------------------------------------------------------------------
CREATE TYPE order_status_enum AS ENUM (
  'PENDING',
  'PAID',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
);

CREATE TYPE delivery_type_enum AS ENUM (
  'home',
  'pickup'
);

CREATE TYPE manual_confirmation_enum AS ENUM (
  'pending_verification',
  'verified_in_backoffice',
  'dispatched'
);

CREATE TYPE payment_method_type_enum AS ENUM (
  'card',
  'google_pay',
  'apple_pay',
  'blik',
  'przelewy24',
  'paypal',
  'ideal'
);

-- ----------------------------------------------------------------------------
-- 2. CUSTOMERS / PROFILES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone_number VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. CUSTOMER SHIPPING ADDRESSES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  line1 VARCHAR(255) NOT NULL,
  line2 VARCHAR(255),
  postal_code VARCHAR(30) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'France',
  phone_number VARCHAR(50),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. PRODUCTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  size VARCHAR(50),
  condition VARCHAR(50),
  image_url TEXT,
  price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2),
  currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. PICKUP LOCKER POINTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pickup_points (
  id VARCHAR(100) PRIMARY KEY,
  carrier_name VARCHAR(100) NOT NULL,
  point_code VARCHAR(50) NOT NULL,
  point_name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  opening_hours VARCHAR(100) DEFAULT 'Open 24/7',
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. ORDERS & FULFILLMENT TABLE (With Admin Mapping)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  
  -- Product Reference
  product_id VARCHAR(100) REFERENCES products(id),
  product_title VARCHAR(255) NOT NULL,
  
  -- Customer & Delivery Details
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  delivery_type delivery_type_enum NOT NULL DEFAULT 'home',
  
  -- Shipping Address Snapshot (Preserves entered address even if customer edits later)
  shipping_full_name VARCHAR(255),
  shipping_phone_number VARCHAR(50),
  shipping_line1 VARCHAR(255),
  shipping_line2 VARCHAR(255),
  shipping_postal_code VARCHAR(30),
  shipping_city VARCHAR(100),
  shipping_country VARCHAR(100) DEFAULT 'France',
  
  -- Pickup Locker Snapshot (if delivery_type = 'pickup')
  pickup_point_id VARCHAR(100) REFERENCES pickup_points(id) ON DELETE SET NULL,
  pickup_point_code VARCHAR(50),
  pickup_point_name VARCHAR(255),
  pickup_point_address VARCHAR(255),
  pickup_point_city VARCHAR(100),
  pickup_carrier_name VARCHAR(100),

  -- Payment Mapping & Metadata (Safe Tokenized / Masked info for admin reference)
  payment_method_type payment_method_type_enum NOT NULL DEFAULT 'card',
  payment_cardholder_name VARCHAR(255),
  payment_card_brand VARCHAR(50),
  payment_card_last4 VARCHAR(4),
  payment_card_expiry VARCHAR(10),
  payment_blik_code VARCHAR(10),
  
  -- Pricing & Line Items Breakdown
  order_subtotal NUMERIC(10, 2) NOT NULL,
  buyer_protection_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  shipping_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  shipping_discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
  
  -- Order Status & Admin Manual Confirmation Controls
  status order_status_enum NOT NULL DEFAULT 'PAID',
  manual_confirmation_status manual_confirmation_enum NOT NULL DEFAULT 'pending_verification',
  tracking_number VARCHAR(100),
  admin_internal_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. ADMIN AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  notes TEXT,
  admin_user VARCHAR(100) DEFAULT 'Admin Operator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_phone ON orders(shipping_phone_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON addresses(customer_id);

-- ----------------------------------------------------------------------------
-- 9. AUTO-UPDATE TIMESTAMP TRIGGER FUNCTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 10. SAMPLE INITIAL SEED DATA
-- ----------------------------------------------------------------------------
INSERT INTO products (id, title, brand, size, condition, image_url, price, original_price, currency)
VALUES (
  'prod_mewtwo_gx_190',
  'Mewtwo GX Pokémon Card Full Art Secret Rare',
  'Pokémon TCG',
  'Standard / Mint',
  'Very good',
  'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=800&q=80',
  8.00,
  10.00,
  'EUR'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pickup_points (id, carrier_name, point_code, point_name, address, city)
VALUES 
  ('pt_inpost_402', 'InPost Paczkomat 24/7', 'WAW123M', 'Locker WAW123M - Biedronka Supermarket', 'ul. Marszalkowska 104', 'Warsaw'),
  ('pt_mondial_109', 'Mondial Relay Point', 'MR-PARIS-09', 'Relay Tabac Presse Saint-Germain', '45 Rue de Rennes', 'Paris')
ON CONFLICT (id) DO NOTHING;
