import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) this.props.onReset()
    else window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-16 w-16 text-danger-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Algo salió mal</h2>
            <p className="text-slate-600 mb-2">La aplicación encontró un error inesperado.</p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-xs text-left bg-slate-100 p-3 rounded mb-4 overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2 justify-center">
              <button onClick={this.handleReset} className="btn-primary">Volver al inicio</button>
              <button onClick={() => window.location.reload()} className="btn-secondary">Recargar</button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
