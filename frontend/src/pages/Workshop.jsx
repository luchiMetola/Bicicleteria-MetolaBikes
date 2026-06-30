import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { Wrench, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

function Workshop({ userName }) {
  const [bikeModel, setBiciModelo] = useState('');
  const [description, setDescripcion] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  // States in English for scheduling logic
  const [takenTimes, setTakenTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [notification, setNotification] = useState({ text: '', type: '' });

  // Slots fijos definidos por la política de la bicicletería (Mañanas de 10 a 12:00hs cada 30 min)
  const timeSlots = ['10:00', '10:30', '11:00', '11:30', '12:00'];

  // Efecto que consulta los horarios ocupados en vivo cada vez que el cliente cambia de día
  useEffect(() => {
    if (!selectedDate) return;

    const checkAvailableSlots = async () => {
      setLoadingTimes(true);
      setSelectedTime(''); // Reseteamos la hora elegida al cambiar de día
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/equipo/ocupados?date=${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTakenTimes(response.data); // Guarda el array de horas tomadas
      } catch (error) {
        console.error('Error loading taken slots:', error);
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

    // Concatenamos el día y la hora de manera uniforme para MySQL: 'YYYY-MM-DD HH:MM'
    const fullScheduleString = `${selectedDate} ${selectedTime}`;

    const payload = {
      bici_modelo: bikeModel,
      equipo_dato: fullScheduleString,
      descripcion: description,
      estado: 'Pendiente' // Se registra con estado inicial para la moderación del empleado
    };

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/equipo', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotification({ text: response.data.message, type: 'success' });
      
      // Limpiamos los casilleros
      setBiciModelo('');
      setDescripcion('');
      setSelectedDate('');
      setSelectedTime('');
      setTakenTimes([]);
    } catch (error) {
      console.error('Error creating workshop order:', error);
      setNotification({ text: 'No se pudo reservar el turno. Verificá tu conexión.', type: 'error' });
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Restricción para que el cliente no elija fechas pasadas en el calendario HTML
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

      <div className="max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <form onSubmit={handleRequestAppointment} className="space-y-5 text-xs font-medium text-slate-600">
          
          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">Modelo de la Bicicleta / Componente:</label>
            <input 
              type="text" required value={bikeModel} onChange={(e) => setBiciModelo(e.target.value)}
              placeholder="Ej: Slpro Venzo Rodado 29" className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">¿Qué reparación o service necesita?:</label>
            <textarea 
              rows="3" required value={description} onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Centrado de llanta trasera y regulación de frenos hidráulicos Shimano..." 
              className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 resize-none" 
            />
          </div>

          {/* CALENDARIO SELECTOR DE DÍA */}
          <div>
            <label className="block text-[11px] font-bold uppercase mb-1 flex-items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> 1. Elegí el día de recepción:
            </label>
            <input 
              type="date" required min={getTodayDateString()} value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 font-semibold" 
            />
          </div>

          {/* CASILLEROS INTERACTIVOS DE HORAS */}
          {selectedDate && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <label className="block text-[11px] font-bold uppercase mb-1 flex-items-center gap-1 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> 2. Horarios disponibles de mañana para ese día:
              </label>
              
              {loadingTimes ? (
                <p className="text-blue-500 font-semibold italic animate-pulse py-1">Consultando disponibilidad con el taller...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map((slot) => {
                    const isTaken = takenTimes.includes(slot);
                    return (
                      <button
                        key={slot} type="button" disabled={isTaken}
                        onClick={() => setSelectedTime(slot)}
                        className={`px-4 py-2.5 rounded-xl font-bold border transition-all ${
                          isTaken 
                            ? 'bg-slate-100 border-slate-200 text-slate-300 line-through cursor-not-allowed' 
                            : selectedTime === slot
                              ? 'bg-slate-900 border-slate-900 text-white shadow-xs scale-98'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        {slot} hs {isTaken && '(Ocupado)'}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit" disabled={loadingSubmit || !selectedTime}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer text-xs uppercase tracking-wider"
            >
              {loadingSubmit ? 'Enviando solicitud...' : 'Solicitar Turno en Taller'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default Workshop;