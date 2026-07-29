import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Download, Printer } from 'lucide-react'
import * as XLSX from 'xlsx'
import { batteryQueries } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorPage } from '../components/Error'

export default function BatteryLifeUtilReportPage() {
  const navigate = useNavigate()
  const [batteries, setBatteries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadBatteriesWithExpiredLifeUtil()
  }, [])

  const loadBatteriesWithExpiredLifeUtil = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await batteryQueries.getWithLifeUtilExpired()

      if (fetchError) throw fetchError
      setBatteries(data || [])
    } catch (err) {
      setError(err.message || 'Error cargando reporte')
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = () => {
    if (batteries.length === 0) {
      alert('No hay baterías para descargar')
      return
    }

    try {
      const data = batteries.map(battery => ({
        'Código Único': battery.codigo_unico,
        'SKU': battery.sku_dynamics,
        'Piscina': battery.piscina,
        'Zona': battery.zona,
        'Finca': battery.finca || '—',
        'Tolva': battery.tolva || '—',
        'Voltaje (V)': battery.voltaje_nominal,
        'Amperios (A)': battery.amperios,
        'Fecha Instalación': new Date(battery.fecha_instalacion).toLocaleDateString(),
        'Días Operación': battery.dias_desde_instalacion,
        'Años Operación': battery.años_operacion,
        'Capacidad Residual %': battery.capacidad_residual_pct.toFixed(2),
        'Capacidad Residual (A)': battery.capacidad_residual.toFixed(2),
        'Estado': battery.estado,
      }))

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Vida Útil Cumplida')

      // Ajustar ancho de columnas
      const colWidths = [15, 12, 15, 12, 12, 12, 12, 12, 18, 15, 15, 18, 18, 12]
      ws['!cols'] = colWidths.map(width => ({ wch: width }))

      // Descargar
      const fileName = `reporte_vida_util_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (err) {
      alert('Error al descargar Excel: ' + err.message)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return <Loading message="Cargando reporte..." />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <button
          onClick={() => navigate('/baterias')}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Baterías
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Reporte de Baterías - Vida Útil Cumplida
            </h1>
          </div>
          <p className="text-slate-600 mt-2">
            Baterías que han cumplido su tiempo de vida útil (10 años / 3650 días)
          </p>
        </div>

        {/* Controles */}
        {batteries.length > 0 && (
          <div className="mb-6 flex gap-2">
            <button
              onClick={handleExportExcel}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar Excel
            </button>
            <button
              onClick={handlePrint}
              className="btn-secondary flex items-center gap-2 print:hidden"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          </div>
        )}

        {error && (
          <ErrorPage
            message={error}
            onRetry={() => loadBatteriesWithExpiredLifeUtil()}
          />
        )}

        {/* Tabla */}
        {batteries.length > 0 ? (
          <div className="card overflow-x-auto">
            <table className="table w-full text-sm">
              <thead>
                <tr className="bg-red-50">
                  <th className="text-left">Código Único</th>
                  <th className="text-left">SKU</th>
                  <th className="text-left">Piscina</th>
                  <th className="text-center">Voltaje</th>
                  <th className="text-center">Amperios</th>
                  <th className="text-center">Días Operación</th>
                  <th className="text-center">Años</th>
                  <th className="text-center">Capacidad %</th>
                  <th className="text-center">Capacidad A</th>
                </tr>
              </thead>
              <tbody>
                {batteries.map(battery => (
                  <tr key={battery.id} className="border-b border-slate-200 hover:bg-red-50">
                    <td className="font-medium text-slate-900">{battery.codigo_unico}</td>
                    <td className="text-slate-600">{battery.sku_dynamics}</td>
                    <td className="text-slate-600">{battery.piscina}</td>
                    <td className="text-center text-slate-900">{battery.voltaje_nominal}V</td>
                    <td className="text-center text-slate-900">{battery.amperios}A</td>
                    <td className="text-center text-red-600 font-semibold">
                      {battery.dias_desde_instalacion}
                    </td>
                    <td className="text-center text-slate-900">{battery.años_operacion}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-red-600 h-full"
                            style={{
                              width: `${Math.min(battery.capacidad_residual_pct, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {battery.capacidad_residual_pct.toFixed(1)}%
                      </p>
                    </td>
                    <td className="text-center text-slate-900">
                      {battery.capacidad_residual.toFixed(2)}A
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-12">
            <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">
              No hay baterías con vida útil cumplida
            </p>
            <p className="text-slate-500 mt-2">
              Todas las baterías registradas están dentro de su tiempo de vida útil
            </p>
          </div>
        )}

        {/* Resumen */}
        {batteries.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <p className="text-slate-600 text-sm font-medium">Total Baterías</p>
              <p className="text-3xl font-bold text-red-600">{batteries.length}</p>
            </div>
            <div className="card">
              <p className="text-slate-600 text-sm font-medium">Promedio Días Operación</p>
              <p className="text-3xl font-bold text-slate-900">
                {Math.round(
                  batteries.reduce((sum, b) => sum + b.dias_desde_instalacion, 0) /
                    batteries.length
                )}
              </p>
            </div>
            <div className="card">
              <p className="text-slate-600 text-sm font-medium">Capacidad Promedio</p>
              <p className="text-3xl font-bold text-slate-900">
                {(
                  batteries.reduce((sum, b) => sum + b.capacidad_residual_pct, 0) /
                  batteries.length
                ).toFixed(1)}
                %
              </p>
            </div>
          </div>
        )}

        {/* Notas */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-900">
            <strong>⚠️ Importante:</strong> Las baterías listadas han cumplido su tiempo de vida
            útil de 10 años. Se recomienda hacer una evaluación técnica y considerar su
            reemplazo para mantener el rendimiento óptimo del sistema.
          </p>
        </div>
      </div>
    </div>
  )
}
