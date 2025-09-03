// src/utils/appointments.js
// Utilidades relacionadas a turnos

export function combineDateTimeToISO(fecha, hora, tz = 'America/Argentina/Buenos_Aires') {
  if (!fecha || !hora) return null;
  try {
    // Parsear fecha como LOCAL (evitar new Date('YYYY-MM-DD') que asume UTC)
    const [yStr, mStr, dStr] = String(fecha).split('-');
    const [hhStr = '00', mmStr = '00'] = String(hora).split(':');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10) - 1; // 0-based
    const d = parseInt(dStr, 10);
    const hh = parseInt(hhStr, 10) || 0;
    const mm = parseInt(mmStr, 10) || 0;
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    const local = new Date(y, m, d, hh, mm, 0, 0);
    // Devolvemos ISO en UTC. El backend puede usar 'timezone' si lo requiere.
    return local.toISOString();
  } catch {
    return null;
  }
}

export function formatDate(dateLike, opts) {
  if (!dateLike) return 'Sin fecha';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return 'Fecha inválida';
  const formatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    ...(opts || {}),
  };
  return d.toLocaleDateString('es-AR', formatOptions);
}

export function formatTime(dateLike, opts) {
  if (!dateLike) return 'Sin hora';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return 'Hora inválida';
  const formatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...(opts || {}),
  };
  return d.toLocaleTimeString('es-AR', formatOptions);
}

// Normaliza distintos formatos de objetos de turno a un esquema común
export function normalizeTurno(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const turno = { ...raw };
  const normalized = {
    id: turno.id || turno._id || turno.eventId || null,
    title: turno.title || turno.summary || turno.tipoTurnoNombre || 'Consulta',
    start: turno.start || turno.startTime || null,
    end: turno.end || turno.endTime || null,
    description: turno.description || turno.notas || '',
    location: turno.location || turno.ubicacion || '',
    status: turno.status || turno.estado || 'pending',

    patientName: turno.patientName || turno.paciente || turno.nombre || '',
    patientPhone: turno.patientPhone || turno.telefono || turno.phone || '',
    patientDni: turno.patientDni || turno.dni || '',

    obraSocial: turno.obraSocial || '',
    numeroAfiliado: turno.numeroAfiliado || '',
    alergias: turno.alergias || '',
    antecedentes: turno.antecedentes || '',
  };
  return normalized;
}
