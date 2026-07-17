import { AlertCircle, X } from 'lucide-react'
import { useState } from 'react'

export const ErrorAlert = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!isVisible) return null

  return (
    <div className="bg-danger-100 border border-danger-500 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-danger-900 font-medium">{message}</p>
      </div>
      <button
        onClick={handleClose}
        className="text-danger-600 hover:text-danger-900"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

export const ErrorPage = ({ message = 'Algo salió mal', onRetry }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <AlertCircle className="h-16 w-16 text-danger-600 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Error</h2>
      <p className="text-slate-600 mb-6">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          Reintentar
        </button>
      )}
    </div>
  </div>
)
