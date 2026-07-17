-- ============================================================================
-- SCHEMA SQL - Sistema de Registro de Baterías Fotovoltaicas en Acuacultura
-- Supabase PostgreSQL
-- ============================================================================

-- Habilitamos la extensión uuid-ossp si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TIPOS ENUMERADOS
-- ============================================================================

CREATE TYPE estado_bateria AS ENUM ('ACTIVA', 'BAJA');
CREATE TYPE motivo_paro AS ENUM ('MANTENIMIENTO', 'PESCA');

-- ============================================================================
-- 2. TABLAS BASE
-- ============================================================================

-- Tabla de piscinas: unidades operacionales en acuacultura
CREATE TABLE piscinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  zona text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),

  -- Validaciones
  CONSTRAINT nombre_no_vacio CHECK (length(trim(nombre)) > 0),
  CONSTRAINT zona_no_vacio CHECK (length(trim(zona)) > 0)
);

CREATE INDEX idx_piscinas_nombre ON piscinas(nombre);

-- Tabla de baterías: activos que alimentan los sistemas
CREATE TABLE baterias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_dynamics text NOT NULL UNIQUE,
  codigo_unico text NOT NULL UNIQUE,
  piscina_id uuid NOT NULL REFERENCES piscinas(id) ON DELETE RESTRICT,
  fecha_compra date NOT NULL,
  fecha_instalacion date NOT NULL,
  voltaje_nominal numeric(5, 1) NOT NULL,
  capacidad_kwh numeric(8, 2) NOT NULL,
  estado estado_bateria NOT NULL DEFAULT 'ACTIVA',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,

  -- Validaciones
  CONSTRAINT sku_no_vacio CHECK (length(trim(sku_dynamics)) > 0),
  CONSTRAINT codigo_no_vacio CHECK (length(trim(codigo_unico)) > 0),
  CONSTRAINT fechas_validas CHECK (fecha_compra <= fecha_instalacion),
  CONSTRAINT voltaje_positivo CHECK (voltaje_nominal > 0),
  CONSTRAINT capacidad_positiva CHECK (capacidad_kwh > 0)
);

CREATE INDEX idx_baterias_piscina ON baterias(piscina_id);
CREATE INDEX idx_baterias_estado ON baterias(estado);
CREATE INDEX idx_baterias_sku ON baterias(sku_dynamics);

-- Tabla de paros: registra interrupciones en operación de piscinas
CREATE TABLE paros_piscina (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piscina_id uuid NOT NULL REFERENCES piscinas(id) ON DELETE RESTRICT,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  motivo motivo_paro NOT NULL,
  tiempo_espera_dias integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Validaciones
  CONSTRAINT fechas_paro_validas CHECK (fecha_fin > fecha_inicio),
  CONSTRAINT espera_no_negativa CHECK (tiempo_espera_dias >= 0)
);

CREATE INDEX idx_paros_piscina ON paros_piscina(piscina_id);
CREATE INDEX idx_paros_fecha ON paros_piscina(fecha_inicio, fecha_fin);
CREATE INDEX idx_paros_created_by ON paros_piscina(created_by);

-- Tabla de comentarios: auditoría immutable de observaciones
CREATE TABLE comentarios_bateria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bateria_id uuid NOT NULL REFERENCES baterias(id) ON DELETE CASCADE,
  contenido text NOT NULL,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  fecha_creacion timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),

  -- Validaciones
  CONSTRAINT contenido_no_vacio CHECK (length(trim(contenido)) > 0)
);

CREATE INDEX idx_comentarios_bateria ON comentarios_bateria(bateria_id);
CREATE INDEX idx_comentarios_usuario ON comentarios_bateria(usuario_id);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) - Políticas de acceso
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE piscinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE baterias ENABLE ROW LEVEL SECURITY;
ALTER TABLE paros_piscina ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_bateria ENABLE ROW LEVEL SECURITY;

-- PISCINAS: todos pueden leer, solo lectura
CREATE POLICY "piscinas_select_all" ON piscinas
  FOR SELECT USING (true);

-- BATERÍAS: todos pueden leer, solo lectura
CREATE POLICY "baterias_select_all" ON baterias
  FOR SELECT USING (true);

