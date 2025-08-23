# Dental Dashboard — README

Aplicación React para gestionar pacientes y turnos de un consultorio odontológico.  
El proyecto está organizado en componentes, integra **n8n** para el backend sin servidor, **Airtable** para datos de pacientes y **Google Calendar** (vía **cal.com**) para turnos.  

> **Objetivo:** mantener una UI simple (Dashboard, Turnos, Pacientes) con modales para ver, editar, crear y mensajear pacientes, y con un calendario que lee eventos desde Google Calendar.

---

## 🧱 Requisitos

- Node.js ≥ 18
- npm o yarn
- Cuenta n8n con acceso a:
  - **Airtable** (para pacientes)
  - **Google Calendar** (para lectura de eventos)
- **cal.com** conectado al **Google Calendar** del profesional
- (Opcional) repositorio en GitHub

Instalación de dependencias (si usás las librerías del proyecto):
```bash
npm i
npm i lucide-react
```

---

## 🚀 Puesta en marcha

1) Crear archivo `.env` en la raíz del proyecto:
```
REACT_APP_N8N_BASE=https://tu-n8n.dominio.com
REACT_APP_CAL_LINK=https://cal.com/tu-usuario
```
2) Ejecutar en desarrollo:
```bash
npm start
```
3) Build para producción:
```bash
npm run build
```

---

## 🗂️ Estructura del proyecto

```
src/
├─ App.js                 # Orquesta vistas, estado global y modales
├─ App.css
├─ config/
│  └─ n8n.js              # Endpoints centralizados de n8n
├─ data/
│  └─ mockData.js         # Pacientes de ejemplo y próximos turnos (mock)
├─ utils/
│  └─ helpers.js          # helpers (initials, cls)
└─ components/
   ├─ Sidebar.jsx
   ├─ Header.jsx
   ├─ StatsCard.jsx
   ├─ SearchInput.jsx
   ├─ PatientTable.jsx
   ├─ ModalShell.jsx
   ├─ TextInput.jsx
   ├─ Chip.jsx
   ├─ PatientProfileModal.jsx
   ├─ EditPatientModal.jsx
   ├─ AddPatientModal.jsx
   ├─ MessagePatientModal.jsx
   ├─ DashboardView.jsx
   ├─ PacientesView.jsx
   └─ TurnosView.jsx
```

**App.js** mantiene:
- Vista activa (`dashboard` | `turnos` | `pacientes`)
- Listado de pacientes (estado local, se actualiza al crear/editar)
- Búsquedas (dashboard y pacientes)
- Manejo de modales (ver, editar, crear, mensaje)

---

## 🔌 Configuración de endpoints (n8n)

Archivo: `src/config/n8n.js`

```js
export const N8N_BASE = process.env.REACT_APP_N8N_BASE || 'http://localhost:5678';
export const URL_UPDATE_PATIENT = `${N8N_BASE}/webhook/update-patient`;
export const URL_SEND_MESSAGE  = `${N8N_BASE}/webhook/send-message`;
export const URL_CREATE_PATIENT = `${N8N_BASE}/webhook/create-patient`;
```

> **Recomendación:** proteger Webhooks de n8n con token (query o header) y validación.

---

## 📄 Contratos de API (n8n)

### 1) Crear paciente
**Frontend → n8n**  
`POST /webhook/create-patient`
```json
{
  "nombre": "Juan Pérez",
  "obraSocial": "OSDE",
  "telefono": "+54 11 5555 5555",
  "email": "juan@ejemplo.com",
  "direccion": "CABA"
}
```
**n8n → Frontend** (sugerido)
```json
{
  "id": 123,
  "airtableId": "recXXX",
  "data": { "ultimaVisita": "-" }
}
```

### 2) Editar paciente
**Frontend → n8n**  
`POST /webhook/update-patient`
```json
{
  "airtableId": "recXXX",
  "nombre": "Juan Pérez",
  "obraSocial": "OSDE",
  "telefono": "...",
  "email": "...",
  "direccion": "..."
}
```

### 3) Mensaje a paciente
**Frontend → n8n**  
`POST /webhook/send-message`
```json
{
  "airtableId": "recXXX",
  "toPhone": "+54 11 5555 5555",
  "toEmail": "juan@ejemplo.com",
  "channel": "whatsapp",
  "message": "Hola Juan, te recuerdo tu turno de mañana."
}
```

> Estos webhooks se conectan con **Airtable** (crear/editar) y con tu proveedor de **WhatsApp/Email** para el envío (Twilio, SMTP, etc.).

