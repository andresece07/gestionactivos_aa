import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, X, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { movimientosQueries } from '../lib/movimientosQueries'
import { ErrorAlert } from '../components/Error'
import { Loading } from '../components/Loading'

export default function QRScannerPage() {
  const navigate = useNavigate()
  const [qrInput, setQrInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleScan = async () => {
    if (!qrInput.trim()) {
      setError('Por favor ingresa o escanea un código QR')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      // El QR debe contener el código único de la batería
      const codigoUnico = qrInput.trim()

      // Buscar la batería por código único
      const { data: bateria, error: bateriaError } = await movimientosQueries.getByCodigoUnico(codigoUnico)

      if (bateriaError) {
        throw new Error(`Batería no encontrada: ${codigoUnico}`)
      }

      if (!bateria) {
        throw new Error('No se encontró batería con este código')
      }

      setSuccess(`✓ Batería encontrada: ${codigoUnico}`)
      setQrInput('')

      // Navegar al detalle de la batería después de 1 segundo
      setTimeout(() => {
        navigate(`/baterias/${bateria.id}`, { state: { scrollToHistorial: true } })
      }, 1000)
    } catch (err) {
      setError(err.message || 'Error al procesar código QR')
      setQrInput('')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleScan()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-6 inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 transition"
          >
            <X className="h-5 w-5" />
            Cerrar
          </button>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Camera className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Lectura de QR de Baterías
            </h1>
            <p className="text-lg text-slate-600">
              Escanea el código QR o ingresa el código único de la batería
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {/* Scanner Card */}
        <div className="card mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Código QR o Código Único de Batería
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="BAT-001-2024 o escanea aquí..."
                  className="input flex-1"
                  autoFocus
                  disabled={loading}
                />
                <button
                  onClick={handleScan}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      Escanear
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Nota:</strong> El código QR debe contener el código único de la batería (ej: BAT-001-2024).
                  Si tienes un dispositivo con cámara, puedes usar tu teléfono para escanear.
                  También puedes pegar el código manualmente.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ejemplos */}
        <div className="card">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Códigos de prueba</h2>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              Haz clic en un código para probarlo:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['BAT-001-2024', 'BAT-002-2024', 'BAT-003-2024', 'BAT-004-2024'].map((codigo) => (
                <button
                  key={codigo}
                  onClick={() => {
                    setQrInput(codigo)
                    setTimeout(() => {
                      handleScan()
                    }, 100)
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-mono text-slate-700 transition"
                >
                  {codigo}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-600 text-sm">
          <p>© 2024 OMARSA - Sistema de Gestión de Activos</p>
        </div>
      </div>
    </div>
  )
}
