# Spec: Utilidad JS de obsolescencia + tests

## Objective
Espejar en JS puro las fórmulas de obsolescencia que hoy solo viven en SQL
(`sql/05_catalogo_activos.sql` y `sqlserver/01_catalogo_activos.sql`), para
poder estimar en el cliente y tener regresión testeada sin base de datos.
No reemplaza los RPC; es cálculo local con la misma matemática.

## Tech Stack
- Vitest (entorno `node`, ya configurado), sin dependencias nuevas.

## Commands
```
Test:  npm test (npx vitest run)
Build: npm run build
Lint:  npm run lint
```

## Project Structure
```
src/lib/obsolescence.js       → funciones puras: lineal, exponencial, porUso, combinada, vidaRestante
src/lib/obsolescence.test.js  → tests con literales calculados a mano
```

## Code Style
Funciones puras, parámetros explícitos, redondeo a 2 decimales, clamp 0-100:
```js
export function obsolescenciaLineal(anosTranscurridos, vidaUtilAnos) { /* ... */ }
export function obsolescenciaExponencial(anosTranscurridos, factor) { /* ... */ }
export function obsolescenciaPorUso(usoAcumulado, vidaUtilTotal) { /* ... */ }
export function obsolescenciaActiva({ tipo, unidad, anos, uso, vidaUtil, factor }) { /* mayor entre tiempo y uso si aplica */ }
export function vidaUtilRestante(vidaUtilAnos, obsolescenciaPct) { /* ... */ }
```
Mismo estilo que `src/lib/scheduleUtils.js` (JSDoc breve, sin punto y coma,
single quotes).

## Testing Strategy
- Literales independientes calculados a mano, no recomputando como el código:
  - lineal: 3 años / 10 años → 30.00
  - exponencial: factor 0.0005, 3 años → ≈0.15
  - por uso: 500 ciclos / 3650 → ≈13.70 (caso real del test LocalDB)
  - clamp: 15 años / 10 años → 100 (no 150); valores negativos → 0
  - vida restante: 10 años, 13.7% → 8.63
- ≥7 casos en verde. Sin tocar componentes ni SQL en este spec.

## Boundaries
- Always: tests en verde antes de commit; build OK; no cambiar firmas SQL ni RPC.
- Ask first: usar la utilidad en páginas existentes (eso será otro spec);
  agregar dependencias.
- Never: modificar las fórmulas SQL para "igualar" el JS (la verdad está en
  el SPEC-testing/SQL ya verificado); commitear secretos.

## Success Criteria
- [ ] `src/lib/obsolescence.js` + `src/lib/obsolescence.test.js` creados
- [ ] `npm test`: todos los tests en verde (viejos + nuevos)
- [ ] `npm run build` OK; `npm run lint` sin errores nuevos
- [ ] Commit + push a `main`

## Open Questions
1. ¿Incluyo también `anosTranscurridos(fechaInstalacion, hoy)` como pura
   (inyectando `hoy` como parámetro para que sea testeable)?
