import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Plus, Search, Eye, AlertTriangle, TrendingUp, Download, Upload, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { assetQueries, productQueries, farmQueries, zoneQueries, hopperQueries, poolQueries, supplierQueries } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/Error'

export default function AssetsPage() {
  const [assets, setAssets] = useState([])
  const [products, setProducts] = useState([])
  const [farms, setFarms] = useState([])
  const [zones, setZones] = useState([])
  const [hoppers, setHoppers] = useState([])
  const [pools, setPools] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({ producto_id: '', finca_id: '', zona_id: '', estado: '' })

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      setLoading(true)
      const [assetsRes, prodsRes, farmsRes, zonesRes, hoppersRes, poolsRes, suppliersRes] = await Promise.all([
        assetQueries.getAll(), productQueries.getAll(), farmQueries.getAll(), zoneQueries.getAll(), hopperQueries.getAll(), poolQueries.getAll(), supplierQueries.getAll()
      ])
      if (assetsRes.error) throw assetsRes.error
      if (prodsRes.error) throw prodsRes.error
      if (farmsRes.error) throw farmsRes.error
      if (zonesRes.error) throw zonesRes.error
      if (hoppersRes.error) throw hoppersRes.error
      if (poolsRes.error) throw poolsRes.error
      if (suppliersRes.error) throw suppliersRes.error
      setAssets(assetsRes.data || [])
      setProducts(prodsRes.data || [])
      setFarms(farmsRes.data || [])
      setZones(zonesRes.data || [])
      setHoppers(hoppersRes.data || [])
      setPools(poolsRes.data || [])
      setSuppliers(suppliersRes.data || [])
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const filteredAssets = assets.filter(a => {
    if (searchTerm && !a.codigo_unico.toLowerCase().includes(searchTerm.toLowerCase()) && !a.productos?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) && !a.productos?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) && !a.fincas?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filters.producto_id && a.producto_id !== filters.producto_id) return false
    if (filters.finca_id && a.finca_id !== filters.finca_id) return false
    if (filters.zona_id && a.zona_id !== filters.zona_id) return false
    if (filters.estado && a.estado !== filters.estado) return false
    return true
  })

  const handleExportExcel = () => {
    const data = filteredAssets.map(a => ({
      'Código Único': a.codigo_unico,
      'SKU': a.productos?.sku || '',
      'Producto': a.productos?.nombre || '',
      'Categoría': a.productos?.categorias_producto?.nombre || '',
      'Marca': a.productos?.marcas?.nombre || '',
      'Finca': a.fincas?.nombre || '',
      'Zona': a.zonas?.nombre || '',
      'Tolva': a.tolvas?.nombre || '',
      'Piscina': a.piscinas?.nombre || '',
      'Proveedor': a.proveedores?.nombre || '',
      'Fecha Compra': a.fecha_compra ? new Date(a.fecha_compra).toLocaleDateString() : '',
      'Fecha Instalación': a.fecha_instalacion ? new Date(a.fecha_instalacion).toLocaleDateString() : '',
      'Estado': a.estado,
      'Obsolescencia %': a.obsolescencia_pct || 0,
      'Vida Útil Restante (años)': a.vida_util_restante_anos || '',
      'Ciclos': a.ciclos_totales || 0,
      'Horas Uso': a.horas_uso || 0,
      'Kilómetros': a.kilometros || 0,
    }))
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Activos')
    XLSX.writeFile(wb, `activos_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleImportExcel = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try { const wb = XLSX.read(evt.target.result, { type: 'binary' }); const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
        for (const row of json) {
          const prod = products.find(p => p.sku === row.SKU)
          const farm = farms.find(f => f.nombre === row.Finca)
          const zone = zones.find(z => z.nombre === row.Zona && z.finca_id === farm?.id)
          const hopper = hoppers.find(h => h.nombre === row.Tolva && h.zona_id === zone?.id)
          const pool = pools.find(p => p.nombre === row.Piscina)
          const supplier = suppliers.find(s => s.nombre === row.Proveedor)
          if (!prod) continue
          await assetQueries.create({
            codigo_unico: row['Código Único'],
            producto_id: prod.id,
            finca_id: farm?.id || null,
            zona_id: zone?.id || null,
            tolva_id: hopper?.id || null,
            piscina_id: pool?.id || null,
            proveedor_id: supplier?.id || null,
            fecha_compra: row['Fecha Compra'] || new Date().toISOString().split('T')[0],
            fecha_instalacion: row['Fecha Instalación'] || new Date().toISOString().split('T')[0],
            estado: row.Estado || 'ACTIVO',
            especificaciones: {},
          })
        }
        await loadAll(); e.target.value = ''
      } catch (err) { setError('Error importando: ' + err.message) }
    }
    reader.readAsBinaryString(file)
  }

  if (loading) return <Loading message="Cargando activos..." />

  const totalAssets = assets.length
  const activeAssets = assets.filter(a => a.estado === 'ACTIVO').length
  const criticalAssets = assets.filter(a => (a.obsolescencia_pct || 0) >= 80 && (a.estado === 'ACTIVO' || a.estado === 'EN_MANTENIMIENTO')).length
  const maintenanceAssets = assets.filter(a => a.estado === 'EN_MANTENIMIENTO').length

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="h-8 w-8 text-primary-600" />
              Gestión de Activos
            </h1>
            <p className="text-slate-600 mt-2">Inventario unificado de todos los equipos</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2"><Download className="h-4 w-4" /> Exportar</button>
            <label className="btn-secondary flex items-center gap-2 cursor-pointer"><Upload className="h-4 w-4" /> Importar<input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" /></label>
            <Link to="/activos/nuevo" className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4" /> Nuevo Activo</Link>
          </div>
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError(null)} className="mb-6" />}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card"><div className="flex items-center justify-between"><div><p className="text-slate-600 text-sm">Total Activos</p><p className="text-3xl font-bold text-slate-900">{totalAssets}</p></div><Package className="h-8 w-8 text-primary-600" /></div></div>
          <div className="card"><div className="flex items-center justify-between"><div><p className="text-slate-600 text-sm">Operativos</p><p className="text-3xl font-bold text-success-600">{activeAssets}</p></div><TrendingUp className="h-8 w-8 text-success-600" /></div></div>
          <div className="card"><div className="flex items-center justify-between"><div><p className="text-slate-600 text-sm">En Mantenimiento</p><p className="text-3xl font-bold text-warning-600">{maintenanceAssets}</p></div><AlertTriangle className="h-8 w-8 text-warning-600" /></div></div>
          <div className="card"><div className="flex items-center justify-between"><div><p className="text-slate-600 text-sm">Obsolescencia Crítica (≥80%)</p><p className="text-3xl font-bold text-danger-600">{criticalAssets}</p></div><AlertTriangle className="h-8 w-8 text-danger-600" /></div></div>
        </div>

        {/* Filtros */}
        <div className="card mb-6 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Buscar</label><input type="text" placeholder="Código, SKU, producto, finca..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input w-full" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Producto</label><select value={filters.producto_id} onChange={e => setFilters({ ...filters, producto_id: e.target.value })} className="input w-full"><option value="">Todos</option>{products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.nombre}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Finca</label><select value={filters.finca_id} onChange={e => setFilters({ ...filters, finca_id: e.target.value })} className="input w-full"><option value="">Todas</option>{farms.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Zona</label><select value={filters.zona_id} onChange={e => setFilters({ ...filters, zona_id: e.target.value })} className="input w-full"><option value="">Todas</option>{zones.map(z => <option key={z.id} value={z.id}>{z.fincas?.nombre} / {z.nombre}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Estado</label><select value={filters.estado} onChange={e => setFilters({ ...filters, estado: e.target.value })} className="input w-full"><option value="">Todos</option><option value="ACTIVO">Activo</option><option value="EN_MANTENIMIENTO">En Mantenimiento</option><option value="OBSOLETO">Obsoleto</option><option value="BAJA">Baja</option></select></div>
          </div>
        </div>

        {/* Tabla */}
        <div className="card overflow-x-auto">
          {filteredAssets.length > 0 ? (
            <table className="table w-full">
              <thead><tr className="bg-slate-50"><th>Código Único</th><th>SKU</th><th>Producto</th><th>Categoría</th><th>Marca</th><th>Ubicación</th><th>Estado</th><th>Obsolescencia</th><th>Acciones</th></tr></thead>
              <tbody>
                {filteredAssets.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="font-mono text-sm font-medium">{a.codigo_unico}</td>
                    <td className="font-mono text-xs">{a.productos?.sku || '—'}</td>
                    <td className="font-medium text-sm">{a.productos?.nombre || '—'}</td>
                    <td><span className="badge badge-primary text-xs">{a.productos?.categorias_producto?.nombre || '—'}</span></td>
                    <td className="text-xs">{a.productos?.marcas?.nombre || '—'}</td>
                    <td className="text-xs">
                      {a.fincas?.nombre && <span>{a.fincas.nombre}</span>}
                      {a.zonas?.nombre && <span className="block">{a.zonas.nombre}</span>}
                      {a.tolvas?.nombre && <span className="block">{a.tolvas.nombre}</span>}
                      {a.piscinas?.nombre && <span className="block text-primary-600">{a.piscinas.nombre}</span>}
                      {!a.fincas?.nombre && !a.piscinas?.nombre && <span className="text-slate-400">—</span>}
                    </td>
                    <td>
                      <span className={`badge ${a.estado === 'ACTIVO' ? 'badge-success' : a.estado === 'EN_MANTENIMIENTO' ? 'badge-warning' : a.estado === 'OBSOLETO' ? 'badge-danger' : 'badge-danger'}`}>
                        {a.estado}
                      </span>
                    </td>
                    <td className="text-right font-mono">
                      {(a.obsolescencia_pct || 0).toFixed(1)}%
                      {a.vida_util_restante_anos && <span className="block text-xs text-slate-500">{a.vida_util_restante_anos.toFixed(1)} años</span>}
                    </td>
                    <td>
                      <Link to={`/activos/${a.id}`} className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm"><Eye className="h-4 w-4" /> Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12"><Package className="h-12 w-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-600">{searchTerm ? 'No se encontraron activos' : 'No hay activos registrados'}</p><Link to="/activos/nuevo" className="btn-primary inline-flex items-center gap-2 mt-4"><Plus className="h-4 w-4" /> Crear Primer Activo</Link></div>
          )}
        </div>
      </div>
    </div>
  )
}