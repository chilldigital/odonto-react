import { useState, useEffect, useCallback } from 'react';
import { PatientService } from '../services/PatientService';

/**
 * Hook personalizado para gestionar el estado de los pacientes
 * @returns {Object} Estado y funciones para manejar pacientes
 */
export function usePatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Cargar todos los pacientes desde n8n/Airtable
   */
  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedPatients = await PatientService.fetchAllPatients();
      setPatients(fetchedPatients);
    } catch (err) {
      setError(err.message);
      console.error('Error cargando pacientes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Agregar un nuevo paciente
   * @param {Object} patientData - Datos del paciente
   */
  const addPatient = useCallback(async (patientData) => {
    setLoading(true);
    setError(null);

    try {
      const newPatient = await PatientService.createPatient(patientData);
      
      // Agregar el nuevo paciente al estado local
      setPatients(prevPatients => [...prevPatients, newPatient]);
      
      return newPatient;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar un paciente existente
   * @param {Object} patientData - Datos del paciente (debe incluir airtableId)
   */
  const updatePatient = useCallback(async (patientData) => {
    setLoading(true);
    setError(null);

    try {
      const updatedPatient = await PatientService.updatePatient(patientData);
      
      // Actualizar el paciente en el estado local
      setPatients(prevPatients => 
        prevPatients.map(patient => 
          patient.airtableId === patientData.airtableId 
            ? { ...patient, ...updatedPatient }
            : patient
        )
      );
      
      return updatedPatient;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refrescar la lista de pacientes
   */
  const refreshPatients = useCallback(() => {
    loadPatients();
  }, [loadPatients]);

  // Cargar pacientes al montar el componente
  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  return {
    patients,
    loading,
    error,
    loadPatients,
    addPatient,
    updatePatient,
    refreshPatients
  };
}