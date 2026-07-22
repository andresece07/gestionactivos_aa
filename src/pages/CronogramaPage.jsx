import { useEffect, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Download, X, Plus } from 'lucide-react'
import * as XLSX from 'xlsx'
import { employeeQueries, scheduleQueries, supabase } from '../lib/supabaseClient'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/Error'
import { ScheduleCell } from '../components/ScheduleCell'
import { useScheduleGrid } from '../hooks/useScheduleGrid'

const ESTADO_COLORS = {
  TURNO: '#0d6efd',
  LIBRE: '#6c757d',
  ENFERMO: '#dc3545',
  VACACIONES: '#198754',
  FALTA: '#ffc107',
  PROGRAMADO: '#ffffff',
}

const ESTADO_LABELS = {
  TURNO: 'T',
  LIBRE: 'L',
  ENFERMO: 'E',
  VACACIONES: 'V',
  FALTA: 'F',
  PROGRAMADO: '—',
}

export default function CronogramaPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [scheduleData, setScheduleData] = useState({})
  const [employeeForm, setEmployeeForm] = useState({
    nombre: '',
    cargo: '',
  })

  const grid = useScheduleGrid()

  const DAYS_IN_RANGE = 35

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await employeeQueries.getAll()
      if (fetchError) throw fetchError

      setEmployees(data || [])

      if (data && data.length > 0) {
        await loadSchedule(data)
      }
    } catch (err) {
      setError(err.message || 'Error cargando empleados')
    } finally {
      setLoading(false)
    }
  }

  const loadSchedule = async (emps) => {
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        .toISOString()
        .split('T')[0]
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]

      const { data, error: fetchError } = await scheduleQueries.getRange(startDate, endDate)
      if (fetchError) throw fetchError

      const schedule = {}
      if (data) {
        data.forEach(record => {
          const key = `${record.empleado_id}-${record.fecha}`
          schedule[key] = record
        })
      }
      setScheduleData(schedule)
    } catch (err) {
      console.error('Error cargando cronograma:', err)
    }
  }

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const getDatesInRange = () => {
    const dates = []
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d))
    }
    return dates
  }


  const handleCellClick = (employeeId, date) => {
    if (grid.isSelecting) return

    const dateStr = date.toISOString().split('T')[0]
    grid.setSelectedEmployee(employeeId)
    grid.setSelectedDates([dateStr])
    grid.setShowModal(true)
  }

  const handleApply = async () => {
    if (!grid.selectedEmployee || grid.selectedDates.length === 0) return

    try {
      const startDate = grid.selectedDates[0]
      const endDate = grid.selectedDates[grid.selectedDates.length - 1]

      const { error: updateError } = await scheduleQueries.updateRange(
        grid.selectedEmployee,
        startDate,
        endDate,
        grid.formData.estado,
        grid.formData.motivo || null
      )

      if (updateError) throw updateError

      grid.resetSelection()
      await loadEmployees()
    } catch (err) {
      setError(err.message || 'Error al guardar cambios')
    }
  }

  const handleCreateEmployee = async () => {
    if (!employeeForm.nombre || !employeeForm.cargo) {
      setError('Por favor completa nombre y cargo')
      return
    }

    try {
      const colors = ['#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0', '#fce4ec']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]

      const { data, error: createError } = await supabase
        .from('empleados')
        .insert([{
          nombre: employeeForm.nombre,
          cargo: employeeForm.cargo,
          color: randomColor,
          activo: true,
        }])
        .select()

      if (createError) throw createError

      setShowEmployeeModal(false)
      setEmployeeForm({ nombre: '', cargo: '' })
      await loadEmployees()
    } catch (err) {
      setError(err.message || 'Error al crear empleado')
    }
  }

  const handleExportExcel = (orientation = 'horizontal') => {
    const dates = getDatesInRange()
    const data = []

    if (orientation === 'horizontal') {
      // Encabezado
      const header = {
        'Personal': 'Personal',
        ...Object.fromEntries(dates.map(d => [d.getDate().toString(), d.getDate()]))
      }
      data.push(header)

      // Datos
      employees.forEach(emp => {
        const row = { 'Personal': emp.nombre }
        dates.forEach(date => {
          const dateStr = date.toISOString().split('T')[0]
          const key = `${emp.id}-${dateStr}`
          const record = scheduleData[key]
          row[date.getDate().toString()] = record ? ESTADO_LABELS[record.estado] : '-'
        })
        data.push(row)
      })
    } else {
      // Vertical: Fecha en filas, empleados en columnas
      const header = {
        'Fecha': 'Fecha',
        ...Object.fromEntries(employees.map(emp => [emp.nombre, emp.nombre]))
      }
      data.push(header)

      dates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0]
        const row = { 'Fecha': date.toLocaleDateString('es-ES') }
        employees.forEach(emp => {
          const key = `${emp.id}-${dateStr}`
          const record = scheduleData[key]
          row[emp.nombre] = record ? ESTADO_LABELS[record.estado] : '-'
        })
        data.push(row)
      })
    }

    // Crear workbook Excel
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Cronograma')

    // Ajustar ancho de columnas
    const colWidth = orientation === 'horizontal' ? 12 : 20
    ws['!cols'] = Array(Object.keys(data[0] || {}).length).fill({ wch: colWidth })

    // Descargar
    const fileName = `cronograma_${orientation}_${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  if (loading) {
    return <Loading message="Cargando cronograma..." />
  }

  const dates = getDatesInRange()
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary-600" />
              Cronograma de Personal
            </h1>
            <p className="text-slate-600 mt-2">
              Gestión de horarios y disponibilidad
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </div>
        )}

        {/* Controls */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 capitalize">{monthName}</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handlePrevMonth}
                className="btn-secondary flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <button
                onClick={handleNextMonth}
                className="btn-secondary flex items-center gap-2"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowEmployeeModal(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Personal
              </button>
              <div className="relative group">
                <button className="btn-primary flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Descargar
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg hidden group-hover:block z-20">
                  <button
                    onClick={() => handleExportExcel('horizontal')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-200"
                  >
                    <Download className="h-4 w-4" />
                    Horizontal (Empleados en filas)
                  </button>
                  <button
                    onClick={() => handleExportExcel('vertical')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Vertical (Fechas en filas)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 min-w-40 sticky left-0 z-10 bg-slate-100">
                    Personal
                  </th>
                  {dates.map(date => (
                    <th
                      key={date.toISOString()}
                      className="px-2 py-3 text-center font-semibold text-slate-700 min-w-12"
                    >
                      <div className="text-sm">{date.getDate()}</div>
                      <div className="text-xs text-slate-500">
                        {date.toLocaleDateString('es-ES', { weekday: 'narrow' })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td
                      className="px-4 py-3 font-medium text-slate-900 sticky left-0 z-10 border-r-2 border-slate-300"
                      style={{ backgroundColor: emp.color || '#f1f5f9' }}
                    >
                      <div>{emp.nombre}</div>
                      <div className="text-xs text-slate-500">{emp.cargo}</div>
                    </td>
                    {dates.map(date => {
                      const dateStr = date.toISOString().split('T')[0]
                      const key = `${emp.id}-${dateStr}`
                      const record = scheduleData[key]
                      const isSelected = grid.selectedDates.includes(dateStr) && grid.selectedEmployee === emp.id

                      return (
                        <ScheduleCell
                          key={dateStr}
                          record={record}
                          date={date}
                          employeeId={emp.id}
                          isSelected={isSelected}
                          onMouseDown={grid.handleCellMouseDown}
                          onMouseEnter={grid.handleCellMouseEnter}
                          onMouseUp={grid.handleCellMouseUp}
                          onClick={handleCellClick}
                        />
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="card">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            <strong>💡 Tip:</strong> Haz <strong>clic</strong> en un cuadro para alternar entre Libre y Turno. Usa <strong>drag</strong> para aplicar un estado a varios días.
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: ESTADO_COLORS.TURNO }}
              />
              <span className="text-sm text-slate-700">Turno</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: ESTADO_COLORS.LIBRE }}
              />
              <span className="text-sm text-slate-700">Libre</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: ESTADO_COLORS.ENFERMO }}
              />
              <span className="text-sm text-slate-700">Enfermo</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: ESTADO_COLORS.VACACIONES }}
              />
              <span className="text-sm text-slate-700">Vacaciones</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: ESTADO_COLORS.FALTA }}
              />
              <span className="text-sm text-slate-700">Falta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-slate-300" />
              <span className="text-sm text-slate-700">Programado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cambio de Estado */}
      {grid.showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Aplicar a Selección</h3>
              <button
                onClick={() => grid.setShowModal(false)}
                className="text-white hover:bg-primary-700 p-1 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estado
                </label>
                <select
                  value={grid.formData.estado}
                  onChange={e => grid.setFormData({ ...grid.formData, estado: e.target.value })}
                  className="input w-full"
                >
                  {Object.entries(ESTADO_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {key === 'TURNO' ? 'En Turno' : key === 'LIBRE' ? 'Día Libre' : key}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Motivo (Opcional)
                </label>
                <textarea
                  value={grid.formData.motivo}
                  onChange={e => grid.setFormData({ ...grid.formData, motivo: e.target.value })}
                  className="input w-full"
                  rows="3"
                  placeholder="Ej: Enfermedad, vacaciones programadas..."
                />
              </div>

              <p className="text-sm text-slate-600">
                <strong>Rango:</strong> {grid.selectedDates[0]} a {grid.selectedDates[grid.selectedDates.length - 1]} ({grid.selectedDates.length} días)
              </p>
            </div>

            <div className="bg-slate-100 px-6 py-4 flex gap-2 justify-end">
              <button onClick={() => grid.setShowModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleApply} className="btn-primary">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Personal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Nuevo Personal</h3>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="text-white hover:bg-primary-700 p-1 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={employeeForm.nombre}
                  onChange={e => setEmployeeForm({ ...employeeForm, nombre: e.target.value })}
                  className="input w-full"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cargo *
                </label>
                <input
                  type="text"
                  value={employeeForm.cargo}
                  onChange={e => setEmployeeForm({ ...employeeForm, cargo: e.target.value })}
                  className="input w-full"
                  placeholder="Ej: Técnico, Operario"
                />
              </div>
            </div>

            <div className="bg-slate-100 px-6 py-4 flex gap-2 justify-end">
              <button onClick={() => setShowEmployeeModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleCreateEmployee} className="btn-primary">
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
