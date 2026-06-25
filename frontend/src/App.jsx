import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import Home from './Home';
import Products from './Products';
import Cart from './Cart';
import Workshop from './Workshop';
import Profile from './Profile';
import Login from './Login';
import Register from './Register';

function App() {
  // Estado dinámico reactivo para verificar si existe sesión activa
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem('token'));
  const [nombreUsuario, setNombreUsuario] = useState('');

  useEffect(() => {
    if (!autenticado) return;
    
    const cargarNombre = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/perfil', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setNombreUsuario(response.data.nombre); // Guarda tu nombre real de la base de datos
      } catch (err) {
        console.error('Error fetching global profile:', err);
        setNombreUsuario('Lucía'); // Backup por si falla la red
      }
    };
    cargarNombre();
  }, [autenticado]);

  return (
    <Routes>
      {/* Rutas Protegidas que requieren Autenticación e inyectan la Sidebar colapsable */}
      <Route path="/" element={autenticado ? <><Sidebar /><Home userName={nombreUsuario} /></> : <Navigate to="/login" />} />
      <Route path="/products" element={autenticado ? <><Sidebar /><Products userName={nombreUsuario} /></> : <Navigate to="/login" />} />
      <Route path="/cart" element={autenticado ? <><Sidebar /><Cart /></> : <Navigate to="/login" />} />
      <Route path="/workshop" element={autenticado ? <><Sidebar /><Workshop /></> : <Navigate to="/login" />} />
      <Route path="/profile" element={autenticado ? <><Sidebar /><Profile /></> : <Navigate to="/login" />} />

      {/* Rutas Públicas Independientes */}
      <Route path="/login" element={<Login setAutenticado={setAutenticado} />} />
      <Route path="/register" element={<Register />} />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;