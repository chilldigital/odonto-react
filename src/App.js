import React, { useState, useCallback } from 'react';
import './App.css';

import { initialPatients } from './data/mockData';

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

  const [patients, setPatients] = useState(initialPatients);

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

  const onSavedPatient = useCallback((updated) => {
    setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPatient(updated);
  }, []);

  const openAddPatient = useCallback(() => setShowAddModal(true), []);
  const closeAddPatient = useCallback(() => setShowAddModal(false), []);
  const onCreatedPatient = useCallback((created) => { setPatients(prev => [created, ...prev]); }, []);
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
        <main className="flex-1 overflow-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              dashboardSearchTerm={dashboardSearchTerm}
              setDashboardSearchTerm={setDashboardSearchTerm}
              onAddPatient={openAddPatient}
              onViewPatient={onViewPatient}
              onOpenRecord={onOpenRecord}
              patients={patients}
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
            />
          )}
        </main>
      </div>

      {/* Modales */}
      <PatientProfileModal open={showProfileModal} patient={selectedPatient} onClose={closeProfile} onEdit={onEditFromProfile} onMessage={onMessageFromProfile} />
      <EditPatientModal open={showEditModal} patient={selectedPatient} onClose={() => setShowEditModal(false)} onSaved={onSavedPatient} />
      <MessagePatientModal open={showMessageModal} patient={selectedPatient} onClose={() => setShowMessageModal(false)} />
      <AddPatientModal open={showAddModal} onClose={closeAddPatient} onCreated={onCreatedPatient} />
      <ClinicalRecordModal open={showRecordModal} patient={selectedPatient} onClose={() => setShowRecordModal(false)} />
    </div>
  );
}