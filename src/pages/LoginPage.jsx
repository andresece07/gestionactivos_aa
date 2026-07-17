import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Battery, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { ErrorAlert } from '../components/Error'
import { LoadingSpinner } from '../components/Loading'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)

    if (!email || !password) {
      setLocalError('Por favor completa todos los campos')
      return
    }

    const result = await signIn(email, password)
    if (result.success) {
      navigate('/')
    } else {
      setLocalError(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Battery className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Gestión de Baterías
          </h1>
          <p className="text-slate-600">
            Sistema de registro FV en acuacultura
          </p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="text-xl font-bold mb-6 text-center">Iniciar Sesión</h2>

          {(error || localError) && (
            <div className="mb-4">
              <ErrorAlert
                message={error || localError}
                onClose={() => setLocalError(null)}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="tu@ejemplo.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input w-full"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center mb-3">
              Credenciales de prueba (desarrollo):
            </p>
            <code className="text-xs bg-slate-100 p-2 rounded block text-slate-600 mb-1">
              usuario@omarsa.com
            </code>
            <code className="text-xs bg-slate-100 p-2 rounded block text-slate-600">
              Password123!
            </code>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          © 2024 OMARSA - Sistema de Gestión de Activos
        </p>
      </div>
    </div>
  )
}
