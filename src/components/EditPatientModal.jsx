import React, { useEffect, useState, useRef } from 'react';
import ModalShell from './ModalShell';
import { User, Hash, Phone, Building2, FileText, AlertTriangle, Activity, Stethoscope, AlertCircle, Check } from 'lucide-react';
import { cls } from '../utils/helpers';

export default function EditPatientModal({ open, patient, onClose, onSaved }) {
  const savingRef = useRef(false);

  const [form, setForm] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    email: '',
    obraSocial: '',
    numeroAfiliado: '',
    alergia: '',
    antecedentes: '',
    historiaClinica: '',
    estado: 'Activo',
    notas: ''
  });
  
  const [historiaClinicaFile, setHistoriaClinicaFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setHistoriaClinicaFile(file || null);
  };

  useEffect(() => {
    if (open && patient) {
      setForm({
        nombre: patient?.nombre || '',
        dni: patient?.dni || '',
        telefono: patient?.telefono || '',
        email: patient?.email || '',
        obraSocial: patient?.obraSocial || '',
        numeroAfiliado: patient?.numeroAfiliado || '',
        alergia: patient?.alergia || patient?.alergias || '',
        antecedentes: patient?.antecedentes || '',
        historiaClinica: patient?.historiaClinica || '',
        estado: patient?.estado || 'Activo',
        notas: patient?.notas || ''
      });
      setHistoriaClinicaFile(null);
      setError('');
      setOk(false);
      savingRef.current = false;
    }
  }, [open, patient]);

  useEffect(() => {
    return () => {
      savingRef.current = false;
    };
  }, []);

  if (!open || !patient) return null;

  const save = async () => {
    if (saving || savingRef.current) {
      return;
    }

    if (!form.nombre?.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    savingRef.current = true;
    setError('');
    setOk(false);

    try {
      const updatedPatientData = {
        ...patient,
        ...form,
        airtableId: patient.airtableId,
      };

      if (historiaClinicaFile) {
        updatedPatientData.historiaClinicaFile = historiaClinicaFile;
        updatedPatientData.historiaClinicaNombre = historiaClinicaFile.name;
      }

      if (onSaved) {
        await onSaved(updatedPatientData);
      }

      setOk(true);
      setTimeout(onClose, 900);

    } catch (error) {
      setError(error.message || 'Error actualizando el paciente');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Editar Paciente" onClose={onClose}>
      <div className="flex h-full flex-col overflow-hidden">
        
        {/* Mensajes de estado */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 text-sm">
            <AlertCircle size={16} className="mr-2 shrink-0" />
            {error}
          </div>
        )}
        
        {ok && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700 text-sm">
            <Check size={16} className="mr-2 shrink-0" />
            Paciente actualizado correctamente
          </div>
        )}

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4">
          
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={saving}
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={saving}
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={saving}
            />
          </div>

          {/* 3b. Email */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <User size={16} className="mr-2 text-gray-500" />
              Email
            </label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              placeholder="paciente@correo.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={saving}
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={saving}
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={saving}
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={saving}
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
              disabled={saving}
            />
          </div>

          {/* 8. Historia Clínica (Archivo) */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <FileText size={16} className="mr-2 text-gray-500" />
              Historia Clínica (archivo)
            </label>
            <div className="flex items-center rounded-lg border px-3 py-2 bg-white">
              <FileText size={18} className="text-gray-400 mr-2"/>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border file:border-gray-200 file:bg-gray-50 file:px-3 file:py-1.5 file:text-sm file:text-gray-700"
                disabled={saving}
              />
            </div>
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={saving}
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
              disabled={saving}
            />
          </div>
        </div>

        {/* Footer con botones */}
        <div className="px-2 py-4 border-t bg-white mt-4">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving || !form.nombre?.trim()}
              className={cls(
                'flex-1 px-4 py-2 rounded-lg text-white font-medium',
                saving || !form.nombre?.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700'
              )}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
