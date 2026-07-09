import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { ShoppingCart, CheckCircle, AlertCircle, Eye, X, ChevronLeft, ChevronRight, Truck } from 'lucide-react';

function Products({ userName, addToCart }) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
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

  // Recibe el "stockVarianteExacto" calculado para limitar el carrito
  const handleTriggerAddToCart = (prod, color, size, imgBase64, stockVarianteExacto) => {
    const productWithVariants = {
      ...prod,
      nombre: prod.nombre,
      colorElegido: color,
      rodado: size,
      imagen: imgBase64 || '🚲',
      stock: stockVarianteExacto // <-- Pasa el tope matemático exacto al carrito
    };

    addToCart(productWithVariants, color);
    setNotification(`¡Añadido al carrito: ${prod.nombre} (${color} - ${size})!`);
    setTimeout(() => setNotification(''), 3000);
  };

  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || Number(prod.id_categoria) === Number(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Lógica matemática para buscar el stock de la variante que el usuario está tocando
  const varianteSeleccionada = activeProductView?.prod.variantes?.find(
    (v) => v.color === chosenColor && v.rodado_talla === chosenSize
  );
  const stockRealVariante = varianteSeleccionada ? varianteSeleccionada.stock : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 w-full transition-all">
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} userName={userName} />

      <header className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Catálogo Online</h1>
          <p className="text-slate-500 text-xs mt-0.5">Explorá los componentes y armá tu carrito con stock real sincronizado.</p>
        </div>

        <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-2xl border border-slate-300/40 text-xs font-bold text-slate-600">
          <button onClick={() => setSelectedCategory('All')} className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategory === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'hover:bg-white/40'}`}>Todos</button>
          <button onClick={() => setSelectedCategory('1')} className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategory === '1' ? 'bg-white text-blue-600 shadow-xs' : 'hover:bg-white/40'}`}>Bicicletas</button>
          <button onClick={() => setSelectedCategory('2')} className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategory === '2' ? 'bg-white text-blue-600 shadow-xs' : 'hover:bg-white/40'}`}>Accesorios</button>
          <button onClick={() => setSelectedCategory('3')} className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategory === '3' ? 'bg-white text-blue-600 shadow-xs' : 'hover:bg-white/40'}`}>Indumentaria</button>
          <button onClick={() => setSelectedCategory('4')} className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategory === '4' ? 'bg-white text-blue-600 shadow-xs' : 'hover:bg-white/40'}`}>Suplementos</button>
        </div>
      </header>

      {/* BANNER DE INFORMACIÓN DE ENVÍOS */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <Truck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-800">Información sobre Envíos</h4>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            El costo final de envío a tu domicilio se calculará en el carrito de compras. Tené en cuenta que el valor final variará dependiendo de tu método de entrega (Correo Argentino o Envío Particular), tu zona y el medio de pago seleccionado. <strong>¡El retiro en nuestra sucursal siempre es gratuito!</strong>
          </p>
        </div>
      </div>

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
        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full">
          {filteredProducts.map((prod) => {
            const attrs = parseAttributes(prod.descripcion);
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
                    {displayImg && (displayImg.startsWith('data:image') || displayImg.startsWith('http')) ? (
                      <img src={displayImg} alt={prod.nombre} className="w-full h-full object-cover" />
                    ) : (
                      displayImg || '🚲'
                    )}
                    {prod.stock <= 0 && (
                      <span className="absolute inset-0 bg-white/90 backdrop-blur-3xs flex items-center justify-center text-[10px] md:text-xs font-black uppercase text-rose-600 tracking-wider">
                        Sin Stock General
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

      {/* MODAL EXTENDIDO */}
      {activeProductView && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl relative grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setActiveProductView(null)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* CARRUSEL VISOR LATERAL */}
            <div className="flex flex-col gap-3">
              <div className="bg-slate-50 border border-slate-200 h-64 rounded-2xl flex items-center justify-center text-7xl relative overflow-hidden p-4">
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

            {/* SECCIÓN DERECHA DE OPCIONES */}
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

                {/* Filtro interactivo de Talles */}
                {activeProductView.attrs.sizes.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Seleccionar Rodado / Talle:</label>
                    <div className="flex flex-wrap gap-1">
                      {activeProductView.attrs.sizes.map((s) => {
                        // Verificamos si este talle tiene stock en combinación con el color elegido
                        const stockTalle = activeProductView.prod.variantes
                          ?.filter(v => v.rodado_talla === s && v.color === chosenColor)
                          .reduce((acc, curr) => acc + curr.stock, 0) || 0;
                        
                        const sinStock = stockTalle <= 0;

                        return (
                          <button
                            key={s} type="button"
                            disabled={sinStock}
                            onClick={() => setChosenSize(s)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              sinStock ? 'opacity-40 line-through bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' :
                              chosenSize === s ? 'bg-slate-900 border-slate-900 text-white shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Filtro interactivo de Colores con Tachado Dinámico */}
                {activeProductView.attrs.colors.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Seleccionar Color:</label>
                    <div className="flex flex-wrap gap-1">
                      {activeProductView.attrs.colors.map((c) => {
                        // Sumamos el stock de todas las variantes que tengan este color
                        const stockColor = activeProductView.prod.variantes
                          ?.filter(v => v.color === c)
                          .reduce((acc, curr) => acc + curr.stock, 0) || 0;
                        
                        const sinStock = stockColor <= 0;

                        return (
                          <button
                            key={c} type="button"
                            disabled={sinStock}
                            onClick={() => setChosenColor(c)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              sinStock ? 'opacity-40 line-through bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' :
                              chosenColor === c ? 'bg-blue-600 border-blue-600 text-white shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            {c}
                          </button>
                        );
                      })}
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
                  <span className="text-[9px] uppercase font-bold text-slate-400">Disponibilidad Variante</span>
                  <span className={`text-xs font-bold ${stockRealVariante > 0 ? 'text-slate-700' : 'text-rose-600'}`}>
                    {stockRealVariante > 0 ? `📦 ${stockRealVariante} un. disponibles` : '⚠️ Combinación Sin Stock'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={stockRealVariante <= 0}
                  onClick={() => {
                    handleTriggerAddToCart(
                      activeProductView.prod, 
                      chosenColor, 
                      chosenSize, 
                      activeProductView.images[activeImageIdx],
                      stockRealVariante 
                    );
                    setActiveProductView(null);
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors uppercase tracking-wider cursor-pointer"
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