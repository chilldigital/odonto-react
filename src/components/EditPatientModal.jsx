import React, { useEffect, useState, useRef } from 'react';
import ModalShell from './ModalShell';
import TextInput from './TextInput';
import { Phone, Mail, Calendar, FileText, Hash, AlertCircle, Check } from 'lucide-react';
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
    fechaNacimiento: '', 
    alergias: 'Ninguna',
    notas: ''
  });
  const [historiaClinicaFile, setHistoriaClinicaFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const toInputDate = (v) => {
    if (!v) return '';
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    const d = new Date(v);
    if (isNaN(d)) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    if (open) {
      setForm({
        nombre: patient?.nombre || '',
        dni: patient?.dni || '',
        telefono: patient?.telefono || '',
        email: patient?.email || '',
        obraSocial: patient?.obraSocial || '',
        numeroAfiliado: patient?.numeroAfiliado || '',
        fechaNacimiento: toInputDate(patient?.fechaNacimiento || patient?.fecha_nacimiento),
        alergias: patient?.alergias || 'Ninguna',
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
      {/* Importante: usamos h-full y dejamos que ModalShell limite altura y oculte overflow */}
      <div className="flex h-full flex-col overflow-hidden">
        {/* ÚNICO scroller: solo la información */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4">
          <TextInput 
            label="Nombre" 
            value={form.nombre} 
            onChange={(v)=>setForm(s=>({...s, nombre:v}))} 
          />

          <TextInput 
            label="DNI" 
            type="text" 
            value={form.dni}
            onChange={(v)=>setForm(s=>({...s, dni:v}))} 
            icon={Hash} 
          />

          <TextInput 
            label="Teléfono" 
            type="tel" 
            value={form.telefono}
            onChange={(v)=>setForm(s=>({...s, telefono:v}))} 
            icon={Phone} 
          />

          <TextInput 
            label="Email" 
            type="email" 
            value={form.email}
            onChange={(v)=>setForm(s=>({...s, email:v}))} 
            icon={Mail} 
          />

          <TextInput 
            label="Obra Social" 
            value={form.obraSocial}
            onChange={(v)=>setForm(s=>({...s, obraSocial:v}))} 
          />

          <TextInput 
            label="Número de Afiliado" 
            type="text" 
            value={form.numeroAfiliado}
            onChange={(v)=>setForm(s=>({...s, numeroAfiliado:v}))} 
            icon={Hash} 
          />

          <TextInput 
            label="Fecha de Nacimiento" 
            type="date" 
            value={form.fechaNacimiento}
            onChange={(v)=>setForm(s=>({...s, fechaNacimiento:v}))} 
            icon={Calendar} 
          />

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Historia Clínica (archivo)
            </label>
            <div className="flex items-center rounded-lg border px-3 py-2 bg-white">
              <FileText size={18} className="text-gray-400 mr-2"/>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e)=>setHistoriaClinicaFile(e.target.files?.[0] || null)}
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

          <TextInput 
            label="Alergias" 
            value={form.alergias} 
            onChange={(v)=>setForm(s=>({...s, alergias:v}))} 
          />

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Notas</label>
            <textarea
              rows={3}
              className="rounded-lg border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={form.notas}
              onChange={(e)=>setForm(s=>({...s, notas:e.target.value}))}
              placeholder="Observaciones, antecedentes, etc."
              disabled={saving}
            />
          </div>

          {error && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <AlertCircle className="mr-2" size={16}/> {error}
            </div>
          )}
          {ok && (
            <div className="mt-2 flex items-center text-sm text-green-600">
              <Check className="mr-2" size={16}/> Guardado
            </div>
          )}
        </div>

        {/* Footer fijo (fuera del scroller) */}
        <div className="flex-none bg-white border-t px-2 pt-3 pb-3 flex justify-end gap-3">
          <button 
            className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={onClose} 
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className={cls(
              'px-4 py-2 rounded-lg text-white transition-colors',
              saving 
                ? 'bg-teal-400 cursor-not-allowed' 
                : 'bg-teal-600 hover:bg-teal-700'
            )}
            onClick={save}
            disabled={saving}
          >
            {saving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}