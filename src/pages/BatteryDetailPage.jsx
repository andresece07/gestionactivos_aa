import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Info, History, Plus, QrCode, Edit2, Trash2, Calendar } from 'lucide-react'
import { batteryQueries, commentQueries, movimientosQueries, poolQueries } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorPage } from '../components/Error'
import { ErrorAlert } from '../components/Error'

export default function BatteryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [battery, setBattery] = useState(null)
  const [comments, setComments] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [pools, setPools] = useState([])
  const [cycles, setCycles] = useState(null)
  const [capacity, setCapacity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showMovimientoForm, setShowMovimientoForm] = useState(false)
  const [formData, setFormData] = useState({
    piscina_id: '',
    tolva: '',
    tipo_movimiento: 'TRASLADO',
    ciclos_registrados: '',
    capacidad_residual: '',
    voltaje_inicial: '',
    voltaje_final: '',
    temperatura: '',
    observaciones: '',
    estado_bateria: 'FUNCIONANDO',
    proxima_revision: '',
  })

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
      setFormData(prev => ({ ...prev, piscina_id: batteryData.piscina_id }))

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

      // Cargar movimientos
      const { data: movimientosData, error: movError } = await movimientosQueries.getByBateria(id)
      if (!movError) {
        setMovimientos(movimientosData || [])
      }

      // Cargar piscinas
      const { data: poolsData, error: poolsError } = await poolQueries.getAll()
      if (!poolsError) {
        setPools(poolsData || [])
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

  const handleAddMovimiento = async (e) => {
    e.preventDefault()
    if (!formData.tolva || !formData.piscina_id) {
      setError('Tolva y Piscina son obligatorios')
      return
    }

    try {
      setSubmitting(true)
      const { data, error: movError } = await movimientosQueries.create({
        bateria_id: id,
        piscina_id: formData.piscina_id,
        tolva: formData.tolva,
        tipo_movimiento: formData.tipo_movimiento,
        ciclos_registrados: formData.ciclos_registrados ? parseInt(formData.ciclos_registrados) : null,
        capacidad_residual: formData.capacidad_residual ? parseFloat(formData.capacidad_residual) : null,
        voltaje_inicial: formData.voltaje_inicial ? parseFloat(formData.voltaje_inicial) : null,
        voltaje_final: formData.voltaje_final ? parseFloat(formData.voltaje_final) : null,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : null,
        observaciones: formData.observaciones || null,
        estado_bateria: formData.estado_bateria,
        proxima_revision: formData.proxima_revision || null,
        fecha_movimiento: new Date().toISOString(),
      })

      if (movError) throw movError

      setMovimientos([data[0], ...movimientos])
      setFormData({
        piscina_id: battery.piscina_id,
        tolva: '',
        tipo_movimiento: 'TRASLADO',
        ciclos_registrados: '',
        capacidad_residual: '',
        voltaje_inicial: '',
        voltaje_final: '',
        temperatura: '',
        observaciones: '',
        estado_bateria: 'FUNCIONANDO',
        proxima_revision: '',
      })
      setShowMovimientoForm(false)
    } catch (err) {
      setError(err.message || 'Error al guardar movimiento')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMovimiento = async (movId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este movimiento?')) return

    try {
      const { error } = await movimientosQueries.delete(movId)
      if (error) throw error

      setMovimientos(movimientos.filter(m => m.id !== movId))
    } catch (err) {
      setError(err.message || 'Error al eliminar movimiento')
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
              <Info className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-primary-900">
                <p className="font-medium mb-1">Degradación</p>
                <p>
                  Tasa de degradación: 0.05% por ciclo ({cycles * 0.0005 * 100}.toFixed(2)% acumulado)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Historial de Movimientos */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Movimientos
            </h3>
            <button
              onClick={() => setShowMovimientoForm(!showMovimientoForm)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Agregar Movimiento
            </button>
          </div>

          {error && (
            <div className="mb-4">
              <ErrorAlert message={error} onClose={() => setError(null)} />
            </div>
          )}

          {/* Formulario Agregar Movimiento */}
          {showMovimientoForm && (
            <form onSubmit={handleAddMovimiento} className="mb-6 pb-6 border-b border-slate-200 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Piscina *</label>
                  <select
                    value={formData.piscina_id}
                    onChange={(e) => setFormData({ ...formData, piscina_id: e.target.value })}
                    className="input w-full"
                    required
                  >
                    <option value="">Seleccionar piscina...</option>
                    {pools.map(pool => (
                      <option key={pool.id} value={pool.id}>{pool.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tolva *</label>
                  <input
                    type="text"
                    value={formData.tolva}
                    onChange={(e) => setFormData({ ...formData, tolva: e.target.value })}
                    placeholder="Ej: Tolva A-1"
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Movimiento</label>
                  <select
                    value={formData.tipo_movimiento}
                    onChange={(e) => setFormData({ ...formData, tipo_movimiento: e.target.value })}
                    className="input w-full"
                  >
                    <option>INSTALACION</option>
                    <option>TRASLADO</option>
                    <option>MANTENIMIENTO</option>
                    <option>REPARACION</option>
                    <option>INSPECCION</option>
                    <option>CAMBIO_TOLVA</option>
                    <option>RECARGA</option>
                    <option>DESCARGA</option>
                    <option>OTRO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado Batería</label>
                  <select
                    value={formData.estado_bateria}
                    onChange={(e) => setFormData({ ...formData, estado_bateria: e.target.value })}
                    className="input w-full"
                  >
                    <option>FUNCIONANDO</option>
                    <option>CON_FALLA</option>
                    <option>REQUIERE_MANTENIMIENTO</option>
                    <option>FUERA_SERVICIO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input
                  type="number"
                  placeholder="Ciclos"
                  value={formData.ciclos_registrados}
                  onChange={(e) => setFormData({ ...formData, ciclos_registrados: e.target.value })}
                  className="input w-full text-sm"
                />
                <input
                  type="number"
                  placeholder="Capacidad %"
                  step="0.01"
                  value={formData.capacidad_residual}
                  onChange={(e) => setFormData({ ...formData, capacidad_residual: e.target.value })}
                  className="input w-full text-sm"
                />
                <input
                  type="number"
                  placeholder="Voltaje Inicial"
                  step="0.1"
                  value={formData.voltaje_inicial}
                  onChange={(e) => setFormData({ ...formData, voltaje_inicial: e.target.value })}
                  className="input w-full text-sm"
                />
                <input
                  type="number"
                  placeholder="Voltaje Final"
                  step="0.1"
                  value={formData.voltaje_final}
                  onChange={(e) => setFormData({ ...formData, voltaje_final: e.target.value })}
                  className="input w-full text-sm"
                />
              </div>

              <textarea
                placeholder="Observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                className="input w-full text-sm"
                rows="2"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  {submitting ? 'Guardando...' : 'Guardar Movimiento'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMovimientoForm(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Lista de Movimientos */}
          {movimientos.length > 0 ? (
            <div className="space-y-3 overflow-x-auto">
              {movimientos.map(mov => (
                <div key={mov.id} className="bg-slate-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-slate-900">{mov.tipo_movimiento}</p>
                      <p className="text-sm text-slate-600">{mov.piscinas?.nombre} - {mov.tolva}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteMovimiento(mov.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">
                    {new Date(mov.fecha_movimiento).toLocaleString()} | Estado: {mov.estado_bateria}
                  </div>
                  {(mov.ciclos_registrados || mov.capacidad_residual || mov.temperatura) && (
                    <div className="text-xs text-slate-600 space-y-1">
                      {mov.ciclos_registrados && <p>📊 Ciclos: {mov.ciclos_registrados}</p>}
                      {mov.capacidad_residual && <p>🔋 Capacidad: {mov.capacidad_residual}%</p>}
                      {mov.temperatura && <p>🌡️ Temperatura: {mov.temperatura}°C</p>}
                    </div>
                  )}
                  {mov.observaciones && (
                    <p className="text-sm text-slate-700 mt-2">{mov.observaciones}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-center py-8">
              No hay movimientos registrados. Agrega el primero.
            </p>
          )}
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
