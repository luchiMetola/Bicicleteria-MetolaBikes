import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle, Search, Minus, AlertCircle } from 'lucide-react';

// Constante para mapear las categorías
const CATEGORIAS = [
  { id: 'Todas', nombre: 'Todos' },
  { id: 1, nombre: 'Bicicletas' },
  { id: 2, nombre: 'Accesorios' },
  { id: 3, nombre: 'Indumentaria' },
  { id: 4, nombre: 'Suplementos' }
];

function POSEmployee() {
  const [productos, setProductos] = useState([]);
  const [listaFactura, setListaFactura] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas'); // Nuevo estado para categorías
  
  // Estados para el Cobro
  const [medioPago, setMedioPago] = useState('Efectivo');
  const [pagaCon, setPagaCompleto] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Cargar el catálogo
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
  const agregarAFactura = (producto, variante) => {
    if (Number(variante.stock) <= 0) {
      setErrorMessage('Esta variante no tiene stock físico disponible.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const existe = listaFactura.find((item) => 
      item.id === producto.id && 
      item.colorElegido === variante.color && 
      item.rodado_talla === variante.rodado_talla
    );

    if (existe) {
      if (existe.cantidad >= Number(variante.stock)) return; 
      setListaFactura(
        listaFactura.map((item) =>
          item === existe ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      );
    } else {
      setListaFactura([...listaFactura, { 
        ...producto, 
        cantidad: 1,
        colorElegido: variante.color,
        rodado_talla: variante.rodado_talla,
        stock_max: Number(variante.stock) // Forzado a Número para arreglar el botón +
      }]);
    }
  };

  // 3. Cambiar cantidad manualmente
  const modificarCantidadTicket = (index, delta) => {
    setListaFactura((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const nuevaCant = item.cantidad + delta;
          // Validación estricta con Numbers
          if (nuevaCant >= 1 && nuevaCant <= Number(item.stock_max)) {
            return { ...item, cantidad: nuevaCant };
          }
        }
        return item;
      })
    );
  };

  // 4. Quitar un producto
  const quitarDeFactura = (index) => {
    setListaFactura(listaFactura.filter((_, i) => i !== index));
  };

  const calcularTotal = () => listaFactura.reduce((acc, i) => acc + Number(i.precio) * i.cantidad, 0);

  const totalFactura = calcularTotal();
  const vuelto = pagaCon && Number(pagaCon) >= totalFactura ? Number(pagaCon) - totalFactura : 0;

  // 5. Filtrar el catálogo usando la búsqueda y las Categorías
  const productosFiltrados = productos.filter((prod) => {
    const coincideBusqueda = prod.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideCategoria = categoriaActiva === 'Todas' || Number(prod.id_categoria) === categoriaActiva;
    return coincideBusqueda && coincideCategoria;
  });

  // 6. Confirmar la facturación
  const procesarFacturacionMostrador = async (e) => {
    e.preventDefault();
    if (listaFactura.length === 0) return;
    if (medioPago === 'Efectivo' && vuelto < 0) {
      setErrorMessage('El monto recibido es menor al total a cobrar.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const detalleProductosString = listaFactura.map((i) => `${i.nombre} (x${i.cantidad})`).join(', ');

    const productosEstructurados = listaFactura.map(item => ({
      id_producto: item.id,
      color: item.colorElegido,
      rodado_talla: item.rodado_talla,
      cantidad: item.cantidad,
      precio: item.precio
    }));

    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        total: totalFactura,
        tipo_venta: `Mostrador: ${detalleProductosString}`, 
        metodo_entrega: 'Retiro en sucursal',
        direccion_envio: 'Salón de Ventas',
        medio_pago: medioPago,
        productosComprados: productosEstructurados
      };

      await axios.post(
        'http://localhost:5000/api/ventas/presencial', 
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMessage('¡Venta facturada con éxito! Imprimiendo comprobante...');
      
      setTimeout(() => {
        window.print();
        setListaFactura([]);
        setPagaCompleto('');
        setSearchTerm('');
        setSuccessMessage('');
        axios.get('http://localhost:5000/productos').then(r => setProductos(r.data)); 
      }, 1000);

    } catch (err) {
      console.error(err);
      setErrorMessage('Error crítico del servidor al registrar la venta presencial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f9f7] font-sans p-4 md:p-6 w-full print:bg-white print:p-0">
      
      {/* Alertas */}
      <div className="print:hidden w-full mb-4">
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-[#3A53A4] text-[#3A53A4] rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
            <CheckCircle className="w-5 h-5" /> {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
            <AlertCircle className="w-5 h-5" /> {errorMessage}
          </div>
        )}
      </div>

      {/* CONTENEDOR EN COLUMNAS USANDO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full items-start">
        
        {/* ========================================================= */}
        {/* SECCIÓN IZQUIERDA: CATÁLOGO DE PRODUCTOS (Oculto al imprimir) */}
        {/* ========================================================= */}
        <div className="lg:col-span-2 xl:col-span-3 flex flex-col w-full print:hidden">
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col w-full">
            
            {/* HEADER DEL PANEL: Agregar Ítem & Buscador */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <div className="flex items-center w-full max-w-sm bg-slate-50 border border-slate-200 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400"
                />
                <button className="bg-blue-800 text-white p-2.5 hover:bg-blue-500 transition-colors cursor-pointer">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PESTAÑAS DE CATEGORÍAS */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 custom-scrollbar">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaActiva(cat.id)}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                    categoriaActiva === cat.id 
                      ? 'bg-blue-800 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>

            {/* GRILLA DE PRODUCTOS BLANCA */}
            {productosFiltrados.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                {productosFiltrados.map((prod) => {
                  const displayImg = prod.imagen && prod.imagen.includes('|') ? prod.imagen.split('|')[0] : prod.imagen;

                  return (
                    <div key={prod.id} className="flex flex-col items-center p-4 border border-slate-100 rounded-lg hover:shadow-md hover:border-emerald-100 transition-all bg-white h-fit">
                      
                      <div className="w-full h-28 flex items-center justify-center mb-3 overflow-hidden">
                        {displayImg && (displayImg.startsWith('data:image') || displayImg.startsWith('http')) ? (
                          <img src={displayImg} alt={prod.nombre} className="max-w-full max-h-full object-contain drop-shadow-sm" />
                        ) : (
                          <span className="text-4xl text-slate-300">{displayImg || '🚲'}</span>
                        )}
                      </div>
                      
                      <h4 className="font-semibold text-sm text-slate-700 text-center line-clamp-2 min-h-40px w-full">{prod.nombre}</h4>
                      <span className="text-emerald-600 text-base font-bold mt-1">${Number(prod.precio).toLocaleString('es-AR')}</span>

                      {/* Botones de Variantes */}
                      <div className="w-full mt-3 space-y-1.5">
                        {prod.variantes?.map((v, idx) => (
                          <button 
                            key={idx} disabled={Number(v.stock) <= 0} onClick={() => agregarAFactura(prod, v)}
                            className="w-full flex items-center justify-between bg-white border border-blue-200 hover:bg-blue-50 disabled:opacity-50 disabled:bg-slate-50 disabled:border-slate-200 px-2 py-1.5 rounded text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
                          >
                            <span className="truncate max-w-80px">{v.color} - {v.rodado_talla}</span>
                            <span className={`shrink-0 ${Number(v.stock) > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {Number(v.stock) > 0 ? '+' : 'Agotado'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Search className="w-12 h-12 mb-2 opacity-20" />
                <p>No se encontraron productos en esta categoría.</p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECCIÓN DERECHA: CHECKOUT (Fija/Sticky) */}
        {/* ========================================================= */}
        <div className="lg:col-span-1 w-full bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sticky top-6 print:shadow-none print:border-none print:w-full print:static">
          
          <div className="py-4 border-b border-slate-100 print:border-b-2 print:border-slate-800 shrink-0">
            <h2 className="text-lg font-bold text-center text-slate-800 uppercase tracking-wide print:text-2xl print:mb-2">Checkout</h2>
            <p className="hidden print:block text-center text-sm text-slate-500">Metola Bikes - Ticket de Venta</p>
          </div>

          <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 px-5 py-3 border-b border-slate-100 print:hidden shrink-0">
            <span className="flex-1 pl-6">Nombre</span>
            <span className="w-16 text-center">Cantidad</span>
            <span className="w-20 text-right">Precio</span>
          </div>

          <div className="flex-1 max-h-[45vh] overflow-y-auto px-5 py-2 custom-scrollbar print:overflow-visible print:max-h-full">
            {listaFactura.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-10 print:hidden">El ticket está vacío.</p>
            ) : (
              <div className="space-y-4 print:space-y-2 mt-2">
                {listaFactura.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-slate-50 pb-4 print:pb-2 print:border-slate-200">
                    
                    <div className="flex items-center flex-1 pr-2 overflow-hidden">
                      <button onClick={() => quitarDeFactura(index)} className="text-slate-300 hover:text-rose-500 transition-colors p-1 mr-2 shrink-0 print:hidden cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="truncate">
                        <p className="font-semibold text-xs text-slate-700 leading-tight truncate">{item.nombre}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5 truncate">{item.colorElegido} / {item.rodado_talla}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center w-16 gap-1 print:hidden shrink-0">
                      <button type="button" onClick={() => modificarCantidadTicket(index, -1)} className="w-4 h-4 flex items-center justify-center rounded-full border border-emerald-500 text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer">
                        <Minus className="w-2 h-2" />
                      </button>
                      <span className="font-bold text-slate-700 text-xs w-4 text-center">{item.cantidad}</span>
                      <button type="button" disabled={item.cantidad >= Number(item.stock_max)} onClick={() => modificarCantidadTicket(index, 1)} className="w-4 h-4 flex items-center justify-center rounded-full border border-emerald-500 text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 transition-colors cursor-pointer">
                        <Plus className="w-2 h-2" />
                      </button>
                    </div>

                    <span className="hidden print:block w-10 text-center text-sm shrink-0">{item.cantidad}x</span>

                    <div className="w-20 text-right shrink-0">
                      <span className="font-semibold text-xs text-slate-600">${(Number(item.precio) * item.cantidad).toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-xl print:bg-white print:border-t-2 print:border-slate-800 shrink-0">
            <form onSubmit={procesarFacturacionMostrador} className="space-y-4">
              
              <div className="print:hidden space-y-3 pb-3 border-b border-slate-200/60">
                <select value={medioPago} onChange={(e) => { setMedioPago(e.target.value); setPagaCompleto(''); }} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm">
                  <option value="Efectivo">Efectivo (Cobro Físico)</option>
                  <option value="Tarjeta">Tarjeta Débito / Crédito</option>
                  <option value="Transferencia">Mercado Pago / Transferencia</option>
                </select>

                {medioPago === 'Efectivo' && listaFactura.length > 0 && (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Abona con: $..." 
                      value={pagaCon} 
                      onChange={(e) => setPagaCompleto(e.target.value.replace(/\D/g, ''))} 
                      className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                    />
                    <div className="flex-1 bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between shadow-sm">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Vuelto:</span>
                      <span className="text-xs font-black text-slate-700">${vuelto > 0 ? vuelto.toLocaleString('es-AR') : '0'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>Sub Total</span>
                  <span>${totalFactura.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>Tasa de Impuesto</span>
                  <span className="text-emerald-600 text-[10px]">0.0%</span>
                </div>
                <div className="flex justify-between items-end pt-3 mt-1 border-t border-slate-200">
                  <span className="text-base font-bold text-slate-800">Total</span>
                  <span className="text-xl font-black text-emerald-600">${totalFactura.toLocaleString('es-AR')}</span>
                </div>
                <div className="hidden print:block text-xs text-slate-500 mt-2">
                  Pago: {medioPago} {medioPago === 'Efectivo' && pagaCon ? `(Abonó $${pagaCon} - Vuelto $${vuelto})` : ''}
                </div>
              </div>

              <div className="flex gap-3 pt-2 print:hidden">
                <button type="button" onClick={() => {setListaFactura([]); setPagaCompleto('');}} className="w-1/3 py-2.5 border border-rose-500 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={listaFactura.length === 0 || loading || (medioPago === 'Efectivo' && pagaCon !== '' && Number(pagaCon) < totalFactura)} className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2">
                  {loading ? 'Procesando...' : `Pagar ($${totalFactura.toLocaleString('es-AR')})`}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

export default POSEmployee;