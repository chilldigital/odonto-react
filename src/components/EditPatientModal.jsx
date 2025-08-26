import React, { useEffect, useState } from 'react';
import ModalShell from './ModalShell';
import TextInput from './TextInput';
import { Phone, Mail, MapPin, AlertCircle, Check } from 'lucide-react';
import { cls } from '../utils/helpers';

export default function EditPatientModal({ 
  open, 
  patient, 
  onClose, 
  onSaved, 
  loading = false 
}) {
  const [form, setForm] = useState({ 
    nombre:'', 
    obraSocial:'', 
    telefono:'', 
    email:'', 
    direccion:'' 
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        nombre: patient?.nombre || '',
        obraSocial: patient?.obraSocial || '',
        telefono: patient?.telefono || '',
        email: patient?.email || '',
        direccion: patient?.direccion || ''
      });
      setError(''); 
      setOk(false);
    }
  }, [open, patient]);

  if (!open || !patient) return null;

  const save = async () => {
    setSaving(true); 
    setError(''); 
    setOk(false);
    
    try {
      const patientData = {
        airtableId: patient.airtableId || patient.id,
        ...form
      };

      // El hook usePatients maneja la actualización vía PatientService
      if (onSaved) {
        await onSaved(patientData);
        setOk(true);
        setTimeout(onClose, 900);
      }
    } catch (err) {
      setError('Error al actualizar paciente: ' + (err.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const isLoading = loading || saving;

  return (
    <ModalShell title="Editar Paciente" onClose={onClose}>
      <div className="space-y-4">
        <TextInput 
          label="Nombre" 
          value={form.nombre} 
          onChange={(v)=>setForm(s=>({...s, nombre:v}))}
          disabled={isLoading}
        />
        <TextInput 
          label="Obra Social" 
          value={form.obraSocial} 
          onChange={(v)=>setForm(s=>({...s, obraSocial:v}))}
          disabled={isLoading}
        />
        <TextInput 
          label="Teléfono" 
          value={form.telefono} 
          onChange={(v)=>setForm(s=>({...s, telefono:v}))} 
          icon={Phone}
          disabled={isLoading}
        />
        <TextInput 
          label="Email" 
          value={form.email} 
          onChange={(v)=>setForm(s=>({...s, email:v}))} 
          icon={Mail} 
          type="email"
          disabled={isLoading}
        />
        <TextInput 
          label="Dirección" 
          value={form.direccion} 
          onChange={(v)=>setForm(s=>({...s, direccion:v}))} 
          icon={MapPin}
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="mt-4 flex items-center text-sm text-red-600">
          <AlertCircle className="mr-2" size={16}/> 
          {error}
        </div>
      )}
      
      {ok && (
        <div className="mt-4 flex items-center text-sm text-green-600">
          <Check className="mr-2" size={16}/> 
          Guardado correctamente
        </div>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <button 
          className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 disabled:opacity-50" 
          onClick={onClose} 
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button 
          className={cls(
            "px-4 py-2 rounded-lg text-white flex items-center", 
            isLoading ? "bg-teal-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
          )} 
          onClick={save} 
          disabled={isLoading || !form.nombre.trim()}
        >
          {isLoading && (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          )}
          {isLoading ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </ModalShell>
  );
}