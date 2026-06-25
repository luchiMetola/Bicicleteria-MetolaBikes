import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, ShoppingBag } from 'lucide-react';

function Profile() {
  const [usuario, setUsuario] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');

  // Historial simulado por ahora (lo conectamos de verdad en el Día 8)
  const [historial] = useState([
    { id_venta: 101, fecha: '24/06/2026', total: 450000.00, estado: 'Entregado', producto: 'Mountain Bike R29' }
  ]);

  useEffect(() => {
    const obtenerPerfilReal = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Enviamos el Token de forma segura en las cabeceras (headers) de Axios
        const response = await axios.get('http://localhost:5000/api/perfil', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setUsuario(response.data);
      } catch (err) {
        console.error('Error cargando el perfil real:', err);
        setErrorCarga('No se pudo cargar la información de perfil desde el servidor.');
      }
    };

    obtenerPerfilReal();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-8 pl-24 md:pl-72 max-w-7xl mx-auto transition-all">
      <header className="border-b border-slate-200 pb-5 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <User className="w-8 h-8 text-blue-600" /> My Perfil
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Manejá tu información personal y verifica tus compras.</p>
      </header>

      {errorCarga && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm">
          {errorCarga}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Información personal</h2>
          
          {usuario ? (
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Nombre completo</p>
                <p className="text-slate-800 font-medium">{usuario.nombre}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Dirección de Email</p>
                <p className="text-slate-800 font-medium">{usuario.email}</p>
              </div>
  
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Número de Teléfono</p>
                <p className="text-slate-800 font-medium">{usuario.telefono || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Dirección de Envío</p>
                <p className="text-slate-800 font-medium">{usuario.direccion || 'Not provided'}</p>
              </div>
                <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase">
                  {usuario.rol}
                </span>
          </div>
          ) : (
            <p className="text-slate-400 text-sm italic py-2">Cargando información del perfil...</p>
          )}
        </div>

        {/* Historial de Compras */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-slate-500" /> Historial de Compras
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 font-semibold">ID de Pedido</th>
                  <th className="py-3 font-semibold">Producto</th>
                  <th className="py-3 font-semibold">Fecha</th>
                  <th className="py-3 font-semibold">Total</th>
                  <th className="py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {historial.map((compra) => (
                  <tr key={compra.id_venta}>
                    <td className="py-4 text-slate-500">#{compra.id_venta}</td>
                    <td className="py-4 text-slate-800">{compra.producto}</td>
                    <td className="py-4">{compra.fecha}</td>
                    <td className="py-4 text-emerald-600">${compra.total.toLocaleString('es-AR')}</td>
                    <td className="py-4">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
                        {compra.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;