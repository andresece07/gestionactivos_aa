-- ============================================================================
-- SCHEMA SQL - Sistema de Registro de Baterías Fotovoltaicas en Acuacultura
-- Supabase PostgreSQL
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TIPOS ENUMERADOS
-- ============================================================================

CREATE TYPE estado_bateria AS ENUM ('ACTIVA', 'BAJA');
CREATE TYPE motivo_paro AS ENUM ('MANTENIMIENTO', 'PESCA');

-- ============================================================================
-- 2. TABLAS BASE
-- ============================================================================

CREATE TABLE piscinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  zona text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nombre_no_vacio CHECK (length(trim(nombre)) > 0),
  CONSTRAINT zona_no_vacio CHECK (length(trim(zona)) > 0)
);

CREATE INDEX idx_piscinas_nombre ON piscinas(nombre);

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
  CONSTRAINT sku_no_vacio CHECK (length(trim(sku_dynamics)) > 0),
  CONSTRAINT codigo_no_vacio CHECK (length(trim(codigo_unico)) > 0),
  CONSTRAINT fechas_validas CHECK (fecha_compra <= fecha_instalacion),
  CONSTRAINT voltaje_positivo CHECK (voltaje_nominal > 0),
  CONSTRAINT capacidad_positiva CHECK (capacidad_kwh > 0)
);

CREATE INDEX idx_baterias_piscina ON baterias(piscina_id);
CREATE INDEX idx_baterias_estado ON baterias(estado);
CREATE INDEX idx_baterias_sku ON baterias(sku_dynamics);

CREATE TABLE paros_piscina (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piscina_id uuid NOT NULL REFERENCES piscinas(id) ON DELETE RESTRICT,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  motivo motivo_paro NOT NULL,
  tiempo_espera_dias integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  CONSTRAINT fechas_paro_validas CHECK (fecha_fin > fecha_inicio),
  CONSTRAINT espera_no_negativa CHECK (tiempo_espera_dias >= 0)
);

CREATE INDEX idx_paros_piscina ON paros_piscina(piscina_id);
CREATE INDEX idx_paros_fecha ON paros_piscina(fecha_inicio, fecha_fin);
CREATE INDEX idx_paros_created_by ON paros_piscina(created_by);

CREATE TABLE comentarios_bateria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bateria_id uuid NOT NULL REFERENCES baterias(id) ON DELETE CASCADE,
  contenido text NOT NULL,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  fecha_creacion timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contenido_no_vacio CHECK (length(trim(contenido)) > 0)
);

CREATE INDEX idx_comentarios_bateria ON comentarios_bateria(bateria_id);
CREATE INDEX idx_comentarios_usuario ON comentarios_bateria(usuario_id);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE piscinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE baterias ENABLE ROW LEVEL SECURITY;
ALTER TABLE paros_piscina ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_bateria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "piscinas_select_all" ON piscinas FOR SELECT USING (true);
CREATE POLICY "baterias_select_all" ON baterias FOR SELECT USING (true);
CREATE POLICY "paros_select_all" ON paros_piscina FOR SELECT USING (true);
CREATE POLICY "paros_insert_auth" ON paros_piscina FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "comentarios_select_all" ON comentarios_bateria FOR SELECT USING (true);
CREATE POLICY "comentarios_insert_auth" ON comentarios_bateria FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND usuario_id = auth.uid());

-- ============================================================================
-- 4. FUNCIONES SQL
-- ============================================================================

CREATE OR REPLACE FUNCTION calcular_ciclos_bateria(bateria_id uuid)
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

CREATE OR REPLACE FUNCTION calcular_capacidad_residual(bateria_id uuid)
RETURNS numeric AS $$
DECLARE
  ciclos integer;
  degradacion numeric;
  capacidad_residual numeric;
BEGIN
  ciclos := calcular_ciclos_bateria(bateria_id);
  degradacion := ciclos * 0.0005;
  degradacion := LEAST(degradacion, 1.0);
  capacidad_residual := (1 - degradacion) * 100;
  RETURN GREATEST(0, LEAST(100, capacidad_residual));
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION verificar_paros_solapados(
  piscina_id uuid,
  fecha_inicio date,
  fecha_fin date
)
RETURNS boolean AS $$
DECLARE
  overlapping_count integer;
BEGIN
  SELECT COUNT(*)
  INTO overlapping_count
  FROM paros_piscina
  WHERE piscina_id = piscina_id
    AND fecha_inicio < fecha_fin
    AND fecha_fin > fecha_inicio;

  RETURN overlapping_count > 0;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION actualizar_updated_at_bateria()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'BAJA' AND OLD.estado != 'BAJA' THEN
    NEW.updated_at := now();
  ELSIF NEW.estado != 'BAJA' THEN
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
-- 5. SEED DATA
-- ============================================================================

INSERT INTO piscinas (nombre, zona) VALUES
  ('Langua', 'Zona Norte'),
  ('La Esperanza', 'Zona Centro'),
  ('Vigsa', 'Zona Sur')
ON CONFLICT (nombre) DO NOTHING;

WITH piscinas_map AS (
  SELECT id, nombre FROM piscinas
  WHERE nombre IN ('Langua', 'La Esperanza', 'Vigsa')
)
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
  'SKU-' || ROW_NUMBER() OVER (ORDER BY p.nombre),
  'BAT-' || ROW_NUMBER() OVER (ORDER BY p.nombre) || '-2024',
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

-- Paros y comentarios requieren usuario autenticado - se crean desde la app
-- Para seed data de prueba, usar la aplicación después de loguearse

-- ============================================================================
-- 6. ÍNDICES ADICIONALES
-- ============================================================================

CREATE INDEX idx_comentarios_fecha ON comentarios_bateria(fecha_creacion DESC);
CREATE INDEX idx_paros_motivo ON paros_piscina(motivo);

-- ============================================================================
-- 7. VISTA
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
