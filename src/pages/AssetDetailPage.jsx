import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, History, Plus, Trash2, Download, RefreshCw } from 'lucide-react'
import * as XLSX from 'xlsx'
import { assetQueries, assetMovementQueries, assetCommentQueries, farmQueries, zoneQueries, hopperQueries, poolQueries } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorPage, ErrorAlert } from '../components/Error'

export default function AssetDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [asset, setAsset] = useState(null)
  const [movements, setMovements] = useState([])
  const [comments, setComments] = useState([])
  const [farms, setFarms] = useState([])
  const [zones, setZones] = useState([])
  const [hoppers, setHoppers] = useState([])
  const [pools, setPools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [recalcLoading, setRecalcLoading] = useState(false)
  const [showMovForm, setShowMovForm] = useState(false)
  const [movForm, setMovForm] = useState({
    finca_id_destino: '', zona_id_destino: '', tolva_id_destino: '', piscina_id_destino: '',
    tipo_movimiento: 'TRASLADO', estado_activo: 'ACTIVO',
    ciclos_registrados: '', horas_uso_registradas: '', kilometros_registrados: '',
    voltaje_inicial: '', voltaje_final: '', temperatura: '',
    observaciones: '', proxima_revision: '',
  })

  useEffect(() => { loadDetail() }, [id])

  const loadDetail = async () => {
    try {
      setLoading(true); setError(null)
      const [assetRes, movRes, comRes, farmsRes, zonesRes, hoppersRes, poolsRes] = await Promise.all([
        assetQueries.getById(id), assetMovementQueries.getByAsset(id), assetCommentQueries.getByAsset(id),
        farmQueries.getAll(), zoneQueries.getAll(), hopperQueries.getAll(), poolQueries.getAll(),
      ])
      if (assetRes.error) throw assetRes.error
      if (!assetRes.data) throw new Error('Activo no encontrado')
      setAsset(assetRes.data)
      if (!movRes.error) setMovements(movRes.data || [])
      if (!comRes.error) setComments(comRes.data || [])
      if (!farmsRes.error) setFarms(farmsRes.data || [])
      if (!zonesRes.error) setZones(zonesRes.data || [])
      if (!hoppersRes.error) setHoppers(hoppersRes.data || [])
      if (!poolsRes.error) setPools(poolsRes.data || [])
    } catch (err) {
      setError(err.message || 'Error cargando activo')
    } finally {
      setLoading(false)
    }
  }

  const handleRecalc = async () => {
    try {
      setRecalcLoading(true)
      const { data, error } = await assetQueries.calculateObsolescence(id)
      if (error) throw error
      await loadDetail()
    } catch (err) {
      setError(err.message)
    } finally {
      setRecalcLoading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      setSubmitting(true)
      const { data, error } = await assetCommentQueries.create(id, commentText)
      if (error) throw error
      setComments([data[0], ...comments]); setCommentText('')
    } catch (err) { setError(err.message) } finally { setSubmitting(false) }
  }

  const handleAddMovement = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const { data, error } = await assetMovementQueries.create({
        activo_id: id,
        finca_id_origen: asset.finca_id, zona_id_origen: asset.zona_id, tolva_id_origen: asset.tolva_id, piscina_id_origen: asset.piscina_id,
        finca_id_destino: movForm.finca_id_destino || null,
        zona_id_destino: movForm.zona_id_destino || null,
        tolva_id_destino: movForm.tolva_id_destino || null,
        piscina_id_destino: movForm.piscina_id_destino || null,
        tipo_movimiento: movForm.tipo_movimiento,
        estado_activo: movForm.estado_activo || null,
        ciclos_registrados: movForm.ciclos_registrados ? parseInt(movForm.ciclos_registrados) : null,
        horas_uso_registradas: movForm.horas_uso_registradas ? parseFloat(movForm.horas_uso_registradas) : null,
        kilometros_registrados: movForm.kilometros_registrados ? parseFloat(movForm.kilometros_registrados) : null,
        voltaje_inicial: movForm.voltaje_inicial ? parseFloat(movForm.voltaje_inicial) : null,
        voltaje_final: movForm.voltaje_final ? parseFloat(movForm.voltaje_final) : null,
        temperatura: movForm.temperatura ? parseFloat(movForm.temperatura) : null,
        observaciones: movForm.observaciones || null,
        proxima_revision: movForm.proxima_revision || null,
      })
      if (error) throw error
      setMovements([data[0], ...movements]); setShowMovForm(false)
      setMovForm({ finca_id_destino: '', zona_id_destino: '', tolva_id_destino: '', piscina_id_destino: '', tipo_movimiento: 'TRASLADO', estado_activo: 'ACTIVO', ciclos_registrados: '', horas_uso_registradas: '', kilometros_registrados: '', voltaje_inicial: '', voltaje_final: '', temperatura: '', observaciones: '', proxima_revision: '' })
      await loadDetail()
    } catch (err) { setError(err.message || 'Error al guardar movimiento') } finally { setSubmitting(false) }
  }

  const handleDeleteMovement = async (movId) => {
    if (!window.confirm('¿Eliminar este movimiento?')) return
    try { const { error } = await assetMovementQueries.delete(movId); if (error) throw error; setMovements(movements.filter(m => m.id !== movId)) }
    catch (err) { setError(err.message) }
  }

  const handleExportExcel = () => {
    if (movements.length === 0) { setError('No hay movimientos para descargar'); return }
    try {
      const data = movements.map(m => ({
        Fecha: new Date(m.fecha_movimiento).toLocaleString(), Tipo: m.tipo_movimiento,
        Origen: [m.fincas?.nombre, m.zonas?.nombre, m.tolvas?.nombre].filter(Boolean).join(' / '),
        Ciclos: m.ciclos_registrados || '', Horas: m.horas_uso_registradas || '', Km: m.kilometros_registrados || '',
        'Voltaje Ini': m.voltaje_inicial || '', 'Voltaje Fin': m.voltaje_final || '', Temp: m.temperatura || '',
        Observaciones: m.observaciones || '', Usuario: m.usuario_nombre || '',
      }))
      const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')
      XLSX.writeFile(wb, `historial_${asset.codigo_unico}_${Date.now()}.xlsx`)
    } catch (err) { setError('Error Excel: ' + err.message) }
  }

  if (loading) return <Loading message="Cargando activo..." />
  if (error && !asset) return <ErrorPage message={error} onRetry={() => navigate('/activos')} />

  const obs = asset.obsolescencia_pct || 0
  const obsColor = obs >= 80 ? 'bg-danger-600' : obs >= 50 ? 'bg-warning-500' : 'bg-success-600'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate('/activos')} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver a Activos
        </button>

        {error && <div className="mb-4"><ErrorAlert message={error} onClose={() => setError(null)} /></div>}

        <div className="card mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-slate-500">Código único</p>
              <h2 className="text-2xl font-bold">{asset.codigo_unico}</h2>
              <p className="text-slate-600">{asset.productos?.sku} — {asset.productos?.nombre}</p>
            </div>
            <span className={`badge ${asset.estado === 'ACTIVO' ? 'badge-success' : asset.estado === 'EN_MANTENIMIENTO' ? 'badge-warning' : 'badge-danger'}`}>{asset.estado}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-200 pt-4 text-sm">
            <div><p className="text-slate-500 text-xs">Categoría</p><p className="font-semibold">{asset.productos?.categorias_producto?.nombre || '—'}</p></div>
            <div><p className="text-slate-500 text-xs">Marca</p><p className="font-semibold">{asset.productos?.marcas?.nombre || '—'}</p></div>
            <div><p className="text-slate-500 text-xs">Modelo</p><p className="font-semibold">{asset.productos?.modelo || '—'}</p></div>
            <div><p className="text-slate-500 text-xs">Voltaje</p><p className="font-semibold">{asset.productos?.voltaje_nominal ? `${asset.productos.voltaje_nominal}V` : '—'}</p></div>
            <div><p className="text-slate-500 text-xs">Finca</p><p className="font-semibold">{asset.fincas?.nombre || '—'}</p></div>
            <div><p className="text-slate-500 text-xs">Zona</p><p className="font-semibold">{asset.zonas?.nombre || '—'}</p></div>
            <div><p className="text-slate-500 text-xs">Tolva</p><p className="font-semibold">{asset.tolvas?.nombre || '—'}</p></div>
            <div><p className="text-slate-500 text-xs">Piscina</p><p className="font-semibold">{asset.piscinas?.nombre || '—'}</p></div>
            <div><p className="text-slate-500 text-xs">Proveedor</p><p className="font-semibold">{asset.proveedores?.nombre || '—'}</p></div>
            <div><p className="text-slate-500 text-xs">Fecha compra</p><p className="font-semibold">{asset.fecha_compra ? new Date(asset.fecha_compra).toLocaleDateString() : '—'}</p></div>
            <div><p className="text-slate-500 text-xs">Fecha instalación</p><p className="font-semibold">{asset.fecha_instalacion ? new Date(asset.fecha_instalacion).toLocaleDateString() : '—'}</p></div>
            <div><p className="text-slate-500 text-xs">Ciclos / Horas / Km</p><p className="font-semibold">{asset.ciclos_totales || 0} / {asset.horas_uso || 0} / {asset.kilometros || 0}</p></div>
          </div>
          {asset.observaciones && <p className="text-sm text-slate-700 mt-4 border-t border-slate-200 pt-4 whitespace-pre-wrap">{asset.observaciones}</p>}
        </div>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Obsolescencia</h3>
            <button onClick={handleRecalc} disabled={recalcLoading} className="btn-secondary text-sm flex items-center gap-2"><RefreshCw className="h-4 w-4" />{recalcLoading ? 'Calculando...' : 'Recalcular'}</button>
          </div>
          <div className="flex items-end gap-4">
            <div className="flex-1"><div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden"><div className={`${obsColor} h-full`} style={{ width: `${obs}%` }} /></div></div>
            <div className="text-right"><p className="text-2xl font-bold">{obs.toFixed(1)}%</p><p className="text-sm text-slate-600">{asset.vida_util_restante_anos != null ? `${asset.vida_util_restante_anos} años restantes` : ''}</p></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Tipo: {asset.productos?.categorias_producto?.tipo_obsolescencia || '—'} · Unidad: {asset.productos?.categorias_producto?.unidad_medida_vida || 'ANOS'}</p>
        </div>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2"><History className="h-5 w-5" /> Historial de Movimientos</h3>
            <div className="flex gap-2">
              {movements.length > 0 && <button onClick={handleExportExcel} className="btn-secondary text-sm flex items-center gap-2"><Download className="h-4 w-4" /> Excel</button>}
              <button onClick={() => setShowMovForm(!showMovForm)} className="btn-primary text-sm flex items-center gap-2"><Plus className="h-4 w-4" /> Agregar</button>
            </div>
          </div>
          {showMovForm && (
            <form onSubmit={handleAddMovement} className="mb-6 pb-6 border-b border-slate-200 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Finca destino</label><select value={movForm.finca_id_destino} onChange={e => setMovForm({ ...movForm, finca_id_destino: e.target.value })} className="input w-full"><option value="">—</option>{farms.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Zona destino</label><select value={movForm.zona_id_destino} onChange={e => setMovForm({ ...movForm, zona_id_destino: e.target.value })} className="input w-full"><option value="">—</option>{zones.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Tolva destino</label><select value={movForm.tolva_id_destino} onChange={e => setMovForm({ ...movForm, tolva_id_destino: e.target.value })} className="input w-full"><option value="">—</option>{hoppers.map(h => <option key={h.id} value={h.id}>{h.nombre}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Piscina destino</label><select value={movForm.piscina_id_destino} onChange={e => setMovForm({ ...movForm, piscina_id_destino: e.target.value })} className="input w-full"><option value="">—</option>{pools.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Tipo</label><select value={movForm.tipo_movimiento} onChange={e => setMovForm({ ...movForm, tipo_movimiento: e.target.value })} className="input w-full"><option>INSTALACION</option><option>TRASLADO</option><option>MANTENIMIENTO</option><option>REPARACION</option><option>INSPECCION</option><option>CAMBIO_UBICACION</option><option>CALIBRACION</option><option>ACTUALIZACION</option><option>BAJA</option><option>REACTIVACION</option><option>OTRO</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Estado</label><select value={movForm.estado_activo} onChange={e => setMovForm({ ...movForm, estado_activo: e.target.value })} className="input w-full"><option>ACTIVO</option><option>EN_MANTENIMIENTO</option><option>OBSOLETO</option><option>BAJA</option></select></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <input type="number" placeholder="Ciclos" value={movForm.ciclos_registrados} onChange={e => setMovForm({ ...movForm, ciclos_registrados: e.target.value })} className="input w-full text-sm" />
                <input type="number" step="0.01" placeholder="Horas" value={movForm.horas_uso_registradas} onChange={e => setMovForm({ ...movForm, horas_uso_registradas: e.target.value })} className="input w-full text-sm" />
                <input type="number" step="0.01" placeholder="Km" value={movForm.kilometros_registrados} onChange={e => setMovForm({ ...movForm, kilometros_registrados: e.target.value })} className="input w-full text-sm" />
                <input type="number" step="0.1" placeholder="Voltaje ini" value={movForm.voltaje_inicial} onChange={e => setMovForm({ ...movForm, voltaje_inicial: e.target.value })} className="input w-full text-sm" />
                <input type="number" step="0.1" placeholder="Voltaje fin" value={movForm.voltaje_final} onChange={e => setMovForm({ ...movForm, voltaje_final: e.target.value })} className="input w-full text-sm" />
                <input type="number" step="0.1" placeholder="Temp °C" value={movForm.temperatura} onChange={e => setMovForm({ ...movForm, temperatura: e.target.value })} className="input w-full text-sm" />
              </div>
              <textarea placeholder="Observaciones" value={movForm.observaciones} onChange={e => setMovForm({ ...movForm, observaciones: e.target.value })} className="input w-full text-sm" rows="2" />
              <div className="flex gap-2"><button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? 'Guardando...' : 'Guardar'}</button><button type="button" onClick={() => setShowMovForm(false)} className="btn-secondary">Cancelar</button></div>
            </form>
          )}
          {movements.length > 0 ? (
            <div className="space-y-3">{movements.map(m => (
              <div key={m.id} className="bg-slate-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2"><div><p className="font-bold">{m.tipo_movimiento}</p><p className="text-sm text-slate-600">{new Date(m.fecha_movimiento).toLocaleString()} | {m.estado_activo || ''}</p></div><button onClick={() => handleDeleteMovement(m.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button></div>
                {m.observaciones && <p className="text-sm mt-2">{m.observaciones}</p>}
              </div>))}
            </div>
          ) : <p className="text-center py-8 text-slate-600">Sin movimientos. Agrega el primero.</p>}
        </div>

        <div className="card">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Auditoría</h3>
          <form onSubmit={handleAddComment} className="mb-6 pb-6 border-b border-slate-200">
            <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Agregar comentario..." className="input w-full mb-3" rows="3" disabled={submitting} />
            <button type="submit" disabled={!commentText.trim() || submitting} className="btn-primary">{submitting ? 'Guardando...' : 'Guardar Comentario'}</button>
          </form>
          {comments.length > 0 ? <div className="space-y-4">{comments.map(c => (<div key={c.id} className="bg-slate-50 rounded-lg p-4"><p className="text-xs text-slate-500 mb-1">{new Date(c.fecha_creacion).toLocaleString()}</p><p className="text-slate-700">{c.contenido}</p></div>))}</div> : <p className="text-center py-8 text-slate-600">Sin comentarios.</p>}
        </div>
      </div>
    </div>
  )
}
