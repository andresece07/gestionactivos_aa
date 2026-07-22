import { memo } from 'react'

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

export const ScheduleCell = memo(({
  record,
  date,
  employeeId,
  isSelected,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  onClick,
  disabled = false,
}) => {
  const dateStr = date.toISOString().split('T')[0]
  const estado = record?.estado || 'PROGRAMADO'
  const label = ESTADO_LABELS[estado] || '—'
  const color = ESTADO_COLORS[estado] || '#ffffff'
  const isDarkText = estado === 'FALTA'

  return (
    <td
      className={`px-2 py-3 text-center cursor-pointer border border-slate-200 text-xs font-semibold transition hover:opacity-80 hover:shadow-sm ${
        isSelected ? 'ring-2 ring-primary-500 ring-inset' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{
        backgroundColor: color,
        color: isDarkText ? '#000' : '#fff',
      }}
      onMouseDown={() => !disabled && onMouseDown(employeeId, date)}
      onMouseEnter={() => !disabled && onMouseEnter(employeeId, date)}
      onMouseUp={onMouseUp}
      onClick={() => !disabled && onClick(employeeId, date)}
      title={`${estado}${disabled ? ' (bloqueado)' : ' - Click para alternar'}` }
      data-testid={`schedule-cell-${employeeId}-${dateStr}`}
    >
      {label}
    </td>
  )
})

ScheduleCell.displayName = 'ScheduleCell'
