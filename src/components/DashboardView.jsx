import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Eye, ArrowRight, Calendar, RefreshCcw, User } from 'lucide-react';
import { URL_CALENDAR_EVENTS } from '../config/n8n';
import StatsCard from './StatsCard';
import SearchInput from './SearchInput';
import PatientTable from './PatientTable';
import { Link } from 'react-router-dom';

// Hook para obtener próximos turnos
function useUpcomingTurnos() {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTurnos = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Obtener turnos de hoy + próximos 7 días
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(23, 59, 59, 999);

      const fromISO = today.toISOString();
      const toISO = nextWeek.toISOString();
      const timeZone = 'America/Argentina/Buenos_Aires';
      
      const url = `${URL_CALENDAR_EVENTS}?from=${fromISO}&to=${toISO}&timeZone=${timeZone}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const events = data.events || [];
      
      // Convertir a formato para el dashboard
      const formattedTurnos = events
        .filter(event => {
          const startDate = new Date(event.start || event.startTime);
          return !isNaN(startDate.getTime()) && startDate >= today;
        })
        .map(event => {
          const start = new Date(event.start || event.startTime);
          const end = event.end ? new Date(event.end) : null;
          
          const fmtDate = new Intl.DateTimeFormat('es-AR', { 
            weekday: 'long', 
            day: '2-digit', 
            month: 'long' 
          });
          const fmtTime = new Intl.DateTimeFormat('es-AR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          return {
            id: event.id,
            fecha: fmtDate.format(start),
            hora: `${fmtTime.format(start)} hs${end && !isNaN(end.getTime()) ? ` - ${fmtTime.format(end)} hs` : ''}`,
            paciente: event.patientName || event.paciente || 'Sin nombre',
            tipo: event.title || event.summary || 'Consulta',
            startDate: start,
            htmlLink: event.htmlLink
          };
        })
        .sort((a, b) => a.startDate - b.startDate)
        .slice(0, 3); // Mostrar solo los próximos 3
      
      setTurnos(formattedTurnos);
      
    } catch (err) {
      console.error('Error fetching upcoming turnos:', err);
      setError('No se pudieron cargar los turnos: ' + err.message);
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTurnos();
    
    // Actualizar turnos automáticamente cada 5 minutos
    const interval = setInterval(fetchTurnos, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchTurnos]);

  return { turnos, loading, error };
}

export default function DashboardView({ 
  dashboardSearchTerm, 
  setDashboardSearchTerm, 
  onAddPatient, 
  onViewPatient, 
  onOpenRecord,
  onOpenBooking, // Nueva prop para abrir el modal de turnos
  patients = [],
  latestPatients = [],
  loading: patientsLoading = false 
}) {
  // Hook para turnos
  const { turnos, loading: turnosLoading, error: turnosError } = useUpcomingTurnos();

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
      if (typeof p._createdAt === 'number') return p._createdAt;
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

    if (!term) {
      if (latestPatients && latestPatients.length) {
        return latestPatients.slice(0, 4);
      }
      return base.sort((a, b) => ts(b) - ts(a)).slice(0, 4);
    }

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

  // Stats dinámicos
  const turnosHoy = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return turnos.filter(turno => {
      if (turno.startDate) {
        return turno.startDate >= today && turno.startDate < tomorrow;
      }
      return false;
    }).length;
  }, [turnos]);

  const turnosSemana = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return turnos.filter(turno => {
      if (turno.startDate) {
        return turno.startDate >= today && turno.startDate < nextWeek;
      }
      return false;
    }).length;
  }, [turnos]);

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <StatsCard 
          title="Turnos de hoy" 
          value={turnosLoading ? "..." : turnosHoy} 
          color="text-teal-600" 
        />
        <StatsCard 
          title="Turnos de la semana" 
          value={turnosLoading ? "..." : turnosSemana} 
          color="text-gray-900" 
        />
        <StatsCard 
          title="Pacientes" 
          value={patientsLoading ? "..." : patients.length} 
          color="text-gray-900" 
        />
      </div>

      <div className="space-y-6 lg:space-y-8">
        {/* Sección de Próximos Turnos */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 lg:p-6 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800">Próximos Turnos</h2>
              <Link
                to="/turnos"
                className="inline-flex items-center text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                Ver todos
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Cambiar el enlace externo por el botón del modal */}
              <button
                onClick={onOpenBooking}
                className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Calendar size={14} />
                Nuevo
              </button>
            </div>
          </div>
          
          <div className="p-4 lg:p-6">
            {turnosLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <RefreshCcw size={16} className="animate-spin" />
                Cargando turnos...
              </div>
            )}
            
            {!turnosLoading && turnosError && (
              <div className="p-4 rounded-lg border text-sm bg-red-50 text-red-900 border-red-200 mb-4">
                {turnosError}
              </div>
            )}
            
            {!turnosLoading && !turnosError && turnos.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay turnos programados para los próximos días</p>
                <button
                  onClick={onOpenBooking}
                  className="inline-flex items-center gap-1 mt-2 text-teal-600 hover:text-teal-700 text-sm"
                >
                  <Calendar size={14} />
                  Agendar turno
                </button>
              </div>
            )}
            
            {!turnosLoading && turnos.length > 0 && (
              <div className="space-y-4">
                {turnos.map((turno) => (
                  <div key={turno.id} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-500 capitalize">{turno.fecha}</p>
                        <p className="text-sm text-gray-500">{turno.hora}</p>
                      </div>
                    </div>
                    <div className="flex-1 sm:ml-4">
                      <p className="font-medium text-gray-900">{turno.paciente}</p>
                      <p className="text-sm text-gray-500">{turno.tipo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {turno.htmlLink && turno.htmlLink !== '#' && (
                        <a
                          href={turno.htmlLink}
                          target="_blank" 
                          rel="noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                          title="Abrir en Google Calendar"
                        >
                          <Eye size={16} />
                        </a>
                      )}
                      {(!turno.htmlLink || turno.htmlLink === '#') && (
                        <button 
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => console.log('Ver turno:', turno)}
                        >
                          <Eye size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sección de Últimos Pacientes */}
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
                disabled={patientsLoading}
                className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <User size={14} />
                Nuevo
              </button>
            </div>
          </div>
          
          {patientsLoading ? (
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