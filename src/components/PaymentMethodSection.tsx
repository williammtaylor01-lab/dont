import React from 'react';
import { Plus, Pencil, CreditCard } from 'lucide-react';
import { SavedPaymentMethod } from '../types';

interface PaymentMethodSectionProps {
  selectedPayment: SavedPaymentMethod | undefined;
  onOpenPaymentModal: () => void;
}

export const PaymentMethodSection: React.FC<PaymentMethodSectionProps> = ({
  selectedPayment,
  onOpenPaymentModal,
}) => {
  const renderPaymentContent = (payment: SavedPaymentMethod) => {
    switch (payment.type) {
      case 'google_pay':
        return (
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-gray-800 tracking-tight flex items-center gap-0.5 border border-gray-200 px-1.5 py-0.5 rounded shadow-2xs">
              <span className="text-[#4285F4] font-black">G</span>
              <span className="text-gray-700 font-medium text-[10px]">Pay</span>
            </span>
            <span className="text-sm font-normal text-gray-900">Google Pay</span>
          </div>
        );
      case 'przelewy24':
        return (
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold tracking-tighter leading-tight italic border border-gray-200 px-1.5 py-0.5 rounded shadow-2xs">
              <span className="text-red-600">P</span>
              <span className="text-blue-900 font-black">24</span>
            </span>
            <span className="text-sm font-normal text-gray-900">Przelewy24</span>
          </div>
        );
      case 'blik':
        return (
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black tracking-tighter border border-gray-200 px-1.5 py-0.5 rounded shadow-2xs">
              bl<span className="text-[#DC0032] inline-block font-extrabold">i</span>k
            </span>
            <span className="text-sm font-normal text-gray-900">Blik</span>
          </div>
        );
      default:
        // Bank card matching Screenshot: VISA Visa ending with 5490
        const isVisa = payment.brand === 'visa' || !payment.brand;
        return (
          <div className="flex items-center gap-2.5">
            {isVisa ? (
              <span className="text-[10px] font-black italic tracking-tighter text-[#1A1F71] bg-white px-1.5 py-0.5 rounded border border-gray-200 shadow-2xs">
                VISA
              </span>
            ) : (
              <div className="flex items-center -space-x-1 bg-white px-1 py-0.5 rounded border border-gray-200">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EB001B]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B]/90" />
              </div>
            )}
            <span className="text-sm font-normal text-gray-900">
              {payment.brand === 'visa' || !payment.brand ? 'Visa' : 'Mastercard'} ending with {payment.last4 || '5490'}
            </span>
          </div>
        );
    }
  };

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-base font-semibold text-gray-900 tracking-tight">
          Payment
        </h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden hover:border-gray-300 transition-all cursor-pointer">
        <button
          type="button"
          onClick={onOpenPaymentModal}
          className="w-full text-left p-4 cursor-pointer group"
        >
          {selectedPayment ? (
            <div className="flex items-center justify-between">
              {renderPaymentContent(selectedPayment)}
              <Pencil className="w-4 h-4 text-gray-500 group-hover:text-gray-900" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-normal text-gray-900">
                Choose a payment method
              </span>
              <Plus className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
            </div>
          )}
        </button>
      </div>
    </section>
  );
};
