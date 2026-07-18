import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Imports desde la nueva carpeta components
import Sidebar from './components/Sidebar';
import POSSidebar from './components/POSSidebar';
import PageLayout from './components/PageLayout'; 
import AdminSidebar from './components/AdminSidebar';

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
import AdminDashboard from './pages/AdminDashboard';
import POSOrders from './pages/POSOrders';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminUsers from './pages/AdminUsers';
import AdminNotifications from './pages/AdminNotifications';
import ClientNotifications from './pages/ClientNotifications';

function App() {
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem('token'));
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [userRol, setUserRol] = useState('cliente'); // Control dinámico de accesos para el TIF
  
  // Estado global para controlar si el sidebar está abierto o cerrado
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
      return prevItems.map((item) => {
        if (item.id === id && item.colorElegido === color) {
          const nuevaCantidad = item.cantidad + delta;
          
          //Si el producto es viejo y no tiene stock guardado, asume un tope alto para no trabarse.
          const stockMaximo = item.stock !== undefined ? item.stock : 99; 
          
          if (nuevaCantidad >= 1 && nuevaCantidad <= stockMaximo) {
            return { ...item, cantidad: nuevaCantidad }; // Clona y actualiza, forzando re-render
          }
        }
        return item; // Retorna intacto si intenta pasarse del stock
      });
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
    <div className="flex w-full min-h-screen bg-slate-50">
    {/* RENDERIZADO DEL SIDEBAR CONDICIONAL Y GLOBAL */}
      {autenticado && (
        userRol === 'admin' ? (
          <AdminSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        ) : userRol === 'empleado' ? (
          <POSSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        ) : (
          <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        )
      )}

      {/* RUTAS Y CONTENIDO DE LA PÁGINA */}
      <Routes>
        {/* Rutas Públicas (Sin Layout ni Sidebar) */}
        <Route path="/login" element={<Login setAutenticado={setAutenticado} />} />
        <Route path="/register" element={<Register />} />

        {/* RUTA RAÍZ */}
        <Route 
          path="/" 
          element={
            autenticado ? (
              <PageLayout isSidebarOpen={isSidebarOpen}>
                {userRol === 'admin' ? (
                  <AdminDashboard />
                ) : userRol === 'empleado' ? (
                  <POSEmployee />
                ) : (
                  <Home userName={nombreUsuario} />
                )}
              </PageLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* RUTA PRODUCTOS / INVENTARIO */}
        <Route 
          path="/products" 
          element={
            autenticado ? (
              <PageLayout isSidebarOpen={isSidebarOpen}>
                {(userRol === 'empleado' || userRol === 'admin') ? (
                  <POSInventory />
                ) : (
                  <Products userName={nombreUsuario} addToCart={addToCart} globalCP={globalCP} setGlobalCP={setGlobalCP} />
                )}
              </PageLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* RUTA CARRITO */}
        <Route 
          path="/cart" 
          element={
            autenticado ? (
              <PageLayout isSidebarOpen={isSidebarOpen}>
                <Cart 
                  userName={nombreUsuario} 
                  cartItems={cartItems} 
                  setCartItems={setCartItems} 
                  updateQuantity={updateQuantity} 
                  removeFromCart={removeFromCart} 
                  globalCP={globalCP} 
                  setGlobalCP={setGlobalCP} 
                  clearCart={clearCart} 
                />
              </PageLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* RUTA TALLER */}
        <Route 
          path="/workshop" 
          element={
            autenticado ? (
              <PageLayout isSidebarOpen={isSidebarOpen}>
                {(userRol === 'empleado' || userRol === 'admin') ? <POSWorkshop /> : <Workshop />}
              </PageLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        {/* RUTA GESTIÓN DE PEDIDOS WEB */}
        <Route 
          path="/orders" 
          element={
            autenticado ? (
              <PageLayout isSidebarOpen={isSidebarOpen}>
                {(userRol === 'empleado' || userRol === 'admin') ? <POSOrders /> : <Navigate to="/" />}
              </PageLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* RUTA PERFIL */}
        <Route 
          path="/profile" 
          element={
            autenticado ? (
              <PageLayout isSidebarOpen={isSidebarOpen}>
                <Profile />
              </PageLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        {/* RUTA ESTADÍSTICAS */}
        <Route 
          path="/analytics" 
          element={
            autenticado ? (
              <PageLayout isSidebarOpen={isSidebarOpen}>
                {userRol === 'admin' ? <AdminAnalytics /> : <Navigate to="/" />}
              </PageLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        {/* RUTA GESTIÓN DE USUARIOS */}
        <Route 
          path="/users" 
          element={
            autenticado ? (
              <PageLayout isSidebarOpen={isSidebarOpen}>
                {userRol === 'admin' ? <AdminUsers /> : <Navigate to="/" />}
              </PageLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        {/* RUTA HISTORIAL DE NOTIFICACIONES (INTELIGENTE) */}
        <Route 
          path="/notifications" 
          element={
            autenticado ? (
              <PageLayout isSidebarOpen={isSidebarOpen}>
                {(userRol === 'admin' || userRol === 'empleado') 
                  ? <AdminNotifications /> 
                  : <ClientNotifications />
                }
              </PageLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* RUTA POR DEFECTO (404) */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </div>
  );
}

export default App;