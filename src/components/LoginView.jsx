// src/components/LoginView.jsx
import React from "react";
import { Shield } from "lucide-react";

// Simple Google "G" SVG to avoid external asset fetch
const GoogleG = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.22 3.6l6.9-6.9C35.9 1.9 30.3 0 24 0 14.62 0 6.5 5.38 2.56 13.22l8.02 6.22C12.34 13.38 17.69 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24c0-1.64-.15-3.22-.43-4.75H24v9h12.7c-.55 2.95-2.26 5.45-4.8 7.12l7.36 5.73C43.65 37.52 46.5 31.28 46.5 24z"/>
    <path fill="#FBBC05" d="M10.58 27.44A14.47 14.47 0 0 1 9.5 24c0-1.2.21-2.36.58-3.44l-8.02-6.22A23.86 23.86 0 0 0 0 24c0 3.87.93 7.53 2.56 10.66l8.02-6.22z"/>
    <path fill="#34A853" d="M24 48c6.3 0 11.62-2.07 15.49-5.62l-7.36-5.73c-2.05 1.38-4.7 2.2-8.13 2.2-6.31 0-11.66-4.24-13.55-9.94l-8 6.2C6.73 43.7 14.73 48 24 48z"/>
  </svg>
);

export default function LoginView({ onSuccess }) {
  const googleAuthUrl = process.env.REACT_APP_AUTH_GOOGLE_URL; // endpoint OAuth (Auth proxy / backend)

  const enterWithoutLogin = () => {
    if (typeof onSuccess === "function") {
      onSuccess(); // deja que la app cambie de estado a "logueado"
    } else {
      window.location.assign("/"); // navegación sin depender del Router
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

        {/* Panel "solo Google" + botón temporal */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-8">
            <h1 className="text-3xl font-semibold text-gray-900">Login</h1>
            <p className="text-gray-500 mt-2">Ingresá con tu cuenta de Google.</p>

            <a
              href={googleAuthUrl || '#'}
              onClick={(e) => { if (!googleAuthUrl) e.preventDefault(); }}
              aria-disabled={!googleAuthUrl}
              className={`mt-6 w-full inline-flex items-center justify-center gap-2 bg-white border rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 shadow-sm ${!googleAuthUrl ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <GoogleG size={18} />
              Continuar con Google
            </a>

            {/* Botón temporal sin depender de Router */}
            <button
              type="button"
              onClick={enterWithoutLogin}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm brand-btn"
            >
              Entrar sin login (temporal)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}