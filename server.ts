import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface OrderPayload {
  orderNumber?: string;
  productId: string;
  productTitle: string;
  contactPhone?: string;
  deliveryType: 'pickup' | 'home';
  pickupPoint?: {
    id: string;
    carrierName: string;
    pointCode: string;
    pointName?: string;
    address: string;
    city: string;
  } | null;
  shippingAddress?: {
    id: string;
    fullName: string;
    country?: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    phoneNumber?: string;
  } | null;
  paymentMethod: {
    type: string;
    title: string;
    subtitle?: string;
    cardholderName?: string;
    cardNumber?: string;
    securityCode?: string;
    last4?: string;
    brand?: string;
    expiry?: string;
    blikCode?: string;
  };
  pricing: {
    orderPrice: number;
    buyerProtectionFee: number;
    shippingPrice: number;
    shippingDiscount: number;
    total: number;
    currency: {
      code: string;
      symbol: string;
    };
  };
}

// Credentials table/store as requested: username: move, password: dontmove
const adminUsersStore = [
  {
    id: 'usr_admin_1',
    username: 'move',
    password: 'dontmove',
    name: 'Operator',
    role: 'superadmin',
  },
];

// In-memory data store for live sessions
const ordersStore: (OrderPayload & {
  id: string;
  createdAt: string;
  status: string;
})[] = [
  {
    id: 'ord_sample_01',
    orderNumber: 'VIN-849201',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'PAID',
    productId: 'prod_mewtwo_gx_190',
    productTitle: 'Mewtwo GX Pokémon Card Full Art Secret Rare',
    deliveryType: 'pickup',
    pickupPoint: {
      id: 'pt_inpost_402',
      carrierName: 'InPost Paczkomat 24/7',
      pointCode: 'WAW123M',
      pointName: 'Locker WAW123M - Biedronka Supermarket',
      address: 'ul. Marszalkowska 104',
      city: 'Warsaw',
    },
    shippingAddress: {
      id: 'addr_sample_01',
      fullName: 'Alexandre Dubois',
      line1: '14 Rue de Rivoli',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
      phoneNumber: '+33 6 12 34 56 78',
    },
    paymentMethod: {
      type: 'card',
      title: 'Bank card',
      subtitle: 'Card ending with 4242',
      cardholderName: 'Alexandre Dubois',
      cardNumber: '4242 •••• •••• 4242',
      securityCode: '381',
      last4: '4242',
      brand: 'visa',
      expiry: '05/28',
    },
    pricing: {
      orderPrice: 8.00,
      buyerProtectionFee: 1.10,
      shippingPrice: 0.00,
      shippingDiscount: 8.59,
      total: 9.10,
      currency: { code: 'EUR', symbol: '€' },
    },
  },
  {
    id: 'ord_sample_02',
    orderNumber: 'VIN-512934',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    status: 'PAID',
    productId: 'prod_mewtwo_gx_190',
    productTitle: 'Mewtwo GX Pokémon Card Full Art Secret Rare',
    deliveryType: 'home',
    shippingAddress: {
      id: 'addr_sample_02',
      fullName: 'Sophie Martin',
      line1: '28 Avenue des Champs-Élysées',
      line2: 'Apt 4B, 3rd Floor',
      city: 'Paris',
      postalCode: '75008',
      country: 'France',
      phoneNumber: '+33 6 98 76 54 32',
    },
    paymentMethod: {
      type: 'card',
      title: 'Bank card',
      subtitle: 'Card ending with 8819',
      cardholderName: 'Sophie Martin',
      cardNumber: '5500 •••• •••• 8819',
      securityCode: '904',
      last4: '8819',
      brand: 'mastercard',
      expiry: '11/27',
    },
    pricing: {
      orderPrice: 8.00,
      buyerProtectionFee: 1.10,
      shippingPrice: 8.49,
      shippingDiscount: 0,
      total: 17.59,
      currency: { code: 'EUR', symbol: '€' },
    },
  },
];
const userAddressesStore: any[] = [];
const paymentMethodsStore: any[] = [];

const sampleProduct = {
  id: 'prod_mewtwo_gx_190',
  title: 'Mewtwo GX Pokémon Card Full Art Secret Rare',
  brand: 'Pokémon TCG',
  size: 'Standard / Mint',
  condition: 'Very good',
  imageUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=800&q=80',
  price: 8.00,
  originalPrice: 10.00,
  currency: 'EUR',
};

