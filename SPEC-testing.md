# Spec: Infraestructura de tests + lógica de turnos consecutivos

## Objective
Cerrar la brecha de 0 tests del proyecto empezando por su lógica más crítica:
extraer `getConsecutiveDays` (hoy acoplada a `CronogramaPage.jsx`) a una
utilidad pura testeable, sin cambiar su comportamiento (numeración desde la
izquierda, conteo hasta 10-15 días). Usuario: equipo OMARSA. Éxito: `npm test`
en verde y la página de cronograma funcionando igual que hoy.

## Tech Stack
- React 18.3.1 + Vite 5.4.21 (sin cambios)
- Vitest (ya instalado como devDependency) + entorno `node` (no se necesita
  jsdom: la utilidad es pura, sin DOM)

## Commands
```
Dev:   npm run dev
Build: npm run build
Test:  npx vitest run (script `npm test` por agregar)
Lint:  npm run lint
```

## Project Structure
```
src/lib/scheduleUtils.js       → nueva utilidad pura (extraída de CronogramaPage)
src/lib/scheduleUtils.test.js  → tests Vitest junto al código que prueban
src/pages/CronogramaPage.jsx   → pasa a importar la utilidad (sin cambio visual)
package.json                   → script `test: vitest run`
```

## Code Style
Utilidad pura con firma explícita, sin closures sobre estado React:
```js
export function getConsecutiveDays(employeeId, date, dates, scheduleData) {
  // retorna posición 1-based dentro de la racha TURNO, o 0 si no aplica
}
```
Convenciones existentes: ES modules, `camelCase`, sin punto y coma
(Prettier: `semi: false, singleQuote: true`).

## Testing Strategy
- Framework: Vitest, archivos `*.test.js` junto al código.
- Casos con valores literales independientes (no recomputados como el código):
  racha 1-5 → día3 = 3; corte por LIBRE reinicia en 1; día no-TURNO = 0;
  racha aislada = 1; racha de 15 días → día15 = 15; fecha fuera de rango = 0.
- Cobertura: solo la utilidad nueva. Sin tests de componentes ni e2e en este spec.

## Boundaries
- Always: tests en verde antes de commit; `npm run build` verificado; no cambiar
  comportamiento visible del cronograma.
- Ask first: agregar dependencias nuevas; tocar SQL/RLS; cambiar firmas usadas
  por otros archivos.
- Never: commitear `.env` ni secretos; borrar tests que fallan sin aprobación;
  modificar la lógica de conteo (solo extraerla).

## Success Criteria
- [ ] `src/lib/scheduleUtils.js` existe y `CronogramaPage.jsx` la importa
- [ ] `src/lib/scheduleUtils.test.js` con ≥6 casos, todos en verde (`npm test`)
- [ ] `npm run build` compila sin errores; `npm run lint` sin errores nuevos
- [ ] Commit + push a `main`

## Open Questions
1. ¿Solo entorno `node` para Vitest (más rápido) u agrego `jsdom` de una vez
   para futuros tests de componentes?
2. ¿Agrego el test al CI de Cloudflare Pages o solo local por ahora?
