import React from 'react';
import { MapPin, Home } from 'lucide-react';
import { Currency, DeliveryType } from '../types';
import { formatPrice } from '../data/mockData';

interface DeliveryOptionsSectionProps {
  selectedType: DeliveryType;
  onSelectType: (type: DeliveryType) => void;
  minPickupPrice: number;
  minHomePrice: number;
  currency: Currency;
}

export const DeliveryOptionsSection: React.FC<DeliveryOptionsSectionProps> = ({
  selectedType,
  onSelectType,
  minPickupPrice,
  minHomePrice,
  currency,
}) => {
  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-sm font-normal text-gray-500">
          Delivery option
        </h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100 shadow-2xs">
        {/* Option 1: Ship to pick-up point */}
        <button
          type="button"
          onClick={() => onSelectType('pickup')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50/80 transition-colors cursor-pointer"
          role="radio"
          aria-checked={selectedType === 'pickup'}
        >
          <div className="flex items-center gap-3.5">
            <div className="text-gray-600">
              <MapPin className="w-5 h-5 text-gray-500 stroke-[1.75]" />
            </div>
            <div>
              <p className="text-base font-normal text-gray-900 leading-snug">
                Ship to pick-up point
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                From {formatPrice(minPickupPrice, currency)}
              </p>
            </div>
          </div>

          {/* Radio indicator */}
          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all">
            {selectedType === 'pickup' ? (
              <div className="w-5 h-5 rounded-full border-2 border-[#007782] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#007782]" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-gray-300" />
            )}
          </div>
        </button>

        {/* Option 2: Ship to home */}
        <button
          type="button"
          onClick={() => onSelectType('home')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50/80 transition-colors cursor-pointer"
          role="radio"
          aria-checked={selectedType === 'home'}
        >
          <div className="flex items-center gap-3.5">
            <div className="text-gray-600">
              <Home className="w-5 h-5 text-gray-500 stroke-[1.75]" />
            </div>
            <div>
              <p className="text-base font-normal text-gray-900 leading-snug">
                Ship to home
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                From {formatPrice(minHomePrice, currency)}
              </p>
            </div>
          </div>

          {/* Radio indicator */}
          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all">
            {selectedType === 'home' ? (
              <div className="w-5 h-5 rounded-full border-2 border-[#007782] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#007782]" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-gray-300" />
            )}
          </div>
        </button>
      </div>
    </section>
  );
};

