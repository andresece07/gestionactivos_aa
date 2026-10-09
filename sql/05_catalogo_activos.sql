-- ============================================================================
-- MIGRACIÓN 05: Catálogo de Activos Genérico (reemplaza solo-baterías)
-- ============================================================================
-- Ejecutar EN ORDEN después de schema_baterias_fv.sql
-- ============================================================================

-- 1. TIPOS ENUMERADOS NUEVOS
-- ============================================================================
CREATE TYPE estado_activo AS ENUM ('ACTIVO', 'BAJA', 'EN_MANTENIMIENTO', 'OBSOLETO');
CREATE TYPE tipo_obsolescencia AS ENUM ('LINEAL', 'EXPONENCIAL', 'POR_USO', 'POR_TIEMPO', 'PERSONALIZADA');

-- 2. CATÁLOGO DE CATEGORÍAS DE PRODUCTOS
-- ============================================================================
CREATE TABLE categorias_producto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,           -- ej: 'BAT', 'PAN', 'INV', 'SEN'
  nombre text NOT NULL,                  -- ej: 'Baterías', 'Paneles', 'Inversores'
  descripcion text,
  -- Configuración de obsolescencia por categoría
  tipo_obsolescencia tipo_obsolescencia NOT NULL DEFAULT 'LINEAL',
  vida_util_anos numeric(5,2) NOT NULL DEFAULT 10,  -- vida útil base en años
  factor_degradacion numeric(8,6) NOT NULL DEFAULT 0.0005,  -- degradación por ciclo/año
  unidad_medida_vida text NOT NULL DEFAULT 'ANOS',  -- ANOS, CICLOS, HORAS, KM
  -- Campos genéricos que aplica esta categoría
  campos_esquema jsonb DEFAULT '{}',     -- definición de campos extra por categoría
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT codigo_no_vacio CHECK (length(trim(codigo)) > 0),
  CONSTRAINT nombre_no_vacio CHECK (length(trim(nombre)) > 0),
  CONSTRAINT vida_util_positiva CHECK (vida_util_anos > 0)
);

CREATE INDEX idx_categorias_activo ON categorias_producto(activo);
CREATE INDEX idx_categorias_codigo ON categorias_producto(codigo);

-- 3. CATÁLOGO DE PRODUCTOS (SKUs maestros)
-- ============================================================================
CREATE TABLE productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,              -- SKU Dynamics / código maestro
  nombre text NOT NULL,                  -- nombre comercial
  categoria_id uuid NOT NULL REFERENCES categorias_producto(id) ON DELETE RESTRICT,
  marca text,
  modelo text,
  descripcion text,
  -- Especificaciones técnicas (flexible por categoría)
  especificaciones jsonb DEFAULT '{}',   -- ej: {"capacidad_kwh": 10.5, "amperios": 200}
  -- Voltaje predefinido (12, 24, 48)
  voltaje_nominal integer CHECK (voltaje_nominal IN (12, 24, 48)),
  -- Campos para obsolescencia (sobrescriben categoría si se definen)
  vida_util_anos numeric(5,2),           -- null = usa categoría
  factor_degradacion numeric(8,6),       -- null = usa categoría
  unidad_medida_vida text,               -- null = usa categoría
  -- Gestión
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT sku_no_vacio CHECK (length(trim(sku)) > 0),
  CONSTRAINT nombre_no_vacio CHECK (length(trim(nombre)) > 0)
);

CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_productos_sku ON productos(sku);

-- 4. CATÁLOGOS MAESTROS (cargables desde Excel)
-- ============================================================================

-- Marcas
CREATE TABLE marcas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,           -- código corto ej: 'DYN', 'JNK', 'LON', 'PYL'
  nombre text NOT NULL UNIQUE,           -- nombre completo ej: 'Dyness', 'Jinko Solar'
  descripcion text,
  pais_origen text,
  sitio_web text,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT codigo_no_vacio CHECK (length(trim(codigo)) > 0),
  CONSTRAINT nombre_no_vacio CHECK (length(trim(nombre)) > 0)
);

CREATE INDEX idx_marcas_activo ON marcas(activo);
CREATE INDEX idx_marcas_codigo ON marcas(codigo);

