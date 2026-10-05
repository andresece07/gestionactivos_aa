import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Navbar } from './components/Navbar'
import { Loading } from './components/Loading'
import { ErrorBoundary } from './components/ErrorBoundary'
import LoginPage from './pages/LoginPage'
import ModulesPage from './pages/ModulesPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const BatteriesPage = lazy(() => import('./pages/BatteriesPage'))
const BatteryDetailPage = lazy(() => import('./pages/BatteryDetailPage'))
const CreateBatteryPage = lazy(() => import('./pages/CreateBatteryPage'))
const BatteryLifeUtilReportPage = lazy(() => import('./pages/BatteryLifeUtilReportPage'))
const CronogramaPage = lazy(() => import('./pages/CronogramaPage'))
const QRScannerPage = lazy(() => import('./pages/QRScannerPage'))
const AssetsPage = lazy(() => import('./pages/AssetsPage'))
const AssetDetailPage = lazy(() => import('./pages/AssetDetailPage'))
const CreateAssetPage = lazy(() => import('./pages/CreateAssetPage'))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'))
const BrandsPage = lazy(() => import('./pages/BrandsPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const FarmsPage = lazy(() => import('./pages/FarmsPage'))
const ZonesPage = lazy(() => import('./pages/ZonesPage'))
const HoppersPage = lazy(() => import('./pages/HoppersPage'))

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

const LazyPage = ({ children }) => (
  <Suspense fallback={<Loading message="Cargando módulo..." />}>
    {children}
  </Suspense>
)

export default function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        {isAuthenticated && <Navbar />}
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ModulesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <LazyPage><DashboardPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/baterias"
            element={
              <ProtectedRoute>
                <LazyPage><BatteriesPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/baterias/nueva"
            element={
              <ProtectedRoute>
                <LazyPage><CreateBatteryPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/baterias/:id"
            element={
              <ProtectedRoute>
                <LazyPage><BatteryDetailPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/baterias/reporte-vida-util"
            element={
              <ProtectedRoute>
                <LazyPage><BatteryLifeUtilReportPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cronograma"
            element={
              <ProtectedRoute>
                <LazyPage><CronogramaPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/qr-scanner"
            element={
              <ProtectedRoute>
                <LazyPage><QRScannerPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/activos"
            element={
              <ProtectedRoute>
                <LazyPage><AssetsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/activos/nuevo"
            element={
              <ProtectedRoute>
                <LazyPage><CreateAssetPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/activos/:id"
            element={
              <ProtectedRoute>
                <LazyPage><AssetDetailPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/categorias"
            element={
              <ProtectedRoute>
                <LazyPage><CategoriesPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/marcas"
            element={
              <ProtectedRoute>
                <LazyPage><BrandsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/productos"
            element={
              <ProtectedRoute>
                <LazyPage><ProductsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fincas"
            element={
              <ProtectedRoute>
                <LazyPage><FarmsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/zonas"
            element={
              <ProtectedRoute>
                <LazyPage><ZonesPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tolvas"
            element={
              <ProtectedRoute>
                <LazyPage><HoppersPage /></LazyPage>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
