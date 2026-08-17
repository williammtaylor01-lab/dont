import React from 'react';
import { Plus, Pencil } from 'lucide-react';

interface ContactDetailsSectionProps {
  phoneNumber: string;
  onOpenModal: () => void;
  isRequired?: boolean;
}

export const ContactDetailsSection: React.FC<ContactDetailsSectionProps> = ({
  phoneNumber,
  onOpenModal,
}) => {
  const isMissing = !phoneNumber.trim();

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-base font-semibold text-gray-900 tracking-tight">
          Your contact details
        </h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden hover:border-gray-300 transition-all cursor-pointer">
        <button
          type="button"
          onClick={onOpenModal}
          className="w-full text-left p-4 cursor-pointer group"
        >
          {isMissing ? (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-gray-900">
                  Add a phone number
                </span>
                <Plus className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
              </div>
              <p className="text-xs text-[#C93B4E] mt-1 font-normal">
                Your phone number is required for this shipping option
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-normal text-gray-900">
                {phoneNumber}
              </span>
              <Pencil className="w-4 h-4 text-gray-500 group-hover:text-gray-900" />
            </div>
          )}
        </button>
      </div>
    </section>
  );
};
