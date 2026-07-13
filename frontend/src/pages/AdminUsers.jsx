import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Shield, UserCheck, CheckCircle, Search } from 'lucide-react';

function AdminUsers() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ text: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // 1. CARGA INICIAL (Totalmente encapsulada para que React no se queje)
  useEffect(() => {
    const cargarUsuariosInicial = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/admin/usuarios', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsuarios(res.data);
      } catch (error) {
        console.error('Error cargando usuarios:', error);
        setNotification({ text: 'Error al conectar con la base de datos.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    cargarUsuariosInicial();
  }, []); 

  // 2. FUNCIÓN DE ACTUALIZAR ROL (Hace su propia recarga al terminar)
  const cambiarRol = async (id, nuevoRol) => {
    try {
      const token = localStorage.getItem('token');
      
      // A) Mandamos la orden de cambiar el rol
      const res = await axios.put(`http://localhost:5000/api/admin/usuarios/${id}/rol`, 
        { rol: nuevoRol },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotification({ text: res.data.message, type: 'success' });
      
      // B) Volvemos a pedir la lista actualizada acá mismo
      const resUsers = await axios.get('http://localhost:5000/api/admin/usuarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(resUsers.data);
      
      setTimeout(() => setNotification({ text: '', type: '' }), 4000);
    } catch (error) {
      const msg = error.response?.data?.error || 'Error al cambiar el rol.';
      setNotification({ text: msg, type: 'error' });
      setTimeout(() => setNotification({ text: '', type: '' }), 4000);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 w-full transition-all">
      <header className="border-b border-slate-200 pb-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Control de Personal y Usuarios
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Asigná permisos de Empleado o Administrador a las cuentas registradas.</p>
        </div>

        <div className="flex items-center w-full max-w-sm bg-white border border-slate-200 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/30 transition-all shadow-sm">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400"
          />
          <div className="bg-slate-50 text-slate-400 p-2.5 border-l border-slate-200">
            <Search className="w-4 h-4" />
          </div>
        </div>
      </header>

      {notification.text && (
        <div className={`mb-6 p-3 border rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          <CheckCircle className="w-5 h-5" /> {notification.text}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center text-slate-400 text-sm py-10 font-bold animate-pulse">Cargando base de datos de usuarios...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4">Rol Actual</th>
                  <th className="py-3 px-4 text-right">Modificar Nivel de Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-bold">#{u.id}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800 text-sm">{u.nombre}</p>
                      <p className="text-[10px] text-slate-500">{u.email}</p>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <p>{u.telefono || 'Sin tel.'}</p>
                      <p className="text-slate-400 truncate max-w[150px]">{u.direccion || 'Sin direcc.'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 w-max ${
                        u.rol === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        u.rol === 'empleado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {u.rol === 'admin' && <Shield className="w-3 h-3" />}
                        {u.rol === 'empleado' && <UserCheck className="w-3 h-3" />}
                        {u.rol}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={u.rol}
                        onChange={(e) => cambiarRol(u.id, e.target.value)}
                        className="p-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 bg-white cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      >
                        <option value="cliente">Cliente Regular</option>
                        <option value="empleado">Empleado (Mostrador/Taller)</option>
                        <option value="admin">Administrador (Total)</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {usuariosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">No se encontraron usuarios con ese criterio.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;