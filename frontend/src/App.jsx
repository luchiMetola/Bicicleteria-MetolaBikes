import { useState } from 'react';
import axios from 'axios';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Home from './Home';
import Productos from './Products';
import Sidebar from './Sidebar';
import Carrito from './Cart';
import Taller from './Workshop';
import Perfil from './Profile';

function App() {
  const navigate = useNavigate();

  const [esLogin, setEsLogin] = useState(true);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // ESTADO DINÁMICO DE AUTENTICACIÓN
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem('token'));

  // Manejar Login
  const manejarLogin = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    try {
      const respuesta = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        contrasena
      });

      setMensaje(respuesta.data.mensaje);
      localStorage.setItem('token', respuesta.data.token);
      console.log('Token guardado con éxito:', respuesta.data.token);

      // Activamos el estado de autenticado de inmediato
      setAutenticado(true);

      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.mensaje || err.response.data.error);
      } else {
        setError('No se pudo conectar con el servidor.');
      }
    }
  };

  const manejarRegistro = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        nombre,
        email,
        contrasena,
        rol: 'cliente'
      });

      setMensaje('¡Registro exitoso! Ya podés iniciar sesión.');
      setNombre('');
      setContrasena('');
      setEsLogin(true);

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.error || 'Error al registrarse.');
      } else {
        setError('No se pudo conectar con el servidor.');
      }
    }
  };

  return (
    <Routes>
      {/* Si está autenticado, renderizamos la Sidebar al lado de la pantalla correspondiente */}
      <Route path="/" element={autenticado ? <><Sidebar /><Home /></> : <Navigate to="/login" />} />
      <Route path="/productos" element={autenticado ? <><Sidebar /><Productos /></> : <Navigate to="/login" />} />
      <Route path="/carrito" element={autenticado ? <><Sidebar /><Carrito /></> : <Navigate to="/login" />} />
      <Route path="/taller" element={autenticado ? <><Sidebar /><Taller /></> : <Navigate to="/login" />} />
      <Route path="/perfil" element={autenticado ? <><Sidebar /><Perfil /></> : <Navigate to="/login" />} />

      {/* El Login se queda limpio sin Sidebar */}
      <Route path="/login" element={
        <AuthForm 
          manejarLogin={manejarLogin}
          manejarRegistro={manejarRegistro}
          esLogin={esLogin}
          setEsLogin={setEsLogin}
          nombre={nombre}
          setNombre={setNombre}
          email={email}
          setEmail={setEmail}
          contrasena={contrasena}
          setContrasena={setContrasena}
          mostrarPassword={mostrarPassword}
          setMostrarPassword={setMostrarPassword}
          mensaje={mensaje}
          setMensaje={setMensaje}
          error={error}
          setError={setError}
        />
      } />
    </Routes>
  );
}

// Componente del Formulario estilizado con Tailwind v4
function AuthForm({ manejarLogin, manejarRegistro, esLogin, setEsLogin, nombre, setNombre, email, setEmail, contrasena, setContrasena, mostrarPassword, setMostrarPassword, mensaje, setMensaje, error, setError }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 font-sans p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <h2 className="text-2xl font-black text-center text-slate-800 mb-1">
          {esLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h2>
        <h3 className="text-center text-slate-500 font-medium text-sm mb-6">
          Bicicletería Metola Bikes
        </h3>

        {mensaje && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium">
            {mensaje}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={esLogin ? manejarLogin : manejarRegistro} className="space-y-4">
          {!esLogin && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Nombre:</label>
              <input 
                type="text" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                required 
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Email:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Contraseña:</label>
            <div className="relative">
              <input 
                type={mostrarPassword ? "text" : "password"} 
                value={contrasena} 
                onChange={(e) => setContrasena(e.target.value)} 
                required 
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 pr-10" 
              />
              <button 
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-lg focus:outline-hidden"
              >
                {mostrarPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors cursor-pointer text-sm tracking-wide mt-2"
          >
            {esLogin ? 'Ingresar' : 'Registrarse'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {esLogin ? '¿No tenés cuenta todavía?' : '¿Ya tenés una cuenta?'}
          <span 
            onClick={() => { setEsLogin(!esLogin); setMensaje(''); setError(''); setMostrarPassword(false); }}
            className="text-blue-600 font-bold ml-1 hover:underline cursor-pointer"
          >
            {esLogin ? 'Registrate acá' : 'Iniciá sesión'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default App;