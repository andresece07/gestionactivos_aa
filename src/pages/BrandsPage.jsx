import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react'
import { brandQueries, supabase } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/Error'

export default function BrandsPage() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    pais_origen: '',
    sitio_web: '',
    activo: true,
  })

  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await brandQueries.getAll()
      if (fetchError) throw fetchError
      setBrands(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingBrand(null)
    setFormData({ codigo: '', nombre: '', descripcion: '', pais_origen: '', sitio_web: '', activo: true })
    setShowModal(true)
  }

  const handleOpenEdit = (brand) => {
    setEditingBrand(brand)
    setFormData({
      codigo: brand.codigo,
      nombre: brand.nombre,
      descripcion: brand.descripcion || '',
      pais_origen: brand.pais_origen || '',
      sitio_web: brand.sitio_web || '',
      activo: brand.activo,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingBrand) {
        const { error } = await brandQueries.update(editingBrand.id, {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          pais_origen: formData.pais_origen,
          sitio_web: formData.sitio_web,
          activo: formData.activo,
        })
        if (error) throw error
      } else {
        const { error } = await brandQueries.create({
          codigo: formData.codigo.toUpperCase(),
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          pais_origen: formData.pais_origen,
          sitio_web: formData.sitio_web,
          activo: formData.activo,
        })
        if (error) throw error
      }
      setShowModal(false)
      await loadBrands()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta marca?')) return
    try {
      const { error } = await supabase.from('marcas').delete().eq('id', id)
      if (error) throw error
      await loadBrands()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <Loading message="Cargando marcas..." />

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary-600" />
              Marcas
            </h1>
            <p className="text-slate-600 mt-2">Fabricantes de equipos (cargable desde Excel)</p>
          </div>
          <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Marca
          </button>
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError(null)} className="mb-6" />}

        <div className="card overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-slate-50">
                <th>Código</th>
                <th>Nombre</th>
                <th>País</th>
                <th>Web</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {brands.map(brand => (
                <tr key={brand.id} className="hover:bg-slate-50">
                  <td className="font-mono text-sm">{brand.codigo}</td>
                  <td className="font-medium">{brand.nombre}</td>
                  <td>{brand.pais_origen || '—'}</td>
                  <td>{brand.sitio_web ? <a href={brand.sitio_web} target="_blank" rel="noopener" className="text-primary-600 text-sm">{brand.sitio_web}</a> : '—'}</td>
                  <td><span className={`badge ${brand.activo ? 'badge-success' : 'badge-danger'}`}>{brand.activo ? 'Sí' : 'No'}</span></td>
                  <td>
                    <button onClick={() => handleOpenEdit(brand)} className="text-primary-600 hover:text-primary-700 mr-3"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(brand.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {brands.length === 0 && <div className="card text-center py-12"><Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-600">No hay marcas configuradas</p><button onClick={handleOpenCreate} className="btn-primary mt-4">Crear primera marca</button></div>}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
              <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">{editingBrand ? 'Editar' : 'Crear'} Marca</h3>
                <button onClick={() => setShowModal(false)} className="text-white hover:bg-primary-700 p-1 rounded"><Building2 className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Código *</label><input type="text" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })} className="input w-full text-sm" placeholder="DYN, JNK, LON..." required disabled={editingBrand} /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label><input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="input w-full text-sm" placeholder="Dyness, Jinko Solar..." required /></div>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label><textarea value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} className="input w-full text-sm" rows="2" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">País de Origen</label><input type="text" value={formData.pais_origen} onChange={e => setFormData({ ...formData, pais_origen: e.target.value })} className="input w-full text-sm" placeholder="China, Alemania, Países Bajos..." /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Sitio Web</label><input type="url" value={formData.sitio_web} onChange={e => setFormData({ ...formData, sitio_web: e.target.value })} className="input w-full text-sm" placeholder="https://ejemplo.com" /></div>
                </div>
                <div className="flex items-center gap-2"><input type="checkbox" id="activo" checked={formData.activo} onChange={e => setFormData({ ...formData, activo: e.target.checked })} className="h-4 w-4" /><label htmlFor="activo" className="text-sm text-slate-700">Activo</label></div>
                <div className="flex gap-2 justify-end border-t border-slate-200 pt-4"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">{editingBrand ? 'Actualizar' : 'Crear'}</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}