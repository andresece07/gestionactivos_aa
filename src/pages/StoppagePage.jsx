import { useEffect, useState } from 'react'
import { AlertCircle, Plus } from 'lucide-react'
import { stoppageQueries, poolQueries } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/Error'

export default function StoppagePage() {
  const [stoppages, setStoppages] = useState([])
  const [pools, setPools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    piscina_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    motivo: 'MANTENIMIENTO',
    tiempo_espera_dias: '0',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [stoppagesRes, poolsRes] = await Promise.all([
        stoppageQueries.getAll(),
        poolQueries.getAll(),
      ])

      if (stoppagesRes.error) throw stoppagesRes.error
      if (poolsRes.error) throw poolsRes.error

      setStoppages(stoppagesRes.data || [])
      setPools(poolsRes.data || [])
    } catch (err) {
      setError(err.message)
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

    if (!formData.piscina_id || !formData.fecha_inicio || !formData.fecha_fin) {
      setError('Por favor completa todos los campos requeridos')
      return
    }

    if (new Date(formData.fecha_fin) <= new Date(formData.fecha_inicio)) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio')
      return
    }

    try {
      setSubmitting(true)

      // Verificar solapamiento
      const { data: hasOverlap, error: overlapError } = await stoppageQueries.checkOverlap(
        formData.piscina_id,
        formData.fecha_inicio,
        formData.fecha_fin
      )

      if (overlapError) throw overlapError
      if (hasOverlap) {
        setError('El rango de fechas se solapa con un paro existente')
        setSubmitting(false)
        return
      }

      // Crear paro
      const { data: newStoppage, error: createError } = await stoppageQueries.create({
        piscina_id: formData.piscina_id,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        motivo: formData.motivo,
        tiempo_espera_dias: parseInt(formData.tiempo_espera_dias),
      })

      if (createError) throw createError

      // Agregar a la lista
      setStoppages([newStoppage[0], ...stoppages])
      setFormData({
        piscina_id: '',
        fecha_inicio: '',
        fecha_fin: '',
        motivo: 'MANTENIMIENTO',
        tiempo_espera_dias: '0',
      })
      setShowForm(false)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Loading message="Cargando paros..." />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-warning-600" />
              Registro de Paros
            </h1>
            <p className="text-slate-600 mt-2">
              Gestión de interrupciones de operación en piscinas
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Paro
          </button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="card mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Registrar Nuevo Paro</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Piscina */}
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

                {/* Motivo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Motivo *
                  </label>
                  <select
                    name="motivo"
                    value={formData.motivo}
                    onChange={handleInputChange}
                    className="input w-full"
                    disabled={submitting}
                  >
                    <option value="MANTENIMIENTO">Mantenimiento</option>
                    <option value="PESCA">Pesca</option>
                  </select>
                </div>

                {/* Fecha Inicio */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha Inicio *
                  </label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleInputChange}
                    className="input w-full"
                    disabled={submitting}
                  />
                </div>

                {/* Fecha Fin */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha Fin *
                  </label>
                  <input
                    type="date"
                    name="fecha_fin"
                    value={formData.fecha_fin}
                    onChange={handleInputChange}
                    className="input w-full"
                    disabled={submitting}
                  />
                </div>

                {/* Días de Espera */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Días de Espera Adicionales
                  </label>
                  <input
                    type="number"
                    name="tiempo_espera_dias"
                    value={formData.tiempo_espera_dias}
                    onChange={handleInputChange}
                    className="input w-full"
                    min="0"
                    disabled={submitting}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Días adicionales para estabilización post-paro
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Guardando...' : 'Guardar Paro'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Paros */}
        {stoppages.length > 0 ? (
          <div className="card overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th>Piscina</th>
                  <th>Zona</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Duración (días)</th>
                  <th>Motivo</th>
                  <th>Espera (días)</th>
                  <th>Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                {stoppages.map(stoppage => {
                  const duracion = new Date(stoppage.fecha_fin) - new Date(stoppage.fecha_inicio)
                  const dias = Math.floor(duracion / (1000 * 60 * 60 * 24))

                  return (
                    <tr key={stoppage.id}>
                      <td className="font-medium text-slate-900">{stoppage.piscinas.nombre}</td>
                      <td className="text-slate-600 text-sm">{stoppage.piscinas.zona}</td>
                      <td>{new Date(stoppage.fecha_inicio).toLocaleDateString()}</td>
                      <td>{new Date(stoppage.fecha_fin).toLocaleDateString()}</td>
                      <td className="text-center font-medium">{dias}</td>
                      <td>
                        <span className={`badge ${stoppage.motivo === 'MANTENIMIENTO' ? 'badge-warning' : 'badge-primary'}`}>
                          {stoppage.motivo}
                        </span>
                      </td>
                      <td className="text-center">{stoppage.tiempo_espera_dias}</td>
                      <td className="text-slate-600 text-sm">
                        {new Date(stoppage.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-12">
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">No hay paros registrados</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Registrar Primer Paro
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