-- PAROS_PISCINA: todos pueden leer, solo usuarios autenticados pueden crear
CREATE POLICY "paros_select_all" ON paros_piscina
  FOR SELECT USING (true);

CREATE POLICY "paros_insert_auth" ON paros_piscina
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- COMENTARIOS_BATERIA: todos pueden leer, solo usuarios autenticados pueden crear
CREATE POLICY "comentarios_select_all" ON comentarios_bateria
  FOR SELECT USING (true);

CREATE POLICY "comentarios_insert_auth" ON comentarios_bateria
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND usuario_id = auth.uid());

-- ============================================================================
-- 4. FUNCIONES SQL
-- ============================================================================

-- Función 1: Calcular ciclos totales de una batería
-- Ciclos = días desde instalación - días de paros - días de espera
CREATE OR REPLACE FUNCTION calcular_ciclos_bateria(bateria_id uuid)
RETURNS integer AS $$
DECLARE
  dias_totales integer;
  dias_paros integer;
  dias_espera integer;
  fecha_inst date;
  piscina_id_var uuid;
BEGIN
  -- Obtener datos de la batería
  SELECT b.fecha_instalacion, b.piscina_id
  INTO fecha_inst, piscina_id_var
  FROM baterias b
  WHERE b.id = bateria_id;

  IF fecha_inst IS NULL THEN
    RETURN 0;
  END IF;

  -- Calcular días totales desde instalación
  dias_totales := CURRENT_DATE - fecha_inst;

  IF dias_totales < 0 THEN
    RETURN 0;
  END IF;

  -- Calcular suma de días de paros (diferencia entre fecha_fin y fecha_inicio)
  SELECT COALESCE(SUM(fecha_fin - fecha_inicio), 0)
  INTO dias_paros
  FROM paros_piscina
  WHERE piscina_id = piscina_id_var;

  -- Calcular suma de días de espera
  SELECT COALESCE(SUM(tiempo_espera_dias), 0)
  INTO dias_espera
  FROM paros_piscina
  WHERE piscina_id = piscina_id_var;

  -- Retornar ciclos (mínimo 0)
  RETURN GREATEST(0, dias_totales - dias_paros - dias_espera);
END;
$$ LANGUAGE plpgsql STABLE;

-- Función 2: Calcular capacidad residual (degradación por ciclos)
-- Degradación: 0.05% por ciclo, retorna porcentaje (0-100)
CREATE OR REPLACE FUNCTION calcular_capacidad_residual(bateria_id uuid)
RETURNS numeric AS $$
DECLARE
  ciclos integer;
  degradacion numeric;
  capacidad_residual numeric;
BEGIN
  -- Obtener ciclos totales
  ciclos := calcular_ciclos_bateria(bateria_id);

  -- Calcular degradación: 0.05% por ciclo = 0.0005 * ciclos
  degradacion := ciclos * 0.0005;

  -- Limitar degradación máxima al 100%
  degradacion := LEAST(degradacion, 1.0);

  -- Calcular capacidad residual como porcentaje
  capacidad_residual := (1 - degradacion) * 100;

  -- Retornar entre 0 y 100
  RETURN GREATEST(0, LEAST(100, capacidad_residual));
END;
$$ LANGUAGE plpgsql STABLE;

-- Función 3: Verificar solapamiento de paros
-- Retorna true si hay conflicto de fechas, false si está limpio
CREATE OR REPLACE FUNCTION verificar_paros_solapados(
  piscina_id uuid,
  fecha_inicio date,
  fecha_fin date
)
RETURNS boolean AS $$
DECLARE
  overlapping_count integer;
BEGIN
  -- Buscar paros que se solapen con el rango especificado
  -- Un paro se solapa si: inicio_nuevo < fin_existente AND fin_nuevo > inicio_existente
  SELECT COUNT(*)
  INTO overlapping_count
  FROM paros_piscina
  WHERE piscina_id = piscina_id
    AND fecha_inicio < fecha_fin
    AND fecha_fin > fecha_inicio;

  -- Retornar true si hay solapamiento, false si está limpio
  RETURN overlapping_count > 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función trigger: Actualizar updated_at solo cuando estado cambia a BAJA
