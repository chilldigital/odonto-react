// src/components/LoginView.jsx - VERSIÓN PRODUCCIÓN
import React, { useState } from "react";
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

export default function LoginView({ onSuccess }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const n8nBaseUrl = process.env.REACT_APP_N8N_BASE || 'https://n8n-automation.chilldigital.tech';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log(`🔍 Intentando login: ${credentials.username}`);

      const response = await fetch(`${n8nBaseUrl}/webhook/auth-login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username.trim(),
          password: credentials.password,
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();
      console.log('📥 Auth Response:', data);

      if (data.success && data.token) {
        console.log('✅ Login exitoso');
        setSuccess(`¡Bienvenido ${data.user?.name || credentials.username}!`);
        
        // Pequeño delay para mostrar el mensaje de éxito
        setTimeout(() => {
          if (typeof onSuccess === "function") {
            onSuccess(data.token);
          } else {
            try {
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
              window.location.assign("/");
            } catch (e) {
              console.error('Error guardando token:', e);
              window.location.assign("/");
            }
          }
        }, 1000);
        
      } else {
        // Manejar diferentes tipos de errores
        switch (data.code) {
          case 'RATE_LIMITED':
          case 'ACCOUNT_LOCKED':
            setError(`🚫 ${data.message}`);
            break;
          case 'INVALID_CREDENTIALS':
            setError('❌ Usuario o contraseña incorrectos');
            if (data.attemptsRemaining !== undefined) {
              setError(prev => prev + ` (${data.attemptsRemaining} intentos restantes)`);
            }
            break;
          default:
            setError(data.message || 'Error de autenticación');
        }
      }
    } catch (err) {
      console.error('💥 Error en login:', err);
      setError('🔌 Error de conexión. Verifica que el servidor esté disponible.');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (user) => {
    if (user === 'admin') {
      setCredentials({ username: 'admin', password: 'Chilldigital2025' });
    } else {
      setCredentials({ username: 'doctor', password: 'TuPassword123' });
    }
  };

  return (
    <>
      <style>{`
        .brand-bg { background-color: #0C9488 !important; }
        .brand-text { color: #0C9488 !important; }
        .brand-btn { background-color: #0C9488 !important; color: #fff !important; }
        .brand-btn:hover { background-color: #097C73 !important; }
        .brand-ring:focus { outline: none !important; box-shadow: 0 0 0 2px #0C9488 !important; }
      `}</style>

      <div className="min-h-screen bg-gray-50 grid lg:grid-cols-2">
        {/* Panel ilustración */}
        <div className="hidden lg:flex flex-col justify-between p-10 brand-bg text-white">
          <div />
          <div>
            <div className="text-3xl font-bold leading-tight">¡Bienvenida a tu consultorio digital! 👋🏻</div>
            <p className="mt-3 text-white/80">Accedé a tus pacientes y turnos desde un solo lugar.</p>
          </div>
          <div className="flex items-center gap-2 opacity-90">
            <Shield size={16} />
            <span className="text-sm">Datos protegidos con inicio seguro</span>
          </div>
        </div>

        {/* Panel de login */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-8">
            <h1 className="text-3xl font-semibold text-gray-900">Login</h1>
            <p className="text-gray-500 mt-2">Accede a tu sistema odontológico.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Mensajes de estado */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>{success}</span>
                </div>
              )}

              {/* Campo Usuario */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={credentials.username}
                  onChange={handleInputChange}
                  placeholder="Ingresa tu usuario"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                  disabled={loading}
                  autoComplete="username"
                />
                
                {/* Botones de prueba rápida - SOLO EN DESARROLLO */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => quickFill('admin')}
                      disabled={loading}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600"
                    >
                      👤 Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => quickFill('doctor')}
                      disabled={loading}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600"
                    >
                      🩺 Doctor
                    </button>
                  </div>
                )}
              </div>

              {/* Campo Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleInputChange}
                    placeholder="Tu contraseña"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors pr-12"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Botón Login */}
              <button
                type="submit"
                disabled={loading || !credentials.username.trim() || !credentials.password.trim()}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Ingresando...
                  </>
                ) : (
                  '🔐 Ingresar'
                )}
              </button>
            </form>

            {/* Footer info */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                Sistema Odontológico Seguro
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Powered by ChillDigital
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}