import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { batteryQueries, poolQueries } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/Error'

export default function CreateBatteryPage() {
  const navigate = useNavigate()
  const [pools, setPools] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    sku_dynamics: '',
    codigo_unico: '',
    piscina_id: '',
    fecha_compra: '',
    fecha_instalacion: '',
    voltaje_nominal: '',
    capacidad_kwh: '',
  })

  // Cargar piscinas
  useState(() => {
    loadPools()
  }, [])

  const loadPools = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await poolQueries.getAll()
      if (fetchError) throw fetchError
      setPools(data || [])
    } catch (err) {
      setError(err.message || 'Error cargando piscinas')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.sku_dynamics || !formData.codigo_unico || !formData.piscina_id) {
      setError('Por favor completa todos los campos requeridos')
      return
    }

    if (new Date(formData.fecha_instalacion) < new Date(formData.fecha_compra)) {
      setError('La fecha de instalación debe ser posterior o igual a la fecha de compra')
      return
    }

    try {
      setSubmitting(true)

      const { data: newBattery, error: createError } = await batteryQueries.create({
        sku_dynamics: formData.sku_dynamics,
        codigo_unico: formData.codigo_unico,
        piscina_id: formData.piscina_id,
        fecha_compra: formData.fecha_compra,
        fecha_instalacion: formData.fecha_instalacion,
        voltaje_nominal: parseFloat(formData.voltaje_nominal),
        capacidad_kwh: parseFloat(formData.capacidad_kwh),
        estado: 'ACTIVA',
      })

      if (createError) throw createError

      navigate(`/baterias/${newBattery[0].id}`)
    } catch (err) {
      setError(err.message || 'Error al crear batería')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Loading message="Cargando piscinas..." />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/baterias')}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Baterías
          </button>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Plus className="h-8 w-8 text-primary-600" />
            Nueva Batería
          </h1>
          <p className="text-slate-600 mt-2">
            Registra una nueva batería fotovoltaica en el sistema
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </div>
        )}

        {/* Formulario */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  SKU Dynamics *
                </label>
                <input
                  type="text"
                  name="sku_dynamics"
                  value={formData.sku_dynamics}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="ej: SKU-001"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Código Único *
                </label>
                <input
                  type="text"
                  name="codigo_unico"
                  value={formData.codigo_unico}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="ej: BAT-001-2024"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Row 2 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Piscina *
              </label>
              <select
                name="piscina_id"
                value={formData.piscina_id}
                onChange={handleInputChange}
                className="input w-full"
                disabled={submitting}
              >
                <option value="">Selecciona una piscina</option>
                {pools.map(pool => (
                  <option key={pool.id} value={pool.id}>
                    {pool.nombre} ({pool.zona})
                  </option>
                ))}
              </select>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha de Compra *
                </label>
                <input
                  type="date"
                  name="fecha_compra"
                  value={formData.fecha_compra}
                  onChange={handleInputChange}
                  className="input w-full"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha de Instalación *
                </label>
                <input
                  type="date"
                  name="fecha_instalacion"
                  value={formData.fecha_instalacion}
                  onChange={handleInputChange}
                  className="input w-full"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Voltaje Nominal (V) *
                </label>
                <input
                  type="number"
                  name="voltaje_nominal"
                  value={formData.voltaje_nominal}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="ej: 48"
                  step="0.1"
                  min="0"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Capacidad (kWh) *
                </label>
                <input
                  type="number"
                  name="capacidad_kwh"
                  value={formData.capacidad_kwh}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="ej: 10.5"
                  step="0.1"
                  min="0"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? 'Guardando...' : 'Crear Batería'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/baterias')}
                className="btn-secondary"
                disabled={submitting}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
