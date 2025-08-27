import React, { useState, useRef, useEffect } from 'react';

import { URL_CREATE_PATIENT } from '../config/n8n';

/**
 * Modal para crear un paciente.
 * Campos: Nombre, Teléfono, Email, Obra Social, Número de Afiliado,
 * Fecha de Nacimiento, Notas y subir Historia Clínica (imagen o PDF).
 */
export default function AddPatientModal({ open, isOpen, onClose, onCreate }) {
  const openFlag = open ?? isOpen; // soporta ambas props

  // Evita envíos duplicados (doble click, StrictMode o re-montajes)
  const creatingRef = useRef(false);
  useEffect(() => {
    return () => {
      creatingRef.current = false;
      if (window) window.__patientCreateLock = false;
    };
  }, []);

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    obraSocial: '',
    numeroAfiliado: '',
    fechaNacimiento: '',
    notas: '',
    historiaClinicaFile: null,
  });

  const [submitting, setSubmitting] = useState(false);

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
      telefono: '',
      email: '',
      obraSocial: '',
      numeroAfiliado: '',
      fechaNacimiento: '',
      notas: '',
      historiaClinicaFile: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || creatingRef.current || (typeof window !== 'undefined' && window.__patientCreateLock)) return;
    setSubmitting(true);
    creatingRef.current = true;
    if (typeof window !== 'undefined') window.__patientCreateLock = true;

    // Construimos el payload a enviar al webhook (JSON)
    const tempId = crypto?.randomUUID?.() || String(Date.now());
    const payload = {
      id: tempId,
      idempotencyKey: tempId,
      nombre: form.nombre || '',
      telefono: form.telefono || '',
      email: form.email || '',
      obraSocial: form.obraSocial || '',
      numeroAfiliado: form.numeroAfiliado || '',
      fechaNacimiento: form.fechaNacimiento || '',
      notas: form.notas || '',
      // campos opcionales para futuros usos
      historiaClinica: '',
      ultimaVisita: '',
    };
    if (form.historiaClinicaFile) {
      payload.hasFile = true;
      payload.historiaClinicaNombre = form.historiaClinicaFile.name;
    }

    try {
      let created = null;

      if (URL_CREATE_PATIENT) {
        const res = await fetch(URL_CREATE_PATIENT, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Idempotency-Key': tempId,
            'Cache-Control': 'no-store',
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(`Webhook create-patient respondió ${res.status}`);
        }
        const data = await res.json();
        created = {
          id: data.id || payload.id,
          nombre: data.nombre ?? payload.nombre,
          obraSocial: data.obraSocial ?? payload.obraSocial,
          telefono: data.telefono ?? payload.telefono,
          email: data.email ?? payload.email,
          numeroAfiliado: data.numeroAfiliado ?? payload.numeroAfiliado,
          fechaNacimiento: data.fechaNacimiento ?? payload.fechaNacimiento,
          notas: data.notas ?? payload.notas,
          historiaClinica: data.historiaClinica ?? '',
          ultimaVisita: data.ultimaVisita ?? '',
        };
      } else {
        created = {
          id: crypto.randomUUID?.() || String(Math.random()),
          nombre: form.nombre,
          obraSocial: form.obraSocial,
          telefono: form.telefono,
          email: form.email,
          numeroAfiliado: form.numeroAfiliado,
          fechaNacimiento: form.fechaNacimiento,
          notas: form.notas,
          historiaClinica: '',
          ultimaVisita: '',
        };
      }

      // Pedimos recargar pacientes desde el backend (sin insertar optimista)
      window.dispatchEvent(new Event('patients:refresh'));

      // Si el padre implementa onCreate, lo invocamos sin payload
      // (la vista debe escuchar `patients:refresh` y rehacer el fetch)
      if (typeof onCreate === 'function') {
        await onCreate(null);
      }

      onClose?.();
      resetForm();
    } catch (err) {
      console.error('Error al crear paciente', err);
      // Podrías disparar un toast/alert y, si implementás optimismo, reversionar aquí
    } finally {
      creatingRef.current = false;
      if (typeof window !== 'undefined') window.__patientCreateLock = false;
      setSubmitting(false);
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
        <div className="mt-8 w-full max-w-xl rounded-xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Agregar Paciente</h3>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
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
              <label className="block text-sm font-medium text-gray-700">Historia Clínica (imagen o PDF)</label>
              <input
                name="historiaClinicaFile"
                onChange={handleFileChange}
                type="file"
                accept="image/*,application/pdf"
                className="mt-1 w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-white hover:file:bg-emerald-700"
              />
              {form.historiaClinicaFile && (
                <p className="mt-1 text-xs text-gray-500">Archivo seleccionado: {form.historiaClinicaFile.name}</p>
              )}
            </div>

            {/* Acciones */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => onClose?.()}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className={`rounded-md px-4 py-2 font-medium text-white ${submitting ? 'bg-emerald-600/70 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {submitting ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}