import React from 'react';
import { X } from 'lucide-react';
import BookingForm from './BookingForm';

export default function BookingModal({ open, onClose, onSuccess }) {
  if (!open) return null;

  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
          
          {/* BookingForm content */}
          <div className="w-full">
            <BookingForm onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
}