-- Agregar marca_id a productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS marca_id uuid REFERENCES marcas(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_productos_marca ON productos(marca_id);

-- Fincas
CREATE TABLE fincas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,           -- código corto ej: 'FIN-01'
  nombre text NOT NULL UNIQUE,
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT codigo_no_vacio CHECK (length(trim(codigo)) > 0),
  CONSTRAINT nombre_no_vacio CHECK (length(trim(nombre)) > 0)
);

CREATE INDEX idx_fincas_activo ON fincas(activo);
CREATE INDEX idx_fincas_codigo ON fincas(codigo);

CREATE TABLE zonas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id uuid NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
  codigo text NOT NULL,                  -- ej: 'ZN', 'ZC', 'ZS'
  nombre text NOT NULL,                  -- ej: 'Zona Norte', 'Zona Centro'
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT codigo_no_vacio CHECK (length(trim(codigo)) > 0),
  CONSTRAINT nombre_no_vacio CHECK (length(trim(nombre)) > 0),
  UNIQUE(finca_id, codigo)
);

CREATE INDEX idx_zonas_finca ON zonas(finca_id);
CREATE INDEX idx_zonas_activo ON zonas(activo);

CREATE TABLE tolvas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_id uuid NOT NULL REFERENCES zonas(id) ON DELETE CASCADE,
  codigo text NOT NULL,                  -- ej: 'TOL-A1', 'TOL-B2'
  nombre text NOT NULL,                  -- ej: 'Tolva A-1'
  descripcion text,
  capacidad_maxima numeric(10,2),        -- capacidad máxima (kg, litros, etc)
  unidad_medida text DEFAULT 'KG',
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT codigo_no_vacio CHECK (length(trim(codigo)) > 0),
  CONSTRAINT nombre_no_vacio CHECK (length(trim(nombre)) > 0),
  UNIQUE(zona_id, codigo)
);

CREATE INDEX idx_tolvas_zona ON tolvas(zona_id);
CREATE INDEX idx_tolvas_activo ON tolvas(activo);

-- 5. ACTIVOS (reemplaza tabla baterias - genérico para cualquier artículo)
-- ============================================================================
CREATE TABLE activos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identificación
  codigo_unico text NOT NULL UNIQUE,     -- código de inventario/etiqueta físico
  producto_id uuid NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  -- Ubicación (jerarquía: Finca → Zona → Tolva)
  finca_id uuid REFERENCES fincas(id) ON DELETE SET NULL,
  zona_id uuid REFERENCES zonas(id) ON DELETE SET NULL,
  tolva_id uuid REFERENCES tolvas(id) ON DELETE SET NULL,
  -- Piscina (mantener compatibilidad con sistema actual)
  piscina_id uuid REFERENCES piscinas(id) ON DELETE SET NULL,
  -- Proveedor
  proveedor_id uuid REFERENCES proveedores(id) ON DELETE SET NULL,
  -- Fechas
  fecha_compra date NOT NULL,
  fecha_instalacion date NOT NULL,
  fecha_baja date,
  -- Estado y métricas
  estado estado_activo NOT NULL DEFAULT 'ACTIVO',
  -- Valores técnicos (sobrescriben producto si se definen)
  especificaciones jsonb DEFAULT '{}',   -- valores reales de este activo
  -- Métricas de uso/desgaste (genéricas)
  ciclos_totales integer DEFAULT 0,
  horas_uso numeric(10,2) DEFAULT 0,
  kilometros numeric(10,2) DEFAULT 0,
  -- Obsolescencia calculada
  obsolescencia_pct numeric(5,2) DEFAULT 0,  -- 0-100%
  vida_util_restante_anos numeric(5,2),
  -- Auditoría
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT codigo_unico_no_vacio CHECK (length(trim(codigo_unico)) > 0),
  CONSTRAINT fechas_validas CHECK (fecha_compra <= fecha_instalacion),
  CONSTRAINT obsolescencia_rango CHECK (obsolescencia_pct >= 0 AND obsolescencia_pct <= 100)
);

