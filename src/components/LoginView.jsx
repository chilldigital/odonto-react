// src/components/LoginView.jsx
import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, LogIn, Shield } from "lucide-react";

export default function LoginView({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const n8nBase = process.env.REACT_APP_N8N_BASE;            // opcional
  const googleAuthUrl = process.env.REACT_APP_AUTH_GOOGLE_URL; // opcional (Auth0/Clerk/etc.)

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      // === MODO A: login contra n8n (habilitalo cuando tengas el webhook) ===
      // if (n8nBase) {
      //   const res = await fetch(`${n8nBase}/webhook/login`, {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ email, password: pass }),
      //   });
      //   const json = await res.json();
      //   if (!res.ok || !json.token) throw new Error(json.message || "Credenciales inválidas");
      //   if (remember) localStorage.setItem("token", json.token);
      //   onSuccess ? onSuccess() : (window.location.href = "/");
      //   return;
      // }

      // === MODO B: simulación local (dev) mientras no hay backend ===
      if (!email || !pass) throw new Error("Completá email y contraseña");
      const fakeToken = "dev-token-" + Math.random().toString(36).slice(2);
      if (remember) localStorage.setItem("token", fakeToken);
      onSuccess ? onSuccess() : (window.location.href = "/");
    } catch (e) {
      setErr(e.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .brand-bg { background-color: #0C9488 !important; }
        .brand-text { color: #0C9488 !important; }
        .brand-btn {
          background-color: #0C9488 !important;
          color: #fff !important;
        }
        .brand-btn:hover { background-color: #097C73 !important; } /* shade for hover */
        .brand-ring:focus {
          outline: none !important;
          box-shadow: 0 0 0 2px #0C9488 !important;
        }
      `}</style>
    <div className="min-h-screen bg-gray-50 grid lg:grid-cols-2">
      {/* Panel ilustración */}
      <div className="hidden lg:flex flex-col justify-between p-10 brand-bg text-white">
        <div />
        <div>
          <div className="text-3xl font-bold leading-tight">
            ¡Bienvenida a tu consultorio digital! 👋🏻
          </div>
          <p className="mt-3 text-white/80">
            Accedé a tus pacientes y turnos desde un solo lugar.
          </p>
        </div>
        <div className="flex items-center gap-2 opacity-90">
          <Shield size={16} />
          <span className="text-sm">Datos protegidos con inicio seguro</span>
        </div>
      </div>

      {/* Panel formulario */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-semibold text-gray-900">Login</h1>
          <p className="text-gray-500 mt-2">
            Ingresá tus credenciales para acceder.
          </p>

          {/* OAuth opcional */}
          {googleAuthUrl && (
            <a
              href={googleAuthUrl}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-white border rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <img
                alt="Google"
                src="https://www.google.com/favicon.ico"
                className="w-4 h-4"
              />
              Continuar con Google
            </a>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none brand-ring"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2 border rounded-lg focus:outline-none brand-ring"
                  placeholder="••••••••"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={show ? "Ocultar" : "Mostrar"}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded"
                />
                Recordarme
              </label>
              <a href="#" className="text-sm brand-text hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {err && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 brand-btn rounded-lg px-4 py-2"
            >
              <LogIn size={16} />
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-500">
            Al iniciar sesión aceptás términos y políticas de privacidad.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}