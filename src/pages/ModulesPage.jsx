import { useNavigate } from 'react-router-dom'
import { Zap, Calendar, BarChart3, Package, Database, Tags, Building2, FileSpreadsheet, MapPin, Map, Box } from 'lucide-react'

export default function ModulesPage() {
  const navigate = useNavigate()

  const modules = [
    {
      icon: BarChart3,
      title: 'Dashboard',
      description: 'Obsolescencia y monitoreo',
      path: '/dashboard',
      color: 'text-blue-600'
    },
    {
      icon: Package,
      title: 'Activos',
      description: 'Inventario general (cualquier artículo)',
      path: '/activos',
      color: 'text-indigo-600'
    },
    {
      icon: FileSpreadsheet,
      title: 'Productos / SKUs',
      description: 'Catálogo maestro con voltaje y marca',
      path: '/productos',
      color: 'text-violet-600'
    },
    {
      icon: Tags,
      title: 'Categorías',
      description: 'Tipos + obsolescencia',
      path: '/categorias',
      color: 'text-pink-600'
    },
    {
      icon: Building2,
      title: 'Marcas',
      description: 'Fabricantes',
      path: '/marcas',
      color: 'text-slate-600'
    },
    {
      icon: MapPin,
      title: 'Fincas',
      description: 'Ubicaciones (Excel)',
      path: '/fincas',
      color: 'text-green-700'
    },
    {
      icon: Map,
      title: 'Zonas',
      description: 'Subdivisiones por finca',
      path: '/zonas',
      color: 'text-teal-600'
    },
    {
      icon: Box,
      title: 'Tolvas',
      description: 'Puntos por zona',
      path: '/tolvas',
      color: 'text-orange-600'
    },
    {
      icon: Zap,
      title: 'Baterías (legado)',
      description: 'Gestión anterior',
      path: '/baterias',
      color: 'text-yellow-600'
    },
    {
      icon: Calendar,
      title: 'Cronograma',
      description: 'Personal y horarios',
      path: '/cronograma',
      color: 'text-green-600'
    },
    {
      icon: Database,
      title: 'QR Scanner',
      description: 'Buscar por código',
      path: '/qr-scanner',
      color: 'text-cyan-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Sistema de Gestión de Activos
          </h1>
          <p className="text-lg text-slate-600">
            Catálogo general: cualquier artículo, obsolescencia por categoría, SKU / Finca / Zona / Tolva desde listas
          </p>
        </div>

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

        <div className="text-center mt-12 text-slate-600 text-sm">
          <p>© 2024 OMARSA - Sistema de Gestión de Activos</p>
        </div>
      </div>
    </div>
  )
}
