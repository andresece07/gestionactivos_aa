import { useState } from 'react'

export function useScheduleGrid() {
  const [isSelecting, setIsSelecting] = useState(false)
  const [startCell, setStartCell] = useState(null)
  const [selectedDates, setSelectedDates] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    estado: 'TURNO',
    motivo: '',
  })

  const handleCellMouseDown = (employeeId, date) => {
    if (selectedEmployee && selectedEmployee !== employeeId) return

    setIsSelecting(true)
    setStartCell(date)
    setSelectedEmployee(employeeId)
    setSelectedDates([date])
  }

  const handleCellMouseEnter = (employeeId, date) => {
    if (!isSelecting || selectedEmployee !== employeeId || !startCell) return

    const start = new Date(startCell)
    const current = new Date(date)
    const dates = []

    const minDate = start < current ? start : current
    const maxDate = start < current ? current : start

    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0])
    }

    setSelectedDates(dates)
  }

  const handleCellMouseUp = () => {
    setIsSelecting(false)
    if (selectedDates.length >= 2 && selectedEmployee) {
      setShowModal(true)
    }
  }

  const resetSelection = () => {
    setSelectedDates([])
    setSelectedEmployee(null)
    setShowModal(false)
    setFormData({ estado: 'TURNO', motivo: '' })
  }

  return {
    isSelecting,
    startCell,
    selectedDates,
    selectedEmployee,
    showModal,
    formData,
    setFormData,
    setShowModal,
    setSelectedEmployee,
    setSelectedDates,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleCellMouseUp,
    resetSelection,
  }
}
