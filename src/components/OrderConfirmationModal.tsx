import React, { useEffect } from 'react';
import { CheckCircle2, Package, MapPin, Truck, ShieldCheck, Box, CreditCard, Clock, ExternalLink } from 'lucide-react';
import { Address, CarrierOption, Currency, ProductItem, PricingBreakdown, PickUpPoint, SavedPaymentMethod, DeliveryType } from '../types';
import { formatPrice } from '../data/mockData';
import { CarrierBadge } from './CarrierBadge';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  product: ProductItem;
  pricing: PricingBreakdown;
  deliveryAddress?: Address | null;
  pickupPoint?: PickUpPoint | null;
  deliveryType?: DeliveryType;
  carrier?: CarrierOption;
  paymentMethod?: SavedPaymentMethod;
  currency?: Currency;
  onReset?: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  product,
  pricing,
  deliveryAddress,
  pickupPoint,
  deliveryType = 'pickup',
  carrier,
  paymentMethod,
  onReset,
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        window.location.href = 'https://www.vinted.co.uk/';
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const curr = pricing.currency;

  const handleRedirect = () => {
    window.location.href = 'https://www.vinted.co.uk/';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative border border-gray-100 overflow-hidden">
        {/* Order Submitted Header */}
        <div className="bg-teal-50/70 p-6 text-center border-b border-teal-100 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-[#007782] text-white flex items-center justify-center shadow-lg shadow-[#007782]/20 mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Order submitted</h2>
          <p className="text-xs text-gray-600 mt-1">
            Order #{orderNumber} • Redirecting to Vinted...
          </p>
        </div>

        {/* Order Details Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Purchased Item Summary */}
          <div className="flex gap-3.5 p-3 rounded-xl bg-gray-50 border border-gray-200/70 items-center">
            <div className="w-14 h-16 rounded-md overflow-hidden bg-white shrink-0 border border-gray-200 flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Package className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{product.title}</h3>
              <p className="text-xs text-gray-500">{product.brand} • {product.size}</p>
              <p className="text-xs font-bold text-gray-900 mt-1">{formatPrice(product.price, curr)}</p>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="p-3.5 rounded-xl border border-gray-200 space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-gray-900">
              <div className="flex items-center gap-2">
                <CarrierBadge
                  type={pickupPoint?.logoType || carrier?.logoType || 'inpost'}
                  size="sm"
                  className="w-5 h-5 rounded-[4px]"
                />
                <span>
                  {deliveryType === 'pickup'
                    ? pickupPoint?.carrierName || 'InPost Paczkomat 24/7'
                    : carrier?.name || 'Home Delivery'}
                </span>
              </div>
              <span className="text-[#007782] font-medium">
                {pickupPoint?.estimatedDelivery || carrier?.estimatedDelivery || '1 - 2 business days'}
              </span>
            </div>

            {deliveryType === 'pickup' && pickupPoint ? (
              <div className="pt-2 border-t border-gray-100 space-y-1 text-gray-600">
                <div className="flex items-center gap-1.5 font-medium text-gray-800">
                  <Box className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{pickupPoint.pointCode} - {pickupPoint.pointName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{pickupPoint.address}, {pickupPoint.city}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{pickupPoint.openingHours}</span>
                </div>
              </div>
            ) : (
              deliveryAddress && (
                <div className="pt-2 border-t border-gray-100 flex items-start gap-2 text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">{deliveryAddress.fullName}</p>
                    <p>{deliveryAddress.line1}, {deliveryAddress.city}, {deliveryAddress.postalCode}</p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Payment Method Details */}
          {paymentMethod && (
            <div className="p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-gray-700">
                <CreditCard className="w-4 h-4 text-[#007782]" />
                <span>Paid with {paymentMethod.title}</span>
              </div>
              {paymentMethod.last4 && (
                <span className="text-gray-500 font-mono">•••• {paymentMethod.last4}</span>
              )}
            </div>
          )}

          {/* Price Breakdown */}
          <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-200 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Order</span>
              <span>{formatPrice(pricing.orderPrice, curr)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Buyer Protection fee</span>
              <span>{formatPrice(pricing.buyerProtectionFee, curr)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{formatPrice(pricing.shippingPrice, curr)}</span>
            </div>
            {pricing.shippingDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Shipping (Discount)</span>
                <span>-{formatPrice(pricing.shippingDiscount, curr)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-sm text-gray-900">
              <span>Total Paid</span>
              <span>{formatPrice(pricing.total, curr)}</span>
            </div>
          </div>

          {/* Buyer protection badge */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-teal-50/50 text-[#007782] text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Protected by Buyer Protection until item delivery is confirmed.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-white flex gap-2">
          <button
            type="button"
            onClick={handleRedirect}
            className="flex-1 py-3 px-4 rounded-lg bg-[#007782] hover:bg-[#006069] text-white font-semibold text-sm transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Continue to Vinted</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
