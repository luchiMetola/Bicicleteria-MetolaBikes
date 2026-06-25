import { useState } from 'react';
import Header from './Header';

function Home({ userName }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [destacados] = useState([
    { id: 1, nombre: 'Mountain Bike R29', descripcion: 'Bicicleta todo terreno con cuadro de aluminio y 21 velocidades Shimano.', precio: 450000.00, stock: 10, imagen: '🚵‍♂️', id_categoria: 1 },
    { id: 2, nombre: 'Bicicleta de Ruta Carbono', descripcion: 'Diseño aerodinámico ultra liviano para alta velocidad en asfalto.', precio: 680000.00, stock: 5, imagen: '🚴‍♀️', id_categoria: 1 }
  ]);

  // Filtramos los destacados en tiempo real si el usuario escribe en el Search
  const filteredDestacados = destacados.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-8 pl-24 md:pl-72 max-w-7xl mx-auto transition-all">
      {/* Inyectamos el Header pasándole el control de búsqueda y tu nombre */}
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} userName={userName} />

      <main className="mt-4">
        <h2 className="text-xl font-bold text-slate-700 mb-6">Productos Destacados</h2>
        
        {filteredDestacados.length === 0 ? (
          <p className="text-slate-400 italic text-sm">No se encontró el producto.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredDestacados.map((producto) => (
              <div key={producto.id} className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <span className="text-6xl block my-2">{producto.imagen}</span>
                  <h3 className="text-xl font-bold text-slate-800 mt-3">{producto.nombre}</h3>
                  <p className="text-slate-500 text-sm mt-2 px-4">{producto.descripcion}</p>
                </div>
                <div className="mt-6">
                  <p className="text-emerald-600 font-black text-3xl">${Number(producto.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-slate-400 text-xs mt-1">¡Pocas unidades en stock!</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;