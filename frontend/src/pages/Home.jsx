import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { ShoppingCart, Percent, ChevronLeft, ChevronRight } from 'lucide-react';

function Home({ userName, addToCart }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar qué diapositiva del carrusel se está viendo
  const [currentSlide, setCurrentSlide] = useState(0);

  // 1. CARGAMOS EL CATÁLOGO DESDE EL BACKEND
  useEffect(() => {
    const fetchHomeProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/productos');
        setAllProducts(response.data);
      } catch (error) {
        console.error('Error cargando catálogo para Home:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeProducts();
  }, []);

  // 2. SEPARAMOS LOS PRODUCTOS DESTACADOS PARA EL CARRUSEL
  // Usamos Number() para evitar el error del 0 y el 1 de MySQL
  const productosDestacados = allProducts.filter(p => Number(p.destacado) === 1);

  // 3. EFECTO DE AUTO-SLIDE PARA EL CARRUSEL (Cambia cada 4 segundos)
  useEffect(() => {
    if (productosDestacados.length > 1 && searchTerm === '') {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev === productosDestacados.length - 1 ? 0 : prev + 1));
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [productosDestacados.length, searchTerm]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === productosDestacados.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? productosDestacados.length - 1 : prev - 1));

  // 4. LÓGICA DE BÚSQUEDA PARA LA GRILLA INFERIOR
  const filteredProducts = allProducts.filter((producto) => {
    if (searchTerm.trim() !== '') {
      return producto.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    }
    // Si no hay búsqueda, mostramos los destacados también en la grilla
    return Number(producto.destacado) === 1;
  });

  // Paletas de colores elegantes para generar banners automáticos
  const bgGradients = [
    'from-blue-900 to-slate-900',
    'from-emerald-900 to-teal-950',
    'from-rose-900 to-red-950',
    'from-indigo-900 to-purple-950'
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 w-full transition-all">
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} userName={userName} />

      <main className="mt-4 w-full max-w-7xl mx-auto">
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-slate-400 font-bold animate-pulse text-lg">Armando vidriera interactiva...</p>
          </div>
        ) : (
          <>
            {/* CARRUSEL DE PRODUCTOS DESTACADOS (Solo se muestra si no se está buscando nada) */}
            {searchTerm === '' && productosDestacados.length > 0 && (
              <div className="relative w-full h-56 md:h-80 rounded-3xl overflow-hidden mb-10 shadow-xl group">
                
                {/* Contenedor deslizante */}
                <div 
                  className="flex w-full h-full transition-transform duration-700 ease-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {productosDestacados.map((prod, index) => {
                    const displayImg = prod.imagen && prod.imagen.includes('|') ? prod.imagen.split('|')[0] : prod.imagen;
                    const tieneDescuento = Number(prod.descuento) > 0;
                    const precioLista = Number(prod.precio);
                    const precioOferta = tieneDescuento ? precioLista - (precioLista * (Number(prod.descuento) / 100)) : precioLista;
                    const gradient = bgGradients[index % bgGradients.length];

                    return (
                      <div key={prod.id} className={`min-w-full h-full bg-gradient to-r ${gradient} flex items-center justify-between p-6 md:p-12 relative overflow-hidden`}>
                        
                        {/* Círculo decorativo de fondo */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 md:w-96 md:h-96 bg-white opacity-5 rounded-full blur-3xl"></div>

                        {/* Textos del Banner */}
                        <div className="z-10 flex flex-col items-start max-w-[50%] md:max-w-[60%]">
                          {tieneDescuento ? (
                            <span className="bg-rose-500 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3 shadow-md flex items-center gap-1">
                              <Percent className="w-3 h-3 md:w-4 md:h-4" /> {prod.descuento}% OFF Especial
                            </span>
                          ) : (
                            <span className="bg-emerald-500 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3 shadow-md">
                              Recomendado
                            </span>
                          )}
                          
                          <h2 className="text-white text-xl md:text-4xl font-black leading-tight mb-2 md:mb-4 drop-shadow-md line-clamp-2">
                            {prod.nombre}
                          </h2>
                          
                          <div className="flex items-end gap-3 mb-4 md:mb-6">
                            <span className="text-white font-black text-2xl md:text-5xl drop-shadow-md">
                              ${precioOferta.toLocaleString('es-AR')}
                            </span>
                            {tieneDescuento && (
                              <span className="text-white/60 font-bold text-sm md:text-xl line-through mb-1">
                                ${precioLista.toLocaleString('es-AR')}
                              </span>
                            )}
                          </div>

                          <button 
                            onClick={() => addToCart({ ...prod, precio: precioOferta }, 'Único')}
                            className="bg-white text-slate-900 hover:bg-slate-200 px-6 py-2.5 md:px-8 md:py-3 rounded-xl font-black text-xs md:text-sm shadow-lg transition-transform hover:scale-105 flex items-center gap-2 cursor-pointer"
                          >
                            <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" /> Ver Oferta
                          </button>
                        </div>

                        {/* Imagen del Producto en el Banner */}
                        <div className="z-10 w-1/2 h-full flex items-center justify-end md:justify-center p-2">
                          {displayImg && displayImg.startsWith('http') ? (
                            <img src={displayImg} alt={prod.nombre} className="max-h-full max-w-full object-contain drop-shadow-2xl scale-110 md:scale-125 origin-right md:origin-center" />
                          ) : (
                            <span className="text-8xl drop-shadow-2xl">{displayImg || '🚲'}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Flechas de Control Manual */}
                {productosDestacados.length > 1 && (
                  <>
                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-2 md:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                      <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-2 md:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                      <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </button>

                    {/* Puntitos indicadores */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {productosDestacados.map((_, idx) => (
                        <button 
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all cursor-pointer ${currentSlide === idx ? 'bg-white w-6 md:w-8' : 'bg-white/50 hover:bg-white/80'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TÍTULO DE LA GRILLA */}
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              {searchTerm.trim() !== '' ? '🔍 Resultados de la búsqueda' : '⚡ Catálogo Destacado'}
            </h2>
            
            {/* GRILLA DE PRODUCTOS */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 w-full shadow-sm">
                <p className="text-slate-500 font-medium">No se encontraron productos para mostrar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 w-full">
                {filteredProducts.map((producto) => {
                  const displayImg = producto.imagen && producto.imagen.includes('|') ? producto.imagen.split('|')[0] : producto.imagen;
                  const tieneDescuento = Number(producto.descuento) > 0;
                  const precioLista = Number(producto.precio);
                  const precioOferta = tieneDescuento ? precioLista - (precioLista * (Number(producto.descuento) / 100)) : precioLista;

                  return (
                    <div key={producto.id} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
                      
                      {tieneDescuento && (
                        <div className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5 shadow-sm z-10">
                          <Percent className="w-2.5 h-2.5" /> {producto.descuento}% OFF
                        </div>
                      )}

                      <div>
                        <div className="h-32 md:h-40 bg-slate-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-slate-100 group-hover:scale-[1.02] transition-transform p-2">
                          {displayImg && displayImg.startsWith('http') ? (
                            <img src={displayImg} alt={producto.nombre} className="max-w-full max-h-full object-contain drop-shadow-sm" />
                          ) : (
                            <span className="text-5xl">{displayImg || '🚲'}</span>
                          )}
                        </div>
                        <h3 className="text-xs md:text-sm font-bold text-slate-800 leading-tight min-h-34px line-clamp-2">{producto.nombre}</h3>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex flex-col items-center justify-center h-40px">
                          {tieneDescuento ? (
                            <>
                              <span className="text-slate-400 text-[10px] line-through font-semibold">${precioLista.toLocaleString('es-AR')}</span>
                              <span className="text-rose-600 font-black text-lg">${precioOferta.toLocaleString('es-AR')}</span>
                            </>
                          ) : (
                            <span className="text-slate-900 font-black text-lg">${precioLista.toLocaleString('es-AR')}</span>
                          )}
                        </div>

                        <button 
                          onClick={() => addToCart({ ...producto, precio: precioOferta }, 'Único')}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] md:text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors uppercase tracking-wider"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Añadir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Home;