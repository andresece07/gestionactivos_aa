import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, LogOut, User, Home, Package, LayoutDashboard, CalendarDays, Database } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showCatalogs, setShowCatalogs] = useState(false)
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  if (!user) return null

  const links = [
    { to: '/', label: 'Inicio', icon: Home },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/activos', label: 'Activos', icon: Package },
    { to: '/cronograma', label: 'Cronograma', icon: CalendarDays },
    { to: '/baterias', label: 'Baterías (legado)', icon: Database },
  ]

  const catalogLinks = [
    { to: '/productos', label: 'Productos / SKUs' },
    { to: '/categorias', label: 'Categorías' },
    { to: '/marcas', label: 'Marcas' },
    { to: '/fincas', label: 'Fincas' },
    { to: '/zonas', label: 'Zonas' },
    { to: '/tolvas', label: 'Tolvas' },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary-600">
            <Package className="h-6 w-6" />
            <span className="hidden sm:inline">Gestión de Activos</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {links.map(l => {
              const Icon = l.icon
              return (
                <Link key={l.to} to={l.to} className="flex items-center gap-2 text-slate-600 hover:text-primary-600 text-sm">
                  <Icon className="h-4 w-4" />
                  {l.label}
                </Link>
              )
            })}
            <div className="relative group">
              <button className="flex items-center gap-2 text-slate-600 hover:text-primary-600 text-sm">
                <Database className="h-4 w-4" />
                Catálogos
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg hidden group-hover:block z-20">
                {catalogLinks.map(c => (
                  <Link key={c.to} to={c.to} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <User className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="hidden sm:inline-flex items-center gap-2 text-slate-600 hover:text-danger-600 btn-secondary btn-sm"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>

            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 border-t border-slate-200">
            <div className="py-2">
              {links.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setIsOpen(false)} className="block px-2 py-2 rounded hover:bg-slate-100 text-slate-600">
                  {l.label}
                </Link>
              ))}
              <button onClick={() => setShowCatalogs(!showCatalogs)} className="w-full text-left px-2 py-2 rounded hover:bg-slate-100 text-slate-600">
                Catálogos {showCatalogs ? '▲' : '▼'}
              </button>
              {showCatalogs && catalogLinks.map(c => (
                <Link key={c.to} to={c.to} onClick={() => setIsOpen(false)} className="block px-6 py-2 rounded hover:bg-slate-100 text-slate-600 text-sm">
                  {c.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="px-2 py-2 text-sm text-slate-600">{user.email}</div>
              <button onClick={handleSignOut} className="w-full text-left px-2 py-2 rounded hover:bg-slate-100 text-danger-600 flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