CREATE INDEX idx_activos_producto ON activos(producto_id);
CREATE INDEX idx_activos_finca ON activos(finca_id);
CREATE INDEX idx_activos_zona ON activos(zona_id);
CREATE INDEX idx_activos_tolva ON activos(tolva_id);
CREATE INDEX idx_activos_piscina ON activos(piscina_id);
CREATE INDEX idx_activos_proveedor ON activos(proveedor_id);
CREATE INDEX idx_activos_estado ON activos(estado);
CREATE INDEX idx_activos_codigo_unico ON activos(codigo_unico);
CREATE INDEX idx_activos_created_by ON activos(created_by);
CREATE INDEX idx_movimientos_usuario ON movimientos_activos(usuario_id);
CREATE INDEX idx_comentarios_activo_usuario ON comentarios_activo(usuario_id);

-- 6. MOVIMIENTOS DE ACTIVOS (generaliza movimientos_baterias)
-- ============================================================================
CREATE TYPE tipo_movimiento_activo AS ENUM (
  'INSTALACION', 'TRASLADO', 'MANTENIMIENTO', 'REPARACION', 
  'INSPECCION', 'CAMBIO_UBICACION', 'RECARGA', 'DESCARGA',
  'CALIBRACION', 'ACTUALIZACION', 'BAJA', 'REACTIVACION', 'OTRO'
);

CREATE TABLE movimientos_activos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activo_id uuid NOT NULL REFERENCES activos(id) ON DELETE CASCADE,
  -- Ubicación origen/destino
  finca_id_origen uuid REFERENCES fincas(id) ON DELETE SET NULL,
  zona_id_origen uuid REFERENCES zonas(id) ON DELETE SET NULL,
  tolva_id_origen uuid REFERENCES tolvas(id) ON DELETE SET NULL,
  piscina_id_origen uuid REFERENCES piscinas(id) ON DELETE SET NULL,
  finca_id_destino uuid REFERENCES fincas(id) ON DELETE SET NULL,
  zona_id_destino uuid REFERENCES zonas(id) ON DELETE SET NULL,
  tolva_id_destino uuid REFERENCES tolvas(id) ON DELETE SET NULL,
  piscina_id_destino uuid REFERENCES piscinas(id) ON DELETE SET NULL,
  -- Detalles del movimiento
  tipo_movimiento tipo_movimiento_activo NOT NULL,
  estado_activo estado_activo,
  -- Métricas registradas en este movimiento
  ciclos_registrados integer,
  horas_uso_registradas numeric(10,2),
  kilometros_registrados numeric(10,2),
  obsolescencia_registrada numeric(5,2),
  -- Datos técnicos
  voltaje_inicial numeric(8,2),
  voltaje_final numeric(8,2),
  temperatura numeric(5,2),
  -- Observaciones
  observaciones text,
  proxima_revision date,
  -- Auditoría
  fecha_movimiento timestamp with time zone NOT NULL DEFAULT now(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  usuario_nombre text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_movimientos_activo ON movimientos_activos(activo_id);
CREATE INDEX idx_movimientos_fecha ON movimientos_activos(fecha_movimiento DESC);
CREATE INDEX idx_movimientos_tipo ON movimientos_activos(tipo_movimiento);
CREATE INDEX idx_movimientos_usuario ON movimientos_activos(usuario_id);

-- 7. COMENTARIOS DE ACTIVOS (generaliza comentarios_bateria)
-- ============================================================================
CREATE TABLE comentarios_activo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activo_id uuid NOT NULL REFERENCES activos(id) ON DELETE CASCADE,
  contenido text NOT NULL,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  fecha_creacion timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contenido_no_vacio CHECK (length(trim(contenido)) > 0)
);

CREATE INDEX idx_comentarios_activo ON comentarios_activo(activo_id);
CREATE INDEX idx_comentarios_fecha ON comentarios_activo(fecha_creacion DESC);

-- 8. FUNCIONES PARA CÁLCULO DE OBSOLESCENCIA GENÉRICO
-- ============================================================================

