# Plan: Tests de turnos consecutivos (SPEC-testing.md)

## Orden
1. `package.json`: script `test: vitest run` (sin tocar build de Cloudflare).
2. RED: `src/lib/scheduleUtils.test.js` con 6 casos (falla: módulo no existe).
3. GREEN: `src/lib/scheduleUtils.js` con `getConsecutiveDays` extraída verbatim.
4. Refactor: `CronogramaPage.jsx` importa la utilidad; se elimina la local.
5. Verificar: `npx vitest run`, `npm run build`, `npm run lint` (0 errores).
6. Commit + push.

## Riesgos
- `toISOString()` y husos horarios: tests construyen claves con el mismo
  helper que la utilidad → autoconsistentes en cualquier TZ.
- Comportamiento idéntico: extracción verbatim, solo se agrega el parámetro
  `scheduleData`.
