import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Download, Upload, Map, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { zoneQueries, farmQueries, supabase } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/Error'

export default function ZonesPage() {
  const [zones, setZones] = useState([])
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingZone, setEditingZone] = useState(null)
  const [formData, setFormData] = useState({ finca_id: '', codigo: '', nombre: '', descripcion: '', activo: true })

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      setLoading(true)
      const [farmsRes, zonesRes] = await Promise.all([farmQueries.getAll(), zoneQueries.getAll()])
      if (farmsRes.error) throw farmsRes.error
      if (zonesRes.error) throw zonesRes.error
      setFarms(farmsRes.data || [])
      setZones(zonesRes.data || [])
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const handleOpenCreate = () => { setEditingZone(null); setFormData({ finca_id: '', codigo: '', nombre: '', descripcion: '', activo: true }); setShowModal(true) }
  const handleOpenEdit = (zone) => { setEditingZone(zone); setFormData({ finca_id: zone.finca_id, codigo: zone.codigo, nombre: zone.nombre, descripcion: zone.descripcion || '', activo: zone.activo }); setShowModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingZone) { const { error } = await zoneQueries.update(editingZone.id, { finca_id: formData.finca_id, nombre: formData.nombre, descripcion: formData.descripcion, activo: formData.activo }); if (error) throw error }
      else { const { error } = await zoneQueries.create({ finca_id: formData.finca_id, codigo: formData.codigo.toUpperCase(), nombre: formData.nombre, descripcion: formData.descripcion, activo: formData.activo }); if (error) throw error }
      setShowModal(false); await loadAll()
    } catch (err) { setError(err.message) }
  }

  const handleDelete = async (id) => { if (!window.confirm('¿Eliminar esta zona?')) return; try { const { error } = await supabase.from('zonas').delete().eq('id', id); if (error) throw error; await loadAll() } catch (err) { setError(err.message) } }

  const handleExportExcel = () => {
    const data = zones.map(z => ({ Finca: z.fincas?.nombre || '', Código: z.codigo, Nombre: z.nombre, Descripción: z.descripcion || '', Activo: z.activo ? 'Sí' : 'No' }))
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Zonas')
    XLSX.writeFile(wb, `zonas_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleImportExcel = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try { const wb = XLSX.read(evt.target.result, { type: 'binary' }); const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
        for (const row of json) { const farm = farms.find(f => f.nombre === row.Finca); if (!farm) continue; await zoneQueries.create({ finca_id: farm.id, codigo: row.Código?.toUpperCase(), nombre: row.Nombre, descripcion: row.Descripción || '', activo: row.Activo === 'Sí' }) }
        await loadAll(); e.target.value = ''
      } catch (err) { setError('Error importando: ' + err.message) }
    }
    reader.readAsBinaryString(file)
  }

  if (loading) return <Loading message="Cargando zonas..." />

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2"><Map className="h-8 w-8 text-primary-600" /> Zonas</h1><p className="text-slate-600 mt-2">Subdivisiones por finca (cargable desde Excel)</p></div>
          <div className="flex gap-2"><button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2"><Download className="h-4 w-4" /> Exportar</button><label className="btn-secondary flex items-center gap-2 cursor-pointer"><Upload className="h-4 w-4" /> Importar<input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" /></label><button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4" /> Nueva Zona</button></div>
        </div>
        {error && <ErrorAlert message={error} onClose={() => setError(null)} className="mb-6" />}
        <div className="card">
          {zones.length > 0 ? (
            <table className="table w-full"><thead><tr className="bg-slate-50"><th>Finca</th><th>Código</th><th>Nombre</th><th>Descripción</th><th>Activo</th><th>Acciones</th></tr></thead><tbody>
              {zones.map(z => (<tr key={z.id} className="hover:bg-slate-50"><td>{z.fincas?.nombre || '—'}</td><td className="font-mono text-sm">{z.codigo}</td><td className="font-medium">{z.nombre}</td><td className="text-sm">{z.descripcion || '—'}</td><td><span className={`badge ${z.activo ? 'badge-success' : 'badge-danger'}`}>{z.activo ? 'Sí' : 'No'}</span></td><td><button onClick={() => handleOpenEdit(z)} className="text-primary-600 hover:text-primary-700 mr-3"><Edit2 className="h-4 w-4" /></button><button onClick={() => handleDelete(z.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></td></tr>))}
            </tbody></table>
          ) : (
            <div className="text-center py-12"><Map className="h-12 w-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-600">No hay zonas configuradas</p><button onClick={handleOpenCreate} className="btn-primary mt-4">Crear primera zona</button></div>
          )}
        </div>
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="bg-primary-600 text-white p-4 flex items-center justify-between"><h3 className="text-lg font-bold">{editingZone ? 'Editar' : 'Crear'} Zona</h3><button onClick={() => setShowModal(false)} className="text-white hover:bg-primary-700 p-1 rounded"><Map className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Finca *</label><select value={formData.finca_id} onChange={e => setFormData({ ...formData, finca_id: e.target.value })} className="input w-full text-sm" required><option value="">Seleccionar finca...</option>{farms.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Código *</label><input type="text" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })} className="input w-full text-sm" placeholder="ZN, ZC, ZS" required disabled={editingZone} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label><input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="input w-full text-sm" required /></div></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label><textarea value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} className="input w-full text-sm" rows="2" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="activo" checked={formData.activo} onChange={e => setFormData({ ...formData, activo: e.target.checked })} className="h-4 w-4" /><label htmlFor="activo" className="text-sm text-slate-700">Activo</label></div>
              <div className="flex gap-2 justify-end border-t border-slate-200 pt-4"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">{editingZone ? 'Actualizar' : 'Crear'}</button></div>
            </form></div></div>
        )}
      </div>
    </div>
  )
}