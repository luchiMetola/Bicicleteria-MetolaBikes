import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus, Edit, Copy, Trash2, CheckCircle, Upload } from 'lucide-react';

function POSInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ text: '', type: '' });

  // Form states in English
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [model, setModelo] = useState('');
  const [size, setRodado] = useState('');
  const [colors, setColores] = useState('');
  const [features, setDescripcion] = useState('');
  const [price, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setIdCategory] = useState('1');
  
  // Media states for REAL image file uploads (Base64 strings)
  const [previewImage, setPreviewImage] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/productos');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching inventory array:', error);
      }
    };
    loadInventoryData();
  }, []);

  const fetchProductsAfterAction = async () => {
    try {
      const response = await axios.get('http://localhost:5000/productos');
      setProducts(response.data);
    } catch (error) {
      console.error('Error updating state grid:', error);
    }
  };

  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotification({ text: 'Por favor, arrastrá únicamente archivos de imagen (PNG, JPG, JPEG).', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processImageFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    processImageFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formattedDescription = `Modelo: ${model} | Rodado/Talle: ${size} | Colores: ${colors} | Detalles: ${features}`;

    const payload = {
      nombre: name,
      descripcion: formattedDescription,
      precio: Number(price),
      stock: Number(stock),
      imagen: previewImage || '🚲',
      id_categoria: Number(categoryId)
    };

    try {
      const token = localStorage.getItem('token');
      if (editingId) {
        const res = await axios.put(`http://localhost:5000/api/productos/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotification({ text: res.data.message, type: 'success' });
      } else {
        const res = await axios.post('http://localhost:5000/api/productos', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotification({ text: res.data.message, type: 'success' });
      }

      handleClearForm();
      fetchProductsAfterAction();
    } catch (error) {
      console.error('Submit execution failed:', error);
      setNotification({ text: 'Error al procesar la operación en el inventario.', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setNotification({ text: '', type: '' }), 4000);
    }
  };

  const handleDuplicate = (product) => {
    setEditingId(null);
    setName(`${product.nombre} (Copia)`);
    setPrecio(product.precio);
    setStock(product.stock);
    setIdCategory(product.id_categoria || '1');
    setPreviewImage(product.imagen || '');
    
    setModelo('');
    setRodado('');
    setColores('');
    setDescripcion('');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setName(product.nombre);
    setPrecio(product.precio);
    setStock(product.stock);
    setIdCategory(product.id_categoria || '1');
    setPreviewImage(product.imagen || '');
    setDescripcion(product.descripcion || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas dar de baja este producto del catálogo?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`http://localhost:5000/api/productos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotification({ text: res.data.message, type: 'success' });
      fetchProductsAfterAction();
    } catch (error) {
      console.error('Delete execution failed:', error);
      setNotification({ text: 'No se pudo eliminar el producto.', type: 'error' });
    }
    setTimeout(() => setNotification({ text: '', type: '' }), 4000);
  };

  const handleClearForm = () => {
    setEditingId(null);
    setName('');
    setModelo('');
    setRodado('');
    setColores('');
    setDescripcion('');
    setStock('');
    setPrecio('');
    setPreviewImage('');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 pl-24 md:pl-72 w-full transition-all">
      <header className="border-b border-slate-200 pb-4 mb-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" /> Control de Inventario & Stock
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">Administración unificada del catálogo digital de salón y e-commerce.</p>
      </header>

      {notification.text && (
        <div className={`mb-4 p-3 border rounded-xl text-xs font-bold flex items-center gap-2 ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <CheckCircle className="w-4 h-4" /> {notification.text}
        </div>
      )}

      {/* Formulario de Registro */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs mb-8">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
          {editingId ? `Modificando Producto ID: #${editingId}` : 'Registrar Nuevo Producto'}
        </h3>
        
        {/* CORRECTED: Removed the early self-closing slash from the form tag */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium text-slate-600">
          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">Nombre del Producto:</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Bicicleta Mountain Bike Venzo" className="w-full p-2.5 border border-slate-300 rounded-xl" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">Modelo / Año:</label>
            <input type="text" value={model} onChange={(e) => setModelo(e.target.value)} required={!editingId} disabled={!!editingId} placeholder={editingId ? "Ver detalles abajo" : "Ej: Talon 2026"} className="w-full p-2.5 border border-slate-300 rounded-xl disabled:bg-slate-50" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">Talle / Rodado:</label>
            <input type="text" value={size} onChange={(e) => setRodado(e.target.value)} required={!editingId} disabled={!!editingId} placeholder={editingId ? "Ver detalles abajo" : "Ej: Rodado 29 - Talle L"} className="w-full p-2.5 border border-slate-300 rounded-xl disabled:bg-slate-50" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold uppercase mb-1">Descripción / Componentes:</label>
            <input type="text" value={features} onChange={(e) => setDescripcion(e.target.value)} placeholder="Frenos hidráulicos, cambios shimano, suspensión, etc." className="w-full p-2.5 border border-slate-300 rounded-xl" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">Opciones de Colores (Separados por coma):</label>
            <input type="text" value={colors} onChange={(e) => setColores(e.target.value)} required={!editingId} disabled={!!editingId} placeholder={editingId ? "Ver detalles abajo" : "Negro, Azul, Rojo"} className="w-full p-2.5 border border-slate-300 rounded-xl disabled:bg-slate-50" />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">Precio Unitario ($):</label>
            <input type="number" value={price} onChange={(e) => setPrecio(e.target.value)} required placeholder="Monto base de venta" className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-800" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">Cantidad Inicial en Stock:</label>
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required placeholder="Unidades disponibles" className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-800" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">Categoría del Producto:</label>
            <select value={categoryId} onChange={(e) => setIdCategory(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold">
              <option value="1">Bicicletas</option>
              <option value="2">Accesorios</option>
              <option value="3">Indumentaria</option>
              <option value="4">Suplementos</option>
            </select>
          </div>

          {/* REAL DRAG AND DROP MULTIMEDIA BOX - CORRECTED TAG BALANCING */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold uppercase mb-1">Imágenes del Producto (Variantes):</label>
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer ${
                dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {previewImage && previewImage.startsWith('data:image') ? (
                <img src={previewImage} alt="Preview" className="h-20 w-20 object-contain rounded-xl border border-slate-200 bg-white" />
              ) : (
                <Upload className="w-6 h-6 text-slate-400" />
              )}
              <p className="text-slate-600 font-semibold">Arrastrá una imagen real aquí o hacé clic para buscar</p>
              <p className="text-[10px] text-slate-400">Admite archivos PNG, JPG o JPEG.</p>
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end gap-2 pt-2">
            {editingId && (
              <button type="button" onClick={handleClearForm} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer">
                Cancelar Edición
              </button>
            )}
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1">
              <Plus className="w-4 h-4" /> {editingId ? 'Guardar Cambios' : 'Registrar en Catálogo'}
            </button>
          </div>
        </form>
      </div>

      {/* TABLA DE CONTROL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs overflow-x-auto">
        <h3 className="text-sm font-bold text-slate-800 mb-4">
          Lista de Control General de Stock ({products.length} ítems)
        </h3>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold tracking-wider">
              <th className="py-3 pl-2">ID</th>
              <th className="py-3">Visual</th>
              <th className="py-3">Producto</th>
              <th className="py-3">Ficha Técnica / Descripción Completa</th>
              <th className="py-3">Stock</th>
              <th className="py-3">Precio</th>
              <th className="py-3 text-right pr-2">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
            {products.map((prod) => (
              <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 pl-2 text-slate-400">#{prod.id}</td>
                <td className="py-3 text-xl">
                  {prod.imagen && prod.imagen.startsWith('data:image') ? (
                    <img src={prod.imagen} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                  ) : (
                    prod.imagen || '🚲'
                  )}
                </td>
                <td className="py-3 font-bold text-slate-800">{prod.nombre}</td>
                <td className="py-3 text-slate-500 max-w-xs truncate" title={prod.descripcion}>{prod.descripcion || 'Sin descripción'}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    prod.stock <= 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {prod.stock} un.
                  </span>
                </td>
                <td className="py-3 text-slate-900 font-black">${Number(prod.precio).toLocaleString('es-AR')}</td>
                <td className="py-3 text-right pr-2 space-x-1">
                  <button onClick={() => handleEdit(prod)} title="Editar" className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 cursor-pointer inline-flex items-center"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDuplicate(prod)} title="Duplicar (Clonar)" className="p-1.5 hover:bg-slate-100 rounded-lg text-amber-600 cursor-pointer inline-flex items-center"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(prod.id)} title="Dar de baja" className="p-1.5 hover:bg-slate-100 rounded-lg text-rose-600 cursor-pointer inline-flex items-center"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default POSInventory;