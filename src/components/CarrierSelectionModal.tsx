import React from 'react';
import { X, Check, Clock, Store, Sparkles } from 'lucide-react';
import { CarrierOption, Currency, DeliveryType } from '../types';
import { CarrierBadge } from './CarrierBadge';
import { formatPrice } from '../data/mockData';

interface CarrierSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  carriers: CarrierOption[];
  deliveryType: DeliveryType;
  selectedCarrierId: string;
  onSelectCarrier: (carrierId: string) => void;
  currency: Currency;
}

export const CarrierSelectionModal: React.FC<CarrierSelectionModalProps> = ({
  isOpen,
  onClose,
  carriers,
  deliveryType,
  selectedCarrierId,
  onSelectCarrier,
  currency,
}) => {
  if (!isOpen) return null;

  const filteredCarriers = carriers.filter((c) => c.type === deliveryType);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl relative border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Select shipping carrier
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {deliveryType === 'pickup' ? 'Pick-up point delivery' : 'Direct home delivery'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Carriers */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {filteredCarriers.map((carrier) => {
            const isSelected = carrier.id === selectedCarrierId;
            return (
              <div
                key={carrier.id}
                onClick={() => {
                  onSelectCarrier(carrier.id);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'border-[#007782] bg-teal-50/40 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <CarrierBadge type={carrier.logoType} size="md" className="mt-0.5" />

                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{carrier.name}</p>
                    </div>

                    {carrier.type === 'pickup' && carrier.locationName && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs font-medium text-gray-800 flex items-center gap-1">
                          <Store className="w-3 h-3 text-[#007782]" />
                          <span>{carrier.locationName}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {carrier.locationAddress}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{carrier.estimatedDelivery}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-sm font-bold text-gray-900">
                    {formatPrice(carrier.price, currency)}
                  </span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-[#007782] bg-[#007782]' : 'border-gray-300'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
