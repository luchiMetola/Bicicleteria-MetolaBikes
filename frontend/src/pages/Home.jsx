import { useState } from 'react';
import Header from '../components/Header';

function Home({ userName, addToCart }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Catálogo maestro completo unificado para que la búsqueda sea 100% global
  const [allProducts] = useState([
    { id: 1, nombre: 'Mountain Bike R29', descripcion: 'Bicicleta todo terreno con cuadro de aluminio, suspensión delantera y 21 velocidades Shimano. Ideal para senderos y asfalto.', precio: 450000.00, stock: 10, imagen: '🚵‍♂️', id_categoria: 1, destacado: true },
    { id: 2, nombre: 'Bicicleta de Ruta Carbono', descripcion: 'Diseño aerodinámico ultra liviano con cuadro de fibra de carbono para alta velocidad en asfalto de nivel competitivo.', precio: 680000.00, stock: 5, imagen: '🚴‍♀️', id_categoria: 1, destacado: true },
    { id: 8, nombre: 'Manubrio MTB Carbono', descripcion: 'Manubrio de alta resistencia y absorción de impactos, ideal para descenso y competencias exigentes.', precio: 45000.00, stock: 8, imagen: '🚲', id_categoria: 3, destacado: false },
    { id: 9, nombre: 'Cadena Shimano 11v', descripcion: 'Cadena reforzada con tecnología SIL-TEC para cambios sumamente suaves y una durabilidad extrema en transmisiones.', precio: 22000.00, stock: 15, imagen: '🔗', id_categoria: 3, destacado: false },
    { id: 6, nombre: 'Proteína Whey Gold 1kg', descripcion: 'Suplemento proteico premium ideal para la recuperación muscular óptima post-entrenamiento de alta intensidad.', precio: 32000.00, stock: 20, imagen: '🥛', id_categoria: 2, destacado: false },
    { id: 7, nombre: 'Gel Energético Pack x4', descripcion: 'Geles de rápida absorción con carbohidratos complejos y electrolitos para mantener la energía en rutas largas.', precio: 8500.00, stock: 50, imagen: '⚡', id_categoria: 2, destacado: false },
    { id: 3, nombre: 'Casco Pro Seguridad', descripcion: 'Protección de alta densidad con sistema de ventilación optimizada y ajuste micrométrico trasero.', precio: 35000.00, stock: 15, imagen: '🪖', id_categoria: 4, destacado: false },
    { id: 10, nombre: 'Jersey Ciclismo Metola', descripcion: 'Remera técnica transpirable con bolsillos traseros ergonómicos y bandas reflectivas de alta visibilidad.', precio: 28000.00, stock: 12, imagen: '👕', id_categoria: 4, destacado: false },
    { id: 11, nombre: 'Guantes Gel Antishock', descripcion: 'Guantes cortos con almohadillas protectoras de gel en las palmas para evitar adormecimiento en rodajes prolongados.', precio: 14000.00, stock: 22, imagen: '🧤', id_categoria: 4, destacado: false }
  ]);

  // Lógica de filtrado inteligente para la Home
  const filteredProducts = allProducts.filter((producto) => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase());

    // Si el usuario escribe algo en el buscador superior, escaneamos TODO el stock sin importar nada más
    if (searchTerm.trim() !== '') {
      return coincideBusqueda;
    }

    // Si el buscador está vacío, la pantalla vuelve a su modo estándar: mostrar solo los destacados
    return producto.destacado === true;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 w-full transition-all">
      {/* Inyectamos la barra superior compartiendo el estado de búsqueda y tu cuenta */}
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} userName={userName} />

      <main className="mt-4 w-full">
        {/* Título dinámico según la interacción */}
        <h2 className="text-xl font-bold text-slate-700 mb-6">
          {searchTerm.trim() !== '' ? '🔍 Resultados de la búsqueda global' : '⭐ Productos Destacados'}
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
                  <p className="text-slate-500 text-xs mt-2 px-2 line-clamp-2">{producto.descripcion}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100 space-y-3">
                  <p className="text-emerald-600 font-black text-xl">${Number(producto.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                  <button 
                    onClick={() => addToCart(producto, producto.colores ? producto.colores[0] : 'Único')}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-colors"
                  >
                    🛒 Agregar al carrito
                  </button>
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