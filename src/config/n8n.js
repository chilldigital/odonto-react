// src/config/n8n.js
export const N8N_BASE = process.env.REACT_APP_N8N_BASE || 'https://n8n.chilldigital.tech/';
export const URL_UPDATE_PATIENT = `${N8N_BASE}webhook/update-patient`;
export const URL_SEND_MESSAGE  = `${N8N_BASE}webhook/send-message`;
export const URL_CREATE_PATIENT = `${N8N_BASE}webhook/create-patient`;
// ✨ Nuevo endpoint para obtener todos los pacientes
export const URL_GET_PATIENTS = `${N8N_BASE}webhook/get-patients`;