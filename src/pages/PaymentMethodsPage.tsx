import React, { useState } from 'react';
import { X, CreditCard, Info, Lock, Check } from 'lucide-react';
import { SavedPaymentMethod, PaymentType } from '../types';

interface PaymentMethodsPageProps {
  selectedPaymentId: string;
  savedMethods: SavedPaymentMethod[];
  onSelectMethod: (method: SavedPaymentMethod) => void;
  onClose: () => void;
}

export const PaymentMethodsPage: React.FC<PaymentMethodsPageProps> = ({
  selectedPaymentId,
  onSelectMethod,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<PaymentType>('card');
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [blikCode, setBlikCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Format Card Number (space every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setExpiryDate(raw);
  };

  const handleSave = () => {
    if (selectedType === 'card') {
      if (!cardholderName.trim() || cardNumber.replace(/\s/g, '').length < 12) {
        setErrorMessage('Please enter your cardholder name and a valid card number.');
        return;
      }
      const rawDigits = cardNumber.replace(/\s/g, '');
      const last4 = rawDigits.slice(-4);
      const isVisa = rawDigits.startsWith('4');
      const isMastercard = rawDigits.startsWith('5');

      const cardMethod: SavedPaymentMethod = {
        id: `pm_card_${Date.now()}`,
        type: 'card',
        title: 'Bank card',
        subtitle: `Card ending with ${last4}`,
        cardholderName: cardholderName.trim(),
        cardNumber: cardNumber.trim(),
        securityCode: securityCode.trim() || undefined,
        last4,
        brand: isVisa ? 'visa' : isMastercard ? 'mastercard' : 'visa',
        expiry: expiryDate || '12/28',
        isDefault: true,
      };
      onSelectMethod(cardMethod);
      onClose();
    } else if (selectedType === 'google_pay') {
      onSelectMethod({
        id: 'pm_gpay',
        type: 'google_pay',
        title: 'Google Pay',
        subtitle: 'Finalise payment with Google Pay',
        isDefault: true,
      });
      onClose();
    } else if (selectedType === 'przelewy24') {
      onSelectMethod({
        id: 'pm_p24',
        type: 'przelewy24',
        title: 'Przelewy24',
        subtitle: 'Finalise payment through your bank using Przelewy24',
        isDefault: true,
      });
      onClose();
    } else if (selectedType === 'blik') {
      onSelectMethod({
        id: 'pm_blik',
        type: 'blik',
        title: 'Blik',
        subtitle: blikCode ? `BLIK code: ${blikCode}` : 'Finalise payment through your bank using Blik',
        blikCode: blikCode.trim() || undefined,
        isDefault: true,
        expiry: undefined,
        cardholderName: undefined,
      });
      onClose();
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-between font-sans">
      {/* Top Header matching Screenshot 2026-08-17 171732.png */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 h-13 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="p-1 -ml-1 text-gray-700 hover:text-gray-950 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          aria-label="Back"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-gray-900 absolute left-1/2 -translate-x-1/2">
          Payment methods
        </h1>
        <div className="w-6" />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-5 pb-8 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Select payment method
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
            <span>All payments are secure and encrypted.</span>
            <Lock className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Payment Options List matching exact screenshot */}
        <div className="space-y-3">
          {/* 1. Google Pay */}
          <div
            onClick={() => setSelectedType('google_pay')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedType === 'google_pay'
                ? 'border-[#007782] bg-teal-50/20 shadow-2xs'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                <span className="text-gray-800">
                  <span className="text-blue-500">G</span>Pay
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Google Pay</p>
                <p className="text-xs text-gray-500">Finalise payment with Google Pay</p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedType === 'google_pay'
                  ? 'border-[#007782] bg-[#007782]'
                  : 'border-gray-300'
              }`}
            >
              {selectedType === 'google_pay' && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </div>

          {/* 2. Przelewy24 */}
          <div
            onClick={() => setSelectedType('przelewy24')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedType === 'przelewy24'
                ? 'border-[#007782] bg-teal-50/20 shadow-2xs'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center font-bold text-[10px] text-red-600 shadow-2xs shrink-0">
                P24
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Przelewy24</p>
                <p className="text-xs text-gray-500">
                  Finalise payment through your bank using Przelewy24
                </p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedType === 'przelewy24'
                  ? 'border-[#007782] bg-[#007782]'
                  : 'border-gray-300'
              }`}
            >
              {selectedType === 'przelewy24' && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </div>

          {/* 3. Blik */}
          <div
            onClick={() => setSelectedType('blik')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedType === 'blik'
                ? 'border-[#007782] bg-teal-50/20 shadow-2xs'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center font-bold text-[11px] text-white shadow-2xs shrink-0">
                blik
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Blik</p>
                <p className="text-xs text-gray-500">
                  Finalise payment through your bank using Blik
                </p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedType === 'blik'
                  ? 'border-[#007782] bg-[#007782]'
                  : 'border-gray-300'
              }`}
            >
              {selectedType === 'blik' && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </div>

          {/* Blik Code Input when BLIK is selected */}
          {selectedType === 'blik' && (
            <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-200 space-y-2 animate-fadeIn">
              <label className="block text-xs font-medium text-gray-700">
                Enter 6-digit BLIK Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={blikCode}
                onChange={(e) => setBlikCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123 456"
                className="w-full tracking-widest text-center text-lg font-bold bg-white rounded-lg py-2.5 border border-gray-300 focus:border-gray-900 focus:outline-hidden"
              />
            </div>
          )}

          {/* 4. Bank Card Option (matching Screenshot 2026-08-17 171732.png) */}
          <div
            onClick={() => setSelectedType('card')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              selectedType === 'card'
                ? 'border-[#007782] bg-white shadow-2xs'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3.5">
                <CreditCard className="w-6 h-6 text-gray-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Bank card</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Use a credit or debit card
                  </p>
                  {/* Card Brand Badges: Mastercard, Visa, Discover */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-0.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-red-500 inline-block opacity-90" />
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block -ml-2 opacity-90" />
                    </span>
                    <span className="text-[10px] font-black italic text-blue-900 tracking-wider">
                      VISA
                    </span>
                    <span className="text-[9px] font-bold text-orange-600 tracking-tight">
                      DISCOVER
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedType === 'card'
                    ? 'border-[#007782] bg-[#007782]'
                    : 'border-gray-300'
                }`}
              >
                {selectedType === 'card' && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>

            {/* Embedded Form inside Bank Card as shown in Screenshot 2026-08-17 171732.png */}
            {selectedType === 'card' && (
              <div
                className="mt-4 pt-4 border-t border-gray-100 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Cardholder's name */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">
                    Cardholder's name
                  </label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full text-sm text-gray-900 bg-transparent py-1.5 border-b border-gray-200 focus:border-gray-900 focus:outline-hidden transition-colors placeholder:text-gray-300"
                  />
                </div>

                {/* Card number */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">
                    Card number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="e.g. 1234 1234 1234 1234"
                      className="w-full text-sm text-gray-900 bg-transparent py-1.5 pr-8 border-b border-gray-200 focus:border-gray-900 focus:outline-hidden transition-colors placeholder:text-gray-400"
                    />
                    <CreditCard className="w-4 h-4 text-gray-400 absolute right-1 top-2" />
                  </div>
                </div>

                {/* Expiry date & Security code */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500">
                      Expiry date
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full text-sm text-gray-900 bg-transparent py-1.5 border-b border-gray-200 focus:border-gray-900 focus:outline-hidden transition-colors placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500">
                      Security code
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={securityCode}
                        onChange={(e) => setSecurityCode(e.target.value.slice(0, 4))}
                        placeholder="e.g. 123"
                        maxLength={4}
                        className="w-full text-sm text-gray-900 bg-transparent py-1.5 pr-6 border-b border-gray-200 focus:border-gray-900 focus:outline-hidden transition-colors placeholder:text-gray-400"
                      />
                      <Info className="w-3.5 h-3.5 text-gray-400 absolute right-1 top-2" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save and Continue Button */}
        <div className="pt-6">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3.5 bg-[#007782] hover:bg-[#00626b] active:bg-[#004f56] text-white font-medium text-base rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Confirm payment method</span>
          </button>
        </div>
      </main>
    </div>
  );
};
