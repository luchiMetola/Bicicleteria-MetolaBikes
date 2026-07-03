import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { ShoppingCart, Trash2, CreditCard, Truck, X, CheckCircle } from 'lucide-react';

function Cart({ userName, cartItems, updateQuantity, removeFromCart, globalCP, setGlobalCP, clearCart }) {
  // Sube el subtotal y total general
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

  // Estados para controlar el Checkout / Modal de Pago
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [medioPago, setMedioPago] = useState('Tarjeta');
  const [metodoEntrega, setMetodoEntrega] = useState('Envío a domicilio');
  const [direccionConfirmada, setDireccionConfirmada] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorCheckout, setErrorCheckout] = useState('');

  // Efecto para traer de forma automática la dirección real del cliente si elige Envío a Domicilio
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

  // Función para procesar el pago real contra Node + MySQL
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

      // 1. Mapeamos de forma idéntica las propiedades con lo que lee tu backend/index.js
      const productosEstructurados = cartItems.map(item => ({
        id_producto: item.id,
        color: item.colorElegido || 'Único', 
        rodado_talla: item.rodado || 'Único', 
        cantidad: item.cantidad,
        precio: item.precio
      }));

      // 2. Armamos el payload unificado usando las variables correctas
      const payload = {
        total: totalGeneral,
        tipo_venta: 'Web',
        metodo_entrega: metodoEntrega,
        direccion_envio: metodoEntrega === 'Retiro en sucursal' ? 'Local Caucete' : direccionConfirmada,
        medio_pago: medioPago,
        productosComprados: productosEstructurados 
      };

      // 3. Hacemos una única petición POST limpia (YA SIN EL COPIADO SUELTO ANTERIOR)
      const response = await axios.post('http://localhost:5000/api/ventas/pagar', payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setMensajeExito(response.data.message);
      
      // Esperamos 3 segundos mostrando el cartel de éxito, cerramos el modal y limpiamos el carrito
      setTimeout(() => {
        setIsCheckoutOpen(false);
        setMensajeExito('');
        if (typeof clearCart === 'function') {
          clearCart(); // Resetea el estado global en App.jsx
        }
      }, 3000);

    } catch (err) {
      console.error(err);
      setErrorCheckout('Hubo un problema al procesar la transacción. Reintentá.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 pl-24 md:pl-72 w-full transition-all">
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
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex items-center justify-center text-4xl overflow-hidden">
                      {displayImg && displayImg.startsWith('data:image') ? (
                        <img src={displayImg} alt={item.nombre} className="w-full h-full object-cover rounded-lg border border-slate-200" />
                      ) : (
                        displayImg || '🚲'
                      )}
                    </div>
                    <div>
                      <h3 className="text-slate-800 font-bold text-sm md:text-base">{item.nombre}</h3>
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
                        disabled={item.cantidad >= item.stock} // Bloquea si iguala o supera las unidades que cargó el empleado
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

      {/* MODAL DE PROCESAR PAGO */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
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
                    <p className="text-[10px] text-slate-400 mt-1 italic">Precargada desde tu perfil. Podés cambiarla si lo deseás.</p>
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