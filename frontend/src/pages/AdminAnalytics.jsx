import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { ShoppingBag, CreditCard, DollarSign, Activity, PieChart as PieIcon } from 'lucide-react';

const COLORES_PASTEL = ['#3A53A4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

function AdminAnalytics() {
  const [data, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/admin/estadisticas', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDatos(res.data);
      } catch (error) {
        console.error('Error cargando métricas analíticas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-semibold animate-pulse">
        <Activity className="w-6 h-6 animate-spin mr-2 text-blue-500" /> Computando métricas comerciales...
      </div>
    );
  }

  const totalHistorico = data?.ingresosMensuales.reduce((acc, curr) => acc + curr.Total, 0) || 0;
  const totalWeb = data?.ingresosMensuales.reduce((acc, curr) => acc + curr.Web, 0) || 0;
  const totalMostrador = data?.ingresosMensuales.reduce((acc, curr) => acc + curr.Mostrador, 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8 w-full transition-all">
      <header className="border-b border-slate-200 pb-4 mb-6">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <PieIcon className="w-6 h-6 text-emerald-600" /> Inteligencia de Negocio (BI)
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">Análisis estadístico, flujo de caja y comportamiento de clientes.</p>
      </header>

      {/* TARJETAS KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facturación Anual</span>
            <span className="text-xl font-black text-slate-800 mt-1 block">${totalHistorico.toLocaleString('es-AR')}</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><DollarSign className="w-5 h-5" /></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ingresos Online (Web)</span>
            <span className="text-xl font-black text-slate-800 mt-1 block">${totalWeb.toLocaleString('es-AR')}</span>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><ShoppingBag className="w-5 h-5" /></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ingresos Salón (POS)</span>
            <span className="text-xl font-black text-slate-800 mt-1 block">${totalMostrador.toLocaleString('es-AR')}</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600"><CreditCard className="w-5 h-5" /></div>
        </div>
      </div>

      {/* GRÁFICO PRINCIPAL: FLUJO DE CAJA MENSUAL */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 border-b border-slate-100 pb-2">Evolución de Ingresos y Flujo de Caja por Mes</h3>
          <div className="w-full h-80 text-xs">
            <ResponsiveContainer width="100%" h="100%">
              <AreaChart data={data?.ingresosMensuales} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeb" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3A53A4" stopOpacity={0.3}/><stop offset="95%" stopColor="#3A53A4" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorMostrador" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="mes" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} />
                <Legend />
                <Area type="monotone" dataKey="Web" stroke="#3A53A4" strokeWidth={3} fillOpacity={1} fill="url(#colorWeb)" name="Ventas Online" />
                <Area type="monotone" dataKey="Mostrador" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorMostrador)" name="Ventas Sucursal" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: TOP PRODUCTOS Y MEDIOS DE PAGO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TOP PRODUCTOS MÁS VENDIDOS */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 border-b border-slate-100 pb-2">Ranking: Top 5 Artículos más Vendidos (Unidades)</h3>
          <div className="w-full h-64 text-xs">
            <ResponsiveContainer width="100%" h="100%">
              <BarChart data={data?.topProductos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" tickFormatter={(t) => t.length > 12 ? `${t.substring(0, 12)}...` : t} />
                <YAxis stroke="#64748B" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} />
                <Bar dataKey="cantidad" radius={[8, 8, 0, 0]} name="Unidades Vendidas">
                  {data?.topProductos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES_PASTEL[index % COLORES_PASTEL.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MÉTODOS DE PAGO PREFERIDOS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 border-b border-slate-100 pb-2">Preferencias de Pago</h3>
            <div className="w-full h-48 text-xs flex justify-center items-center">
              <ResponsiveContainer width="100%" h="100%">
                <PieChart>
                  <Pie data={data?.mediosPago} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {data?.mediosPago.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORES_PASTEL[index % COLORES_PASTEL.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            {data?.mediosPago.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORES_PASTEL[idx % COLORES_PASTEL.length] }}></span>
                  <span className="text-slate-500">{item.name}</span>
                </div>
                <span className="font-bold text-slate-700">{item.value} trans.</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminAnalytics;