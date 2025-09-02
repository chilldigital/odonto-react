import React from 'react';
import { X, Calendar, Clock, User, Phone, CreditCard, MapPin, FileText, Edit, Trash2, ExternalLink } from 'lucide-react';

export default function TurnoDetailsModal({ open, turno, onClose, onEdit, onDelete }) {
  if (!open || !turno) return null;

  // Formatear fecha y hora
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return { date: 'Sin fecha', time: 'Sin hora' };
    
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return { date: 'Fecha inválida', time: 'Hora inválida' };
    
    const dateFormatted = date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    });
    
    const timeFormatted = date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return { date: dateFormatted, time: timeFormatted };
  };

  // Calcular duración si hay hora de fin
  const getDuration = () => {
    if (!turno.start || !turno.end) return null;
    
    const start = new Date(turno.start);
    const end = new Date(turno.end);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
  };

  const { date, time } = formatDateTime(turno.start || turno.startTime);
  const duration = getDuration();

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
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="pr-12">
              <h2 className="text-2xl font-bold mb-2">Detalles del Turno</h2>
              <div className="flex items-center gap-2 text-teal-100">
                <Calendar size={16} />
                <span className="capitalize">{date}</span>
                <span className="mx-2">•</span>
                <Clock size={16} />
                <span>{time} hs</span>
                {duration && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{duration}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Información Principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Paciente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Información del Paciente</h3>
                
                <div className="flex items-center gap-3">
                  <User className="text-gray-400" size={18} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {turno.patientName || turno.paciente || 'Sin nombre'}
                    </p>
                    <p className="text-sm text-gray-500">Paciente</p>
                  </div>
                </div>

                {turno.patientPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="text-gray-400" size={18} />
                    <div>
                      <p className="font-medium text-gray-900">{turno.patientPhone}</p>
                      <p className="text-sm text-gray-500">Teléfono</p>
                    </div>
                  </div>
                )}

                {turno.patientDni && (
                  <div className="flex items-center gap-3">
                    <CreditCard className="text-gray-400" size={18} />
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
                
                <div className="flex items-center gap-3">
                  <Calendar className="text-gray-400" size={18} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {turno.title || turno.summary || turno.tipoTurnoNombre || 'Consulta'}
                    </p>
                    <p className="text-sm text-gray-500">Tipo de consulta</p>
                  </div>
                </div>

                {turno.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="text-gray-400" size={18} />
                    <div>
                      <p className="font-medium text-gray-900">{turno.location}</p>
                      <p className="text-sm text-gray-500">Ubicación</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${turno.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="font-medium text-gray-900">
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
                    <FileText className="text-gray-400 mt-1" size={18} />
                    <p className="text-gray-700 leading-relaxed">{turno.description}</p>
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
                onClick={() => onEdit && onEdit(turno)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Edit size={16} />
                Editar Turno
              </button>
              
              {turno.htmlLink && turno.htmlLink !== '#' && (
                <a
                  href={turno.htmlLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <ExternalLink size={16} />
                  Ver en Calendar
                </a>
              )}
              
              <button
                onClick={() => onDelete && onDelete(turno)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}