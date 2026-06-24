import { useState } from 'react';
import { Wrench, Calendar, CheckCircle } from 'lucide-react';

function Taller() {
  const [bicicleta, setBicicleta] = useState('');
  const [fecha, setFecha] = useState('');
  const [falla, setFalle] = useState('');
  const [exito, setExito] = useState(false);

  const [turnos, setTurnos] = useState([
    { id: 1, bicicleta: 'Vairo XR 4.0', fecha: '28/06/2026', falla: 'Service completo y ajuste de frenos', estado: 'Confirmado' }
  ]);

  const agendarTurno = (e) => {
    e.preventDefault();
    const nuevoTurno = {
      id: turnos.length + 1,
      bicicleta,
      fecha,
      falla,
      estado: 'Pendiente de Revisión'
    };
    setTurnos([...turnos, nuevoTurno]);
    setExito(true);
    setBicicleta('');
    setFecha('');
    setFalle('');
    setTimeout(() => setExito(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-8 pl-24 md:pl-72 max-w-7xl mx-auto transition-all">
      <header className="border-b border-slate-200 pb-5 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <Wrench className="w-8 h-8 text-blue-600" /> Taller Mecánico
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Solicitá turnos de mantenimiento y seguí el estado de reparación.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Reserva */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-500" /> Reservar Turno
          </h2>
          {exito && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> ¡Turno solicitado con éxito!
            </div>
          )}
          <form onSubmit={agendarTurno} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Modelo de Bicicleta:</label>
              <input 
                type="text" value={bicicleta} onChange={(e) => setBicicleta(e.target.value)} required placeholder="Ej: Venzo Talon R29"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Fecha Sugerida:</label>
              <input 
                type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Motivo / Falla detectada:</label>
              <textarea 
                rows="3" value={falla} onChange={(e) => setFalle(e.target.value)} required placeholder="Ej: Centrado de llanta trasera y ruidos en la cadena."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow-xs cursor-pointer tracking-wide">
              Agendar Servicio
            </button>
          </form>
        </div>

        {/* Mis Turnos Registrados */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Mis Turnos de Reparación</h2>
          <div className="space-y-4">
            {turnos.map((t) => (
              <div key={t.id} className="border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-base">{t.bicicleta}</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-semibold">{t.fecha}</span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">{t.falla}</p>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    t.estado === 'Confirmado' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {t.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Taller;