import React, { useEffect, useState } from 'react';
import ModalShell from './ModalShell';
import { Phone, Mail, Hash, FileText, Trash2 } from 'lucide-react';
import { initials } from '../utils/helpers';

export default function PatientProfileModal({ open, patient, onClose, onEdit, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !patient) return null;

  // Normalize a key: lowercase, remove diacritics, replace underscores/spaces
  const normKey = (k) =>
    k
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s_]+/g, '');

  // Try to find the affiliate number field in patient or patient.fields via fuzzy key matching
  const getAffiliateNumber = (patientObj) => {
    if (!patientObj) return undefined;
    const possibleKeys = [
      'numeroafiliado',
      'numerodeafiliado',
      'nroafiliado',
      'afiliado',
      'affiliateNumber',
    ].map(normKey);
    const sources = [patientObj, patientObj.fields || {}];
    for (const src of sources) {
      for (const [k, v] of Object.entries(src || {})) {
        if (possibleKeys.includes(normKey(k))) {
          return v;
        }
      }
    }
    return undefined;
  };
  const affiliateNumber = getAffiliateNumber(patient) ?? '-';

  function handleDeleteClick() {
    // open local confirm modal
    setShowConfirm(true);
  }

  async function confirmDelete() {
    if (!onDelete || !patient) return setShowConfirm(false);
    try {
      setDeleting(true);
      const id =
        patient?.id ||
        patient?.recordId ||
        patient?.airtableId ||
        patient?.Id ||
        patient?.ID ||
        patient?.fields?.id;
      // call once — avoid loops
      await Promise.resolve(onDelete(id, patient));
      setShowConfirm(false);
      onClose?.();
    } catch (e) {
      // keep the confirm open but stop the spinner
      setDeleting(false);
    }
  }

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
          <Hash className="mt-1 mr-3 text-gray-400" size={18} />
          <div>
            <div className="text-sm text-gray-500">Número de Afiliado</div>
            <div className="text-sm text-gray-900">
              {affiliateNumber}
            </div>
          </div>
        </div>
        <div className="flex items-start">
          <FileText className="mt-1 mr-3 text-gray-400" size={18} />
          <div>
            <div className="text-sm text-gray-500">Notas</div>
            <div className="text-sm text-gray-900 whitespace-pre-wrap">
              {patient.notas || patient.notes || '-'}
            </div>
          </div>
        </div>
      </div>
      <hr className="my-6" />
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          onClick={handleDeleteClick}
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
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => !deleting && setShowConfirm(false)} />
          <div className="relative z-10 w-[92%] max-w-md rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={20} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Confirmar eliminación</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              ¿Estás segura/o de eliminar a <span className="font-medium">{patient?.nombre}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-60"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
              >
                No, cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}