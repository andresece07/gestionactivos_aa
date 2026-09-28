import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { categoryQueries, supabase } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/Error'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo_obsolescencia: 'LINEAL',
    vida_util_anos: 10,
    factor_degradacion: 0.0005,
    unidad_medida_vida: 'ANOS',
    campos_esquema: '{}',
    activo: true,
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await categoryQueries.getAll()
      if (fetchError) throw fetchError
      setCategories(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingCategory(null)
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo_obsolescencia: 'LINEAL',
      vida_util_anos: 10,
      factor_degradacion: 0.0005,
      unidad_medida_vida: 'ANOS',
      campos_esquema: '{}',
      activo: true,
    })
    setShowModal(true)
  }

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat)
    setFormData({
      codigo: cat.codigo,
      nombre: cat.nombre,
      descripcion: cat.descripcion || '',
      tipo_obsolescencia: cat.tipo_obsolescencia,
      vida_util_anos: cat.vida_util_anos,
      factor_degradacion: cat.factor_degradacion,
      unidad_medida_vida: cat.unidad_medida_vida,
      campos_esquema: JSON.stringify(cat.campos_esquema || {}, null, 2),
      activo: cat.activo,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        const { error } = await categoryQueries.update(editingCategory.id, {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          tipo_obsolescencia: formData.tipo_obsolescencia,
          vida_util_anos: parseFloat(formData.vida_util_anos),
          factor_degradacion: parseFloat(formData.factor_degradacion),
          unidad_medida_vida: formData.unidad_medida_vida,
          campos_esquema: JSON.parse(formData.campos_esquema || '{}'),
          activo: formData.activo,
        })
        if (error) throw error
      } else {
        const { error } = await categoryQueries.create({
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          tipo_obsolescencia: formData.tipo_obsolescencia,
          vida_util_anos: parseFloat(formData.vida_util_anos),
          factor_degradacion: parseFloat(formData.factor_degradacion),
          unidad_medida_vida: formData.unidad_medida_vida,
          campos_esquema: JSON.parse(formData.campos_esquema || '{}'),
          activo: formData.activo,
        })
        if (error) throw error
      }
      setShowModal(false)
      await loadCategories()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return
    try {
      const { error } = await supabase.from('categorias_producto').delete().eq('id', id)
      if (error) throw error
      await loadCategories()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <Loading message="Cargando categorías..." />

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-primary-600" />
              Categorías de Productos
            </h1>
            <p className="text-slate-600 mt-2">Configuración de obsolescencia por tipo de producto</p>
          </div>
          <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Categoría
          </button>
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError(null)} className="mb-6" />}

        <div className="card overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-slate-50">
                <th>Código</th>
                <th>Nombre</th>
                <th>Obsolescencia</th>
                <th>Vida Útil</th>
                <th>Factor Deg.</th>
                <th>Unidad</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50">
                  <td className="font-mono text-sm">{cat.codigo}</td>
                  <td className="font-medium">{cat.nombre}</td>
                  <td>
                    <span className="badge badge-primary">{cat.tipo_obsolescencia}</span>
                  </td>
                  <td>{cat.vida_util_anos} años</td>
                  <td>{(cat.factor_degradacion * 10000).toFixed(2)}% por unidad</td>
                  <td>{cat.unidad_medida_vida}</td>
                  <td>
                    <span className={`badge ${cat.activo ? 'badge-success' : 'badge-danger'}`}>
                      {cat.activo ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleOpenEdit(cat)} className="text-primary-600 hover:text-primary-700 mr-3">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {categories.length === 0 && (
          <div className="card text-center py-12">
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No hay categorías configuradas</p>
            <button onClick={handleOpenCreate} className="btn-primary mt-4">Crear primera categoría</button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">{editingCategory ? 'Editar' : 'Crear'} Categoría</h3>
                <button onClick={() => setShowModal(false)} className="text-white hover:bg-primary-700 p-1 rounded">
                  <AlertCircle className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Código *</label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={e => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                      className="input w-full text-sm"
                      placeholder="BAT, PAN, INV..."
                      required
                      disabled={editingCategory}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                      className="input w-full text-sm"
                      placeholder="Baterías, Paneles, Inversores..."
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                    className="input w-full text-sm"
                    rows="2"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Obsolescencia</label>
                    <select
                      value={formData.tipo_obsolescencia}
                      onChange={e => setFormData({ ...formData, tipo_obsolescencia: e.target.value })}
                      className="input w-full text-sm"
                    >
                      <option value="LINEAL">Lineal</option>
                      <option value="EXPONENCIAL">Exponencial</option>
                      <option value="POR_USO">Por Uso</option>
                      <option value="POR_TIEMPO">Por Tiempo</option>
                      <option value="PERSONALIZADA">Personalizada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vida Útil (años)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formData.vida_util_anos}
                      onChange={e => setFormData({ ...formData, vida_util_anos: e.target.value })}
                      className="input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Factor Degradación</label>
                    <input
                      type="number"
                      step="0.00001"
                      min="0"
                      value={formData.factor_degradacion}
                      onChange={e => setFormData({ ...formData, factor_degradacion: e.target.value })}
                      className="input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unidad Medida</label>
                    <select
                      value={formData.unidad_medida_vida}
                      onChange={e => setFormData({ ...formData, unidad_medida_vida: e.target.value })}
                      className="input w-full text-sm"
                    >
                      <option value="ANOS">Años</option>
                      <option value="CICLOS">Ciclos</option>
                      <option value="HORAS">Horas</option>
                      <option value="KM">Kilómetros</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Campos Esquema (JSON)</label>
                  <textarea
                    value={formData.campos_esquema}
                    onChange={e => setFormData({ ...formData, campos_esquema: e.target.value })}
                    className="input w-full text-sm font-mono"
                    rows="3"
                    placeholder='{"voltaje_nominal": "number", "capacidad_kwh": "number"}'
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <label htmlFor="activo" className="text-sm text-slate-700">Activo</label>
                </div>
                <div className="flex gap-2 justify-end border-t border-slate-200 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingCategory ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}