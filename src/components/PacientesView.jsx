import React, { useMemo, useEffect, useState } from 'react';
import SearchInput from './SearchInput';
import PatientTable from './PatientTable';

// Traemos las URLs desde el config si existen (fallback seguro si aún no están creadas)
let URL_LIST_PATIENTS = '';
try {
  // ruta relativa desde /components
  // si no existe el archivo, el try/catch evita romper el build
  const cfg = require('../config/n8n');
  URL_LIST_PATIENTS = cfg.URL_LIST_PATIENTS || cfg.URL_GCAL_EVENTS || '';
} catch (_) {
  // sin config de n8n aún
}

// Función auxiliar para mapear la respuesta del webhook a la forma usada por la UI
const mapToUi = (rows = []) =>
  rows.map((r) => ({
    id: r.id || r.recordId || r.ID || crypto.randomUUID?.() || String(Math.random()),
    nombre: r.nombre || r.name || r.Nombre || '',
    obraSocial: r.obraSocial || r.insurance || r['Obra Social'] || '',
    historiaClinica: r.historiaClinica || r.clinicalRecord || '',
    ultimaVisita: r.ultimaVisita || r.lastVisit || r['Última Visita'] || '',
  }));

export default function PacientesView({
  searchTerm,
  setSearchTerm,
  onAddPatient,
  onViewPatient,
  onOpenRecord,
  patients, // si viene desde el padre, lo privilegiamos
  setPatients, // opcional: si el padre expone setter, lo usamos para push del nuevo paciente
  fetchFromN8n = true, // permite desactivar el fetch automático si el padre ya maneja datos
}) {
  const [localPatients, setLocalPatients] = useState([]);

  // 1) Fetch inicial desde n8n si no recibimos pacientes por props
  useEffect(() => {
    const shouldFetch = !patients && fetchFromN8n && URL_LIST_PATIENTS;
    if (!shouldFetch) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(URL_LIST_PATIENTS, { method: 'GET' });
        const data = await res.json();
        if (!cancelled) setLocalPatients(mapToUi(Array.isArray(data) ? data : data?.records || []));
      } catch (err) {
        console.error('Error listando pacientes desde n8n:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [patients, fetchFromN8n]);

  // 2) Suscripción a evento global para insertar el nuevo paciente tras crear
  //    (AddPatientModal puede despachar: window.dispatchEvent(new CustomEvent('patient:created', { detail })) )
  useEffect(() => {
    const handler = (e) => {
      const nuevo = e?.detail;
      if (!nuevo) return;
      if (typeof setPatients === 'function') {
        setPatients((prev = []) => [nuevo, ...prev]);
      } else {
        setLocalPatients((prev) => [nuevo, ...prev]);
      }
    };

    window.addEventListener('patient:created', handler);
    return () => window.removeEventListener('patient:created', handler);
  }, [setPatients]);

  const dataSource = patients ?? localPatients;

  const filteredPacientes = useMemo(
    () =>
      (dataSource || []).filter((p) =>
        (p?.nombre || '').toLowerCase().includes((searchTerm || '').toLowerCase())
      ),
    [searchTerm, dataSource]
  );

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 lg:p-6 border-b flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <h2 className="text-lg font-semibold text-gray-800">Pacientes</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm?.(e.target.value)}
              placeholder="Buscar paciente"
            />
            <button
              onClick={onAddPatient}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors w-full sm:w-auto"
            >
              Agregar
            </button>
          </div>
        </div>
        <PatientTable
          patients={filteredPacientes}
          onView={onViewPatient}
          onOpenRecord={onOpenRecord}
        />
      </div>
    </div>
  );
}