import React from 'react';
import { Package } from 'lucide-react';
import { ProductItem } from '../types';

interface OrderSummaryCardProps {
  product: ProductItem;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  product,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-2xs border border-gray-200 overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Pure, uncluttered image presentation */}
      <div className="w-36 h-48 sm:w-44 sm:h-56 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center shadow-xs border border-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <Package className="w-8 h-8 stroke-1" />
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>
    </div>
  );
};


