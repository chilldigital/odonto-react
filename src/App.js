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

        // Try many likely keys for the registration/creation date
        const fechaRaw =
          p?.fechaRegistro ??
          p?.FechaRegistro ??
          p?.['Fecha Registro'] ??
          fields['Fecha Registro'] ??
          fields.FechaRegistro ??
          fields.fechaRegistro ??
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

        return {
          ...p,
          nombre: p?.nombre ?? p?.name ?? fields.nombre ?? fields.Name ?? '',
          fechaRegistro: resolvedRaw,
          _createdAt: parseFechaToMs(resolvedRaw),
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

const handleDeletePatient = useCallback(async (patientOrId) => {
  try {
    let patient, id, nombre;
    
    // Caso 1: Se pasó solo el ID como string
    if (typeof patientOrId === 'string') {
      id = patientOrId;
      // Buscar el paciente completo en la lista usando el ID
      patient = normalizedPatients.find(p => 
        p?.id === id || 
        p?.airtableId === id || 
        p?.recordId === id ||
        p?._id === id ||
        p?.fields?.id === id
      );
      
      if (patient) {
        nombre = patient?.nombre || patient?.name || patient?.fields?.nombre || patient?.fields?.Name || '';
      } else {
        nombre = 'Paciente no encontrado';
      }
    } 
    // Caso 2: Se pasó el objeto completo del paciente
    else if (typeof patientOrId === 'object' && patientOrId !== null) {
      patient = patientOrId;
      
      // Extraer ID del objeto
      const possibleIds = [
        patient?.id,
        patient?.airtableId, 
        patient?.recordId,
        patient?._id,
        patient?.fields?.id,
      ];
      
      id = possibleIds.find(id => id && id.trim() !== '') || '';
      
      // Extraer nombre del objeto
      const possibleNames = [
        patient?.nombre,
        patient?.name,
        patient?.fields?.nombre,
        patient?.fields?.Name,
      ];
      
      nombre = possibleNames.find(name => name && name.trim() !== '') || '';
    } else {
      throw new Error('Parámetro inválido: debe ser string (ID) o objeto (paciente)');
    }

    // Validación antes de enviar
    if (!id) {
      alert("Error: No se pudo identificar el paciente a eliminar");
      return;
    }

    // Confirmar eliminación
    const confirmMessage = nombre ? 
      `¿Estás seguro de eliminar al paciente "${nombre}"?` : 
      `¿Estás seguro de eliminar este paciente?`;
      
    if (!confirm(confirmMessage)) {
      return;
    }

    const key = id;

    // Optimistic: ocultar de la lista inmediatamente
    setLocallyDeleted((prev) => (prev.includes(key) ? prev : [...prev, key]));

    // Llamada a n8n webhook
    const response = await fetch(URL_DELETE_PATIENT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id,
        airtableId: id, 
        nombre: nombre || 'Sin nombre',
        action: 'delete',
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Revalidar contra la fuente de verdad
    await refreshPatients();

    // Limpieza del marcador local
    setLocallyDeleted((prev) => prev.filter((k) => k !== key));

  } catch (err) {
    console.error('Error deleting patient:', err);
    
    // Revertir el ocultamiento si falló
    const key = typeof patientOrId === 'string' ? patientOrId : 
      (patientOrId?.id || patientOrId?.airtableId || '');
      
    setLocallyDeleted((prev) => prev.filter((k) => k !== key));
    alert(`Error eliminando paciente: ${err.message}`);
  }
}, [refreshPatients, normalizedPatients]);
  
const onCreatedPatient = useCallback(async (patientData) => {
  try {
    console.log('👨‍⚕️ Procesando creación de paciente:', patientData.nombre);

    await addPatient(patientData);
        
    console.log('✅ Paciente creado y agregado a la lista');
    setShowAddModal(false);
    
  } catch (err) {
    console.error('❌ Error creating patient:', err);
    
    // Mostrar error al usuario
    alert(`Error: ${err.message || 'No se pudo crear el paciente'}`);
  }
}, [addPatient]); // Solo depende de addPatient, no de refreshPatients

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