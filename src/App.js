import React, { useState, useCallback } from 'react';
import './App.css';

// Router
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';

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
import MessagePatientModal from './components/MessagePatientModal';
import AddPatientModal from './components/AddPatientModal';
import ClinicalRecordModal from './components/ClinicalRecordModal';
import LoginView from './components/LoginView';

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
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);

  // Handlers de paciente
  const onViewPatient = useCallback((p) => { setSelectedPatient(p); setShowProfileModal(true); }, []);
  const closeProfile = useCallback(() => setShowProfileModal(false), []);

  const onEditFromProfile = useCallback((p) => { setShowProfileModal(false); setTimeout(() => { setSelectedPatient(p); setShowEditModal(true); }, 100); }, []);
  const onMessageFromProfile = useCallback((p) => { setShowProfileModal(false); setTimeout(() => { setSelectedPatient(p); setShowMessageModal(true); }, 100); }, []);

  const onSavedPatient = useCallback(async (updated) => {
    try {
      await updatePatient(updated);
      setSelectedPatient(updated);
    } catch (err) {
      console.error('Error updating patient:', err);
    }
  }, [updatePatient]);

  const openAddPatient = useCallback(() => setShowAddModal(true), []);
  const closeAddPatient = useCallback(() => setShowAddModal(false), []);

  const onCreatedPatient = useCallback(async (created) => {
    try {
      await addPatient(created);
      setShowAddModal(false);
    } catch (err) {
      console.error('Error creating patient:', err);
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
                  patients={patients}
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
                  patients={patients}
                  loading={loading}
                />
              )}
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Modales */}
      <PatientProfileModal open={showProfileModal} patient={selectedPatient} onClose={closeProfile} onEdit={onEditFromProfile} onMessage={onMessageFromProfile} />
      <EditPatientModal open={showEditModal} patient={selectedPatient} onClose={() => setShowEditModal(false)} onSaved={onSavedPatient} loading={loading} />
      <MessagePatientModal open={showMessageModal} patient={selectedPatient} onClose={() => setShowMessageModal(false)} />

      {/* Importante: alinear la prop con el componente actualizado (onCreate en vez de onCreated) */}
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