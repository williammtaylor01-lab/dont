import React from 'react';
import { Plus, MapPin, ChevronRight } from 'lucide-react';
import { Address } from '../types';

interface ShippingAddressSectionProps {
  selectedAddress: Address | null;
  onOpenAddressModal: () => void;
}

export const ShippingAddressSection: React.FC<ShippingAddressSectionProps> = ({
  selectedAddress,
  onOpenAddressModal,
}) => {
  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-sm font-normal text-gray-500">
          Address
        </h2>
      </div>

      <button
        type="button"
        onClick={onOpenAddressModal}
        className="w-full text-left bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all shadow-2xs hover:shadow-xs active:scale-[0.99] group cursor-pointer"
        aria-label={selectedAddress ? 'Change shipping address' : 'Add your shipping address'}
      >
        {selectedAddress ? (
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 text-[#007782] flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{selectedAddress.fullName}</p>
                <p className="text-gray-600 mt-0.5">
                  {selectedAddress.line1}
                  {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}
                </p>
                <p className="text-gray-600">
                  {selectedAddress.postalCode} {selectedAddress.city}, {selectedAddress.country}
                </p>
                {selectedAddress.phoneNumber && (
                  <p className="text-xs text-gray-400 mt-1">{selectedAddress.phoneNumber}</p>
                )}
              </div>
            </div>

            <div className="flex items-center text-xs font-semibold text-[#007782] group-hover:underline shrink-0">
              <span>Change</span>
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-base font-normal text-gray-900">
              Add your shipping address
            </span>
            <Plus className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
          </div>
        )}
      </button>
    </section>
  );
};

