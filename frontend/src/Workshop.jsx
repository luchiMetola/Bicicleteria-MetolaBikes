import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wrench, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

function Workshop() {
  // Estados unificados con los nombres reales de la Base de Datos
  const [biciModelo, setBiciModelo] = useState('');
  const [equipoDato, setEquipoDato] = useState('');
  const [descripcion, setDescripcion] = useState('');
  
  const [turnos, setTurnos] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 1. Cargar los turnos de manera segura y recomendada por React
  useEffect(() => {
    const cargarTurnosDesdeBD = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/equipo');
        setTurnos(response.data);
      } catch (err) {
        console.error('Error fetching turnos:', err);
      }
    };

    cargarTurnosDesdeBD();
  }, []); // Se ejecuta una sola vez al montar el componente

  // 2. Enviar el formulario reflejando las columnas en español de prepo
  const handleAppointment = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/equipo', {
        bici_modelo: biciModelo,
        equipo_dato: equipoDato,
        descripcion: descripcion
      });

      setMessage(response.data.message);
      setBiciModelo('');
      setEquipoDato('');
      setDescripcion('');
      
      // Para refrescar la lista de forma segura tras insertar, hacemos la llamada directa
      const actualizarLista = async () => {
        const res = await axios.get('http://localhost:5000/api/equipo');
        setTurnos(res.data);
      };
      actualizarLista();

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.error || 'Error al solicitar el turno.');
      } else {
        setError('Error de conexión con el servidor.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-8 pl-24 md:pl-72 max-w-7xl mx-auto transition-all">
      <header className="border-b border-slate-200 pb-5 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <Wrench className="w-8 h-8 text-blue-600" /> Servicio de Taller
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Solicitá turnos de mantenimiento y controlá el estado de tus reparaciones en tiempo real.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Reserva */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-500" /> Solicitar Turno
          </h2>

          {message && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" /> {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleAppointment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Modelo de bicicleta:</label>
              <input 
                type="text" value={biciModelo} onChange={(e) => setBiciModelo(e.target.value)} required placeholder="Venzo Talon R29"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Fecha sugerida:</label>
              <input 
                type="date" value={equipoDato} onChange={(e) => setEquipoDato(e.target.value)} required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Descripción del problema / servicio:</label>
              <textarea 
                rows="3" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required placeholder="Ajuste de frenos y mantenimiento general."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow-xs cursor-pointer tracking-wide transition-colors">
              Solicitar Servicio
            </button>
          </form>
        </div>

        {/* Listado de Turnos Registrados en MySQL */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Tickets de Servicio Activos</h2>
          
          {turnos.length === 0 ? (
            <p className="text-slate-400 text-sm italic py-4">No se encontraron citas de mantenimiento activas.</p>
          ) : (
            <div className="space-y-4">
              {turnos.map((t) => (
                <div key={t.id} className="border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/50 hover:shadow-xs transition-shadow">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-base">{t.bici_modelo}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md font-semibold">
                        {new Date(t.equipo_dato).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">{t.descripcion}</p>
                  </div>
                  <div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black uppercase tracking-wider">
                      {t.estado}
                    </span>
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