-- Obtener configuración de obsolescencia de un activo (producto > categoría)
CREATE OR REPLACE FUNCTION obtener_config_obsolescencia(activo_id uuid)
RETURNS TABLE(
  tipo_obsolescencia tipo_obsolescencia,
  vida_util_anos numeric,
  factor_degradacion numeric,
  unidad_medida_vida text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.tipo_obsolescencia,
    COALESCE(p.vida_util_anos, c.vida_util_anos),
    COALESCE(p.factor_degradacion, c.factor_degradacion),
    COALESCE(p.unidad_medida_vida, c.unidad_medida_vida)
  FROM activos a
  JOIN productos p ON a.producto_id = p.id
  JOIN categorias_producto c ON p.categoria_id = c.id
  WHERE a.id = activo_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Calcular obsolescencia por TIEMPO (años desde instalación)
CREATE OR REPLACE FUNCTION calcular_obsolescencia_tiempo(activo_id uuid)
RETURNS numeric AS $$
DECLARE
  config RECORD;
  anos_transcurridos numeric;
  obsolescencia numeric;
BEGIN
  SELECT * INTO config FROM obtener_config_obsolescencia(activo_id);
  
  SELECT EXTRACT(EPOCH FROM (CURRENT_DATE - fecha_instalacion)) / (365.25 * 24 * 60 * 60)
  INTO anos_transcurridos
  FROM activos WHERE id = activo_id;
  
  IF config.tipo_obsolescencia = 'LINEAL' THEN
    obsolescencia := (anos_transcurridos / config.vida_util_anos) * 100;
  ELSIF config.tipo_obsolescencia = 'EXPONENCIAL' THEN
    obsolescencia := (1 - EXP(-config.factor_degradacion * anos_transcurridos)) * 100;
  ELSE
    obsolescencia := (anos_transcurridos / config.vida_util_anos) * 100;
  END IF;
  
  RETURN GREATEST(0, LEAST(100, ROUND(obsolescencia::numeric, 2)));
END;
$$ LANGUAGE plpgsql STABLE;

-- Calcular obsolescencia POR USO (ciclos/horas/km)
CREATE OR REPLACE FUNCTION calcular_obsolescencia_uso(activo_id uuid)
RETURNS numeric AS $$
DECLARE
  config RECORD;
  uso_total numeric;
  vida_util_total numeric;
  obsolescencia numeric;
BEGIN
  SELECT * INTO config FROM obtener_config_obsolescencia(activo_id);
  
  SELECT 
    CASE config.unidad_medida_vida
      WHEN 'CICLOS' THEN ciclos_totales
      WHEN 'HORAS' THEN horas_uso
      WHEN 'KM' THEN kilometros
      ELSE 0
    END,
    config.vida_util_anos * 
    CASE config.unidad_medida_vida
      WHEN 'CICLOS' THEN 365  -- ciclos por año estimados
      WHEN 'HORAS' THEN 8760  -- horas por año
      WHEN 'KM' THEN 50000    -- km por año estimados
      ELSE 1
    END
  INTO uso_total, vida_util_total
  FROM activos WHERE id = activo_id;
  
  IF vida_util_total > 0 THEN
    obsolescencia := (uso_total / vida_util_total) * 100;
  ELSE
    obsolescencia := 0;
  END IF;
  
  RETURN GREATEST(0, LEAST(100, ROUND(obsolescencia::numeric, 2)));
END;
$$ LANGUAGE plpgsql STABLE;

-- Función principal: calcular obsolescencia combinada
CREATE OR REPLACE FUNCTION calcular_obsolescencia_activo(activo_id uuid)
RETURNS numeric AS $$
DECLARE
  config RECORD;
  obs_tiempo numeric;
  obs_uso numeric;
  obs_final numeric;
BEGIN
  SELECT * INTO config FROM obtener_config_obsolescencia(activo_id);
  
  obs_tiempo := calcular_obsolescencia_tiempo(activo_id);
  obs_uso := calcular_obsolescencia_uso(activo_id);
  
  -- Tomar el mayor (más conservador) o promedio ponderado
  IF config.unidad_medida_vida IN ('CICLOS', 'HORAS', 'KM') THEN
    obs_final := GREATEST(obs_tiempo, obs_uso);
  ELSE
    obs_final := obs_tiempo;
  END IF;
  
  RETURN GREATEST(0, LEAST(100, obs_final));
END;
$$ LANGUAGE plpgsql STABLE;

-- Calcular vida útil restante en años
CREATE OR REPLACE FUNCTION calcular_vida_util_restante(activo_id uuid)
RETURNS numeric AS $$
DECLARE
  config RECORD;
  obs_pct numeric;
  anos_transcurridos numeric;
  vida_restante numeric;
BEGIN
  SELECT * INTO config FROM obtener_config_obsolescencia(activo_id);
  obs_pct := calcular_obsolescencia_activo(activo_id);
  
  SELECT EXTRACT(EPOCH FROM (CURRENT_DATE - fecha_instalacion)) / (365.25 * 24 * 60 * 60)
  INTO anos_transcurridos
  FROM activos WHERE id = activo_id;
  
  vida_restante := config.vida_util_anos * (1 - obs_pct / 100);
  
  RETURN GREATEST(0, ROUND(vida_restante::numeric, 2));
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger para actualizar obsolescencia automáticamente en movimientos
CREATE OR REPLACE FUNCTION actualizar_obsolescencia_activo()
RETURNS TRIGGER AS $$
DECLARE
  nueva_obsolescencia numeric;
  nueva_vida_restante numeric;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Si el movimiento registra métricas, actualizar el activo
    IF NEW.ciclos_registrados IS NOT NULL THEN
      UPDATE activos SET ciclos_totales = ciclos_totales + NEW.ciclos_registrados WHERE id = NEW.activo_id;
    END IF;
    IF NEW.horas_uso_registradas IS NOT NULL THEN
      UPDATE activos SET horas_uso = horas_uso + NEW.horas_uso_registradas WHERE id = NEW.activo_id;
    END IF;
    IF NEW.kilometros_registrados IS NOT NULL THEN
      UPDATE activos SET kilometros = kilometros + NEW.kilometros_registrados WHERE id = NEW.activo_id;
    END IF;
    
    -- Recalcular obsolescencia
    nueva_obsolescencia := calcular_obsolescencia_activo(NEW.activo_id);
    nueva_vida_restante := calcular_vida_util_restante(NEW.activo_id);
    
    UPDATE activos 
    SET obsolescencia_pct = nueva_obsolescencia,
        vida_util_restante_anos = nueva_vida_restante,
        updated_at = now()
    WHERE id = NEW.activo_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_obsolescencia
  AFTER INSERT OR UPDATE ON movimientos_activos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_obsolescencia_activo();

-- 9. VISTAS PARA REPORTES
-- ============================================================================

-- Vista completa de activos con info de catálogo
CREATE OR REPLACE VIEW vw_activos_completo AS
SELECT
  a.id,
  a.codigo_unico,
  p.sku,
  p.nombre as producto_nombre,
  p.marca,
  p.modelo,
  cat.codigo as categoria_codigo,
  cat.nombre as categoria_nombre,
  cat.tipo_obsolescencia,
  cat.vida_util_anos as categoria_vida_util,
  f.codigo as finca_codigo,
  f.nombre as finca_nombre,
  z.codigo as zona_codigo,
  z.nombre as zona_nombre,
  t.codigo as tolva_codigo,
  t.nombre as tolva_nombre,
  psc.nombre as piscina_nombre,
  prov.nombre as proveedor_nombre,
  a.fecha_compra,
  a.fecha_instalacion,
  a.fecha_baja,
  a.estado,
  a.especificaciones,
  a.ciclos_totales,
  a.horas_uso,
  a.kilometros,
  a.obsolescencia_pct,
  a.vida_util_restante_anos,
  a.observaciones,
  a.created_at,
  a.updated_at,
  -- Edad en años
  ROUND(EXTRACT(EPOCH FROM (CURRENT_DATE - a.fecha_instalacion)) / (365.25 * 24 * 60 * 60)::numeric, 2) as anos_desde_instalacion
FROM activos a
JOIN productos p ON a.producto_id = p.id
JOIN categorias_producto cat ON p.categoria_id = cat.id
LEFT JOIN fincas f ON a.finca_id = f.id
LEFT JOIN zonas z ON a.zona_id = z.id
LEFT JOIN tolvas t ON a.tolva_id = t.id
LEFT JOIN piscinas psc ON a.piscina_id = psc.id
LEFT JOIN proveedores prov ON a.proveedor_id = prov.id
ORDER BY a.created_at DESC;

-- Vista de activos con obsolescencia crítica
CREATE OR REPLACE VIEW vw_activos_obsolescencia_critica AS
SELECT *
FROM vw_activos_completo
WHERE obsolescencia_pct >= 80
  AND estado IN ('ACTIVO', 'EN_MANTENIMIENTO')
ORDER BY obsolescencia_pct DESC, vida_util_restante_anos ASC;

-- 10. RLS PARA NUEVAS TABLAS
-- ============================================================================
ALTER TABLE categorias_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fincas ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tolvas ENABLE ROW LEVEL SECURITY;
ALTER TABLE activos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_activos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_activo ENABLE ROW LEVEL SECURITY;

-- Políticas SELECT público
CREATE POLICY "categorias_select_all" ON categorias_producto FOR SELECT USING (true);
CREATE POLICY "productos_select_all" ON productos FOR SELECT USING (true);
CREATE POLICY "marcas_select_all" ON marcas FOR SELECT USING (true);
CREATE POLICY "fincas_select_all" ON fincas FOR SELECT USING (true);
CREATE POLICY "zonas_select_all" ON zonas FOR SELECT USING (true);
CREATE POLICY "tolvas_select_all" ON tolvas FOR SELECT USING (true);
CREATE POLICY "activos_select_all" ON activos FOR SELECT USING (true);
CREATE POLICY "movimientos_select_all" ON movimientos_activos FOR SELECT USING (true);
CREATE POLICY "comentarios_activo_select_all" ON comentarios_activo FOR SELECT USING (true);

-- Políticas INSERT autenticado
CREATE POLICY "categorias_insert_auth" ON categorias_producto FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "productos_insert_auth" ON productos FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "marcas_insert_auth" ON marcas FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "fincas_insert_auth" ON fincas FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "zonas_insert_auth" ON zonas FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "tolvas_insert_auth" ON tolvas FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "activos_insert_auth" ON activos FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "movimientos_insert_auth" ON movimientos_activos FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL AND usuario_id = (select auth.uid()));
CREATE POLICY "comentarios_activo_insert_auth" ON comentarios_activo FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL AND usuario_id = (select auth.uid()));

