import Header from './Header';
import { ShoppingCart, Trash2, CreditCard, Truck } from 'lucide-react';

function Cart({ userName, cartItems, updateQuantity, removeFromCart, globalCP, setGlobalCP }) {
  // El subtotal y los costos se recalculan automáticamente con el renderizado reactivo
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
            {cartItems.map((item) => (
              <div key={`${item.id}-${item.colorElegido}`} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{item.imagen}</span>
                  <div>
                    <h3 className="text-slate-800 font-bold text-sm md:text-base">{item.nombre}</h3>
                    <p className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded border border-slate-200 mt-1 w-fit">
                      Color: {item.colorElegido}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 justify-between w-full sm:w-auto">
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button 
                      onClick={() => updateQuantity(item.id, item.colorElegido, -1)}
                      className="w-7 h-7 bg-white rounded-lg text-slate-700 font-black text-sm flex items-center justify-center hover:bg-slate-50 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-slate-800 font-bold text-sm px-2 min-w-20px text-center">{item.cantidad}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.colorElegido, 1)}
                      className="w-7 h-7 bg-white rounded-lg text-slate-700 font-black text-sm flex items-center justify-center hover:bg-slate-50 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-slate-800 font-black text-sm md:text-base min-w-80px text-right">
                      ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                    </p>
                    {/* Ejecuta la función global reactiva al hacer click en el tachito */}
                    <button 
                      onClick={() => removeFromCart(item.id, item.colorElegido)} 
                      className="text-slate-400 hover:text-red-500 cursor-pointer p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                <span>${totalGeneral.toLocaleString('es-AR')}</span>
              </div>
            </div>
            <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer">
              <CreditCard className="w-4 h-4" /> Proceder al Pago
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;