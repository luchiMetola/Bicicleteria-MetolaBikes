import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wrench, Check, X, Clock, Play, CheckCircle2 } from 'lucide-react';

function POSWorkshop() {
  const [appointments, setAppointments] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const loadWorkshopData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/admin/equipo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppointments(response.data);
      } catch (error) {
        console.error('Error loading workshop tasks:', error);
      }
    };
    loadWorkshopData();
  }, []);

  const fetchAppointmentsAfterAction = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/equipo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error updating state grid:', error);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setLoadingId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/admin/equipo/${id}`, 
        { estado: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotification(res.data.message);
      fetchAppointmentsAfterAction();
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error transitioning status:', error);
    } finally {
      setLoadingId(null);
    }
  };

  const pendingRequests = appointments.filter(app => !app.estado || app.estado === 'Pendiente');
  const activeRepairs = appointments.filter(app => app.estado && app.estado !== 'Pendiente' && app.estado !== 'Rechazado');

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 pl-24 md:pl-72 w-full transition-all">
      <header className="border-b border-slate-200 pb-4 mb-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Wrench className="w-6 h-6 text-blue-600" /> Control de Taller & Reparaciones
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">Gestión de turnos de mantenimiento y actualización de estados del mecánico.</p>
      </header>

      {notification && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {notification}
        </div>
      )}

      <div className="space-y-8 w-full">
        
        {/* BLOQUE 1: MODERACIÓN DE SOLICITUDES ENTRANTES */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Nuevas Solicitudes por Evaluar ({pendingRequests.length})
          </h2>

          {pendingRequests.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-4">No hay turnos pendientes de confirmación.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((app) => (
                <div key={app.id} className="border border-slate-100 bg-slate-50 p-4 rounded-xl flex flex-col justify-between gap-3 text-xs">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800 text-sm">{app.bici_modelo}</span>
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-black">PENDIENTE</span>
                    </div>
                    <p className="text-blue-600 font-extrabold mb-2">Programado para: {app.equipo_dato}</p>
                    <p className="text-slate-500 font-medium bg-white p-2 rounded-lg border border-slate-200/60">{app.descripcion || 'Sin comentarios adicionales.'}</p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200/50">
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'Aceptado')}
                      disabled={loadingId === app.id}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Aceptar Turno
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'Rechazado')}
                      disabled={loadingId === app.id}
                      className="flex-1 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BLOQUE 2: CRONOGRAMA DE TRABAJO */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs overflow-x-auto">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-500" /> Planilla de Trabajo del Mecánico ({activeRepairs.length})
          </h2>

          {activeRepairs.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-4 text-center">No hay reparaciones en curso el día de hoy.</p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="py-3 pl-2">ID</th>
                  <th className="py-3">Vehículo / Bicicleta</th>
                  <th className="py-3">Fecha y Hora Arribo</th>
                  <th className="py-3">Diagnóstico Reportado</th>
                  <th className="py-3">Progreso de Reparación</th>
                  <th className="py-3 text-right pr-2">Acción de Flujo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                {activeRepairs.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pl-2 text-slate-400">#{app.id}</td>
                    <td className="py-4 font-bold text-slate-800">{app.bici_modelo}</td>
                    <td className="py-4 text-blue-600 font-bold">{app.equipo_dato}</td>
                    <td className="py-4 text-slate-500 max-w-xs truncate" title={app.descripcion}>{app.descripcion}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                        app.estado === 'Aceptado' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        app.estado === 'En Proceso' ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse' :
                        'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}>
                        {app.estado === 'Aceptado' ? 'Turno Confirmado' : app.estado}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      {app.estado === 'Aceptado' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'En Proceso')}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Comenzar Reparación
                        </button>
                      )}
                      {app.estado === 'En Proceso' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'Finalizado')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terminar Trabajo
                        </button>
                      )}
                      {app.estado === 'Finalizado' && (
                        <span className="text-slate-400 text-[11px] italic flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Listo para Retirar
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}

export default POSWorkshop;