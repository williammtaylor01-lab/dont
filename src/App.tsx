/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  DEFAULT_CURRENCY,
  INITIAL_PRODUCT,
  calculateBuyerProtectionFee,
  formatPrice,
} from './data/mockData';
import {
  Address,
  CarrierOption,
  Currency,
  DeliveryType,
  PickUpPoint,
  PricingBreakdown,
  ProductItem,
  SavedPaymentMethod,
} from './types';
import { CheckoutHeader } from './components/CheckoutHeader';
import { OrderSummaryCard } from './components/OrderSummaryCard';
import { ShippingAddressSection } from './components/ShippingAddressSection';
import { DeliveryOptionsSection } from './components/DeliveryOptionsSection';
import { CarrierDetailsCard } from './components/CarrierDetailsCard';
import { PriceSummarySection } from './components/PriceSummarySection';
import { BuyerProtectionModal } from './components/BuyerProtectionModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { AddressPage } from './pages/AddressPage';
import { PaymentMethodsPage } from './pages/PaymentMethodsPage';
import { PickupMapPage } from './pages/PickupMapPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CreditCard, ChevronRight } from 'lucide-react';

type ViewMode = 'checkout' | 'address' | 'payment_methods' | 'pickup_map' | 'admin';

import { saveOrderToSupabase } from './lib/supabase';

// Determine initial view based on browser URL (/admin or /)
const getInitialView = (): ViewMode => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path === '/admin' || path.startsWith('/admin/') || hash === '#admin' || hash === '#/admin') {
      return 'admin';
    }
  }
  return 'checkout';
};

