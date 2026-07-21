-- ============================================================================
-- PASO 1: Habilitar RLS para proveedores y baterías
-- ============================================================================

ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "proveedores_select_all" ON proveedores FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "proveedores_insert_auth" ON proveedores FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "proveedores_update_auth" ON proveedores FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PASO 2: Insertar datos de proveedores
-- ============================================================================

INSERT INTO proveedores (nombre, persona_contacto, email, telefono, ciudad, pais, activo)
VALUES
  ('BatteryTech Solutions', 'Carlos Mendez', 'info@batterytech.com', '+56 9 1234 5678', 'Santiago', 'Chile', true),
  ('Solar Energy Supplies', 'María López', 'contact@solarsupply.com', '+56 9 2345 6789', 'Concepción', 'Chile', true),
  ('Renewable Power Corp', 'Juan García', 'sales@renewpower.com', '+56 9 3456 7890', 'Valparaíso', 'Chile', true),
  ('EcoBattery International', 'Ana Silva', 'support@ecobattery.com', '+56 9 4567 8901', 'Puerto Montt', 'Chile', true)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================================
-- PASO 3: Crear tabla empleados
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_cronograma') THEN
    CREATE TYPE estado_cronograma AS ENUM ('TURNO', 'LIBRE', 'ENFERMO', 'VACACIONES', 'FALTA', 'PROGRAMADO');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cargo text NOT NULL,
  color text DEFAULT '#e3f2fd',
  piscina_id uuid REFERENCES piscinas(id) ON DELETE SET NULL,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_empleados_piscina ON empleados(piscina_id);
CREATE INDEX IF NOT EXISTS idx_empleados_activo ON empleados(activo);

ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "empleados_select_all" ON empleados FOR SELECT USING (true);

-- ============================================================================
-- PASO 4: Crear tabla cronograma_personal
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
  updated_at timestamp with time zone,
  UNIQUE(empleado_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_cronograma_empleado ON cronograma_personal(empleado_id);
CREATE INDEX IF NOT EXISTS idx_cronograma_fecha ON cronograma_personal(fecha);
CREATE INDEX IF NOT EXISTS idx_cronograma_estado ON cronograma_personal(estado);

ALTER TABLE cronograma_personal ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "cronograma_select_all" ON cronograma_personal FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "cronograma_insert_auth" ON cronograma_personal FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "cronograma_update_auth" ON cronograma_personal FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PASO 5: Insertar empleados de prueba
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
-- FIN: Toda la BD está lista
-- ============================================================================
