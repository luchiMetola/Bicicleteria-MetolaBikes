import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Truck, CheckCircle, Clock, MapPin, Phone, User } from 'lucide-react';

function POSOrders() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');
  

  // REEMPLAZÁ TU useEffect ACTUAL POR ESTE
  useEffect(() => {
    // Definimos la función ADENTRO del efecto para que sea privada y segura
    const cargarPedidos = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/pedidos', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPedidos(response.data);
      } catch (error) {
        console.error('Error al cargar pedidos:', error);
      }
    };

    cargarPedidos();
  }, []); // El array vacío [] asegura que solo corra al montar el componente


  const actualizarEstado = async (id, nuevoEstado) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/pedidos/${id}/estado`, 
        { estado_envio: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotification('Estado logístico actualizado. El cliente ya puede verlo en su perfil.');
      
      
      setTimeout(() => setNotification(''), 4000);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Error al actualizar el estado del pedido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f9f7] font-sans p-4 md:p-8 w-full transition-all">
      <header className="border-b border-slate-200 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <Truck className="w-6 h-6 text-emerald-600" /> Logística y Envíos Web
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Prepará los paquetes, gestioná los despachos y avisale al cliente.</p>
        </div>
      </header>

      {notification && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle className="w-5 h-5" /> {notification}
        </div>
      )}

      {pedidos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 flex flex-col items-center justify-center text-slate-400">
          <Package className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-semibold">No hay pedidos web registrados en el sistema.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
              
              {/* Cabecera de la Tarjeta */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Orden #{pedido.id}</span>
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" /> {pedido.fecha}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Total Pagado</span>
                  <span className="text-base font-black text-emerald-600">${Number(pedido.total).toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* Cuerpo: Datos del Cliente */}
              <div className="p-5 flex-1 space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Datos de Envío</p>
                  
                  {/* Lógica para extraer el método de entrega del string tipo_venta */}
                  {(() => {
                    const esRetiro = pedido.tipo_venta && pedido.tipo_venta.includes('Retiro en sucursal');
                    const esCorreo = pedido.tipo_venta && pedido.tipo_venta.includes('Correo Argentino');
                    const metodoExtraido = esRetiro ? 'Retiro en sucursal' : (esCorreo ? 'Correo Argentino' : 'Envío a domicilio');
                    
                    return (
                      <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md inline-block mb-1 ${
                        esRetiro ? 'bg-amber-100 text-amber-800' :
                        esCorreo ? 'bg-blue-100 text-blue-800' :
                        'bg-indigo-100 text-indigo-800' 
                      }`}>
                        {metodoExtraido}
                      </div>
                    );
                  })()}

                  <p className="text-xs font-semibold text-slate-700 flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /> {pedido.cliente_nombre || 'Usuario Desconocido'}</p>
                  <p className="text-xs font-semibold text-slate-700 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {pedido.cliente_direccion || 'Retira en Sucursal'}</p>
                  <p className="text-xs font-semibold text-slate-700 flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {pedido.cliente_telefono || 'Sin teléfono'}</p>
                </div>

                {/* Items a Empaquetar (AHORA CON DETALLE PERFECTO DE TALLE Y COLOR) */}
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Artículos a Empaquetar</p>
                  <div className="text-xs font-medium text-slate-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100 leading-relaxed space-y-1">
                    {pedido.detalle_productos ? (
                      pedido.detalle_productos.split(' | ').map((item, i) => (
                        <p key={i} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">•</span> {item}
                        </p>
                      ))
                    ) : 'Detalle no disponible'}
                  </div>
                </div>
              </div>

              {/* Pie: Control de Estado */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado Logístico:</label>
                <div className="flex gap-2">
                  <select 
                    value={pedido.estado_envio}
                    onChange={(e) => actualizarEstado(pedido.id, e.target.value)}
                    disabled={loading}
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
                  >
                    <option value="Pendiente de pago">Pendiente de Pago</option>
                    <option value="Preparando envío">Preparando envío (En depósito)</option>
                    <option value="Listo para retirar">Listo para retirar (En salón)</option>
                    <option value="Despachado">Despachado (En viaje por correo)</option>
                    <option value="Entregado">Entregado al cliente (Finalizado)</option>
                  </select>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default POSOrders;