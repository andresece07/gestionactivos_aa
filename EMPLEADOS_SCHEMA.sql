-- ============================================================================
-- SCHEMA: Tablas para Empleados y Cronograma
-- Ejecutado en Supabase directamente
-- ============================================================================

-- Crear tipo enum para estados de cronograma
DROP TYPE IF EXISTS estado_cronograma CASCADE;
CREATE TYPE estado_cronograma AS ENUM ('TURNO', 'LIBRE', 'ENFERMO', 'VACACIONES', 'FALTA', 'PROGRAMADO');

-- ============================================================================
-- Tabla: empleados
-- ============================================================================

CREATE TABLE IF NOT EXISTS empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cargo text NOT NULL,
  color text DEFAULT '#e3f2fd',
  piscina_id uuid REFERENCES piscinas(id) ON DELETE SET NULL,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT nombre_no_vacio CHECK (length(trim(nombre)) > 0),
  CONSTRAINT cargo_no_vacio CHECK (length(trim(cargo)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_empleados_piscina ON empleados(piscina_id);
CREATE INDEX IF NOT EXISTS idx_empleados_activo ON empleados(activo);

-- Habilitar RLS
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "empleados_select_all" ON empleados
  FOR SELECT USING (true);

CREATE POLICY "empleados_insert_auth" ON empleados
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "empleados_update_auth" ON empleados
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- Tabla: cronograma_personal
-- ============================================================================

CREATE TABLE IF NOT EXISTS cronograma_personal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id uuid NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  estado estado_cronograma NOT NULL DEFAULT 'PROGRAMADO',
  motivo text,
  evidencia_url text,
  creado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cronograma_unico ON cronograma_personal(empleado_id, fecha);
CREATE INDEX IF NOT EXISTS idx_cronograma_empleado ON cronograma_personal(empleado_id);
CREATE INDEX IF NOT EXISTS idx_cronograma_fecha ON cronograma_personal(fecha);
CREATE INDEX IF NOT EXISTS idx_cronograma_estado ON cronograma_personal(estado);

-- Habilitar RLS
ALTER TABLE cronograma_personal ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "cronograma_select_all" ON cronograma_personal
  FOR SELECT USING (true);

CREATE POLICY "cronograma_insert_auth" ON cronograma_personal
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "cronograma_update_auth" ON cronograma_personal
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- Seed data: Empleados de prueba
-- ============================================================================

INSERT INTO empleados (nombre, cargo, color, activo)
VALUES
  ('Juan Pérez', 'Gerente', '#e3f2fd', true),
  ('María García', 'Técnico', '#f3e5f5', true),
  ('Carlos López', 'Operario', '#e8f5e9', true),
  ('Ana Martínez', 'Operario', '#fff3e0', true),
  ('Roberto Silva', 'Mantenimiento', '#fce4ec', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIN
-- ============================================================================
