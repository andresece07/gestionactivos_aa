# Plan: Utilidad JS de obsolescencia (SPEC-obsolescencia.md)

## Orden
1. RED: `src/lib/obsolescence.test.js` con 8 casos (falla: módulo no existe).
2. GREEN: `src/lib/obsolescence.js` con 6 funciones puras (misma matemática SQL).
3. Verificar: `npm test`, `npm run build`, `npm run lint` (0 errores).
4. Commit + push.

## Riesgos
- Paridad SQL↔JS: fórmulas copiadas de `sql/05_catalogo_activos.sql`
  (lineal/exponencial/por-uso, clamp 0-100, round 2).
- Fechas deterministas: `anosTranscurridos` recibe `hoy` como parámetro y
  calcula en UTC (sin dependencia de TZ local).
