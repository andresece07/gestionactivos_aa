import { describe, it, expect } from 'vitest'
import {
  anosTranscurridos,
  obsolescenciaLineal,
  obsolescenciaExponencial,
  obsolescenciaPorUso,
  obsolescenciaActiva,
  vidaUtilRestante,
} from './obsolescence'

describe('obsolescenciaLineal', () => {
  it('3 años de 10 → 30.00', () => {
    expect(obsolescenciaLineal(3, 10)).toBe(30)
  })

  it('limita a 100 y a 0', () => {
    expect(obsolescenciaLineal(15, 10)).toBe(100)
    expect(obsolescenciaLineal(-2, 10)).toBe(0)
    expect(obsolescenciaLineal(5, 0)).toBe(0)
  })
})

describe('obsolescenciaExponencial', () => {
  it('factor 0.0005 a 3 años → ≈0.15', () => {
    expect(obsolescenciaExponencial(3, 0.0005)).toBeCloseTo(0.15, 2)
  })
})

describe('obsolescenciaPorUso', () => {
  it('500 ciclos de 3650 → ≈13.70 (caso real LocalDB)', () => {
    expect(obsolescenciaPorUso(500, 3650)).toBeCloseTo(13.7, 2)
  })

  it('limita a 100 y a 0', () => {
    expect(obsolescenciaPorUso(5000, 3650)).toBe(100)
    expect(obsolescenciaPorUso(-5, 3650)).toBe(0)
    expect(obsolescenciaPorUso(10, 0)).toBe(0)
  })
})

describe('anosTranscurridos', () => {
  it('2023-10-10 al 2026-10-10 → 3.00 (hoy inyectado, determinista)', () => {
    expect(anosTranscurridos('2023-10-10', '2026-10-10')).toBeCloseTo(3, 2)
  })
})

describe('obsolescenciaActiva', () => {
  it('toma el mayor entre tiempo y uso cuando la unidad es por uso', () => {
    expect(
      obsolescenciaActiva({ tipo: 'EXPONENCIAL', unidad: 'CICLOS', anos: 3, uso: 500, vidaUtil: 10, factor: 0.0005 })
    ).toBeCloseTo(13.7, 2)
  })

  it('usa solo tiempo cuando la unidad es ANOS', () => {
    expect(
      obsolescenciaActiva({ tipo: 'LINEAL', unidad: 'ANOS', anos: 3, uso: 9999, vidaUtil: 10, factor: 0.0005 })
    ).toBe(30)
  })
})

describe('vidaUtilRestante', () => {
  it('10 años con 13.7% → 8.63', () => {
    expect(vidaUtilRestante(10, 13.7)).toBeCloseTo(8.63, 2)
  })
})
