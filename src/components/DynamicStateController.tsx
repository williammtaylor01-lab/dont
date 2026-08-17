import React, { useState } from 'react';
import { Sliders, X, RefreshCw, Check } from 'lucide-react';
import { Currency, ProductItem } from '../types';

interface DynamicStateControllerProps {
  product: ProductItem;
  onUpdateProduct: (updated: ProductItem) => void;
  currency: Currency;
  onUpdateCurrency: (curr: Currency) => void;
  onResetToDefaults: () => void;
}

export const DynamicStateController: React.FC<DynamicStateControllerProps> = ({
  product,
  onUpdateProduct,
  currency,
  onUpdateCurrency,
  onResetToDefaults,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState(product.title);
  const [tempBrand, setTempBrand] = useState(product.brand);
  const [tempSize, setTempSize] = useState(product.size);
  const [tempPrice, setTempPrice] = useState(product.price.toString());
  const [tempImage, setTempImage] = useState(product.imageUrl);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProduct({
      ...product,
      title: tempTitle,
      brand: tempBrand,
      size: tempSize,
      price: Math.max(0.01, parseFloat(tempPrice) || product.price),
      imageUrl: tempImage,
    });
    setIsOpen(false);
  };

  const currencies: Currency[] = [
    { code: 'EUR', symbol: '€' },
    { code: 'PLN', symbol: 'PLN' },
    { code: 'GBP', symbol: '£' },
    { code: 'USD', symbol: '$' },
  ];

  return (
    <>
      {/* Floating trigger button to inspect/modify dynamic state */}
      <div className="fixed top-3 right-3 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-xs font-semibold text-gray-700 shadow-md border border-gray-200 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Dynamic DB & Props Controller"
        >
          <Sliders className="w-3.5 h-3.5 text-[#007782]" />
          <span>Dynamic DB State</span>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-[#007782]" />
              <h3 className="text-base font-bold text-gray-900">
                Dynamic Props & DB Object Tester
              </h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Modify product data or currency dynamically to test reactive pricing and line-item recalculation.
            </p>

            <form onSubmit={handleApply} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Active Currency
                </label>
                <div className="flex gap-2">
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => onUpdateCurrency(c)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        currency.code === c.code
                          ? 'border-[#007782] bg-teal-50 text-[#007782]'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {c.code} ({c.symbol})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Item Title
                </label>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#007782] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={tempBrand}
                    onChange={(e) => setTempBrand(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#007782] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Size / Specs
                  </label>
                  <input
                    type="text"
                    value={tempSize}
                    onChange={(e) => setTempSize(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#007782] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Unit Price ({currency.symbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#007782] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Image URL (or placeholder)
                </label>
                <input
                  type="url"
                  value={tempImage}
                  onChange={(e) => setTempImage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#007782] outline-hidden"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetToDefaults();
                    setIsOpen(false);
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#007782] hover:bg-[#006069] text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
                >
                  Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
