# Implementación: Obtener Pacientes desde n8n/Airtable

Esta implementación cambia el sistema para que los pacientes se obtengan directamente desde Airtable vía n8n, en lugar de usar datos mock.

## 🚀 Cambios Realizados

### 1. **Nuevo endpoint en config/n8n.js**
- Agregado `URL_GET_PATIENTS` que apunta a `/webhook/get-patients`
- Corregidas las URLs (removido la barra extra)

### 2. **Servicio PatientService** (`src/services/PatientService.js`)
- Clase con métodos estáticos para:
  - `fetchAllPatients()`: GET a n8n para obtener todos los pacientes
  - `createPatient()`: Crear nuevo paciente
  - `updatePatient()`: Actualizar paciente existente

### 3. **Hook usePatients** (`src/hooks/usePatients.js`)
- Hook personalizado que maneja:
  - Estado de pacientes, loading y error
  - Carga automática de pacientes al montar
  - Funciones para CRUD con actualización del estado local
  - Función `refreshPatients()` para recargar datos

### 4. **App.js Actualizado**
- Reemplazado el estado local `patients` por el hook `usePatients`
- Agregado banner de error con botón "Reintentar"
- Integradas las funciones de crear/actualizar pacientes
- Pasado el estado `loading` a los componentes

### 5. **Workflow n8n** (`n8n-workflows/get-all-patients.json`)
- Workflow completo para importar en n8n
- Webhook GET `/webhook/get-patients`
- Conexión a Airtable y transformación de datos
- Headers CORS configurados

## 🔧 Próximos pasos

### 1. **Importar el workflow en n8n:**
1. Ve a tu instancia de n8n (https://n8n.chilldigital.tech/)
2. Importa el archivo `n8n-workflows/get-all-patients.json`
3. Configura las credenciales de Airtable
4. Ajusta el nombre de la base y tabla según tu configuración

### 2. **Configurar la estructura de Airtable:**
El workflow espera estos campos (ajusta según tu base):
```
- Nombre (o nombre)
- Obra Social (o obraSocial)  
- Telefono (o telefono)
- Email (o email)
- Direccion (o direccion)
- Ultima Visita (o ultimaVisita)
- Fecha Creacion (o fechaCreacion)
- Notas (o notas)
```

### 3. **Formato de respuesta esperado:**
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

### 4. **Probar la implementación:**
1. Inicia tu aplicación React: `npm start`
2. Verifica que se carguen los pacientes desde Airtable
3. Prueba crear/editar pacientes
4. Verifica que el botón "Reintentar" funcione si hay errores

## ✨ Beneficios

- **🔄 Datos siempre actualizados**: Los pacientes vienen directamente de Airtable
- **🏗️ Arquitectura consistente**: Todo pasa por n8n
- **⚡ Performance**: Los datos se cargan una vez y se mantienen en estado local
- **🔄 Sincronización**: Fácil refresh de datos
- **📱 UX mejorada**: Estados de loading y error bien manejados

## 🚨 Notas Importantes

- El archivo `src/data/mockData.js` ya no se usa para pacientes (pero mantelo por si hay otros datos mock)
- Asegúrate de que tu instancia de n8n tenga las credenciales de Airtable configuradas
- Los componentes `DashboardView` y `PacientesView` ahora reciben una prop `loading`
- Los modales `AddPatientModal` y `EditPatientModal` ahora reciben una prop `loading`

## 🐛 Troubleshooting

**Si los pacientes no cargan:**
1. Verifica que el workflow esté activo en n8n
2. Revisa que las credenciales de Airtable estén bien configuradas  
3. Verifica la URL en `REACT_APP_N8N_BASE` en tu `.env`
4. Revisa la consola del navegador para errores de CORS o red

**Si hay errores de CORS:**
- Verifica que el workflow incluya los headers CORS
- Asegúrate de que n8n esté configurado para permitir tu dominio