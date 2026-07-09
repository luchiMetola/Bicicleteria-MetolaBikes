import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus, Edit, Trash2, CheckCircle, Upload, X } from 'lucide-react';

function POSInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ text: '', type: '' });

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [model, setModelo] = useState('');
  const [size, setRodado] = useState('');
  const [features, setDescripcion] = useState('');
  const [price, setPrecio] = useState('');
  const [categoryId, setIdCategory] = useState('1');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  
  // GESTIÓN DINÁMICA DE VARIANTES
  const [variantsList, setVariantsList] = useState([
    { color: '', size: '', stock: '' }
  ]);

  // SOPORTE PARA MÚLTIPLES IMÁGENES
  const [previewImagesList, setPreviewImagesList] = useState([]); // Visualización previa
  const [imageFiles, setImageFiles] = useState([]); // Archivos físicos reales para Multer
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/productos', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching inventory array:', error);
      }
    };
    loadInventoryData();
  }, []);

  const fetchProductsAfterAction = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/productos', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setProducts(response.data);
    } catch (error) {
      console.error('Error updating state grid:', error);
    }
  };

  const handleAddVariantField = () => {
    setVariantsList([...variantsList, { color: '', size: size || '', stock: '' }]);
  };

  const handleRemoveVariantField = (index) => {
    const updated = variantsList.filter((_, i) => i !== index);
    setVariantsList(updated);
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variantsList];
    updated[index][field] = value;
    setVariantsList(updated);
  };

  // PROCESAMIENTO MULTIMEDIA PARA MÚLTIPLES IMÁGENES
  const processImageFiles = (files) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        setNotification({ text: 'Por favor, selecciona únicamente archivos de imagen.', type: 'error' });
        return false;
      }
      return true;
    });

    // Guardar los archivos físicos reales
    setImageFiles(prev => [...prev, ...newFiles]);

    // Crear vista previa para el usuario
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImagesList(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    processImageFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    processImageFiles(files);
  };

  const handleRemoveImage = (indexToRemove) => {
    setPreviewImagesList(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setImageFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // ENVÍO AL BACKEND USANDO FORMDATA
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const calculatedTotalStock = variantsList.reduce((acc, curr) => acc + Number(curr.stock || 0), 0);
    const uniqueColorsText = [...new Set(variantsList.map(v => v.color).filter(Boolean))].join(', ');
    const uniqueSizesText = size || [...new Set(variantsList.map(v => v.size).filter(Boolean))].join(', ');
    const formattedDescription = `Modelo: ${model} | Rodado/Talle: ${uniqueSizesText} | Colores: ${uniqueColorsText} | Detalles: ${features}`;

    const formData = new FormData();
    formData.append('nombre', name);
    formData.append('descripcion', formattedDescription);
    formData.append('precio', Number(price));
    formData.append('stock', calculatedTotalStock);
    formData.append('id_categoria', Number(categoryId));
    formData.append('variantes', JSON.stringify(variantsList));

    // Adjuntar los archivos físicos reales
    imageFiles.forEach(file => {
      formData.append('imagenes', file);
    });

    // Si editamos y NO subimos fotos nuevas, avisamos que conserve las viejas
    if (editingId && imageFiles.length === 0 && previewImagesList.length > 0) {
      formData.append('imagen_existente', previewImagesList.join('|'));
    }

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      if (editingId) {
        const res = await axios.put(`http://localhost:5000/api/productos/${editingId}`, formData, config);
        setNotification({ text: res.data.message, type: 'success' });
      } else {
        const res = await axios.post('http://localhost:5000/api/productos', formData, config);
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

  const handleEdit = (product) => {
    setEditingId(product.id);
    setName(product.nombre);
    setPrecio(product.precio);
    
    if (product.imagen && product.imagen.includes('|')) {
      setPreviewImagesList(product.imagen.split('|'));
    } else {
      setPreviewImagesList(product.imagen && product.imagen !== '🚲' ? [product.imagen] : []);
    }
    setImageFiles([]); // Limpiar archivos físicos anteriores
    
    setIdCategory(product.id_categoria || '1');

    const attrs = { model: '', details: '' };
    if (product.descripcion) {
      const parts = product.descripcion.split('|');
      parts.forEach(part => {
        if (part.includes('Modelo:')) attrs.model = part.replace('Modelo:', '').trim();
        if (part.includes('Detalles:')) attrs.details = part.replace('Detalles:', '').trim();
      });
    }
    setModelo(attrs.model || 'Único');
    setDescripcion(attrs.details || product.descripcion);

    if (product.variantes && product.variantes.length > 0) {
      const mapeoVariantes = product.variantes.map(v => ({
        color: v.color,
        size: v.rodado_talla,
        stock: v.stock
      }));
      setVariantsList(mapeoVariantes);
    } else {
      setVariantsList([{ color: 'Único', size: 'Único', stock: product.stock }]);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas dar de baja este producto del catálogo?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/productos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotification({ text: 'Producto dado de baja correctamente.', type: 'success' });
      fetchProductsAfterAction();
    } catch (error) {
      console.error('Delete execution failed:', error);
    }
  };

  const handleClearForm = () => {
    setEditingId(null);
    setName('');
    setModelo('');
    setRodado('');
    setDescripcion('');
    setPrecio('');
    setPreviewImagesList([]);
    setImageFiles([]);
    setVariantsList([{ color: '', size: '', stock: '' }]);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 w-full transition-all">
      <header className="border-b border-slate-200 pb-4 mb-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-[#3A53A4]" /> Control de Inventario & Stock
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">Administración unificada de productos dividida por variantes físicas.</p>
      </header>

      {notification.text && (
        <div className={`mb-4 p-3 border rounded-xl text-xs font-bold flex items-center gap-2 ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <CheckCircle className="w-4 h-4" /> {notification.text}
        </div>
      )}

      {/* Formulario de Registro */}
      <div className="bg-slate-800 border-slate-700 rounded-2xl p-6 shadow-xs mb-8">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">
          {editingId ? `Modificando Producto ID: #${editingId}` : 'Registrar Nuevo Producto'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Nombre Base del Producto:</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Bicicleta Venzo Raptor" className="w-full p-2.5 border border-slate-700 rounded-xl bg-slate-900 text-slate-200 font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Modelo / Año:</label>
              <input type="text" value={model} onChange={(e) => setModelo(e.target.value)} required placeholder="Ej: Raptor 2026" className="w-full p-2.5 border border-slate-700 rounded-xl bg-slate-900 text-slate-200 font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Precio Unitario ($):</label>
              <input type="number" value={price} onChange={(e) => setPrecio(e.target.value)} required placeholder="Precio de venta base" className="w-full p-2.5 border border-slate-700 rounded-xl text-slate-200 bg-slate-900" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Descripción / Ficha de Componentes:</label>
              <input type="text" value={features} onChange={(e) => setDescripcion(e.target.value)} placeholder="Frenos hidráulicos, cambios shimano, suspensión, etc." className="w-full p-2.5 border border-slate-700 rounded-xl bg-slate-900 text-slate-200 font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Categoría:</label>
              <select value={categoryId} onChange={(e) => setIdCategory(e.target.value)} className="w-full p-2.5 border border-slate-700 rounded-xl bg-slate-900  text-slate-200">
                <option value="1">Bicicletas</option>
                <option value="2">Accesorios</option>
                <option value="3">Indumentaria</option>
                <option value="4">Suplementos</option>
              </select>
            </div>
          </div>

          {/* SECCIÓN INTERACTIVA: DESGLOSE PRECISO DE STOCK POR VARIANTES */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Desglose Físico de Variantes y Cantidades</h4>
              <button 
                type="button" onClick={handleAddVariantField}
                className="bg-slate-500 text-slate-800 hover:bg-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg font-black tracking-wide uppercase text-[10px] cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Añadir Otra Combinación
              </button>
            </div>

            <div className="space-y-2">
              {variantsList.map((v, idx) => (
                <div key={idx} className="flex gap-2 items-center flex-wrap sm:flex-nowrap bg-slate-800 p-2.5 border border-slate-600 rounded-xl shadow-2xs">
                  <div className="flex-1 min-w [120px]">
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">Color variante:</label>
                    <input type="text" required value={v.color} onChange={(e) => handleVariantChange(idx, 'color', e.target.value)} placeholder="Ej: Negro con Verde" className="w-full p-1.5 border border-slate-500 rounded-lg text-slate-200  bg-slate-900" />
                  </div>
                  <div className="flex-1 min-w [100px]">
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">Rodado / Talle:</label>
                    <input type="text" required value={v.size} onChange={(e) => handleVariantChange(idx, 'size', e.target.value)} placeholder="Ej: Rodado 29" className="w-full p-1.5 border border-slate-500 rounded-lg text-slate-200  bg-slate-900" />
                  </div>
                  <div className="w-24">
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">Stock de este item:</label>
                    <input type="number" required value={v.stock} onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)} placeholder="Cant." className="w-full p-1.5 border border-slate-500 rounded-lg text-slate-200  text-center bg-slate-900" />
                  </div>
                  {variantsList.length > 1 && (
                    <button 
                      type="button" onClick={() => handleRemoveVariantField(idx)}
                      className="mt-4 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* GESTIÓN MULTI-IMAGEN CON AGREGADO DINÁMICO */}
          <div>
            <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">Imágenes Ilustrativas de las Variantes:</label>
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload-input').click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer ${
                dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input id="file-upload-input" type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
              <Upload className="w-5 h-5 text-slate-400" />
              <p className="text-slate-400 font-bold text-[11px]">Arrastrá tus fotos aquí o hacé clic (Podés seleccionar varias a la vez)</p>
            </div>

            {/* GRILLA PREVIEW DE IMÁGENES CARGADAS */}
            {previewImagesList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-slate-100 rounded-2xl border border-slate-200">
                {previewImagesList.map((imgStr, index) => (
                  <div key={index} className="relative group w-16 h-16 bg-white rounded-xl border border-slate-300 overflow-hidden flex items-center justify-center shadow-2xs">
                    <img src={imgStr} alt={`Preview ${index}`} className="w-full h-full object-contain" />
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                      className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-rose-600 text-white p-0.5 rounded-md transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {editingId && (
              <button type="button" onClick={handleClearForm} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer">Cancelar Edición</button>
            )}
            <button type="submit" disabled={loading} className="px-6 py-2 bg-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1 uppercase tracking-wide">
              <Plus className="w-4 h-4" /> {editingId ? 'Guardar Cambios' : 'Registrar en Catálogo'}
            </button>
          </div>
        </form>
      </div>

      {/* TABLA DE CONTROL Y FILTROS */}
      <div className="bg-slate-800 border border-slate-200 rounded-2xl p-5 shadow-xs overflow-x-auto">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
          <h3 className="text-sm font-bold text-slate-200">Lista de Control General de Stock</h3>
          
          <button 
            onClick={() => setMostrarInactivos(!mostrarInactivos)}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              mostrarInactivos ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {mostrarInactivos ? 'Ocultar Inactivos / Borrados' : 'Mostrar Inactivos / Borrados'}
          </button>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold tracking-wider">
              <th className="py-3 pl-2">ID</th>
              <th className="py-3">Visual</th>
              <th className="py-3">Producto</th>
              <th className="py-3">Ficha Técnica Formateada</th>
              <th className="py-3">Stock Acumulado</th>
              <th className="py-3">Estado</th>
              <th className="py-3 text-right pr-2">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
            {products
              .filter(prod => mostrarInactivos ? prod.estado === 'inactivo' : prod.estado !== 'inactivo')
              .map((prod) => {
              const displayImg = prod.imagen && prod.imagen.includes('|') ? prod.imagen.split('|')[0] : prod.imagen;
              return (
                <tr key={prod.id} className={`hover:bg-slate-50/80 transition-colors ${prod.estado === 'inactivo' ? 'opacity-60 bg-slate-100' : ''}`}>
                  <td className="py-3 pl-2 text-slate-400">#{prod.id}</td>
                  <td className="py-3 text-xl">
                    {displayImg && (displayImg.startsWith('data:image') || displayImg.startsWith('http')) ? (
                      <img src={displayImg} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                    ) : (
                      displayImg || '🚲'
                    )}
                  </td>
                  <td className="py-3 font-bold text-slate-800">{prod.nombre}</td>
                  <td className="py-3 text-slate-500 max-w-xs truncate" title={prod.descripcion}>{prod.descripcion || 'Sin descripción'}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${prod.stock <= 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {prod.stock} un.
                    </span>
                  </td>
                  <td className="py-3">
                    {prod.estado === 'inactivo' ? (
                      <span className="px-2 py-0.5 bg-slate-300 text-slate-700 rounded-md text-[9px] uppercase font-black">De Baja</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[9px] uppercase font-black">Activo</span>
                    )}
                  </td>
                  <td className="py-3 text-right pr-2 space-x-1">
                    <button onClick={() => handleEdit(prod)} title="Editar" className="p-1.5 hover:bg-slate-200 rounded-lg text-blue-400 cursor-pointer inline-flex items-center"><Edit className="w-3.5 h-3.5" /></button>
                    {prod.estado !== 'inactivo' && (
                      <button onClick={() => handleDelete(prod.id)} title="Dar de baja" className="p-1.5 hover:bg-slate-100 rounded-lg text-rose-600 cursor-pointer inline-flex items-center"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default POSInventory;