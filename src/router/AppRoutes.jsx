import React, { useMemo, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import DashboardView from '../components/DashboardView';
import PacientesView from '../components/PacientesView';
import TurnosView from '../components/TurnosView';

import { useModals } from '../hooks/useModals';
import { URL_DELETE_PATIENT } from '../config/n8n';

export default function AppRoutes({ normalizedPatients = [], loading = false, refreshPatients }) {
  const navigate = useNavigate();
  const {
    openAddPatient,
    onViewPatient,
    onOpenRecord,
    openBookingModal,
    onViewTurno,
  } = useModals();

  // Local UI state moved from App.js
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState('');
  const [locallyDeleted, setLocallyDeleted] = useState([]);

  const patientsForViews = useMemo(() => (
    (Array.isArray(normalizedPatients) ? normalizedPatients : []).filter(p => {
      const id = p?.id || p?.airtableId || p?.recordId || p?._id;
      return id && !locallyDeleted.includes(id);
    })
  ), [normalizedPatients, locallyDeleted]);

  const latestPatients = useMemo(() => patientsForViews.slice(0, 4), [patientsForViews]);

  const handleDeletePatient = useCallback(async (patientData) => {
    try {
      const patient = typeof patientData === 'string' ?
        patientsForViews.find(p =>
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

      await refreshPatients?.();
      setLocallyDeleted(prev => prev.filter(k => k !== id));
    } catch (err) {
      const id = typeof patientData === 'string' ? patientData : (patientData?.id || patientData?.airtableId);
      if (id) setLocallyDeleted(prev => prev.filter(k => k !== id));
      throw err;
    }
  }, [refreshPatients, patientsForViews]);

  return (
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
            onOpenBooking={openBookingModal}
            onViewTurno={onViewTurno}
            patients={patientsForViews}
            latestPatients={latestPatients}
            loading={loading}
          />
        )}
      />
      <Route
        path="/turnos"
        element={<TurnosView onOpenBooking={openBookingModal} onViewTurno={onViewTurno} />}
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
            patients={patientsForViews}
            loading={loading}
            onDeletePatient={handleDeletePatient}
          />
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
