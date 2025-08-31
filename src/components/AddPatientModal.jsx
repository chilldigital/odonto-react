import React, { useState, useRef } from 'react';
import { X, User, Hash, Phone, Building2, FileText, AlertTriangle, Activity, Stethoscope } from 'lucide-react';

const todayISO = () => new Date().toISOString();

export default function AddPatientModal({ open: openFlag, onClose, onCreate, onCreated }) {
  const submittingRef = useRef(false);
  
  const [form, setForm] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    obraSocial: '',
    numeroAfiliado: '',
    alergia: '',
    antecedentes: '',
    historiaClinica: '',
    estado: 'Activo', // Valor por defecto
    notas: ''
  });
  
  const [historiaClinicaFile, setHistoriaClinicaFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setForm({
      nombre: '',
      dni: '',
      telefono: '',
      obraSocial: '',
      numeroAfiliado: '',
      alergia: '',
      antecedentes: '',
      historiaClinica: '',
      estado: 'Activo',
      notas: ''
    });
    setHistoriaClinicaFile(null);
    setSubmitting(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setHistoriaClinicaFile(file || null);
  };

  const submit = async () => {
    if (submitting || submittingRef.current) {
      return;
    }

    if (!form.nombre?.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    setSubmitting(true);
    submittingRef.current = true;

    try {
      const baseData = {
        ...form,
        id: `temp_${Date.now()}`,
        fechaCreacion: todayISO(),
        _createdAt: Date.now(),
        ultimaVisita: '-',
        historiaClinicaFile: historiaClinicaFile || null,
        hasFile: !historiaClinicaFile,
        fileName: historiaClinicaFile?.name,
        fileType: historiaClinicaFile?.type,
        fileSize: historiaClinicaFile?.size,
      };

      if (historiaClinicaFile) {
        baseData.historiaClinicaFile = historiaClinicaFile;
      } 

      if (typeof onCreate !== 'function') {
        throw new Error('onCreate no está definido');
      }

      // Cerramos el modal rápido para mejor UX
      onClose?.();

      // El padre hace el POST y devuelve el paciente creado
      const createdRes = await onCreate(baseData);

      // Normalizamos la respuesta
      const fromServer = (Array.isArray(createdRes) ? createdRes[0]?.patient : createdRes?.patient) || createdRes || {};
      const createdPatient = {
        ...baseData,
        ...fromServer,
        id: fromServer?.id || baseData.id,
        fechaCreacion: fromServer?.fechaCreacion || baseData.fechaCreacion || todayISO(),
        _createdAt: typeof fromServer?._createdAt === 'number' ? fromServer._createdAt : baseData._createdAt,
      };

      if (typeof onCreated === 'function') {
        onCreated(createdPatient);
      }

      resetForm();
    } catch (err) {
      console.error('❌ [AddPatientModal] Error al crear paciente:', err);
      alert(`Error: ${err.message || 'No se pudo crear el paciente'}`);
    } finally {
      submittingRef.current = false;
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
      
      {/* Modal */}
      <div className="relative z-10 flex h-full items-center justify-center py-6 md:py-10 px-4">
        <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl border flex flex-col max-h-[calc(100vh-3rem)] md:max-h-[calc(100vh-5rem)] min-h-0 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Nuevo Paciente</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              disabled={submitting}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
            
            {/* 1. Nombre */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <User size={16} className="mr-2 text-gray-500" />
                Nombre *
              </label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                type="text"
                placeholder="Nombre completo del paciente"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={submitting}
                required
              />
            </div>

            {/* 2. DNI */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Hash size={16} className="mr-2 text-gray-500" />
                DNI
              </label>
              <input
                name="dni"
                value={form.dni}
                onChange={handleChange}
                type="text"
                placeholder="Número de documento"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={submitting}
              />
            </div>

            {/* 3. Teléfono */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Phone size={16} className="mr-2 text-gray-500" />
                Teléfono
              </label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                type="tel"
                placeholder="+54 11 5555-5555"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={submitting}
              />
            </div>

            {/* 4. Obra Social */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Building2 size={16} className="mr-2 text-gray-500" />
                Obra Social
              </label>
              <input
                name="obraSocial"
                value={form.obraSocial}
                onChange={handleChange}
                type="text"
                placeholder="OSDE, Swiss Medical, etc."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={submitting}
              />
            </div>

            {/* 5. Número de Afiliado */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Hash size={16} className="mr-2 text-gray-500" />
                N° de Afiliado
              </label>
              <input
                name="numeroAfiliado"
                value={form.numeroAfiliado}
                onChange={handleChange}
                type="text"
                placeholder="1234-5678-90"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={submitting}
              />
            </div>

            {/* 6. Alergia */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <AlertTriangle size={16} className="mr-2 text-gray-500" />
                Alergia
              </label>
              <input
                name="alergia"
                value={form.alergia}
                onChange={handleChange}
                type="text"
                placeholder="Ninguna / Penicilina, Polen..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={submitting}
              />
            </div>

            {/* 7. Antecedentes */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Stethoscope size={16} className="mr-2 text-gray-500" />
                Antecedentes
              </label>
              <textarea
                name="antecedentes"
                value={form.antecedentes}
                onChange={handleChange}
                rows={2}
                placeholder="Antecedentes médicos relevantes..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                disabled={submitting}
              />
            </div>

            {/* 8. Historia Clínica (Archivo) */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <FileText size={16} className="mr-2 text-gray-500" />
                Historia Clínica (archivo)
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border file:border-gray-200 file:bg-gray-50 file:px-3 file:py-1.5 file:text-sm file:text-gray-700 file:cursor-pointer cursor-pointer"
                disabled={submitting}
              />
              {historiaClinicaFile && (
                <span className="mt-1 text-xs text-gray-500">
                  Archivo: {historiaClinicaFile.name}
                </span>
              )}
            </div>

            {/* 9. Estado */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Activity size={16} className="mr-2 text-gray-500" />
                Estado
              </label>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={submitting}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="En Tratamiento">En Tratamiento</option>
                <option value="Alta">Alta</option>
              </select>
            </div>

            {/* 10. Notas */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <FileText size={16} className="mr-2 text-gray-500" />
                Notas
              </label>
              <textarea
                name="notas"
                value={form.notas}
                onChange={handleChange}
                rows={3}
                placeholder="Observaciones adicionales..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-white">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={submitting || !form.nombre?.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}