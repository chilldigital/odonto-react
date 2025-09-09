import { URL_GET_PATIENTS, URL_CREATE_PATIENT, URL_UPDATE_PATIENT } from '../config/n8n.js';
import { apiFetch } from '../utils/api';

/**
 * Servicio para gestionar pacientes desde n8n/Airtable
 */
export class PatientService {
  
  /**
   * Obtener todos los pacientes desde n8n/Airtable
   * @returns {Promise<Array>} Lista de pacientes
   */
  static async fetchAllPatients() {
    try {
      
      
      const response = await apiFetch(URL_GET_PATIENTS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // El webhook debería devolver: { patients: [...] }
      const patients = data.patients || [];
      
      
      return patients;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Crear un nuevo paciente
   * *** ACTUALIZADO: Ahora soporta archivos ***
   * @param {Object} patientData - Datos del paciente (puede incluir historiaClinicaFile)
   * @returns {Promise<Object>} Paciente creado
   */
  static async createPatient(patientData) {
    try {
      

      let requestOptions;

      // *** LÓGICA CONDICIONAL: ARCHIVO vs JSON ***
      if (patientData.historiaClinicaFile) {
        // Si hay archivo, usar FormData
        
        
        const formData = new FormData();
        formData.append('nombre', patientData.nombre || '');
        formData.append('dni', patientData.dni || '');
        formData.append('telefono', patientData.telefono || '');
        formData.append('email', patientData.email || '');
        formData.append('obraSocial', patientData.obraSocial || '');
        formData.append('numeroafiliado', patientData.numeroAfiliado || ''); // lowercase para N8N
        formData.append('fechanacimiento', patientData.fechaNacimiento || ''); // lowercase para N8N
        formData.append('alergias', patientData.alergias || 'Ninguna');
        formData.append('notas', patientData.notas || '');
        formData.append('clinicalRecord', patientData.historiaClinicaFile); // el archivo

        requestOptions = {
          method: 'POST',
          body: formData,
          // NO ponemos Content-Type, el navegador lo hace automáticamente para FormData
        };

      } else {
        // Sin archivo, usar JSON normal
        
        
        requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: patientData.nombre || '',
            dni: patientData.dni || '',
            telefono: patientData.telefono || '',
            email: patientData.email || '',
            obraSocial: patientData.obraSocial || '',
            numeroAfiliado: patientData.numeroAfiliado || '',
            fechaNacimiento: patientData.fechaNacimiento || '',
            alergias: patientData.alergias || 'Ninguna',
            notas: patientData.notas || '',
          })
        };
      }

      // *** ÚNICA LLAMADA A N8N ***
      const response = await apiFetch(URL_CREATE_PATIENT, requestOptions);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      

      // Normalizar la respuesta de N8N
      const normalizedPatient = {
        id: responseData.id || responseData.recordId || responseData.ID || patientData.id,
        nombre: responseData.nombre || responseData.name || patientData.nombre,
        dni: responseData.dni || responseData.DNI || patientData.dni,
        telefono: responseData.telefono || responseData.phone || patientData.telefono,
        email: responseData.email || patientData.email,
        obraSocial: responseData.obraSocial || responseData.insurance || patientData.obraSocial,
        numeroAfiliado: responseData.numeroAfiliado || responseData.affiliateNumber || patientData.numeroAfiliado,
        fechaNacimiento: responseData.fechaNacimiento || responseData.birthDate || patientData.fechaNacimiento,
        alergias: responseData.alergias || responseData.allergies || patientData.alergias || 'Ninguna',
        notas: responseData.notas || responseData.notes || patientData.notas,
        historiaClinica: responseData.historiaClinica || responseData.clinicalRecord || '',
        ultimaVisita: responseData.ultimaVisita || responseData.lastVisit || '',
        // Mantener información del archivo si estaba presente
        hasFile: !!patientData.historiaClinicaFile,
        fileName: patientData.fileName,
      };

      
      return normalizedPatient;

    } catch (error) {
      throw error;
    }
  }

  /**
 * Actualizar un paciente existente
 * *** MEJORADO: Ahora soporta archivos ***
 * @param {Object} patientData - Datos del paciente (debe incluir airtableId)
 * @returns {Promise<Object>} Paciente actualizado
 */
  static async updatePatient(patientData) {
  try {
  

    let requestOptions;

    // *** LÓGICA CONDICIONAL: ARCHIVO vs JSON ***
    if (patientData.historiaClinicaFile) {
      // Si hay archivo, usar FormData
      
      
      const formData = new FormData();
      formData.append('airtableId', patientData.airtableId);
      
      // Agregar todos los campos del formulario
      Object.entries(patientData).forEach(([key, value]) => {
        if (key !== 'historiaClinicaFile' && value != null) {
          formData.append(key, String(value));
        }
      });
      
      // Agregar el archivo
      formData.append('historiaClinica', patientData.historiaClinicaFile);

      requestOptions = {
        method: 'POST',
        body: formData,
        // NO ponemos Content-Type, el navegador lo setea automáticamente
      };
    } else {
      // Sin archivo, usar JSON normal
      
      
      requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData)
      };
    }

    const response = await apiFetch(URL_UPDATE_PATIENT, requestOptions);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Normalizar respuesta
    const updatedPatient = {
      ...patientData,
      ...result,
      ...(result.data || {}),
    };

    
    return updatedPatient;

  } catch (error) {
    throw error;
  }
  }
}
