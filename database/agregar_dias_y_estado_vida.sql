-- ============================================================================
-- MIGRACIÓN: Agregar soporte para días de operación y estado de vida útil
-- ============================================================================

-- Crear enum para estado de vida útil
CREATE TYPE IF NOT EXISTS estado_vida_util AS ENUM ('ACTIVA', 'VIDA_UTIL_CUMPLIDA');

-- Agregar campos a la tabla baterias
ALTER TABLE baterias
ADD COLUMN IF NOT EXISTS dias_operacion integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS estado_vida_util estado_vida_util DEFAULT 'ACTIVA',
ADD COLUMN IF NOT EXISTS fecha_fin_vida_util date;

-- Crear función para calcular días desde instalación
CREATE OR REPLACE FUNCTION calcular_dias_desde_instalacion(bateria_id uuid)
RETURNS integer AS $$
DECLARE
  dias_totales integer;
  dias_paros integer;
  dias_espera integer;
  fecha_inst date;
  piscina_id_var uuid;
BEGIN
  SELECT b.fecha_instalacion, b.piscina_id
  INTO fecha_inst, piscina_id_var
  FROM baterias b
  WHERE b.id = bateria_id;

  IF fecha_inst IS NULL THEN
    RETURN 0;
  END IF;

  dias_totales := CURRENT_DATE - fecha_inst;

  IF dias_totales < 0 THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(SUM(fecha_fin - fecha_inicio), 0)
  INTO dias_paros
  FROM paros_piscina
  WHERE piscina_id = piscina_id_var;

  SELECT COALESCE(SUM(tiempo_espera_dias), 0)
  INTO dias_espera
  FROM paros_piscina
  WHERE piscina_id = piscina_id_var;

  RETURN GREATEST(0, dias_totales - dias_paros - dias_espera);
END;
$$ LANGUAGE plpgsql STABLE;

-- Crear función para calcular si una batería cumplió su tiempo de vida (10 años = 3650 días)
CREATE OR REPLACE FUNCTION verificar_vida_util_cumplida(bateria_id uuid)
RETURNS boolean AS $$
DECLARE
  dias_operacion integer;
  vida_util_dias integer := 3650; -- 10 años
BEGIN
  dias_operacion := calcular_dias_desde_instalacion(bateria_id);
  RETURN dias_operacion >= vida_util_dias;
END;
$$ LANGUAGE plpgsql STABLE;

-- Crear función para obtener estado de vida útil
CREATE OR REPLACE FUNCTION obtener_estado_vida_util(bateria_id uuid)
RETURNS estado_vida_util AS $$
BEGIN
  IF verificar_vida_util_cumplida(bateria_id) THEN
    RETURN 'VIDA_UTIL_CUMPLIDA'::estado_vida_util;
  ELSE
    RETURN 'ACTIVA'::estado_vida_util;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Actualizar vista vw_baterias_estado para incluir días desde instalación y estado de vida útil
DROP VIEW IF EXISTS vw_baterias_estado;

CREATE OR REPLACE VIEW vw_baterias_estado AS
SELECT
  b.id,
  b.sku_dynamics,
  b.codigo_unico,
  p.nombre as piscina,
  p.zona,
  b.finca,
  b.zona as zona_bateria,
  b.tolva,
  b.fecha_instalacion,
  b.voltaje_nominal,
  b.amperios,
  b.capacidad_kwh_legacy,
  b.estado,
  calcular_dias_desde_instalacion(b.id) as dias_desde_instalacion,
  calcular_ciclos_bateria(b.id) as ciclos_totales,
  calcular_capacidad_residual(b.id) as capacidad_residual_pct,
  (COALESCE(b.amperios, 0) * calcular_capacidad_residual(b.id) / 100)::numeric(8, 2) as capacidad_residual,
  verificar_vida_util_cumplida(b.id) as vida_util_cumplida,
  obtener_estado_vida_util(b.id) as estado_vida_util,
  AGE(CURRENT_DATE, b.fecha_instalacion) as tiempo_operacion,
  b.created_at,
  b.updated_at
FROM baterias b
LEFT JOIN piscinas p ON b.piscina_id = p.id
ORDER BY b.created_at DESC;

-- Crear vista especializada para reporte de baterías con vida útil cumplida
CREATE OR REPLACE VIEW vw_baterias_vida_util_cumplida AS
SELECT
  b.id,
  b.sku_dynamics,
  b.codigo_unico,
  p.nombre as piscina,
  p.zona,
  b.finca,
  b.tolva,
  b.fecha_instalacion,
  b.voltaje_nominal,
  b.amperios,
  b.estado,
  calcular_dias_desde_instalacion(b.id) as dias_desde_instalacion,
  ROUND((calcular_dias_desde_instalacion(b.id) / 365.25)::numeric, 1) as años_operacion,
  calcular_capacidad_residual(b.id) as capacidad_residual_pct,
  ROUND((COALESCE(b.amperios, 0) * calcular_capacidad_residual(b.id) / 100)::numeric, 2) as capacidad_residual,
  b.updated_at as fecha_baja,
  b.created_at,
  b.updated_at
FROM baterias b
LEFT JOIN piscinas p ON b.piscina_id = p.id
WHERE verificar_vida_util_cumplida(b.id) = true
ORDER BY calcular_dias_desde_instalacion(b.id) DESC;

-- Índice para búsquedas por estado de vida útil
CREATE INDEX IF NOT EXISTS idx_baterias_estado_vida_util ON baterias(estado_vida_util);
CREATE INDEX IF NOT EXISTS idx_baterias_dias_operacion ON baterias(dias_operacion);
