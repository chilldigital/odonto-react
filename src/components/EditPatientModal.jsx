import React, { useEffect, useState } from 'react';
import ModalShell from './ModalShell';
import TextInput from './TextInput';
import { Phone, Mail, Calendar, FileText, Hash, AlertCircle, Check } from 'lucide-react';
import { cls } from '../utils/helpers';
import { URL_UPDATE_PATIENT } from '../config/n8n';

export default function EditPatientModal({ open, patient, onClose, onSaved }) {
  // Form state with all Airtable-backed fields
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
    }
  }, [open, patient]);

  if (!open || !patient) return null;

  const save = async () => {
    setSaving(true); setError(''); setOk(false);
    try {
      // Decide body format depending on whether a file was chosen
      let res;
      if (historiaClinicaFile) {
        const fd = new FormData();
        fd.append('airtableId', patient.airtableId);
        Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
        fd.append('historiaClinica', historiaClinicaFile);
        res = await fetch(URL_UPDATE_PATIENT, { method: 'POST', body: fd });
      } else {
        res = await fetch(URL_UPDATE_PATIENT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ airtableId: patient.airtableId, ...form })
        });
      }

      let updated = { ...patient, ...form };
      if (historiaClinicaFile) {
        updated.historiaClinicaNombre = historiaClinicaFile.name;
      }

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json?.data) updated = { ...updated, ...json.data };
        setOk(true);
        onSaved && onSaved(updated);
        setTimeout(onClose, 900);
      } else {
        setError('No se pudo guardar. Revisá n8n/Airtable.');
      }
    } catch (_e) {
      setError('Error de red. Verificá la URL del webhook.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Editar Paciente" onClose={onClose}>
      {/* Make the modal body scrollable when content is long, while keeping the footer visible */}
      <div className="flex max-h-[80vh] flex-col">
        {/* Scrollable form area */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4">
          <TextInput label="Nombre" value={form.nombre} onChange={(v)=>setForm(s=>({...s, nombre:v}))} />

          <TextInput label="DNI" type="text" value={form.dni}
            onChange={(v)=>setForm(s=>({...s, dni:v}))} icon={Hash} />

          <TextInput label="Teléfono" type="tel" value={form.telefono}
            onChange={(v)=>setForm(s=>({...s, telefono:v}))} icon={Phone} />

          <TextInput label="Email" type="email" value={form.email}
            onChange={(v)=>setForm(s=>({...s, email:v}))} icon={Mail} />

          <TextInput label="Obra Social" value={form.obraSocial}
            onChange={(v)=>setForm(s=>({...s, obraSocial:v}))} />

          <TextInput label="Número de Afiliado" type="text" value={form.numeroAfiliado}
            onChange={(v)=>setForm(s=>({...s, numeroAfiliado:v}))} icon={Hash} />

          <TextInput label="Fecha de Nacimiento" type="date" value={form.fechaNacimiento}
            onChange={(v)=>setForm(s=>({...s, fechaNacimiento:v}))} icon={Calendar} />

          {/* Historia Clínica (archivo) */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Historia Clínica (archivo)</label>
            <div className="flex items-center rounded-lg border px-3 py-2 bg-white">
              <FileText size={18} className="text-gray-400 mr-2"/>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e)=>setHistoriaClinicaFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border file:border-gray-200 file:bg-gray-50 file:px-3 file:py-1.5 file:text-sm file:text-gray-700"
              />
            </div>
            {historiaClinicaFile && (
              <span className="mt-1 text-xs text-gray-500">Archivo: {historiaClinicaFile.name}</span>
            )}
          </div>

          <TextInput label="Alergias" value={form.alergias} onChange={(v)=>setForm(s=>({...s, alergias:v}))} />

          {/* Notas */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Notas</label>
            <textarea
              rows={3}
              className="rounded-lg border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={form.notas}
              onChange={(e)=>setForm(s=>({...s, notas:e.target.value}))}
              placeholder="Observaciones, antecedentes, etc."
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

        {/* Footer with actions – always visible */}
        <div className="mt-4 flex justify-end gap-3 border-t pt-3 bg-white">
          <button className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50" onClick={onClose} disabled={saving}>Cancelar</button>
          <button
            className={cls('px-4 py-2 rounded-lg text-white', saving ? 'bg-teal-400' : 'bg-teal-600 hover:bg-teal-700')}
            onClick={save}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}