-- Políticas UPDATE autenticado (solo campos permitidos)
CREATE POLICY "categorias_update_auth" ON categorias_producto FOR UPDATE USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "productos_update_auth" ON productos FOR UPDATE USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "marcas_update_auth" ON marcas FOR UPDATE USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "fincas_update_auth" ON fincas FOR UPDATE USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "zonas_update_auth" ON zonas FOR UPDATE USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "tolvas_update_auth" ON tolvas FOR UPDATE USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "activos_update_auth" ON activos FOR UPDATE USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "movimientos_update_auth" ON movimientos_activos FOR UPDATE USING ((select auth.uid()) IS NOT NULL);

-- 11. SEED DATA INICIAL
-- ============================================================================

-- Categorías base
INSERT INTO categorias_producto (codigo, nombre, descripcion, tipo_obsolescencia, vida_util_anos, factor_degradacion, unidad_medida_vida, campos_esquema) VALUES
('BAT', 'Baterías', 'Baterías fotovoltaicas y de respaldo', 'EXPONENCIAL', 10, 0.0005, 'CICLOS', '{"voltaje_nominal": "number", "capacidad_kwh": "number", "amperios": "number"}'),
('PAN', 'Paneles Solares', 'Módulos fotovoltaicos', 'LINEAL', 25, 0.005, 'ANOS', '{"potencia_wp": "number", "voltaje_max": "number", "corriente_max": "number"}'),
('INV', 'Inversores', 'Inversores de corriente', 'LINEAL', 15, 0.01, 'ANOS', '{"potencia_kw": "number", "voltaje_entrada": "number", "voltaje_salida": "number"}'),
('SEN', 'Sensores', 'Sensores de monitoreo', 'POR_USO', 5, 0.02, 'HORAS', '{"tipo_sensor": "text", "rango": "text", "precision": "text"}'),
('BOM', 'Bombas', 'Bombas de agua', 'POR_USO', 10, 0.01, 'HORAS', '{"potencia_hp": "number", "caudal": "number", "altura_manometrica": "number"}'),
('GEN', 'Generadores', 'Generadores eléctricos', 'POR_USO', 20, 0.008, 'HORAS', '{"potencia_kva": "number", "tipo_combustible": "text", "voltaje": "number"}'),
('OTR', 'Otros Equipos', 'Equipos varios', 'LINEAL', 10, 0.01, 'ANOS', '{}')
ON CONFLICT (codigo) DO NOTHING;

