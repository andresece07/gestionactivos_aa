-- Tabla de movimientos y registro de baterías
CREATE TABLE IF NOT EXISTS movimientos_baterias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bateria_id UUID NOT NULL REFERENCES baterias(id) ON DELETE CASCADE,
  piscina_id UUID NOT NULL REFERENCES piscinas(id) ON DELETE CASCADE,
  tolva VARCHAR(255) NOT NULL,
  tipo_movimiento VARCHAR(50) NOT NULL CHECK (tipo_movimiento IN ('INSTALACION', 'TRASLADO', 'MANTENIMIENTO', 'REPARACION', 'INSPECCION', 'CAMBIO_TOLVA', 'RECARGA', 'DESCARGA', 'OTRO')),

  -- Detalles técnicos
  ciclos_registrados INTEGER,
  capacidad_residual DECIMAL(5,2),
  voltaje_inicial DECIMAL(5,2),
  voltaje_final DECIMAL(5,2),
  temperatura DECIMAL(5,2),

  -- Información del movimiento
  usuario_id UUID REFERENCES auth.users(id),
  usuario_nombre VARCHAR(255),
  fecha_movimiento TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Observaciones y notas
  observaciones TEXT,
  estado_bateria VARCHAR(50) CHECK (estado_bateria IN ('FUNCIONANDO', 'CON_FALLA', 'REQUIERE_MANTENIMIENTO', 'FUERA_SERVICIO')),
  proxima_revision DATE,

  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_ciclos CHECK (ciclos_registrados IS NULL OR ciclos_registrados >= 0)
);

-- Índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_movimientos_bateria ON movimientos_baterias(bateria_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_piscina ON movimientos_baterias(piscina_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_baterias(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_baterias(tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario ON movimientos_baterias(usuario_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_movimientos_baterias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_movimientos_baterias_updated_at
BEFORE UPDATE ON movimientos_baterias
FOR EACH ROW
EXECUTE FUNCTION update_movimientos_baterias_updated_at();

-- RLS (Row Level Security)
ALTER TABLE movimientos_baterias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver movimientos" ON movimientos_baterias
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios pueden insertar movimientos" ON movimientos_baterias
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios pueden actualizar movimientos propios" ON movimientos_baterias
  FOR UPDATE
  USING (usuario_id = auth.uid() OR auth.uid() IS NOT NULL)
  WITH CHECK (usuario_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios pueden eliminar movimientos propios" ON movimientos_baterias
  FOR DELETE
  USING (usuario_id = auth.uid() OR auth.uid() IS NOT NULL);
