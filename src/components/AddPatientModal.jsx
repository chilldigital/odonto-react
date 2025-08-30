import React, { useState, useRef, useEffect } from 'react';

/**
 * Modal para crear un paciente.
 *
 * Objetivo Paso 1:
 *  - Enviar los datos al padre mediante `onCreate(patientData)` (el padre hace el POST a n8n)
 *  - Al resolver, notificar con `onCreated(createdPatient)` usando la respuesta del servidor
 *  - Asegurar fecha de creación y timestamp local como fallback para que el dashboard pinte al instante
 *  - Prevenir envíos duplicados con un flag ref
 *  - Añadir console.log para verificar el flujo
 */
export default function AddPatientModal({ open, isOpen, onClose, onCreate, onCreated }) {
  const openFlag = open ?? isOpen;
  const submittingRef = useRef(false);

  const [form, setForm] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    email: '',
    obraSocial: '',
    numeroAfiliado: '',
    fechaNacimiento: '',
    alergias: 'Ninguna',
    notas: '',
    historiaClinicaFile: null,
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      submittingRef.current = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, historiaClinicaFile: file }));
  };

  const resetForm = () => {
    setForm({
      nombre: '',
      dni: '',
      telefono: '',
      email: '',
      obraSocial: '',
      numeroAfiliado: '',
      fechaNacimiento: '',
      alergias: 'Ninguna',
      notas: '',
      historiaClinicaFile: null,
    });
  };

  const todayISO = () => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`; // yyyy-mm-dd
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // *** PREVENCIÓN DE DUPLICADOS ***
    if (submitting || submittingRef.current) {
      console.log('🚫 Envío bloqueado - ya se está procesando');
      return;
    }

    setSubmitting(true);
    submittingRef.current = true;
    console.log('🚀 [AddPatientModal] Iniciando creación de paciente...');

    try {
      // *** PREPARAR DATOS PARA EL PADRE ***
      const fallbackId = crypto?.randomUUID?.() || String(Date.now());
      const fallbackFecha = todayISO();

      const baseData = {
        id: fallbackId,
        nombre: form.nombre || '',
        dni: form.dni || '',
        telefono: form.telefono || '',
        email: form.email || '',
        obraSocial: form.obraSocial || '',
        numeroAfiliado: form.numeroAfiliado || '',
        fechaNacimiento: form.fechaNacimiento || '',
        alergias: form.alergias || 'Ninguna',
        notas: form.notas || '',
        historiaClinica: '',
        ultimaVisita: '',
        // Fallbacks para pintado inmediato en Dashboard
        fechaCreacion: fallbackFecha,
        _createdAt: Date.now(),
        // Info del archivo (si existe)
        hasFile: !!form.historiaClinicaFile,
        fileName: form.historiaClinicaFile?.name,
        fileType: form.historiaClinicaFile?.type,
        fileSize: form.historiaClinicaFile?.size,
      };

      if (form.historiaClinicaFile) {
        baseData.historiaClinicaFile = form.historiaClinicaFile;
        console.log('📁 [AddPatientModal] Paciente con archivo:', form.historiaClinicaFile.name);
      } else {
        console.log('📄 [AddPatientModal] Paciente sin archivo');
      }

      if (typeof onCreate !== 'function') {
        throw new Error('onCreate no está definido');
      }

      console.log('📤 [AddPatientModal] Enviando datos al padre via onCreate...', baseData);

      // **Importante**: cerramos el modal rápido para mejor UX
      onClose?.();

      // El padre hace el POST y devuelve el paciente creado (ideal)
      const createdRes = await onCreate(baseData);
      console.log('✅ [AddPatientModal] onCreate resuelto:', createdRes);

      // Normalizamos la respuesta para asegurar fechaCreacion / _createdAt e id
      const fromServer = (Array.isArray(createdRes) ? createdRes[0]?.patient : createdRes?.patient) || createdRes || {};
      const createdPatient = {
        ...baseData,
        ...fromServer,
        id: fromServer?.id || baseData.id,
        fechaCreacion: fromServer?.fechaCreacion || baseData.fechaCreacion || todayISO(),
        _createdAt: typeof fromServer?._createdAt === 'number' ? fromServer._createdAt : baseData._createdAt,
      };

      if (typeof onCreated === 'function') {
        console.log('📣 [AddPatientModal] Notificando onCreated con:', createdPatient);
        onCreated(createdPatient);
      }

      resetForm();
    } catch (err) {
      console.error('❌ [AddPatientModal] Error al crear paciente:', err);
      alert(`Error: ${err.message || 'No se pudo crear el paciente'}`);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      console.log('🔄 [AddPatientModal] Estado de envío reseteado');
    }
  };

  if (!openFlag) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
      />

      {/* Contenedor */}
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
        <div className="mt-8 w-full max-w-xl rounded-xl bg-white shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Agregar Paciente</h3>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre *
              </label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                type="text"
                placeholder="Ej: Juan Pérez"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* DNI */}
            <div>
              <label className="block text-sm font-medium text-gray-700">DNI</label>
              <input
                name="dni"
                value={form.dni}
                onChange={handleChange}
                type="text"
                placeholder="Ej: 12345678"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                type="tel"
                placeholder="Ej: +54 11 5555-5555"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="Ej: paciente@mail.com"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Obra Social */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Obra Social</label>
              <input
                name="obraSocial"
                value={form.obraSocial}
                onChange={handleChange}
                type="text"
                placeholder="Ej: OSDE / Swiss Medical / ..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Número de Afiliado */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Número de Afiliado</label>
              <input
                name="numeroAfiliado"
                value={form.numeroAfiliado}
                onChange={handleChange}
                type="text"
                placeholder="Ej: 1234-5678-90"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Fecha de Nacimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
              <input
                name="fechaNacimiento"
                value={form.fechaNacimiento}
                onChange={handleChange}
                type="date"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Alergias */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Alergias</label>
              <input
                name="alergias"
                value={form.alergias}
                onChange={handleChange}
                type="text"
                placeholder="Ej: Ninguna / Penicilina, Polen..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Notas</label>
              <textarea
                name="notas"
                value={form.notas}
                onChange={handleChange}
                rows={3}
                placeholder="Observaciones relevantes, alergias, antecedentes, etc."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Historia Clínica (archivo) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Historia Clínica (imagen o PDF)
              </label>
              <input
                name="historiaClinicaFile"
                onChange={handleFileChange}
                type="file"
                accept="image/*,application/pdf"
                className="mt-1 w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-white hover:file:bg-emerald-700"
              />
              {form.historiaClinicaFile && (
                <p className="mt-1 text-xs text-gray-500">
                  Archivo seleccionado: {form.historiaClinicaFile.name}
                </p>
              )}
            </div>

            {/* Botones */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !form.nombre.trim()}
                className={`rounded-md px-4 py-2 font-medium text-white transition-colors ${
                  submitting || !form.nombre.trim()
                    ? 'bg-emerald-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando...
                  </span>
                ) : (
                  'Crear Paciente'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}