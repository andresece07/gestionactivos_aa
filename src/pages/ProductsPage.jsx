import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Download, Upload, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { productQueries, categoryQueries, brandQueries, supabase } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/Error'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    sku: '', nombre: '', categoria_id: '', marca_id: '', marca: '', modelo: '',
    descripcion: '', especificaciones: '{}', voltaje_nominal: null,
    vida_util_anos: null, factor_degradacion: null, unidad_medida_vida: '', activo: true,
  })

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      setLoading(true)
      const [catsRes, brandsRes, prodsRes] = await Promise.all([
        categoryQueries.getAll(),
        brandQueries.getAll(),
        productQueries.getAll(),
      ])
      if (catsRes.error) throw catsRes.error
      if (brandsRes.error) throw brandsRes.error
      if (prodsRes.error) throw prodsRes.error
      setCategories(catsRes.data || [])
      setBrands(brandsRes.data || [])
      setProducts(prodsRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingProduct(null)
    setFormData({ sku: '', nombre: '', categoria_id: '', marca_id: '', marca: '', modelo: '', descripcion: '', especificaciones: '{}', voltaje_nominal: null, vida_util_anos: null, factor_degradacion: null, unidad_medida_vida: '', activo: true })
    setShowModal(true)
  }

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod)
    setFormData({
      sku: prod.sku,
      nombre: prod.nombre,
      categoria_id: prod.categoria_id || '',
      marca_id: prod.marca_id || '',
      marca: prod.marcas?.nombre || '',
      modelo: prod.modelo || '',
      descripcion: prod.descripcion || '',
      especificaciones: JSON.stringify(prod.especificaciones || {}, null, 2),
      voltaje_nominal: prod.voltaje_nominal || '',
      vida_util_anos: prod.vida_util_anos || '',
      factor_degradacion: prod.factor_degradacion || '',
      unidad_medida_vida: prod.unidad_medida_vida || '',
      activo: prod.activo,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        nombre: formData.nombre,
        categoria_id: formData.categoria_id,
        marca_id: formData.marca_id || null,
        marca: formData.marca,
        modelo: formData.modelo,
        descripcion: formData.descripcion,
        especificaciones: JSON.parse(formData.especificaciones || '{}'),
        voltaje_nominal: formData.voltaje_nominal ? parseInt(formData.voltaje_nominal) : null,
        vida_util_anos: formData.vida_util_anos ? parseFloat(formData.vida_util_anos) : null,
        factor_degradacion: formData.factor_degradacion ? parseFloat(formData.factor_degradacion) : null,
        unidad_medida_vida: formData.unidad_medida_vida || null,
        activo: formData.activo,
      }
      if (editingProduct) {
        const { error } = await productQueries.update(editingProduct.id, payload)
        if (error) throw error
      } else {
        const { error } = await productQueries.create({ ...payload, sku: formData.sku })
        if (error) throw error
      }
      setShowModal(false)
      await loadAll()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return
    try {
      const { error } = await supabase.from('productos').delete().eq('id', id)
      if (error) throw error
      await loadAll()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleExportExcel = () => {
    const data = products.map(p => ({
      SKU: p.sku,
      Nombre: p.nombre,
      Categoría: p.categorias_producto?.nombre || '',
      Marca: p.marcas?.nombre || '',
      Modelo: p.modelo || '',
      Voltaje: p.voltaje_nominal || '',
      'Vida Útil (años)': p.vida_util_anos || '',
      'Factor Deg.': p.factor_degradacion || '',
      'Unidad Medida': p.unidad_medida_vida || '',
      Activo: p.activo ? 'Sí' : 'No',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Productos')
    XLSX.writeFile(wb, `productos_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleImportExcel = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: 'binary' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet)
        for (const row of json) {
          const cat = categories.find(c => c.nombre === row.Categoría)
          const brand = brands.find(b => b.nombre === row.Marca)
          if (!cat) continue
          await productQueries.create({
            sku: row.SKU,
            nombre: row.Nombre,
            categoria_id: cat.id,
            marca_id: brand?.id || null,
            marca: row.Marca || '',
            modelo: row.Modelo || '',
            voltaje_nominal: row.Voltaje ? parseInt(row.Voltaje) : null,
            vida_util_anos: row['Vida Útil (años)'] ? parseFloat(row['Vida Útil (años)']) : null,
            factor_degradacion: row['Factor Deg.'] ? parseFloat(row['Factor Deg.']) : null,
            unidad_medida_vida: row['Unidad Medida'] || null,
            activo: row.Activo === 'Sí',
          })
        }
        await loadAll()
        e.target.value = ''
      } catch (err) {
        setError('Error importando: ' + err.message)
      }
    }
    reader.readAsBinaryString(file)
  }

  if (loading) return <Loading message="Cargando productos..." />

  const filteredProducts = products.filter(p =>
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.marcas?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="h-8 w-8 text-primary-600" />
              Catálogo de Productos (SKUs)
            </h1>
            <p className="text-slate-600 mt-2">SKUs maestros con especificaciones y configuración de obsolescencia</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2"><Download className="h-4 w-4" /> Exportar</button>
            <label className="btn-secondary flex items-center gap-2 cursor-pointer"><Upload className="h-4 w-4" /> Importar<input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" /></label>
            <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4" /> Nuevo SKU</button>
          </div>
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError(null)} className="mb-6" />}

        <div className="mb-6"><input type="text" placeholder="Buscar por SKU, nombre, marca..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input w-full max-w-md" /></div>

        <div className="card overflow-x-auto">
          <table className="table w-full">
            <thead><tr className="bg-slate-50"><th>SKU</th><th>Nombre</th><th>Categoría</th><th>Marca</th><th>Modelo</th><th>Voltaje</th><th>Vida Útil</th><th>Activo</th><th>Acciones</th></tr></thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="font-mono text-sm">{p.sku}</td>
                  <td className="font-medium">{p.nombre}</td>
                  <td><span className="badge badge-primary">{p.categorias_producto?.nombre || '—'}</span></td>
                  <td>{p.marcas?.nombre || '—'}</td>
                  <td className="text-sm">{p.modelo || '—'}</td>
                  <td>{p.voltaje_nominal ? `${p.voltaje_nominal}V` : '—'}</td>
                  <td className="text-sm">{p.vida_util_anos ? `${p.vida_util_anos} años` : (p.categorias_producto?.vida_util_anos || '—')}</td>
                  <td><span className={`badge ${p.activo ? 'badge-success' : 'badge-danger'}`}>{p.activo ? 'Sí' : 'No'}</span></td>
                  <td><button onClick={() => handleOpenEdit(p)} className="text-primary-600 hover:text-primary-700 mr-3"><Edit2 className="h-4 w-4" /></button><button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="bg-primary-600 text-white p-4 flex items-center justify-between"><h3 className="text-lg font-bold">{editingProduct ? 'Editar' : 'Crear'} Producto</h3><button onClick={() => setShowModal(false)} className="text-white hover:bg-primary-700 p-1 rounded"><FileSpreadsheet className="h-5 w-5" /></button></div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label><input type="text" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })} className="input w-full text-sm" placeholder="BAT-48V-10KWH" required disabled={editingProduct} /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label><input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="input w-full text-sm" required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label><select value={formData.categoria_id} onChange={e => setFormData({ ...formData, categoria_id: e.target.value })} className="input w-full text-sm" required><option value="">Seleccionar...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Marca</label><select value={formData.marca_id} onChange={e => setFormData({ ...formData, marca_id: e.target.value, marca: e.target.options[e.target.selectedIndex]?.text || '' })} className="input w-full text-sm"><option value="">Seleccionar...</option>{brands.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label><input type="text" value={formData.modelo} onChange={e => setFormData({ ...formData, modelo: e.target.value })} className="input w-full text-sm" placeholder="PowerBox 10" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Voltaje (V)</label><select value={formData.voltaje_nominal || ''} onChange={e => setFormData({ ...formData, voltaje_nominal: e.target.value })} className="input w-full text-sm"><option value="">—</option><option value="12">12</option><option value="24">24</option><option value="48">48</option></select></div>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label><textarea value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} className="input w-full text-sm" rows="2" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Especificaciones (JSON)</label><textarea value={formData.especificaciones} onChange={e => setFormData({ ...formData, especificaciones: e.target.value })} className="input w-full text-sm font-mono" rows="3" placeholder='{"capacidad_kwh": 10.5, "amperios": 210}' /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Vida Útil (años)</label><input type="number" step="0.1" value={formData.vida_util_anos} onChange={e => setFormData({ ...formData, vida_util_anos: e.target.value })} className="input w-full text-sm" placeholder="Usa categoría si vacío" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Factor Degradación</label><input type="number" step="0.00001" value={formData.factor_degradacion} onChange={e => setFormData({ ...formData, factor_degradacion: e.target.value })} className="input w-full text-sm" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Unidad Medida</label><select value={formData.unidad_medida_vida} onChange={e => setFormData({ ...formData, unidad_medida_vida: e.target.value })} className="input w-full text-sm"><option value="">Usa categoría</option><option value="ANOS">Años</option><option value="CICLOS">Ciclos</option><option value="HORAS">Horas</option><option value="KM">KM</option></select></div>
                </div>
                <div className="flex items-center gap-2"><input type="checkbox" id="activo" checked={formData.activo} onChange={e => setFormData({ ...formData, activo: e.target.checked })} className="h-4 w-4" /><label htmlFor="activo" className="text-sm text-slate-700">Activo</label></div>
                <div className="flex gap-2 justify-end border-t border-slate-200 pt-4"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">{editingProduct ? 'Actualizar' : 'Crear'}</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}