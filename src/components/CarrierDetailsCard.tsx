import React from 'react';
import { Clock, MapPin, Plus, Pencil, Info, Box } from 'lucide-react';
import { CarrierOption, Currency, DeliveryType, PickUpPoint } from '../types';
import { CarrierBadge } from './CarrierBadge';
import { formatPrice } from '../data/mockData';

interface CarrierDetailsCardProps {
  deliveryType: DeliveryType;
  carrier: CarrierOption | undefined;
  selectedPickupPoint: PickUpPoint | null;
  currency: Currency;
  onOpenModal: () => void;
}

export const CarrierDetailsCard: React.FC<CarrierDetailsCardProps> = ({
  deliveryType,
  carrier,
  selectedPickupPoint,
  currency,
  onOpenModal,
}) => {
  return (
    <section className="space-y-2">
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs hover:border-gray-300 transition-all cursor-pointer group">
        <button
          type="button"
          onClick={onOpenModal}
          className="w-full text-left cursor-pointer"
        >
          {deliveryType === 'pickup' ? (
            !selectedPickupPoint ? (
              /* Empty Pick-up State */
              <div className="flex items-center justify-between">
                <span className="text-base font-normal text-gray-900">
                  Choose a pick-up point
                </span>
                <Plus className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
              </div>
            ) : (
              /* Selected Pick-up Point Display matching Screenshot */
              <div>
                {/* Carrier Header: Icon, Name & Edit Pencil */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CarrierBadge
                      type={selectedPickupPoint.logoType}
                      size="sm"
                      className="w-5 h-5 rounded-[4px]"
                    />
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedPickupPoint.carrierName}
                      {selectedPickupPoint.badgeDiscount && (
                        <span className="text-sm font-normal text-purple-700 ml-1.5">
                          ({selectedPickupPoint.badgeDiscount})
                        </span>
                      )}
                    </p>
                  </div>
                  <Pencil className="w-4 h-4 text-gray-500 group-hover:text-gray-900" />
                </div>

                {/* Price directly below carrier name with strikethrough & info icon */}
                <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <span>{formatPrice(selectedPickupPoint.price, currency)}</span>
                  {selectedPickupPoint.originalPrice !== undefined &&
                    selectedPickupPoint.originalPrice > selectedPickupPoint.price && (
                      <span className="line-through text-gray-400 text-xs font-normal">
                        {formatPrice(selectedPickupPoint.originalPrice, currency)}
                      </span>
                    )}
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                </div>

                {/* Location code, address, and delivery timeframe */}
                <div className="mt-2.5 space-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Box className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      {selectedPickupPoint.pointCode || 'Paczkomat KRA02H'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{selectedPickupPoint.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{selectedPickupPoint.estimatedDelivery}</span>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* Home Delivery Option */
            carrier ? (
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CarrierBadge type={carrier.logoType} size="sm" className="w-5 h-5 rounded-[4px]" />
                    <p className="text-sm font-semibold text-gray-900">{carrier.name}</p>
                  </div>
                  <Pencil className="w-4 h-4 text-gray-500 group-hover:text-gray-900" />
                </div>

                <div className="mt-2 text-sm font-semibold text-gray-900">
                  {formatPrice(carrier.price, currency)}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>Home delivery, {carrier.estimatedDays}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-base font-normal text-gray-900">
                  Choose home delivery carrier
                </span>
                <Plus className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
              </div>
            )
          )}
        </button>
      </div>
    </section>
  );
};