---

## 📅 Google Calendar (lectura) + cal.com (creación)

- **Creación de turnos:** se hace en **cal.com**, ya vinculado con el Google Calendar del profesional. La UI expone un botón **“Nuevo turno”** (usa `REACT_APP_CAL_LINK`).  
- **Lectura de turnos:** se recomienda un workflow n8n **`/webhook/gcal-events`** que llame a **Google Calendar → Get Many** y devuelva `{ events: [...] }` al frontend.  
- El componente `TurnosView` consulta ese webhook con un rango (día / semana / mes) y muestra la lista agrupada por fecha. Un botón **“Sincronizar”** vuelve a pedir los eventos.

**Sugerencia de query**:  
`GET /webhook/gcal-events?from=2025-08-01T00:00:00Z&to=2025-08-31T23:59:59Z&timeZone=America/Argentina/Buenos_Aires`

**Formato esperado en respuesta:**
```json
{
  "events": [
    {
      "id": "abc123",
      "title": "Consulta",
      "description": "Paciente: ...",
      "start": "2025-08-20T15:00:00-03:00",
      "end": "2025-08-20T15:30:00-03:00",
      "location": "Consultorio",
      "attendees": ["paciente@mail.com"],
      "htmlLink": "https://calendar.google.com/...",
      "hangoutLink": "https://meet.google.com/..."
    }
  ]
}
```

---

## 🧩 Componentes y responsabilidades

- **Sidebar / Header**: navegación y encabezado.
- **StatsCard**: KPIs del Dashboard.
- **SearchInput**: input controlado (previene perder foco al tipear).
- **PatientTable**: tabla de pacientes con acción *ver*.
- **ModalShell**: layout base para modales.
- **PatientProfileModal**: datos del paciente + acciones *Editar* / *Mensaje*.
- **EditPatientModal**: formulario editable → `URL_UPDATE_PATIENT`.
- **AddPatientModal**: alta de paciente → `URL_CREATE_PATIENT`.
- **MessagePatientModal**: canal (WhatsApp/Email) + texto → `URL_SEND_MESSAGE`.
- **DashboardView**: KPIs + próximos turnos (mock) + pacientes (top 4).
- **PacientesView**: buscador + tabla completa.
- **TurnosView**: calendario liviano (lista por día/semana/mes) + botón **Nuevo turno** y **Sincronizar**.

---

## 🔒 Seguridad

- Usar **token** en Webhooks de n8n (header `x-api-key` o query `?token=...`).
- CORS: permitir sólo el dominio de tu app.
- No exponer credenciales en el front; todo correo/WhatsApp se envía desde n8n.

---

## 🧪 Consejos de testing

- Mockear respuestas de n8n en desarrollo (ej.: `msw` o JSON locales).
- Probar validación mínima en *Add/Edit* (nombre requerido, email/phone opcionales).
- Simular errores de red para chequear feedback de UI.

---

## 🛠️ Flujo de desarrollo recomendado

1. **Crear rama** de feature:
   ```bash
   git checkout -b feat/nombre-feature
   ```
2. **Desarrollar** y **commit** atómico:
   ```bash
   git add .
   git commit -m "feat: agregar modal de creación de pacientes"
   ```
3. **Push** a GitHub y abrir **PR**:
   ```bash
   git push -u origin feat/nombre-feature
   ```

---

## 🧩 Extensiones futuras

- Sustituir lista del calendario por **FullCalendar** con grilla Día/Semana/Mes.
- Plantillas de mensajes (recordatorio, seguimiento).
- Subida de archivos (recetas/presupuestos) → Airtable Attachments vía n8n.
- Internacionalización (i18n) y formatos locales de fecha/hora configurables.

---

## 📋 Checklist rápida

- [ ] `.env` con `REACT_APP_N8N_BASE` y `REACT_APP_CAL_LINK`
- [ ] Webhooks n8n: `create-patient`, `update-patient`, `send-message`, `gcal-events`
- [ ] Conexiones n8n a **Airtable**, **Email/WhatsApp**, **Google Calendar**
- [ ] cal.com vinculado a Google Calendar del profesional
- [ ] App corriendo con `npm start` y endpoints respondiendo 200

---

## Créditos

- UI con clases utilitarias y **lucide-react** para iconos (`npm i lucide-react`).
- Backend **no-code** con **n8n**.
- Agenda profesional con **cal.com** + **Google Calendar**.
