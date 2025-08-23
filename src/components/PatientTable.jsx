import React from 'react';
import { Eye } from 'lucide-react';

export default React.memo(function PatientTable({ patients, onView }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left p-3 lg:p-4 text-sm font-medium text-gray-700 whitespace-nowrap">Nombre</th>
            <th className="text-left p-3 lg:p-4 text-sm font-medium text-gray-700 whitespace-nowrap">Obra Social</th>
            <th className="text-left p-3 lg:p-4 text-sm font-medium text-gray-700 whitespace-nowrap">Historia Clínica</th>
            <th className="text-left p-3 lg:p-4 text-sm font-medium text-gray-700 whitespace-nowrap">Última Visita</th>
            <th className="text-left p-3 lg:p-4 text-sm font-medium text-gray-700"></th>
          </tr>
        </thead>
        <tbody>
          {patients.map((paciente) => (
            <tr key={paciente.id} className="border-b hover:bg-gray-50">
              <td className="p-3 lg:p-4 text-sm text-gray-900 whitespace-nowrap">{paciente.nombre}</td>
              <td className="p-3 lg:p-4 text-sm text-blue-600 whitespace-nowrap">{paciente.obraSocial}</td>
              <td className="p-3 lg:p-4 text-sm text-teal-600 whitespace-nowrap">{paciente.historiaClinica}</td>
              <td className="p-3 lg:p-4 text-sm text-gray-900 whitespace-nowrap">{paciente.ultimaVisita}</td>
              <td className="p-3 lg:p-4">
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => onView && onView(paciente)}
                  aria-label={`Ver perfil de ${paciente.nombre}`}
                >
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});