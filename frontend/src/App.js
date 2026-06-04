import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/productos')
      .then(res => setProductos(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold text-center">Bicicletería "El Rayo" 🚲</h1>
      </header>

      <main className="container mx-auto p-10">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Nuestro Catálogo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {productos.map(p => (
            <div key={p.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold text-blue-700">{p.nombre}</h3>
              <p className="text-gray-600 mt-2 font-semibold">Precio: ${p.precio}</p>
              <p className="text-sm text-gray-500">Stock disponible: {p.stock}</p>
              <button className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Ver Detalles
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;