-- Marcas (cargables desde Excel)
INSERT INTO marcas (codigo, nombre, descripcion, pais_origen, sitio_web) VALUES
('DYN', 'Dyness', 'Baterías LiFePO4 para almacenamiento residencial e industrial', 'China', 'https://dyness.com'),
('PYL', 'Pylontech', 'Líder mundial en baterías de litio para almacenamiento de energía', 'China', 'https://pylontech.com.cn'),
('JNK', 'Jinko Solar', 'Uno de los mayores fabricantes de módulos fotovoltaicos del mundo', 'China', 'https://jinkosolar.com'),
('LON', 'Longi Solar', 'Tecnología monocristalina de alta eficiencia', 'China', 'https://longi.com'),
('DEY', 'Deye', 'Inversores híbridos y off-grid', 'China', 'https://deyeinverter.com'),
('HUA', 'Huawei', 'Inversores solares inteligentes', 'China', 'https://solar.huawei.com'),
('VIC', 'Victron Energy', 'Equipos de energía off-grid y marinos', 'Países Bajos', 'https://victronenergy.com'),
('SMA', 'SMA Solar Technology', 'Inversores fotovoltaicos alemanes', 'Alemania', 'https://sma.de'),
('GRO', 'Growatt', 'Inversores y soluciones de almacenamiento', 'China', 'https://ginverter.com'),
('GOO', 'GoodWe', 'Inversores inteligentes y soluciones de energía', 'China', 'https://goodwe.com')
ON CONFLICT (codigo) DO NOTHING;

