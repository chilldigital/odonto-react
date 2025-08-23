import React, { useMemo } from 'react';
import SearchInput from './SearchInput';
import PatientTable from './PatientTable';

export default function PacientesView({ searchTerm, setSearchTerm, onAddPatient, onViewPatient, onOpenRecord, patients }) {
  const filteredPacientes = useMemo(() =>
    patients.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())),
  [searchTerm, patients]);

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 lg:p-6 border-b flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <h2 className="text-lg font-semibold text-gray-800">Pacientes</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <SearchInput value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Buscar paciente" />
            <button onClick={onAddPatient} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors w-full sm:w-auto">Agregar</button>
          </div>
        </div>
        <PatientTable patients={filteredPacientes} onView={onViewPatient} onOpenRecord={onOpenRecord} />
      </div>
    </div>
  );
}