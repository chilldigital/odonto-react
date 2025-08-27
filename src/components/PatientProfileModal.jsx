import React, { useEffect } from 'react';
import ModalShell from './ModalShell';
import { Phone, Mail, MapPin } from 'lucide-react';
import { initials } from '../utils/helpers';

export default function PatientProfileModal({ open, patient, onClose, onEdit, onDelete }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !patient) return null;

  return (
    <ModalShell title="Paciente" onClose={onClose}>
      <div className="flex flex-col items-center mb-5">
        <div className="w-28 h-28 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center text-gray-600 text-2xl font-semibold">
          {initials(patient.nombre)}
        </div>
        <div className="mt-4 text-center">
          <div className="text-xl font-semibold text-gray-900">{patient.nombre}</div>
          <div className="text-sm text-gray-500">{patient.obraSocial || 'Paciente'}</div>
        </div>
      </div>
      <hr className="my-4" />
      <div className="space-y-4">
        <div className="flex items-start">
          <Phone className="mt-1 mr-3 text-gray-400" size={18} />
          <div>
            <div className="text-sm text-gray-500">Teléfono</div>
            <div className="text-sm text-gray-900">{patient.telefono || '-'}</div>
          </div>
        </div>
        <div className="flex items-start">
          <Mail className="mt-1 mr-3 text-gray-400" size={18} />
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="text-sm text-gray-900">{patient.email || '-'}</div>
          </div>
        </div>
        <div className="flex items-start">
          <MapPin className="mt-1 mr-3 text-gray-400" size={18} />
          <div>
            <div className="text-sm text-gray-500">Dirección</div>
            <div className="text-sm text-gray-900">{patient.direccion || '-'}</div>
          </div>
        </div>
      </div>
      <hr className="my-6" />
      <div className="grid grid-cols-2 gap-3">
        <button
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          onClick={() => onDelete && onDelete(patient)}
        >
          Eliminar
        </button>
        <button
          className="px-4 py-2 rounded-lg bg-gray-200 text-black hover:bg-gray-300 font-semibold"
          onClick={() => onEdit && onEdit(patient)}
        >
          Editar
        </button>
      </div>
    </ModalShell>
  );
}