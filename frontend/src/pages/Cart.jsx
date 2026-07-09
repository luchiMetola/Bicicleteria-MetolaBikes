import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { ShoppingCart, Trash2, CreditCard, Truck, X, CheckCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

function Cart({ userName, cartItems, updateQuantity, removeFromCart, globalCP, setGlobalCP, clearCart }) {
  const subtotal = cartItems.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  let costoEnvio = 0;
  let mensajeEnvio = 'Falta ingresar Código Postal';

  if (subtotal > 0) {
    if (!globalCP) {
      costoEnvio = 0;
      mensajeEnvio = 'Falta ingresar Código Postal';
    } else if (globalCP.startsWith('54')) {
      costoEnvio = subtotal >= 50000 ? 0 : 2500;
      mensajeEnvio = costoEnvio === 0 ? 'Envío Local Bonificado: Gratis' : 'Envío Local: $2.500';
    } else {
      costoEnvio = 6800;
      mensajeEnvio = 'Envío Nacional: $6.800';
    }
  }

  const totalGeneral = subtotal + costoEnvio;

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [medioPago, setMedioPago] = useState('Tarjeta');
  const [metodoEntrega, setMetodoEntrega] = useState('Envío a domicilio');
  const [direccionConfirmada, setDireccionConfirmada] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorCheckout, setErrorCheckout] = useState('');

  // Estados para el Modal de Info del Carrito
  const [activeProductView, setActiveProductView] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    if (isCheckoutOpen) {
      const obtenerDireccionPerfil = async () => {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const res = await axios.get('http://localhost:5000/api/perfil', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            setDireccionConfirmada(res.data.direccion || '');
          }
        } catch (err) {
          console.error('Error al precargar dirección:', err);
        }
      };
      obtenerDireccionPerfil();
    }
  }, [isCheckoutOpen]);

  const gestionarPagoFinal = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorCheckout('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorCheckout('Debes iniciar sesión para finalizar tu compra.');
        setLoading(false);
        return;
      }

      const productosEstructurados = cartItems.map(item => ({
        id_producto: item.id,
        color: item.colorElegido || 'Único', 
        rodado_talla: item.rodado || 'Único', 
        cantidad: item.cantidad,
        precio: item.precio
      }));

      const payload = {
        total: totalGeneral,
        tipo_venta: 'Web',
        metodo_entrega: metodoEntrega,
        direccion_envio: metodoEntrega === 'Retiro en sucursal' ? 'Local Caucete' : direccionConfirmada,
        medio_pago: medioPago,
        productosComprados: productosEstructurados 
      };

      const response = await axios.post('http://localhost:5000/api/ventas/pagar', payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setMensajeExito(response.data.message);
      
      setTimeout(() => {
        setIsCheckoutOpen(false);
        setMensajeExito('');
        if (typeof clearCart === 'function') {
          clearCart();
        }
      }, 3000);

    } catch (err) {
      console.error(err);
      setErrorCheckout('Hubo un problema al procesar la transacción. Reintentá.');
    } finally {
      setLoading(false);
    }
  };

  // Función para procesar y mostrar info del producto guardado
  const parseAttributes = (rawText) => {
    const attributes = { model: '', details: '' };
    if (!rawText) return attributes;
    const parts = rawText.split('|');
    parts.forEach(part => {
      if (part.includes('Modelo:')) attributes.model = part.replace('Modelo:', '').trim();
      if (part.includes('Detalles:')) attributes.details = part.replace('Detalles:', '').trim();
    });
    return attributes;
  };

  const handleViewInfo = (item) => {
    const attrs = parseAttributes(item.descripcion);
    let listImgs = item.imagen && item.imagen.includes('|') ? item.imagen.split('|') : [item.imagen || '🚲'];
    setActiveImageIdx(0);
    setActiveProductView({ prod: item, attrs, images: listImgs });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 w-full transition-all relative">
      <Header searchTerm="" setSearchTerm={() => {}} userName={userName} />

      <header className="pb-5 mb-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-blue-600" /> Mi Carrito
        </h1>
      </header>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <p className="text-slate-400 font-medium">Tu carrito está completamente vacío.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Lista de Items */}
          <div className="lg:col-span-2 space-y-3">
            {cartItems.map((item) => {
              const displayImg = item.imagen && item.imagen.includes('|') ? item.imagen.split('|')[0] : item.imagen;

              return (
                <div key={`${item.id}-${item.colorElegido}`} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                  
                  {/* Contenedor interactivo para Ver Detalles */}
                  <div 
                    onClick={() => handleViewInfo(item)}
                    className="flex items-center gap-3 cursor-pointer group flex-1 min-w[200px]"
                  >
                    <div className="w-12 h-12 flex items-center justify-center text-4xl overflow-hidden relative">
                      {displayImg && (displayImg.startsWith('data:image') || displayImg.startsWith('http')) ? (
                        <img src={displayImg} alt={item.nombre} className="w-full h-full object-cover rounded-lg border border-slate-200 group-hover:opacity-60 transition-opacity" />
                      ) : (
                        <span className="group-hover:opacity-60 transition-opacity">{displayImg || '🚲'}</span>
                      )}
                      <Eye className="absolute inset-auto w-5 h-5 text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <h3 className="text-slate-800 font-bold text-sm md:text-base group-hover:text-blue-600 transition-colors">{item.nombre}</h3>
                      <p className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded border border-slate-200 mt-1 w-fit">
                        Color: {item.colorElegido} | Rodado: {item.rodado}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 justify-between w-full sm:w-auto">
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.id, item.colorElegido, -1)}
                        className="w-7 h-7 bg-white rounded-lg text-slate-700 font-black text-sm flex items-center justify-center hover:bg-slate-50 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-slate-800 font-bold text-sm px-2 min-w-20px text-center">{item.cantidad}</span>
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.id, item.colorElegido, 1)}
                        disabled={item.stock !== undefined && item.cantidad >= item.stock} 
                        className="w-7 h-7 bg-white rounded-lg text-slate-700 font-black text-sm flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="text-slate-800 font-black text-sm md:text-base min-w-80px text-right">
                        ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                      </p>
                      <button 
                        onClick={() => removeFromCart(item.id, item.colorElegido)} 
                        className="text-slate-400 hover:text-red-500 cursor-pointer p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen de Compra */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs h-fit space-y-4">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">Resumen de Compra</h2>
            <div className="space-y-3 text-xs font-medium">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600 font-bold">
                  <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-blue-500" /> Entrega:</span>
                  <span className={costoEnvio === 0 && globalCP ? 'text-emerald-600' : 'text-slate-700'}>
                    {globalCP ? (costoEnvio === 0 ? 'Gratis' : `$${costoEnvio.toLocaleString('es-AR')}`) : '$0'}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500">{mensajeEnvio}</p>
                
                <input
                  type="text" maxLength="4" placeholder="Cambiar C.P. (Ej: 5400)"
                  value={globalCP}
                  onChange={(e) => setGlobalCP(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-1.5 border border-slate-300 rounded-lg text-[11px] bg-white mt-1"
                />
              </div>

              {globalCP && globalCP.startsWith('54') && subtotal < 50000 && (
                <p className="text-[10px] text-amber-600 font-medium italic">¡Sumá ${(50000 - subtotal).toLocaleString('es-AR')} más en San Juan para tener envío local gratis!</p>
              )}

              <div className="flex justify-between text-base font-black text-slate-800 pt-3 border-t border-slate-100">
                <span>Total General</span>
                <span>Total: ${totalGeneral.toLocaleString('es-AR')}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer transition-colors"
            >
              <CreditCard className="w-4 h-4" /> Proceder al Pago
            </button>
          </div>
        </div>
      )}

      {/* MODAL DETALLES DEL PRODUCTO EN CARRITO */}
      {activeProductView && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl relative grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setActiveProductView(null)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* CARRUSEL DE FOTOS */}
            <div className="flex flex-col gap-3">
              <div className="bg-slate-50 border border-slate-200 h-56 rounded-2xl flex items-center justify-center text-7xl relative overflow-hidden p-4">
                {activeProductView.images[activeImageIdx] && (activeProductView.images[activeImageIdx].startsWith('data:image') || activeProductView.images[activeImageIdx].startsWith('http')) ? (
                  <img src={activeProductView.images[activeImageIdx]} alt="Visor" className="w-full h-full object-contain" />
                ) : (
                  activeProductView.images[0] || '🚲'
                )}

                {activeProductView.images.length > 1 && (
                  <>
                    <button 
                      type="button"
                      onClick={() => setActiveImageIdx(prev => (prev === 0 ? activeProductView.images.length - 1 : prev - 1))}
                      className="absolute left-2 bg-white/80 p-1 rounded-lg border border-slate-200 text-slate-700 shadow-2xs cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveImageIdx(prev => (prev === activeProductView.images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-2 bg-white/80 p-1 rounded-lg border border-slate-200 text-slate-700 shadow-2xs cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {activeProductView.images.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {activeProductView.images.map((imgStr, idx) => (
                    <div 
                      key={idx} onClick={() => setActiveImageIdx(idx)}
                      className={`w-12 h-12 bg-slate-50 border rounded-xl overflow-hidden cursor-pointer flex items-center justify-center p-1 shadow-2xs transition-all ${
                        activeImageIdx === idx ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                      }`}
                    >
                      <img src={imgStr} alt="Mini" className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* INFO RESUMIDA */}
            <div className="flex flex-col space-y-4">
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Info del Producto</span>
                  <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight mt-1.5 leading-tight">{activeProductView.prod.nombre}</h2>
                  <p className="text-slate-400 font-semibold text-[11px] mt-0.5">Modelo/Línea: {activeProductView.attrs.model || 'Insumo Original'}</p>
                </div>

                <div className="text-xl font-black text-slate-900 bg-slate-50 p-3 border border-slate-200 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Precio Unitario:</span>
                  <span>${Number(activeProductView.prod.precio).toLocaleString('es-AR')}</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Configuración Reservada:</p>
                  <p className="text-sm font-bold text-slate-800">Color: <span className="text-blue-600">{activeProductView.prod.colorElegido}</span></p>
                  <p className="text-sm font-bold text-slate-800">Talle/Rodado: <span className="text-blue-600">{activeProductView.prod.rodado}</span></p>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">Especificaciones:</span>
                  <p className="text-slate-500 font-medium text-xs bg-slate-50 p-2.5 border border-slate-200 rounded-xl leading-relaxed max-h-24 overflow-y-auto">
                    {activeProductView.attrs.details || 'Componentes de alta gama homologados para ciclismo.'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE PROCESAR PAGO */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          {/* ... [El Modal de Pago se mantiene exactamente igual] ... */}
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {mensajeExito ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
                <h2 className="text-xl font-extrabold text-slate-800">¡Compra Exitosa!</h2>
                <p className="text-sm text-slate-500 font-medium px-4">{mensajeExito}</p>
                <p className="text-xs text-blue-600 font-bold animate-pulse pt-2">Actualizando tu historial en perfil...</p>
              </div>
            ) : (
              <form onSubmit={gestionarPagoFinal} className="space-y-4">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" /> Pasarela de Pago Directo
                </h2>
                <p className="text-xs text-slate-500">Confirmá los detalles para que el sistema registre tu orden en Metola Bikes.</p>

                {errorCheckout && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 font-medium text-xs rounded-xl">
                    {errorCheckout}
                  </div>
                )}

                {/* Selección Medio de Pago */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">1. Seleccioná Medio de Pago:</label>
                  <select 
                    value={medioPago} onChange={(e) => setMedioPago(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Tarjeta">Tarjeta de Crédito / Débito (Aprobación Inmediata)</option>
                    <option value="Transferencia">Transferencia Bancaria / Alias (Manual)</option>
                    <option value="Efectivo">Efectivo (Pago en salón de Caucete)</option>
                  </select>
                </div>

                {/* Selección Método de Entrega */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">2. Método de Entrega:</label>
                  <select 
                    value={metodoEntrega} onChange={(e) => setMetodoEntrega(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Envío a domicilio">Envío a Domicilio (Vía Cargo / Logística)</option>
                    <option value="Retirar por Correo Argentino">Retirar en Sucursal de Correo Argentino</option>
                    <option value="Retiro en sucursal">Retiro presencial en Local Físico</option>
                  </select>
                </div>

                {/* Especificación de Dirección Dinámica */}
                {metodoEntrega !== 'Retiro en sucursal' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">3. Dirección de Entrega Destino:</label>
                    <input 
                      type="text" value={direccionConfirmada} onChange={(e) => setDireccionConfirmada(e.target.value)} required
                      placeholder="Calle, Número, Departamento, Barrio o Localidad"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 italic">¡Recordá colocar tu dirección completa para que el envío sea exitoso!</p>
                  </div>
                )}

                {/* Caja de Cierre Importe */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex justify-between items-center mt-2">
                  <span className="text-xs font-bold text-slate-600">Monto Final a Transferir/Cobrar:</span>
                  <span className="text-base font-black text-emerald-600">${totalGeneral.toLocaleString('es-AR')}</span>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Procesando transacción...' : 'Confirmar y Registrar Compra'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;