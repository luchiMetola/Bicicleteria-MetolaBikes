import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, ShoppingBag, Edit2, Check, X } from 'lucide-react';

function Profile() {
  const [usuario, setUsuario] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Estados para el formulario de edición
  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editDireccion, setEditDireccion] = useState('');

  // Historial real: empieza como un array vacío
  const [historial, setHistorial] = useState([]);

  // CARGA SEGURA DE PERFIL E HISTORIAL DESDE LA BD
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // 1. Petición para los datos personales del perfil
        const perfilResponse = await axios.get('http://localhost:5000/api/perfil', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        setUsuario(perfilResponse.data);
        setEditNombre(perfilResponse.data.nombre || '');
        setEditTelefono(perfilResponse.data.telefono || '');
        setEditDireccion(perfilResponse.data.direccion || '');

        // 2. Petición para el historial de compras reales (Solo lo cargamos si no falla)
        const historialResponse = await axios.get('http://localhost:5000/api/historial', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setHistorial(historialResponse.data);

      } catch (err) {
        console.error('Error cargando los datos reales:', err);
        setErrorCarga('No se pudo cargar la información completa desde el servidor.');
      }
    };

    cargarDatosUsuario();
  }, []); 

  // FUNCIÓN PARA ENVIAR LA ACTUALIZACIÓN PUT A MYSQL
  const guardarCambios = async (e) => {
    e.preventDefault();
    setErrorCarga('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:5000/api/perfil', {
        nombre: editNombre,
        telefono: editTelefono,
        direccion: editDireccion
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setSuccessMessage(response.data.message);
      setIsEditing(false);
      
      setUsuario({
        ...usuario,
        nombre: editNombre,
        telefono: editTelefono,
        direccion: editDireccion
      });

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error al actualizar datos:', err);
      setErrorCarga('No se pudieron guardar los cambios.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 w-full transition-all">
      <header className="border-b border-slate-200 pb-5 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <User className="w-8 h-8 text-[#3A53A4]" /> Mi Perfil
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Gestioná tus datos personales y revisá tu actividad.</p>
      </header>

      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> {successMessage}
        </div>
      )}
      {errorCarga && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium">
          {errorCarga}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
        
        {/* Bloque Información Personal */}
        {/* MAGIA DE UX: Si no es cliente, la tarjeta se expande para ocupar todo el centro */}
        <div className={`bg-white border border-slate-200 p-6 rounded-2xl shadow-xs h-fit ${usuario && usuario.rol !== 'cliente' ? 'lg:col-span-3 max-w-2xl mx-auto w-full' : ''}`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
            <h2 className="text-lg font-bold text-slate-800">Información Personal</h2>
            {!isEditing && usuario && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
              >
                <Edit2 className="w-3 h-3" /> Editar Datos
              </button>
            )}
          </div>
          
          {usuario ? (
            isEditing ? (
              <form onSubmit={guardarCambios} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nombre Completo:</label>
                  <input 
                    type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} required
                    className="w-full p-2 border border-slate-300 rounded-xl text-sm bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Teléfono:</label>
                  <input 
                    type="text" value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} required
                    className="w-full p-2 border border-slate-300 rounded-xl text-sm bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Dirección de Envío:</label>
                  <input 
                    type="text" value={editDireccion} onChange={(e) => setEditDireccion(e.target.value)} required
                    className="w-full p-2 border border-slate-300 rounded-xl text-sm bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs">
                    <Check className="w-3.5 h-3.5" /> Guardar
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors">
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Nombre Completo</p>
                  <p className="text-slate-800 font-semibold">{usuario.nombre}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Correo Electrónico</p>
                  <p className="text-slate-600 font-medium">{usuario.email}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Teléfono de Contacto</p>
                  <p className="text-slate-800 font-medium">{usuario.telefono || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Dirección de Entrega</p>
                  <p className="text-slate-800 font-medium">{usuario.direccion || 'No registrada'}</p>
                </div>
                
              </div>
            )
          ) : (
            <p className="text-slate-400 text-sm italic py-2">Cargando información...</p>
          )}
        </div>

        {/* Tabla Dinámica de Historial de Compras (SOLO PARA CLIENTES) */}
        {usuario && usuario.rol === 'cliente' && (
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-slate-500" /> Historial de Compras
            </h2>
            <div className="overflow-x-auto">
              {historial.length > 0 ? (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="py-3 font-semibold">Pedido ID</th>
                      <th className="py-3 font-semibold">Producto(s)</th>
                      <th className="py-3 font-semibold">Pago y Modalidad</th>
                      <th className="py-3 font-semibold">Fecha</th>
                      <th className="py-3 font-semibold">Total</th>
                      <th className="py-3 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {historial.map((compra) => (
                      <tr key={compra.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 text-slate-500">#{compra.id}</td>
                        <td className="py-4 text-slate-800 font-bold text-xs leading-tight max-w-180px truncate" title={compra.detalle_productos}>
                          {compra.detalle_productos || 'Sin detalle'}
                        </td>
                        <td className="py-4 text-slate-500 text-[11px] font-semibold">{compra.tipo_venta}</td>
                        <td className="py-4 text-xs">{compra.fecha}</td>
                        <td className="py-4 text-emerald-600 font-black">${Number(compra.total).toLocaleString('es-AR')}</td>
                        <td className="py-4">
                          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                            {compra.estado_envio || 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-slate-400 text-sm italic py-4 text-center">Aún no has realizado ninguna compra en Metola Bikes.</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Profile;