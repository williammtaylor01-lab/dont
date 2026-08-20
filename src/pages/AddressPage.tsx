import React, { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Address } from '../types';

interface AddressPageProps {
  initialAddress?: Address | null;
  onSave: (address: Address) => void;
  onClose: () => void;
}

const COUNTRIES = [
  'France',
  'Poland',
  'United Kingdom',
  'Germany',
  'Spain',
  'Italy',
  'Belgium',
  'Netherlands',
  'Portugal',
  'United States',
];

export const AddressPage: React.FC<AddressPageProps> = ({
  initialAddress,
  onSave,
  onClose,
}) => {
  const [fullName, setFullName] = useState(initialAddress?.fullName || '');
  const [country, setCountry] = useState(initialAddress?.country || 'France');
  const [line1, setLine1] = useState(initialAddress?.line1 || '');
  const [line2, setLine2] = useState(initialAddress?.line2 || '');
  const [postalCode, setPostalCode] = useState(initialAddress?.postalCode || '');
  const [city, setCity] = useState(initialAddress?.city || '');
  const [phoneNumber, setPhoneNumber] = useState(initialAddress?.phoneNumber || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Postcode auto-fill simulator for popular French / European postcodes
  const handlePostcodeChange = (val: string) => {
    setPostalCode(val);
    if (!city || city === '') {
      if (val.startsWith('75')) setCity('Paris');
      else if (val.startsWith('69')) setCity('Lyon');
      else if (val.startsWith('13')) setCity('Marseille');
      else if (val.startsWith('31-') || val === '31140' || val === '31161') setCity('Kraków');
      else if (val.startsWith('00-') || val.startsWith('01-') || val === '00001') setCity('Warsaw');
      else if (val.startsWith('EC') || val.startsWith('W1') || val.startsWith('SW')) setCity('London');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !line1.trim() || !postalCode.trim() || !city.trim() || !phoneNumber.trim()) {
      setErrorMessage('Please fill in your full name, phone number, address line 1, postcode, and city.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);

    const newAddress: Address = {
      id: initialAddress?.id || `addr_${Date.now()}`,
      fullName: fullName.trim(),
      country,
      line1: line1.trim(),
      line2: line2.trim() || undefined,
      postalCode: postalCode.trim(),
      city: city.trim(),
      phoneNumber: phoneNumber.trim(),
      isDefault: true,
    };

    // Save to backend API

    setIsSubmitting(false);
    onSave(newAddress);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-between font-sans">
      {/* Header bar matching Screenshot 2026-08-17 164746.png */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 h-13 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="text-base font-normal text-gray-800 hover:text-gray-950 transition-colors cursor-pointer py-1"
        >
          Close
        </button>
        <h1 className="text-base font-semibold text-gray-900 absolute left-1/2 -translate-x-1/2">
          Address
        </h1>
        <div className="w-12" />
      </header>

      {/* Main Address Form */}
      <main className="flex-1 max-w-md mx-auto w-full px-5 pt-4 pb-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-sm font-normal text-gray-500">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Drew Nicholls"
              className="w-full text-base font-normal text-gray-900 bg-transparent py-2 border-b border-gray-200 focus:border-gray-900 focus:outline-hidden transition-colors placeholder:text-gray-300"
              autoFocus
            />
          </div>

          {/* Country */}
          <div className="space-y-1">
            <label className="block text-sm font-normal text-gray-500">
              Country
            </label>
            <div className="relative">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full appearance-none text-base font-normal text-gray-900 bg-transparent py-2 pr-8 border-b border-gray-200 focus:border-gray-900 focus:outline-hidden transition-colors cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-600 absolute right-1 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Address line 1 */}
          <div className="space-y-1">
            <label className="block text-sm font-normal text-gray-500">
              Address line 1
            </label>
            <input
              type="text"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="ex. : 32 rue du Bac"
              className="w-full text-base font-normal text-gray-900 bg-transparent py-2 border-b border-gray-200 focus:border-gray-900 focus:outline-hidden transition-colors placeholder:text-gray-400"
            />
          </div>

          {/* Address line 2 (optional) */}
          <div className="space-y-1">
            <label className="block text-sm font-normal text-gray-500">
              Address line 2 (optional)
            </label>
            <input
              type="text"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="e.g. Flat 2"
              className="w-full text-base font-normal text-gray-900 bg-transparent py-2 border-b border-gray-200 focus:border-gray-900 focus:outline-hidden transition-colors placeholder:text-gray-400"
            />
          </div>

          {/* Postcode */}
          <div className="space-y-1">
            <label className="block text-sm font-normal text-gray-500">
              Postcode
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => handlePostcodeChange(e.target.value)}
              placeholder="e.g. 12345"
              className="w-full text-base font-normal text-gray-900 bg-transparent py-2 border-b border-gray-200 focus:border-gray-900 focus:outline-hidden transition-colors placeholder:text-gray-400"
            />
          </div>

          {/* City/Town */}
          <div className="space-y-1">
            <label className="block text-sm font-normal text-gray-500">
              City/Town
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City/Town"
              className="w-full text-base font-normal text-gray-900 bg-transparent py-2 border-b border-gray-200 focus:border-gray-900 focus:outline-hidden transition-colors placeholder:text-gray-300"
            />
            <p className="text-xs text-gray-400 font-normal pt-1">
              City will autofill based on your postcode
            </p>
          </div>

          {/* Contact Phone (Optional on Address Screen) */}
          <div className="space-y-1 pt-2">
            <label className="block text-sm font-normal text-gray-500">
              Phone number (for delivery courier)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. +33 6 12 34 56 78"
              className="w-full text-base font-normal text-gray-900 bg-transparent py-2 border-b border-gray-200 focus:border-gray-900 focus:outline-hidden transition-colors placeholder:text-gray-400"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#007782] hover:bg-[#00626b] active:bg-[#004f56] text-white font-medium text-base rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving address...</span>
                </>
              ) : (
                'Save address'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
