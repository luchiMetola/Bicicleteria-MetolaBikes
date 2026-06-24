import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { House, Package, User, ShoppingCart, Wrench, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // Función para marcar cuál enlace está activo
  const linkClase = (path) => {
    const base = "px-4 py-3 rounded-xl transition-all font-semibold text-sm flex items-center gap-3 ";
    return location.pathname === path 
      ? base + "bg-blue-600 text-white shadow-sm" 
      : base + "text-slate-400 hover:bg-slate-800 hover:text-white";
  };

  return (
    <aside className={`fixed top-0 left-0 h-full bg-slate-900 text-white p-4 shadow-xl transition-all duration-300 z-40 flex flex-col justify-between
      ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="space-y-8">
        {/* Encabezado del menú con botón de colapsar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mt-2">
          {!isCollapsed && <h2 className="text-lg font-black tracking-tight text-blue-400 pl-2">🚲 Metola Bikes</h2>}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer text-slate-400 hover:text-white mx-auto"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Navegación */}
        <nav className="flex flex-col space-y-2">
          <Link to="/" className={linkClase('/')}>
            <House className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Home</span>}
          </Link>
          <Link to="/products" className={linkClase('/productos')}>
            <Package className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Products</span>}
          </Link>
          <Link to="/cart" className={linkClase('/carrito')}>
            <ShoppingCart className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Cart</span>}
          </Link>
          <Link to="/workshop" className={linkClase('/taller')}>
            <Wrench className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Workshop</span>}
          </Link>
          <Link to="/profile" className={linkClase('/perfil')}>
            <User className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Profile</span>}
          </Link>
        </nav>
      </div>

      {/* Botón Cerrar Sesión */}
      <div>
        <button 
          onClick={cerrarSesion}
          className={`w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl transition-colors font-bold text-sm cursor-pointer shadow-sm flex items-center gap-2
            ${isCollapsed ? 'justify-center' : 'justify-start'}`}
        >
          <LogOut className="w-4 h-4 shrink-0" /> 
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;