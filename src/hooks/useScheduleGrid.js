import { useState, useCallback, useEffect } from 'react'

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
  // Quick edit modal for single cell corrections
  const [quickEdit, setQuickEdit] = useState(null)

  // Auto-set formData for quick edit (toggle from current state)
  useEffect(() => {
    if (quickEdit) {
      const oppositeState = quickEdit.currentState === 'TURNO' ? 'LIBRE' : 'TURNO'
      setFormData({ estado: oppositeState, motivo: '' })
    }
  }, [quickEdit])

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

  // Quick toggle for single cell corrections (click on already-set cell)
  const handleQuickToggle = useCallback((employeeId, date, currentState, onUpdate) => {
    const newState = currentState === 'TURNO' ? 'LIBRE' : 'TURNO'
    onUpdate(employeeId, date.toISOString().split('T')[0], newState, '')
  }, [])

  // Open quick edit modal for any state change
  const handleQuickEdit = useCallback((employeeId, date, currentState) => {
    setQuickEdit({
      employeeId,
      date: date.toISOString().split('T')[0],
      currentState,
    })
  }, [])

  const closeQuickEdit = useCallback(() => {
    setQuickEdit(null)
  }, [])

  const applyQuickEdit = useCallback(async (newState, motivo, onUpdate) => {
    if (!quickEdit) return
    await onUpdate(quickEdit.employeeId, quickEdit.date, newState, motivo)
    closeQuickEdit()
  }, [quickEdit, closeQuickEdit])

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
    // Quick edit
    quickEdit,
    handleQuickToggle,
    handleQuickEdit,
    closeQuickEdit,
    applyQuickEdit,
  }
}
