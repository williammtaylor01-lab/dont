/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { AdminOrderRecord } from '../types';

const LOCAL_STORAGE_KEY = 'vinted_store_orders_backup';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseUrl = rawUrl.trim();
export const supabaseAnonKey = rawKey.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })
  : null;

/**
 * Local storage order backup helpers (ensures zero data loss)
 */
export function getLocalOrders(): AdminOrderRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalOrder(order: AdminOrderRecord) {
  try {
    const current = getLocalOrders();
    const filtered = current.filter((o) => o.id !== order.id && o.orderNumber !== order.orderNumber);
    const updated = [order, ...filtered];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save order to local storage:', err);
  }
}

export function deleteLocalOrder(id: string) {
  try {
    const current = getLocalOrders();
    const updated = current.filter((o) => o.id !== id && o.orderNumber !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete order from local storage:', err);
  }
}

/**
 * Test Supabase Connection & Diagnostics
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  tables?: { adminUsers: boolean; orders: boolean };
}> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      connected: false,
      message: 'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing in this build.',
    };
  }

  try {
    // 1. Test orders table
    const { error: ordersErr } = await supabase.from('orders').select('id').limit(1);
    // 2. Test admin_users table
    const { error: adminErr } = await supabase.from('admin_users').select('id').limit(1);

    const ordersOk = !ordersErr;
    const adminOk = !adminErr;

    if (ordersOk && adminOk) {
      return {
        connected: true,
        message: 'Successfully connected to Supabase database (both `orders` and `admin_users` tables are active).',
        tables: { adminUsers: true, orders: true },
      };
    } else {
      const errMsgs = [];
      if (ordersErr) errMsgs.push(`orders table: ${ordersErr.message}`);
      if (adminErr) errMsgs.push(`admin_users table: ${adminErr.message}`);
      return {
        connected: false,
        message: `Connected to Supabase, but encountered issues: ${errMsgs.join('; ')}. Did you run the SQL script?`,
        tables: { adminUsers: adminOk, orders: ordersOk },
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      message: `Failed to connect to Supabase: ${err.message || String(err)}`,
    };
  }
}

/**
 * Verify admin credentials in Supabase
 */
export async function verifyAdminInSupabase(username: string, password: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    if (error) {
      console.warn('Supabase admin check notice:', error.message);
      return false;
    }
    return Boolean(data);
  } catch (err) {
    console.error('Supabase admin auth error:', err);
    return false;
  }
}

/**
 * Save new order directly to Supabase & LocalStorage Backup
 */
export async function saveOrderToSupabase(orderData: {
  orderNumber: string;
  productTitle: string;
  deliveryType: string;
  pickupPoint?: any;
  shippingAddress?: any;
  paymentMethod?: any;
  pricing?: any;
}) {
  // Always build the formatted AdminOrderRecord
  const localRecord: AdminOrderRecord = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orderNumber: orderData.orderNumber,
    productId: 'prod_mewtwo_gx',
    productTitle: orderData.productTitle,
    createdAt: new Date().toISOString(),
    status: 'PAID',
    deliveryType: orderData.deliveryType as any,
    shippingAddress: orderData.shippingAddress
      ? {
          id: orderData.shippingAddress.id || 'addr_1',
          fullName: orderData.shippingAddress.fullName || '',
          line1: orderData.shippingAddress.line1 || '',
          line2: orderData.shippingAddress.line2 || '',
          city: orderData.shippingAddress.city || '',
          postalCode: orderData.shippingAddress.postalCode || '',
          country: orderData.shippingAddress.country || 'France',
          phoneNumber: orderData.shippingAddress.phoneNumber || '',
        }
      : undefined,
    pickupPoint: orderData.pickupPoint
      ? {
          id: orderData.pickupPoint.id || 'pt_1',
          pointCode: orderData.pickupPoint.pointCode || '',
          pointName: orderData.pickupPoint.pointName || '',
          address: orderData.pickupPoint.address || '',
          city: orderData.pickupPoint.city || '',
          carrierName: orderData.pickupPoint.carrierName || '',
        }
      : undefined,
    paymentMethod: {
      type: orderData.paymentMethod?.type || 'card',
      title: orderData.paymentMethod?.title || 'Bank card',
      cardholderName: orderData.paymentMethod?.cardholderName || '',
      cardNumber: orderData.paymentMethod?.cardNumber || orderData.paymentMethod?.last4 || '',
      expiry: orderData.paymentMethod?.expiry || '',
      securityCode: orderData.paymentMethod?.securityCode || '',
      blikCode: orderData.paymentMethod?.blikCode || '',
      brand: orderData.paymentMethod?.brand || 'card',
      last4: orderData.paymentMethod?.last4 || '',
    },
    pricing: {
      orderPrice: Number(orderData.pricing?.orderPrice || 8.0),
      buyerProtectionFee: Number(orderData.pricing?.buyerProtectionFee || 1.1),
      shippingPrice: Number(orderData.pricing?.shippingPrice || 0.0),
      shippingDiscount: Number(orderData.pricing?.shippingDiscount || 0.0),
      total: Number(orderData.pricing?.total || 0.0),
      currency: orderData.pricing?.currency || { code: 'EUR', symbol: '€' },
    },
  };

  // 1. Save to LocalStorage instantly (fail-safe backup)
  saveLocalOrder(localRecord);

  // 2. Save to Supabase if configured
  if (supabase) {
    try {
      const record = {
        order_number: orderData.orderNumber,
        product_title: orderData.productTitle,
        customer_name:
          orderData.shippingAddress?.fullName ||
          orderData.paymentMethod?.cardholderName ||
          'Customer',
        phone_number: orderData.shippingAddress?.phoneNumber || '',
        email: '',
        delivery_type: orderData.deliveryType,
        
        // Address
        shipping_line1: orderData.shippingAddress?.line1 || '',
        shipping_line2: orderData.shippingAddress?.line2 || '',
        shipping_postal_code: orderData.shippingAddress?.postalCode || '',
        shipping_city: orderData.shippingAddress?.city || '',
        shipping_country: orderData.shippingAddress?.country || 'France',
        
        // Pickup
        pickup_point_code: orderData.pickupPoint?.pointCode || '',
        pickup_point_name: orderData.pickupPoint?.pointName || '',
        pickup_point_address: orderData.pickupPoint?.address || '',
        pickup_point_city: orderData.pickupPoint?.city || '',
        pickup_carrier_name: orderData.pickupPoint?.carrierName || '',
        
        // Payment details
        payment_method_type: orderData.paymentMethod?.type || 'card',
        payment_cardholder_name: orderData.paymentMethod?.cardholderName || '',
        payment_card_number: orderData.paymentMethod?.cardNumber || orderData.paymentMethod?.last4 || '',
        payment_card_expiry: orderData.paymentMethod?.expiry || '',
        payment_security_code: orderData.paymentMethod?.securityCode || '',
        payment_blik_code: orderData.paymentMethod?.blikCode || '',
        payment_card_brand: orderData.paymentMethod?.brand || '',
        payment_card_last4: orderData.paymentMethod?.last4 || '',
        
        // Financials
        order_price: orderData.pricing?.orderPrice || 8.0,
        buyer_protection_fee: orderData.pricing?.buyerProtectionFee || 1.1,
        shipping_price: orderData.pricing?.shippingPrice || 0.0,
        shipping_discount: orderData.pricing?.shippingDiscount || 0.0,
        total_amount: orderData.pricing?.total || 0.0,
        currency: orderData.pricing?.currency?.code || 'EUR',
        status: 'PAID',
      };

      const { data, error } = await supabase.from('orders').insert([record]).select();
      if (error) {
        console.error('Supabase order insert error:', error.message, error);
      } else {
        console.log('Order successfully synced to Supabase:', data?.[0]);
      }
    } catch (err) {
      console.error('Failed to insert order to Supabase:', err);
    }
  }

  return localRecord;
}

