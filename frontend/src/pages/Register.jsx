import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
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
  
  // Estados Google
  const [pidiendoDatosExtra, setPidiendoDatosExtra] = useState(false);
  const [datosGoogle, setDatosGoogle] = useState({ nombre: '', email: '' });
  const [telefonoExtra, setTelefonoExtra] = useState('');
  const [direccionExtra, setDireccionExtra] = useState('');

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
          setDatosGoogle(data.datosGoogle);
          setPidiendoDatosExtra(true);
        } else {
          localStorage.setItem('token', data.token);
          window.location.href = '/'; 
        }
      } else {
        alert(data.error || "Error al iniciar sesión con Google");
      }
    } catch (error) {
      console.error("Error en Google Login:", error);
    }
  };

  const finalizarRegistroGoogle = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: datosGoogle.nombre,
          email: datosGoogle.email,
          contrasena: 'MetolaGoogle2026!',
          telefono: telefonoExtra,
          direccion: direccionExtra,
          rol: 'cliente'
        })
      });

      if (res.ok) {
        alert('¡Cuenta creada con éxito! Ahora podés iniciar sesión.');
        window.location.reload(); 
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      console.error("Error al registrar usuario de Google:", error);
    }
  };

  const validarPasswordSegura = (pass) => {
    const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(pass);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (!validarPasswordSegura(password)) {
      setError('La contraseña debe tener al menos 8 caracteres, una letra mayúscula y un número.');
      setLoading(false);
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        nombre: name,
        email,
        contrasena: password,
        rol: 'cliente',
        telefono: phone,
        direccion: address
      });

      setMessage('¡Cuenta creada con éxito! Redirigiendo...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.error || 'Fallo al registrar la cuenta.');
      } else {
        setError('No se pudo conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-100 font-sans p-4 absolute inset-0 z-50">
      {/* ⚠️ CORRECCIÓN: Agregado max-h-[95vh] y overflow-y-auto para evitar cortes en el formulario */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-center mb-3">
          <img src="/LogosMetolaBikes.svg" alt="Metola Bikes Logo" className="h-12 w-auto object-contain" />
        </div>
        <h2 className="text-2xl font-black text-center text-slate-800 mb-1">Crear cuenta</h2>
        <h3 className="text-center text-slate-500 font-medium text-xs mb-5">Ingresá a Metola Bikes</h3>

        {message && (
          <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {pidiendoDatosExtra ? (
          <form onSubmit={finalizarRegistroGoogle} className="flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-md font-bold text-slate-800">¡Casi listo, {datosGoogle.nombre.split(' ')[0]}!</h3>
            <p className="text-xs text-slate-500">Necesitamos un par de datos más para poder enviarte tus compras y registrar tus turnos en el taller.</p>
            
            <input 
              type="text" 
              placeholder="Tu Teléfono (Ej: 2641234567)" 
              required 
              value={telefonoExtra} 
              onChange={(e) => setTelefonoExtra(e.target.value)} 
              className="p-3 border border-slate-300 rounded-lg text-sm"
            />
            <input 
              type="text" 
              placeholder="Tu Dirección de Envío" 
              required 
              value={direccionExtra} 
              onChange={(e) => setDireccionExtra(e.target.value)} 
              className="p-3 border border-slate-300 rounded-lg text-sm"
            />
            <button type="submit" className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Finalizar Registro
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe"
                    className="w-full p-2 pl-10 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@email.com"
                    className="w-full p-2 pl-10 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Número de Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+54 264 123456"
                    className="w-full p-2 pl-10 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Dirección de Envío</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="Calle, Número y Localidad"
                    className="w-full p-2 pl-10 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    placeholder="••••••••"
                    className="w-full p-2 pl-10 pr-10 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-lg shadow-md transition-colors cursor-pointer text-sm flex items-center justify-center gap-2 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? 'Creando cuenta...' : 'Registrar'}
              </button>
            </form>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-slate-300"></div>
              <span className="px-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">O ingresá con</span>
              <div className="flex-1 border-t border-slate-300"></div>
            </div>

            {/* ⚠️ CORRECCIÓN: Botón de Google centrado y estirado a 320px de ancho */}
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={respuestaGoogleExitosa}
                onError={() => console.log('El usuario canceló el inicio con Google')}
                useOneTap
                width="320" 
              />
            </div>
          </>
        )}

        <p className="mt-5 text-center text-sm text-slate-500">
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