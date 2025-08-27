import React, { useMemo, useCallback } from 'react';
import { Eye, ArrowRight } from 'lucide-react';
import { mockData } from '../data/mockData';
import StatsCard from './StatsCard';
import SearchInput from './SearchInput';
import PatientTable from './PatientTable';
import { Link } from 'react-router-dom';

export default function DashboardView({ 
  dashboardSearchTerm, 
  setDashboardSearchTerm, 
  onAddPatient, 
  onViewPatient, 
  onOpenRecord, 
  patients = [],
  latestPatients = [],
  loading = false 
}) {
  const filteredPacientes = useMemo(() => {
    const term = (dashboardSearchTerm || '').trim().toLowerCase();

    function toTs(raw) {
      if (!raw) return 0;
      if (typeof raw === 'number') return raw;
      if (raw instanceof Date) return raw.getTime();
      if (typeof raw === 'string') {
        const isoTs = Date.parse(raw);
        if (!Number.isNaN(isoTs)) return isoTs;
        const m = raw.replace(/\s/g, '').match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
        if (m) {
          const d = parseInt(m[1], 10);
          const mo = parseInt(m[2], 10);
          const y = m[3];
          const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
          return new Date(year, mo - 1, d).getTime();
        }
      }
      return 0;
    }

    function ts(p) {
      if (!p) return 0;
      if (typeof p._createdAt === 'number') return p._createdAt; // preferimos timestamp normalizado desde App
      let raw = null;
      if (p.fechaRegistro) raw = p.fechaRegistro;
      else if (p['Fecha Registro']) raw = p['Fecha Registro'];
      else if (p.createdTime) raw = p.createdTime;
      else if (p.created_at) raw = p.created_at;
      else if (p.createdAt) raw = p.createdAt;
      else if (p.fields) {
        if (p.fields['Fecha Registro']) raw = p.fields['Fecha Registro'];
        else if (p.fields.createdTime) raw = p.fields.createdTime;
      }
      return toTs(raw);
    }

    const base = patients ? patients.slice() : [];

    // Sin búsqueda: usamos latestPatients si viene desde App ya ordenado; si no, ordenamos por fecha desc
    if (!term) {
      if (latestPatients && latestPatients.length) {
        return latestPatients.slice(0, 4);
      }
      return base.sort((a, b) => ts(b) - ts(a)).slice(0, 4);
    }

    // Con búsqueda: filtramos y ordenamos por fecha desc para mantener la noción de "más recientes"
    return base
      .filter((p) => {
        const name = (p && p.nombre) ? p.nombre : '';
        return name.toLowerCase().indexOf(term) !== -1;
      })
      .sort((a, b) => ts(b) - ts(a))
      .slice(0, 4);
  }, [dashboardSearchTerm, patients, latestPatients]);

  const showViewAll = useMemo(
    () => !(dashboardSearchTerm || '').trim() && patients.length > 4,
    [dashboardSearchTerm, patients]
  );

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
          <div className="p-4 lg:p-6 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Próximos Turnos</h2>
            <Link
              to="/turnos"
              className="inline-flex items-center text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              Ver todos
              <ArrowRight size={16} className="ml-1" />
            </Link>
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
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                Últimos pacientes
              </h2>
              {showViewAll && (
                <Link
                  to="/pacientes"
                  className="inline-flex items-center text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  Ver todos
                  <ArrowRight size={16} className="ml-1" />
                </Link>
              )}
            </div>
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