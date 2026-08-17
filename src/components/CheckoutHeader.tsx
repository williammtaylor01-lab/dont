import React from 'react';
import { X, ArrowLeft } from 'lucide-react';

interface CheckoutHeaderProps {
  title?: string;
  onBack?: () => void;
  variant?: 'payment-close' | 'checkout-back';
}

export const CheckoutHeader: React.FC<CheckoutHeaderProps> = ({
  title = 'Payment',
  onBack,
  variant = 'payment-close',
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="max-w-md mx-auto px-4 h-13 flex items-center justify-between relative">
        <button
          type="button"
          onClick={onBack}
          className="p-1 -ml-1 text-gray-700 hover:text-gray-950 hover:bg-gray-100 rounded-full transition-colors active:scale-95 cursor-pointer z-10"
          aria-label={variant === 'payment-close' ? 'Close' : 'Back'}
        >
          {variant === 'payment-close' ? (
            <X className="w-5 h-5" />
          ) : (
            <ArrowLeft className="w-5 h-5" />
          )}
        </button>

        <h1 className="text-base font-semibold text-gray-900 tracking-tight absolute inset-0 flex items-center justify-center pointer-events-none">
          {title}
        </h1>

        <div className="w-6" />
      </div>
    </header>
  );
};


