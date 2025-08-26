# Dental Dashboard — README

Aplicación React para gestionar pacientes y turnos de un consultorio odontológico.  
El proyecto está organizado en componentes, integra **n8n** para el backend sin servidor, **Airtable** para datos de pacientes y **Google Calendar** (vía **cal.com**) para turnos.  

> **Objetivo:** mantener una UI simple (Dashboard, Turnos, Pacientes) con modales para ver, editar, crear y mensajear pacientes, y con un calendario que lee eventos desde Google Calendar.

---

## 🚀 ¡NUEVA FUNCIONALIDAD! - Pacientes desde n8n/Airtable

**✨ Ahora los pacientes se cargan directamente desde Airtable vía n8n**
- Hook personalizado `usePatients` para gestión del estado
- Servicio `PatientService` para comunicación con n8n
- Estados de loading y error bien manejados
- Sincronización automática y manual

---

## 🧱 Requisitos

- Node.js ≥ 18
- npm o yarn
- Cuenta n8n con acceso a:
  - **Airtable** (para pacientes)
  - **Google Calendar** (para lectura de eventos)
- **cal.com** conectado al **Google Calendar** del profesional
- (Opcional) repositorio en GitHub

Instalación de dependencias:
```bash
npm i
npm i lucide-react
```

---

## 🚀 Puesta en marcha

1) Crear archivo `.env` en la raíz del proyecto:
```
REACT_APP_N8N_BASE=https://n8n.chilldigital.tech/
REACT_APP_CAL_LINK=https://cal.com/tu-usuario
```

2) **Importar workflow en n8n:**
   - Ve a tu instancia de n8n
   - Importa el archivo `n8n-workflows/get-all-patients.json`
   - Configura las credenciales de Airtable
   - Activa el workflow

3) Ejecutar en desarrollo:
```bash
npm start
```

4) Build para producción:
```bash
npm run build
```

---

## 🗂️ Estructura del proyecto (ACTUALIZADA)

```
src/
├─ App.js                 # Orquesta vistas con hook usePatients
├─ App.css
├─ config/
│  └─ n8n.js              # Endpoints centralizados + nuevo URL_GET_PATIENTS
├─ services/              # 🆕 NUEVO
│  └─ PatientService.js   # Servicio para comunicación con n8n/Airtable  
├─ hooks/                 # 🆕 NUEVO
│  └─ usePatients.js      # Hook personalizado para gestionar pacientes
├─ data/
│  └─ mockData.js         # Solo turnos mock (pacientes desde Airtable)
├─ utils/
│  └─ helpers.js          # helpers (initials, cls)
└─ components/
   ├─ DashboardView.jsx   # 🔄 ACTUALIZADO - recibe loading
   ├─ PacientesView.jsx   # 🔄 ACTUALIZADO - simplificado, recibe loading
   ├─ AddPatientModal.jsx # 🔄 ACTUALIZADO - usa callback onCreated
   ├─ EditPatientModal.jsx # 🔄 ACTUALIZADO - usa callback onSaved
   ├─ (resto de componentes sin cambios)
   └─ ...
```

**Nuevos archivos importantes:**
- `src/services/PatientService.js`: Clase con métodos para CRUD de pacientes
- `src/hooks/usePatients.js`: Hook que maneja estado, loading y sincronización
- `n8n-workflows/get-all-patients.json`: Workflow para importar en n8n

---

## 🔌 Configuración de endpoints (n8n) - ACTUALIZADA

Archivo: `src/config/n8n.js`

```js
export const N8N_BASE = process.env.REACT_APP_N8N_BASE || 'https://n8n.chilldigital.tech/';
export const URL_UPDATE_PATIENT = `${N8N_BASE}webhook/update-patient`;
export const URL_SEND_MESSAGE  = `${N8N_BASE}webhook/send-message`;
export const URL_CREATE_PATIENT = `${N8N_BASE}webhook/create-patient`;
export const URL_GET_PATIENTS = `${N8N_BASE}webhook/get-patients`; // 🆕 NUEVO
```

---

## 📄 Contratos de API (n8n) - ACTUALIZADOS

### 🆕 NUEVO: Obtener todos los pacientes
**Frontend → n8n**  
`GET /webhook/get-patients`

**n8n → Frontend**
```json
{
  "patients": [
    {
      "id": "rec1234567890",
      "airtableId": "rec1234567890", 
      "nombre": "Juan Pérez",
      "obraSocial": "OSDE",
      "telefono": "+54 11 5555 5555",
      "email": "juan@ejemplo.com",
      "direccion": "CABA",
      "ultimaVisita": "2024-08-15",
      "fechaCreacion": "2024-08-01T10:00:00Z",
      "notas": "Paciente con sensibilidad dental"
    }
  ]
}
```

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

---

## 🏗️ Arquitectura del sistema - NUEVA

### **Flujo de datos:**
```
Airtable ← n8n → React Frontend
    ↑      ↓         ↑
    └── Workflows ──→ usePatients Hook
```

### **Componentes principales:**
1. **usePatients Hook**: Gestiona estado global de pacientes
2. **PatientService**: Abstrae las llamadas a n8n
3. **App.js**: Orquesta todo usando el hook
4. **Componentes**: Reciben datos y callbacks del hook

