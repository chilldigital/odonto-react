import React from 'react';
import { Eye } from 'lucide-react';

export default React.memo(function PatientTable({ patients, onView, onOpenRecord }) {
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
              <td className="p-3 lg:p-4 text-sm whitespace-nowrap"><button type="button" onClick={() => onView && onView(paciente)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView && onView(paciente); } }} className="p-0 m-0 bg-transparent text-left text-gray-900 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-sm cursor-pointer" aria-label={`Ver perfil de ${paciente.nombre}`}>{paciente.nombre}</button></td>
              <td className="p-3 lg:p-4 text-sm text-blue-600 whitespace-nowrap">{paciente.obraSocial}</td>
              <td className="p-3 lg:p-4 text-sm whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onOpenRecord && onOpenRecord(paciente)}
                  className="text-teal-600 hover:underline font-medium"
                  aria-label={`Abrir historia clínica de ${paciente.nombre}`}
                >
                  {paciente.historiaClinica || 'Abrir'}
                </button>
              </td>
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