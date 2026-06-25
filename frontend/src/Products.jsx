import { useState } from 'react';
import Header from './Header';

function Products({ userName }) {
  const [activeCategory, setActiveCategory] = useState('Bicicletas');
  const [searchTerm, setSearchTerm] = useState('');

  const [allProducts] = useState([
    { id: 1, nombre: 'Mountain Bike R29', descripcion: 'Bicicleta todo terreno con cuadro de aluminio y 21 velocidades Shimano.', precio: 450000.00, stock: 10, imagen: '🚵‍♂️', id_categoria: 1 },
    { id: 2, nombre: 'Bicicleta de Ruta Carbono', descripcion: 'Diseño aerodinámico ultra liviano para alta velocidad en asfalto.', precio: 680000.00, stock: 5, imagen: '🚴‍♀️', id_categoria: 1 },
    { id: 8, nombre: 'Manubrio MTB Carbono', descripcion: 'Manubrio de alta resistencia y absorción de impactos, ideal para descenso.', precio: 45000.00, stock: 8, imagen: '🚲', id_categoria: 3 },
    { id: 9, nombre: 'Cadena Shimano 11v', descripcion: 'Cadena reforzada con tecnología SIL-TEC para cambios suaves y durabilidad.', precio: 22000.00, stock: 15, imagen: '🔗', id_categoria: 3 },
    { id: 6, font_name: 'Proteína Whey Gold 1kg', nombre: 'Proteína Whey Gold 1kg', descripcion: 'Suplemento proteico ideal para la recuperación muscular post-entrenamiento.', precio: 32000.00, stock: 20, imagen: '🥛', id_categoria: 2 },
    { id: 7, nombre: 'Gel Energético Pack x4', descripcion: 'Geles de rápida absorción con carbohidratos y electrolitos para rutas largas.', precio: 8500.00, stock: 50, imagen: '⚡', id_categoria: 2 },
    { id: 3, nombre: 'Casco Pro Seguridad', descripcion: 'Protección de alta densidad con ventilación optimizada.', precio: 35000.00, stock: 15, imagen: '🪖', id_categoria: 4 },
    { id: 10, nombre: 'Jersey Ciclismo Metola', descripcion: 'Remera técnica respirable con bolsillos traseros y bandas reflectivas.', precio: 28000.00, stock: 12, imagen: '👕', id_categoria: 4 },
    { id: 11, nombre: 'Guantes Gel Antishock', descripcion: 'Guantes cortos con protección de gel en palmas para evitar adormecimiento.', precio: 14000.00, stock: 22, imagen: '🧤', id_categoria: 4 }
  ]);

  const categoryMap = {
    'Bicicletas': 1,
    'Suplementación': 2,
    'Accesorios': 3,
    'Indumentaria': 4
  };

  const filteredProducts = allProducts.filter((p) => 
    p.id_categoria === categoryMap[activeCategory] &&
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 pl-24 md:pl-72 w-full transition-all">
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} userName={userName} />

      {/* Barra de pestañas */}
      <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {['Bicicletas', 'Accesorios', 'Suplementación', 'Indumentaria'].map((category) => (
          <button
            key={category}
            onClick={() => { setActiveCategory(category); setSearchTerm(''); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer
              ${activeCategory === category 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
          >
            {category}
          </button>
        ))}
      </div>

      <main className="mt-8 w-full">
        <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
          Sección activa: <span className="text-blue-600">{activeCategory}</span>
        </h2>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 w-full">
            <p className="text-slate-400 font-medium">No se encontró el producto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
            {filteredProducts.map((producto) => (
              <div key={producto.id} className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <span className="text-5xl block my-2">{producto.imagen}</span>
                  <h3 className="text-lg font-bold text-slate-800 mt-3">{producto.nombre}</h3>
                  <p className="text-slate-500 text-xs mt-1 px-2 line-clamp-2">{producto.descripcion}</p>
                </div>
                <div className="mt-4">
                  <p className="text-emerald-600 font-black text-2xl">
                    ${Number(producto.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">Stock: {producto.stock} u.</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Products;