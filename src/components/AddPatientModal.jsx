import React, { useState } from 'react';
import { URL_CREATE_PATIENT } from '../config/n8n';

/**
 * Modal para crear un paciente.
 * Campos: Nombre, Teléfono, Email, Obra Social, Número de Afiliado,
 * Fecha de Nacimiento, Notas y subir Historia Clínica (imagen o PDF).
 */
export default function AddPatientModal({ 
  open, 
  isOpen, 
  onClose, 
  onCreated, 
  onCreate, // mantener por compatibilidad
  loading = false 
}) {
  const openFlag = open ?? isOpen; // soporta ambas props

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    obraSocial: '',
    numeroAfiliado: '',
    direccion: '',
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
      direccion: '',
      fechaNacimiento: '',
      notas: '',
      historiaClinicaFile: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Preparar datos para enviar
      const patientData = {
        nombre: form.nombre || '',
        telefono: form.telefono || '',
        email: form.email || '',
        obraSocial: form.obraSocial || '',
        direccion: form.direccion || '',
        numeroAfiliado: form.numeroAfiliado || '',
        fechaNacimiento: form.fechaNacimiento || '',
        notas: form.notas || '',
      };

      // El hook usePatients maneja la creación vía PatientService
      const callback = onCreated || onCreate;
      if (callback) {
        await callback(patientData);
        resetForm();
      }

    } catch (err) {
      console.error('Error al crear paciente:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!openFlag) return null;

  const isLoading = loading || submitting;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
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
              disabled={isLoading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre *</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                type="text"
                placeholder="Ej: Juan Pérez"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                disabled={isLoading}
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
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                disabled={isLoading}
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
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                disabled={isLoading}
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
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                disabled={isLoading}
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Dirección</label>
              <input
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                type="text"
                placeholder="Ej: Av. Corrientes 1234, CABA"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                disabled={isLoading}
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
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                disabled={isLoading}
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
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                disabled={isLoading}
              />
            </div>

            {/* Acciones */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !form.nombre.trim()}
                className="rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                )}
                {isLoading ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}