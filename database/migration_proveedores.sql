-- ============================================================================
-- MIGRATION: Agregar tabla de proveedores y relación con baterías
-- ============================================================================

-- Crear tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  contacto text,
  telefono text,
  email text,
  direccion text,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT nombre_no_vacio CHECK (length(trim(nombre)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores(nombre);
CREATE INDEX IF NOT EXISTS idx_proveedores_activo ON proveedores(activo);

-- Agregar columna proveedor_id a baterías si no existe
ALTER TABLE baterias
ADD COLUMN IF NOT EXISTS proveedor_id uuid REFERENCES proveedores(id) ON DELETE SET NULL;

-- Crear índice para proveedor_id
CREATE INDEX IF NOT EXISTS idx_baterias_proveedor ON baterias(proveedor_id);

-- Habilitar RLS para proveedores
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para proveedores
CREATE POLICY IF NOT EXISTS "proveedores_select_all" ON proveedores
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "proveedores_insert_auth" ON proveedores
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "proveedores_update_auth" ON proveedores
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Seed data: Agregar algunos proveedores de ejemplo
INSERT INTO proveedores (nombre, contacto, email)
VALUES
  ('Soluna Energy', 'Juan Carlos García', 'contacto@soluna.com'),
  ('PowerCell Systems', 'María López Ruiz', 'ventas@powercell.com'),
  ('EnerTech Solutions', 'Carlos Martínez', 'info@enertech.com'),
  ('Baterías Renovables SA', 'Ana Silva', 'soporte@baterias-renewables.com')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================================
-- Fin de migración
-- ============================================================================
