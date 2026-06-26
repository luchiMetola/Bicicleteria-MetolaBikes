import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { ShoppingCart, CheckCircle, Truck,  Layers, X, ArrowRight } from 'lucide-react';

function Products({ userName, addToCart, globalCP, setGlobalCP }) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Bicicletas');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shippingResult, setShippingResult] = useState('');
  const [colorSelected, setColorSelected] = useState('');

  const [allProducts] = useState([
    { id: 1, nombre: 'Mountain Bike R29', descripcion: 'Bicicleta todo terreno con cuadro de aluminio, suspensión delantera y 21 velocidades Shimano. Ideal para senderos y asfalto.', precio: 450000.00, stock: 10, imagen: '🚵‍♂️', id_categoria: 1, colores: ['Negro/Azul', 'Rojo/Negro', 'Gris'] },
    { id: 2, nombre: 'Bicicleta de Ruta Carbono', descripcion: 'Diseño aerodinámico ultra liviano con cuadro de fibra de carbono para alta velocidad en asfalto de nivel competitivo.', precio: 680000.00, stock: 5, imagen: '🚴‍♀️', id_categoria: 1, colores: ['Blanco', 'Negro Mate'] },
    { id: 8, nombre: 'Manubrio MTB Carbono', descripcion: 'Manubrio de alta resistencia y absorción de impactos, ideal para descenso y competencias exigentes.', precio: 45000.00, stock: 8, imagen: '🚲', id_categoria: 3 },
    { id: 9, nombre: 'Cadena Shimano 11v', descripcion: 'Cadena reforzada con tecnología SIL-TEC para cambios sumamente suaves y una durabilidad extrema en transmisiones.', precio: 22000.00, stock: 15, imagen: '🔗', id_categoria: 3 },
    { id: 6, nombre: 'Proteína Whey Gold 1kg', descripcion: 'Suplemento proteico premium ideal para la recuperación muscular óptima post-entrenamiento de alta intensidad.', precio: 32000.00, stock: 20, imagen: '🥛', id_categoria: 2 },
    { id: 7, nombre: 'Gel Energético Pack x4', descripcion: 'Geles de rápida absorción con carbohidratos complejos y electrolitos para mantener la energía en rutas largas.', precio: 8500.00, stock: 50, imagen: '⚡', id_categoria: 2 },
    { id: 3, nombre: 'Casco Pro Seguridad', descripcion: 'Protección de alta densidad con sistema de ventilación optimizada y ajuste micrométrico trasero.', precio: 35000.00, stock: 15, imagen: '🪖', id_categoria: 4, colores: ['Negro', 'Amarillo Flúor'] },
    { id: 10, nombre: 'Jersey Ciclismo Metola', descripcion: 'Remera técnica transpirable con bolsillos traseros ergonómicos y bandas reflectivas de alta visibilidad.', precio: 28000.00, stock: 12, imagen: '👕', id_categoria: 4, colores: ['Azul', 'Verde'] },
    { id: 11, nombre: 'Guantes Gel Antishock', descripcion: 'Guantes cortos con almohadillas protectoras de gel en las palmas para evitar adormecimiento en rodajes prolongados.', precio: 14000.00, stock: 22, imagen: '🧤', id_categoria: 4, colores: ['Negro', 'Rojo'] }
  ]);

  const categoryMap = { 'Bicicletas': 1, 'Suplementación': 2, 'Accesorios': 3, 'Indumentaria': 4 };

  // MODIFICACIÓN DE FILTRADO: Lógica de búsqueda global absoluta
  const filteredProducts = allProducts.filter((p) => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Si el usuario está escribiendo en el buscador, buscamos en TODO el catálogo ignorando las pestañas
    if (searchTerm.trim() !== '') {
      return coincideBusqueda;
    }
    
    // Si el buscador está vacío, filtramos tradicionalmente por la pestaña de la categoría activa
    return p.id_categoria === categoryMap[activeCategory];
  });

  const handleAddGeneral = (producto) => {
    // Si se agrega desde afuera por defecto va con color "Único" o el primero si tiene
    const col = producto.colores ? producto.colores[0] : 'Único';
    addToCart(producto, col);
    setSuccessMessage(`¡"${producto.nombre}" agregado al carrito!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddFromModal = () => {
    addToCart(selectedProduct, colorSelected || 'Único');
    setSuccessMessage(`¡"${selectedProduct.nombre}" (${colorSelected || 'Único'}) agregado al carrito!`);
    setSelectedProduct(null);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleBuyNow = () => {
    addToCart(selectedProduct, colorSelected || 'Único');
    setSelectedProduct(null);
    navigate('/cart');
  };

  const calculateShipping = (e) => {
    e.preventDefault();
    if (!globalCP) return;
    if (globalCP.startsWith('54')) {
      setShippingResult('Local: Envío a domicilio por $2.500 (¡Gratis si superás los $50.000!)');
    } else {
      setShippingResult('Nacional: Envío a domicilio por $6.800 (Llega en 3 a 5 días hábiles)');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 pl-24 md:pl-72 w-full transition-all">
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} userName={userName} />

      {successMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold text-sm animate-bounce">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {['Bicicletas', 'Accesorios', 'Suplementación', 'Indumentaria'].map((category) => (
          <button
            key={category}
            onClick={() => { setActiveCategory(category); setSearchTerm(''); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeCategory === category ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
          >
            {category}
          </button>
        ))}
      </div>

      <main className="mt-8 w-full">
        <h2 className="text-lg font-bold text-slate-700 mb-6">Sección activa: <span className="text-blue-600">{activeCategory}</span></h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
          {filteredProducts.map((producto) => (
            <div 
              key={producto.id}
              onClick={() => {
                setSelectedProduct(producto);
                setShippingResult(globalCP ? (globalCP.startsWith('54') ? 'Local: Envío a domicilio por $2.500 (¡Gratis si superás los $50.000!)' : 'Nacional: Envío a domicilio por $6.800 (Llega en 3 a 5 días hábiles)') : '');
                setColorSelected(producto.colores ? producto.colores[0] : 'Único');
              }}
              className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <span className="text-5xl block my-2 group-hover:scale-110 transition-transform">{producto.imagen}</span>
                <h3 className="text-lg font-bold text-slate-800 mt-3 group-hover:text-blue-600 transition-colors">{producto.nombre}</h3>
                <p className="text-slate-400 text-xs mt-1">Stock disponible: {producto.stock} u.</p>
              </div>
              <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                <p className="text-emerald-600 font-black text-2xl">${Number(producto.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                <button 
                  onClick={() => handleAddGeneral(producto)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Agregar al carrito
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* --- MODAL DETALLE --- */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 relative p-6 md:p-8 flex flex-col md:flex-row gap-8">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors cursor-pointer"><X className="w-5 h-5" /></button>

            <div className="flex flex-col items-center justify-center bg-slate-50 p-6 rounded-2xl md:w-1/2 border border-slate-100">
              <span className="text-8xl md:text-9xl my-4 select-none">{selectedProduct.imagen}</span>
            </div>

            <div className="flex flex-col justify-between md:w-1/2 space-y-5">
              <div>
                <h3 className="text-2xl font-black text-slate-800 leading-tight">{selectedProduct.nombre}</h3>
                <span className="inline-block mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">Stock disponible: {selectedProduct.stock} u.</span>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed">{selectedProduct.descripcion}</p>
                <p className="text-3xl font-black text-slate-900 mt-4">${Number(selectedProduct.precio).toLocaleString('es-AR')}</p>
              </div>

              {selectedProduct.colores && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Color:</label>
                  <div className="flex gap-2">
                    {selectedProduct.colores.map((color) => (
                      <button key={color} onClick={() => setColorSelected(color)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${colorSelected === color ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}>{color}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-2"><span className="flex items-center gap-1 font-medium text-slate-600"><Truck className="w-3.5 h-3.5 text-blue-500" /> Envío a domicilio</span></div>
                <div className="flex items-center justify-between text-xs text-slate-500"><span className="flex items-center gap-1 font-medium text-emerald-600"><CheckCircle className="w-3.5 h-3.5" /> Retiro por sucursal</span><span className="font-black text-emerald-600 uppercase text-xs bg-emerald-50 px-2 py-0.5 rounded">¡Gratis!</span></div>

                <form onSubmit={calculateShipping} className="flex gap-2 mt-2 pt-2 border-t border-slate-200">
                  <input
                    type="text" maxLength="4" placeholder="Código Postal (Ej: 5400)"
                    value={globalCP}
                    onChange={(e) => setGlobalCP(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800"
                  />
                  <button type="submit" className="bg-slate-800 text-white font-bold px-3 py-2 rounded-xl text-xs cursor-pointer">Calcular</button>
                </form>
                {shippingResult && <p className="text-xs font-black text-blue-600 mt-1">{shippingResult}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button onClick={handleBuyNow} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wider">Comprar ya <ArrowRight className="w-4 h-4" /></button>
                <button onClick={handleAddFromModal} className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl cursor-pointer transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"><ShoppingCart className="w-4 h-4" /> Agregar al carrito</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;