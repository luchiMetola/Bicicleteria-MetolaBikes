import { useState } from 'react';

function Productos() {
  // Aquí se listan absolutamente todos tus artículos
  const [todosLosProductos] = useState([
    { id: 1, nombre: 'Mountain Bike R29', descripcion: 'Bicicleta todo terreno con cuadro de aluminio y 21 velocidades Shimano.', precio: 450000.00, stock: 10, imagen: '🚵‍♂️', id_categoria: 1 },
    { id: 2, nombre: 'Bicicleta de Ruta Carbono', descripcion: 'Diseño aerodinámico ultra liviano para alta velocidad en asfalto.', precio: 680000.00, stock: 5, imagen: '🚴‍♀️', id_categoria: 1 },
    { id: 3, nombre: 'Casco Pro Seguridad', descripcion: 'Protección de alta densidad con ventilación optimizada.', precio: 35000.00, stock: 15, imagen: '🪖', id_categoria: 2 },
    { id: 4, nombre: 'Inflador de Mano Pro', descripcion: 'Inflador portátil de alta presión compatible con válvulas Presta y Schrader.', precio: 12000.00, stock: 25, imagen: '💨', id_categoria: 2 },
    { id: 5, nombre: 'Luces LED Delantera/Trasera', descripcion: 'Kit de luces recargables por USB, resistentes al agua y de alta potencia.', precio: 18000.00, stock: 30, imagen: '🔦', id_categoria: 2 }
  ]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-8 pl-24 md:pl-72 max-w-7xl mx-auto transition-all">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">📦 Catálogo de Productos</h1>
        <p className="text-slate-500 mt-1 text-sm">Explorá todo nuestro inventario disponible para envíos nacionales.</p>
      </header>

      <main className="mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {todosLosProductos.map((producto) => (
            <div key={producto.id} className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <span className="text-5xl block my-2">{producto.imagen}</span>
                <h3 className="text-lg font-bold text-slate-800 mt-3">{producto.nombre}</h3>
                <p className="text-slate-500 text-xs mt-1 px-2 line-clamp-2">{producto.descripcion}</p>
              </div>
              <div className="mt-4">
                <p className="text-emerald-600 font-black text-2xl">${Number(producto.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                <p className="text-slate-400 text-xs mt-1">Stock: {producto.stock} u.</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Productos;