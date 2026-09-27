-- ============================================================================
-- FIX: Proveedores RLS - agregar created_by y política correcta
-- ============================================================================

-- 1. Agregar columna created_by a proveedores
ALTER TABLE proveedores 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Actualizar políticas RLS para proveedores
DROP POLICY IF EXISTS "proveedores_insert_auth" ON proveedores;
DROP POLICY IF EXISTS "proveedores_update_auth" ON proveedores;

-- INSERT: usuario autenticado y created_by = usuario actual
CREATE POLICY "proveedores_insert_auth" ON proveedores
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  );

-- UPDATE: solo el creador o admin
CREATE POLICY "proveedores_update_auth" ON proveedores
  FOR UPDATE USING (
    auth.uid() IS NOT NULL 
    AND (created_by = auth.uid() OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'))
  );

-- 3. Actualizar función create en supabaseClient.js para incluir created_by
-- (Esto se hará en el código JS)

-- 4. Seed data con created_by NULL (para compatibilidad)
UPDATE proveedores SET created_by = NULL WHERE created_by IS NULL;