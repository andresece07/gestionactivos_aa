import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react'
import { supplierQueries } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/Error'

export default function ProvidersPage() {
  const navigate = useNavigate()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    email: '',
    telefono: '',
    direccion: '',
  })

  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supplierQueries.getAll()
      if (fetchError) throw fetchError
      setProviders(data || [])
    } catch (err) {
      setError(err.message || 'Error cargando proveedores')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.nombre || !formData.contacto || !formData.email) {
      setError('Por favor completa los campos requeridos (nombre, contacto, email)')
      return
    }

    try {
      setSubmitting(true)

      if (editingId) {
        // Actualizar
        const { data, error: updateError } = await supplierQueries.update(editingId, formData)
        if (updateError) throw updateError
        setProviders(providers.map(p => p.id === editingId ? data[0] : p))
      } else {
        // Crear
        const { data, error: createError } = await supplierQueries.create(formData)
        if (createError) throw createError
        setProviders([...providers, data[0]])
      }

      // Reset form
      setFormData({
        nombre: '',
        contacto: '',
        email: '',
        telefono: '',
        direccion: '',
      })
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      setError(err.message || 'Error al guardar proveedor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (provider) => {
    setFormData({
      nombre: provider.nombre,
      contacto: provider.contacto || '',
      email: provider.email || '',
      telefono: provider.telefono || '',
      direccion: provider.direccion || '',
    })
    setEditingId(provider.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que quieres desactivar este proveedor?')) return

    try {
      const { error: deleteError } = await supplierQueries.deactivate(id)
      if (deleteError) throw deleteError
      setProviders(providers.filter(p => p.id !== id))
    } catch (err) {
      setError(err.message || 'Error al desactivar proveedor')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      nombre: '',
      contacto: '',
      email: '',
      telefono: '',
      direccion: '',
    })
  }

  if (loading) {
    return <Loading message="Cargando proveedores..." />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
            title="Volver"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
            <p className="text-gray-600 mt-1">Gestiona los proveedores de baterías</p>
          </div>
        </div>

        {/* Error */}
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-blue-500">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: BatteryTech Solutions"
                  />
                </div>

                {/* Contacto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contacto *
                  </label>
                  <input
                    type="text"
                    name="contacto"
                    value={formData.contacto}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Carlos Mendez"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contacto@example.com"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                {/* Dirección */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Calle 123, Santiago"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
                >
                  {submitting ? 'Guardando...' : 'Guardar Proveedor'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Crear nuevo botón */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 mb-6 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition"
          >
            <Plus size={20} />
            Crear Proveedor
          </button>
        )}

        {/* Providers List */}
        <div className="space-y-3">
          {providers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">No hay proveedores registrados</p>
            </div>
          ) : (
            providers.map(provider => (
              <div
                key={provider.id}
                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-green-500"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{provider.nombre}</h3>
                    <p className="text-sm text-gray-600">👤 {provider.contacto}</p>
                    <p className="text-sm text-gray-600">📧 {provider.email}</p>
                    {provider.telefono && (
                      <p className="text-sm text-gray-600">📱 {provider.telefono}</p>
                    )}
                    {provider.direccion && (
                      <p className="text-sm text-gray-600">📍 {provider.direccion}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(provider)}
                      className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(provider.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                      title="Desactivar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
