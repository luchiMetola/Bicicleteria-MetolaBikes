import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, CreditCard, Plus, Trash2, CheckCircle, Search, Minus, AlertCircle } from 'lucide-react';

function POSEmployee() {
  const [productos, setProductos] = useState([]);
  const [listaFactura, setListaFactura] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para el Cobro
  const [medioPago, setMedioPago] = useState('Efectivo');
  const [pagaCon, setPagaCompleto] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Cargar el catálogo general de productos desde el backend
  useEffect(() => {
    const obtenerProductosBD = async () => {
      try {
        const response = await axios.get('http://localhost:5000/productos');
        setProductos(response.data);
      } catch (err) {
        console.error('Error cargando catálogo:', err);
        setErrorMessage('No se pudo conectar con el catálogo de productos.');
      }
    };
    obtenerProductosBD();
  }, []);

  // 2. Agregar ítem o sumar cantidad en el mostrador
  const agregarAFactura = (producto) => {
    const existe = listaFactura.find((item) => item.id === producto.id);
    if (existe) {
      setListaFactura(
        listaFactura.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      );
    } else {
      setListaFactura([...listaFactura, { ...producto, cantidad: 1 }]);
    }
  };

  // 3. Cambiar cantidad manualmente desde el ticket (+ o -)
  const modificarCantidadTicket = (id, delta) => {
    setListaFactura((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nuevaCant = item.cantidad + delta;
            return nuevaCant >= 1 ? { ...item, cantidad: nuevaCant } : item;
          }
          return item;
        })
    );
  };

  // 4. Quitar un producto del ticket
  const quitarDeFactura = (id) => {
    setListaFactura(listaFactura.filter((item) => item.id !== id));
  };

  const calcularTotal = () => listaFactura.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  // Calcular el vuelto si el pago es en efectivo
  const totalFactura = calcularTotal();
  const vuelto = pagaCon && Number(pagaCon) >= totalFactura ? Number(pagaCon) - totalFactura : 0;

  // 5. Filtrar el catálogo usando la barra de búsqueda
  const productosFiltrados = productos.filter((prod) =>
    prod.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 6. Confirmar la facturación e impactar en MySQL (Con descuento automatizado de variantes)
  const procesarFacturacionMostrador = async (e) => {
    e.preventDefault();
    if (listaFactura.length === 0) return;
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Preparamos el desglose descriptivo de la boleta
    const detalleProductosString = listaFactura.map((i) => `${i.nombre} (x${i.cantidad})`).join(', ');

    // Estructuramos los productos comprados para que la API reste el stock de la variante
    const productosEstructurados = listaFactura.map(item => ({
      id_producto: item.id,
      color: 'Único', // Por defecto 'Único' si es mostrador rápido, o podés expandirlo luego
      rodado_talla: 'Único',
      cantidad: item.cantidad,
      precio: item.precio
    }));

    try {
      const token = localStorage.getItem('token');
      
      // Enviamos el payload estructurado igual al que armamos para la web para reutilizar la lógica atómica
      const payload = {
        total: totalFactura,
        tipo_venta: `Mostrador: ${detalleProductosString}`,
        metodo_entrega: 'Retiro en sucursal',
        direccion_envio: 'Salón de Ventas',
        medio_pago: medioPago,
        productosComprados: productosEstructurados
      };

      // CORRECCIÓN: Quitamos la declaración "const response =" ya que no se usaba
      await axios.post(
        'http://localhost:5000/api/ventas/pagar', // Apunta a tu ruta optimizada que descuenta stock variantes
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMessage('¡Venta presencial facturada con éxito y stock descontado!');
      
      // Reseteamos la caja para el siguiente cliente
      setListaFactura([]);
      setPagaCompleto('');
      setSearchTerm('');
      
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMessage('Error crítico del servidor al registrar la venta presencial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 w-full transition-all">
      {/* Encabezado Principal */}
      <header className="border-b border-slate-200 pb-4 mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-[#3A53A4]" /> Terminal Punto de Venta
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">Módulo de Facturación Rápida en Mostrador - Salón Caucete</p>
      </header>

      {/* Alertas Globales */}
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-950 border border-emerald-500 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-950 border border-rose-500 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {errorMessage}
        </div>
      )}

      {/* BARRA DE BÚSQUEDA DEL EMPLEADO */}
      <div className="mb-6 relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Buscar producto vendido por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-md"
        />
      </div>

      {/* Contenedor en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        
        {/* LADO IZQUIERDO: Catálogo / Productos en Stock */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Productos en Stock</h2>
          {productosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {productosFiltrados.map((prod) => {
                // CORRECCIÓN MULTI-IMAGEN: Extrae solo la primera miniatura antes del pipe '|'
                const displayImg = prod.imagen && prod.imagen.includes('|') ? prod.imagen.split('|')[0] : prod.imagen;

                return (
                  <div 
                    key={prod.id} 
                    onClick={() => agregarAFactura(prod)}
                    className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-all group active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-700 group-hover:bg-slate-600 transition-colors overflow-hidden">
                        {displayImg && displayImg.startsWith('data:image') ? (
                          <img src={displayImg} alt={prod.nombre} className="w-full h-full object-cover" />
                        ) : (
                          displayImg || '🚲'
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">{prod.nombre}</h4>
                        <p className="text-slate-400 text-xs mt-0.5">Precio de salón</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="text-emerald-400 text-sm font-black">${Number(prod.precio).toLocaleString('es-AR')}</span>
                      <button className="p-1.5 bg-slate-700 rounded-lg group-hover:bg-emerald-600 group-hover:text-white text-slate-400 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm italic py-4">No se encontraron productos que coincidan con la búsqueda.</p>
          )}
        </div>

        {/* LADO DERECHO: Ticket de Venta Actual + Panel de Cobro */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 h-fit flex flex-col justify-between space-y-4 shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-white border-b border-slate-700 pb-2 mb-3">Ticket de Venta Actual</h3>
            
            {listaFactura.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-12 text-center">Seleccioná o buscá productos para armar la boleta de mostrador.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1 divide-y divide-slate-700/50">
                {listaFactura.map((item) => (
                  <div key={item.id} className="flex items-center justify-between pt-2 text-xs">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-slate-200">{item.nombre}</p>
                      <p className="text-slate-400 text-[11px]">${Number(item.precio).toLocaleString('es-AR')} c/u</p>
                    </div>
                    
                    {/* Controles de cantidad en ticket */}
                    <div className="flex items-center gap-2 mr-3 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                      <button type="button" onClick={() => modificarCantidadTicket(item.id, -1)} className="text-slate-400 hover:text-white p-0.5">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-white min-w-12px text-center">{item.cantidad}</span>
                      <button type="button" onClick={() => modificarCantidadTicket(item.id, 1)} className="text-slate-400 hover:text-white p-0.5">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-black text-white">${(item.precio * item.cantidad).toLocaleString('es-AR')}</span>
                      <button onClick={() => quitarDeFactura(item.id)} className="text-slate-500 hover:text-rose-400 cursor-pointer p-0.5">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PANEL DE COBRO (Totalizaciones y Medios de Pago) */}
          <div className="pt-3 border-t border-slate-700 space-y-4">
            
            {/* Selección del medio de pago en mostrador */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Medio de Pago:</label>
              <select
                value={medioPago}
                onChange={(e) => {
                  setMedioPago(e.target.value);
                  if (e.target.value !== 'Efectivo') setPagaCompleto(''); 
                }}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Efectivo">Efectivo (Cobro Físico)</option>
                <option value="Tarjeta">Tarjeta Débito / Crédito</option>
                <option value="Transferencia">Transferencia / Mercado Pago QR</option>
              </select>
            </div>

            {/* Campos interactivos de vuelto si es Efectivo */}
            {medioPago === 'Efectivo' && listaFactura.length > 0 && (
              <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-700/60 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Paga con ($):</label>
                  <input
                    type="text"
                    placeholder="Ej: 5000"
                    value={pagaCon}
                    onChange={(e) => setPagaCompleto(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="text-right flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Vuelto exacto:</span>
                  <span className={`text-sm font-black ${vuelto > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                    ${vuelto.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            )}

            {/* Sumarización Final */}
            <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700/50">
              <span className="text-xs font-bold text-slate-400">Total a Cobrar:</span>
              <span className="text-xl font-black text-emerald-400">${totalFactura.toLocaleString('es-AR')}</span>
            </div>

            <button
              type="submit"
              onClick={procesarFacturacionMostrador}
              disabled={listaFactura.length === 0 || loading || (medioPago === 'Efectivo' && pagaCon !== '' && Number(pagaCon) < totalFactura)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors cursor-pointer uppercase tracking-wider"
            >
              <CreditCard className="w-4 h-4" /> {loading ? 'Efectuando transacción...' : 'Cobrar e Imprimir Comprobante'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default POSEmployee;