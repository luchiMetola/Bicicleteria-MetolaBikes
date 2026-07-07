import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, ShoppingBag, Package, TrendingUp, AlertCircle, Clock } from 'lucide-react';

function AdminDashboard() {
  const [ventas, setVentas] = useState([]);
  const [filtroVenta, setFiltroVenta] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para métricas clave
  const [metricas, setMetricas] = useState({
    ingresosTotales: 0,
    pedidosWeb: 0,
    ventasMostrador: 0,
    pendientesEnvio: 0
  });
  
  const ventasFiltradas = ventas.filter(v => {
    if (filtroVenta === 'Todas') return true;
    return v.tipo_venta.includes(filtroVenta);
  });

  useEffect(() => {
    const obtenerDatosAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        // Petición al backend a la ruta (que crearemos en el paso 2)
        const res = await axios.get('http://localhost:5000/api/admin/ventas', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const dataVentas = res.data;
        setVentas(dataVentas);

        // Procesamiento matemático de las métricas para los "Kudos" (Tarjetas superiores)
        let total = 0;
        let web = 0;
        let mostrador = 0;
        let pendientes = 0;

        dataVentas.forEach(v => {
          total += Number(v.total);
          if (v.tipo_venta.includes('Web')) web++;
          if (v.tipo_venta.includes('Mostrador')) mostrador++;
          if (v.estado_envio === 'Pendiente de pago' || v.estado_envio === 'Preparando envío') pendientes++;
        });

        setMetricas({
          ingresosTotales: total,
          pedidosWeb: web,
          ventasMostrador: mostrador,
          pendientesEnvio: pendientes
        });

      } catch (err) {
        console.error('Error cargando panel admin:', err);
        setError('Acceso denegado o error de conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    
    obtenerDatosAdmin();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 w-full transition-all">
      <header className="border-b border-slate-200 pb-4 mb-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
          <TrendingUp className="w-6 h-6 text-indigo-600" /> Panel de Administración
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">Visión general del negocio, auditoría de ventas y despachos.</p>
      </header>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      ) : loading ? (
        <p className="text-slate-400 font-bold text-center py-10 animate-pulse">Cargando métricas corporativas...</p>
      ) : (
        <div className="space-y-6">
          
          {/* TARJETAS DE MÉTRICAS (KPIs) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><DollarSign className="w-6 h-6" /></div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ingresos Brutos</p>
                <p className="text-xl font-black text-slate-800">${metricas.ingresosTotales.toLocaleString('es-AR')}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><ShoppingBag className="w-6 h-6" /></div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ventas Web</p>
                <p className="text-xl font-black text-slate-800">{metricas.pedidosWeb} Órdenes</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600"><Package className="w-6 h-6" /></div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mostrador</p>
                <p className="text-xl font-black text-slate-800">{metricas.ventasMostrador} Facturas</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-xl text-amber-600"><Clock className="w-6 h-6" /></div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Por Despachar</p>
                <p className="text-xl font-black text-slate-800">{metricas.pendientesEnvio} Paquetes</p>
              </div>
            </div>
          </div>

          {/* TABLA DE AUDITORÍA GENERAL CON FILTROS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 border-b border-slate-100 pb-4 gap-4">
              <h3 className="text-sm font-bold text-slate-800">Auditoría Histórica de Ventas</h3>
              
              {/* BOTONES DE FILTRO */}
              <div className="flex gap-2">
                <button onClick={() => setFiltroVenta('Todas')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${filtroVenta === 'Todas' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Todas</button>
                <button onClick={() => setFiltroVenta('Web')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${filtroVenta === 'Web' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Online (Web)</button>
                <button onClick={() => setFiltroVenta('Mostrador')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${filtroVenta === 'Mostrador' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Sucursal</button>
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="py-3 pl-2">ID/Comprobante</th>
                  <th className="py-3">Fecha</th>
                  <th className="py-3">Cliente / Empleado</th>
                  <th className="py-3">Canal y Modalidad</th>
                  <th className="py-3">Monto Total</th>
                  <th className="py-3">Estado Operativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                {/* ACÁ USAMOS VENTAS FILTRADAS EN VEZ DE VENTAS */}
                {ventasFiltradas.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pl-2 text-slate-400">#{v.id}</td>
                    <td className="py-3">{v.fecha}</td>
                    <td className="py-3 text-slate-800 font-bold">{v.cliente_nombre || 'Cliente Genérico'}</td>
                    <td className="py-3 text-slate-500">{v.tipo_venta}</td>
                    <td className="py-3 text-slate-900 font-black">${Number(v.total).toLocaleString('es-AR')}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        v.estado_envio.includes('Entregado') || v.estado_envio.includes('Listo') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        v.estado_envio.includes('Pendiente') ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                        {v.estado_envio}
                      </span>
                    </td>
                  </tr>
                ))}
                {ventasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">No hay ventas registradas en esta categoría.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
}

export default AdminDashboard;