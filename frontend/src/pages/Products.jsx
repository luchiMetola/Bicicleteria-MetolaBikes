import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { ShoppingCart, CheckCircle, AlertCircle, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';

function Products({ userName, addToCart }) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All'); // Filter by category
  const [notification, setNotification] = useState('');

  // Estados para controlar el visor interactivo del Modal de Detalles
  const [activeProductView, setActiveProductView] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [chosenColor, setChosenColor] = useState('');
  const [chosenSize, setChosenSize] = useState('');

  useEffect(() => {
    const loadCatalogData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/productos');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching live client catalog:', error);
      }
    };
    loadCatalogData();
  }, []);

  // Helper function para procesar la descripción técnica estructurada con pipes '|'
  const parseAttributes = (rawText) => {
    const attributes = { model: '', sizes: [], colors: [], details: '' };
    if (!rawText) return attributes;

    const parts = rawText.split('|');
    parts.forEach(part => {
      if (part.includes('Modelo:')) attributes.model = part.replace('Modelo:', '').trim();
      if (part.includes('Rodado/Talle:')) {
        const rawSizes = part.replace('Rodado/Talle:', '').trim();
        attributes.sizes = rawSizes.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (part.includes('Colores:')) {
        attributes.colors = part.replace('Colores:', '').split(',').map(c => c.trim()).filter(Boolean);
      }
      if (part.includes('Detalles:')) attributes.details = part.replace('Detalles:', '').trim();
    });

    return attributes;
  };

  const handleTriggerAddToCart = (prod, color, size, imgBase64) => {
    // Genera el objeto estructurado inyectando el stock disponible del producto
    const productWithVariants = {
      ...prod,
      nombre: prod.nombre,
      colorElegido: color,
      rodado: size,
      imagen: imgBase64 || '🚲',
      stock: prod.stock // Pasa el stock acumulado para que el carrito lo valide
    };

    addToCart(productWithVariants, color);
    setNotification(`¡Añadido al carrito: ${prod.nombre} (${color} - ${size})!`);
    setTimeout(() => setNotification(''), 3000);
  };

  // Filtrado lógico por barra de búsqueda y barra de categorías
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || Number(prod.id_categoria) === Number(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 pl-24 md:pl-72 w-full transition-all">
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} userName={userName} />

      <header className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Catálogo Online</h1>
          <p className="text-slate-500 text-xs mt-0.5">Explorá los componentes y armá tu carrito con stock real sincronizado.</p>
        </div>

        {/* BARRA INTERACTIVA DE CATEGORÍAS */}
        <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-2xl border border-slate-300/40 text-xs font-bold text-slate-600">
          <button onClick={() => setSelectedCategory('All')} className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategory === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'hover:bg-white/40'}`}>Todos</button>
          <button onClick={() => setSelectedCategory('1')} className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategory === '1' ? 'bg-white text-blue-600 shadow-xs' : 'hover:bg-white/40'}`}>Bicicletas</button>
          <button onClick={() => setSelectedCategory('2')} className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategory === '2' ? 'bg-white text-blue-600 shadow-xs' : 'hover:bg-white/40'}`}>Accesorios</button>
          <button onClick={() => setSelectedCategory('3')} className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategory === '3' ? 'bg-white text-blue-600 shadow-xs' : 'hover:bg-white/40'}`}>Indumentaria</button>
          <button onClick={() => setSelectedCategory('4')} className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategory === '4' ? 'bg-white text-blue-600 shadow-xs' : 'hover:bg-white/40'}`}>Suplementos</button>
        </div>
      </header>

      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" /> {notification}
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col items-center justify-center gap-2">
          <AlertCircle className="w-8 h-8 text-slate-400" />
          <p className="text-slate-400 font-semibold text-sm">No hay artículos disponibles en esta sección.</p>
        </div>
      ) : (
        /* VISTA DE GRILLA LIMPIA: 2 columnas exactas en celular, 3 o más en pantallas grandes */
        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full">
          {filteredProducts.map((prod) => {
            const attrs = parseAttributes(prod.descripcion);
            // Separa las imágenes del pipe y renderiza únicamente la primera en la grilla del catálogo
            const displayImg = prod.imagen && prod.imagen.includes('|') ? prod.imagen.split('|')[0] : prod.imagen;

            return (
              <div 
                key={prod.id} 
                onClick={() => {
                  let listImgs = prod.imagen && prod.imagen.includes('|') ? prod.imagen.split('|') : [prod.imagen || '🚲'];
                  setChosenColor(attrs.colors[0] || 'Único');
                  setChosenSize(attrs.sizes[0] || 'Único');
                  setActiveImageIdx(0);
                  setActiveProductView({ prod, attrs, images: listImgs });
                }}
                className="bg-white border border-slate-200 rounded-2xl p-3 md:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer relative"
              >
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-100 h-32 md:h-44 rounded-xl flex items-center justify-center text-4xl md:text-6xl group-hover:scale-101 transition-transform relative overflow-hidden">
                    {displayImg && displayImg.startsWith('data:image') ? (
                      <img src={displayImg} alt={prod.nombre} className="w-full h-full object-cover" />
                    ) : (
                      displayImg || '🚲'
                    )}
                    {prod.stock <= 0 && (
                      <span className="absolute inset-0 bg-white/90 backdrop-blur-3xs flex items-center justify-center text-[10px] md:text-xs font-black uppercase text-rose-600 tracking-wider">
                        Sin Stock
                      </span>
                    )}
                    <div className="absolute top-2 right-2 bg-slate-900/40 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white backdrop-blur-3xs transition-all duration-100">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-xs md:text-base leading-tight tracking-tight line-clamp-2 min-h-32px md:min-h-48px">{prod.nombre}</h3>
                    <p className="text-slate-400 text-[10px] md:text-[11px] font-semibold mt-1 truncate">{attrs.model || 'Insumo original'}</p>
                  </div>
                </div>

                <div className="pt-2 md:pt-4 mt-2 md:mt-4 border-t border-slate-100 flex items-center justify-between gap-1">
                  <span className="text-sm md:text-lg font-black text-slate-900">
                    ${Number(prod.precio).toLocaleString('es-AR')}
                  </span>
                  <span className="text-[10px] bg-slate-100 font-bold px-1.5 py-0.5 border border-slate-200 text-slate-500 rounded-md">
                    Ver más
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL EXTENDIDO: FICHA DEL PRODUCTO DETALLADA */}
      {activeProductView && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl relative grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setActiveProductView(null)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* CARRUSEL VISOR LATERAL DE FOTOS */}
            <div className="flex flex-col gap-3">
              <div className="bg-slate-50 border border-slate-200 h-64 rounded-2xl flex items-center justify-center text-7xl relative overflow-hidden p-4">
                {activeProductView.images[activeImageIdx] && activeProductView.images[activeImageIdx].startsWith('data:image') ? (
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

              {/* Tira de Miniaturas secundarias */}
              {activeProductView.images.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {activeProductView.images.map((imgStr, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setActiveImageIdx(idx)}
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

            {/* SECCIÓN DERECHA: SELECCIÓN DE OPCIONES Y AGREGADO */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Artículo de Catálogo</span>
                  <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight mt-1.5 leading-tight">{activeProductView.prod.nombre}</h2>
                  <p className="text-slate-400 font-semibold text-[11px] mt-0.5">Modelo/Línea: {activeProductView.attrs.model || 'Línea de Fábrica'}</p>
                </div>

                <div className="text-xl font-black text-slate-900 bg-slate-50 p-3 border border-slate-200 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Precio de Lista:</span>
                  <span>${Number(activeProductView.prod.precio).toLocaleString('es-AR')}</span>
                </div>

                {/* Filtro interactivo de talles */}
                {activeProductView.attrs.sizes.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Seleccionar Rodado / Talle:</label>
                    <div className="flex flex-wrap gap-1">
                      {activeProductView.attrs.sizes.map((s) => (
                        <button
                          key={s} type="button"
                          onClick={() => setChosenSize(s)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            chosenSize === s ? 'bg-slate-900 border-slate-900 text-white shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filtro interactivo de colores */}
                {activeProductView.attrs.colors.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Seleccionar Color:</label>
                    <div className="flex flex-wrap gap-1">
                      {activeProductView.attrs.colors.map((c) => (
                        <button
                          key={c} type="button"
                          onClick={() => setChosenColor(c)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            chosenColor === c ? 'bg-blue-600 border-blue-600 text-white shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">Especificaciones del Artículo:</span>
                  <p className="text-slate-500 font-medium text-xs bg-slate-50 p-2.5 border border-slate-200 rounded-xl leading-relaxed">
                    {activeProductView.attrs.details || 'Componentes de alta gama homologados para ciclismo.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Disponibilidad de Salón</span>
                  <span className="text-xs font-bold text-slate-700">
                    {activeProductView.prod.stock > 0 ? `📦 ${activeProductView.prod.stock} un. en stock` : '⚠️ Sin Stock'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={activeProductView.prod.stock <= 0}
                  onClick={() => {
                    handleTriggerAddToCart(
                      activeProductView.prod, 
                      chosenColor, 
                      chosenSize, 
                      activeProductView.images[activeImageIdx]
                    );
                    setActiveProductView(null); // Cierra automáticamente al añadir
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" /> Agregar al Carrito
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Products;