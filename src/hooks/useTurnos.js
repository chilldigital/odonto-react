// src/hooks/useTurnos.js
import { useState, useCallback, useEffect } from 'react';
import { URL_CALENDAR_EVENTS } from '../config/n8n';

export function useTurnos(fromDate = null, toDate = null) {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTurnos = useCallback(async (from = null, to = null) => {
    setLoading(true);
    setError('');

    try {
      // Si no se proporcionan fechas, usar valores por defecto
      let fromISO, toISO;
      
      if (from && to) {
        // Usar las fechas proporcionadas asegurando orden y límites del día
        const parseYMD = (s) => {
          if (!s) return null;
          const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (m) {
            return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
          }
          // Fallback a Date() nativo si viene con tiempo
          return new Date(s);
        };

        let startDate = parseYMD(from);
        let endDate = parseYMD(to);
        // Normalizar límites del día en hora local
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        // Asegurar orden correcto (from <= to)
        if (startDate > endDate) {
          const tmp = startDate;
          startDate = endDate;
          endDate = tmp;
        }
        fromISO = startDate.toISOString();
        toISO = endDate.toISOString();
      } else {
        // Valores por defecto: hoy + próximos 7 días
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(23, 59, 59, 999);

        fromISO = today.toISOString();
        toISO = nextWeek.toISOString();
      }

      const timeZone = 'America/Argentina/Buenos_Aires';
      const url = `${URL_CALENDAR_EVENTS}?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}&timeZone=${encodeURIComponent(timeZone)}`;
      
      console.log('🔄 Actualizando turnos:', { from: fromISO, to: toISO });
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const events = data.events || [];
      
      console.log('✅ Turnos actualizados:', events.length);
      setTurnos(events);
      
    } catch (err) {
      console.error('❌ Error fetching turnos:', err);
      setError('No se pudieron cargar los turnos: ' + err.message);
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para refrescar con nuevas fechas
  const refreshTurnos = useCallback((newFromDate = null, newToDate = null) => {
    const from = newFromDate || fromDate;
    const to = newToDate || toDate;
    fetchTurnos(from, to);
  }, [fetchTurnos, fromDate, toDate]);

  // Cargar turnos inicialmente
  useEffect(() => {
    fetchTurnos(fromDate, toDate);
  }, [fetchTurnos, fromDate, toDate]);

  return {
    turnos,
    loading,
    error,
    refreshTurnos,
    fetchTurnos
  };
}