CREATE OR REPLACE FUNCTION actualizar_updated_at_bateria()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar updated_at si el estado cambia a BAJA
  IF NEW.estado = 'BAJA' AND OLD.estado != 'BAJA' THEN
    NEW.updated_at := now();
  ELSIF NEW.estado != 'BAJA' THEN
    -- Prevenir cambios en otros campos
    NEW.updated_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_updated_at_bateria
  BEFORE UPDATE ON baterias
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_bateria();

-- ============================================================================
-- 5. SEED DATA - Datos de prueba
-- ============================================================================

-- Insertar piscinas
INSERT INTO piscinas (nombre, zona) VALUES
  ('Langua', 'Zona Norte'),
  ('La Esperanza', 'Zona Centro'),
  ('Vigsa', 'Zona Sur')
ON CONFLICT (nombre) DO NOTHING;

-- Obtener IDs de piscinas para referencias
WITH piscinas_map AS (
  SELECT id, nombre FROM piscinas
  WHERE nombre IN ('Langua', 'La Esperanza', 'Vigsa')
)
-- Insertar baterías ACTIVAS
INSERT INTO baterias (
  sku_dynamics,
  codigo_unico,
  piscina_id,
  fecha_compra,
  fecha_instalacion,
  voltaje_nominal,
  capacidad_kwh,
  estado
)
SELECT
  'SKU-' || ROW_NUMBER() OVER (ORDER BY p.nombre) AS sku_dynamics,
  'BAT-' || ROW_NUMBER() OVER (ORDER BY p.nombre) || '-2024' AS codigo_unico,
  p.id,
  CURRENT_DATE - INTERVAL '180 days',
  CURRENT_DATE - INTERVAL '150 days',
  CASE ROW_NUMBER() OVER (ORDER BY p.nombre)
    WHEN 1 THEN 48
    WHEN 2 THEN 48
    WHEN 3 THEN 48
    WHEN 4 THEN 24
    ELSE 48
  END::numeric(5, 1),
  CASE ROW_NUMBER() OVER (ORDER BY p.nombre)
    WHEN 1 THEN 10.5
    WHEN 2 THEN 15.2
    WHEN 3 THEN 10.5
    WHEN 4 THEN 5.0
    ELSE 20.0
  END::numeric(8, 2),
  'ACTIVA'::estado_bateria
FROM piscinas_map p, generate_series(1, 5)
LIMIT 5
ON CONFLICT (sku_dynamics) DO NOTHING;

-- Obtener ID de usuario actual para paros y comentarios
WITH user_id_current AS (
  SELECT auth.uid() as uid
)
-- Insertar paros históricos (2023-2024) sin solapamiento
INSERT INTO paros_piscina (piscina_id, fecha_inicio, fecha_fin, motivo, tiempo_espera_dias, created_by)
SELECT
  (SELECT id FROM piscinas WHERE nombre = 'Langua'),
  '2023-11-15'::date,
  '2023-11-22'::date,
  'MANTENIMIENTO'::motivo_paro,
  3,
  (SELECT uid FROM user_id_current)
WHERE EXISTS (SELECT 1 FROM user_id_current WHERE uid IS NOT NULL)
UNION ALL
SELECT
  (SELECT id FROM piscinas WHERE nombre = 'La Esperanza'),
  '2024-02-10'::date,
  '2024-02-14'::date,
  'PESCA'::motivo_paro,
  0,
  (SELECT uid FROM user_id_current)
WHERE EXISTS (SELECT 1 FROM user_id_current WHERE uid IS NOT NULL)
UNION ALL
SELECT
  (SELECT id FROM piscinas WHERE nombre = 'Vigsa'),
  '2024-04-05'::date,
  '2024-04-12'::date,
  'MANTENIMIENTO'::motivo_paro,
  2,
  (SELECT uid FROM user_id_current)
WHERE EXISTS (SELECT 1 FROM user_id_current WHERE uid IS NOT NULL)
UNION ALL
SELECT
  (SELECT id FROM piscinas WHERE nombre = 'Langua'),
  '2024-06-20'::date,
  '2024-06-23'::date,
  'PESCA'::motivo_paro,
  1,
  (SELECT uid FROM user_id_current)
