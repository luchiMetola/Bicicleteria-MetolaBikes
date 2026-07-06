import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, UserPlus, Eye, EyeOff } from 'lucide-react';

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      // Enviamos el objeto con las propiedades exactas que espera Node
      await axios.post('http://localhost:5000/api/auth/register', {
        nombre: name,
        email,
        contrasena: password,
        rol: 'cliente',
        telefono: phone,
        direccion: address
      });

      setMessage('Account created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.error || 'Registration failed.');
      } else {
        setError('Could not connect to the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-100 font-sans p-4 absolute inset-0 z-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 my-8">
        <div className="flex justify-center mb-4">
          <img src="/LogosMetolaBikes.svg" alt="Metola Bikes Logo" className="h-16 w-auto object-contain" />
        </div>
        <h2 className="text-2xl font-black text-center text-slate-800 mb-1">Crear cuenta</h2>
        <h3 className="text-center text-slate-500 font-medium text-sm mb-6">Ingresá a Metola Bikes</h3>

        {message && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Nombre completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe"
                className="w-full p-2.5 pl-10 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@email.com"
                className="w-full p-2.5 pl-10 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Número de Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+54 264 123456"
                className="w-full p-2.5 pl-10 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Dirección de Envío</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="Av. Libertador 1230, San Juan, Argentina"
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
            type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-lg shadow-md transition-colors cursor-pointer text-sm flex items-center justify-center gap-2 mt-2"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Crear cuenta...' : 'Registrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?
          <span onClick={() => navigate('/login')} className="text-blue-600 font-bold ml-1 hover:underline cursor-pointer">
            Ingresá aquí
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;