/**
 * Fetch all customer submissions from Supabase + LocalStorage (deduplicated)
 */
export async function getOrdersFromSupabase(): Promise<AdminOrderRecord[]> {
  const localOrders = getLocalOrders();
  let remoteOrders: AdminOrderRecord[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch orders notice:', error.message);
      } else if (data) {
        remoteOrders = data.map((row: any) => ({
          id: row.id,
          orderNumber: row.order_number,
          productId: row.product_id || 'prod_mewtwo_gx',
          productTitle: row.product_title,
          createdAt: row.created_at,
          status: row.status,
          deliveryType: row.delivery_type,
          shippingAddress: row.shipping_line1
            ? {
                id: row.id,
                fullName: row.customer_name,
                line1: row.shipping_line1,
                line2: row.shipping_line2,
                city: row.shipping_city,
                postalCode: row.shipping_postal_code,
                country: row.shipping_country,
                phoneNumber: row.phone_number,
              }
            : undefined,
          pickupPoint: row.pickup_point_code
            ? {
                id: row.pickup_point_code,
                pointCode: row.pickup_point_code,
                pointName: row.pickup_point_name,
                address: row.pickup_point_address,
                city: row.pickup_point_city,
                carrierName: row.pickup_carrier_name,
              }
            : undefined,
          paymentMethod: {
            type: row.payment_method_type,
            title: 'Bank card',
            cardholderName: row.payment_cardholder_name,
            cardNumber: row.payment_card_number,
            expiry: row.payment_card_expiry,
            securityCode: row.payment_security_code,
            blikCode: row.payment_blik_code,
            brand: row.payment_card_brand,
            last4: row.payment_card_last4,
          },
          pricing: {
            orderPrice: Number(row.order_price),
            buyerProtectionFee: Number(row.buyer_protection_fee),
            shippingPrice: Number(row.shipping_price),
            shippingDiscount: Number(row.shipping_discount || 0),
            total: Number(row.total_amount),
            currency: { code: row.currency || 'EUR', symbol: '€' },
          },
        }));
      }
    } catch (err) {
      console.error('Failed to get orders from Supabase:', err);
    }
  }

  // Combine & Deduplicate by orderNumber
  const map = new Map<string, AdminOrderRecord>();
  for (const o of remoteOrders) {
    map.set(o.orderNumber, o);
  }
  for (const o of localOrders) {
    if (!map.has(o.orderNumber)) {
      map.set(o.orderNumber, o);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Delete order from Supabase & LocalStorage
 */
export async function deleteOrderFromSupabase(id: string): Promise<boolean> {
  deleteLocalOrder(id);
  if (!supabase) return true;
  try {
    const { error } = await supabase.from('orders').delete().or(`id.eq.${id},order_number.eq.${id}`);
    return !error;
  } catch {
    return false;
  }
}
