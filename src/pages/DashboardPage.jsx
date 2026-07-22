import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Battery, AlertCircle, CheckCircle, Zap, Truck, Calendar, AlertTriangle, ChevronRight } from 'lucide-react'
import { batteryQueries, poolQueries, stoppageQueries } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/Error'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [batteries, setBatteries] = useState([])
  const [pools, setPools] = useState([])
  const [stoppages, setStoppages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cyclesData, setCyclesData] = useState([])
  const [capacityData, setCapacityData] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener datos
      const [batteriesRes, poolsRes, stoppagesRes] = await Promise.all([
        batteryQueries.getAll(),
        poolQueries.getAll(),
        stoppageQueries.getAll(),
      ])

      if (batteriesRes.error) throw batteriesRes.error
      if (poolsRes.error) throw poolsRes.error
      if (stoppagesRes.error) throw stoppagesRes.error

      setBatteries(batteriesRes.data || [])
      setPools(poolsRes.data || [])
      setStoppages(stoppagesRes.data || [])

      // Procesar datos para gráficos
      if (batteriesRes.data) {
        procesarDatosGraficos(batteriesRes.data)
      }
    } catch (err) {
      setError(err.message || 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  const procesarDatosGraficos = async (bats) => {
    try {
      // Calcular ciclos y capacidad residual para cada batería
      const cyclesPromises = bats.map(bat =>
        batteryQueries.calculateCycles(bat.id).then(res => ({
          name: bat.codigo_unico,
          ciclos: res.data || 0,
        }))
      )

      const capacityPromises = bats.map(bat =>
        batteryQueries.calculateResidualCapacity(bat.id).then(res => ({
          name: bat.codigo_unico,
          capacidad: Math.round(res.data || 0),
        }))
      )

      const cyclesResults = await Promise.all(cyclesPromises)
      const capacityResults = await Promise.all(capacityPromises)

      setCyclesData(cyclesResults)
      setCapacityData(capacityResults)
    } catch (err) {
      console.error('Error procesando datos gráficos:', err)
    }
  }

  if (loading) {
    return <Loading message="Cargando dashboard..." />
  }

  const activeBatteries = batteries.filter(b => b.estado === 'ACTIVA').length
  const lowBatteries = batteries.filter(b => b.estado === 'BAJA').length

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Battery className="h-8 w-8 text-primary-600" />
            Dashboard de Gestión
          </h1>
          <p className="text-slate-600 mt-2">
            Monitoreo de baterías fotovoltaicas en piscinas de acuacultura
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </div>
        )}

        {/* Módulos de Acceso Rápido */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Módulos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Módulo Baterías */}
            <button
              onClick={() => navigate('/batteries')}
              className="card hover:shadow-lg transition cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-6 w-6 text-primary-600" />
                    <h3 className="font-semibold text-slate-900">Baterías</h3>
                  </div>
                  <p className="text-sm text-slate-600">Gestión y monitoreo</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary-600 transition" />
              </div>
            </button>

            {/* Módulo Proveedores */}
            <button
              onClick={() => navigate('/providers')}
              className="card hover:shadow-lg transition cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-6 w-6 text-primary-600" />
                    <h3 className="font-semibold text-slate-900">Proveedores</h3>
                  </div>
                  <p className="text-sm text-slate-600">Gestión de suministros</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary-600 transition" />
              </div>
            </button>

            {/* Módulo Cronograma */}
            <button
              onClick={() => navigate('/cronograma')}
              className="card hover:shadow-lg transition cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-6 w-6 text-primary-600" />
                    <h3 className="font-semibold text-slate-900">Cronograma</h3>
                  </div>
                  <p className="text-sm text-slate-600">Personal y horarios</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary-600 transition" />
              </div>
            </button>

            {/* Módulo Paros */}
            <button
              onClick={() => navigate('/stoppages')}
              className="card hover:shadow-lg transition cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-6 w-6 text-primary-600" />
                    <h3 className="font-semibold text-slate-900">Paros</h3>
                  </div>
                  <p className="text-sm text-slate-600">Registro de paradas</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary-600 transition" />
              </div>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Baterías</p>
                <p className="text-3xl font-bold text-slate-900">{batteries.length}</p>
              </div>
              <Battery className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Baterías Activas</p>
                <p className="text-3xl font-bold text-success-600">{activeBatteries}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Baterías Dadas de Baja</p>
                <p className="text-3xl font-bold text-danger-600">{lowBatteries}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-danger-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Piscinas</p>
                <p className="text-3xl font-bold text-primary-600">{pools.length}</p>
              </div>
              <Battery className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Ciclos por Batería */}
          <div className="card">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Ciclos de Carga/Descarga</h3>
            {cyclesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cyclesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ciclos" fill="#0284c7" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-center py-8">Sin datos disponibles</p>
            )}
          </div>

          {/* Capacidad Residual */}
          <div className="card">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Capacidad Residual (%)</h3>
            {capacityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={capacityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="capacidad" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-center py-8">Sin datos disponibles</p>
            )}
          </div>
        </div>

        {/* Estado de Baterías */}
        <div className="card">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Estado General</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {batteries.slice(0, 4).map(battery => (
              <div key={battery.id} className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-600 truncate">
                  {battery.codigo_unico}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {battery.piscinas.nombre}
                </p>
                <div className="mt-2">
                  <span className={`badge ${battery.estado === 'ACTIVA' ? 'badge-success' : 'badge-danger'}`}>
                    {battery.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
