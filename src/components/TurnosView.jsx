// src/components/TurnosView.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Calendar, RefreshCcw, ExternalLink, Plus } from 'lucide-react';
import { URL_CALENDAR_EVENTS } from '../config/n8n';

// Helpers de fechas (sin librerías)
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const endOfDay   = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
const addDays    = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

const startOfWeek = (d) => {
  const x = new Date(d);
  // semana inicia Lunes
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0,0,0,0);
  return x;
};
const endOfWeek = (d) => {
  const s = startOfWeek(d);
  const e = addDays(s, 6);
  e.setHours(23,59,59,999);
  return e;
};

const fmtDay = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: '2-digit', month: 'long' });
const fmtTime = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' });

function groupByDate(events) {
  const by = {};
  for (const ev of events) {
    const dayKey = (ev.start || ev.startTime || ev.startDate || ev.start_at);
    if (!dayKey) continue; // Skip events without start time
    
    const d = new Date(dayKey);
    if (isNaN(d.getTime())) continue; // Skip invalid dates
    
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    if (!by[key]) by[key] = [];
    by[key].push(ev);
  }
  // ordenar por hora
  for (const k of Object.keys(by)) {
    by[k].sort((a,b)=> {
      const startA = new Date(a.start || a.startTime);
      const startB = new Date(b.start || b.startTime);
      return startA - startB;
    });
  }
  return Object.keys(by).sort().map(k => ({ date: new Date(k), items: by[k] }));
}

export default function TurnosView() {
  const [mode, setMode] = useState('agenda'); // agenda | semana | dia
  const [baseDate, setBaseDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // rango según modo
  const range = useMemo(() => {
    if (mode === 'dia') {
      return { from: startOfDay(baseDate), to: endOfDay(baseDate) };
    }
    if (mode === 'semana') {
      return { from: startOfWeek(baseDate), to: endOfWeek(baseDate) };
    }
    // agenda: hoy + próximos 7 días (desde baseDate)
    return { from: startOfDay(baseDate), to: endOfDay(addDays(baseDate, 6)) };
  }, [mode, baseDate]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Formatear fechas para el webhook
      const fromISO = range.from.toISOString();
      const toISO = range.to.toISOString();
      const timeZone = 'America/Argentina/Buenos_Aires';
      
      const url = `${URL_CALENDAR_EVENTS}?from=${fromISO}&to=${toISO}&timeZone=${timeZone}`;
      
      console.log(`📅 Solicitando ${mode}:`, {
        from: range.from.toLocaleDateString('es-AR'),
        to: range.to.toLocaleDateString('es-AR'),
        url
      });
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Eventos recibidos para ${mode}:`, data.events?.length || 0);
      
      setEvents(data.events || []);
      
    } catch (err) {
      setError('No se pudieron cargar los turnos: ' + err.message);
      console.error('❌ Error fetching events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [range, mode]); // Añadido mode como dependencia para debug

  useEffect(() => { 
    fetchEvents(); 
  }, [fetchEvents]);

  const grouped = useMemo(() => groupByDate(events), [events]);

  const calLink = process.env.REACT_APP_CAL_LINK || 'https://cal.com/chill-digital/consulta-general';

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-4 lg:p-6 border-b flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="text-teal-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Calendario</h2>
            {process.env.NODE_ENV === 'development' && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {mode} | {events.length} eventos
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tabs */}
            <div className="inline-flex rounded-lg border bg-gray-50 overflow-hidden">
              {['agenda','semana','dia'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-2 text-sm transition-colors ${
                    mode===m ? 'bg-white text-teal-700 font-medium shadow-sm' : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  {m === 'agenda' ? 'Agenda' : m === 'semana' ? 'Semana' : 'Día'}
                </button>
              ))}
            </div>

            {/* Nuevo turno */}
            <a
              href={calLink}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-teal-700 transition-colors"
            >
              <Plus size={16} /> Nuevo turno
            </a>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 lg:p-6">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCcw size={16} className="animate-spin" />
              Cargando turnos para {mode === 'agenda' ? 'agenda' : mode === 'semana' ? 'la semana' : 'el día'}…
            </div>
          )}
          
          {!loading && error && (
            <div className="p-4 rounded-lg border text-sm bg-red-50 text-red-900 border-red-200">
              {error}
            </div>
          )}

          {!loading && !error && grouped.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar size={48} className="mx-auto mb-3 opacity-50" />
              <p>No hay turnos programados para este período</p>
              <p className="text-sm mt-2">
                {mode === 'dia' && 'Intenta cambiar de día o revisar la semana completa'}
                {mode === 'semana' && 'Intenta cambiar de semana o revisar la agenda general'}
                {mode === 'agenda' && 'Intenta cambiar el período de la agenda'}
              </p>
              <a
                href={calLink}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-teal-600 hover:text-teal-700 text-sm transition-colors"
              >
                <Plus size={16} /> Programar nuevo turno
              </a>
            </div>
          )}

          {!loading && !error && grouped.map(({ date, items }) => (
            <div key={date.toISOString()} className="mb-5">
              <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                {fmtDay.format(date)}
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                  {items.length} turno{items.length !== 1 ? 's' : ''}
                </span>
              </div>
              <ul className="space-y-2">
                {items.map(ev => {
                  const start = new Date(ev.start || ev.startTime);
                  const end = ev.end ? new Date(ev.end) : null;
                  const title = ev.title || ev.summary || 'Turno';
                  const who = ev.patientName || ev.paciente || '';
                  const small = ev.description || ev.location || '';
                  
                  // Validar que la fecha sea válida
                  if (isNaN(start.getTime())) {
                    return null;
                  }
                  
                  return (
                    <li key={ev.id || `${start.toISOString()}-${title}`} className="p-3 border rounded-lg hover:bg-gray-50 flex items-start justify-between transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="mt-1 inline-block w-2.5 h-2.5 rounded-full bg-teal-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-gray-900 text-sm font-medium">
                            {fmtTime.format(start)}
                            {end && !isNaN(end.getTime()) ? ` – ${fmtTime.format(end)}` : ''} · {title}{who ? ` — ${who}` : ''}
                          </div>
                          {small && (
                            <div className="text-xs text-gray-600 mt-0.5 break-words">{small}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {ev.htmlLink && ev.htmlLink !== '#' && (
                          <a
                            href={ev.htmlLink}
                            target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            title="Abrir en Google Calendar"
                          >
                            <ExternalLink size={16} />
                            <span className="hidden sm:inline">Abrir</span>
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}