-- Fincas ejemplo (cargables desde Excel)
INSERT INTO fincas (codigo, nombre, descripcion) VALUES
('FIN-01', 'Finca Langua', 'Finca principal zona norte'),
('FIN-02', 'Finca La Esperanza', 'Finca zona centro'),
('FIN-03', 'Finca Vigsa', 'Finca zona sur'),
('FIN-04', 'Finca El Porvenir', 'Finca nueva adquisición')
ON CONFLICT (codigo) DO NOTHING;

-- Zonas ejemplo
INSERT INTO zonas (finca_id, codigo, nombre) 
SELECT f.id, 'ZN', 'Zona Norte' FROM fincas f WHERE f.codigo = 'FIN-01'
ON CONFLICT DO NOTHING;
INSERT INTO zonas (finca_id, codigo, nombre) 
SELECT f.id, 'ZC', 'Zona Centro' FROM fincas f WHERE f.codigo = 'FIN-02'
ON CONFLICT DO NOTHING;
INSERT INTO zonas (finca_id, codigo, nombre) 
SELECT f.id, 'ZS', 'Zona Sur' FROM fincas f WHERE f.codigo = 'FIN-03'
ON CONFLICT DO NOTHING;

-- Tolvas ejemplo
INSERT INTO tolvas (zona_id, codigo, nombre, capacidad_maxima)
SELECT z.id, 'TOL-A1', 'Tolva A-1', 5000 FROM zonas z WHERE z.codigo = 'ZN' AND z.finca_id = (SELECT id FROM fincas WHERE codigo = 'FIN-01')
ON CONFLICT DO NOTHING;
INSERT INTO tolvas (zona_id, codigo, nombre, capacidad_maxima)
SELECT z.id, 'TOL-A2', 'Tolva A-2', 5000 FROM zonas z WHERE z.codigo = 'ZN' AND z.finca_id = (SELECT id FROM fincas WHERE codigo = 'FIN-01')
ON CONFLICT DO NOTHING;
INSERT INTO tolvas (zona_id, codigo, nombre, capacidad_maxima)
SELECT z.id, 'TOL-B1', 'Tolva B-1', 3000 FROM zonas z WHERE z.codigo = 'ZC' AND z.finca_id = (SELECT id FROM fincas WHERE codigo = 'FIN-02')
ON CONFLICT DO NOTHING;
INSERT INTO tolvas (zona_id, codigo, nombre, capacidad_maxima)
SELECT z.id, 'TOL-C1', 'Tolva C-1', 4000 FROM zonas z WHERE z.codigo = 'ZS' AND z.finca_id = (SELECT id FROM fincas WHERE codigo = 'FIN-03')
ON CONFLICT DO NOTHING;

