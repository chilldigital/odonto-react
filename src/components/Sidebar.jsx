import React from 'react';
import { Calendar, Users, BarChart3, X } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, sidebarOpen, setSidebarOpen }) {
  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white h-screen shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-6 py-4 border-b" style={{ height: '73px', display: 'flex', alignItems: 'center' }}>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-amber-600 font-semibold text-sm">🦷</span>
            </div>
            <span className="text-gray-800 font-semibold text-base">Od. Mercedes Pindar</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-2"><X size={20} /></button>
        </div>
        <nav className="mt-6">
          <ul className="space-y-2 px-4">
            <li>
              <button onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${currentView === 'dashboard' ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                <BarChart3 size={20} /><span>Dashboard</span>
              </button>
            </li>
            <li>
              <button onClick={() => { setCurrentView('turnos'); setSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${currentView === 'turnos' ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Calendar size={20} /><span>Turnos</span>
              </button>
            </li>
            <li>
              <button onClick={() => { setCurrentView('pacientes'); setSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${currentView === 'pacientes' ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Users size={20} /><span>Pacientes</span>
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
}