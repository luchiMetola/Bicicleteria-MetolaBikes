import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Package, Wrench, Users, LogOut, ChevronLeft, ChevronRight, Truck } from 'lucide-react';

function AdminSidebar({isSidebarOpen, setIsSidebarOpen}) {
  const location = useLocation();

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
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mt-2">
          {isSidebarOpen && <h2 className="text-lg font-black tracking-tight text-indigo-400 pl-2">Admin Panel</h2>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer text-slate-400 hover:text-white mx-auto"
          >
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 w-full">
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

          <Link to="/workshop" className={linkClase('/workshop')}>
            <Wrench className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>Supervisar Taller</span>}
          </Link>

          <Link to="/profile" className={linkClase('/profile')}>
            <Users className="w-5 h-5 shrink-0" />
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