import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, LogOut, User, Home, Battery, Calendar } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  if (!user) return null

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary-600">
            <Battery className="h-6 w-6" />
            <span className="hidden sm:inline">Gestión de Baterías</span>
          </Link>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-primary-600">
              <Home className="h-4 w-4" />
              Inicio
            </Link>
            <Link to="/baterias" className="flex items-center gap-2 text-slate-600 hover:text-primary-600">
              <Battery className="h-4 w-4" />
              Baterías
            </Link>
            <Link to="/cronograma" className="flex items-center gap-2 text-slate-600 hover:text-primary-600">
              <Calendar className="h-4 w-4" />
              Cronograma
            </Link>
          </div>

          {/* User Menu */}
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

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-slate-200">
            <div className="py-2">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="block px-2 py-2 rounded hover:bg-slate-100 text-slate-600"
              >
                Inicio
              </Link>
              <Link
                to="/baterias"
                onClick={() => setIsOpen(false)}
                className="block px-2 py-2 rounded hover:bg-slate-100 text-slate-600"
              >
                Baterías
              </Link>
              <Link
                to="/cronograma"
                onClick={() => setIsOpen(false)}
                className="block px-2 py-2 rounded hover:bg-slate-100 text-slate-600"
              >
                Cronograma
              </Link>
            </div>
            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="px-2 py-2 text-sm text-slate-600">
                {user.email}
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-2 py-2 rounded hover:bg-slate-100 text-danger-600 flex items-center gap-2"
              >
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
