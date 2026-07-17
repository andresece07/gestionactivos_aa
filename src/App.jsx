import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Navbar } from './components/Navbar'
import { Loading } from './components/Loading'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import BatteriesPage from './pages/BatteriesPage'
import BatteryDetailPage from './pages/BatteryDetailPage'
import StoppagePage from './pages/StoppagePage'
import CronogramaPage from './pages/CronogramaPage'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  return (
    <BrowserRouter>
      {isAuthenticated && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/baterias"
          element={
            <ProtectedRoute>
              <BatteriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/baterias/:id"
          element={
            <ProtectedRoute>
              <BatteryDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/paros"
          element={
            <ProtectedRoute>
              <StoppagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cronograma"
          element={
            <ProtectedRoute>
              <CronogramaPage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
