import { describe, it, expect } from 'vitest'
import { getConsecutiveDays } from './scheduleUtils'

const EMP = 'emp-1'
const atNoon = (i) => new Date(2026, 8, i + 1, 12)
const key = (d) => d.toISOString().split('T')[0]
const days = (n) => Array.from({ length: n }, (_, i) => atNoon(i))

const buildSchedule = (dates, entries) =>
  Object.fromEntries(
    entries.map(([i, estado]) => [`${EMP}-${key(dates[i])}`, { estado }])
  )

describe('getConsecutiveDays', () => {
  it('numera desde la izquierda en una racha de 5 días', () => {
    const dates = days(7)
    const schedule = buildSchedule(dates, [[0, 'TURNO'], [1, 'TURNO'], [2, 'TURNO'], [3, 'TURNO'], [4, 'TURNO']])
    expect(getConsecutiveDays(EMP, dates[0], dates, schedule)).toBe(1)
    expect(getConsecutiveDays(EMP, dates[2], dates, schedule)).toBe(3)
    expect(getConsecutiveDays(EMP, dates[4], dates, schedule)).toBe(5)
  })

  it('reinicia en 1 después de un corte por LIBRE', () => {
    const dates = days(7)
    const schedule = buildSchedule(dates, [[0, 'TURNO'], [1, 'TURNO'], [2, 'LIBRE'], [3, 'TURNO'], [4, 'TURNO']])
    expect(getConsecutiveDays(EMP, dates[2], dates, schedule)).toBe(0)
    expect(getConsecutiveDays(EMP, dates[3], dates, schedule)).toBe(1)
    expect(getConsecutiveDays(EMP, dates[4], dates, schedule)).toBe(2)
  })

  it('retorna 0 para días no-TURNO o sin registro', () => {
    const dates = days(7)
    const schedule = buildSchedule(dates, [[0, 'ENFERMO'], [1, 'VACACIONES'], [2, 'FALTA']])
    expect(getConsecutiveDays(EMP, dates[0], dates, schedule)).toBe(0)
    expect(getConsecutiveDays(EMP, dates[1], dates, schedule)).toBe(0)
    expect(getConsecutiveDays(EMP, dates[5], dates, schedule)).toBe(0)
  })

  it('un TURNO aislado vale 1', () => {
    const dates = days(7)
    const schedule = buildSchedule(dates, [[5, 'TURNO']])
    expect(getConsecutiveDays(EMP, dates[5], dates, schedule)).toBe(1)
    expect(getConsecutiveDays(EMP, dates[4], dates, schedule)).toBe(0)
  })

  it('cuenta rachas largas de 15 días laborales', () => {
    const dates = days(20)
    const schedule = buildSchedule(dates, Array.from({ length: 15 }, (_, i) => [i, 'TURNO']))
    expect(getConsecutiveDays(EMP, dates[0], dates, schedule)).toBe(1)
    expect(getConsecutiveDays(EMP, dates[9], dates, schedule)).toBe(10)
    expect(getConsecutiveDays(EMP, dates[14], dates, schedule)).toBe(15)
  })

  it('retorna 0 para fecha fuera del rango', () => {
    const dates = days(7)
    const schedule = buildSchedule(dates, [[0, 'TURNO']])
    expect(getConsecutiveDays(EMP, new Date(2026, 9, 5, 12), dates, schedule)).toBe(0)
  })
})
