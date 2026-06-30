import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { ShoppingCart, CheckCircle, AlertCircle } from 'lucide-react';

function Products({ userName, addToCart }) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All'); // Filter by category
  const [notification, setNotification] = useState('');

  // Local states to handle selected variants per card index
  const [selectedColors, setSelectedColors] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});

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

  // Helper function to extract specific variants from the formatted description string
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
        const rawColors = part.replace('Colores:', '').trim();
        attributes.colors = rawColors.split(',').map(c => c.trim()).filter(Boolean);
        // Fallback split logic
        attributes.colors = part.replace('Colores:', '').split(',').map(c => c.trim()).filter(Boolean);
      }
      if (part.includes('Detalles:')) attributes.details = part.replace('Detalles:', '').trim();
    });

    return attributes;
  };

  const handleColorSelect = (productId, color) => {
    setSelectedColors(prev => ({ ...prev, [productId]: color }));
  };

  const handleSizeSelect = (productId, size) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  };

  const handleTriggerAddToCart = (prod, parsedAttrs) => {
    const chosenColor = selectedColors[prod.id] || (parsedAttrs.colors[0] || 'Único');
    const chosenSize = selectedSizes[prod.id] || (parsedAttrs.sizes[0] || 'Único');

    // Create custom object reflecting the combined variables chosen by buttons
    const productWithVariants = {
      ...prod,
      nombre: `${prod.nombre} (${chosenSize} - ${chosenColor})`
    };

    addToCart(productWithVariants, chosenColor);
    setNotification(`¡Añadido al carrito: ${prod.nombre} en ${chosenColor}!`);
    setTimeout(() => setNotification(''), 3000);
  };

  // Filter products by search and category id (1: Bicicleta, 2: Accesorios, 3: Indumentaria, 4: Suplemento)
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
          <p className="text-slate-500 text-xs mt-0.5">Elegí tu configuración y sumá componentes a tu orden.</p>
        </div>

        {/* CATEGORY BAR FILTER */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
          {filteredProducts.map((prod) => {
            const attrs = parseAttributes(prod.descripcion);
            const currentColor = selectedColors[prod.id] || attrs.colors[0];
            const currentSize = selectedSizes[prod.id] || attrs.sizes[0];

            return (
              <div key={prod.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between group">
                
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-100 h-44 rounded-2xl flex items-center justify-center text-6xl group-hover:scale-102 transition-transform relative overflow-hidden">
                    {prod.imagen || '🚲'}
                    {prod.stock <= 0 && (
                      <span className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center text-xs font-black tracking-wider uppercase text-rose-600">
                        Sin Stock
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base leading-tight tracking-tight">{prod.nombre}</h3>
                      <p className="text-slate-400 text-[11px] font-semibold mt-0.5 italic">{attrs.model} {attrs.details && `• ${attrs.details}`}</p>
                    </div>

                    {/* INTERACTIVE BUTTONS FOR SIZES / RODADOS */}
                    {attrs.sizes.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Elegí Rodado / Talle:</span>
                        <div className="flex flex-wrap gap-1">
                          {attrs.sizes.map((s) => (
                            <button
                              key={s} type="button"
                              onClick={() => handleSizeSelect(prod.id, s)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                currentSize === s ? 'bg-slate-900 border-slate-900 text-white shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* INTERACTIVE BUTTONS FOR COLORS */}
                    {attrs.colors.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Elegí Color Disponible:</span>
                        <div className="flex flex-wrap gap-1">
                          {attrs.colors.map((c) => (
                            <button
                              key={c} type="button"
                              onClick={() => handleColorSelect(prod.id, c)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                currentColor === c ? 'bg-blue-600 border-blue-600 text-white shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Precio de Lista</span>
                    <span className="text-lg font-black text-slate-900">
                      ${Number(prod.precio).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={prod.stock <= 0}
                    onClick={() => handleTriggerAddToCart(prod, attrs)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Añadir al Carrito
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Products;