-- Productos ejemplo (SKUs cargables desde Excel)
WITH cat_bat AS (SELECT id FROM categorias_producto WHERE codigo = 'BAT'),
     cat_pan AS (SELECT id FROM categorias_producto WHERE codigo = 'PAN'),
     cat_inv AS (SELECT id FROM categorias_producto WHERE codigo = 'INV'),
     m_dyn AS (SELECT id FROM marcas WHERE codigo = 'DYN'),
     m_pyl AS (SELECT id FROM marcas WHERE codigo = 'PYL'),
     m_jnk AS (SELECT id FROM marcas WHERE codigo = 'JNK'),
     m_lon AS (SELECT id FROM marcas WHERE codigo = 'LON'),
     m_dey AS (SELECT id FROM marcas WHERE codigo = 'DEY')
INSERT INTO productos (sku, nombre, categoria_id, marca_id, marca, modelo, especificaciones, voltaje_nominal, vida_util_anos, factor_degradacion) VALUES
('BAT-48V-10KWH', 'Batería 48V 10.5kWh LiFePO4', (SELECT id FROM cat_bat), (SELECT id FROM m_dyn), 'Dyness', 'PowerBox 10', '{"capacidad_kwh": 10.5, "amperios": 210, "quimica": "LiFePO4"}', 48, 10, 0.0005),
('BAT-48V-15KWH', 'Batería 48V 15.2kWh LiFePO4', (SELECT id FROM cat_bat), (SELECT id FROM m_dyn), 'Dyness', 'PowerBox 15', '{"capacidad_kwh": 15.2, "amperios": 300, "quimica": "LiFePO4"}', 48, 10, 0.0005),
('BAT-24V-5KWH', 'Batería 24V 5.0kWh LiFePO4', (SELECT id FROM cat_bat), (SELECT id FROM m_pyl), 'Pylontech', 'US2000C', '{"capacidad_kwh": 5.0, "amperios": 200, "quimica": "LiFePO4"}', 24, 10, 0.0005),
('PAN-550W', 'Panel Solar 550W Mono', (SELECT id FROM cat_pan), (SELECT id FROM m_jnk), 'Jinko Solar', 'JKM550M-72HL4', '{"potencia_wp": 550, "voltaje_max": 49.2, "corriente_max": 13.5, "eficiencia": 21.3}', NULL, 25, 0.005),
('PAN-580W', 'Panel Solar 580W Mono', (SELECT id FROM cat_pan), (SELECT id FROM m_lon), 'Longi Solar', 'LR5-72HBD-580M', '{"potencia_wp": 580, "voltaje_max": 51.8, "corriente_max": 13.8, "eficiencia": 22.1}', NULL, 25, 0.005),
('INV-5KW', 'Inversor Híbrido 5kW', (SELECT id FROM cat_inv), (SELECT id FROM m_dey), 'Deye', 'SUN-5K-SG04LP3', '{"potencia_kw": 5, "voltaje_entrada": 48, "voltaje_salida": 220, "tipo": "hibrido"}', NULL, 15, 0.01),
('INV-10KW', 'Inversor Híbrido 10kW', (SELECT id FROM cat_inv), (SELECT id FROM m_dey), 'Deye', 'SUN-10K-SG04LP3', '{"potencia_kw": 10, "voltaje_entrada": 48, "voltaje_salida": 220, "tipo": "hibrido"}', NULL, 15, 0.01)
ON CONFLICT (sku) DO NOTHING;

-- 12. TRIGGERS DE UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_categorias_updated_at BEFORE UPDATE ON categorias_producto FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_marcas_updated_at BEFORE UPDATE ON marcas FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_fincas_updated_at BEFORE UPDATE ON fincas FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_zonas_updated_at BEFORE UPDATE ON zonas FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_tolvas_updated_at BEFORE UPDATE ON tolvas FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_activos_updated_at BEFORE UPDATE ON activos FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();