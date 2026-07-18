import { useState, useEffect } from 'react';
import { Bell, Wrench, Package, CheckCircle2 } from 'lucide-react';

function ClientNotifications() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
  const obtenerHistorial = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notificaciones/historial-cliente', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotificaciones(data);
      }
    } catch (error) {
      console.error("Error al obtener el historial:", error);
    } finally {
      setCargando(false);
    }
  };
   obtenerHistorial();
  }, [token]);

  const marcarComoLeidas = async () => {
    try {
      await fetch('http://localhost:5000/api/notificaciones/marcar-leidas', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Actualizamos el estado local para que los puntitos rojos desaparezcan
      setNotificaciones(notificaciones.map(n => ({ ...n, leido: 1 })));
    } catch (error) {
      console.error("Error al marcar como leídas:", error);
    }
  };

  // Función para elegir el ícono y color según el tipo de aviso
  const obtenerEstiloAviso = (tipo) => {
    if (tipo === 'taller') return { icon: <Wrench className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100' };
    if (tipo === 'venta_web') return { icon: <Package className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-100' };
    return { icon: <Bell className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-100' };
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-500" />
            Mi Historial de Avisos
          </h1>
          <p className="text-slate-500 text-sm mt-1">Acá podés revisar todas las alertas sobre tus compras y turnos.</p>
        </div>
        
        {/* Botón para marcar todo como leído */}
        {notificaciones.some(n => n.leido === 0) && (
          <button 
            onClick={marcarComoLeidas}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            Marcar todo como leído
          </button>
        )}
      </div>

      {cargando ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : notificaciones.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-12 text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Tu bandeja está vacía</h3>
          <p className="text-slate-500 text-sm mt-2">Todavía no tenés notificaciones en tu cuenta.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificaciones.map((notif) => {
            const estilo = obtenerEstiloAviso(notif.tipo);
            
            return (
              <div 
                key={notif.id} 
                className={`flex items-start gap-4 p-4 md:p-5 rounded-2xl border transition-all ${
                  notif.leido === 0 
                    ? 'bg-white border-orange-200 shadow-md relative overflow-hidden' 
                    : 'bg-slate-50 border-slate-200 opacity-75'
                }`}
              >
                {/* Indicador de "No leído" */}
                {notif.leido === 0 && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                )}

                <div className={`p-3 rounded-xl shrink-0 ${estilo.bg}`}>
                  {estilo.icon}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {notif.tipo === 'taller' ? 'Servicio Técnico' : 'Tienda Online'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100 shadow-xs inline-block w-fit">
                      {notif.fecha_formateada}
                    </span>
                  </div>
                  <p className={`text-sm ${notif.leido === 0 ? 'text-slate-800 font-semibold' : 'text-slate-600 font-medium'}`}>
                    {notif.mensaje}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ClientNotifications;