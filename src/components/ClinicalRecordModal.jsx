// src/components/ClinicalRecordModal.jsx
import React, { useEffect } from "react";
import ModalShell from "./ModalShell";

function isPdf(url = "") {
  return typeof url === "string" && url.toLowerCase().endsWith(".pdf");
}

export default function ClinicalRecordModal({ open, patient, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !patient) return null;

  const odontogramaUrl =
    patient.odontogramaUrl || patient.odontograma || patient.historiaUrl;

  const ultimaVisita = patient.ultimaVisita || "—";
  const ultimoMotivo =
    patient.ultimoMotivo ||
    patient.motivoUltimoTurno ||
    patient.ultimoTurnoMotivo ||
    "No especificado";

  return (
    <ModalShell title="Historia Clínica" onClose={onClose}>
      {/* Cabecera paciente */}
      <div className="mb-4">
        <div className="text-lg font-semibold text-gray-900">
          {patient.nombre}
        </div>
        <div className="mt-1 text-sm text-gray-600">
          <span className="font-medium text-gray-700">Último turno: </span>
          {ultimaVisita}
          <span className="mx-2">•</span>
          <span className="font-medium text-gray-700">Motivo: </span>
          {ultimoMotivo}
        </div>
      </div>

      {/* Contenido odontograma */}
      <div className="mt-4">
        {!odontogramaUrl ? (
          <div className="p-4 rounded-lg border bg-gray-50 text-sm text-gray-600">
            No hay odontograma asociado aún.
          </div>
        ) : isPdf(odontogramaUrl) ? (
          <div className="h-[60vh] rounded-lg border overflow-hidden">
            <iframe
              title="Odontograma PDF"
              src={odontogramaUrl}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <img
              src={odontogramaUrl}
              alt="Odontograma"
              className="w-full h-auto object-contain bg-white"
            />
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
        >
          Cerrar
        </button>
      </div>
    </ModalShell>
  );
}