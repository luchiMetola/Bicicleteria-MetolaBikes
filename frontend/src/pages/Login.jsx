import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

function Login({ setAutenticado }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // === FUNCIÓN PARA MANEJAR EL LOGIN CON GOOGLE ===
  const respuestaGoogleExitosa = async (credencialResponse) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenGoogle: credencialResponse.credential })
      });
      
      const data = await res.json();

      if (res.ok) {
        if (data.usuarioNuevo) {
          // Si es nuevo, NO lo dejamos loguearse desde acá. Lo mandamos a que se registre.
          setError('No tenés cuenta en Metola Bikes. Por favor, registrate primero o intentá con otro email.');
        } else {
          // Si ya existe, lo logueamos
          localStorage.setItem('token', data.token);
          setAutenticado(true);
          navigate('/');
        }
      } else {
        setError(data.error || "Error al iniciar sesión con Google");
      }
    } catch (err) {
      console.error("Error en Google Login:", err);
      setError("No se pudo conectar con el servidor.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        contrasena: password // Mapeamos 'password' al campo 'contrasena' de tu backend
      });

      localStorage.setItem('token', response.data.token);
      setAutenticado(true);
      
      setTimeout(() => {
        navigate('/');
      }, 1000);

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.mensaje || err.response.data.error || 'Invalid credentials');
      } else {
        setError('Could not connect to the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-100 font-sans p-4 absolute inset-0 z-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="flex justify-center mb-4">
          <img src="/LogosMetolaBikes.svg" alt="Metola Bikes Logo" className="h-16 w-auto object-contain" />
        </div>
        <h2 className="text-2xl font-black text-center text-slate-800 mb-1">Iniciar sesión</h2>
        <h3 className="text-center text-slate-500 font-medium text-sm mb-6">Bienvenido a Metola Bikes</h3>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="name@email.com"
                className="w-full p-2.5 pl-10 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                className="w-full p-2.5 pl-10 pr-10 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-hidden"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-lg shadow-md transition-colors cursor-pointer text-sm flex items-center justify-center gap-2 mt-2"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* === SEPARADOR Y BOTÓN DE GOOGLE === */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-slate-300"></div>
          <span className="px-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">O ingresá con</span>
          <div className="flex-1 border-t border-slate-300"></div>
        </div>

        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={respuestaGoogleExitosa}
            onError={() => setError('El usuario canceló el inicio con Google')}
            useOneTap
            width="320"
          />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿No tienes cuenta?
          <span 
            onClick={() => navigate('/register')}
            className="text-blue-600 font-bold ml-1 hover:underline cursor-pointer"
          >
            Crear cuenta aquí
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;