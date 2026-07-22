import { useNavigate } from 'react-router-dom'
import { Zap, Truck, Calendar, BarChart3 } from 'lucide-react'

export default function ModulesPage() {
  const navigate = useNavigate()

  const modules = [
    {
      icon: BarChart3,
      title: 'Dashboard',
      description: 'Estadísticas y monitoreo',
      path: '/dashboard',
      color: 'text-blue-600'
    },
    {
      icon: Zap,
      title: 'Baterías',
      description: 'Gestión y monitoreo',
      path: '/baterias',
      color: 'text-yellow-600'
    },
    {
      icon: Truck,
      title: 'Proveedores',
      description: 'Gestión de suministros',
      path: '/proveedores',
      color: 'text-orange-600'
    },
    {
      icon: Calendar,
      title: 'Cronograma',
      description: 'Personal y horarios',
      path: '/cronograma',
      color: 'text-green-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Sistema de Gestión de Activos
          </h1>
          <p className="text-lg text-slate-600">
            Gestión de Baterías Fotovoltaicas en Acuacultura
          </p>
        </div>

        {/* Módulos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const IconComponent = module.icon
            return (
              <button
                key={module.path}
                onClick={() => navigate(module.path)}
                className="group card hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition">
                      <IconComponent className={`h-10 w-10 ${module.color}`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {module.title}
                  </h3>
                  <p className="text-sm text-slate-600 group-hover:text-slate-700 transition">
                    {module.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-600 text-sm">
          <p>© 2024 OMARSA - Sistema de Gestión de Activos</p>
        </div>
      </div>
    </div>
  )
}
