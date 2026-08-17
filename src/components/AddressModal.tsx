import React, { useState } from 'react';
import { X, Plus, MapPin, Check, Trash2 } from 'lucide-react';
import { Address } from '../types';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: Address[];
  selectedAddressId: string | null;
  onSelectAddress: (id: string) => void;
  onAddAddress: (newAddr: Address) => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddAddress,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    line1: '',
    line2: '',
    city: '',
    postalCode: '',
    country: 'France',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.line1.trim()) newErrors.line1 = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const newAddress: Address = {
      id: `addr_${Date.now()}`,
      fullName: formData.fullName,
      line1: formData.line1,
      line2: formData.line2 || undefined,
      city: formData.city,
      postalCode: formData.postalCode,
      country: formData.country,
      phoneNumber: formData.phoneNumber || undefined,
      isDefault: addresses.length === 0,
    };

    onAddAddress(newAddress);
    setIsAddingNew(false);
    setFormData({
      fullName: '',
      line1: '',
      line2: '',
      city: '',
      postalCode: '',
      country: 'France',
      phoneNumber: '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl relative border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            {isAddingNew ? 'Add shipping address' : 'Select shipping address'}
          </h2>
          <button
            onClick={() => {
              setIsAddingNew(false);
              onClose();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {!isAddingNew ? (
            <>
              {addresses.map((addr) => {
                const isSelected = addr.id === selectedAddressId;
                return (
                  <div
                    key={addr.id}
                    onClick={() => {
                      onSelectAddress(addr.id);
                      onClose();
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-[#007782] bg-teal-50/40'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-[#007782] text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{addr.fullName}</p>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 font-medium px-1.5 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-0.5">
                          {addr.line1} {addr.line2 ? `, ${addr.line2}` : ''}
                        </p>
                        <p className="text-gray-600">
                          {addr.postalCode} {addr.city}, {addr.country}
                        </p>
                        {addr.phoneNumber && (
                          <p className="text-xs text-gray-400 mt-1">{addr.phoneNumber}</p>
                        )}
                      </div>
                    </div>

                    <div className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1">
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#007782] stroke-[3]" />}
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3 px-4 rounded-xl border border-dashed border-gray-300 hover:border-[#007782] hover:bg-teal-50/30 text-[#007782] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add new address</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleCreateAddress} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-[#007782] focus:ring-2 focus:ring-[#007782]/20 outline-hidden"
                />
                {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Street address *
                </label>
                <input
                  type="text"
                  value={formData.line1}
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                  placeholder="Street name and building number"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-[#007782] focus:ring-2 focus:ring-[#007782]/20 outline-hidden"
                />
                {errors.line1 && <p className="text-xs text-red-600 mt-1">{errors.line1}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Apartment, suite, unit (optional)
                </label>
                <input
                  type="text"
                  value={formData.line2}
                  onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                  placeholder="Apt, suite, floor, etc."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-[#007782] focus:ring-2 focus:ring-[#007782]/20 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="e.g. 75001"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-[#007782] focus:ring-2 focus:ring-[#007782]/20 outline-hidden"
                  />
                  {errors.postalCode && <p className="text-xs text-red-600 mt-1">{errors.postalCode}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Paris"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-[#007782] focus:ring-2 focus:ring-[#007782]/20 outline-hidden"
                  />
                  {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-[#007782] focus:ring-2 focus:ring-[#007782]/20 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone number (optional)
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-[#007782] focus:ring-2 focus:ring-[#007782]/20 outline-hidden"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#007782] hover:bg-[#006069] text-white font-semibold text-sm rounded-lg transition-colors shadow-xs"
                >
                  Save address
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
