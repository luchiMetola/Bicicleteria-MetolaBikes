import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wrench, CheckCircle2, AlertCircle, Clock, Check, X, Play, Trash2, CalendarX, Power } from 'lucide-react';

function POSWorkshop() {
  const [appointments, setAppointments] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [notification, setNotification] = useState({ text: '', type: '' });

  // Estados para el Reclamo/Rechazo
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // ESTADOS NUEVOS PARA LA CONFIGURACIÓN LOGÍSTICA DE LA AGENDA
  const [tallerHabilitado, setTallerHabilitado] = useState(true);
  const [mensajeEstado, setMensajeEstado] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(false);

  // 1. CARGA INICIAL AISLADA Y SEGURA (Sin errores de React)
  useEffect(() => {
    const loadWorkshopData = async () => {
      try {
        const token = localStorage.getItem('token');
        // A) Cargar Turnos
        const response = await axios.get('http://localhost:5000/api/admin/equipo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppointments(response.data);

        // B) Cargar Configuración del interruptor
        const configRes = await axios.get('http://localhost:5000/api/equipo/config');
        setTallerHabilitado(Number(configRes.data.taller_habilitado) === 1);
        setMensajeEstado(configRes.data.mensaje_estado || '');
      } catch (error) {
        console.error('Error loading workshop infrastructure:', error);
      }
    };
    loadWorkshopData();
  }, []);

  // 2. FUNCIÓN AUXILIAR PARA RECARGAR LA TABLA DESPUÉS DE UN CAMBIO
  const recargarGrilla = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/equipo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error recargando la grilla:', error);
    }
  };

  const handleGuardarConfigAgenda = async (e) => {
    e.preventDefault();
    setLoadingConfig(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/admin/equipo/config', {
        taller_habilitado: tallerHabilitado,
        mensaje_estado: mensajeEstado
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotification({ text: 'Configuración de disponibilidad de la agenda actualizada correctamente.', type: 'success' });
      setTimeout(() => setNotification({ text: '', type: '' }), 4000);
    } catch (error) {
      console.error(error);
      setNotification({ text: 'Error al actualizar el interruptor de turnos.', type: 'error' });
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleAccept = async (id) => {
    setLoadingId(id);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/admin/equipo/${id}`, 
        { estado: 'Aceptado', motivo_rechazo: null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotification({ text: response.data.message, type: 'success' });
      recargarGrilla(); // <-- Ahora actualiza en vivo
    } catch (error) {
      console.error('Error accepting:', error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRejectSubmit = async (id) => {
    if (!rejectionReason) return;
    setLoadingId(id);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/admin/equipo/${id}`, 
        { estado: 'Rechazado', motivo_rechazo: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotification({ text: response.data.message, type: 'success' });
      setRejectingId(null);
      setRejectionReason('');
      recargarGrilla(); // <-- Ahora actualiza en vivo
    } catch (error) {
      console.error('Error rejecting:', error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    setLoadingId(id);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/admin/equipo/${id}`, 
        { estado: currentStatus, motivo_rechazo: null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotification({ text: response.data.message, type: 'success' });
      recargarGrilla(); // <-- Ahora actualiza en vivo
    } catch (error) {
      console.error('Error modifying workshop status:', error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('¿Querés eliminar definitivamente esta solicitud vieja del historial?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5000/api/admin/equipo/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotification({ text: response.data.message, type: 'success' });
      recargarGrilla(); // <-- Ahora actualiza en vivo
    } catch (error) {
      console.error('Error al borrar la solicitud:', error);
    }
  };

  const pendingRequests = appointments.filter(app => !app.estado || app.estado === 'Pendiente');
  const activeWorkshopRepairs = appointments.filter(app => app.estado && app.estado !== 'Pendiente');

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 w-full transition-all">
      <header className="border-b border-slate-200 pb-4 mb-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Wrench className="w-6 h-6 text-[#3A53A4]" /> Control de Taller & Reparaciones
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">Gestión de turnos de mantenimiento y actualización de estados del mecánico.</p>
      </header>

      {notification.text && (
        <div className={`mb-6 p-3 border rounded-xl text-xs font-bold flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {notification.text}
        </div>
      )}

      {/* PANEL NUEVO INTERACTIVO: REGULACIÓN DE DEMANDA Y BLOQUEO GLOBAL */}
      <div className="bg-slate-800 text-white rounded-2xl p-5 mb-6 shadow-sm border border-slate-700">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-700 pb-2 mb-4 flex items-center gap-1.5">
          <CalendarX className="w-4 h-4 text-amber-500" /> Regulador de Capacidad Operativa y Control de Saturación
        </h3>
        <form onSubmit={handleGuardarConfigAgenda} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 block uppercase tracking-wide text-[10px]">Recepción de Turnos Web:</label>
            <button
              type="button"
              onClick={() => setTallerHabilitado(!tallerHabilitado)}
              className={`w-full p-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
                tallerHabilitado 
                  ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30' 
                  : 'bg-rose-600/20 border-rose-500/40 text-rose-400 hover:bg-rose-600/30'
              }`}
            >
              <Power className="w-4 h-4" /> {tallerHabilitado ? 'AGENDA ONLINE: ABIERTA' : 'AGENDA ONLINE: PAUSADA'}
            </button>
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label className="font-bold text-slate-300 block uppercase tracking-wide text-[10px]">Aviso / Comunicado Informativo de Demora:</label>
            <input
              type="text"
              value={mensajeEstado}
              onChange={(e) => setMensajeEstado(e.target.value)}
              placeholder="Ej: Taller saturado. Demora estimada de 48hs."
              className="w-full p-2.5 border border-slate-600 rounded-xl bg-slate-900 text-slate-100 font-semibold shadow-inner outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loadingConfig}
            className="w-full p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl uppercase tracking-wider cursor-pointer shadow-md transition-colors"
          >
            {loadingConfig ? 'Aplicando...' : 'Aplicar Regulación'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
        {/* COLUMNA IZQUIERDA: SOLICITUDES ENTRANTES */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Nuevas Solicitudes por Evaluar ({pendingRequests.length})
          </h2>

          {pendingRequests.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-4">No hay turnos pendientes de confirmación.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {pendingRequests.map((app) => (
                <div key={app.id} className="border border-slate-100 bg-slate-50 p-4 rounded-xl flex flex-col justify-between gap-3 text-xs">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800 text-sm">{app.bici_modelo}</span>
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-black">PENDIENTE</span>
                    </div>
                    <p className="text-blue-600 font-extrabold mb-1">
                      Programado para: {app.equipo_dato && app.equipo_dato.includes(' ') ? `${app.equipo_dato.split(' ')[0].split('-').reverse().join('/')} a las ${app.equipo_dato.split(' ')[1]}` : app.equipo_dato} hs
                    </p>
                    <p className="text-slate-700 font-bold mb-2 bg-slate-200/50 p-1.5 rounded-lg">
                      👤 Cliente: {app.cliente_nombre || 'No asignado'} | 📞 Tel: {app.cliente_telefono || 'Sin teléfono'}
                    </p>
                    <p className="text-slate-500 font-medium bg-white p-2 rounded-lg border border-slate-200/60">{app.descripcion || 'Sin comentarios adicionales.'}</p>
                  </div>
                  
                  {rejectingId === app.id ? (
                    <div className="pt-2 border-t border-slate-200 space-y-2 animate-in fade-in duration-100">
                      <label className="block font-bold text-rose-600 uppercase text-[10px]">Especificar Motivo del Rechazo:</label>
                      <input 
                        type="text" required value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Ej: Es feriado nacional / No hay cupo mecánico"
                        className="w-full p-2 border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleRejectSubmit(app.id)} disabled={!rejectionReason || loadingId === app.id} className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer">Confirmar</button>
                        <button onClick={() => { setRejectingId(null); setRejectionReason(''); }} className="flex-1 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer">Atrás</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-2 border-t border-slate-200/50">
                      <button onClick={() => handleAccept(app.id)} disabled={loadingId === app.id} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"><Check className="w-3.5 h-3.5" /> Aceptar Turno</button>
                      <button onClick={() => setRejectingId(app.id)} disabled={loadingId === app.id} className="flex-1 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"><X className="w-3.5 h-3.5" /> Rechazar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: EN TALLER */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-500" /> En Taller ({activeWorkshopRepairs.length})
          </h2>

          {activeWorkshopRepairs.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-8 text-center border border-dashed border-slate-200 rounded-xl">No hay reparaciones activas en este momento.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {activeWorkshopRepairs.map((app) => (
                <div key={app.id} className="border border-slate-200/80 bg-white p-4 rounded-xl flex flex-col justify-between gap-3 text-xs shadow-xs">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-extrabold text-slate-800 text-sm">{app.bici_modelo}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${
                        app.estado === 'Aceptado' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        app.estado === 'En proceso' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                        app.estado === 'Cancelado' ? 'bg-red-50 border-rose-200 text-rose-700 font-black' :
                        app.estado === 'Finalizado' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        'bg-slate-100 border-slate-300 text-slate-600'
                      }`}>
                        {app.estado === 'Aceptado' ? 'Confirmado' : app.estado}
                      </span>
                    </div>

                    <p className="text-blue-600 font-bold mb-1">Llegada: {app.equipo_dato} hs</p>
                    <p className="text-slate-700 font-bold mb-2 bg-slate-100 p-1.5 rounded-lg">
                      👤 Cliente: {app.cliente_nombre || 'No asignado'} | 📞 Tel: {app.cliente_telefono || 'Sin teléfono'}
                    </p>
                    <p className="text-slate-500 font-medium mb-3">{app.descripcion}</p>

                    {(app.estado === 'Finalizado' || app.estado === 'Rechazado' || app.estado === 'Cancelado') && (
                      <button
                        onClick={() => handleDeleteRequest(app.id)}
                        className="w-full py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 font-bold rounded-xl border border-slate-200 hover:border-rose-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar Registro Histórico
                      </button>
                    )}
                  </div>

                  {app.estado !== 'Finalizado' && app.estado !== 'Rechazado' && app.estado !== 'Cancelado' && (
                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Actualizar Estado de Reparación:</label>
                      <select
                        value={app.estado}
                        disabled={loadingId === app.id}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="Aceptado">Aceptado (Espera de Arribo)</option>
                        <option value="En proceso">En proceso</option>
                        <option value="Finalizado">Finalizado (Listo para Retirar)</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default POSWorkshop;