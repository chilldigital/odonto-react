import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar, Users, BarChart3, Search, Eye, Phone, MapPin, Mail, Upload, X, Check, AlertCircle, Send } from 'lucide-react';
import './App.css';

/* =====================
   Config (n8n)
===================== */
// Ajustá estas variables a tus endpoints reales de n8n
const N8N_BASE = process.env.REACT_APP_N8N_BASE || 'http://localhost:5678';
const URL_UPDATE_PATIENT = `${N8N_BASE}/webhook/update-patient`;
const URL_SEND_MESSAGE  = `${N8N_BASE}/webhook/send-message`;
const URL_CREATE_PATIENT = `${N8N_BASE}/webhook/create-patient`; // <-- NUEVO

/* =====================
   Datos de ejemplo
===================== */
const initialPatients = [
  { id: 1, airtableId: 'rec001', nombre: "Benjamin Torres Lemos", obraSocial: "OSDE", telefono: "+54 381 612 3456", email: "benjamin@ejemplo.com", direccion: "Av. Siempre Viva 742, Tucumán", historiaClinica: "Abrir", ultimaVisita: "12/08/2025" },
  { id: 2, airtableId: 'rec002', nombre: "Agustin Corbalan", obraSocial: "Swiss Medical", telefono: "+54 11 3631 4341", email: "agustin@ejemplo.com", direccion: "CABA, Argentina", historiaClinica: "Abrir", ultimaVisita: "02/07/2025" },
  { id: 3, airtableId: 'rec003', nombre: "Esteban Alvarez Farhat", obraSocial: "Medicus", telefono: "+54 381 618 2736", email: "esteban@ejemplo.com", direccion: "San Miguel de Tucumán", historiaClinica: "Abrir", ultimaVisita: "24/02/2025" },
  { id: 4, airtableId: 'rec004', nombre: "Facundo Salado", obraSocial: "Medifé", telefono: "+54 381 692 7465", email: "facundo@ejemplo.com", direccion: "Yerba Buena", historiaClinica: "Abrir", ultimaVisita: "16/06/2025" }
];

const mockData = {
  stats: { turnosHoy: 2, turnosSemana: 9, totalPacientes: 27 },
  proximosTurnos: [
    { fecha: "Viernes 22 de Agosto", hora: "15:00 hs", paciente: "Benjamin Torres Lemos", tipo: "Consulta General" },
    { fecha: "Viernes 22 de Agosto", hora: "15:30 hs", paciente: "Agustin Corbalan", tipo: "Arreglo de Caries" },
    { fecha: "Martes 26 de Agosto", hora: "10:45 hs", paciente: "Esteban Alvarez Farhat", tipo: "Extracción" }
  ]
};

/* =====================
   Helpers
===================== */
const initials = (name = '') => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const cls = (...a) => a.filter(Boolean).join(' ');

/* =====================
   Componentes básicos
===================== */

const SearchInput = React.memo(({ value, onChange, placeholder }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-auto"
      autoComplete="off"
    />
  </div>
));

