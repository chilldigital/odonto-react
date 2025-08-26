import { URL_GET_PATIENTS, URL_CREATE_PATIENT, URL_UPDATE_PATIENT } from '../config/n8n.js';

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
      const response = await fetch(URL_GET_PATIENTS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Opcional: agregar token de seguridad
          // 'x-api-key': process.env.REACT_APP_N8N_TOKEN
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // El webhook debería devolver: { patients: [...] }
      return data.patients || [];
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo paciente
   * @param {Object} patientData - Datos del paciente
   * @returns {Promise<Object>} Paciente creado
   */
  static async createPatient(patientData) {
    try {
      const response = await fetch(URL_CREATE_PATIENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al crear paciente:', error);
      throw error;
    }
  }

  /**
   * Actualizar un paciente existente
   * @param {Object} patientData - Datos del paciente (debe incluir airtableId)
   * @returns {Promise<Object>} Paciente actualizado
   */
  static async updatePatient(patientData) {
    try {
      const response = await fetch(URL_UPDATE_PATIENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al actualizar paciente:', error);
      throw error;
    }
  }
}