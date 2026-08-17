import React, { useState, useEffect } from 'react';
import { X, Lock, Info, Check, CreditCard } from 'lucide-react';
import { SavedPaymentMethod } from '../types';

interface PaymentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedMethods: SavedPaymentMethod[];
  selectedMethodId: string;
  onSelectMethod: (id: string, customDetails?: Partial<SavedPaymentMethod>) => void;
  onAddNewCard: (card: SavedPaymentMethod) => void;
}

export const PaymentSelectionModal: React.FC<PaymentSelectionModalProps> = ({
  isOpen,
  onClose,
  savedMethods,
  selectedMethodId,
  onSelectMethod,
  onAddNewCard,
}) => {
  const [selectedId, setSelectedId] = useState<string>(selectedMethodId || 'pm_card_1');
  const [cardholderName, setCardholderName] = useState('Hard Reset');
  const [cardNumber, setCardNumber] = useState('4165 9871 4602 5490');
  const [expiryDate, setExpiryDate] = useState('07/30');
  const [securityCode, setSecurityCode] = useState('421');
  const [saveCardDetails, setSaveCardDetails] = useState(true);
  const [showCvcInfo, setShowCvcInfo] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (selectedMethodId) {
        setSelectedId(selectedMethodId);
      } else {
        setSelectedId('pm_card_1');
      }
    }
  }, [isOpen, selectedMethodId]);

  if (!isOpen) return null;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    // Format in blocks of 4
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setExpiryDate(val);
  };

  const handleSecurityCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    setSecurityCode(val);
  };

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId === 'pm_card_1' || selectedId.startsWith('pm_card')) {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      const last4 = cleanNum.slice(-4) || '5490';
      const brand = cleanNum.startsWith('4') ? 'visa' : cleanNum.startsWith('5') ? 'mastercard' : 'visa';

      onSelectMethod(selectedId, {
        title: 'Bank card',
        subtitle: `•••• ${last4}`,
        cardholderName: cardholderName || 'Hard Reset',
        last4,
        brand,
        expiry: expiryDate || '07/30',
      });
    } else {
      onSelectMethod(selectedId);
    }
    onClose();
  };

  // Detect card brand icon for input field
  const cleanNumber = cardNumber.replace(/\s+/g, '');
  const isVisa = cleanNumber.startsWith('4');
  const isMastercard = cleanNumber.startsWith('5') || cleanNumber.startsWith('2');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full h-full sm:h-[92vh] sm:max-w-md sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top Header Bar matching Screenshot 1 & 2 */}
        <div className="px-4 py-3.5 bg-white border-b border-gray-100 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-1 -ml-1 text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">
            Payment methods
          </h1>
        </div>

        {/* Scrollable Modal Content */}
        <form
          onSubmit={handleProceed}
          className="flex-1 flex flex-col justify-between p-4 sm:p-5 overflow-y-auto"
        >
          <div className="space-y-5">
            {/* Title & Security Notice matching Screenshot 1 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Select payment method
              </h2>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                <span>All payments are secure and encrypted.</span>
                <Lock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
              </div>
            </div>

            {/* Payment Methods Radio List */}
            <div className="space-y-4">
              {/* 1. Google Pay */}
              <div
                onClick={() => setSelectedId('pm_gpay')}
                className="flex items-start justify-between p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-start gap-3.5">
                  {/* Google Pay Pill Badge */}
                  <div className="w-12 h-7.5 rounded-md border border-gray-200 bg-white flex items-center justify-center shadow-2xs shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-gray-800 tracking-tight flex items-center gap-0.5">
                      <span className="text-[#4285F4] font-black">G</span>
                      <span className="text-gray-700 font-medium text-[11px]">Pay</span>
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900">Google Pay</p>
                    <p className="text-xs text-gray-500 mt-0.5">Finalise payment with Google Pay</p>
                  </div>
                </div>

                {/* Radio Circle */}
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center mt-1 transition-all ${
                    selectedId === 'pm_gpay'
                      ? 'border-[#007782] bg-white ring-4 ring-[#007782]/20'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {selectedId === 'pm_gpay' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#007782]" />
                  )}
                </div>
              </div>

              {/* 2. Przelewy24 */}
              <div
                onClick={() => setSelectedId('pm_p24')}
                className="flex items-start justify-between p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-start gap-3.5">
                  {/* Przelewy24 Badge */}
                  <div className="w-12 h-7.5 rounded-md border border-gray-200 bg-white flex items-center justify-center shadow-2xs shrink-0 mt-0.5 px-1">
                    <div className="text-[9px] font-bold text-red-600 tracking-tighter leading-tight italic">
                      <span className="text-red-600">Przelewy</span>
                      <span className="text-blue-900 font-black">24</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900">Przelewy24</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Finalise payment through your bank using Przelewy24
                    </p>
                  </div>
                </div>

                {/* Radio Circle */}
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center mt-1 transition-all ${
                    selectedId === 'pm_p24'
                      ? 'border-[#007782] bg-white ring-4 ring-[#007782]/20'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {selectedId === 'pm_p24' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#007782]" />
                  )}
                </div>
              </div>

              {/* 3. Blik */}
              <div
                onClick={() => setSelectedId('pm_blik')}
                className="flex items-start justify-between p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-start gap-3.5">
                  {/* Blik Badge */}
                  <div className="w-12 h-7.5 rounded-md border border-gray-200 bg-white flex items-center justify-center shadow-2xs shrink-0 mt-0.5">
                    <span className="text-xs font-black text-black tracking-tighter lowercase flex items-baseline">
                      bl<span className="text-[#DC0032] inline-block font-extrabold">i</span>k
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900">Blik</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Finalise payment through your bank using Blik
                    </p>
                  </div>
                </div>

                {/* Radio Circle */}
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center mt-1 transition-all ${
                    selectedId === 'pm_blik'
                      ? 'border-[#007782] bg-white ring-4 ring-[#007782]/20'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {selectedId === 'pm_blik' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#007782]" />
                  )}
                </div>
              </div>

              {/* 4. Bank Card */}
              <div
                onClick={() => setSelectedId('pm_card_1')}
                className="flex items-start justify-between p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-start gap-3.5">
                  {/* Card Outline Icon */}
                  <div className="w-12 h-7.5 rounded-md border border-gray-200 bg-white flex items-center justify-center shadow-2xs shrink-0 mt-0.5 text-gray-700">
                    <CreditCard className="w-5 h-5 stroke-[1.7]" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900">Bank card</p>
                    <p className="text-xs text-gray-500 mt-0.5">Use a credit or debit card</p>

                    {/* Brand Logos underneath subtitle */}
                    <div className="flex items-center gap-3 mt-2">
                      {/* Mastercard red/orange circles */}
                      <div className="flex items-center -space-x-1.5" title="Mastercard">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]" />
                        <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B]/90" />
                      </div>

                      {/* VISA Logo */}
                      <span className="text-[10px] font-black italic tracking-tighter text-[#1A1F71]">
                        VISA
                      </span>

                      {/* DISCOVER Logo */}
                      <div className="flex items-center gap-0.5" title="Discover">
                        <span className="text-[8px] font-bold tracking-tight text-gray-800 uppercase">
                          DISC<span className="text-orange-500 font-extrabold">O</span>VER
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Radio Circle */}
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center mt-1 transition-all ${
                    selectedId === 'pm_card_1' || selectedId.startsWith('pm_card')
                      ? 'border-[#007782] bg-white ring-4 ring-[#007782]/20'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {(selectedId === 'pm_card_1' || selectedId.startsWith('pm_card')) && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#007782]" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Card Details Form Container (matching Screenshot 1 & 2) */}
            {(selectedId === 'pm_card_1' || selectedId.startsWith('pm_card')) && (
              <div className="bg-[#FAFBFD] rounded-xl border border-gray-200/80 p-4 space-y-4 animate-in fade-in duration-150">
                {/* Field: Cardholder's name */}
                <div>
                  <label
                    htmlFor="cardholder-name"
                    className="block text-xs font-normal text-gray-500 mb-1"
                  >
                    Cardholder's name
                  </label>
                  <input
                    id="cardholder-name"
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Full name"
                    className="w-full text-sm text-gray-900 bg-transparent border-b border-gray-300 focus:border-[#007782] pb-1.5 focus:outline-hidden transition-colors"
                  />
                </div>

                {/* Field: Card number */}
                <div>
                  <label
                    htmlFor="card-number-field"
                    className="block text-xs font-normal text-gray-500 mb-1"
                  >
                    Card number
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="card-number-field"
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="e.g. 1234 1234 1234 1234"
                      maxLength={19}
                      className="w-full text-sm text-gray-900 bg-transparent border-b border-gray-300 focus:border-[#007782] pb-1.5 pr-10 focus:outline-hidden transition-colors font-mono tracking-wide"
                    />
                    <div className="absolute right-0 bottom-1.5">
                      {isVisa ? (
                        <span className="text-[10px] font-black italic tracking-tighter text-[#1A1F71] bg-white px-1.5 py-0.5 rounded border border-gray-200 shadow-2xs">
                          VISA
                        </span>
                      ) : isMastercard ? (
                        <div className="flex items-center -space-x-1 bg-white px-1 py-0.5 rounded border border-gray-200">
                          <div className="w-3 h-3 rounded-full bg-[#EB001B]" />
                          <div className="w-3 h-3 rounded-full bg-[#F79E1B]/90" />
                        </div>
                      ) : (
                        <CreditCard className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 2 Column Row: Expiry date & Security code */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Expiry Date */}
                  <div>
                    <label
                      htmlFor="expiry-date-field"
                      className="block text-xs font-normal text-gray-500 mb-1"
                    >
                      Expiry date
                    </label>
                    <input
                      id="expiry-date-field"
                      type="text"
                      value={expiryDate}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full text-sm text-gray-900 bg-transparent border-b border-gray-300 focus:border-[#007782] pb-1.5 focus:outline-hidden transition-colors font-mono"
                    />
                  </div>

                  {/* Security Code */}
                  <div>
                    <label
                      htmlFor="security-code-field"
                      className="block text-xs font-normal text-gray-500 mb-1"
                    >
                      Security code
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="security-code-field"
                        type="password"
                        value={securityCode}
                        onChange={handleSecurityCodeChange}
                        placeholder="e.g. 123"
                        maxLength={4}
                        className="w-full text-sm text-gray-900 bg-transparent border-b border-gray-300 focus:border-[#007782] pb-1.5 pr-6 focus:outline-hidden transition-colors font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCvcInfo(!showCvcInfo)}
                        className="absolute right-0 bottom-1.5 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                        title="3 digits on the back of your card"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {showCvcInfo && (
                  <p className="text-[11px] text-[#007782] bg-teal-50 p-2 rounded-md border border-teal-100">
                    The 3-digit CVV/CVC security code on the back of your card (or 4 digits on front for Amex).
                  </p>
                )}
              </div>
            )}

            {/* Save Card Details Checkbox matching Screenshot 2 */}
            {(selectedId === 'pm_card_1' || selectedId.startsWith('pm_card')) && (
              <div className="pt-1">
                <label className="flex items-start gap-3 cursor-pointer select-none group">
                  <button
                    type="button"
                    onClick={() => setSaveCardDetails(!saveCardDetails)}
                    className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      saveCardDetails
                        ? 'bg-[#007782] border-[#007782] text-white'
                        : 'border-gray-300 group-hover:border-gray-400 bg-white'
                    }`}
                    aria-checked={saveCardDetails}
                    role="checkbox"
                  >
                    {saveCardDetails && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <span className="text-xs text-gray-500 leading-relaxed font-normal">
                    Agree to save these card details for faster checkout. You can remove the card anytime in Settings, under Payments.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Bottom Fixed Action Button: Proceed */}
          <div className="pt-6 mt-auto">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#007782] hover:bg-[#006069] active:bg-[#004f56] text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer text-center"
            >
              Proceed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
