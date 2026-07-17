# Prompts de Contexto - Proyecto Gestión de Baterías FV

## Prompt 1: Schema SQL Base de Datos

**Eres un arquitecto de base de datos especializado en Supabase.**

**OBJETIVO**: Crear un schema SQL completo para un sistema de registro de baterías fotovoltaicas en acuacultura, con RLS policies y funciones para calcular ciclos de carga/descarga.

**CONTEXTO:**
- Baterías alimentan sistemas automáticos de piscinas
- Ciclos = días desde fecha_instalacion MENOS días de paradas MENOS días de espera
- Paradas pueden ser por MANTENIMIENTO o PESCA
- Comentarios son immutables (auditoría)
- Un solo usuario actualmente (para futuras extensiones con roles)

**SCHEMA A CREAR:**

1. Tabla "piscinas":
   - id (uuid, pk)
   - nombre (text, unique)
   - zona (text)
   - created_at (timestamp)

2. Tabla "baterias":
   - id (uuid, pk)
   - sku_dynamics (text, unique) [identificador del inversor]
   - codigo_unico (text, unique) [serial física de la batería]
   - piscina_id (uuid, fk → piscinas)
   - fecha_compra (date)
   - fecha_instalacion (date) [día 0 de ciclos]
   - voltaje_nominal (numeric, ej: 48)
   - capacidad_kwh (numeric, ej: 10.5)
   - estado (enum: ACTIVA | BAJA)
   - created_at (timestamp)
   - updated_at (timestamp, solo para estado BAJA)

3. Tabla "paros_piscina":
   - id (uuid, pk)
   - piscina_id (uuid, fk → piscinas)
   - fecha_inicio (date)
   - fecha_fin (date, > fecha_inicio)
   - motivo (enum: MANTENIMIENTO | PESCA)
   - tiempo_espera_dias (integer, >= 0, default 0)
   - created_at (timestamp)
   - created_by (uuid, fk → auth.users)

4. Tabla "comentarios_bateria":
   - id (uuid, pk)
   - bateria_id (uuid, fk → baterias)
   - contenido (text)
   - usuario_id (uuid, fk → auth.users)
   - fecha_creacion (timestamp, default now())
   - created_at (timestamp, immutable)

**RLS POLICIES:**

- piscinas: SELECT (todos), INSERT/UPDATE/DELETE (disabled)
- baterias: SELECT (todos), INSERT/UPDATE/DELETE (disabled)
- paros_piscina: SELECT (todos), INSERT (todos), UPDATE/DELETE (disabled)
- comentarios_bateria: SELECT (todos), INSERT (todos), UPDATE/DELETE (disabled)

**FUNCIONES SQL:**

1. calcular_ciclos_bateria(bateria_id uuid) → integer
   Retorna ciclos totales considerando paras y tiempos de espera.
   Lógica:
   - Obtener fecha_instalacion de la batería
   - Obtener piscina_id de la batería
   - Calcular días totales = DATEDIFF(hoy, fecha_instalacion)
   - Restar días de paros: SUM(DATEDIFF(fecha_fin, fecha_inicio)) de paros_piscina donde piscina_id = bateria.piscina_id
   - Restar días de espera: SUM(tiempo_espera_dias) de paros_piscina donde piscina_id = bateria.piscina_id
   - Retornar máximo 0

2. calcular_capacidad_residual(bateria_id uuid) → numeric
   Retorna porcentaje de capacidad residual.
   Lógica:
   - Obtener capacidad_kwh de la batería
   - Obtener ciclos_totales = calcular_ciclos_bateria(bateria_id)
   - Degradación = ciclos_totales * 0.0005 (0.05% por ciclo)
   - capacidad_residual = (1 - degradacion) * 100
   - Retornar máximo 0, mínimo 100

3. verificar_paros_solapados(piscina_id uuid, fecha_inicio date, fecha_fin date) → boolean
   Retorna true si hay solapamiento, false si está limpio.
   Lógica:
   - Buscar paros de piscina_id donde (fecha_inicio BETWEEN paro.fecha_inicio AND paro.fecha_fin) OR (fecha_fin BETWEEN paro.fecha_inicio AND paro.fecha_fin)
   - Si encuentra alguno, retornar true, sino false

**SEED DATA (para pruebas):**
- 3 piscinas: Langua, La Esperanza, Vigsa
- 5 baterías ACTIVAS (distribuidas entre piscinas)
- 4 paros históricos (2023-2024) sin solapamiento
- 8 comentarios de ejemplo

**ENTREGAR:**
- Script SQL completo en un bloque de código (copia-pega directo en Supabase SQL Editor)
- Comentarios explicativos en SQL
- Orden correcto: enums → tablas → RLS policies → funciones → seed data

---

## Prompt 2: Aplicación React + Supabase + Cloudflare Pages

**Eres un desarrollador full-stack React + Supabase + Cloudflare Pages.**

**OBJETIVO**: Crear una app web (React/Vite) que gestione baterías fotovoltaicas, deployable en Cloudflare Pages, con Supabase como backend.

**CONTEXTO:**
- Backend: Schema del Prompt 1
- 1 usuario logueado (Supabase Auth)
- Ciclos se calculan automáticamente vía función SQL
- Registros immutables: no editar baterías/paros/comentarios después de crear
- Deploy: Cloudflare Pages detecta push a GitHub y hace build automático
- Repo: https://github.com/andresece07/gestionactivos_aa.git

**STACK:**
- React 18 + Vite
- Supabase JS client
- Recharts para gráficos
- TailwindCSS para estilos
- React Router para navegación

**CREDENCIALES TEMPORALES (hardcodear en lib/supabaseClient.js):**
- SUPABASE_URL: https://radggsmuvtalwwktljfu.supabase.co
- SUPABASE_ANON_KEY: sb_publishable_jdyDWIytMLR8SB6-Y-ClkA_95H5onV_
[NOTA: Después del primer deploy, mover estas a env vars en Cloudflare dashboard]

**ESTRUCTURA DE CARPETAS:** ejecuta el prompt y puedes guardar los 2 prompt en .md

---

## Notas para Futuro Desarrollo

### Próximas Features
- [ ] Agregar export a CSV/Excel para reportes
- [ ] Notificaciones de alerta cuando capacidad < 30%
- [ ] Gráficos de tendencias históricas
- [ ] Integración con inversor (API real)
- [ ] Multi-usuario con roles ADMIN/VIEWER/EDITOR
- [ ] Backup automático de datos

### Seguridad
- [ ] Cambiar credenciales hardcoded → env vars (antes de producción)
- [ ] Configurar CORS en Supabase
- [ ] Implementar rate limiting en API
- [ ] Habilitar logs de auditoría en Supabase

### Performance
- [ ] Implementar paginación en tablas grandes
- [ ] Cacheo de datos con React Query
- [ ] Imágenes optimizadas
- [ ] Code splitting en rutas

### Testing
- [ ] Unit tests con Vitest
- [ ] Component tests con React Testing Library
- [ ] E2E tests con Cypress
- [ ] Coverage > 80%

---

**Fecha de creación**: 2024  
**Última actualización**: 2024
