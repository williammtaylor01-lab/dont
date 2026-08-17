import React from 'react';
import { Package, Truck, MapPin } from 'lucide-react';

interface CarrierBadgeProps {
  type: 'ups' | 'dpd' | 'mondial' | 'inpost' | 'royal_mail' | 'dhl' | 'standard';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CarrierBadge: React.FC<CarrierBadgeProps> = ({ type, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  switch (type) {
    case 'ups':
      return (
        <div
          className={`flex items-center justify-center rounded bg-[#351C15] text-[#FFB500] font-bold tracking-tighter shrink-0 ${sizeClasses[size]} ${className}`}
          title="UPS"
        >
          <span className="text-[10px] font-black leading-none">UPS</span>
        </div>
      );
    case 'dhl':
      return (
        <div
          className={`flex items-center justify-center rounded bg-[#FFCC00] text-[#D40511] font-black italic tracking-tighter shrink-0 ${sizeClasses[size]} ${className}`}
          title="DHL"
        >
          <span className="text-[9px] font-black leading-none">DHL</span>
        </div>
      );
    case 'dpd':
      return (
        <div
          className={`flex items-center justify-center rounded bg-[#DC0032] text-white font-bold tracking-tight shrink-0 ${sizeClasses[size]} ${className}`}
          title="DPD"
        >
          <span className="text-[9px] font-black leading-none">dpd</span>
        </div>
      );
    case 'mondial':
      return (
        <div
          className={`flex items-center justify-center rounded bg-[#9A1E4B] text-white font-semibold shrink-0 ${sizeClasses[size]} ${className}`}
          title="Mondial Relay"
        >
          <MapPin className="w-4 h-4 text-white" />
        </div>
      );
    case 'inpost':
      return (
        <div
          className={`flex items-center justify-center rounded bg-[#FFCC00] text-black font-bold tracking-tighter shrink-0 ${sizeClasses[size]} ${className}`}
          title="InPost"
        >
          <span className="text-[8px] font-extrabold leading-none">InPost</span>
        </div>
      );
    default:
      return (
        <div
          className={`flex items-center justify-center rounded bg-gray-100 text-gray-700 shrink-0 ${sizeClasses[size]} ${className}`}
        >
          <Truck className="w-4 h-4 text-gray-600" />
        </div>
      );
  }
};
