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
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem('token'));
  const [nombreUsuario, setNombreUsuario] = useState('');
  
  // Persistencia: Inicializamos el carrito leyendo el localStorage si existe
  const [cartItems, setCartItems] = useState(() => {
    const localCart = localStorage.getItem('metola_cart');
    return localCart ? JSON.parse(localCart) : [];
  });

  // Estado global para recordar el Código Postal calculado
  const [globalCP, setGlobalCP] = useState(localStorage.getItem('metola_cp') || '');

  // Guardar automáticamente el carrito y el CP en el disco cada vez que cambien
  useEffect(() => {
    localStorage.setItem('metola_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('metola_cp', globalCP);
  }, [globalCP]);

  // Agregar al carrito considerando ID + Color seleccionado
  const addToCart = (product, color = 'Único') => {
    setCartItems((prevItems) => {
      // Creamos una clave única combinando id y color
      const itemExiste = prevItems.find((item) => item.id === product.id && item.colorElegido === color);
      if (itemExiste) {
        return prevItems.map((item) =>
          item.id === product.id && item.colorElegido === color 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        );
      }
      return [...prevItems, { ...product, cantidad: 1, colorElegido: color }];
    });
  };

  // Modificar cantidad de forma reactiva inmediata usando ID + Color
  const updateQuantity = (id, color, delta) => {
    setCartItems((prevItems) => {
      const nuevoCarrito = prevItems.map((item) => {
        if (item.id === id && item.colorElegido === color) {
          const nuevaCantidad = item.cantidad + delta;
          // Retornamos el objeto modificado si la cantidad es mayor o igual a 1
          return nuevaCantidad >= 1 ? { ...item, cantidad: nuevaCantidad } : item;
        }
        return item;
      });
      // Devolvemos una copia nueva estructurada para que React actualice los componentes al milisegundo
      return [...nuevoCarrito];
    });
  };
  const removeFromCart = (id, color) => {
    setCartItems((prevItems) => {
      // Filtramos quitando la combinación exacta de ID y Color
      const nuevoCarrito = prevItems.filter(item => !(item.id === id && item.colorElegido === color));
      return [...nuevoCarrito]; // Devolvemos una copia estructurada nueva
    });
  };

  useEffect(() => {
    if (!autenticado) return;
    const cargarNombre = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/perfil', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setNombreUsuario(response.data.nombre);
      } catch (err) {
        console.error('Error fetching global profile:', err);
        setNombreUsuario('Usuario');
      }
    };
    cargarNombre();
  }, [autenticado]);

  return (
    <Routes>
      <Route path="/" element={autenticado ? <><Sidebar /><Home userName={nombreUsuario} /></> : <Navigate to="/login" />} />
      <Route path="/products" element={autenticado ? <><Sidebar /><Products userName={nombreUsuario} addToCart={addToCart} globalCP={globalCP} setGlobalCP={setGlobalCP} /></> : <Navigate to="/login" />} />
      <Route path="/cart" element={autenticado ? <><Sidebar /><Cart userName={nombreUsuario} cartItems={cartItems} setCartItems={setCartItems} updateQuantity={updateQuantity} removeFromCart={removeFromCart} globalCP={globalCP} setGlobalCP={setGlobalCP} /></> : <Navigate to="/login" />} />
      <Route path="/workshop" element={autenticado ? <><Sidebar /><Workshop /></> : <Navigate to="/login" />} />
      <Route path="/profile" element={autenticado ? <><Sidebar /><Profile /></> : <Navigate to="/login" />} />
      <Route path="/login" element={<Login setAutenticado={setAutenticado} />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;