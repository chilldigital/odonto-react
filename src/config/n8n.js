// src/config/n8n.js
export const N8N_BASE = process.env.REACT_APP_N8N_BASE || 'http://localhost:5678';
export const URL_UPDATE_PATIENT = `${N8N_BASE}/webhook/update-patient`;
export const URL_SEND_MESSAGE  = `${N8N_BASE}/webhook/send-message`;
export const URL_CREATE_PATIENT = `${N8N_BASE}/webhook/create-patient`;