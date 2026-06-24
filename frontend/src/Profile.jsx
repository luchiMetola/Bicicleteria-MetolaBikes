import { useState } from 'react';
import { User, ShoppingBag } from 'lucide-react';

function Perfil() {
  const [usuario] = useState({
    nombre: 'Lucía Mendoza',
    email: 'lucia@example.com',
    fechaRegistro: '22 de Junio, 2026',
    rol: 'Cliente Premium'
  });

  const [historial] = useState([
    { id_venta: 101, fecha: '22/06/2026', total: 450000.00, estado: 'Entregado', producto: 'Mountain Bike R29' },
    { id_venta: 98, fecha: '15/05/2026', total: 35000.00, estado: 'Entregado', producto: 'Casco Pro Seguridad' }
  ]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-8 pl-24 md:pl-72 max-w-7xl mx-auto transition-all">
      <header className="border-b border-slate-200 pb-5 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <User className="w-8 h-8 text-blue-600" /> Mi Perfil
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Gestioná tus datos personales y revisá tu actividad.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tarjeta de Datos de Usuario */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Información Personal</h2>
          <div className="space-y-3">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Nombre Completo</p>
              <p className="text-slate-800 font-medium">{usuario.nombre}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Correo Electrónico</p>
              <p className="text-slate-800 font-medium">{usuario.email}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Miembro Desde</p>
              <p className="text-slate-800 font-medium">{usuario.fechaRegistro}</p>
            </div>
            <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
              {usuario.rol}
            </span>
          </div>
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
                  <th className="py-3 font-semibold">Pedido ID</th>
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

export default Perfil;