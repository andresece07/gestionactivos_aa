import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, AlertInfo } from 'lucide-react'
import { batteryQueries, commentQueries } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorPage } from '../components/Error'

export default function BatteryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [battery, setBattery] = useState(null)
  const [comments, setComments] = useState([])
  const [cycles, setCycles] = useState(null)
  const [capacity, setCapacity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadBatteryDetail()
  }, [id])

  const loadBatteryDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: batteryData, error: batteryError } = await batteryQueries.getById(id)
      if (batteryError) throw batteryError
      if (!batteryData) throw new Error('Batería no encontrada')

      setBattery(batteryData)

      // Cargar ciclos y capacidad
      const { data: cyclesData } = await batteryQueries.calculateCycles(id)
      const { data: capacityData } = await batteryQueries.calculateResidualCapacity(id)

      setCycles(cyclesData)
      setCapacity(capacityData)

      // Cargar comentarios
      const { data: commentsData, error: commentsError } = await commentQueries.getByBattery(id)
      if (!commentsError) {
        setComments(commentsData || [])
      }
    } catch (err) {
      setError(err.message || 'Error cargando batería')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    try {
      setSubmitting(true)
      const { data, error: commentError } = await commentQueries.create(id, commentText)
      if (commentError) throw commentError

      setComments([data[0], ...comments])
      setCommentText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Loading message="Cargando detalle de batería..." />
  }

  if (error || !battery) {
    return (
      <ErrorPage
        message={error || 'Batería no encontrada'}
        onRetry={() => navigate('/baterias')}
      />
    )
  }

  const residualKwh = battery.capacidad_kwh * (capacity / 100)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <button
          onClick={() => navigate('/baterias')}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Baterías
        </button>

        {/* Battery Info Card */}
        <div className="card mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-slate-600 text-sm font-medium">Código Único</p>
              <p className="text-lg font-bold text-slate-900">{battery.codigo_unico}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium">SKU Dynamics</p>
              <p className="text-lg font-bold text-slate-900">{battery.sku_dynamics}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium">Piscina</p>
              <p className="text-lg font-bold text-slate-900">{battery.piscinas.nombre}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium">Estado</p>
              <span className={`badge ${battery.estado === 'ACTIVA' ? 'badge-success' : 'badge-danger'}`}>
                {battery.estado}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-200 pt-6">
            <div>
              <p className="text-slate-600 text-sm font-medium">Voltaje Nominal</p>
              <p className="text-lg font-bold text-slate-900">{battery.voltaje_nominal}V</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium">Capacidad Total</p>
              <p className="text-lg font-bold text-slate-900">{battery.capacidad_kwh} kWh</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium">Ciclos Totales</p>
              <p className="text-lg font-bold text-slate-900">{cycles ?? '—'}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium">Fecha Instalación</p>
              <p className="text-lg font-bold text-slate-900">
                {new Date(battery.fecha_instalacion).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Capacity Info */}
        <div className="card mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Estado de Capacidad</h3>

          <div className="space-y-4">
            {/* Capacidad Residual */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Capacidad Residual</p>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-primary-600 h-full"
                      style={{ width: `${capacity || 0}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{Math.round(capacity || 0)}%</p>
                  <p className="text-sm text-slate-600">{residualKwh.toFixed(2)} kWh</p>
                </div>
              </div>
            </div>

            {/* Degradación Info */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex gap-3">
              <AlertInfo className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-primary-900">
                <p className="font-medium mb-1">Degradación</p>
                <p>
                  Tasa de degradación: 0.05% por ciclo ({cycles * 0.0005 * 100}.toFixed(2)% acumulado)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comentarios */}
        <div className="card">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Auditoría de Comentarios
          </h3>

          {/* Form Agregar Comentario */}
          <form onSubmit={handleAddComment} className="mb-6 pb-6 border-b border-slate-200">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Agregar comentario sobre el estado de la batería..."
              className="input w-full mb-3"
              rows="3"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="btn-primary"
            >
              {submitting ? 'Guardando...' : 'Guardar Comentario'}
            </button>
          </form>

          {/* Lista de Comentarios */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="bg-slate-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-slate-900">{comment.usuario_id}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(comment.fecha_creacion).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-slate-700">{comment.contenido}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-center py-8">
              No hay comentarios aún. Sé el primero en agregar uno.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
