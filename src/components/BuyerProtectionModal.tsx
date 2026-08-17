import React from 'react';
import { X, ShieldCheck, CheckCircle2, RefreshCw, Headphones } from 'lucide-react';
import { Currency } from '../types';
import { formatPrice } from '../data/mockData';

interface BuyerProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeAmount: number;
  currency: Currency;
}

export const BuyerProtectionModal: React.FC<BuyerProtectionModalProps> = ({
  isOpen,
  onClose,
  feeAmount,
  currency,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-[#007782]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Buyer Protection</h2>
            <p className="text-xs text-gray-500">
              Fee: {formatPrice(feeAmount, currency)}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
          Buyer Protection is mandatory for all purchases made using the Pay button. It guarantees you a safe shopping experience.
        </p>

        <div className="space-y-3.5 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#007782] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Refund policy</h4>
              <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                Get a refund if your item doesn't arrive, is damaged in transit, or is significantly not as described.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-[#007782] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Secure transactions</h4>
              <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                Payment details are 256-bit encrypted. The seller only receives funds once you confirm you received the item.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Headphones className="w-5 h-5 text-[#007782] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-gray-900">24/7 Customer support</h4>
              <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                Our specialized team is available around the clock to assist you with any disputes or issues.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-[#007782] hover:bg-[#006069] text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
