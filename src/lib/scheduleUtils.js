// Posición 1-based de `date` dentro de su racha consecutiva de TURNO,
// numerada desde la izquierda (primer día de la racha = 1).
// Retorna 0 si la fecha no está en `dates` o su estado no es TURNO.
//
// `scheduleData`: mapa `"<empleadoId>-<YYYY-MM-DD>" -> { estado, ... }.
export function getConsecutiveDays(employeeId, date, dates, scheduleData) {
  const dateStr = date.toISOString().split('T')[0]
  const currentIndex = dates.findIndex(d => d.toISOString().split('T')[0] === dateStr)

  if (currentIndex === -1) return 0

  const currentRecord = scheduleData[`${employeeId}-${dateStr}`]
  if (!currentRecord || currentRecord.estado !== 'TURNO') return 0

  // Buscar el inicio de la racha hacia la izquierda
  let startIndex = currentIndex
  while (startIndex > 0) {
    const prevDateStr = dates[startIndex - 1].toISOString().split('T')[0]
    const prevRecord = scheduleData[`${employeeId}-${prevDateStr}`]
    if (prevRecord && prevRecord.estado === 'TURNO') {
      startIndex--
    } else {
      break
    }
  }

  return currentIndex - startIndex + 1
}
