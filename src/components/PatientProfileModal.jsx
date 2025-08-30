import React, { useEffect, useState } from 'react';
import ModalShell from './ModalShell';
import { Phone, Mail, Hash, FileText, Trash2, Calendar, AlertTriangle, User } from 'lucide-react';
import { initials } from '../utils/helpers';

export default function PatientProfileModal({ open, patient, onClose, onEdit, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Limpiar estados cuando se cierra el modal
    if (!open) {
      setShowConfirm(false);
      setDeleting(false);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showConfirm) {
          setShowConfirm(false);
          setDeleting(false);
        } else {
          onClose();
        }
      }
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, showConfirm]);

  if (!open || !patient) return null;

  // Helper para obtener campos con múltiples posibles nombres
  const getField = (p, fieldNames) => {
    if (!p) return undefined;
    for (const fieldName of fieldNames) {
      const value = p[fieldName] ?? p.fields?.[fieldName];
      if (value != null && value !== '') return String(value);
    }
    return undefined;
  };

  const affiliateNumber = getField(patient, ['numeroAfiliado', 'Numero Afiliado', 'Número Afiliado']) ?? '-';
  const dni = getField(patient, ['dni', 'DNI', 'Dni']) ?? '-';
  const fechaNacimiento = getField(patient, ['fechaNacimiento', 'fecha_nacimiento', 'birthDate']) ?? '-';
  const alergias = getField(patient, ['alergias', 'Alergias', 'allergies']) ?? 'Ninguna';

  // Formatear fecha si existe
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === '-') return '-';
    try {
      const date = new Date(dateStr);
      if (!isNaN(date)) {
        return date.toLocaleDateString('es-AR', { 
          year: 'numeric', 
          month: 'numeric', 
          day: 'numeric' 
        });
      }
    } catch (e) {}
    return dateStr;
  };

  function handleDeleteClick() {
    // open local confirm modal
    setShowConfirm(true);
  }

  async function confirmDelete() {
    if (!onDelete || !patient || deleting) return;
    
    try {
      setDeleting(true);
      const id =
        patient?.id ||
        patient?.recordId ||
        patient?.airtableId ||
        patient?.Id ||
        patient?.ID ||
        patient?.fields?.id;
      
      // Llamar a onDelete y esperar resultado
      await onDelete(patient);
      
      // Limpiar estados y cerrar modal
      setShowConfirm(false);
      setDeleting(false);
      onClose?.();
    } catch (e) {
      console.error('Error eliminando paciente:', e);
      // Mantener el modal abierto pero detener el spinner
      setDeleting(false);
      // Mostrar error al usuario
      alert(`Error al eliminar: ${e.message || 'Intente nuevamente'}`);
    }
  }

  return (
    <ModalShell
      title="Paciente"
      onClose={onClose}
      footer={(
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
      )}
    >
      <div className="my-6 md:my-10">
        <div className="flex flex-col">
          <div className="flex flex-col items-center mb-5 shrink-0">
            <div className="w-28 h-28 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center text-gray-600 text-2xl font-semibold">
              {initials(patient.nombre)}
            </div>
            <div className="mt-4 text-center">
              <div className="text-xl font-semibold text-gray-900">{patient.nombre}</div>
              <div className="text-sm text-gray-500">{patient.obraSocial || 'Paciente'}</div>
            </div>
          </div>
          <hr className="my-4 shrink-0" />
          <div className="space-y-4 pr-1" style={{ scrollbarGutter: 'stable' }}>
            <div className="flex items-start">
              <User className="mt-1 mr-3 text-gray-400" size={18} />
              <div>
                <div className="text-sm text-gray-500">DNI</div>
                <div className="text-sm text-gray-900">{dni}</div>
              </div>
            </div>
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
                <div className="text-sm text-gray-900">{affiliateNumber}</div>
              </div>
            </div>
            <div className="flex items-start">
              <Calendar className="mt-1 mr-3 text-gray-400" size={18} />
              <div>
                <div className="text-sm text-gray-500">Fecha de Nacimiento</div>
                <div className="text-sm text-gray-900">{formatDate(fechaNacimiento)}</div>
              </div>
            </div>
            <div className="flex items-start">
              <AlertTriangle className="mt-1 mr-3 text-gray-400" size={18} />
              <div>
                <div className="text-sm text-gray-500">Alergias</div>
                <div className="text-sm text-gray-900">{alergias}</div>
              </div>
            </div>
            <div className="flex items-start">
              <FileText className="mt-1 mr-3 text-gray-400" size={18} />
              <div>
                <div className="text-sm text-gray-500">Notas</div>
                <div className="text-sm text-gray-900 whitespace-pre-wrap">{patient.notas || patient.notes || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
                onClick={() => {
                  setShowConfirm(false);
                  setDeleting(false);
                }}
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
      </div>
    </ModalShell>
  );
}