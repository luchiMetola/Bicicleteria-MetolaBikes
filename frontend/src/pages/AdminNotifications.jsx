import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, DollarSign, Clock, BellRing, PackageX } from 'lucide-react';

function AdminNotifications() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. CARGA INICIAL
  useEffect(() => {
    const cargaInicial = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/admin/notificaciones/todas', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotificaciones(res.data);
      } catch (error) {
        console.error('Error cargando el historial de notificaciones:', error);
      } finally {
        setLoading(false);
      }
    };
    
    cargaInicial();
  }, []);

  // 2. BOTÓN DE ACTUALIZAR
  const marcarTodoComoLeido = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/admin/notificaciones/leer', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const res = await axios.get('http://localhost:5000/api/admin/notificaciones/todas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotificaciones(res.data); 

    } catch (error) {
      console.error('Error al marcar como leídas:', error);
    }
  };

  // 3. FUNCIÓN DE REDIRECCIÓN INTERACTIVA
  const redirigirPorTipo = (tipo) => {
    if (tipo === 'venta_web') {
      navigate('/orders');
    } else if (tipo === 'alerta_stock') {
      navigate('/products');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 w-full transition-all">
      <header className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <BellRing className="w-6 h-6 text-indigo-600" /> Historial de Notificaciones
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Registro completo de alertas operativas (Ventas Web y Falta de Stock).</p>
        </div>
        
        <button 
          onClick={marcarTodoComoLeido}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4" /> Marcar todo como leído
        </button>
      </header>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        {loading ? (
          <p className="text-center text-slate-400 font-bold animate-pulse py-10">Cargando registros...</p>
        ) : notificaciones.length === 0 ? (
          <p className="text-center text-slate-400 italic py-10">No hay notificaciones registradas en el sistema.</p>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {notificaciones.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => redirigirPorTipo(notif.tipo)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] ${
                  notif.leido === 0 
                    ? 'bg-blue-50/40 border-blue-100 shadow-sm' 
                    : 'bg-slate-50 border-slate-100 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Ícono dinámico según el tipo de alerta */}
                <div className={`p-3 rounded-full shrink-0 shadow-sm ${
                  notif.tipo === 'alerta_stock' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {notif.tipo === 'alerta_stock' ? <PackageX className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${
                      notif.tipo === 'alerta_stock' ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {notif.tipo === 'alerta_stock' ? '⚠️ Alerta de Inventario' : '🛒 Ingreso de Venta Web'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                      <Clock className="w-3 h-3" /> {notif.fecha_formateada}
                    </span>
                  </div>
                  <p className={`text-sm ${notif.leido === 0 ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                    {notif.mensaje}
                  </p>
                </div>
                
                {/* Indicador de Nuevo */}
                {notif.leido === 0 && (
                  <div className="w-2.5 h-2.5 bg-rose-500 rounded-full shrink-0 mt-2 shadow-sm animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminNotifications;