import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Download, Upload, Box, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { hopperQueries, zoneQueries, farmQueries, supabase } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/Error'

export default function HoppersPage() {
  const [hoppers, setHoppers] = useState([])
  const [zones, setZones] = useState([])
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingHopper, setEditingHopper] = useState(null)
  const [formData, setFormData] = useState({ zona_id: '', codigo: '', nombre: '', descripcion: '', capacidad_maxima: '', unidad_medida: 'KG', activo: true })

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      setLoading(true)
      const [farmsRes, zonesRes, hoppersRes] = await Promise.all([farmQueries.getAll(), zoneQueries.getAll(), hopperQueries.getAll()])
      if (farmsRes.error) throw farmsRes.error
      if (zonesRes.error) throw zonesRes.error
      if (hoppersRes.error) throw hoppersRes.error
      setFarms(farmsRes.data || [])
      setZones(zonesRes.data || [])
      setHoppers(hoppersRes.data || [])
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const handleOpenCreate = () => { setEditingHopper(null); setFormData({ zona_id: '', codigo: '', nombre: '', descripcion: '', capacidad_maxima: '', unidad_medida: 'KG', activo: true }); setShowModal(true) }
  const handleOpenEdit = (h) => { setEditingHopper(h); setFormData({ zona_id: h.zona_id, codigo: h.codigo, nombre: h.nombre, descripcion: h.descripcion || '', capacidad_maxima: h.capacidad_maxima || '', unidad_medida: h.unidad_medida || 'KG', activo: h.activo }); setShowModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { zona_id: formData.zona_id, nombre: formData.nombre, descripcion: formData.descripcion, capacidad_maxima: formData.capacidad_maxima ? parseFloat(formData.capacidad_maxima) : null, unidad_medida: formData.unidad_medida, activo: formData.activo }
      if (editingHopper) { const { error } = await hopperQueries.update(editingHopper.id, payload); if (error) throw error }
      else { const { error } = await hopperQueries.create({ ...payload, codigo: formData.codigo.toUpperCase() }); if (error) throw error }
      setShowModal(false); await loadAll()
    } catch (err) { setError(err.message) }
  }

  const handleDelete = async (id) => { if (!window.confirm('¿Eliminar esta tolva?')) return; try { const { error } = await supabase.from('tolvas').delete().eq('id', id); if (error) throw error; await loadAll() } catch (err) { setError(err.message) } }

  const handleExportExcel = () => {
    const data = hoppers.map(h => ({ Finca: h.zonas?.fincas?.nombre || '', Zona: h.zonas?.nombre || '', Código: h.codigo, Nombre: h.nombre, Capacidad: h.capacidad_maxima || '', Unidad: h.unidad_medida, Activo: h.activo ? 'Sí' : 'No' }))
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Tolvas')
    XLSX.writeFile(wb, `tolvas_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleImportExcel = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try { const wb = XLSX.read(evt.target.result, { type: 'binary' }); const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
        for (const row of json) { const zone = zones.find(z => z.nombre === row.Zona && z.fincas?.nombre === row.Finca); if (!zone) continue; await hopperQueries.create({ zona_id: zone.id, codigo: row.Código?.toUpperCase(), nombre: row.Nombre, capacidad_maxima: row.Capacidad ? parseFloat(row.Capacidad) : null, unidad_medida: row.Unidad || 'KG', activo: row.Activo === 'Sí' }) }
        await loadAll(); e.target.value = ''
      } catch (err) { setError('Error importando: ' + err.message) }
    }
    reader.readAsBinaryString(file)
  }

  if (loading) return <Loading message="Cargando tolvas..." />

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2"><Box className="h-8 w-8 text-primary-600" /> Tolvas</h1><p className="text-slate-600 mt-2">Puntos de almacenamiento por zona (cargable desde Excel)</p></div>
          <div className="flex gap-2"><button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2"><Download className="h-4 w-4" /> Exportar</button><label className="btn-secondary flex items-center gap-2 cursor-pointer"><Upload className="h-4 w-4" /> Importar<input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" /></label><button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4" /> Nueva Tolva</button></div>
        </div>
        {error && <ErrorAlert message={error} onClose={() => setError(null)} className="mb-6" />}
        <div className="card">
          {hoppers.length > 0 ? (
            <table className="table w-full"><thead><tr className="bg-slate-50"><th>Finca</th><th>Zona</th><th>Código</th><th>Nombre</th><th>Capacidad</th><th>Unidad</th><th>Activo</th><th>Acciones</th></tr></thead><tbody>
              {hoppers.map(h => (<tr key={h.id} className="hover:bg-slate-50"><td>{h.zonas?.fincas?.nombre || '—'}</td><td>{h.zonas?.nombre || '—'}</td><td className="font-mono text-sm">{h.codigo}</td><td className="font-medium">{h.nombre}</td><td>{h.capacidad_maxima ? `${h.capacidad_maxima.toLocaleString()} ${h.unidad_medida}` : '—'}</td><td>{h.unidad_medida}</td><td><span className={`badge ${h.activo ? 'badge-success' : 'badge-danger'}`}>{h.activo ? 'Sí' : 'No'}</span></td><td><button onClick={() => handleOpenEdit(h)} className="text-primary-600 hover:text-primary-700 mr-3"><Edit2 className="h-4 w-4" /></button><button onClick={() => handleDelete(h.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></td></tr>))}
            </tbody></table>
          ) : (
            <div className="text-center py-12"><Box className="h-12 w-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-600">No hay tolvas configuradas</p><button onClick={handleOpenCreate} className="btn-primary mt-4">Crear primera tolva</button></div>
          )}
        </div>
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="bg-primary-600 text-white p-4 flex items-center justify-between"><h3 className="text-lg font-bold">{editingHopper ? 'Editar' : 'Crear'} Tolva</h3><button onClick={() => setShowModal(false)} className="text-white hover:bg-primary-700 p-1 rounded"><Box className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Zona *</label><select value={formData.zona_id} onChange={e => setFormData({ ...formData, zona_id: e.target.value })} className="input w-full text-sm" required><option value="">Seleccionar zona...</option>{zones.map(z => <option key={z.id} value={z.id}>{z.fincas?.nombre} / {z.nombre}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Código *</label><input type="text" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })} className="input w-full text-sm" placeholder="TOL-A1" required disabled={editingHopper} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label><input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="input w-full text-sm" required /></div></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label><textarea value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} className="input w-full text-sm" rows="2" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Capacidad Máxima</label><input type="number" step="0.01" value={formData.capacidad_maxima} onChange={e => setFormData({ ...formData, capacidad_maxima: e.target.value })} className="input w-full text-sm" placeholder="5000" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Unidad</label><select value={formData.unidad_medida} onChange={e => setFormData({ ...formData, unidad_medida: e.target.value })} className="input w-full text-sm"><option value="KG">KG</option><option value="L">Litros</option><option value="M3">m³</option><option value="TON">Toneladas</option></select></div></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="activo" checked={formData.activo} onChange={e => setFormData({ ...formData, activo: e.target.checked })} className="h-4 w-4" /><label htmlFor="activo" className="text-sm text-slate-700">Activo</label></div>
              <div className="flex gap-2 justify-end border-t border-slate-200 pt-4"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">{editingHopper ? 'Actualizar' : 'Crear'}</button></div>
            </form></div></div>
        )}
      </div>
    </div>
  )
}