import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Battery, Plus, Search, Eye } from 'lucide-react'
import { batteryQueries } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/Error'

export default function BatteriesPage() {
  const [batteries, setBatteries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [cyclesCache, setCyclesCache] = useState({})

  useEffect(() => {
    loadBatteries()
  }, [])

  const loadBatteries = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await batteryQueries.getAll()

      if (fetchError) throw fetchError
      setBatteries(data || [])

      // Precargar ciclos
      if (data) {
        loadCycles(data)
      }
    } catch (err) {
      setError(err.message || 'Error cargando baterías')
    } finally {
      setLoading(false)
    }
  }

  const loadCycles = async (bats) => {
    const cycles = {}
    for (const battery of bats) {
      const { data } = await batteryQueries.calculateCycles(battery.id)
      cycles[battery.id] = data || 0
    }
    setCyclesCache(cycles)
  }

  if (loading) {
    return <Loading message="Cargando baterías..." />
  }

  const filteredBatteries = batteries.filter(battery =>
    battery.codigo_unico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    battery.sku_dynamics.toLowerCase().includes(searchTerm.toLowerCase()) ||
    battery.piscinas.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Battery className="h-8 w-8 text-primary-600" />
              Registro de Baterías
            </h1>
            <p className="text-slate-600 mt-2">
              Gestión centralizada de baterías fotovoltaicas
            </p>
          </div>
          <Link to="/baterias/nueva" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Batería
          </Link>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </div>
        )}

        {/* Buscar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, SKU o piscina..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full pl-10"
            />
          </div>
        </div>

        {/* Tabla */}
        {filteredBatteries.length > 0 ? (
          <div className="card overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th>Código Único</th>
                  <th>SKU Dynamics</th>
                  <th>Lote</th>
                  <th>Piscina</th>
                  <th>Estado</th>
                  <th>Capacidad (kWh)</th>
                  <th>Ciclos</th>
                  <th>Fecha Instalación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatteries.map(battery => (
                  <tr key={battery.id} className="hover:bg-slate-50">
                    <td className="font-medium text-slate-900">{battery.codigo_unico}</td>
                    <td className="text-slate-600 text-sm">{battery.sku_dynamics}</td>
                    <td className="text-slate-600 text-sm">{battery.lote || '—'}</td>
                    <td className="text-slate-600">{battery.piscinas.nombre}</td>
                    <td>
                      <span className={`badge ${battery.estado === 'ACTIVA' ? 'badge-success' : 'badge-danger'}`}>
                        {battery.estado}
                      </span>
                    </td>
                    <td className="text-slate-900">{battery.capacidad_kwh}</td>
                    <td className="text-slate-600">
                      {cyclesCache[battery.id] || '—'}
                    </td>
                    <td className="text-slate-600 text-sm">
                      {new Date(battery.fecha_instalacion).toLocaleDateString()}
                    </td>
                    <td>
                      <Link
                        to={`/baterias/${battery.id}`}
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-12">
            <Battery className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">
              {searchTerm ? 'No se encontraron baterías' : 'No hay baterías registradas'}
            </p>
            <Link to="/baterias/nueva" className="btn-primary inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Crear Primera Batería
            </Link>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
          <p className="text-sm text-primary-900">
            <strong>Nota:</strong> Total de baterías registradas: <strong>{batteries.length}</strong>
            {' '} | Baterías activas: <strong>{batteries.filter(b => b.estado === 'ACTIVA').length}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
