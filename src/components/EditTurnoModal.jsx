import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Clock, User, CreditCard, Phone, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { N8N_ENDPOINTS } from '../config/n8n';
import { APPOINTMENT_TYPES, WORK_DAYS } from '../config/appointments';
import { combineDateTimeToISO } from '../utils/appointments';

export default function EditTurnoModal({ open, turno, onClose, onSaved, onDeleted }) {
  const [formData, setFormData] = useState({
    id: '',
    dni: '',
    nombre: '',
    telefono: '',
    obraSocial: '',
    numeroAfiliado: '',
    alergias: '',
    antecedentes: '',
    tipoTurno: '',
    fecha: '',
    hora: '',
    notas: ''
  });

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checkingPatient, setCheckingPatient] = useState(false);
  const [patientFound, setPatientFound] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [error, setError] = useState('');

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (open && turno) {
      const startDate = turno.start || turno.startTime;
      let fecha = '', hora = '';
      if (startDate) {
        const d = new Date(startDate);
        if (!isNaN(d.getTime())) {
          fecha = d.toISOString().split('T')[0];
          hora = d.toTimeString().slice(0, 5);
        }
      }

      const tipoTurno = (APPOINTMENT_TYPES.find(type =>
        (turno.title || '').toLowerCase().includes(type.name.toLowerCase()) ||
        (turno.summary || '').toLowerCase().includes(type.name.toLowerCase()) ||
        (turno.tipoTurnoNombre || '').toLowerCase().includes(type.name.toLowerCase())
      ) || {}).id || '';

      setFormData({
        id: turno.id || '',
        dni: turno.patientDni || turno.dni || '',
        nombre: turno.patientName || turno.paciente || '',
        telefono: turno.patientPhone || turno.telefono || '',
        obraSocial: turno.obraSocial || '',
        numeroAfiliado: turno.numeroAfiliado || '',
        alergias: turno.alergias || '',
        antecedentes: turno.antecedentes || '',
        tipoTurno,
        fecha,
        hora,
        notas: turno.description || turno.notas || ''
      });

      setPatientFound(!!turno.patientDni);
      setError('');
    }
  }, [open, turno]);

  // Consultar paciente por DNI
  const checkPatient = async (dni) => {
    if (!dni || dni.length < 8) {
      setPatientFound(false);
      return;
    }
    setCheckingPatient(true);
    setError('');
    try {
      const response = await fetch(`${N8N_ENDPOINTS.CHECK_PATIENT}?dni=${dni}`);
      if (!response.ok) throw new Error('Error al consultar paciente');
      const data = await response.json();
      if (data.found && data.patient) {
        setFormData(prev => ({
          ...prev,
          nombre: data.patient.nombre || data.patient.name || prev.nombre,
          telefono: data.patient.telefono || data.patient.phone || prev.telefono,
          obraSocial: data.patient.obraSocial || data.patient.insurance || prev.obraSocial,
          numeroAfiliado: data.patient.numeroAfiliado || data.patient.affiliateNumber || prev.numeroAfiliado,
          alergias: data.patient.alergias || data.patient.allergies || prev.alergias || 'Ninguna',
          antecedentes: data.patient.antecedentes || data.patient.background || prev.antecedentes || 'Ninguno',
        }));
        setPatientFound(true);
      } else {
        setPatientFound(false);
      }
    } catch (err) {
      console.error('Error checking patient:', err);
      setError('Error al verificar el paciente. Intenta nuevamente.');
      setPatientFound(false);
    } finally {
      setCheckingPatient(false);
    }
  };

  // Obtener horarios disponibles
  const getAvailableSlots = async (fecha, tipoTurno) => {
    if (!fecha || !tipoTurno) return;
    setLoadingAvailability(true);
    try {
      const appointmentType = APPOINTMENT_TYPES.find(t => t.id === tipoTurno);
      const response = await fetch(`${N8N_ENDPOINTS.GET_AVAILABILITY}?fecha=${fecha}&duration=${appointmentType?.duration || 30}&excludeId=${formData.id}`);
      const data = await response.json();
      setAvailableSlots([...(data.availableSlots || []), formData.hora].filter(Boolean));
    } catch (err) {
      console.error('Error getting availability:', err);
      setAvailableSlots([formData.hora].filter(Boolean));
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Fechas disponibles (próximas 2 semanas; incluir seleccionada)
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isWorkDay = WORK_DAYS.includes(d.getDay());
      const value = d.toISOString().split('T')[0];
      if (isWorkDay || value === formData.fecha) {
        dates.push({
          value,
          label: d.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' }),
        });
      }
    }
    return dates;
  }, [formData.fecha]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'dni') checkPatient(value);
    if (field === 'fecha' || field === 'tipoTurno') {
      const newData = { ...formData, [field]: value };
      if (newData.fecha && newData.tipoTurno) getAvailableSlots(newData.fecha, newData.tipoTurno);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const appointmentType = APPOINTMENT_TYPES.find(t => t.id === formData.tipoTurno);
      const appointmentISO = combineDateTimeToISO(formData.fecha, formData.hora, 'America/Argentina/Buenos_Aires');
      const response = await fetch(N8N_ENDPOINTS.UPDATE_APPOINTMENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          dni: formData.dni,
          nombre: formData.nombre,
          telefono: formData.telefono,
          obraSocial: formData.obraSocial,
          numeroAfiliado: formData.numeroAfiliado,
          alergias: formData.alergias || 'Ninguna',
          antecedentes: formData.antecedentes || 'Ninguno',
          tipoTurno: formData.tipoTurno,
          tipoTurnoNombre: appointmentType?.name || 'Consulta',
          duracion: appointmentType?.duration || 30,
          fechaHora: appointmentISO,
          timezone: 'America/Argentina/Buenos_Aires',
          notas: formData.notas,
          isNewPatient: !patientFound,
          updatedAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar el turno');
      }
      const result = await response.json().catch(() => ({}));
      if (onSaved) onSaved(result.appointment || formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar el turno. Intenta nuevamente.');
      console.error('Error updating appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar este turno? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    setError('');
    try {
      const response = await fetch(N8N_ENDPOINTS.DELETE_APPOINTMENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          reason: 'Cancelado por el odontólogo',
          canceledAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cancelar el turno');
      }
      if (onDeleted) onDeleted(turno);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al cancelar el turno. Intenta nuevamente.');
      console.error('Error deleting appointment:', err);
    } finally {
      setDeleting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.dni && formData.nombre && formData.telefono &&
      formData.tipoTurno && formData.fecha && formData.hora
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-[1] bg-teal-600 p-6 text-white relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors">
              <X size={20} />
            </button>
            <div className="pr-12">
              <h2 className="text-2xl font-bold mb-2">Editar Turno</h2>
              <p className="text-white-100">Modificá los detalles del turno existente</p>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              {/* DNI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="inline w-4 h-4 mr-1" /> DNI
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => handleInputChange('dni', e.target.value)}
                    placeholder="12.345.678"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                  {checkingPatient && (
                    <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                  )}
                </div>
                {patientFound && (
                  <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                    <CheckCircle size={16} /> Paciente encontrado - datos actualizados automáticamente
                  </p>
                )}
              </div>

              {/* Datos personales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline w-4 h-4 mr-1" /> Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline w-4 h-4 mr-1" /> Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    placeholder="+54 381 123 4567"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Obra Social */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Obra Social</label>
                  <input
                    type="text"
                    value={formData.obraSocial}
                    onChange={(e) => handleInputChange('obraSocial', e.target.value)}
                    placeholder="OSDE, Swiss Medical, etc."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número de Afiliado</label>
                  <input
                    type="text"
                    value={formData.numeroAfiliado}
                    onChange={(e) => handleInputChange('numeroAfiliado', e.target.value)}
                    placeholder="123456789"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Información médica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alergias</label>
                  <input
                    type="text"
                    value={formData.alergias}
                    onChange={(e) => handleInputChange('alergias', e.target.value)}
                    placeholder="Ninguna, Penicilina, etc."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Antecedentes</label>
                  <input
                    type="text"
                    value={formData.antecedentes}
                    onChange={(e) => handleInputChange('antecedentes', e.target.value)}
                    placeholder="Diabetes, Hipertensión, etc."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Tipo de turno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline w-4 h-4 mr-1" /> Tipo de Turno
                </label>
                <select
                  value={formData.tipoTurno}
                  onChange={(e) => handleInputChange('tipoTurno', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecciona el tipo de consulta</option>
                  {APPOINTMENT_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.duration} min)
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" /> Fecha
                </label>
                <select
                  value={formData.fecha}
                  onChange={(e) => handleInputChange('fecha', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecciona una fecha</option>
                  {availableDates.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              {/* Horario */}
              {formData.fecha && formData.tipoTurno && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" /> Horario
                  </label>
                  {loadingAvailability ? (
                    <div className="flex items-center gap-2 p-3 text-gray-600">
                      <Loader className="w-5 h-5 animate-spin" /> Cargando horarios disponibles...
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleInputChange('hora', slot)}
                          className={`p-3 text-sm rounded-lg border transition-colors ${
                            formData.hora === slot
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-amber-500'
                          }`}
                        >
                          {slot} hs
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notas adicionales</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => handleInputChange('notas', e.target.value)}
                  rows={3}
                  placeholder="Información adicional sobre el turno..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  Cancelar Turno
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid() || loading || deleting}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

