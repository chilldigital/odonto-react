import React, { useEffect, useState } from 'react';
import ModalShell from './ModalShell';
import TextInput from './TextInput';
import { Phone, Mail, MapPin, AlertCircle, Check } from 'lucide-react';
import { cls } from '../utils/helpers';
import { URL_UPDATE_PATIENT } from '../config/n8n';

export default function EditPatientModal({ open, patient, onClose, onSaved }) {
  const [form, setForm] = useState({ nombre:'', obraSocial:'', telefono:'', email:'', direccion:'' });
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
      setError(''); setOk(false);
    }
  }, [open, patient]);

  if (!open || !patient) return null;

  const save = async () => {
    setSaving(true); setError(''); setOk(false);
    try {
      const res = await fetch(URL_UPDATE_PATIENT, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ airtableId: patient.airtableId, ...form })
      });
      let updated = { ...patient, ...form };
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json?.data) updated = { ...updated, ...json.data };
        setOk(true); onSaved && onSaved(updated);
        setTimeout(onClose, 900);
      } else { setError('No se pudo guardar. Revisá n8n/Airtable.'); }
    } catch (_e) { setError('Error de red. Verificá la URL del webhook.'); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell title="Editar Paciente" onClose={onClose}>
      <div className="space-y-4">
        <TextInput label="Nombre" value={form.nombre} onChange={(v)=>setForm(s=>({...s, nombre:v}))}/>
        <TextInput label="Obra Social" value={form.obraSocial} onChange={(v)=>setForm(s=>({...s, obraSocial:v}))}/>
        <TextInput label="Teléfono" value={form.telefono} onChange={(v)=>setForm(s=>({...s, telefono:v}))} icon={Phone}/>
        <TextInput label="Email" value={form.email} onChange={(v)=>setForm(s=>({...s, email:v}))} icon={Mail} type="email"/>
        <TextInput label="Dirección" value={form.direccion} onChange={(v)=>setForm(s=>({...s, direccion:v}))} icon={MapPin}/>
      </div>

      {error && <div className="mt-4 flex items-center text-sm text-red-600"><AlertCircle className="mr-2" size={16}/> {error}</div>}
      {ok &&    <div className="mt-4 flex items-center text-sm text-green-600"><Check className="mr-2" size={16}/> Guardado</div>}

      <div className="mt-6 flex justify-end space-x-3">
        <button className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50" onClick={onClose} disabled={saving}>Cancelar</button>
        <button className={cls("px-4 py-2 rounded-lg text-white", saving ? "bg-teal-400" : "bg-teal-600 hover:bg-teal-700")} onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Guardar"}
        </button>
      </div>
    </ModalShell>
  );
}