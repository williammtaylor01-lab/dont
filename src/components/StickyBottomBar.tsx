import React from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { Currency } from '../types';
import { formatPrice } from '../data/mockData';

interface StickyBottomBarProps {
  totalAmount: number;
  currency: Currency;
  isProcessing: boolean;
  onPay: () => void;
  disabled?: boolean;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  totalAmount,
  currency,
  isProcessing,
  onPay,
  disabled = false,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 pt-3 pb-6 sm:pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        {/* Secure encryption indicator matching reference */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2.5">
          <Lock className="w-3.5 h-3.5 text-gray-400" />
          <span>This is a secure encrypted payment</span>
        </div>

        {/* Primary Pay Action Button */}
        <button
          type="button"
          onClick={onPay}
          disabled={disabled || isProcessing}
          className={`w-full py-3.5 px-6 rounded-lg font-semibold text-base text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
            disabled || isProcessing
              ? 'bg-[#007782]/60 cursor-not-allowed'
              : 'bg-[#007782] hover:bg-[#006069] active:scale-[0.99] shadow-md'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing secure payment...</span>
            </>
          ) : (
            <span>Pay</span>
          )}
        </button>
      </div>
    </div>
  );
};
