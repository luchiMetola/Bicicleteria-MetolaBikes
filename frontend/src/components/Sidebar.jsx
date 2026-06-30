import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, User, ShoppingCart, Wrench, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const cerrarSesion = () => {
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
      ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mt-2">
          {!isCollapsed && <h2 className="text-lg font-black tracking-tight text-blue-400 pl-2">Metola Bikes</h2>}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer text-slate-400 hover:text-white mx-auto"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="flex flex-col space-y-2">
          <Link to="/" className={linkClase('/')}>
            <Home className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Home</span>}
          </Link>
          <Link to="/products" className={linkClase('/products')}>
            <Package className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Productos</span>}
          </Link>
          <Link to="/cart" className={linkClase('/cart')}>
            <ShoppingCart className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Carrito</span>}
          </Link>
          <Link to="/workshop" className={linkClase('/workshop')}>
            <Wrench className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Taller</span>}
          </Link>
          <Link to="/profile" className={linkClase('/profile')}>
            <User className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Perfil</span>}
          </Link>
        </nav>
      </div>

      <div>
        <button 
          onClick={cerrarSesion}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all w-full text-left cursor-pointer
            ${isCollapsed ? 'justify-center' : 'justify-start'}`}
        >
          <LogOut className="w-5 h-5 flex shrink-0" /> 
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;