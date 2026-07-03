import { useState, useEffect } from 'react';
import axios from 'axios'; 
import Header from '../components/Header';
import { Wrench, Calendar, Clock, CheckCircle, AlertCircle, ListFilter } from 'lucide-react';

function Workshop({ userName }) {
  const [bikeModel, setBiciModelo] = useState('');
  const [description, setDescripcion] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  // States in English
  const [myAppointments, setMyAppointments] = useState([]);
  const [takenTimes, setTakenTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [notification, setNotification] = useState({ text: '', type: '' });

  const timeSlots = ['10:00', '10:30', '11:00', '11:30', '12:00'];

  // Sincronización asíncrona segura envuelta para limpiar advertencias de cascada
  useEffect(() => {
    const loadInitialClientAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/equipo/mis-turnos', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMyAppointments(response.data);
      } catch (error) {
        console.error('Error loading client tasks initially:', error);
      }
    };
    loadInitialClientAppointments();
  }, []);

  const fetchAppointmentsAfterAction = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/equipo/mis-turnos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyAppointments(response.data);
    } catch (error) {
      console.error('Error updating client task list:', error);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('¿Estás seguro de que querés cancelar este turno?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/equipo/cancelar/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotification({ text: '¡Turno cancelado correctamente!', type: 'success' });
      fetchAppointmentsAfterAction(); // Recarga la grilla
    } catch (error) {
      console.error('Error al cancelar turno:', error);
      setNotification({ text: 'No se pudo cancelar el turno.', type: 'error' });
    }
  };

  useEffect(() => {
    if (!selectedDate) return;

    const checkAvailableSlots = async () => {
      setLoadingTimes(true);
      setSelectedTime('');
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/equipo/ocupados?date=${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTakenTimes(response.data);
      } catch (error) {
        console.error('Error loading slots availability:', error);
      } finally {
        setLoadingTimes(false);
      }
    };

    checkAvailableSlots();
  }, [selectedDate]);

  const handleRequestAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setNotification({ text: 'Por favor, completá la agenda completa (Día y Hora).', type: 'error' });
      return;
    }

    setLoadingSubmit(true);
    setNotification({ text: '', type: '' });

    const fullScheduleString = `${selectedDate} ${selectedTime}`;

    const payload = {
      bici_modelo: bikeModel,
      equipo_dato: fullScheduleString,
      descripcion: description
    };

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/equipo', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotification({ text: '¡Turno solicitado con éxito!', type: 'success' });
      
      setBiciModelo('');
      setDescripcion('');
      setSelectedDate('');
      setSelectedTime('');
      setTakenTimes([]);
      fetchAppointmentsAfterAction(); 
    } catch (error) {
      console.error('Error processing schedule:', error);
      setNotification({ text: 'No se pudo reservar el turno. Verificá tu conexión.', type: 'error' });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const getTodayDateString = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 pl-24 md:pl-72 w-full transition-all">
      <Header searchTerm="" setSearchTerm={() => {}} userName={userName} />

      <header className="border-b border-slate-200 pb-4 mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Wrench className="w-6 h-6 text-blue-600" /> Servicio Técnico & Taller
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">Agendá un turno para traer tu bicicleta. El mecánico revisará el pedido en el acto.</p>
      </header>

      {notification.text && (
        <div className={`mb-5 p-3.5 border rounded-xl text-xs font-bold flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {notification.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full items-start">
        
        {/* FORMULARIO DE ALTA */}
        <div className="xl:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Nueva Solicitud de Turno</h2>
          <form onSubmit={handleRequestAppointment} className="space-y-4 text-xs font-medium text-slate-600">
            <div>
              <label className="block text-[11px] font-bold uppercase mb-1">Bicicleta / Componente:</label>
              <input type="text" required value={bikeModel} onChange={(e) => setBiciModelo(e.target.value)} placeholder="Ej: Venzo Raptor Rodado 29" className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800" />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase mb-1">Diagnóstico / Detalle del Service:</label>
              <textarea rows="2" required value={description} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Ajuste de cambios y centrado de llanta..." className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 resize-none" />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase mb-1 flex-items-center gap-1"><Calendar className="w-3.5 h-3.5 text-blue-600" /> 1. Día de recepción:</label>
              <input type="date" required min={getTodayDateString()} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 font-semibold" />
            </div>

            {selectedDate && (
              <div className="space-y-2 animate-in fade-in duration-150">
                <label className="block text-[11px] font-bold uppercase flex-items-center gap-1 text-slate-500"><Clock className="w-3.5 h-3.5 text-blue-600" /> 2. Horarios disponibles de mañana:</label>
                {loadingTimes ? (
                  <p className="text-blue-500 font-semibold italic animate-pulse">Consultando disponibilidad...</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {timeSlots.map((slot) => {
                      const isTaken = takenTimes.includes(slot);
                      return (
                        <button
                          key={slot} type="button" disabled={isTaken}
                          onClick={() => setSelectedTime(slot)}
                          className={`px-2.5 py-2 rounded-xl font-bold border transition-all text-[11px] ${
                            isTaken ? 'bg-slate-100 border-slate-200 text-slate-300 line-through cursor-not-allowed' : selectedTime === slot ? 'bg-slate-900 border-slate-900 text-white shadow-xs' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          {slot} hs
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <button type="submit" disabled={loadingSubmit || !selectedTime} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer text-xs uppercase tracking-wider">
              {loadingSubmit ? 'Procesando...' : 'Solicitar Turno en Taller'}
            </button>
          </form>
        </div>

        {/* LISTADO DE SEGUIMIENTO */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <ListFilter className="w-4 h-4 text-slate-400" /> Historial y Estado de Mis Turnos Solicitados
          </h2>

          {myAppointments.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-12 text-center">Aún no has solicitado ningún turno para el servicio técnico en Metola Bikes.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {myAppointments.map((app) => (
                <div key={app.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between gap-3 text-xs">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-extrabold text-slate-800 text-sm">{app.bici_modelo}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${
                        app.estado === 'Pendiente' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        app.estado === 'Aceptado' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        app.estado === 'En proceso' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 animate-pulse' :
                        app.estado === 'Finalizado' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        app.estado === 'Cancelado' ? 'bg-slate-100 border-slate-300 text-slate-500 line-through' :
                        'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        {app.estado || 'Pendiente'}
                      </span>
                    </div>

                    <p className="text-blue-600 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> 
                      Recepción: {app.equipo_dato && app.equipo_dato.includes(' ') ? `${app.equipo_dato.split(' ')[0].split('-').reverse().join('/')} a las ${app.equipo_dato.split(' ')[1]}` : app.equipo_dato} hs
                    </p>
                    <p className="text-slate-500 font-medium">{app.descripcion}</p>
                    
                    {app.estado === 'Rechazado' && app.motivo_rechazo && (
                      <div className="mt-2 p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 font-semibold text-[11px] animate-in fade-in duration-100">
                        <span className="uppercase font-black text-[9px] block text-rose-600 mb-0.5">Nota del Taller:</span>
                        {app.motivo_rechazo}
                      </div>
                    )}

                    {/* BOTÓN DE CANCELACIÓN UBICADO EN UN LUGAR SEGURO */}
                    {(app.estado === 'Pendiente' || app.estado === 'Aceptado' || !app.estado) && (
                      <div className="pt-2">
                        <button 
                          onClick={() => handleCancelAppointment(app.id)}
                          className="text-rose-600 hover:text-rose-800 font-bold bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 cursor-pointer transition-all"
                        >
                          ❌ Cancelar Turno
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Workshop;