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
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT nombre_no_vacio CHECK (length(trim(nombre)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores(nombre);
CREATE INDEX IF NOT EXISTS idx_proveedores_activo ON proveedores(activo);

-- Agregar columna proveedor_id a baterías si no existe
ALTER TABLE baterias
ADD COLUMN IF NOT EXISTS proveedor_id uuid REFERENCES proveedores(id) ON DELETE SET NULL;

-- Crear índice para proveedor_id
CREATE INDEX IF NOT EXISTS idx_baterias_proveedor ON baterias(proveedor_id);

-- Agregar columna created_by si no existe (migración)
ALTER TABLE proveedores
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Habilitar RLS para proveedores
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para proveedores
DROP POLICY IF EXISTS "proveedores_select_all" ON proveedores;
DROP POLICY IF EXISTS "proveedores_insert_auth" ON proveedores;
DROP POLICY IF EXISTS "proveedores_update_auth" ON proveedores;

CREATE POLICY "proveedores_select_all" ON proveedores
  FOR SELECT USING (true);

CREATE POLICY "proveedores_insert_auth" ON proveedores
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  );

CREATE POLICY "proveedores_update_auth" ON proveedores
  FOR UPDATE USING (
    auth.uid() IS NOT NULL 
    AND (created_by = auth.uid() OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'))
  );

-- Seed data: Agregar algunos proveedores de ejemplo (created_by NULL para compatibilidad)
INSERT INTO proveedores (nombre, contacto, email, direccion, created_by)
VALUES
  ('Soluna Energy', 'Juan Carlos García', 'contacto@soluna.com', 'Av. Principal 123', NULL),
  ('PowerCell Systems', 'María López Ruiz', 'ventas@powercell.com', 'Calle Solar 456', NULL),
  ('EnerTech Solutions', 'Carlos Martínez', 'info@enertech.com', 'Zona Industrial 789', NULL),
  ('Baterías Renovables SA', 'Ana Silva', 'soporte@baterias-renewables.com', 'Parque Tech 321', NULL)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================================
-- Fin de migración
-- ============================================================================