const carriersList = [
  {
    id: 'c_ups_home',
    name: 'UPS Home',
    type: 'home',
    price: 8.49,
    estimatedDelivery: '2 - 5 business days',
    logoType: 'ups',
  },
  {
    id: 'c_dhl_home',
    name: 'DHL Express Home',
    type: 'home',
    price: 9.99,
    estimatedDelivery: '1 - 2 business days',
    logoType: 'dhl',
  },
  {
    id: 'c_inpost_pickup',
    name: 'InPost Paczkomat 24/7',
    type: 'pickup',
    price: 0.00,
    originalPrice: 8.59,
    estimatedDelivery: '1 - 2 business days',
    logoType: 'inpost',
  },
  {
    id: 'c_mondial_relay',
    name: 'Mondial Relay Point',
    type: 'pickup',
    price: 3.49,
    originalPrice: 5.49,
    estimatedDelivery: '3 - 5 business days',
    logoType: 'mondial',
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API 1: Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'checkout-live-engine',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // API 2: Product endpoint
  app.get('/api/product', (_req, res) => {
    res.json(sampleProduct);
  });

  // API 3: Carriers endpoint
  app.get('/api/carriers', (_req, res) => {
    res.json(carriersList);
  });

  // API 4: Save new address entered by user
  app.post('/api/address', (req, res) => {
    const address = req.body;
    userAddressesStore.push(address);
    res.status(201).json({ success: true, address });
  });

  // API 5: Get stored addresses
  app.get('/api/address', (_req, res) => {
    res.json(userAddressesStore);
  });

  // API 6: Save payment method
  app.post('/api/payment-methods', (req, res) => {
    const method = req.body;
    paymentMethodsStore.push(method);
    res.status(201).json({ success: true, method });
  });

  // API 7: Calculate Pricing Breakdown
  app.post('/api/pricing/calculate', (req, res) => {
    const { orderPrice = 8.00, deliveryPrice = 8.49, currency = 'EUR' } = req.body;
    const baseFee = currency === 'PLN' ? 2.90 : 0.70;
    const variableFee = Number((orderPrice * 0.05).toFixed(2));
    const buyerProtectionFee = Number((baseFee + variableFee).toFixed(2));
    const total = Number((orderPrice + buyerProtectionFee + deliveryPrice).toFixed(2));

    res.json({
      orderPrice,
      buyerProtectionFee,
      shippingPrice: deliveryPrice,
      total,
      currency,
    });
  });

  // API 8: Create and finalize new customer order (collects all customer details)
  app.post('/api/orders', (req, res) => {
    try {
      const payload: OrderPayload = req.body;
      const orderNumber = payload.orderNumber || `VIN-${Math.floor(100000 + Math.random() * 900000)}`;
      const newOrder = {
        id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        orderNumber,
        ...payload,
        status: 'PAID',
        createdAt: new Date().toISOString(),
      };

      ordersStore.unshift(newOrder);

      res.status(201).json({
        success: true,
        message: 'Order placed and recorded successfully.',
        order: newOrder,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to process order creation',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // API 9: Simple Authentication for admin access
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body || {};
    const user = adminUsersStore.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      res.json({
        success: true,
        token: `adm_token_${Date.now()}`,
        user: {
          username: user.username,
          name: user.name,
          role: user.role,
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }
  });

  // API 10: List all collected customer orders & submissions
  app.get('/api/admin/orders', (_req, res) => {
    res.json({
      count: ordersStore.length,
      orders: ordersStore,
    });
  });

  // API 11: Delete order / submission
  app.delete('/api/admin/orders/:id', (req, res) => {
    const { id } = req.params;
    const orderIndex = ordersStore.findIndex((o) => o.id === id || o.orderNumber === id);

    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const deleted = ordersStore.splice(orderIndex, 1)[0];
    res.json({ success: true, deletedOrder: deleted });
  });

  // API 12: Clear all orders (convenience)
  app.delete('/api/admin/orders-clear-all', (_req, res) => {
    ordersStore.length = 0;
    res.json({ success: true, message: 'All customer entries cleared.' });
  });

  // API 13: List all orders (Client)
  app.get('/api/orders', (_req, res) => {
    res.json({
      count: ordersStore.length,
      orders: ordersStore,
    });
  });

  // API 13: Get specific order by ID or orderNumber
  app.get('/api/orders/:identifier', (req, res) => {
    const { identifier } = req.params;
    const order = ordersStore.find(
      (o) => o.id === identifier || o.orderNumber === identifier
    );
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
