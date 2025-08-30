import React, { useState, useCallback, useMemo } from 'react';
import './App.css';

// Router
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';

// Utils: parse diverse date formats (Airtable/strings) to ms
function parseFechaToMs(raw) {
  if (!raw) return 0;
  // raw can be a Date, number, ISO string, or a dd/mm/yyyy (with optional time)
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    // 1) Try native Date.parse (covers ISO like 2025-08-27T13:20:10.000Z)
    const iso = Date.parse(raw);
    if (!Number.isNaN(iso)) return iso;

    // 2) dd/mm/yyyy or d/m/yyyy with optional time (e.g., 27/8/2025 14:35)
    const m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) {
      const d = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10) - 1;
      const y = parseInt(m[3].length === 2 ? `20${m[3]}` : m[3], 10);
      const hh = m[4] ? parseInt(m[4], 10) : 0;
      const mm = m[5] ? parseInt(m[5], 10) : 0;
      const ss = m[6] ? parseInt(m[6], 10) : 0;
      return new Date(y, mo, d, hh, mm, ss).getTime();
    }
  }
  return 0;
}

// Hooks
import { usePatients } from './hooks/usePatients';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import PacientesView from './components/PacientesView';
import TurnosView from './components/TurnosView';

import PatientProfileModal from './components/PatientProfileModal';
import EditPatientModal from './components/EditPatientModal';
import AddPatientModal from './components/AddPatientModal';
import ClinicalRecordModal from './components/ClinicalRecordModal';
import LoginView from './components/LoginView';

import { URL_DELETE_PATIENT } from './config/n8n';

// Título por ruta (router nativo)
const titleByPath = (pathname) => {
  if (pathname.startsWith('/pacientes')) return 'Pacientes';
  if (pathname.startsWith('/turnos')) return 'Turnos';
  return 'Dashboard';
};

