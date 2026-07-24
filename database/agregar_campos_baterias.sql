-- Agregar campos faltantes a la tabla de baterías
ALTER TABLE baterias ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE baterias ADD COLUMN IF NOT EXISTS imagen_url VARCHAR(500);
ALTER TABLE baterias ADD COLUMN IF NOT EXISTS tecnico_id UUID REFERENCES auth.users(id);
ALTER TABLE baterias ADD COLUMN IF NOT EXISTS tecnico_nombre VARCHAR(255);
ALTER TABLE baterias ADD COLUMN IF NOT EXISTS finca VARCHAR(255);
ALTER TABLE baterias ADD COLUMN IF NOT EXISTS sector VARCHAR(255);

-- Agregar campo tolva (ubicación específica donde está la batería)
ALTER TABLE baterias ADD COLUMN IF NOT EXISTS tolva VARCHAR(255);

-- Agregar campo amperaje
ALTER TABLE baterias ADD COLUMN IF NOT EXISTS amperaje DECIMAL(10, 2);

-- Crear índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_baterias_finca ON baterias(finca);
CREATE INDEX IF NOT EXISTS idx_baterias_sector ON baterias(sector);
CREATE INDEX IF NOT EXISTS idx_baterias_tecnico ON baterias(tecnico_id);
