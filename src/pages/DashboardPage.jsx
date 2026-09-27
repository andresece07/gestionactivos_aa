import { useEffect, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Package, AlertCircle, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import { assetQueries, poolQueries, stoppageQueries, categoryQueries, farmQueries } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/Error'

export default function DashboardPage() {
  const [assets, setAssets] = useState([])
  const [pools, setPools] = useState([])
  const [stoppages, setStoppages] = useState([])
  const [categories, setCategories] = useState([])
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [obsolescenceData, setObsolescenceData] = useState([])
  const [categoryData, setCategoryData] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener datos en paralelo
      const [assetsRes, poolsRes, stoppagesRes, categoriesRes, farmsRes] = await Promise.all([
        assetQueries.getAll(),
        poolQueries.getAll(),
        stoppageQueries.getAll(),
        categoryQueries.getAll(),
        farmQueries.getAll(),
      ])

      if (assetsRes.error) throw assetsRes.error
      if (poolsRes.error) throw poolsRes.error
      if (stoppagesRes.error) throw stoppagesRes.error
      if (categoriesRes.error) throw categoriesRes.error
      if (farmsRes.error) throw farmsRes.error

      setAssets(assetsRes.data || [])
      setPools(poolsRes.data || [])
      setStoppages(stoppagesRes.data || [])
      setCategories(categoriesRes.data || [])
      setFarms(farmsRes.data || [])

      // Procesar datos para gráficos
      if (assetsRes.data) {
        procesarDatosGraficos(assetsRes.data)
      }
    } catch (err) {
      setError(err.message || 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  const procesarDatosGraficos = (acts) => {
    try {
      // Obsolescencia por activo (top 10)
      const sortedByObsolescence = [...acts]
        .filter(a => a.estado === 'ACTIVO' || a.estado === 'EN_MANTENIMIENTO')
        .sort((a, b) => (b.obsolescencia_pct || 0) - (a.obsolescencia_pct || 0))
        .slice(0, 10)

      const obsolescenceResults = sortedByObsolescence.map(asset => ({
        name: asset.codigo_unico,
        obsolescencia: Math.round(asset.obsolescencia_pct || 0),
        producto: asset.productos?.nombre || 'N/A',
        ubicacion: asset.fincas?.nombre || asset.piscinas?.nombre || 'N/A',
      }))

      // Distribución por categoría
      const categoryMap = {}
      acts.forEach(asset => {
        const catName = asset.productos?.categorias_producto?.nombre || 'Sin categoría'
        categoryMap[catName] = (categoryMap[catName] || 0) + 1
      })

      const categoryResults = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

      setObsolescenceData(obsolescenceResults)
      setCategoryData(categoryResults)
    } catch (err) {
      console.error('Error procesando datos gráficos:', err)
    }
  }

  if (loading) {
    return <Loading message="Cargando dashboard..." />
  }

  // KPIs
  const totalAssets = assets.length
  const activeAssets = assets.filter(a => a.estado === 'ACTIVO').length
  const maintenanceAssets = assets.filter(a => a.estado === 'EN_MANTENIMIENTO').length
  const obsoleteAssets = assets.filter(a => a.estado === 'OBSOLETO').length
  const criticalAssets = assets.filter(a => (a.obsolescencia_pct || 0) >= 80 && (a.estado === 'ACTIVO' || a.estado === 'EN_MANTENIMIENTO')).length
  const totalFarms = farms.length

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-8 w-8 text-primary-600" />
            Dashboard de Gestión de Activos
          </h1>
          <p className="text-slate-600 mt-2">
            Monitoreo de obsolescencia y estado de activos en fincas de acuacultura
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Activos</p>
                <p className="text-3xl font-bold text-slate-900">{totalAssets}</p>
              </div>
              <Package className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Activos Operativos</p>
                <p className="text-3xl font-bold text-success-600">{activeAssets}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">En Mantenimiento</p>
                <p className="text-3xl font-bold text-warning-600">{maintenanceAssets}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Obsolescencia Crítica (≥80%)</p>
                <p className="text-3xl font-bold text-danger-600">{criticalAssets}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-danger-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Dados de Baja</p>
                <p className="text-3xl font-bold text-slate-500">{obsoleteAssets}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-slate-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Fincas</p>
                <p className="text-3xl font-bold text-primary-600">{totalFarms}</p>
              </div>
              <Package className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Obsolescencia por Activo (Top 10) */}
          <div className="card">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-danger-600" />
              Top 10 Activos con Mayor Obsolescencia
            </h3>
            {obsolescenceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={obsolescenceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value, name) => [value + '%', name === 'obsolescencia' ? 'Obsolescencia' : name]} />
                  <Legend />
                  <Bar dataKey="obsolescencia" fill="#dc2626" radius={[0, 4, 4, 0]}>
                    <Cell fill="#ef4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-center py-8">Sin datos disponibles</p>
            )}
          </div>

          {/* Distribución por Categoría */}
          <div className="card">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Activos por Categoría</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[
                        '#0284c7', '#22c55e', '#eab308', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
                      ][index % 8]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-center py-8">Sin datos disponibles</p>
            )}
          </div>
        </div>

        {/* Activos Críticos - Tabla */}
        {criticalAssets > 0 && (
          <div className="card mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-danger-600" />
              Activos con Obsolescencia Crítica (≥80%)
            </h3>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="bg-danger-50">
                    <th>Código Único</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Ubicación</th>
                    <th>Estado</th>
                    <th className="text-right">Obsolescencia</th>
                    <th>Vida Útil Restante</th>
                  </tr>
                </thead>
                <tbody>
                  {assets
                    .filter(a => (a.obsolescencia_pct || 0) >= 80 && (a.estado === 'ACTIVO' || a.estado === 'EN_MANTENIMIENTO'))
                    .sort((a, b) => (b.obsolescencia_pct || 0) - (a.obsolescencia_pct || 0))
                    .slice(0, 10)
                    .map(asset => (
                      <tr key={asset.id} className="hover:bg-slate-50">
                        <td className="font-medium text-slate-900">{asset.codigo_unico}</td>
                        <td className="text-slate-600">{asset.productos?.nombre || 'N/A'}</td>
                        <td className="text-slate-600">
                          <span className="badge badge-primary">{asset.productos?.categorias_producto?.nombre || 'N/A'}</span>
                        </td>
                        <td className="text-slate-600">
                          {asset.fincas?.nombre || asset.piscinas?.nombre || '—'}
                          {asset.zonas?.nombre && ` / ${asset.zonas.nombre}`}
                          {asset.tolvas?.nombre && ` / ${asset.tolvas.nombre}`}
                        </td>
                        <td>
                          <span className={`badge ${asset.estado === 'ACTIVO' ? 'badge-success' : asset.estado === 'EN_MANTENIMIENTO' ? 'badge-warning' : 'badge-danger'}`}>
                            {asset.estado}
                          </span>
                        </td>
                        <td className="text-right font-bold text-danger-600">
                          {(asset.obsolescencia_pct || 0).toFixed(1)}%
                        </td>
                        <td className="text-slate-600">
                          {asset.vida_util_restante_anos ? `${asset.vida_util_restante_anos.toFixed(1)} años` : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resumen por Finca */}
        <div className="card">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Resumen por Finca</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {farms.map(farm => {
              const farmAssets = assets.filter(a => a.finca_id === farm.id)
              const farmActive = farmAssets.filter(a => a.estado === 'ACTIVO').length
              const farmCritical = farmAssets.filter(a => (a.obsolescencia_pct || 0) >= 80).length
              return (
                <div key={farm.id} className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-900">{farm.nombre}</p>
                  <p className="text-xs text-slate-500 mt-1">{farm.codigo}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xl font-bold text-slate-900">{farmAssets.length}</p>
                      <p className="text-xs text-slate-500">Total</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-success-600">{farmActive}</p>
                      <p className="text-xs text-slate-500">Activos</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-danger-600">{farmCritical}</p>
                      <p className="text-xs text-slate-500">Críticos</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}