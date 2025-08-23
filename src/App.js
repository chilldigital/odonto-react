import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar, Users, BarChart3, Plus, Search, Eye, Phone, MapPin, Mail, Upload, X } from 'lucide-react';
import './App.css';

/* =====================
   Datos de ejemplo
===================== */
const mockData = {
  stats: {
    turnosHoy: 2,
    turnosSemana: 9,
    totalPacientes: 27
  },
  proximosTurnos: [
    { fecha: "Viernes 22 de Agosto", hora: "15:00 hs", paciente: "Benjamin Torres Lemos", tipo: "Consulta General" },
    { fecha: "Viernes 22 de Agosto", hora: "15:30 hs", paciente: "Agustin Corbalan", tipo: "Arreglo de Caries" },
    { fecha: "Martes 26 de Agosto", hora: "10:45 hs", paciente: "Esteban Alvarez Farhat", tipo: "Extracción" }
  ],
  pacientes: [
    { id: 1, nombre: "Benjamin Torres Lemos", obraSocial: "OSDE", telefono: "+54 381 612 3456", email: "benjamin@ejemplo.com", direccion: "Av. Siempre Viva 742, Tucumán", historiaClinica: "Abrir", ultimaVisita: "12/08/2025" },
    { id: 2, nombre: "Agustin Corbalan", obraSocial: "Swiss Medical", telefono: "+54 11 3631 4341", email: "agustin@ejemplo.com", direccion: "CABA, Argentina", historiaClinica: "Abrir", ultimaVisita: "02/07/2025" },
    { id: 3, nombre: "Esteban Alvarez Farhat", obraSocial: "Medicus", telefono: "+54 381 618 2736", email: "esteban@ejemplo.com", direccion: "San Miguel de Tucumán", historiaClinica: "Abrir", ultimaVisita: "24/02/2025" },
    { id: 4, nombre: "Facundo Salado", obraSocial: "Medifé", telefono: "+54 381 692 7465", email: "facundo@ejemplo.com", direccion: "Yerba Buena", historiaClinica: "Abrir", ultimaVisita: "16/06/2025" }
  ]
};

/* =====================
   Helpers
===================== */
const initials = (name = '') => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

/* =====================
   Componentes puros
===================== */

// Input de búsqueda (memo para evitar renders innecesarios)
const SearchInput = React.memo(({ value, onChange, placeholder }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-auto"
      autoComplete="off"
    />
  </div>
));

// Tabla de pacientes (memo)
const PatientTable = React.memo(({ patients, onView }) => (
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
));

/* ===============
   Patient Modal
================ */
const PatientProfileModal = ({ open, patient, onClose, onEdit, onMessage }) => {
  // cerrar con Esc
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white w-[90%] max-w-md rounded-2xl shadow-xl border p-6 animate-[fadeIn_.15s_ease-out]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Paciente</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Avatar + Name */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-28 h-28 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center text-gray-600 text-2xl font-semibold">
            {/* Si tuvieras patient.photoUrl, usalo en un <img> */}
            {/* <img src={patient.photoUrl} alt={patient.nombre} className="w-full h-full object-cover" /> */}
            {initials(patient.nombre)}
          </div>
          <div className="mt-4 text-center">
            <div className="text-xl font-semibold text-gray-900">{patient.nombre}</div>
            <div className="text-sm text-gray-500">{patient.obraSocial || 'Paciente'}</div>
          </div>
        </div>

        <hr className="my-4" />

        {/* Info */}
        <div className="space-y-4">
          <div className="flex items-start">
            <Phone className="mt-1 mr-3 text-gray-400" size={18} />
            <div>
              <div className="text-sm text-gray-500">Teléfono</div>
              <div className="text-sm text-gray-900">{patient.telefono || '-'}</div>
            </div>
          </div>

          <div className="flex items-start">
            <Mail className="mt-1 mr-3 text-gray-400" size={18} />
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="text-sm text-gray-900">{patient.email || '-'}</div>
            </div>
          </div>

          <div className="flex items-start">
            <MapPin className="mt-1 mr-3 text-gray-400" size={18} />
            <div>
              <div className="text-sm text-gray-500">Dirección</div>
              <div className="text-sm text-gray-900">{patient.direccion || '-'}</div>
            </div>
          </div>
        </div>

        <hr className="my-6" />

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
            onClick={() => onEdit && onEdit(patient)}
          >
            Edit
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
            onClick={() => onMessage && onMessage(patient)}
          >
            Message
          </button>
        </div>
      </div>
    </div>
  );
};

/* =====================
   Otras UI pieces
===================== */

