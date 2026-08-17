import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';

interface ContactDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone: string;
  onSavePhone: (phone: string, saveForFuture: boolean) => void;
  countryCode?: string;
}

export const ContactDetailsModal: React.FC<ContactDetailsModalProps> = ({
  isOpen,
  onClose,
  initialPhone,
  onSavePhone,
  countryCode = '+48',
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || countryCode);
  const [saveForFuture, setSaveForFuture] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialPhone && initialPhone.trim().length > 0) {
        setPhoneNumber(initialPhone);
      } else {
        setPhoneNumber(countryCode ? `${countryCode} ` : '+48 ');
      }
      setError('');
    }
  }, [isOpen, initialPhone, countryCode]);

  if (!isOpen) return null;

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone || cleanPhone === countryCode.trim() || cleanPhone.length < 6) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    onSavePhone(cleanPhone, saveForFuture);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full h-full sm:h-[90vh] sm:max-w-md sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top Header matching Screenshot */}
        <div className="px-4 py-3.5 bg-white border-b border-gray-100 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-1 -ml-1 text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">
            Your contact details
          </h1>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleContinue} className="flex-1 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Illustration & Informative Notice Card */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 flex flex-col items-center text-center shadow-2xs">
              {/* Delivery Box with Bell Notification Icon */}
              <div className="w-20 h-20 mb-3 flex items-center justify-center relative">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Cardboard Box Body */}
                  <path
                    d="M 22 42 L 78 42 L 72 82 L 28 82 Z"
                    fill="#F7FAFC"
                    stroke="#2D3748"
                    strokeWidth="3.2"
                    strokeLinejoin="round"
                  />
                  {/* Left Flap */}
                  <path
                    d="M 22 42 L 10 26 L 38 26 L 42 42 Z"
                    fill="#EDF2F7"
                    stroke="#2D3748"
                    strokeWidth="3.2"
                    strokeLinejoin="round"
                  />
                  {/* Right Flap */}
                  <path
                    d="M 78 42 L 90 26 L 62 26 L 58 42 Z"
                    fill="#EDF2F7"
                    stroke="#2D3748"
                    strokeWidth="3.2"
                    strokeLinejoin="round"
                  />
                  {/* Center Notification Bell */}
                  <g transform="translate(34, 38)">
                    {/* Bell Body */}
                    <path
                      d="M 16 6 C 10 6 6 12 6 20 L 4 24 L 28 24 L 26 20 C 26 12 22 6 16 6 Z"
                      fill="#F6AD55"
                      stroke="#DD6B20"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                    {/* Bell Clapper */}
                    <circle cx="16" cy="27" r="3" fill="#DD6B20" />
                    {/* Bell Top Loop */}
                    <path
                      d="M 14 6 C 14 3.5 18 3.5 18 6"
                      stroke="#DD6B20"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Sound Waves */}
                    <path
                      d="M 2 12 C 0 15 0 18 2 21"
                      stroke="#F6AD55"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 30 12 C 32 15 32 18 30 21"
                      stroke="#F6AD55"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </g>
                </svg>
              </div>

              {/* Heading matching Screenshot */}
              <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-snug px-2">
                Add your phone number for smooth delivery
              </h2>

              {/* Subtitle description */}
              <p className="mt-3 text-xs sm:text-sm text-gray-500 leading-relaxed font-normal">
                The shipping company may use it to send you shipping updates or contact you. You can always edit or delete your phone number at checkout. Only a local phone number can be used.
              </p>
            </div>

            {/* Phone Number Input Field */}
            <div className="pt-2">
              <label
                htmlFor="phone-number-input"
                className="block text-xs font-normal text-gray-500 mb-1.5"
              >
                Phone number
              </label>
              <div className="relative">
                <input
                  id="phone-number-input"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+48 123 456 789"
                  className="w-full pb-2.5 pt-1 text-base text-gray-900 bg-transparent border-b border-gray-300 focus:border-[#007782] focus:outline-hidden transition-colors"
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
            </div>

            {/* Checkbox: Save this number for future orders */}
            <div className="pt-1">
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <button
                  type="button"
                  onClick={() => setSaveForFuture(!saveForFuture)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                    saveForFuture
                      ? 'bg-[#007782] border-[#007782] text-white'
                      : 'border-gray-300 group-hover:border-gray-400 bg-white'
                  }`}
                  aria-checked={saveForFuture}
                  role="checkbox"
                >
                  {saveForFuture && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
                <span className="text-sm text-gray-600 font-normal">
                  Save this number for future orders
                </span>
              </label>
            </div>
          </div>

          {/* Bottom Fixed Continue Action Button */}
          <div className="pt-6 mt-auto">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#007782] hover:bg-[#006069] active:bg-[#004f56] text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer text-center"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
