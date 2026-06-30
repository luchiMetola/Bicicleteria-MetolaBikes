import { Search, User } from 'lucide-react';

function Header({ searchTerm, setSearchTerm, userName }) {
  return (
    <div className="w-full bg-white border-b border-slate-200 py-4 px-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs rounded-2xl">
      
      {/* 1. Izquierda: Logo corporativo */}
      <div className="flex items-center gap-2 shrink-0">
        <img src="/LogosMetolaBikes.svg" alt="Metola Bikes" className="h-10 w-auto object-contain" />
      </div>

      {/* 2. Centro: Barra de búsqueda (Search) - Ocupa todo el espacio disponible */}
      <div className="w-full md:flex-1 max-w-xl relative mx-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full p-2.5 pl-10 border border-slate-300 rounded-xl text-sm bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      {/* 3. Derecha: Círculo de Usuario y Nombre dinámico */}
      <div className="flex items-center gap-3 shrink-0 bg-slate-50 pl-3 pr-4 py-1.5 rounded-full border border-slate-100 w-full md:w-auto justify-center md:justify-start">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs uppercase shrink-0">
          {userName ? userName.charAt(0) : <User className="w-4 h-4" />}
        </div>
        <span className="text-slate-700 font-bold text-sm truncate max-w-150px">
          {userName || 'Cargando usuario...'}
        </span>
      </div>

    </div>
  );
}

export default Header;