export default function App() {
  // Page Routing State - active /admin url support
  const [currentView, setCurrentView] = useState<ViewMode>(getInitialView);

  // Sync with browser URL changes and history
  React.useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || path.startsWith('/admin/') || hash === '#admin' || hash === '#/admin') {
        setCurrentView('admin');
      } else if (currentView === 'admin') {
        setCurrentView('checkout');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [currentView]);

  // Navigate helper
  const navigateToView = (view: ViewMode) => {
    setCurrentView(view);
    if (view === 'admin') {
      if (window.location.pathname !== '/admin') {
        window.history.pushState(null, '', '/admin');
      }
    } else if (view === 'checkout') {
      if (window.location.pathname === '/admin') {
        window.history.pushState(null, '', '/');
      }
    }
  };

  // Dynamic Product & Currency
  const [currency] = useState<Currency>({ code: 'EUR', symbol: '€' });
  const [product] = useState<ProductItem>({
    id: 'prod_mewtwo_gx',
    title: 'Mewtwo GX Pokémon Card Full Art Secret Rare',
    brand: 'Pokémon TCG',
    size: 'Standard / Mint',
    condition: 'Very good',
    imageUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=800&q=80',
    price: 8.00,
    originalPrice: 10.00,
  });

  // User details start completely fresh with zero pre-filled fake data
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('home');
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<PickUpPoint | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<SavedPaymentMethod | null>({
    id: 'pm_card_default',
    type: 'card',
    title: 'Bank card',
    subtitle: 'Use a credit or debit card',
    isDefault: true,
  });

  // Modals & Async States
  const [isProtectionModalOpen, setIsProtectionModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [validationWarning, setValidationWarning] = useState('');

  // Delivery Pricing Breakdown
  const minPickupPrice = 4.39;
  const minHomePrice = 8.49;

  const pricingBreakdown: PricingBreakdown = useMemo(() => {
    const orderPrice = Number(product.price.toFixed(2));
    const buyerProtectionFee = calculateBuyerProtectionFee(orderPrice, currency.code);

    let shippingPrice = 8.49;
    let shippingDiscount = 0;

    if (deliveryType === 'pickup') {
      if (selectedPickupPoint) {
        shippingPrice = Number(selectedPickupPoint.price.toFixed(2));
        if (
          selectedPickupPoint.originalPrice &&
          selectedPickupPoint.originalPrice > shippingPrice
        ) {
          shippingDiscount = Number(
            (selectedPickupPoint.originalPrice - shippingPrice).toFixed(2)
          );
        }
      } else {
        shippingPrice = minPickupPrice;
      }
    } else {
      shippingPrice = minHomePrice;
    }

    const total = Number(
      (orderPrice + buyerProtectionFee + shippingPrice).toFixed(2)
    );

    return {
      orderPrice,
      buyerProtectionFee,
      shippingPrice,
      shippingDiscount,
      total,
      currency,
    };
  }, [product.price, deliveryType, selectedPickupPoint, minPickupPrice, minHomePrice, currency]);

  // Selected Carrier Object representation
  const selectedCarrier: CarrierOption = useMemo(() => {
    if (deliveryType === 'pickup') {
      return {
        id: 'c_inpost_pickup',
        name: selectedPickupPoint?.carrierName || 'InPost Paczkomat 24/7',
        type: 'pickup',
        price: selectedPickupPoint ? selectedPickupPoint.price : minPickupPrice,
        originalPrice: 8.59,
        estimatedDelivery: '1 - 2 business days',
        logoType: (selectedPickupPoint?.logoType as any) || 'inpost',
      };
    }
    return {
      id: 'c_ups_home',
      name: 'UPS Home Delivery',
      type: 'home',
      price: 8.49,
      estimatedDelivery: '2 - 5 business days',
      logoType: 'ups',
    };
  }, [deliveryType, selectedPickupPoint, minPickupPrice]);

  // Delivery type selector handler
  const handleSelectDeliveryType = (type: DeliveryType) => {
    setDeliveryType(type);
    if (type === 'pickup' && !selectedPickupPoint) {
      setCurrentView('pickup_map');
    }
  };

  // Payment Execution with real backend POST /api/orders
  const handlePay = async () => {
    if (!selectedAddress) {
      setValidationWarning('Please add your shipping address before proceeding.');
      setCurrentView('address');
      return;
    }

    if (deliveryType === 'pickup' && !selectedPickupPoint) {
      setValidationWarning('Please select a pick-up point locker.');
      setCurrentView('pickup_map');
      return;
    }

    setValidationWarning('');
    setIsProcessingPayment(true);
    const generatedOrderNum = `VIN-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // 1. Direct persistence to Supabase if configured in Netlify
      await saveOrderToSupabase({
        orderNumber: generatedOrderNum,
        productTitle: product.title,
        deliveryType,
        pickupPoint: selectedPickupPoint,
        shippingAddress: selectedAddress,
        paymentMethod: selectedPayment,
        pricing: pricingBreakdown,
      });

      // 2. Server persistence fallback
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: generatedOrderNum,
          productId: product.id,
          productTitle: product.title,
          deliveryType,
          pickupPoint: selectedPickupPoint,
          shippingAddress: selectedAddress,
          paymentMethod: selectedPayment,
          pricing: pricingBreakdown,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrderNumber(data.order?.orderNumber || generatedOrderNum);
      } else {
        setOrderNumber(generatedOrderNum);
      }
    } catch {
      setOrderNumber(generatedOrderNum);
    } finally {
      setIsProcessingPayment(false);
      setIsOrderConfirmed(true);
    }
  };

  const handleReset = () => {
    setIsOrderConfirmed(false);
    setSelectedAddress(null);
    setSelectedPickupPoint(null);
    setDeliveryType('home');
    setCurrentView('checkout');
  };

  // --- SCREEN 1: DEDICATED ADDRESS PAGE ---
  if (currentView === 'address') {
    return (
      <AddressPage
        initialAddress={selectedAddress}
        onSave={(newAddress) => {
          setSelectedAddress(newAddress);
          setCurrentView('checkout');
        }}
        onClose={() => setCurrentView('checkout')}
      />
    );
  }

  // --- SCREEN 2: DEDICATED PAYMENT METHODS PAGE ---
  if (currentView === 'payment_methods') {
    return (
      <PaymentMethodsPage
        selectedPaymentId={selectedPayment?.id || 'pm_card_default'}
        savedMethods={[]}
        onSelectMethod={(method) => {
          setSelectedPayment(method);
          setCurrentView('checkout');
        }}
        onClose={() => setCurrentView('checkout')}
      />
    );
  }

  // --- SCREEN 3: DEDICATED LIVE GPS PICKUP MAP PAGE ---
  if (currentView === 'pickup_map') {
    return (
      <PickupMapPage
        onSelectPoint={(point) => {
          setSelectedPickupPoint(point);
          setCurrentView('checkout');
        }}
        onClose={() => setCurrentView('checkout')}
        currency={currency}
        userAddress={selectedAddress}
        selectedPointId={selectedPickupPoint?.id}
      />
    );
  }

  // --- SCREEN 4: STORE CUSTOMER SUBMISSIONS PORTAL ---
  if (currentView === 'admin') {
    return (
      <AdminDashboardPage
        onBackToStore={() => navigateToView('checkout')}
        currency={currency}
      />
    );
  }

  // --- MAIN SCREEN: CHECKOUT & PAYMENT ---
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-gray-900 pb-20 font-sans antialiased overflow-y-auto">
      {/* Top Header matching exact checkout UI */}
      <CheckoutHeader
        title="Payment"
        variant="payment-close"
        onBack={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Checkout Scroll Container */}
      <main className="max-w-md mx-auto px-4 pt-3.5 space-y-4">
        {validationWarning && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center justify-between">
            <span>{validationWarning}</span>
            <button
              type="button"
              onClick={() => setValidationWarning('')}
              className="text-amber-600 hover:text-amber-900 text-xs font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Independent Product Showcase Card */}
        <OrderSummaryCard
          product={product}
        />

        {/* 2. Address Section - Prompts user with "Add your shipping address +" */}
        <ShippingAddressSection
          selectedAddress={selectedAddress}
          onOpenAddressModal={() => setCurrentView('address')}
        />

        {/* 3. Delivery Option Section ("Ship to pick-up point" / "Ship to home") */}
        <DeliveryOptionsSection
          selectedType={deliveryType}
          onSelectType={handleSelectDeliveryType}
          minPickupPrice={minPickupPrice}
          minHomePrice={minHomePrice}
          currency={currency}
        />

        {/* If pickup is selected, show selected pickup point details or prompt to choose */}
        {deliveryType === 'pickup' && (
          <CarrierDetailsCard
            deliveryType="pickup"
            carrier={selectedCarrier}
            selectedPickupPoint={selectedPickupPoint}
            currency={currency}
            onOpenModal={() => setCurrentView('pickup_map')}
          />
        )}

        {/* 4. Payment Method Quick Selector */}
        <section className="space-y-1.5">
          <h2 className="text-sm font-normal text-gray-500">Payment method</h2>
          <button
            type="button"
            onClick={() => setCurrentView('payment_methods')}
            className="w-full text-left bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all shadow-2xs hover:shadow-xs active:scale-[0.99] group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedPayment?.title || 'Bank card'}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedPayment?.cardholderName
                    ? `${selectedPayment.cardholderName} •••• ${selectedPayment.last4 || 'Card'}`
                    : selectedPayment?.subtitle || 'Enter credit or debit card'}
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-semibold text-[#007782] group-hover:underline shrink-0">
              <span>{selectedPayment?.cardholderName ? 'Change' : 'Set details'}</span>
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </div>
          </button>
        </section>

        {/* 5. Dedicated Price Summary Section & Secure Pay Action at the bottom */}
        <PriceSummarySection
          pricing={pricingBreakdown}
          onOpenProtectionModal={() => setIsProtectionModalOpen(true)}
          onPay={handlePay}
          isProcessing={isProcessingPayment}
        />
      </main>

      {/* Buyer Protection Fee Modal */}
      <BuyerProtectionModal
        isOpen={isProtectionModalOpen}
        onClose={() => setIsProtectionModalOpen(false)}
        feeAmount={pricingBreakdown.buyerProtectionFee}
        currency={currency}
      />

      {/* Order Confirmation Receipt Modal */}
      <OrderConfirmationModal
        isOpen={isOrderConfirmed}
        onClose={() => setIsOrderConfirmed(false)}
        orderNumber={orderNumber}
        product={product}
        pricing={pricingBreakdown}
        deliveryAddress={selectedAddress}
        pickupPoint={selectedPickupPoint}
        deliveryType={deliveryType}
        carrier={selectedCarrier}
        paymentMethod={selectedPayment}
        onReset={handleReset}
      />
    </div>
  );
}
