// src/components/Sidebar.jsx - CON CAMBIO DE CONTRASEÑA
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { X, Home, Calendar, Users, LogOut, Settings, Lock, User } from 'lucide-react';
import { getUser } from '../utils/auth';
import ChangePasswordModal from './ChangePasswordModal';

export default function Sidebar({ sidebarOpen, setSidebarOpen, onLogout }) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const user = getUser();

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const handleChangePassword = () => {
    setShowUserMenu(false);
    setShowChangePassword(true);
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🦷</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">Consultorio</span>
          </div>
          
          {/* Close button (mobile) */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={closeSidebar}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name || user.username}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role || 'Usuario'}
                </p>
              </div>
              
              {/* User Menu Toggle */}
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-1 rounded-lg hover:bg-gray-100 relative"
              >
                <Settings size={16} className="text-gray-400" />
              </button>
            </div>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="mt-2 bg-gray-50 rounded-lg border border-gray-200 py-1 shadow-sm">
                <button
                  onClick={handleChangePassword}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Lock size={14} />
                  <span>Cambiar Contraseña</span>
                </button>
                
                <div className="border-t border-gray-200 my-1" />
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-2">
            <li>
              <NavLink
                to="/"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-600 border-r-2 border-teal-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Home size={20} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            
            <li>
              <NavLink
                to="/turnos"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-600 border-r-2 border-teal-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Calendar size={20} />
                <span>Turnos</span>
              </NavLink>
            </li>
            
            <li>
              <NavLink
                to="/pacientes"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-600 border-r-2 border-teal-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Users size={20} />
                <span>Pacientes</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Sistema Odontológico</p>
            <p className="text-xs text-gray-400">v1.0.0</p>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        user={user}
      />

      {/* Click outside handler for user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
}