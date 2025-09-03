// src/App.js - CON AUTENTICACIÓN MEJORADA + BOOKING MODAL
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';

// Auth utilities
import { isAuthenticated, saveAuth, clearAuth, checkTokenExpiry, getTokenInfo } from './utils/auth';

// Utils
function parseFechaToMs(raw) {
  if (!raw) return 0;
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const iso = Date.parse(raw);
    if (!Number.isNaN(iso)) return iso;
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
import { useTurnos } from './hooks/useTurnos';

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
import BookingModal from './components/BookingModal';
import TurnoDetailsModal from './components/TurnoDetailsModal';
import EditTurnoModal from './components/EditTurnoModal';
import LoginView from './components/LoginView';

import { URL_DELETE_PATIENT, N8N_ENDPOINTS } from './config/n8n';

const titleByPath = (pathname) => {
  if (pathname.startsWith('/pacientes')) return 'Pacientes';
  if (pathname.startsWith('/turnos')) return 'Turnos';
  return 'Dashboard';
};

function AuthedApp({ onLogout, justLoggedIn, onConsumedLogin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Verificar token periódicamente
  useEffect(() => {
    // Verificar token inmediatamente
    if (!checkTokenExpiry()) {
      console.log('Token inválido, redirigiendo a login...');
      onLogout();
      return;
    }

    // Verificar token cada 5 minutos
    const tokenCheckInterval = setInterval(() => {
      if (!checkTokenExpiry()) {
        console.log('Token expirado, haciendo logout...');
        onLogout();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(tokenCheckInterval);
  }, [onLogout]);

  // Navegar a home después del login
  useEffect(() => {
    if (justLoggedIn) {
      navigate('/', { replace: true });
      if (onConsumedLogin) onConsumedLogin();
    }
  }, [justLoggedIn, navigate, onConsumedLogin]);

  // Debug: Mostrar info del token en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const tokenInfo = getTokenInfo();
      console.log('Token Info:', tokenInfo);
    }
  }, []);

  const { patients, loading, error, addPatient, updatePatient, refreshPatients } = usePatients();
  const { refreshTurnos } = useTurnos(); // Hook para turnos

  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState('');

  // Estados de modales de pacientes
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  
  // Estados de modales de turnos
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showTurnoDetailsModal, setShowTurnoDetailsModal] = useState(false);
  const [showEditTurnoModal, setShowEditTurnoModal] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState(null);
  
  const [locallyDeleted, setLocallyDeleted] = useState([]);

  const normalizedPatients = useMemo(() => {
    const list = Array.isArray(patients) ? patients : [];
    
    // Filtrar pacientes eliminados localmente
    const filtered = list.filter(p => {
      const id = p?.id || p?.airtableId || p?.recordId || p?._id;
      return id && !locallyDeleted.includes(id);
    });
    
    // Normalizar estructura
    return filtered.map(p => {
      const getField = (obj, fieldNames, defaultValue = '') => {
        for (const fieldName of fieldNames) {
          const value = obj?.[fieldName] || obj?.fields?.[fieldName];
          if (value != null && value !== '') return String(value);
        }
        return defaultValue;
      };

      return {
        id: p?.id || p?.airtableId || p?.recordId || p?._id || String(Math.random()),
        airtableId: p?.airtableId || p?.id || p?.recordId || p?._id,
        recordId: p?.recordId || p?.id || p?.airtableId || p?._id,
        nombre: getField(p, ['nombre', 'name'], 'Sin nombre'),
        dni: getField(p, ['dni', 'DNI', 'Dni']),
        telefono: getField(p, ['telefono', 'phone', 'Telefono']),
        obraSocial: getField(p, ['obraSocial', 'obra_social', 'ObraSocial', 'Obra Social']),
        numeroAfiliado: getField(p, ['numeroAfiliado', 'Numero Afiliado', 'Número Afiliado', 'numero_afiliado']),
        email: getField(p, ['email', 'Email', 'correo']),
        direccion: getField(p, ['direccion', 'Direccion', 'address']),
        fechaNacimiento: getField(p, ['fechaNacimiento', 'Fecha Nacimiento', 'birthDate']),
        estado: getField(p, ['estado', 'Estado', 'status'], 'Activo'),
        ultimaVisita: getField(p, ['ultimaVisita', 'Ultima Visita', 'lastVisit'], '-'),
        proximoTurno: getField(p, ['proximoTurno', 'Proximo Turno', 'nextAppointment'], '-'),
        alergia: getField(p, ['alergia', 'Alergia', 'allergies'], 'Ninguna'),
        antecedentes: getField(p, ['antecedentes', 'Antecedentes', 'medicalHistory'], 'Ninguno'),
        notas: getField(p, ['notas', 'Notas', 'notes']),
        historiaClinicaUrl: getField(p, ['historiaClinicaUrl', 'historia_clinica', 'Historia Clinica']),
        fechaCreacion: getField(p, ['fechaCreacion', 'Fecha Creacion', 'createdAt'], new Date().toISOString().slice(0, 10)),
        _createdAt: parseFechaToMs(p?._createdAt || p?.createdTime || p?.fechaCreacion || Date.now())
      };
    }).sort((a, b) => b._createdAt - a._createdAt);
  }, [patients, locallyDeleted]);

  const latestPatients = useMemo(() => normalizedPatients.slice(0, 4), [normalizedPatients]);

  // Modal handlers
  const closeProfile = useCallback(() => {
    setShowProfileModal(false);
    setSelectedPatient(null);
  }, []);

  const onViewPatient = useCallback((patient) => {
    setSelectedPatient(patient);
    setShowProfileModal(true);
  }, []);

  const onEditFromProfile = useCallback((patient) => {
    setSelectedPatient(patient);
    setShowProfileModal(false);
    setShowEditModal(true);
  }, []);

  const openAddPatient = useCallback(() => setShowAddModal(true), []);
  const closeAddPatient = useCallback(() => setShowAddModal(false), []);

  // Booking Modal handlers
  const openBookingModal = useCallback(() => setShowBookingModal(true), []);
  const closeBookingModal = useCallback(() => setShowBookingModal(false), []);
  
  const onBookingSuccess = useCallback(() => {
    // Refrescar turnos inmediatamente cuando se crea uno nuevo
    console.log('Turno creado exitosamente - actualizando calendario');
    refreshTurnos();
  }, [refreshTurnos]);

  // Turno modal handlers
  const onViewTurno = useCallback((turno) => {
    setSelectedTurno(turno);
    setShowTurnoDetailsModal(true);
  }, []);

  const onEditTurnoFromDetails = useCallback((turno) => {
    setSelectedTurno(turno);
    setShowTurnoDetailsModal(false);
    setShowEditTurnoModal(true);
  }, []);

  const onDeleteTurnoFromDetails = useCallback(async (turno) => {
    if (!turno || !turno.id) {
      alert('No se pudo identificar el turno a cancelar');
      return;
    }
    if (!window.confirm('¿Estás seguro de cancelar este turno?')) return;
    try {
      const response = await fetch(N8N_ENDPOINTS.DELETE_APPOINTMENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: turno.id,
          reason: 'Cancelado desde Dashboard',
          canceledAt: new Date().toISOString()
        })
      });
      if (!response.ok) {
        let message = '';
        try {
          const data = await response.json();
          message = data?.message || '';
        } catch {}
        throw new Error(message || 'Error al cancelar el turno');
      }
      onTurnoDeleted(turno);
    } catch (err) {
      console.error('Error cancelando turno:', err);
      alert(err.message || 'No se pudo cancelar el turno.');
    }
  }, [onTurnoDeleted]);

  const closeTurnoDetails = useCallback(() => {
    setShowTurnoDetailsModal(false);
    setSelectedTurno(null);
  }, []);

  const closeEditTurno = useCallback(() => {
    setShowEditTurnoModal(false);
    setSelectedTurno(null);
  }, []);

  const onTurnoSaved = useCallback((updatedTurno) => {
    console.log('Turno actualizado:', updatedTurno);
    refreshTurnos();
    setShowEditTurnoModal(false);
    setSelectedTurno(null);
  }, [refreshTurnos]);

  const onTurnoDeleted = useCallback((deletedTurno) => {
    console.log('Turno cancelado:', deletedTurno);
    refreshTurnos();
    setShowEditTurnoModal(false);
    setShowTurnoDetailsModal(false);
    setSelectedTurno(null);
  }, [refreshTurnos]);

  const onSavedPatient = useCallback(async (updatedPatientData) => {
    try {
      await updatePatient(updatedPatientData);
      setShowEditModal(false);
      setSelectedPatient(null);
    } catch (err) {
      console.error('Error actualizando paciente:', err);
      alert(`Error: ${err.message || 'No se pudo actualizar el paciente'}`);
    }
  }, [updatePatient]);

  const handleDeletePatient = useCallback(async (patientData) => {
    try {
      const patient = typeof patientData === 'string' ? 
        normalizedPatients.find(p =>
          p?.id === patientData || p?.airtableId === patientData || p?.recordId === patientData
        ) : patientData;

      if (!patient) throw new Error('No se pudo encontrar el paciente');

      const id = patient?.id || patient?.airtableId || patient?.recordId || patient?._id;
      const nombre = patient?.nombre || patient?.name || 'Paciente';
      if (!id) throw new Error('No se pudo identificar el paciente');

      setLocallyDeleted(prev => [...prev, id]);

      const response = await fetch(URL_DELETE_PATIENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, airtableId: id, nombre, timestamp: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);

      await refreshPatients();
      setLocallyDeleted(prev => prev.filter(k => k !== id));
    } catch (err) {
      console.error('Error eliminando paciente:', err);
      const id = typeof patientData === 'string' ? patientData : (patientData?.id || patientData?.airtableId);
      if (id) setLocallyDeleted(prev => prev.filter(k => k !== id));
      throw err;
    }
  }, [refreshPatients, normalizedPatients]);

  const onCreatedPatient = useCallback(async (patientData) => {
    try {
      const res = await addPatient(patientData);
      setShowAddModal(false);
      const createdFallback = {
        ...patientData,
        id: patientData?.id || patientData?.airtableId || patientData?.recordId || String(Date.now()),
        fechaCreacion: patientData?.fechaCreacion || patientData?.fechaRegistro || new Date().toISOString().slice(0, 10),
        _createdAt: typeof patientData?._createdAt === 'number' ? patientData._createdAt : Date.now(),
      };
      const created = (Array.isArray(res) ? res[0]?.patient : res?.patient) || res || createdFallback;
      return created;
    } catch (err) {
      console.error('Error creating patient:', err);
      alert(`Error: ${err.message || 'No se pudo crear el paciente'}`);
      throw err;
    }
  }, [addPatient]);

  const onOpenRecord = useCallback((p) => {
    const historiaUrl =
      p?.historiaUrl ||
      p?.historiaClinica ||
      p?.historiaClinicaUrl ||
      p?.odontogramaUrl ||
      '';
    setSelectedPatient({ ...p, historiaUrl });
    setShowRecordModal(true);
  }, []);

  const headerTitle = titleByPath(location.pathname);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={onLogout} />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header title={headerTitle} setSidebarOpen={setSidebarOpen} onLogout={onLogout} />

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
                  onOpenBooking={openBookingModal} // Nueva prop
                  patients={normalizedPatients}
                  latestPatients={latestPatients}
                  loading={loading}
                  onGoToPatients={() => navigate('/pacientes')}
                />
              )}
            />
            <Route 
              path="/turnos" 
              element={<TurnosView onOpenBooking={openBookingModal} onViewTurno={onViewTurno} />} // Nueva prop
            />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <PatientProfileModal open={showProfileModal} patient={selectedPatient} onClose={closeProfile} onEdit={onEditFromProfile} onDelete={handleDeletePatient} />
      <EditPatientModal open={showEditModal} patient={selectedPatient} onClose={() => setShowEditModal(false)} onSaved={onSavedPatient} loading={loading} />
      <AddPatientModal open={showAddModal} onClose={closeAddPatient} onCreate={onCreatedPatient} loading={loading} />
      <ClinicalRecordModal open={showRecordModal} patient={selectedPatient} onClose={() => setShowRecordModal(false)} />
      
      {/* Nuevo BookingModal */}
      <BookingModal 
        open={showBookingModal} 
        onClose={closeBookingModal} 
        onSuccess={onBookingSuccess} 
      />
      <TurnoDetailsModal 
        open={showTurnoDetailsModal} 
        turno={selectedTurno} 
        onClose={closeTurnoDetails} 
        onEdit={onEditTurnoFromDetails}
        onDelete={onDeleteTurnoFromDetails}
      />
      <EditTurnoModal 
        open={showEditTurnoModal}
        turno={selectedTurno}
        onClose={closeEditTurno}
        onSaved={onTurnoSaved}
        onDeleted={onTurnoDeleted}
      />
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Manejar login exitoso
  const handleLoginSuccess = useCallback((token, user) => {
    console.log('Login success, token:', token?.substring(0, 20) + '...');
    
    try {
      saveAuth(token, user);
      setAuthed(true);
      setJustLoggedIn(true);
      
      console.log('Auth data saved');
    } catch (e) {
      console.error('Error guardando auth:', e);
      // Fallback: continuar sin persistencia
      setAuthed(true);
      setJustLoggedIn(true);
    }
  }, []);

  // Manejar logout
  const handleLogout = useCallback(() => {
    console.log('Logging out...');
    clearAuth();
    setAuthed(false);
    setJustLoggedIn(false);
  }, []);

  // Consumir flag de recién logueado
  const handleConsumedLogin = useCallback(() => {
    setJustLoggedIn(false);
  }, []);

  // Debug en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('App State:', { authed, justLoggedIn });
      console.log('Token Info:', getTokenInfo());
    }
  }, [authed, justLoggedIn]);

  // Mostrar login si no está autenticado
  if (!authed) {
    return <LoginView onSuccess={handleLoginSuccess} />;
  }

  return (
    <Router>
      <AuthedApp 
        onLogout={handleLogout} 
        justLoggedIn={justLoggedIn} 
        onConsumedLogin={handleConsumedLogin} 
      />
    </Router>
  );
}
