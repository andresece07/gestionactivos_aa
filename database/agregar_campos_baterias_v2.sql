-- ============================================================================
-- MIGRACIÓN: Agregar campos finca, zona, tolva y cambiar capacidad a amperios
-- ============================================================================

-- Agregar nuevos campos a la tabla baterias
ALTER TABLE baterias
ADD COLUMN IF NOT EXISTS finca text,
ADD COLUMN IF NOT EXISTS zona text,
ADD COLUMN IF NOT EXISTS tolva text,
ADD COLUMN IF NOT EXISTS amperios numeric(8, 2);

-- Renombrar capacidad_kwh a capacidad_kwh_legacy para mantener compatibilidad
ALTER TABLE baterias
RENAME COLUMN capacidad_kwh TO capacidad_kwh_legacy;

-- Actualizar las vistas que usan capacidad_kwh
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
  calcular_ciclos_bateria(b.id) as ciclos_totales,
  calcular_capacidad_residual(b.id) as capacidad_residual_pct,
  (COALESCE(b.amperios, 0) * calcular_capacidad_residual(b.id) / 100)::numeric(8, 2) as capacidad_residual,
  AGE(CURRENT_DATE, b.fecha_instalacion) as tiempo_operacion,
  b.created_at,
  b.updated_at
FROM baterias b
LEFT JOIN piscinas p ON b.piscina_id = p.id
ORDER BY b.created_at DESC;

-- Agregar constraints si es necesario
ALTER TABLE baterias
ADD CONSTRAINT finca_no_vacio CHECK (finca IS NULL OR length(trim(finca)) > 0),
ADD CONSTRAINT zona_no_vacio CHECK (zona IS NULL OR length(trim(zona)) > 0),
ADD CONSTRAINT tolva_no_vacio CHECK (tolva IS NULL OR length(trim(tolva)) > 0),
ADD CONSTRAINT amperios_positivo CHECK (amperios IS NULL OR amperios > 0);
