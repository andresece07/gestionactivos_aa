import { useEffect, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react'

export default function CronogramaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedRange, setSelectedRange] = useState(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [startCell, setStartCell] = useState(null)

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getDaysRange = () => {
    const days = []
    const firstDay = getFirstDayOfMonth(currentDate)
    const daysInMonth = getDaysInMonth(currentDate)

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
    }
    return days
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const days = getDaysRange()
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab']

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary-600" />
              Cronograma Interactivo
            </h1>
            <p className="text-slate-600 mt-2">
              Gestión de horarios y disponibilidad de personal
            </p>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 capitalize">{monthName}</h2>
            <div className="flex gap-2">
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
              <button className="btn-primary flex items-center gap-2">
                <Download className="h-4 w-4" />
                Excel
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300">
                  {dayNames.map(day => (
                    <th
                      key={day}
                      className="px-4 py-3 text-center font-semibold text-slate-700 min-w-24"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array(Math.ceil(days.length / 7))
                  .fill(0)
                  .map((_, weekIndex) => (
                    <tr key={weekIndex} className="border-b border-slate-200">
                      {days
                        .slice(weekIndex * 7, (weekIndex + 1) * 7)
                        .map((day, dayIndex) => (
                          <td
                            key={dayIndex}
                            className="px-4 py-3 min-w-24 min-h-24 border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition"
                          >
                            {day && (
                              <div className="text-center">
                                <div className="text-lg font-bold text-slate-900">
                                  {day.getDate()}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {day.toLocaleDateString('es-ES', {
                                    weekday: 'short',
                                  })}
                                </div>
                              </div>
                            )}
                          </td>
                        ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-slate-700">
          <p className="text-sm">
            💡 <strong>Próximamente:</strong> Funcionalidad de cronograma completa con gestión de empleados y disponibilidad
          </p>
        </div>
      </div>
    </div>
  )
}