const PatientTable = React.memo(({ patients, onView }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-full">
      <thead className="bg-gray-50 border-b">
        <tr>
          <th className="text-left p-3 lg:p-4 text-sm font-medium text-gray-700 whitespace-nowrap">Nombre</th>
          <th className="text-left p-3 lg:p-4 text-sm font-medium text-gray-700 whitespace-nowrap">Obra Social</th>
          <th className="text-left p-3 lg:p-4 text-sm font-medium text-gray-700 whitespace-nowrap">Historia Clínica</th>
          <th className="text-left p-3 lg:p-4 text-sm font-medium text-gray-700 whitespace-nowrap">Última Visita</th>
          <th className="text-left p-3 lg:p-4 text-sm font-medium text-gray-700"></th>
        </tr>
      </thead>
      <tbody>
        {patients.map((paciente) => (
          <tr key={paciente.id} className="border-b hover:bg-gray-50">
            <td className="p-3 lg:p-4 text-sm text-gray-900 whitespace-nowrap">{paciente.nombre}</td>
            <td className="p-3 lg:p-4 text-sm text-blue-600 whitespace-nowrap">{paciente.obraSocial}</td>
            <td className="p-3 lg:p-4 text-sm text-teal-600 whitespace-nowrap">{paciente.historiaClinica}</td>
            <td className="p-3 lg:p-4 text-sm text-gray-900 whitespace-nowrap">{paciente.ultimaVisita}</td>
            <td className="p-3 lg:p-4">
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => onView && onView(paciente)}
                aria-label={`Ver perfil de ${paciente.nombre}`}
              >
                <Eye size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
));

/* =====================
   Modales
===================== */

const ModalShell = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/50" onClick={onClose} />
    <div className="relative bg-white w-[90%] max-w-md rounded-2xl shadow-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" aria-label="Cerrar">
          <X size={18} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const PatientProfileModal = ({ open, patient, onClose, onEdit, onMessage }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !patient) return null;

  return (
    <ModalShell title="Paciente" onClose={onClose}>
      <div className="flex flex-col items-center mb-5">
        <div className="w-28 h-28 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center text-gray-600 text-2xl font-semibold">
          {initials(patient.nombre)}
        </div>
        <div className="mt-4 text-center">
          <div className="text-xl font-semibold text-gray-900">{patient.nombre}</div>
          <div className="text-sm text-gray-500">{patient.obraSocial || 'Paciente'}</div>
        </div>
      </div>
      <hr className="my-4" />
      <div className="space-y-4">
        <div className="flex items-start">
          <Phone className="mt-1 mr-3 text-gray-400" size={18} />
          <div>
            <div className="text-sm text-gray-500">Teléfono</div>
            <div className="text-sm text-gray-900">{patient.telefono || '-'}</div>
          </div>
        </div>
        <div className="flex items-start">
          <Mail className="mt-1 mr-3 text-gray-400" size={18} />
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="text-sm text-gray-900">{patient.email || '-'}</div>
          </div>
        </div>
        <div className="flex items-start">
          <MapPin className="mt-1 mr-3 text-gray-400" size={18} />
          <div>
            <div className="text-sm text-gray-500">Dirección</div>
            <div className="text-sm text-gray-900">{patient.direccion || '-'}</div>
          </div>
        </div>
      </div>
      <hr className="my-6" />
      <div className="grid grid-cols-2 gap-3">
        <button className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50" onClick={() => onEdit && onEdit(patient)}>
          Editar
        </button>
        <button className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700" onClick={() => onMessage && onMessage(patient)}>
          Mensaje
        </button>
      </div>
    </ModalShell>
  );
};

const EditPatientModal = ({ open, patient, onClose, onSaved }) => {
  const [form, setForm] = useState(() => ({
    nombre: patient?.nombre || '',
    obraSocial: patient?.obraSocial || '',
    telefono: patient?.telefono || '',
    email: patient?.email || '',
    direccion: patient?.direccion || ''
  }));
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
      const payload = { airtableId: patient.airtableId, ...form };
      const res = await fetch(URL_UPDATE_PATIENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let updated = { ...patient, ...form };
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json?.data) updated = { ...updated, ...json.data };
        setOk(true);
        onSaved && onSaved(updated);
        setTimeout(onClose, 900);
      } else {
        setError('No se pudo guardar. Revisá n8n/Airtable.');
      }
    } catch (e) {
      setError('Error de red. Verificá la URL del webhook.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Editar Paciente" onClose={onClose}>
      <div className="space-y-4">
        <TextInput label="Nombre" value={form.nombre} onChange={(v) => setForm(s => ({ ...s, nombre: v }))} />
        <TextInput label="Obra Social" value={form.obraSocial} onChange={(v) => setForm(s => ({ ...s, obraSocial: v }))} />
        <TextInput label="Teléfono" value={form.telefono} onChange={(v) => setForm(s => ({ ...s, telefono: v }))} icon={Phone} />
        <TextInput label="Email" value={form.email} onChange={(v) => setForm(s => ({ ...s, email: v }))} icon={Mail} type="email" />
        <TextInput label="Dirección" value={form.direccion} onChange={(v) => setForm(s => ({ ...s, direccion: v }))} icon={MapPin} />
      </div>

      {error && (
        <div className="mt-4 flex items-center text-sm text-red-600">
          <AlertCircle className="mr-2" size={16} /> {error}
        </div>
      )}
      {ok && (
        <div className="mt-4 flex items-center text-sm text-green-600">
          <Check className="mr-2" size={16} /> Guardado
        </div>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <button className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50" onClick={onClose} disabled={saving}>
          Cancelar
        </button>
        <button className={cls("px-4 py-2 rounded-lg text-white", saving ? "bg-teal-400" : "bg-teal-600 hover:bg-teal-700")} onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Guardar"}
        </button>
      </div>
    </ModalShell>
  );
};

// NUEVO: Modal para agregar paciente
const AddPatientModal = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({
    nombre: '',
    obraSocial: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ nombre: '', obraSocial: '', telefono: '', email: '', direccion: '' });
      setSaving(false);
      setError('');
      setOk(false);
    }
  }, [open]);

  if (!open) return null;

  const create = async () => {
    if (!form.nombre.trim()) {
      setError('Ingresá al menos el nombre.');
      return;
    }
    setSaving(true);
    setError('');
    setOk(false);
    try {
      const res = await fetch(URL_CREATE_PATIENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      let created;
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        // Esperamos { id, airtableId, ...campos }
        created = {
          id: json?.id ?? Date.now(),
          airtableId: json?.airtableId ?? `tmp_${Date.now()}`,
          historiaClinica: 'Abrir',
          ultimaVisita: '-',
          ...form,
          ...json?.data
        };
      } else {
        // Fallback local si el webhook devuelve error
        created = {
          id: Date.now(),
          airtableId: `tmp_${Date.now()}`,
          historiaClinica: 'Abrir',
          ultimaVisita: '-',
          ...form
        };
        setError('No se pudo crear via n8n. Se agregó localmente.');
      }
      setOk(true);
      onCreated && onCreated(created);
      setTimeout(onClose, 900);
    } catch (e) {
      setError('Error de red. Verificá la URL del webhook.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Agregar Paciente" onClose={onClose}>
      <div className="space-y-4">
        <TextInput label="Nombre" value={form.nombre} onChange={(v) => setForm(s => ({ ...s, nombre: v }))} />
        <TextInput label="Obra Social" value={form.obraSocial} onChange={(v) => setForm(s => ({ ...s, obraSocial: v }))} />
        <TextInput label="Teléfono" value={form.telefono} onChange={(v) => setForm(s => ({ ...s, telefono: v }))} icon={Phone} />
        <TextInput label="Email" value={form.email} onChange={(v) => setForm(s => ({ ...s, email: v }))} icon={Mail} type="email" />
        <TextInput label="Dirección" value={form.direccion} onChange={(v) => setForm(s => ({ ...s, direccion: v }))} icon={MapPin} />
      </div>

      {error && (
        <div className="mt-4 flex items-center text-sm text-red-600">
          <AlertCircle className="mr-2" size={16} /> {error}
        </div>
      )}
      {ok && (
        <div className="mt-4 flex items-center text-sm text-green-600">
          <Check className="mr-2" size={16} /> Creado
        </div>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <button className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50" onClick={onClose} disabled={saving}>
          Cancelar
        </button>
        <button className={cls("px-4 py-2 rounded-lg text-white", saving ? "bg-teal-400" : "bg-teal-600 hover:bg-teal-700")} onClick={create} disabled={saving}>
          {saving ? "Creando..." : "Crear"}
        </button>
      </div>
    </ModalShell>
  );
};

const MessagePatientModal = ({ open, patient, onClose }) => {
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState('whatsapp'); // whatsapp | email
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setMessage('');
      setSent(false);
      setError('');
      setChannel('whatsapp');
    }
  }, [open]);

  if (!open || !patient) return null;

  const send = async () => {
    setSending(true);
    setError('');
    try {
      const payload = {
        airtableId: patient.airtableId,
        toPhone: patient.telefono,
        toEmail: patient.email,
        channel,
        message
      };
      const res = await fetch(URL_SEND_MESSAGE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSent(true);
        setTimeout(onClose, 900);
      } else {
        setError('No se pudo enviar. Revisá n8n.');
      }
    } catch (e) {
      setError('Error de red. Verificá la URL del webhook.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ModalShell title="Mensaje al paciente" onClose={onClose}>
      <div className="mb-3">
        <div className="text-sm text-gray-700 mb-2">Canal</div>
        <div className="flex gap-2">
          <Chip active={channel === 'whatsapp'} onClick={() => setChannel('whatsapp')}>WhatsApp</Chip>
          <Chip active={channel === 'email'} onClick={() => setChannel('email')}>Email</Chip>
        </div>
      </div>

      <div className="mb-2 text-sm text-gray-500">
        Enviar a: <span className="text-gray-900">{channel === 'email' ? patient.email : patient.telefono}</span>
      </div>

      <textarea
        rows={4}
        placeholder="Escribí tu mensaje..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
      />

      {error && (
        <div className="mt-3 flex items-center text-sm text-red-600">
          <AlertCircle className="mr-2" size={16} /> {error}
        </div>
      )}
      {sent && (
        <div className="mt-3 flex items-center text-sm text-green-600">
          <Check className="mr-2" size={16} /> Enviado
        </div>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <button className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50" onClick={onClose} disabled={sending}>
          Cancel
        </button>
        <button className={cls("px-4 py-2 rounded-lg text-white flex items-center gap-2", sending ? "bg-teal-400" : "bg-teal-600 hover:bg-teal-700")} onClick={send} disabled={sending || !message.trim()}>
          <Send size={16} /> {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </ModalShell>
  );
};

/* =====================
   Inputs auxiliares
===================== */

const TextInput = ({ label, value, onChange, icon: Icon, type = 'text' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cls("w-full", Icon ? "pl-9" : "pl-3", "pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500")}
      />
    </div>
  </div>
);

const Chip = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={cls(
      "px-3 py-1 rounded-full text-sm border",
      active ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
    )}
  >
    {children}
  </button>
);

/* =====================
   Sidebar, Header, Stats
===================== */

const Sidebar = ({ currentView, setCurrentView, sidebarOpen, setSidebarOpen }) => (
  <>
    {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white h-screen shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="px-6 py-4 border-b" style={{ height: '73px', display: 'flex', alignItems: 'center' }}>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <span className="text-amber-600 font-semibold text-sm">🦷</span>
          </div>
          <span className="text-gray-800 font-semibold text-base">Od. Mercedes Pindar</span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-2"><X size={20} /></button>
      </div>
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          <li>
            <button onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${currentView === 'dashboard' ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              <BarChart3 size={20} /><span>Dashboard</span>
            </button>
          </li>
          <li>
            <button onClick={() => { setCurrentView('turnos'); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${currentView === 'turnos' ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Calendar size={20} /><span>Turnos</span>
            </button>
          </li>
          <li>
            <button onClick={() => { setCurrentView('pacientes'); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${currentView === 'pacientes' ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Users size={20} /><span>Pacientes</span>
            </button>
          </li>
        </ul>
      </nav>
      <div className="absolute bottom-4 left-4">
        <button className="flex items-center space-x-2 text-gray-600 text-sm">
          <span className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">?</span>
          <span>Soporte</span>
        </button>
      </div>
    </div>
  </>
);

const Header = ({ title, setSidebarOpen }) => (
  <div className="bg-white border-b px-4 lg:px-8 py-4 flex justify-between items-center">
    <div className="flex items-center space-x-4">
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:text-gray-900">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <h1 className="text-xl lg:text-2xl font-semibold text-gray-800">{title}</h1>
    </div>
    <div className="flex items-center space-x-4">
      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-orange-100 rounded-full flex items-center justify-center">
        <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-200 rounded-full"></div>
      </div>
    </div>
  </div>
);

const StatsCard = ({ title, value, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 text-sm mb-1">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  </div>
);

/* =====================
   Vistas
===================== */

const DashboardView = ({ dashboardSearchTerm, setDashboardSearchTerm, onAddPatient, onViewPatient, patients }) => {
  const filteredPacientes = useMemo(() => {
    if (!dashboardSearchTerm.trim()) return patients.slice(0, 4);
    return patients
      .filter(p => p.nombre.toLowerCase().includes(dashboardSearchTerm.toLowerCase()))
      .slice(0, 4);
  }, [dashboardSearchTerm, patients]);

  const handleSearchChange = useCallback((e) => setDashboardSearchTerm(e.target.value), [setDashboardSearchTerm]);

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <StatsCard title="Turnos de hoy" value={mockData.stats.turnosHoy} color="text-teal-600" />
        <StatsCard title="Turnos de la semana" value={mockData.stats.turnosSemana} color="text-gray-900" />
        <StatsCard title="Pacientes" value={mockData.stats.totalPacientes} color="text-gray-900" />
      </div>

      <div className="space-y-6 lg:space-y-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 lg:p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Próximos Turnos</h2>
          </div>
          <div className="p-4 lg:p-6">
            <div className="space-y-4">
              {mockData.proximosTurnos.map((turno, index) => (
                <div key={`turno-${index}`} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-teal-500 rounded-full flex-shrink-0"></div>
                    <div>
                      <p className="text-sm text-gray-500">{turno.fecha}</p>
                      <p className="text-sm text-gray-500">{turno.hora}</p>
                    </div>
                  </div>
                  <div className="flex-1 sm:ml-4">
                    <p className="font-medium text-gray-900">{turno.paciente}</p>
                    <p className="text-sm text-gray-500">{turno.tipo}</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 self-start sm:self-center">
                    <Eye size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 lg:p-6 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <h2 className="text-lg font-semibold text-gray-800">Pacientes</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <SearchInput value={dashboardSearchTerm} onChange={handleSearchChange} placeholder="Buscar paciente" />
              <button onClick={onAddPatient} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors w-full sm:w-auto">Agregar</button>
            </div>
          </div>
          <PatientTable patients={filteredPacientes} onView={onViewPatient} />
        </div>
      </div>
    </div>
  );
};

const PacientesView = ({ searchTerm, setSearchTerm, onAddPatient, onViewPatient, patients }) => {
  const filteredPacientes = useMemo(() => {
    return patients.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, patients]);

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 lg:p-6 border-b flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <h2 className="text-lg font-semibold text-gray-800">Pacientes</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar paciente"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-auto"
              />
            </div>
            <button onClick={onAddPatient} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors w-full sm:w-auto">Agregar</button>
          </div>
        </div>
        <PatientTable patients={filteredPacientes} onView={onViewPatient} />
      </div>
    </div>
  );
};

const TurnosView = () => (
  <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 lg:p-6 border-b"><h2 className="text-lg font-semibold text-gray-800">Calendario</h2></div>
      <div className="p-4 lg:p-6 text-gray-500">Calendario dummy…</div>
    </div>
  </div>
);

/* =====================
   App
===================== */

const Dashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pacientes en estado (para poder actualizar tras guardar)
  const [patients, setPatients] = useState(initialPatients);

  // Búsquedas
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState('');

  // Modales
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false); // <-- NUEVO

  const onViewPatient = useCallback((p) => { setSelectedPatient(p); setShowProfileModal(true); }, []);
  const closeProfile = useCallback(() => setShowProfileModal(false), []);

  const onEditFromProfile = useCallback((p) => { setShowProfileModal(false); setTimeout(() => { setSelectedPatient(p); setShowEditModal(true); }, 100); }, []);
  const onMessageFromProfile = useCallback((p) => { setShowProfileModal(false); setTimeout(() => { setSelectedPatient(p); setShowMessageModal(true); }, 100); }, []);

  const onSavedPatient = useCallback((updated) => {
    setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPatient(updated);
  }, []);

  // Handlers Agregar
  const openAddPatient = useCallback(() => setShowAddModal(true), []);
  const closeAddPatient = useCallback(() => setShowAddModal(false), []);
  const onCreatedPatient = useCallback((created) => {
    setPatients(prev => [created, ...prev]);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header title={currentView.charAt(0).toUpperCase() + currentView.slice(1)} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              dashboardSearchTerm={dashboardSearchTerm}
              setDashboardSearchTerm={setDashboardSearchTerm}
              onAddPatient={openAddPatient}       // <-- ahora abre modal
              onViewPatient={onViewPatient}
              patients={patients}
            />
          )}
          {currentView === 'turnos' && <TurnosView />}
          {currentView === 'pacientes' && (
            <PacientesView
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onAddPatient={openAddPatient}       // <-- ahora abre modal
              onViewPatient={onViewPatient}
              patients={patients}
            />
          )}
        </main>
      </div>

      {/* Modales */}
      <PatientProfileModal open={showProfileModal} patient={selectedPatient} onClose={closeProfile} onEdit={onEditFromProfile} onMessage={onMessageFromProfile} />
      <EditPatientModal open={showEditModal} patient={selectedPatient} onClose={() => setShowEditModal(false)} onSaved={onSavedPatient} />
      <MessagePatientModal open={showMessageModal} patient={selectedPatient} onClose={() => setShowMessageModal(false)} />
      <AddPatientModal open={showAddModal} onClose={closeAddPatient} onCreated={onCreatedPatient} /> {/* <-- NUEVO */}
    </div>
  );
};

export default function App() {
  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}