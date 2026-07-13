import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { ShoppingCart, CheckCircle, AlertCircle, Eye, X, ChevronLeft, ChevronRight, Truck, Percent } from 'lucide-react';

function Products({ userName, addToCart }) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [notification, setNotification] = useState('');

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
    const attributes = { model: '', details: '' };
    if (!rawText) return attributes;

    const parts = rawText.split('|');
    parts.forEach(part => {
      if (part.includes('Modelo:')) attributes.model = part.replace('Modelo:', '').trim();
      if (part.includes('Detalles:')) attributes.details = part.replace('Detalles:', '').trim();
    });

    return attributes;
  };

  const handleTriggerAddToCart = (prod, color, size, imgBase64, stockVarianteExacto, precioFinalConDescuento) => {
    const productWithVariants = {
      ...prod,
      nombre: prod.nombre,
      colorElegido: color,
      rodado: size,
      imagen: imgBase64 || '🚲',
      stock: stockVarianteExacto,
      precio: precioFinalConDescuento
    };

    addToCart(productWithVariants, color);
    setNotification(`¡Añadido al carrito con oferta: ${prod.nombre}!`);
    setTimeout(() => setNotification(''), 3000);
  };

  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || Number(prod.id_categoria) === Number(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const varianteSeleccionada = activeProductView?.prod.variantes?.find(
    (v) => v.color === chosenColor && v.rodado_talla === chosenSize
  );
  const stockRealVariante = varianteSeleccionada ? varianteSeleccionada.stock : 0;

  const vistaTieneDescuento = activeProductView?.prod.descuento > 0;
  const vistaPrecioLista = Number(activeProductView?.prod.precio || 0);
  const vistaPrecioOferta = vistaTieneDescuento 
    ? vistaPrecioLista - (vistaPrecioLista * (activeProductView.prod.descuento / 100)) 
    : vistaPrecioLista;

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
            
            const tieneDescuento = prod.descuento > 0;
            const precioLista = Number(prod.precio);
            const precioOferta = tieneDescuento ? precioLista - (precioLista * (prod.descuento / 100)) : precioLista;

            return (
              <div 
                key={prod.id} 
                onClick={() => {
                  let listImgs = prod.imagen && prod.imagen.includes('|') ? prod.imagen.split('|') : [prod.imagen || '🚲'];
                  
                  // MAGIA NUEVA: Escaneamos directamente las variantes reales de la base de datos
                  const extractColors = [...new Set(prod.variantes?.map(v => v.color))].filter(c => c);
                  const extractSizes = [...new Set(prod.variantes?.map(v => v.rodado_talla))].filter(s => s);
                  
                  const finalColors = extractColors.length > 0 ? extractColors : ['Único'];
                  const finalSizes = extractSizes.length > 0 ? extractSizes : ['Único'];

                  setChosenColor(finalColors[0]);
                  setChosenSize(finalSizes[0]);
                  setActiveImageIdx(0);
                  setActiveProductView({ 
                    prod, 
                    attrs, 
                    images: listImgs,
                    colors: finalColors,
                    sizes: finalSizes
                  });
                }}
                className="bg-white border border-slate-200 rounded-2xl p-3 md:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer relative overflow-hidden"
              >
                {tieneDescuento && (
                  <div className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5 shadow-sm z-10">
                    <Percent className="w-2.5 h-2.5" /> {prod.descuento} de Descuento
                  </div>
                )}

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

                <div className="pt-2 md:pt-4 mt-2 md:mt-4 border-t border-slate-100 flex flex-col justify-end gap-1 min-h-50px">
                  {tieneDescuento ? (
                    <div className="flex flex-col items-end leading-tight">
                      <span className="text-slate-400 text-[10px] line-through font-bold">${precioLista.toLocaleString('es-AR')}</span>
                      <span className="text-base md:text-lg font-black text-rose-600">${precioOferta.toLocaleString('es-AR')}</span>
                    </div>
                  ) : (
                    <span className="text-base md:text-lg font-black text-slate-900 text-right">${precioLista.toLocaleString('es-AR')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL EXTENDIDO CON SOPORTE PARA OFERTAS Y VARIANTES REALES */}
      {activeProductView && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl relative grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setActiveProductView(null)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col gap-3">
              <div className="bg-slate-50 border border-slate-200 h-64 rounded-2xl flex items-center justify-center text-7xl relative overflow-hidden p-4">
                {vistaTieneDescuento && (
                  <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-sm z-10">
                    <Percent className="w-4 h-4" /> {activeProductView.prod.descuento}de Descuento
                  </div>
                )}
                {activeProductView.images[activeImageIdx] && (activeProductView.images[activeImageIdx].startsWith('data:image') || activeProductView.images[activeImageIdx].startsWith('http')) ? (
                  <img src={activeProductView.images[activeImageIdx]} alt="Visor" className="w-full h-full object-contain" />
                ) : (
                  activeProductView.images[0] || '🚲'
                )}

                {activeProductView.images.length > 1 && (
                  <>
                    <button type="button" onClick={() => setActiveImageIdx(prev => (prev === 0 ? activeProductView.images.length - 1 : prev - 1))} className="absolute left-2 bg-white/80 p-1 rounded-lg border border-slate-200 text-slate-700 shadow-2xs cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setActiveImageIdx(prev => (prev === activeProductView.images.length - 1 ? 0 : prev + 1))} className="absolute right-2 bg-white/80 p-1 rounded-lg border border-slate-200 text-slate-700 shadow-2xs cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                  </>
                )}
              </div>

              {activeProductView.images.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {activeProductView.images.map((imgStr, idx) => (
                    <div key={idx} onClick={() => setActiveImageIdx(idx)} className={`w-12 h-12 bg-slate-50 border rounded-xl overflow-hidden cursor-pointer flex items-center justify-center p-1 shadow-2xs transition-all ${activeImageIdx === idx ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}>
                      <img src={imgStr} alt="Mini" className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Artículo de Catálogo</span>
                  <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight mt-1.5 leading-tight">{activeProductView.prod.nombre}</h2>
                  <p className="text-slate-400 font-semibold text-[11px] mt-0.5">Modelo/Línea: {activeProductView.attrs.model || 'Línea de Fábrica'}</p>
                </div>

                <div className={`p-3 border rounded-xl flex justify-between items-center ${vistaTieneDescuento ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-xs font-bold uppercase ${vistaTieneDescuento ? 'text-rose-700' : 'text-slate-500'}`}>Precio Final:</span>
                  <div className="text-right leading-none">
                    {vistaTieneDescuento && <span className="text-[11px] text-slate-400 line-through font-bold mr-2">${vistaPrecioLista.toLocaleString('es-AR')}</span>}
                    <span className={`text-2xl font-black ${vistaTieneDescuento ? 'text-rose-600' : 'text-slate-900'}`}>${vistaPrecioOferta.toLocaleString('es-AR')}</span>
                  </div>
                </div>

                {/* Filtro interactivo de Talles leídos desde BD */}
                {activeProductView.sizes.length > 0 && activeProductView.sizes[0] !== 'Único' && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Seleccionar Rodado / Talle:</label>
                    <div className="flex flex-wrap gap-1">
                      {activeProductView.sizes.map((s) => {
                        const stockTalle = activeProductView.prod.variantes?.filter(v => v.rodado_talla === s && v.color === chosenColor).reduce((acc, curr) => acc + curr.stock, 0) || 0;
                        const sinStock = stockTalle <= 0;
                        return (
                          <button key={s} type="button" disabled={sinStock} onClick={() => setChosenSize(s)} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${sinStock ? 'opacity-40 line-through bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : chosenSize === s ? 'bg-slate-900 border-slate-900 text-white shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer'}`}>
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Filtro interactivo de Colores leídos desde BD */}
                {activeProductView.colors.length > 0 && activeProductView.colors[0] !== 'Único' && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Seleccionar Color:</label>
                    <div className="flex flex-wrap gap-1">
                      {activeProductView.colors.map((c) => {
                        const stockColor = activeProductView.prod.variantes?.filter(v => v.color === c).reduce((acc, curr) => acc + curr.stock, 0) || 0;
                        const sinStock = stockColor <= 0;
                        return (
                          <button key={c} type="button" disabled={sinStock} onClick={() => setChosenColor(c)} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${sinStock ? 'opacity-40 line-through bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : chosenColor === c ? 'bg-blue-600 border-blue-600 text-white shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer'}`}>
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
                    {stockRealVariante > 0 ? `📦 ${stockRealVariante} un. disponibles` : '¡Combinación Sin Stock!'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={stockRealVariante <= 0}
                  onClick={() => {
                    handleTriggerAddToCart(activeProductView.prod, chosenColor, chosenSize, activeProductView.images[activeImageIdx], stockRealVariante, vistaPrecioOferta);
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