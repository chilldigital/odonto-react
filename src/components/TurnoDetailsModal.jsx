import React, { useState } from 'react';
import { X, Calendar, Clock, User, Phone, CreditCard, MapPin, FileText, Edit, Trash2 } from 'lucide-react';

export default function TurnoDetailsModal({ open, turno, onClose, onEdit, onDelete }) {
  if (!open || !turno) return null;

  const [showConfirm, setShowConfirm] = useState(false);

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return { date: 'Sin fecha', time: 'Sin hora' };
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return { date: 'Fecha inválida', time: 'Hora inválida' };
    const dateFormatted = date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    });
    const timeFormatted = date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { date: dateFormatted, time: timeFormatted };
  };

  const getDuration = () => {
    if (!turno.start || !turno.end) return null;
    const start = new Date(turno.start);
    const end = new Date(turno.end);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `${diffMinutes} min`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  };

  const { date, time } = formatDateTime(turno.start || turno.startTime);
  const duration = getDuration();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4 overflow-hidden">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-[1] bg-gray-50 p-6 text-black relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="pr-12">
              <h2 className="text-2xl font-bold mb-2">Detalles del Turno</h2>
              {/* Info en una sola línea */}
              <div className="flex items-center gap-6 text-black whitespace-nowrap min-w-0 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar size={14} />
                  <span className="capitalize truncate">{date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>{time} hs</span>
                </div>
                {duration && (
                  <div className="flex items-center gap-2">
                    <span>({duration})</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Información Principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Paciente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Información del Paciente</h3>

                <div className="flex items-start gap-3">
                  <User className="text-gray-400 mt-1" size={16} />
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {turno.patientName || turno.paciente || 'Sin nombre'}
                    </p>
                    <p className="text-sm text-gray-500">Paciente</p>
                  </div>
                </div>

                {turno.patientPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="text-gray-400 mt-1" size={16} />
                    <div>
                      <p className="font-medium text-gray-900">{turno.patientPhone}</p>
                      <p className="text-sm text-gray-500">Teléfono</p>
                    </div>
                  </div>
                )}

                {turno.patientDni && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="text-gray-400 mt-1" size={16} />
                    <div>
                      <p className="font-medium text-gray-900">{turno.patientDni}</p>
                      <p className="text-sm text-gray-500">DNI</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Turno */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Información del Turno</h3>

                <div className="flex items-start gap-3">
                  <Calendar className="text-gray-400 mt-1" size={16} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {turno.title || turno.summary || turno.tipoTurnoNombre || 'Consulta'}
                    </p>
                    <p className="text-sm text-gray-500">Tipo de consulta</p>
                  </div>
                </div>

                {turno.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="text-gray-400 mt-1" size={16} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{turno.location}</p>
                      <p className="text-sm text-gray-500">Ubicación</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div
                    className={`w-2.5 h-2.5 mt-2 rounded-full ${
                      turno.status === 'confirmed' ? 'bg-teal-600' : 'bg-yellow-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {turno.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                    </p>
                    <p className="text-sm text-gray-500">Estado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Descripción/Notas */}
            {turno.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Notas</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="text-gray-400 mt-1" size={16} />
                    <p className="text-sm text-gray-700 leading-relaxed">{turno.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Información Médica */}
            {(turno.alergias || turno.antecedentes || turno.obraSocial) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Información Médica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {turno.alergias && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="font-medium text-red-900 text-sm">Alergias</p>
                      <p className="text-red-700">{turno.alergias}</p>
                    </div>
                  )}
                  {turno.antecedentes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="font-medium text-yellow-900 text-sm">Antecedentes</p>
                      <p className="text-yellow-700">{turno.antecedentes}</p>
                    </div>
                  )}
                  {turno.obraSocial && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:col-span-2">
                      <p className="font-medium text-blue-900 text-sm">Obra Social</p>
                      <p className="text-blue-700">
                        {turno.obraSocial}
                        {turno.numeroAfiliado && ` - N° ${turno.numeroAfiliado}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              <button
                onClick={() => setShowConfirm(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                Cancelar
              </button>
              <button
                onClick={() => onEdit && onEdit(turno)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Edit size={16} />
                Editar Turno
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancelar turno</h3>
            <p className="text-sm text-gray-600 mb-6">¿Confirmás la cancelación de este turno? Esta acción no se puede deshacer.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Volver
              </button>
              <button
                onClick={() => { setShowConfirm(false); onDelete && onDelete(turno); }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Cancelar turno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
