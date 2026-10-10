// Espejo en JS puro de las fórmulas SQL (sql/05_catalogo_activos.sql).
// No reemplaza los RPC: sirve para estimación local testeable sin BD.
// Todas retornan porcentaje 0-100 redondeado a 2 decimales.

const clampPct = (v) => Math.min(100, Math.max(0, Math.round(v * 100) / 100))

const USO_POR_ANO = { CICLOS: 365, HORAS: 8760, KM: 50000 }
const UNIDADES_POR_USO = ['CICLOS', 'HORAS', 'KM']

// Años (365.25d) entre fechaInstalacion y hoy. `hoy` inyectable => testeable.
// Acepta 'YYYY-MM-DD'; calcula en UTC para no depender del TZ local.
export function anosTranscurridos(fechaInstalacion, hoy = new Date().toISOString().split('T')[0]) {
  const inicio = new Date(`${fechaInstalacion}T00:00:00Z`).getTime()
  const fin = new Date(`${hoy}T00:00:00Z`).getTime()
  if (Number.isNaN(inicio) || Number.isNaN(fin)) return 0
  return Math.max(0, Math.round(((fin - inicio) / 86400000 / 365.25) * 100) / 100)
}

export function obsolescenciaLineal(anos, vidaUtilAnos) {
  if (!vidaUtilAnos || vidaUtilAnos <= 0) return 0
  return clampPct((anos / vidaUtilAnos) * 100)
}

export function obsolescenciaExponencial(anos, factor) {
  if (!factor || factor <= 0 || anos <= 0) return 0
  return clampPct((1 - Math.exp(-factor * anos)) * 100)
}

export function obsolescenciaPorUso(usoAcumulado, vidaUtilTotal) {
  if (!vidaUtilTotal || vidaUtilTotal <= 0) return 0
  return clampPct((usoAcumulado / vidaUtilTotal) * 100)
}

// Combinada: mayor entre tiempo y uso cuando la unidad es por uso,
// solo tiempo en caso contrario (igual que fn_obsolescencia_activo).
export function obsolescenciaActiva({ tipo, unidad, anos, uso, vidaUtil, factor }) {
  const t = tipo === 'EXPONENCIAL'
    ? obsolescenciaExponencial(anos, factor)
    : obsolescenciaLineal(anos, vidaUtil)
  if (!UNIDADES_POR_USO.includes(unidad)) return t
  const vidaTotal = (vidaUtil || 0) * (USO_POR_ANO[unidad] || 1)
  return Math.max(t, obsolescenciaPorUso(uso || 0, vidaTotal))
}

export function vidaUtilRestante(vidaUtilAnos, obsolescenciaPct) {
  if (!vidaUtilAnos || vidaUtilAnos <= 0) return 0
  return Math.max(0, Math.round(vidaUtilAnos * (1 - obsolescenciaPct / 100) * 100) / 100)
}
