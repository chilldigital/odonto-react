// src/components/TurnosView.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Calendar, RefreshCcw, ExternalLink, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

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
    const d = new Date(dayKey);
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    if (!by[key]) by[key] = [];
    by[key].push(ev);
  }
  // ordenar por hora
  for (const k of Object.keys(by)) {
    by[k].sort((a,b)=> new Date(a.start) - new Date(b.start));
  }
  return Object.keys(by).sort().map(k => ({ date: new Date(k), items: by[k] }));
}

// Generador de eventos mock (sin backend)
function generateMockEvents(range) {
  const names = ['Benjamin Torres Lemos', 'Agustin Corbalan', 'Esteban Alvarez Farhat', 'Facundo Salado'];
  const obras = ['OSDE', 'Swiss Medical', 'Medicus', 'Medifé'];
  const titles = ['Consulta General', 'Arreglo de Caries', 'Extracción', 'Control'];
  const times = [
    [10, 30],
    [15, 0],
    [15, 30],
  ];

  const result = [];
  let day = new Date(range.from);
  while (day <= range.to) {
    const perDay = (day.getDay() % 2 === 0) ? 2 : 1; // 1-2 turnos por día
    for (let i = 0; i < perDay; i++) {
      const start = new Date(day);
      const [h, m] = times[i % times.length];
      start.setHours(h, m, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);
      const idx = (day.getDate() + i) % names.length;
      result.push({
        id: `${start.toISOString()}-${i}`,
        start: start.toISOString(),
        end: end.toISOString(),
        title: titles[idx % titles.length],
        patientName: names[idx],
        description: obras[idx],
        htmlLink: '#',
      });
    }
    day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  }
  return result;
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
    // agenda: hoy + próximos 7 días
    return { from: startOfDay(baseDate), to: endOfDay(addDays(baseDate, 6)) };
  }, [mode, baseDate]);

  const fetchEvents = useCallback(() => {
    setLoading(true);
    setError('');
    // Simulación de carga
    const data = generateMockEvents(range);
    setEvents(data);
    setLoading(false);
  }, [range]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const grouped = useMemo(() => groupByDate(events), [events]);

  // navegación de fechas
  const goToday = () => setBaseDate(new Date());
  const goPrev = () => setBaseDate(prev => mode === 'dia' ? addDays(prev,-1) : addDays(prev,-7));
  const goNext = () => setBaseDate(prev => mode === 'dia' ? addDays(prev, 1) : addDays(prev, 7));

  const calLink = process.env.REACT_APP_CAL_LINK || 'https://cal.com/chill-digital';

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-4 lg:p-6 border-b flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="text-teal-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Calendario</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tabs */}
            <div className="inline-flex rounded-lg border bg-gray-50 overflow-hidden">
              {['agenda','semana','dia'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-2 text-sm ${mode===m ? 'bg-white text-teal-700 font-medium' : 'text-gray-600 hover:bg-white'}`}
                >
                  {m === 'agenda' ? 'Agenda' : m === 'semana' ? 'Semana' : 'Día'}
                </button>
              ))}
            </div>

            {/* Navegación fecha */}
            <div className="flex items-center gap-1 ml-1">
              <button onClick={goPrev} className="p-2 rounded-lg border hover:bg-gray-50">
                <ChevronLeft size={16} />
              </button>
              <div className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg border">
                {mode === 'semana'
                  ? `${fmtDay.format(range.from)} — ${fmtDay.format(range.to)}`
                  : fmtDay.format(baseDate)}
              </div>
              <button onClick={goNext} className="p-2 rounded-lg border hover:bg-gray-50">
                <ChevronRight size={16} />
              </button>
              <button onClick={goToday} className="ml-1 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50">Hoy</button>
            </div>

            {/* Acciones */}
            <button
              onClick={fetchEvents}
              className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
              title="Sincronizar"
            >
              <RefreshCcw size={16} /> Sincronizar
            </button>
            <a
              href={calLink}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-teal-700"
            >
              <Plus size={16} /> Nuevo turno
            </a>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 lg:p-6">
          {loading && (
            <div className="text-sm text-gray-600">Cargando turnos…</div>
          )}
          {!loading && error && (
            <div className="p-4 rounded-lg border bg-yellow-50 text-yellow-900 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && grouped.length === 0 && (
            <div className="text-sm text-gray-600">No hay turnos en este rango.</div>
          )}

          {!loading && !error && grouped.map(({ date, items }) => (
            <div key={date.toISOString()} className="mb-5">
              <div className="text-sm font-semibold text-gray-700 mb-3">
                {fmtDay.format(date)}
              </div>
              <ul className="space-y-2">
                {items.map(ev => {
                  const start = new Date(ev.start || ev.startTime);
                  const end   = ev.end ? new Date(ev.end) : null;
                  const title = ev.title || ev.summary || 'Turno';
                  const who   = ev.patientName || ev.paciente || '';
                  const small = ev.description || ev.location || '';
                  return (
                    <li key={ev.id || `${start.toISOString()}-${title}`} className="p-3 border rounded-lg hover:bg-gray-50 flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="mt-1 inline-block w-2.5 h-2.5 rounded-full bg-teal-500" />
                        <div>
                          <div className="text-gray-900 text-sm font-medium">
                            {fmtTime.format(start)}
                            {end ? ` – ${fmtTime.format(end)}` : ''} · {title}{who ? ` — ${who}` : ''}
                          </div>
                          {small ? (
                            <div className="text-xs text-gray-600 mt-0.5">{small}</div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ev.htmlLink && (
                          <a
                            href={ev.htmlLink}
                            target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
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