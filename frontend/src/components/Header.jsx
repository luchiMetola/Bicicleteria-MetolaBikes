import { useState, useEffect } from 'react';
import { Search, User, Bell, X, BellOff } from 'lucide-react';

function Header({ searchTerm, setSearchTerm, userName }) {
  // === ESTADOS PARA NOTIFICACIONES DEL CLIENTE ===
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const token = localStorage.getItem('token'); // Verificamos si el usuario inició sesión

  useEffect(() => {
    const obtenerNotificaciones = async () => {
      if (!token) return;
      try {
        const response = await fetch('http://localhost:5000/api/notificaciones/mis-avisos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setNotificaciones(data);
        }
      } catch (error) {
        console.error("Error al obtener notificaciones:", error);
      }
    };

    obtenerNotificaciones();
    // Sondeo automático cada 15 segundos
    const interval = setInterval(obtenerNotificaciones, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const marcarComoLeidas = async () => {
    try {
      await fetch('http://localhost:5000/api/notificaciones/marcar-leidas', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotificaciones([]); // Vaciamos el globo de notificaciones
      setMostrarNotificaciones(false); // Cerramos el panel desplegable
    } catch (error) {
      console.error("Error al marcar como leídas:", error);
    }
  };

  return (
    <div className="w-full bg-white border-b border-slate-200 py-4 px-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs rounded-2xl">
      
      {/* 1. Izquierda: Logo corporativo */}
      <div className="flex items-center gap-2 shrink-0">
        <img src="/LogosMetolaBikes.svg" alt="Metola Bikes" className="h-10 w-auto object-contain" />
      </div>

      {/* 2. Centro: Barra de búsqueda */}
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

      {/* 3. Derecha: Campanita + Círculo de Usuario */}
      <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-center md:justify-start">
        
        {/* --- CAMPANITA DE NOTIFICACIONES --- */}
        {token && (
          <div className="relative">
            <button 
              onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all relative cursor-pointer"
              title="Mis Avisos"
            >
              <Bell className={`w-5 h-5 ${notificaciones.length > 0 ? 'text-orange-500 animate-bounce' : 'text-slate-400'}`} />
              
              {/* Globito rojo con el número (solo si hay avisos nuevos) */}
              {notificaciones.length > 0 && (
                <span className="absolute top-1 right-1 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm animate-pulse">
                  {notificaciones.length}
                </span>
              )}
            </button>

            {/* Menú Desplegable (Cae hacia abajo en el Header) */}
            {mostrarNotificaciones && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 text-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                  <span className="font-black text-[11px] uppercase tracking-wider text-slate-500">Mis Avisos</span>
                  <button 
                    onClick={() => setMostrarNotificaciones(false)} 
                    className="text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {notificaciones.map((notif) => (
                    <div key={notif.id} className="p-3 bg-orange-50 rounded-xl text-xs font-medium leading-relaxed border border-orange-200 text-orange-900 shadow-sm">
                      {notif.mensaje}
                      <span className="text-[9px] text-orange-600/70 mt-1 block font-bold">{notif.fecha_formateada}</span>
                    </div>
                  ))}
                  {notificaciones.length === 0 && (
                    <p className="text-slate-400 text-center text-xs font-semibold py-6">No tenés avisos nuevos.</p>
                  )}
                </div>

                {notificaciones.length > 0 && (
                  <button 
                    onClick={marcarComoLeidas}
                    className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BellOff className="w-3.5 h-3.5" /> Marcar como leídas
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Perfil de Usuario */}
        <div className="flex items-center gap-3 bg-slate-50 pl-3 pr-4 py-1.5 rounded-full border border-slate-100">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs uppercase shrink-0">
            {userName ? userName.charAt(0) : <User className="w-4 h-4" />}
          </div>
          <span className="text-slate-700 font-bold text-sm truncate max-w[150px]">
            {userName || 'Cargando usuario...'}
          </span>
        </div>

      </div>

    </div>
  );
}

export default Header;