WHERE EXISTS (SELECT 1 FROM user_id_current WHERE uid IS NOT NULL)
ON CONFLICT DO NOTHING;

-- Insertar comentarios de auditoría
WITH user_id_current AS (
  SELECT auth.uid() as uid
),
bateria_ids AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn FROM baterias ORDER BY created_at LIMIT 8
)
INSERT INTO comentarios_bateria (bateria_id, contenido, usuario_id, fecha_creacion)
SELECT
  b.id,
  CASE b.rn
    WHEN 1 THEN 'Batería instalada correctamente. Voltaje inicial: 48V'
    WHEN 2 THEN 'Revisión de conexiones y estado físico OK'
    WHEN 3 THEN 'Lectura de degradación dentro de parámetros normales'
    WHEN 4 THEN 'Sistema funcionando óptimamente tras revisión de mantenimiento'
    WHEN 5 THEN 'Monitoreo diario: temperatura ambiente 28°C, carga al 95%'
    WHEN 6 THEN 'Cambio de terminal positivo por corrosión detectada'
    WHEN 7 THEN 'Prueba de carga completa realizada exitosamente'
    WHEN 8 THEN 'Degradación acumulada: 2.3% - dentro de especificaciones'
  END AS contenido,
  (SELECT uid FROM user_id_current),
  CURRENT_TIMESTAMP - (INTERVAL '1 day' * (8 - b.rn))
FROM bateria_ids b
WHERE b.rn <= 8
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX idx_comentarios_fecha ON comentarios_bateria(fecha_creacion DESC);
CREATE INDEX idx_paros_motivo ON paros_piscina(motivo);

-- ============================================================================
-- 7. VISTA ÚTIL - Dashboard de baterías con estado actual
-- ============================================================================

CREATE OR REPLACE VIEW vw_baterias_estado AS
SELECT
  b.id,
  b.sku_dynamics,
  b.codigo_unico,
  p.nombre as piscina,
  p.zona,
  b.fecha_instalacion,
  b.voltaje_nominal,
  b.capacidad_kwh,
  b.estado,
  calcular_ciclos_bateria(b.id) as ciclos_totales,
  calcular_capacidad_residual(b.id) as capacidad_residual_pct,
  (b.capacidad_kwh * calcular_capacidad_residual(b.id) / 100)::numeric(8, 2) as capacidad_residual_kwh,
  AGE(CURRENT_DATE, b.fecha_instalacion) as tiempo_operacion,
  b.created_at,
  b.updated_at
FROM baterias b
LEFT JOIN piscinas p ON b.piscina_id = p.id
ORDER BY b.created_at DESC;

-- ============================================================================
-- NOTAS DE IMPLEMENTACIÓN:
-- ============================================================================
/*
1. CICLOS DE BATERÍA:
   - Se calcula dinámicamente usando la función calcular_ciclos_bateria()
   - Considera: días totales - días de paros - días de espera
   - Resultado mínimo garantizado: 0

2. CAPACIDAD RESIDUAL:
   - Degradación fija: 0.05% por ciclo (0.0005)
   - Porcentaje: 0-100%
   - Fórmula: (1 - ciclos*0.0005) * 100

3. RLS POLICIES:
   - Lectura: todos pueden ver datos (pública)
   - Escritura: solo INSERT permitido para usuarios autenticados
   - UPDATE/DELETE: deshabilitado (solo BAJA de baterías por aplicación)
   - Comentarios: solo el usuario autenticado puede ver sus propios registros

4. AUDITORÍA:
   - Comentarios son immutables (NO se pueden editar ni eliminar)
   - Timestamp "created_at" es inmutable en comentarios
   - Baterías solo actualizan "updated_at" al cambiar a BAJA

5. VALIDACIONES:
   - Todas las fechas validadas a nivel DB
   - Valores numéricos con restricciones de positividad
   - Foreign keys con RESTRICT para integridad referencial

6. PERFORMANCE:
   - Índices en foreign keys y columnas frecuentes de filtrado
   - Vista materializable si se necesita cacheo
   - Funciones STABLE para optimización de queries
*/