const Sidebar = ({ currentView, setCurrentView, sidebarOpen, setSidebarOpen }) => (
  <>
    {sidebarOpen && (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={() => setSidebarOpen(false)}
      />
    )}
    <div className={`
      fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white h-screen shadow-lg transform transition-transform duration-300 ease-in-out
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="px-6 py-4 border-b" style={{ height: '73px', display: 'flex', alignItems: 'center' }}>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <span className="text-amber-600 font-semibold text-sm">🦷</span>
          </div>
          <span className="text-gray-800 font-semibold text-base">Od. Mercedes Pindar</span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-2">
          <X size={20} />
        </button>
      </div>
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          <li>
            <button
              onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentView === 'dashboard' ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 size={20} />
              <span>Dashboard</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => { setCurrentView('turnos'); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentView === 'turnos' ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar size={20} />
              <span>Turnos</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => { setCurrentView('pacientes'); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentView === 'pacientes' ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users size={20} />
              <span>Pacientes</span>
            </button>
          </li>
        </ul>
      </nav>
      <div className="absolute bottom-4 left-4">
        <button className="flex items-center space-x-2 text-gray-600 text-sm">
          <span className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">?</span>
          <span>Soporte</span>
        </button>
      </div>
    </div>
  </>
);

const Header = ({ title, setSidebarOpen }) => (
  <div className="bg-white border-b px-4 lg:px-8 py-4 flex justify-between items-center">
    <div className="flex items-center space-x-4">
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:text-gray-900">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 className="text-xl lg:text-2xl font-semibold text-gray-800">{title}</h1>
    </div>
    <div className="flex items-center space-x-4">
      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-orange-100 rounded-full flex items-center justify-center">
        <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-200 rounded-full"></div>
      </div>
    </div>
  </div>
);

const StatsCard = ({ title, value, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 text-sm mb-1">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  </div>
);

/* =====================
   Vistas
===================== */

const DashboardView = ({ dashboardSearchTerm, setDashboardSearchTerm, onAddPatient, onViewPatient }) => {
  const filteredPacientes = useMemo(() => {
    if (!dashboardSearchTerm.trim()) return mockData.pacientes.slice(0, 4);
    return mockData.pacientes
      .filter(p => p.nombre.toLowerCase().includes(dashboardSearchTerm.toLowerCase()))
      .slice(0, 4);
  }, [dashboardSearchTerm]);

  const handleSearchChange = useCallback((e) => {
    setDashboardSearchTerm(e.target.value);
  }, [setDashboardSearchTerm]);

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <StatsCard title="Turnos de hoy" value={mockData.stats.turnosHoy} color="text-teal-600" />
        <StatsCard title="Turnos de la semana" value={mockData.stats.turnosSemana} color="text-gray-900" />
        <StatsCard title="Pacientes" value={mockData.stats.totalPacientes} color="text-gray-900" />
      </div>

      <div className="space-y-6 lg:space-y-8">
        {/* Próximos Turnos */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 lg:p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Próximos Turnos</h2>
          </div>
          <div className="p-4 lg:p-6">
            <div className="space-y-4">
              {mockData.proximosTurnos.map((turno, index) => (
                <div key={`turno-${index}`} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-teal-500 rounded-full flex-shrink-0"></div>
                    <div>
                      <p className="text-sm text-gray-500">{turno.fecha}</p>
                      <p className="text-sm text-gray-500">{turno.hora}</p>
                    </div>
                  </div>
                  <div className="flex-1 sm:ml-4">
                    <p className="font-medium text-gray-900">{turno.paciente}</p>
                    <p className="text-sm text-gray-500">{turno.tipo}</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 self-start sm:self-center">
                    <Eye size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pacientes Preview */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 lg:p-6 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <h2 className="text-lg font-semibold text-gray-800">Pacientes</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <SearchInput
                value={dashboardSearchTerm}
                onChange={handleSearchChange}
                placeholder="Buscar paciente"
              />
              <button
                onClick={onAddPatient}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors w-full sm:w-auto"
              >
                Agregar
              </button>
            </div>
          </div>
          <PatientTable patients={filteredPacientes} onView={onViewPatient} />
        </div>
      </div>
    </div>
  );
};

const PacientesView = ({ searchTerm, setSearchTerm, onAddPatient, onViewPatient }) => {
  const filteredPacientes = useMemo(() => {
    return mockData.pacientes.filter(p =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 lg:p-6 border-b flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <h2 className="text-lg font-semibold text-gray-800">Pacientes</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar paciente"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-auto"
              />
            </div>
            <button
              onClick={onAddPatient}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors w-full sm:w-auto"
            >
              Agregar
            </button>
          </div>
        </div>

        <PatientTable patients={filteredPacientes} onView={onViewPatient} />
      </div>
    </div>
  );
};

const TurnosView = () => {
  const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const dates = [17, 18, 19, 20, 21, 22, 23];
  const hours = ['5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'];

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 lg:p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Calendario</h2>
        </div>

        <div className="p-4 lg:p-6">
          <div className="lg:hidden space-y-4">
            {mockData.proximosTurnos.map((turno, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{turno.paciente}</p>
                    <p className="text-sm text-gray-500">{turno.tipo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-teal-600">{turno.hora}</p>
                    <p className="text-xs text-gray-500">{turno.fecha}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <div className="grid grid-cols-8 gap-0 border border-gray-200 rounded-lg overflow-hidden min-w-full">
              <div className="bg-gray-50 p-3 text-center font-medium text-xs text-gray-600 border-r">GMT-03</div>
              {days.map((day, index) => (
                <div key={day} className={`bg-gray-50 p-3 text-center border-r ${index === 5 ? 'bg-blue-50' : ''}`}>
                  <div className="text-xs text-gray-600 mb-1">{day}</div>
                  <div className={`text-lg font-semibold ${index === 5 ? 'bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto' : 'text-gray-900'}`}>
                    {dates[index]}
                  </div>
                </div>
              ))}

              {hours.map((hour, hourIndex) => (
                <React.Fragment key={hour}>
                  <div className="bg-gray-50 p-3 text-xs text-gray-600 border-r border-t text-center">
                    {hour}
                  </div>
                  {days.map((_, dayIndex) => (
                    <div key={`${hour}-${dayIndex}`} className="border-r border-t p-1 h-16 relative">
                      {dayIndex >= 1 && dayIndex <= 5 && hourIndex >= 2 && hourIndex <= 3 && (
                        <div className={`absolute inset-1 ${hourIndex === 2 ? 'bg-teal-500' : hourIndex === 3 ? 'bg-blue-500' : 'bg-yellow-500'} text-white text-xs p-1 rounded flex flex-col justify-center`}>
                          {hourIndex === 2 && <span>Ocupado<br />7:30 - 9am</span>}
                          {hourIndex === 3 && dayIndex < 4 && <span>Reunión<br />10:30-11am</span>}
                          {hourIndex === 3 && dayIndex >= 4 && <span>Llamada 30 min</span>}
                        </div>
                      )}
                      {dayIndex >= 1 && dayIndex <= 5 && hourIndex >= 6 && hourIndex <= 7 && (
                        <div className="absolute inset-1 bg-yellow-500 text-white text-xs p-1 rounded flex items-center justify-center">
                          Almuerzo<br />12:30 - 2pm
                        </div>
                      )}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddPatientModal = ({ show, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    department: 'Neurology',
    phone: '',
    address: '',
    email: '',
    description: ''
  });

  if (!show) return null;

  const handleSubmit = () => {
    console.log('Agregando paciente:', formData);
    onClose();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add Patient</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div>
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400"></div>
            </div>
            <div>
              <h3 className="font-medium">Name</h3>
              <button onClick={() => {}} className="text-teal-600 text-sm">Upload Photo</button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              placeholder="Enter Patient Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient Admitted Department</label>
            <select
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Neurology">Neurology</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Orthopedics">Orthopedics</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="tel"
                placeholder="Enter phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Enter Address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              placeholder="Enter biography"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Previous Health Copy</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto mb-4 text-gray-400" size={32} />
              <p className="text-gray-600 mb-2">Choose a file or drag & drop it here.</p>
              <p className="text-gray-400 text-sm mb-4">JPEG, PNG, PDF, and MP4 formats, up to 50 MB.</p>
              <button onClick={() => {}} className="text-gray-500 border border-gray-300 px-4 py-2 rounded-lg">
                Browse File
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSubmit} className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =====================
   Contenedor principal
===================== */

const Dashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal de perfil
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const openAddPatient = useCallback(() => setShowAddPatientModal(true), []);
  const closeAddPatient = useCallback(() => setShowAddPatientModal(false), []);

  const handleViewPatient = useCallback((patient) => {
    setSelectedPatient(patient);
    setShowProfileModal(true);
  }, []);

  const closeProfileModal = useCallback(() => setShowProfileModal(false), []);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header title={currentView.charAt(0).toUpperCase() + currentView.slice(1)} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              dashboardSearchTerm={dashboardSearchTerm}
              setDashboardSearchTerm={setDashboardSearchTerm}
              onAddPatient={openAddPatient}
              onViewPatient={handleViewPatient}
            />
          )}
          {currentView === 'turnos' && <TurnosView />}
          {currentView === 'pacientes' && (
            <PacientesView
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onAddPatient={openAddPatient}
              onViewPatient={handleViewPatient}
            />
          )}
        </main>
      </div>

      {/* Modales */}
      <AddPatientModal show={showAddPatientModal} onClose={closeAddPatient} />
      <PatientProfileModal
        open={showProfileModal}
        patient={selectedPatient}
        onClose={closeProfileModal}
        onEdit={(p) => console.log('Editar paciente', p)}
        onMessage={(p) => console.log('Mensaje a', p)}
      />
    </div>
  );
};

export default function App() {
  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}