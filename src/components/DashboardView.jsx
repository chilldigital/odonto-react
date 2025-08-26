import React, { useMemo, useCallback } from 'react';
import { Eye } from 'lucide-react';
import { mockData } from '../data/mockData';
import StatsCard from './StatsCard';
import SearchInput from './SearchInput';
import PatientTable from './PatientTable';

export default function DashboardView({ 
  dashboardSearchTerm, 
  setDashboardSearchTerm, 
  onAddPatient, 
  onViewPatient, 
  onOpenRecord, 
  patients = [],
  loading = false 
}) {
  const filteredPacientes = useMemo(() => {
    if (!dashboardSearchTerm.trim()) return patients.slice(0, 4);
    return patients.filter(p => 
      p.nombre?.toLowerCase().includes(dashboardSearchTerm.toLowerCase())
    ).slice(0, 4);
  }, [dashboardSearchTerm, patients]);

  const handleSearchChange = useCallback((e) => setDashboardSearchTerm(e.target.value), [setDashboardSearchTerm]);

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <StatsCard title="Turnos de hoy" value={mockData.stats.turnosHoy} color="text-teal-600" />
        <StatsCard title="Turnos de la semana" value={mockData.stats.turnosSemana} color="text-gray-900" />
        <StatsCard title="Pacientes" value={loading ? "..." : patients.length} color="text-gray-900" />
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
                    <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
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
            <h2 className="text-lg font-semibold text-gray-800">
              Pacientes
              {loading && (
                <span className="ml-2 text-sm text-gray-500">(Cargando...)</span>
              )}
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <SearchInput 
                value={dashboardSearchTerm} 
                onChange={handleSearchChange} 
                placeholder="Buscar paciente" 
              />
              <button 
                onClick={onAddPatient} 
                disabled={loading}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
              <p className="mt-2 text-gray-500">Cargando pacientes...</p>
            </div>
          ) : (
            <PatientTable 
              patients={filteredPacientes} 
              onView={onViewPatient} 
              onOpenRecord={onOpenRecord} 
            />
          )}
        </div>
      </div>
    </div>
  );
}