import React, { useState, useCallback } from 'react';
import './App.css';

// Import the new usePatients hook
import { usePatients } from './hooks/usePatients';

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

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'));
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Replace local patients state with the usePatients hook
  const { 
    patients, 
    loading, 
    error, 
    addPatient, 
    updatePatient, 
    refreshPatients 
  } = usePatients();

  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState('');

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);

  const onViewPatient = useCallback((p) => { setSelectedPatient(p); setShowProfileModal(true); }, []);
  const closeProfile = useCallback(() => setShowProfileModal(false), []);

  const onEditFromProfile = useCallback((p) => { setShowProfileModal(false); setTimeout(() => { setSelectedPatient(p); setShowEditModal(true); }, 100); }, []);
  const onMessageFromProfile = useCallback((p) => { setShowProfileModal(false); setTimeout(() => { setSelectedPatient(p); setShowMessageModal(true); }, 100); }, []);

  // Updated to use the updatePatient function from the hook
  const onSavedPatient = useCallback(async (updated) => {
    try {
      await updatePatient(updated);
      setSelectedPatient(updated);
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  }, [updatePatient]);

  const openAddPatient = useCallback(() => setShowAddModal(true), []);
  const closeAddPatient = useCallback(() => setShowAddModal(false), []);
  
  // Updated to use the addPatient function from the hook
  const onCreatedPatient = useCallback(async (created) => {
    try {
      await addPatient(created);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating patient:', error);
    }
  }, [addPatient]);
  
  const onOpenRecord = useCallback((p) => { setSelectedPatient(p); setShowRecordModal(true); }, []);

  const handleLoginSuccess = useCallback(() => setAuthed(true), []);
  const handleLogout = useCallback(() => {
    try { localStorage.removeItem('token'); } catch (e) {}
    setAuthed(false);
  }, []);

  if (!authed) {
    return <LoginView onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header title={currentView.charAt(0).toUpperCase() + currentView.slice(1)} setSidebarOpen={setSidebarOpen} />
        
        {/* Show error banner if there's an error loading patients */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
            <div className="flex justify-between items-center">
              <span>Error cargando pacientes: {error}</span>
              <button 
                onClick={refreshPatients}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              dashboardSearchTerm={dashboardSearchTerm}
              setDashboardSearchTerm={setDashboardSearchTerm}
              onAddPatient={openAddPatient}
              onViewPatient={onViewPatient}
              onOpenRecord={onOpenRecord}
              patients={patients}
              loading={loading}
            />
          )}
          {currentView === 'turnos' && <TurnosView />}
          {currentView === 'pacientes' && (
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
        </main>
      </div>

      {/* Modales */}
      <PatientProfileModal open={showProfileModal} patient={selectedPatient} onClose={closeProfile} onEdit={onEditFromProfile} onMessage={onMessageFromProfile} />
      <EditPatientModal open={showEditModal} patient={selectedPatient} onClose={() => setShowEditModal(false)} onSaved={onSavedPatient} loading={loading} />
      <MessagePatientModal open={showMessageModal} patient={selectedPatient} onClose={() => setShowMessageModal(false)} />
      <AddPatientModal open={showAddModal} onClose={closeAddPatient} onCreated={onCreatedPatient} loading={loading} />
      <ClinicalRecordModal open={showRecordModal} patient={selectedPatient} onClose={() => setShowRecordModal(false)} />
    </div>
  );
}