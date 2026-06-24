import { useState } from 'react';
import { ShoppingCart, Trash2, CreditCard } from 'lucide-react';

function Cart() {
  const [items, setItems] = useState([
    { id: 1, nombre: 'Mountain Bike R29', precio: 450000.00, cantidad: 1, imagen: '🚵‍♂️' },
    { id: 3, nombre: 'Casco Pro Seguridad', precio: 35000.00, cantidad: 1, imagen: '🪖' }
  ]);

  const subtotal = items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  const eliminarItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-8 pl-24 md:pl-18rem max-w-7xl mx-auto transition-all">
      <header className="border-b border-slate-200 pb-5 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-blue-600" /> Mi Carrito
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Revisá tus productos antes de confirmar la compra.</p>
      </header>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <p className="text-slate-400 text-lg font-medium">Tu carrito está completamente vacío.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{item.imagen}</span>
                  <div>
                    <h3 className="text-slate-800 font-bold text-base">{item.nombre}</h3>
                    <p className="text-slate-400 text-xs">Precio unitario: ${item.precio.toLocaleString('es-AR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-slate-600 font-semibold text-sm">Cant: {item.cantidad}</span>
                  <p className="text-slate-800 font-black text-lg">${(item.precio * item.cantidad).toLocaleString('es-AR')}</p>
                  <button 
                    onClick={() => eliminarItem(item.id)}
                    className="text-slate-400 hover:text-red-500 cursor-pointer p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen de Compra */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs h-fit space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Resumen de Compra</h2>
            <div className="space-y-2 text-sm font-medium">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Envío</span>
                <span className="text-emerald-600 font-bold">Gratis</span>
              </div>
              <div className="flex justify-between text-lg font-black text-slate-800 pt-4 border-t border-slate-100">
                <span>Total</span>
                <span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
            </div>
            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer">
              <CreditCard className="w-4 h-4" /> Proceder al Pago
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;