---

## 🎯 Funcionalidades implementadas

### ✅ **Gestión de pacientes**
- Cargar todos los pacientes desde Airtable
- Crear nuevos pacientes
- Editar pacientes existentes
- Búsqueda y filtrado
- Estados de loading y error
- Sincronización manual

### ✅ **UX mejorada**
- Spinners de carga
- Banner de error con botón "Reintentar"
- Botones deshabilitados durante operaciones
- Feedback visual en modales

### ⏳ **Pendiente de implementar**
- Obtener turnos desde Google Calendar
- Envío de mensajes vía WhatsApp/Email
- Historia clínica completa

---

## 📅 Google Calendar (lectura) + cal.com (creación)

- **Creación de turnos:** se hace en **cal.com**, ya vinculado con el Google Calendar del profesional. La UI expone un botón **"Nuevo turno"** (usa `REACT_APP_CAL_LINK`).  
- **Lectura de turnos:** se recomienda un workflow n8n **`/webhook/gcal-events`** que llame a **Google Calendar → Get Many** y devuelva `{ events: [...] }` al frontend.  
- El componente `TurnosView` consulta ese webhook con un rango (día / semana / mes) y muestra la lista agrupada por fecha. Un botón **"Sincronizar"** vuelve a pedir los eventos.

**Sugerencia de query**:  
`GET /webhook/gcal-events?from=2025-08-01T00:00:00Z&to=2025-08-31T23:59:59Z&timeZone=America/Argentina/Buenos_Aires`

---

## 🧩 Componentes y responsabilidades - ACTUALIZADO

### **Gestión de estado**
- **usePatients**: Hook personalizado con estado global de pacientes
- **PatientService**: Servicio para todas las operaciones CRUD

### **Vistas principales**
- **DashboardView**: KPIs + próximos turnos + pacientes (con loading)
- **PacientesView**: Lista completa con búsqueda (con loading)
- **TurnosView**: Calendario con eventos de Google Calendar

### **Modales**
- **AddPatientModal**: Creación con callback onCreated
- **EditPatientModal**: Edición con callback onSaved  
- **PatientProfileModal**: Vista detallada del paciente
- **MessagePatientModal**: Envío de mensajes

### **Componentes base**
- **Sidebar / Header**: Navegación
- **PatientTable**: Tabla de pacientes
- **SearchInput**: Búsqueda controlada
- **ModalShell**: Layout base para modales

---

## 🔒 Seguridad

- Usar **token** en Webhooks de n8n (header `x-api-key` o query `?token=...`).
- CORS: permitir sólo el dominio de tu app.
- No exponer credenciales en el front; todo correo/WhatsApp se envía desde n8n.

---

## 🧪 Testing y desarrollo

### **Consejos de testing**
- Mockear respuestas de n8n en desarrollo
- Probar validación en formularios
- Simular errores de red para UI feedback

### **Flujo de desarrollo**
```bash
# Crear feature branch
git checkout -b feat/nueva-funcionalidad

# Desarrollar y commit
git add .
git commit -m "feat: nueva funcionalidad"

# Push y PR
git push -u origin feat/nueva-funcionalidad
```

---

## 🚨 Troubleshooting

### **Pacientes no cargan**
1. ✅ Verificar que el workflow esté activo en n8n
2. ✅ Revisar credenciales de Airtable
3. ✅ Verificar URL en `REACT_APP_N8N_BASE`
4. ✅ Revisar consola del navegador

### **Errores de CORS**
1. ✅ Verificar headers CORS en el workflow
2. ✅ Configurar n8n para permitir tu dominio

### **Estados de loading infinito**
1. ✅ Revisar que los webhooks respondan correctamente
2. ✅ Verificar estructura de respuesta JSON

---

## 📋 Checklist de implementación

### **Backend (n8n)**
- [ ] Importar workflow `get-all-patients.json`
- [ ] Configurar credenciales de Airtable
- [ ] Activar workflow
- [ ] Probar endpoint GET `/webhook/get-patients`

### **Frontend**
- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas
- [ ] App iniciando correctamente
- [ ] Pacientes cargando desde Airtable
- [ ] Crear/Editar pacientes funcionando

### **Testing**
- [ ] Probar estados de loading
- [ ] Probar manejo de errores
- [ ] Probar búsqueda y filtros
- [ ] Verificar responsividad

---

## 🎯 Próximos pasos

1. **Integrar turnos desde Google Calendar**
2. **Implementar envío de mensajes**  
3. **Agregar historia clínica completa**
4. **Optimizar performance**
5. **Agregar tests unitarios**

---

## 📚 Documentación técnica

- `IMPLEMENTATION-NOTES.md`: Detalles de implementación
- `n8n-workflows/`: Workflows para importar en n8n
- Código documentado con JSDoc en servicios y hooks

---

## Créditos

- UI con **Tailwind CSS** y **lucide-react** para iconos
- Backend **no-code** con **n8n**
- Agenda profesional con **cal.com** + **Google Calendar**
- Gestión de datos con **Airtable**