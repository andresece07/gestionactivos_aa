-- Paso 1: Crear tipo ENUM para cronograma
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_cronograma') THEN
    CREATE TYPE estado_cronograma AS ENUM ('TURNO', 'LIBRE', 'ENFERMO', 'VACACIONES', 'FALTA', 'PROGRAMADO');
  END IF;
END $$;

-- Paso 2: Crear tabla empleados
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

-- Paso 3: Crear tabla cronograma_personal
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

-- Paso 4: Habilitar RLS
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE cronograma_personal ENABLE ROW LEVEL SECURITY;

-- Paso 5: Crear policies sin IF NOT EXISTS
CREATE POLICY empleados_select ON empleados FOR SELECT USING (true);
CREATE POLICY cronograma_select ON cronograma_personal FOR SELECT USING (true);
CREATE POLICY cronograma_insert ON cronograma_personal FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY cronograma_update ON cronograma_personal FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Paso 6: Insertar empleados de prueba
INSERT INTO empleados (nombre, cargo, color, activo)
VALUES
  ('Juan Pérez', 'Gerente', '#e3f2fd', true),
  ('María García', 'Técnico', '#f3e5f5', true),
  ('Carlos López', 'Operario', '#e8f5e9', true),
  ('Ana Martínez', 'Operario', '#fff3e0', true),
  ('Roberto Silva', 'Mantenimiento', '#fce4ec', true)
ON CONFLICT DO NOTHING;