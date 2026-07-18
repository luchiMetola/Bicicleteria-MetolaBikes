import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Package, Wrench, Users, User, LogOut, ChevronLeft, ChevronRight, Truck, PieChart,  BellOff, X, BellRing } from 'lucide-react';

function AdminSidebar({isSidebarOpen, setIsSidebarOpen}) {
  const location = useLocation();

  // --- 1. LÓGICA DE NOTIFICACIONES EN TIEMPO REAL ---
  const [alertas, setAlertas] = useState([]);
  const [mostrarModalAlertas, setMostrarModalAlertas] = useState(false);
  
  useEffect(() => {
  const obtenerAlertas = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('http://localhost:5000/api/admin/notificaciones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertas(res.data);
    } catch (error) {
      console.error('Error al cargar alertas del sistema:', error);
    }
  };
    obtenerAlertas();
    const interval = setInterval(obtenerAlertas, 10000);
    return () => clearInterval(interval);
  }, []);

  const limpiarCampanita = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/admin/notificaciones/leer', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertas([]);
      setMostrarModalAlertas(false);
    } catch (error) {
      console.error('Error al limpiar la campanita:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const linkClase = (path) => {
    const base = "px-4 py-3 rounded-xl transition-all font-semibold text-sm flex items-center gap-3 ";
    return location.pathname === path 
      ? base + "bg-blue-600 text-white shadow-sm" 
      : base + "text-slate-400 hover:bg-slate-800 hover:text-white";
  };

  return (
    <aside className={`fixed top-0 left-0 h-full bg-slate-900 text-white p-4 shadow-xl transition-all duration-300 z-40 flex flex-col justify-between
      ${isSidebarOpen ? 'w-64' : 'w-20'}`}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mt-2">
          {isSidebarOpen && <h2 className="text-lg font-black tracking-tight text-indigo-400 pl-2">Admin Panel</h2>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer text-slate-400 hover:text-white mx-auto"
          >
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* --- 2. SECCIÓN DE CAMPANITA DE ALERTAS --- */}
        <div className="relative w-full px-1">
          <button
            onClick={() => setMostrarModalAlertas(!mostrarModalAlertas)}
            className="flex items-center justify-center lg:justify-start gap-3 w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors relative cursor-pointer"
          >
            <div className="relative">
              <BellRing className={`w-5 h-5 ${alertas.length > 0 ? 'text-red-600 animate-bounce' : 'text-slate-400'}`} />
              {alertas.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-slate-900 shadow-sm animate-pulse">
                  {alertas.length}
                </span>
              )}
            </div>
            {isSidebarOpen && <span className="text-sm font-semibold text-slate-200">Alertas</span>}
          </button>

          {/* MENÚ FLOTANTE DE NOTIFICACIONES (Se abre hacia la derecha) */}
          {mostrarModalAlertas && (
            <div className="absolute top-0 left-full ml-4 z-50 w-72 bg-white border border-slate-200 text-slate-800 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-left-2 duration-150">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                <span className="font-black text-[11px] uppercase tracking-wider text-slate-500">Notificaciones Nuevas</span>
                <button onClick={() => setMostrarModalAlertas(false)} className="text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {alertas.map((alerta) => (
                  <div key={alerta.id} className={`p-3 rounded-xl text-xs font-medium leading-relaxed border shadow-xs ${
                    alerta.tipo === 'taller' ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    {alerta.mensaje}
                  </div>
                ))}
                {alertas.length === 0 && (
                  <p className="text-slate-400 text-center text-xs font-semibold py-6">No hay alertas nuevas en el sistema.</p>
                )}
              </div>

              {alertas.length > 0 && (
                <button 
                  onClick={limpiarCampanita}
                  className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BellOff className="w-3.5 h-3.5" /> Archivar Mensajes
                </button>
              )}
            </div>
          )}
        </div>

        {/* --- NAVEGACIÓN ORIGINAL --- */}
        <nav className="flex flex-col gap-1.5 w-full mt-2">
          <Link to="/" className={linkClase('/')}>
            <TrendingUp className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>Ventas</span>}
          </Link>

          <Link to="/products" className={linkClase('/products')}>
            <Package className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>Gestión de Inventario</span>}
          </Link>
          <Link to="/orders" className={linkClase('/orders')}>
            <Truck className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>Gestión de Envíos</span>}
          </Link>
          <Link to="/notifications" className={linkClase('/notifications')}>
            <BellRing className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>Notificaciones</span>}
          </Link>
          <Link to="/analytics" className={linkClase('/analytics')}>
            <PieChart className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>Estadísticas</span>}
          </Link>

          <Link to="/workshop" className={linkClase('/workshop')}>
            <Wrench className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>Supervisar Taller</span>}
          </Link>
          <Link to="/users" className={linkClase('/users')}>
            <Users className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>Gestión de Usuarios</span>}
          </Link>

          <Link to="/profile" className={linkClase('/profile')}>
            <User className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>Perfil</span>}
          </Link>
        </nav>
      </div>

      <div>
        <button 
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all w-full text-left cursor-pointer
            ${isSidebarOpen ? 'justify-center' : 'justify-start'}`}
        >
          <LogOut className="w-5 h-5 flex shrink-0" />
          {isSidebarOpen && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;