import React, { useEffect, useState } from 'react';
import ModalShell from './ModalShell';
import Chip from './Chip';
import { AlertCircle, Check, Send } from 'lucide-react';
import { cls } from '../utils/helpers';
import { URL_SEND_MESSAGE } from '../config/n8n';

export default function MessagePatientModal({ open, patient, onClose }) {
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setMessage(''); setSent(false); setError(''); setChannel('whatsapp'); }
  }, [open]);

  if (!open || !patient) return null;

  const send = async () => {
    setSending(true); setError('');
    try {
      const res = await fetch(URL_SEND_MESSAGE, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ airtableId: patient.airtableId, toPhone: patient.telefono, toEmail: patient.email, channel, message })
      });
      if (res.ok) { setSent(true); setTimeout(onClose, 900); }
      else { setError('No se pudo enviar. Revisá n8n.'); }
    } catch (_e) { setError('Error de red. Verificá la URL del webhook.'); }
    finally { setSending(false); }
  };

  return (
    <ModalShell title="Mensaje al paciente" onClose={onClose}>
      <div className="mb-3">
        <div className="text-sm text-gray-700 mb-2">Canal</div>
        <div className="flex gap-2">
          <Chip active={channel==='whatsapp'} onClick={()=>setChannel('whatsapp')}>WhatsApp</Chip>
          <Chip active={channel==='email'} onClick={()=>setChannel('email')}>Email</Chip>
        </div>
      </div>

      <div className="mb-2 text-sm text-gray-500">
        Enviar a: <span className="text-gray-900">{channel === 'email' ? patient.email : patient.telefono}</span>
      </div>

      <textarea
        rows={4}
        placeholder="Escribí tu mensaje..."
        value={message}
        onChange={(e)=>setMessage(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
      />

      {error && <div className="mt-3 flex items-center text-sm text-red-600"><AlertCircle className="mr-2" size={16}/> {error}</div>}
      {sent  && <div className="mt-3 flex items-center text-sm text-green-600"><Check className="mr-2" size={16}/> Enviado</div>}

      <div className="mt-6 flex justify-end space-x-3">
        <button className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50" onClick={onClose} disabled={sending}>Cancelar</button>
        <button className={cls("px-4 py-2 rounded-lg text-white flex items-center gap-2", sending ? "bg-teal-400" : "bg-teal-600 hover:bg-teal-700")} onClick={send} disabled={sending || !message.trim()}>
          <Send size={16}/> {sending ? "Sending..." : "Enviar"}
        </button>
      </div>
    </ModalShell>
  );
}