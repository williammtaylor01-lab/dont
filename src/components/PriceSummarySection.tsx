import React from 'react';
import { Info, Lock } from 'lucide-react';
import { PricingBreakdown } from '../types';
import { formatPrice } from '../data/mockData';

interface PriceSummarySectionProps {
  pricing: PricingBreakdown;
  onOpenProtectionModal: () => void;
  onPay: () => void;
  isProcessing?: boolean;
}

export const PriceSummarySection: React.FC<PriceSummarySectionProps> = ({
  pricing,
  onOpenProtectionModal,
  onPay,
  isProcessing = false,
}) => {
  const { currency, orderPrice, buyerProtectionFee, shippingPrice, shippingDiscount, total } = pricing;

  // If there's a free shipping promotion or discount
  const originalShippingPrice =
    shippingDiscount && shippingDiscount > 0
      ? shippingPrice + shippingDiscount
      : shippingPrice > 0
      ? shippingPrice
      : 8.59;

  const hasDiscount = shippingDiscount && shippingDiscount > 0 || shippingPrice === 0;
  const discountAmount = shippingDiscount && shippingDiscount > 0 ? shippingDiscount : originalShippingPrice;

  return (
    <section className="space-y-3 pt-2">
      <h2 className="text-base font-semibold text-gray-900 tracking-tight">
        Price summary
      </h2>

      <div className="space-y-2.5 text-sm">
        {/* Order Base Line */}
        <div className="flex justify-between items-center text-gray-500">
          <span className="font-normal">Order</span>
          <span className="text-gray-900 font-normal">
            {formatPrice(orderPrice, currency)}
          </span>
        </div>

        {/* Buyer Protection Fee */}
        <div className="flex justify-between items-center text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="font-normal">Buyer Protection fee</span>
            <button
              type="button"
              onClick={onOpenProtectionModal}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-100 cursor-pointer"
              aria-label="Buyer Protection fee information"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-gray-900 font-normal">
            {formatPrice(buyerProtectionFee, currency)}
          </span>
        </div>

        {/* Shipping Line */}
        <div className="flex justify-between items-center text-gray-500">
          <span className="font-normal">Shipping</span>
          <span className="text-gray-900 font-normal">
            {formatPrice(hasDiscount ? originalShippingPrice : shippingPrice, currency)}
          </span>
        </div>

        {/* Shipping Discount (Free) Line if applicable */}
        {hasDiscount && (
          <div className="flex justify-between items-center text-gray-500">
            <span className="font-normal">Shipping (Free)</span>
            <span className="text-gray-900 font-normal">
              -{formatPrice(discountAmount, currency)}
            </span>
          </div>
        )}

        {/* Total to pay line */}
        <div className="pt-3 pb-1 flex justify-between items-baseline">
          <span className="text-base font-semibold text-gray-900">Total to pay</span>
          <span className="text-base font-semibold text-gray-900">
            {formatPrice(total, currency)}
          </span>
        </div>
      </div>

      {/* Pay Action Button matching screenshot */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onPay}
          disabled={isProcessing}
          className="w-full py-3.5 bg-[#007782] hover:bg-[#006069] active:bg-[#004f56] text-white font-semibold text-base rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Pay'
          )}
        </button>

        {/* Security guarantee footer matching screenshot */}
        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-500">
          <Lock className="w-3.5 h-3.5 text-gray-400" />
          <span>Your payment details are encrypted and secure</span>
        </div>
      </div>
    </section>
  );
};