function AuthedApp({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Patients hook
  const { patients, loading, error, addPatient, updatePatient, refreshPatients } = usePatients();

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState('');

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [locallyDeleted, setLocallyDeleted] = useState([]);

  // ======= Normalización + DEDUPE antes de renderizar =======
  const normalizedPatients = useMemo(() => {
    const list = Array.isArray(patients) ? patients : [];

    const keyOf = (p) =>
      p?.id ||
      p?.airtableId ||
      p?._id ||
      p?.recordId ||
      p?.email ||
      `${(p?.nombre ?? p?.name ?? '').trim()}-${(p?.telefono ?? '').trim()}`;

    const map = new Map();
    list
      .filter(Boolean)
      .map((p) => {
        const fields = p?.fields || {};

        const fechaRaw =
          p?.fechaCreacion ??
          p?.fechaRegistro ??
          p?.FechaRegistro ??
          p?.['Fecha Registro'] ??
          fields['Fecha Registro'] ??
          fields.FechaRegistro ??
          fields.fechaRegistro ??
          fields.fechaCreacion ??
          p?.fecha_registro ??
          p?.created_at ??
          fields.created_at ??
          p?.createdAt ??
          fields.createdAt ??
          p?.createdTime ??
          fields.createdTime ??
          null;

        // Fallback: if nothing above, try Airtable record metadata (some hooks return it in p._raw)
        const fallbackRaw = p?._raw?.createdTime || p?._createdTime || null;
        const resolvedRaw = fechaRaw ?? fallbackRaw;

        const ms = parseFechaToMs(resolvedRaw);
        const createdMs = ms || (typeof p?._createdAt === 'number' ? p._createdAt : Date.now());

        return {
          ...p,
          nombre: p?.nombre ?? p?.name ?? fields.nombre ?? fields.Name ?? '',
          // guardo la mejor fecha disponible para trazabilidad
          fechaRegistro: resolvedRaw ?? p?.fechaCreacion ?? fields.fechaCreacion ?? null,
          _createdAt: createdMs,
        };
      })
      // evito filas vacías
      .filter((p) => p.nombre && p.nombre.trim() !== '')
      // me quedo con la última aparición por clave
      .forEach((p) => map.set(keyOf(p), p));

    const removed = new Set(locallyDeleted);
    const result = Array.from(map.values()).filter((item) => !removed.has(keyOf(item)));
    return result;
  }, [patients, locallyDeleted]);
  // ===========================================================

  const latestPatients = useMemo(() => {
    return [...normalizedPatients]
      .sort((a, b) => (b?._createdAt || 0) - (a?._createdAt || 0))
      .slice(0, 4);
  }, [normalizedPatients]);

  // Handlers de paciente
  const onViewPatient = useCallback((p) => { setSelectedPatient(p); setShowProfileModal(true); }, []);
  const closeProfile = useCallback(() => setShowProfileModal(false), []);

  const onEditFromProfile = useCallback((p) => { setShowProfileModal(false); setTimeout(() => { setSelectedPatient(p); setShowEditModal(true); }, 100); }, []);

  const onSavedPatient = useCallback(async (updated) => {
    try {
      await updatePatient(updated);
      setSelectedPatient(updated);
      // opcional: revalidar
      await refreshPatients();
    } catch (err) {
      console.error('Error updating patient:', err);
    }
  }, [updatePatient, refreshPatients]);

  const openAddPatient = useCallback(() => setShowAddModal(true), []);
  const closeAddPatient = useCallback(() => setShowAddModal(false), []);

const handleDeletePatient = useCallback(async (patientData) => {
  try {
    // Normalizar datos del paciente
    const patient = typeof patientData === 'object' ? patientData : 
                    normalizedPatients.find(p => 
                      p?.id === patientData || 
                      p?.airtableId === patientData || 
                      p?.recordId === patientData
                    );
    
    if (!patient) {
      throw new Error('No se pudo encontrar el paciente');
    }

    // Obtener ID y nombre
    const id = patient?.id || patient?.airtableId || patient?.recordId || patient?._id;
    const nombre = patient?.nombre || patient?.name || 'Paciente';
    
    if (!id) {
      throw new Error('No se pudo identificar el paciente');
    }


    // Optimistic: ocultar inmediatamente
    setLocallyDeleted(prev => [...prev, id]);

    // Llamada a n8n webhook
    const response = await fetch(URL_DELETE_PATIENT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id,
        airtableId: id,
        nombre,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }


    // Refrescar lista
    await refreshPatients();
    
    // Limpiar estado local
    setLocallyDeleted(prev => prev.filter(k => k !== id));

  } catch (err) {
    console.error('Error eliminando paciente:', err);
    
    // Revertir cambios en caso de error
    const id = typeof patientData === 'string' ? patientData : 
               (patientData?.id || patientData?.airtableId);
    
    if (id) {
      setLocallyDeleted(prev => prev.filter(k => k !== id));
    }
    
    // No mostrar alert aquí, dejar que el componente que llama maneje el error
    throw err;
  }
}, [refreshPatients, normalizedPatients]);
  
const onCreatedPatient = useCallback(async (patientData) => {
  try {

    // Intentar crear mediante el hook; algunos hooks devuelven el creado, otros no
    const res = await addPatient(patientData);

    setShowAddModal(false);

    // Normalizamos un retorno por si el hook no devuelve nada
    const createdFallback = {
      ...patientData,
      id: patientData?.id || patientData?.airtableId || patientData?.recordId || String(Date.now()),
      fechaCreacion:
        patientData?.fechaCreacion ||
        patientData?.fechaRegistro ||
        new Date().toISOString().slice(0, 10),
      _createdAt: typeof patientData?._createdAt === 'number' ? patientData._createdAt : Date.now(),
    };

    // Si res es un objeto de respuesta con el paciente adentro, preferirlo
    const created = (Array.isArray(res) ? res[0]?.patient : res?.patient) || res || createdFallback;
    return created;

  } catch (err) {
    console.error('❌ Error creating patient:', err);
    alert(`Error: ${err.message || 'No se pudo crear el paciente'}`);
    throw err;
  }
}, [addPatient]);

  const onOpenRecord = useCallback((p) => { setSelectedPatient(p); setShowRecordModal(true); }, []);

  // Header title según ruta
  const headerTitle = titleByPath(location.pathname);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header title={headerTitle} setSidebarOpen={setSidebarOpen} />

        {/* Error banner pacientes */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
            <div className="flex justify-between items-center">
              <span>Error cargando pacientes: {error}</span>
              <button onClick={refreshPatients} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                Reintentar
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-auto">
          <Routes>
            <Route
              path="/"
              element={(
                <DashboardView
                  dashboardSearchTerm={dashboardSearchTerm}
                  setDashboardSearchTerm={setDashboardSearchTerm}
                  onAddPatient={openAddPatient}
                  onViewPatient={onViewPatient}
                  onOpenRecord={onOpenRecord}
                  patients={normalizedPatients}
                  latestPatients={latestPatients}
                  loading={loading}
                  // Navegación desde el dashboard
                  onGoToPatients={() => navigate('/pacientes')}
                />
              )}
            />

            <Route path="/turnos" element={<TurnosView />} />

            <Route
              path="/pacientes"
              element={(
                <PacientesView
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  onAddPatient={openAddPatient}
                  onViewPatient={onViewPatient}
                  onOpenRecord={onOpenRecord}
                  patients={normalizedPatients}
                  loading={loading}
                  onDeletePatient={handleDeletePatient}
                />
              )}
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Modales */}
      <PatientProfileModal open={showProfileModal} patient={selectedPatient} onClose={closeProfile} onEdit={onEditFromProfile} onDelete={handleDeletePatient} />
      <EditPatientModal open={showEditModal} patient={selectedPatient} onClose={() => setShowEditModal(false)} onSaved={onSavedPatient} loading={loading} />

      <AddPatientModal open={showAddModal} onClose={closeAddPatient} onCreate={onCreatedPatient} loading={loading} />

      <ClinicalRecordModal open={showRecordModal} patient={selectedPatient} onClose={() => setShowRecordModal(false)} />
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'));

  const handleLoginSuccess = useCallback(() => setAuthed(true), []);
  const handleLogout = useCallback(() => {
    try { localStorage.removeItem('token'); } catch (e) {}
    setAuthed(false);
  }, []);

  if (!authed) {
    return <LoginView onSuccess={handleLoginSuccess} />;
  }

  return (
    <Router>
      <AuthedApp onLogout={handleLogout} />
    </Router>
  );
}