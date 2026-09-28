import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { assetQueries, productQueries, farmQueries, zoneQueries, hopperQueries, poolQueries, supplierQueries } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/Error'

export default function CreateAssetPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [farms, setFarms] = useState([])
  const [zones, setZones] = useState([])
  const [hoppers, setHoppers] = useState([])
  const [pools, setPools] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    codigo_unico: '',
    producto_id: '',
    finca_id: '',
    zona_id: '',
    tolva_id: '',
    piscina_id: '',
    proveedor_id: '',
    fecha_compra: '',
    fecha_instalacion: '',
    estado: 'ACTIVO',
    observaciones: '',
  })

  useEffect(() => { loadCatalogs() }, [])

  const loadCatalogs = async () => {
    try {
      setLoading(true)
      const [prodsRes, farmsRes, zonesRes, hoppersRes, poolsRes, suppliersRes] = await Promise.all([
        productQueries.getAll(), farmQueries.getAll(), zoneQueries.getAll(), hopperQueries.getAll(), poolQueries.getAll(), supplierQueries.getAll(),
      ])
      if (prodsRes.error) throw prodsRes.error
      if (farmsRes.error) throw farmsRes.error
      if (zonesRes.error) throw zonesRes.error
      if (hoppersRes.error) throw hoppersRes.error
      if (poolsRes.error) throw poolsRes.error
      if (suppliersRes.error) throw suppliersRes.error
      setProducts(prodsRes.data || [])
      setFarms(farmsRes.data || [])
      setZones(zonesRes.data || [])
      setHoppers(hoppersRes.data || [])
      setPools(poolsRes.data || [])
      setSuppliers(suppliersRes.data || [])
    } catch (err) {
      setError(err.message || 'Error cargando catálogos')
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = products.find(p => p.id === formData.producto_id)
  const filteredZones = formData.finca_id ? zones.filter(z => z.finca_id === formData.finca_id) : zones
  const filteredHoppers = formData.zona_id ? hoppers.filter(h => h.zona_id === formData.zona_id) : hoppers

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const next = { ...prev, [name]: value }
      if (name === 'finca_id') { next.zona_id = ''; next.tolva_id = '' }
      if (name === 'zona_id') { next.tolva_id = '' }
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.codigo_unico || !formData.producto_id || !formData.fecha_compra || !formData.fecha_instalacion) {
      setError('Código único, producto y fechas son obligatorios')
      return
    }
    if (new Date(formData.fecha_instalacion) < new Date(formData.fecha_compra)) {
      setError('La fecha de instalación debe ser posterior o igual a la fecha de compra')
      return
    }
    try {
      setSubmitting(true)
      const { data, error: createError } = await assetQueries.create({
        codigo_unico: formData.codigo_unico.trim(),
        producto_id: formData.producto_id,
        finca_id: formData.finca_id || null,
        zona_id: formData.zona_id || null,
        tolva_id: formData.tolva_id || null,
        piscina_id: formData.piscina_id || null,
        proveedor_id: formData.proveedor_id || null,
        fecha_compra: formData.fecha_compra,
        fecha_instalacion: formData.fecha_instalacion,
        estado: formData.estado,
        observaciones: formData.observaciones || null,
        especificaciones: {},
        ciclos_totales: 0,
        horas_uso: 0,
        kilometros: 0,
      })
      if (createError) throw createError
      navigate(`/activos/${data[0].id}`)
    } catch (err) {
      setError(err.message || 'Error al crear activo')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading message="Cargando catálogos..." />

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button onClick={() => navigate('/activos')} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Volver a Activos
          </button>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Plus className="h-8 w-8 text-primary-600" />
            Nuevo Activo
          </h1>
          <p className="text-slate-600 mt-2">Registra cualquier artículo del catálogo (batería, panel, inversor, etc.)</p>
        </div>

        {error && <div className="mb-6"><ErrorAlert message={error} onClose={() => setError(null)} /></div>}

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código Único *</label>
                <input type="text" name="codigo_unico" value={formData.codigo_unico} onChange={handleChange} className="input w-full" placeholder="ej: ACT-001-2024" disabled={submitting} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado *</label>
                <select name="estado" value={formData.estado} onChange={handleChange} className="input w-full" disabled={submitting}>
                  <option value="ACTIVO">Activo</option>
                  <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
                  <option value="OBSOLETO">Obsoleto</option>
                  <option value="BAJA">Baja</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Producto / SKU (lista) *</label>
              <select name="producto_id" value={formData.producto_id} onChange={handleChange} className="input w-full" disabled={submitting}>
                <option value="">Selecciona un SKU del catálogo...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.sku} — {p.nombre} ({p.marcas?.nombre || 'sin marca'})</option>
                ))}
              </select>
              {products.length === 0 && <p className="text-xs text-danger-600 mt-1">No hay SKUs. Crea primero en Catálogo → Productos o importa desde Excel.</p>}
            </div>

            {selectedProduct && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-slate-500 text-xs">Categoría</p><p className="font-semibold">{selectedProduct.categorias_producto?.nombre || '—'}</p></div>
                <div><p className="text-slate-500 text-xs">Marca</p><p className="font-semibold">{selectedProduct.marcas?.nombre || '—'}</p></div>
                <div><p className="text-slate-500 text-xs">Modelo</p><p className="font-semibold">{selectedProduct.modelo || '—'}</p></div>
                <div><p className="text-slate-500 text-xs">Voltaje</p><p className="font-semibold">{selectedProduct.voltaje_nominal ? `${selectedProduct.voltaje_nominal}V (12/24/48)` : '—'}</p></div>
                <div><p className="text-slate-500 text-xs">Vida útil</p><p className="font-semibold">{selectedProduct.vida_util_anos || selectedProduct.categorias_producto?.vida_util_anos || '—'} años</p></div>
                <div><p className="text-slate-500 text-xs">Tipo obsolescencia</p><p className="font-semibold">{selectedProduct.categorias_producto?.tipo_obsolescencia || '—'}</p></div>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-bold text-slate-900 mb-3">Ubicación (listas desde Excel)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Finca</label>
                  <select name="finca_id" value={formData.finca_id} onChange={handleChange} className="input w-full" disabled={submitting}>
                    <option value="">Seleccionar...</option>
                    {farms.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zona</label>
                  <select name="zona_id" value={formData.zona_id} onChange={handleChange} className="input w-full" disabled={submitting}>
                    <option value="">Seleccionar...</option>
                    {filteredZones.map(z => <option key={z.id} value={z.id}>{z.fincas?.nombre ? `${z.fincas.nombre} / ` : ''}{z.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tolva</label>
                  <select name="tolva_id" value={formData.tolva_id} onChange={handleChange} className="input w-full" disabled={submitting}>
                    <option value="">Seleccionar...</option>
                    {filteredHoppers.map(h => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Piscina (legado / opcional)</label>
                  <select name="piscina_id" value={formData.piscina_id} onChange={handleChange} className="input w-full" disabled={submitting}>
                    <option value="">—</option>
                    {pools.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
                  <select name="proveedor_id" value={formData.proveedor_id} onChange={handleChange} className="input w-full" disabled={submitting}>
                    <option value="">—</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Compra *</label>
                <input type="date" name="fecha_compra" value={formData.fecha_compra} onChange={handleChange} className="input w-full" disabled={submitting} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Instalación *</label>
                <input type="date" name="fecha_instalacion" value={formData.fecha_instalacion} onChange={handleChange} className="input w-full" disabled={submitting} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
              <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} className="input w-full" rows="3" disabled={submitting} />
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-200">
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Guardando...' : 'Crear Activo'}</button>
              <button type="button" onClick={() => navigate('/activos')} className="btn-secondary" disabled={submitting}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
