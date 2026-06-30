import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Imports desde la nueva carpeta components
import Sidebar from './components/Sidebar';
import POSSidebar from './components/POSSidebar';

// Imports desde la nueva carpeta pages
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Workshop from './pages/Workshop';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import POSEmployee from './pages/POSEmployee';
import POSInventory from './pages/POSInventory';
import POSWorkshop from './pages/POSWorkshop';

function App() {
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem('token'));
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [userRol, setUserRol] = useState('cliente'); // Control dinámico de accesos para el TIF

  const [cartItems, setCartItems] = useState(() => {
    const localCart = localStorage.getItem('metola_cart');
    return localCart ? JSON.parse(localCart) : [];
  });

  const [globalCP, setGlobalCP] = useState(localStorage.getItem('metola_cp') || '');

  useEffect(() => {
    localStorage.setItem('metola_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('metola_cp', globalCP);
  }, [globalCP]);

  const addToCart = (product, color = 'Único') => {
    setCartItems((prevItems) => {
      const itemExiste = prevItems.find((item) => item.id === product.id && item.colorElegido === color);
      if (itemExiste) {
        return prevItems.map((item) =>
          item.id === product.id && item.colorElegido === color ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prevItems, { ...product, cantidad: 1, colorElegido: color }];
    });
  };

  const updateQuantity = (id, color, delta) => {
    setCartItems((prevItems) => {
      const nuevoCarrito = prevItems.map((item) => {
        if (item.id === id && item.colorElegido === color) {
          const nuevaCantidad = item.cantidad + delta;
          return nuevaCantidad >= 1 ? { ...item, cantidad: nuevaCantidad } : item;
        }
        return item;
      });
      return [...nuevoCarrito];
    });
  };

  const removeFromCart = (id, color) => {
    setCartItems((prevItems) => {
      return prevItems.filter(item => !(item.id === id && item.colorElegido === color));
    });
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.setItem('metola_cart', JSON.stringify([]));
  };

  // Trae nombre y rol validados desde la base de datos
  useEffect(() => {
    if (!autenticado) return;
    const cargarDatosSesion = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/perfil', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setNombreUsuario(response.data.nombre);
        setUserRol(response.data.rol || 'cliente');
      } catch (err) {
        console.error('Error fetching global profile:', err);
        setNombreUsuario('Usuario');
        setUserRol('cliente');
      }
    };
    cargarDatosSesion();
  }, [autenticado]);

  return (
  <Routes>
    {/* LA RUTA RAÍZ DINÁMICA: Si es empleado, ve la terminal de cobros en la pantalla principal. Si es cliente, ve el Inicio público */}
    <Route 
      path="/" 
      element={
        autenticado ? (
          userRol === 'empleado' ? (
            <><POSSidebar /><POSEmployee /></>
          ) : (
            <><Sidebar /><Home userName={nombreUsuario} /></>
          )
        ) : (
          <Navigate to="/login" />
        )
      } 
    />

    {/* Resto de rutas protegidas y adaptadas */}
    <Route path="/products" element={autenticado ? <>{userRol === 'empleado' ? <POSSidebar /> : <Sidebar />}{userRol === 'empleado' ? <POSInventory /> : <Products userName={nombreUsuario} addToCart={addToCart} globalCP={globalCP} setGlobalCP={setGlobalCP} />}</> : <Navigate to="/login" />} />
    <Route path="/cart" element={autenticado ? <>{userRol === 'empleado' ? <POSSidebar /> : <Sidebar />}\<Cart userName={nombreUsuario} cartItems={cartItems} setCartItems={setCartItems} updateQuantity={updateQuantity} removeFromCart={removeFromCart} globalCP={globalCP} setGlobalCP={setGlobalCP} clearCart={clearCart} />\</> : <Navigate to="/login" />} />
    <Route path="/workshop" element={autenticado ? <>{userRol === 'empleado' ? <POSSidebar /> : <Sidebar />}{userRol === 'empleado' ? <POSWorkshop /> : <Workshop />}</> : <Navigate to="/login" />} />
    <Route path="/profile" element={autenticado ? <>{userRol === 'empleado' ? <POSSidebar /> : <Sidebar />}\<Profile />\</> : <Navigate to="/login" />} />

    <Route path="/login" element={<Login setAutenticado={setAutenticado} />} />
    <Route path="/register" element={<Register />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);
}

export default App;