-- ============================================================================
-- SQL SERVER (LocalDB) - 01_catalogo_activos
-- Traducción T-SQL de sql/05_catalogo_activos.sql (Postgres/Supabase).
-- Diferencias intencionales solo por motor:
--   uuid            -> UNIQUEIDENTIFIER DEFAULT NEWID()
--   ENUM            -> VARCHAR + CHECK IN (...)
--   jsonb           -> NVARCHAR(MAX) DEFAULT N'{}'
--   timestamptz     -> DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
--   auth.users      -> dbo.usuarios (stub local)
--   RLS (policies)  -> NO aplica en SQL Server local (solo Supabase)
--   ON CONFLICT     -> IF NOT EXISTS
--   plpgsql         -> funciones T-SQL dbo.fn_*
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Categorías de producto (con configuración de obsolescencia)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.categorias_producto', 'U') IS NULL
CREATE TABLE dbo.categorias_producto (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  codigo NVARCHAR(20) NOT NULL UNIQUE,
  nombre NVARCHAR(200) NOT NULL,
  descripcion NVARCHAR(MAX) NULL,
  tipo_obsolescencia VARCHAR(20) NOT NULL DEFAULT 'LINEAL',
  vida_util_anos DECIMAL(5,2) NOT NULL DEFAULT 10,
  factor_degradacion DECIMAL(10,6) NOT NULL DEFAULT 0.0005,
  unidad_medida_vida VARCHAR(10) NOT NULL DEFAULT 'ANOS',
  campos_esquema NVARCHAR(MAX) NOT NULL DEFAULT N'{}',
  activo BIT NOT NULL DEFAULT 1,
  created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
  updated_at DATETIMEOFFSET NULL,
  CONSTRAINT CK_cat_codigo CHECK (LEN(LTRIM(RTRIM(codigo))) > 0),
  CONSTRAINT CK_cat_nombre CHECK (LEN(LTRIM(RTRIM(nombre))) > 0),
  CONSTRAINT CK_cat_tipo CHECK (tipo_obsolescencia IN ('LINEAL','EXPONENCIAL','POR_USO','POR_TIEMPO','PERSONALIZADA')),
  CONSTRAINT CK_cat_vida CHECK (vida_util_anos > 0),
  CONSTRAINT CK_cat_unidad CHECK (unidad_medida_vida IN ('ANOS','CICLOS','HORAS','KM'))
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_categorias_activo')
  CREATE INDEX IX_categorias_activo ON dbo.categorias_producto(activo);
GO

-- ----------------------------------------------------------------------------
-- 2. Marcas (catálogo cargable desde Excel)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.marcas', 'U') IS NULL
CREATE TABLE dbo.marcas (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  codigo NVARCHAR(20) NOT NULL UNIQUE,
  nombre NVARCHAR(200) NOT NULL UNIQUE,
  descripcion NVARCHAR(MAX) NULL,
  pais_origen NVARCHAR(100) NULL,
  sitio_web NVARCHAR(300) NULL,
  activo BIT NOT NULL DEFAULT 1,
  created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
  updated_at DATETIMEOFFSET NULL,
  CONSTRAINT CK_marcas_codigo CHECK (LEN(LTRIM(RTRIM(codigo))) > 0),
  CONSTRAINT CK_marcas_nombre CHECK (LEN(LTRIM(RTRIM(nombre))) > 0)
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_marcas_activo')
  CREATE INDEX IX_marcas_activo ON dbo.marcas(activo);
GO

-- ----------------------------------------------------------------------------
-- 3. Productos / SKUs maestros
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.productos', 'U') IS NULL
CREATE TABLE dbo.productos (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  sku NVARCHAR(100) NOT NULL UNIQUE,
  nombre NVARCHAR(200) NOT NULL,
  categoria_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.categorias_producto(id),
  marca_id UNIQUEIDENTIFIER NULL REFERENCES dbo.marcas(id) ON DELETE SET NULL,
  marca NVARCHAR(200) NULL,
  modelo NVARCHAR(200) NULL,
  descripcion NVARCHAR(MAX) NULL,
  especificaciones NVARCHAR(MAX) NOT NULL DEFAULT N'{}',
  voltaje_nominal INT NULL,
  vida_util_anos DECIMAL(5,2) NULL,
  factor_degradacion DECIMAL(10,6) NULL,
  unidad_medida_vida VARCHAR(10) NULL,
  activo BIT NOT NULL DEFAULT 1,
  created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
  updated_at DATETIMEOFFSET NULL,
  created_by UNIQUEIDENTIFIER NULL REFERENCES dbo.usuarios(id) ON DELETE SET NULL,
  CONSTRAINT CK_prod_sku CHECK (LEN(LTRIM(RTRIM(sku))) > 0),
  CONSTRAINT CK_prod_nombre CHECK (LEN(LTRIM(RTRIM(nombre))) > 0),
  CONSTRAINT CK_prod_voltaje CHECK (voltaje_nominal IS NULL OR voltaje_nominal IN (12, 24, 48))
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_productos_categoria')
  CREATE INDEX IX_productos_categoria ON dbo.productos(categoria_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_productos_marca')
  CREATE INDEX IX_productos_marca ON dbo.productos(marca_id);
GO

-- ----------------------------------------------------------------------------
-- 4. Ubicación jerárquica: Fincas -> Zonas -> Tolvas (cargable desde Excel)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.fincas', 'U') IS NULL
CREATE TABLE dbo.fincas (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  codigo NVARCHAR(20) NOT NULL UNIQUE,
  nombre NVARCHAR(200) NOT NULL UNIQUE,
  descripcion NVARCHAR(MAX) NULL,
  activo BIT NOT NULL DEFAULT 1,
  created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
  updated_at DATETIMEOFFSET NULL,
  CONSTRAINT CK_fincas_codigo CHECK (LEN(LTRIM(RTRIM(codigo))) > 0),
  CONSTRAINT CK_fincas_nombre CHECK (LEN(LTRIM(RTRIM(nombre))) > 0)
);
GO

IF OBJECT_ID('dbo.zonas', 'U') IS NULL
CREATE TABLE dbo.zonas (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  finca_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.fincas(id) ON DELETE CASCADE,
  codigo NVARCHAR(20) NOT NULL,
  nombre NVARCHAR(200) NOT NULL,
  descripcion NVARCHAR(MAX) NULL,
  activo BIT NOT NULL DEFAULT 1,
  created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
  updated_at DATETIMEOFFSET NULL,
  CONSTRAINT CK_zonas_codigo CHECK (LEN(LTRIM(RTRIM(codigo))) > 0),
  CONSTRAINT CK_zonas_nombre CHECK (LEN(LTRIM(RTRIM(nombre))) > 0),
  CONSTRAINT UQ_zonas_finca_codigo UNIQUE (finca_id, codigo)
);
GO

IF OBJECT_ID('dbo.tolvas', 'U') IS NULL
CREATE TABLE dbo.tolvas (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  zona_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.zonas(id) ON DELETE CASCADE,
  codigo NVARCHAR(50) NOT NULL,
  nombre NVARCHAR(200) NOT NULL,
  descripcion NVARCHAR(MAX) NULL,
  capacidad_maxima DECIMAL(10,2) NULL,
  unidad_medida NVARCHAR(10) NOT NULL DEFAULT 'KG',
  activo BIT NOT NULL DEFAULT 1,
  created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
  updated_at DATETIMEOFFSET NULL,
  CONSTRAINT CK_tolvas_codigo CHECK (LEN(LTRIM(RTRIM(codigo))) > 0),
  CONSTRAINT CK_tolvas_nombre CHECK (LEN(LTRIM(RTRIM(nombre))) > 0),
  CONSTRAINT UQ_tolvas_zona_codigo UNIQUE (zona_id, codigo)
);
GO

-- ----------------------------------------------------------------------------
-- 5. Activos (cualquier artículo; reemplaza la idea de solo-baterías)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.activos', 'U') IS NULL
CREATE TABLE dbo.activos (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  codigo_unico NVARCHAR(100) NOT NULL UNIQUE,
  producto_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.productos(id),
  finca_id UNIQUEIDENTIFIER NULL REFERENCES dbo.fincas(id) ON DELETE NO ACTION,
  zona_id UNIQUEIDENTIFIER NULL REFERENCES dbo.zonas(id) ON DELETE NO ACTION,
  tolva_id UNIQUEIDENTIFIER NULL REFERENCES dbo.tolvas(id) ON DELETE NO ACTION,
  piscina_id UNIQUEIDENTIFIER NULL REFERENCES dbo.piscinas(id) ON DELETE NO ACTION,
  proveedor_id UNIQUEIDENTIFIER NULL REFERENCES dbo.proveedores(id) ON DELETE NO ACTION,
  fecha_compra DATE NOT NULL,
  fecha_instalacion DATE NOT NULL,
  fecha_baja DATE NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  especificaciones NVARCHAR(MAX) NOT NULL DEFAULT N'{}',
  ciclos_totales INT NOT NULL DEFAULT 0,
  horas_uso DECIMAL(10,2) NOT NULL DEFAULT 0,
  kilometros DECIMAL(10,2) NOT NULL DEFAULT 0,
  obsolescencia_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  vida_util_restante_anos DECIMAL(5,2) NULL,
  observaciones NVARCHAR(MAX) NULL,
  created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
  updated_at DATETIMEOFFSET NULL,
  created_by UNIQUEIDENTIFIER NULL REFERENCES dbo.usuarios(id) ON DELETE NO ACTION,
  updated_by UNIQUEIDENTIFIER NULL REFERENCES dbo.usuarios(id) ON DELETE NO ACTION,
  CONSTRAINT CK_act_codigo CHECK (LEN(LTRIM(RTRIM(codigo_unico))) > 0),
  CONSTRAINT CK_act_fechas CHECK (fecha_compra <= fecha_instalacion),
  CONSTRAINT CK_act_obs CHECK (obsolescencia_pct >= 0 AND obsolescencia_pct <= 100),
  CONSTRAINT CK_act_estado CHECK (estado IN ('ACTIVO','BAJA','EN_MANTENIMIENTO','OBSOLETO'))
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_activos_producto')
  CREATE INDEX IX_activos_producto ON dbo.activos(producto_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_activos_estado')
  CREATE INDEX IX_activos_estado ON dbo.activos(estado);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_activos_created_by')
  CREATE INDEX IX_activos_created_by ON dbo.activos(created_by);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_mov_usuario')
  CREATE INDEX IX_mov_usuario ON dbo.movimientos_activos(usuario_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_com_activo_usuario')
  CREATE INDEX IX_com_activo_usuario ON dbo.comentarios_activo(usuario_id);
GO

-- ----------------------------------------------------------------------------
-- 6. Movimientos de activos
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.movimientos_activos', 'U') IS NULL
CREATE TABLE dbo.movimientos_activos (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  activo_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.activos(id) ON DELETE CASCADE,
  finca_id_origen UNIQUEIDENTIFIER NULL REFERENCES dbo.fincas(id),
  zona_id_origen UNIQUEIDENTIFIER NULL REFERENCES dbo.zonas(id),
  tolva_id_origen UNIQUEIDENTIFIER NULL REFERENCES dbo.tolvas(id),
  piscina_id_origen UNIQUEIDENTIFIER NULL REFERENCES dbo.piscinas(id),
  finca_id_destino UNIQUEIDENTIFIER NULL REFERENCES dbo.fincas(id),
  zona_id_destino UNIQUEIDENTIFIER NULL REFERENCES dbo.zonas(id),
  tolva_id_destino UNIQUEIDENTIFIER NULL REFERENCES dbo.tolvas(id),
  piscina_id_destino UNIQUEIDENTIFIER NULL REFERENCES dbo.piscinas(id),
  tipo_movimiento VARCHAR(30) NOT NULL,
  estado_activo VARCHAR(20) NULL,
  ciclos_registrados INT NULL,
  horas_uso_registradas DECIMAL(10,2) NULL,
  kilometros_registrados DECIMAL(10,2) NULL,
  obsolescencia_registrada DECIMAL(5,2) NULL,
  voltaje_inicial DECIMAL(8,2) NULL,
  voltaje_final DECIMAL(8,2) NULL,
  temperatura DECIMAL(5,2) NULL,
  observaciones NVARCHAR(MAX) NULL,
  proxima_revision DATE NULL,
  fecha_movimiento DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  usuario_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.usuarios(id),
  usuario_nombre NVARCHAR(200) NULL,
  created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT CK_mov_tipo CHECK (tipo_movimiento IN ('INSTALACION','TRASLADO','MANTENIMIENTO','REPARACION','INSPECCION','CAMBIO_UBICACION','RECARGA','DESCARGA','CALIBRACION','ACTUALIZACION','BAJA','REACTIVACION','OTRO'))
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_mov_activo_fecha')
  CREATE INDEX IX_mov_activo_fecha ON dbo.movimientos_activos(activo_id, fecha_movimiento DESC);
GO

-- ----------------------------------------------------------------------------
-- 7. Comentarios de activos (auditoría)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.comentarios_activo', 'U') IS NULL
CREATE TABLE dbo.comentarios_activo (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  activo_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.activos(id) ON DELETE CASCADE,
  contenido NVARCHAR(MAX) NOT NULL,
  usuario_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.usuarios(id),
  fecha_creacion DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
  created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT CK_com_contenido CHECK (LEN(LTRIM(RTRIM(contenido))) > 0)
);
GO

-- ----------------------------------------------------------------------------
-- 8. Funciones de obsolescencia (T-SQL)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.fn_config_obsolescencia', 'IF') IS NOT NULL
  DROP FUNCTION dbo.fn_config_obsolescencia;
GO
CREATE FUNCTION dbo.fn_config_obsolescencia (@activo_id UNIQUEIDENTIFIER)
RETURNS TABLE
AS
RETURN
  SELECT
    c.tipo_obsolescencia AS tipo_obsolescencia,
    COALESCE(p.vida_util_anos, c.vida_util_anos) AS vida_util_anos,
    COALESCE(p.factor_degradacion, c.factor_degradacion) AS factor_degradacion,
    COALESCE(p.unidad_medida_vida, c.unidad_medida_vida) AS unidad_medida_vida
  FROM dbo.activos a
  JOIN dbo.productos p ON a.producto_id = p.id
  JOIN dbo.categorias_producto c ON p.categoria_id = c.id
  WHERE a.id = @activo_id;
GO

IF OBJECT_ID('dbo.fn_obsolescencia_tiempo', 'FN') IS NOT NULL
  DROP FUNCTION dbo.fn_obsolescencia_tiempo;
GO
CREATE FUNCTION dbo.fn_obsolescencia_tiempo (@activo_id UNIQUEIDENTIFIER)
RETURNS DECIMAL(5,2)
AS
BEGIN
  DECLARE @tipo VARCHAR(20), @vida DECIMAL(5,2), @factor DECIMAL(10,6);
  DECLARE @anos DECIMAL(10,4), @obs DECIMAL(10,4);
  SELECT @tipo = tipo_obsolescencia, @vida = vida_util_anos, @factor = factor_degradacion
  FROM dbo.fn_config_obsolescencia(@activo_id);
  IF @vida IS NULL OR @vida <= 0 RETURN 0;
  SELECT @anos = CAST(DATEDIFF(DAY, fecha_instalacion, CAST(GETDATE() AS DATE)) AS DECIMAL(10,4)) / 365.25
  FROM dbo.activos WHERE id = @activo_id;
  IF @anos IS NULL OR @anos < 0 SET @anos = 0;
  IF @tipo = 'EXPONENCIAL'
    SET @obs = (1 - EXP(-@factor * @anos)) * 100;
  ELSE
    SET @obs = (@anos / @vida) * 100;
  IF @obs < 0 SET @obs = 0;
  IF @obs > 100 SET @obs = 100;
  RETURN ROUND(@obs, 2);
END;
GO

IF OBJECT_ID('dbo.fn_obsolescencia_uso', 'FN') IS NOT NULL
  DROP FUNCTION dbo.fn_obsolescencia_uso;
GO
CREATE FUNCTION dbo.fn_obsolescencia_uso (@activo_id UNIQUEIDENTIFIER)
RETURNS DECIMAL(5,2)
AS
BEGIN
  DECLARE @unidad VARCHAR(10), @vida DECIMAL(5,2);
  DECLARE @uso DECIMAL(12,2) = 0, @vidaTotal DECIMAL(14,2) = 0, @obs DECIMAL(10,4) = 0;
  SELECT @unidad = unidad_medida_vida, @vida = vida_util_anos
  FROM dbo.fn_config_obsolescencia(@activo_id);
  SELECT
    @uso = CASE @unidad WHEN 'CICLOS' THEN CAST(ciclos_totales AS DECIMAL(12,2))
                        WHEN 'HORAS' THEN horas_uso
                        WHEN 'KM' THEN kilometros ELSE 0 END
  FROM dbo.activos WHERE id = @activo_id;
  SET @vidaTotal = @vida * CASE @unidad WHEN 'CICLOS' THEN 365 WHEN 'HORAS' THEN 8760 WHEN 'KM' THEN 50000 ELSE 1 END;
  IF @vidaTotal > 0 SET @obs = (@uso / @vidaTotal) * 100;
  IF @obs < 0 SET @obs = 0;
  IF @obs > 100 SET @obs = 100;
  RETURN ROUND(@obs, 2);
END;
GO

IF OBJECT_ID('dbo.fn_obsolescencia_activo', 'FN') IS NOT NULL
  DROP FUNCTION dbo.fn_obsolescencia_activo;
GO
CREATE FUNCTION dbo.fn_obsolescencia_activo (@activo_id UNIQUEIDENTIFIER)
RETURNS DECIMAL(5,2)
AS
BEGIN
  DECLARE @unidad VARCHAR(10), @t DECIMAL(5,2), @u DECIMAL(5,2), @final DECIMAL(5,2);
  SELECT @unidad = unidad_medida_vida FROM dbo.fn_config_obsolescencia(@activo_id);
  SET @t = dbo.fn_obsolescencia_tiempo(@activo_id);
  SET @u = dbo.fn_obsolescencia_uso(@activo_id);
  IF @unidad IN ('CICLOS','HORAS','KM') AND @u > @t SET @final = @u; ELSE SET @final = @t;
  IF @final < 0 SET @final = 0;
  IF @final > 100 SET @final = 100;
  RETURN @final;
END;
GO

IF OBJECT_ID('dbo.fn_vida_util_restante', 'FN') IS NOT NULL
  DROP FUNCTION dbo.fn_vida_util_restante;
GO
CREATE FUNCTION dbo.fn_vida_util_restante (@activo_id UNIQUEIDENTIFIER)
RETURNS DECIMAL(5,2)
AS
BEGIN
  DECLARE @vida DECIMAL(5,2), @obs DECIMAL(5,2), @rest DECIMAL(10,4);
  SELECT @vida = vida_util_anos FROM dbo.fn_config_obsolescencia(@activo_id);
  SET @obs = dbo.fn_obsolescencia_activo(@activo_id);
  SET @rest = @vida * (1 - @obs / 100);
  IF @rest < 0 SET @rest = 0;
  RETURN ROUND(@rest, 2);
END;
GO

-- Trigger: acumula métricas del movimiento y recalcula obsolescencia
IF OBJECT_ID('dbo.trg_movimientos_obsolescencia', 'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_movimientos_obsolescencia;
GO
CREATE TRIGGER dbo.trg_movimientos_obsolescencia
ON dbo.movimientos_activos
AFTER INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE a
  SET ciclos_totales = a.ciclos_totales + ISNULL(i.ciclos_registrados, 0),
      horas_uso = a.horas_uso + ISNULL(i.horas_uso_registradas, 0),
      kilometros = a.kilometros + ISNULL(i.kilometros_registrados, 0),
      updated_at = SYSDATETIMEOFFSET()
  FROM dbo.activos a
  JOIN inserted i ON i.activo_id = a.id
  WHERE i.ciclos_registrados IS NOT NULL
     OR i.horas_uso_registradas IS NOT NULL
     OR i.kilometros_registrados IS NOT NULL;

  UPDATE a
  SET obsolescencia_pct = dbo.fn_obsolescencia_activo(a.id),
      vida_util_restante_anos = dbo.fn_vida_util_restante(a.id),
      updated_at = SYSDATETIMEOFFSET()
  FROM dbo.activos a
  JOIN inserted i ON i.activo_id = a.id;
END;
GO

-- ----------------------------------------------------------------------------
-- 9. Vistas de reporte
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.vw_activos_completo', 'V') IS NOT NULL
  DROP VIEW dbo.vw_activos_completo;
GO
CREATE VIEW dbo.vw_activos_completo AS
SELECT
  a.id, a.codigo_unico,
  p.sku, p.nombre AS producto_nombre, p.marca, p.modelo, p.voltaje_nominal,
  cat.codigo AS categoria_codigo, cat.nombre AS categoria_nombre,
  cat.tipo_obsolescencia, cat.vida_util_anos AS categoria_vida_util,
  m.codigo AS marca_codigo, m.nombre AS marca_nombre,
  f.codigo AS finca_codigo, f.nombre AS finca_nombre,
  z.codigo AS zona_codigo, z.nombre AS zona_nombre,
  t.codigo AS tolva_codigo, t.nombre AS tolva_nombre,
  psc.nombre AS piscina_nombre,
  prov.nombre AS proveedor_nombre,
  a.fecha_compra, a.fecha_instalacion, a.fecha_baja, a.estado,
  a.especificaciones, a.ciclos_totales, a.horas_uso, a.kilometros,
  a.obsolescencia_pct, a.vida_util_restante_anos, a.observaciones,
  a.created_at, a.updated_at,
  ROUND(CAST(DATEDIFF(DAY, a.fecha_instalacion, CAST(GETDATE() AS DATE)) AS DECIMAL(10,2)) / 365.25, 2) AS anos_desde_instalacion
FROM dbo.activos a
JOIN dbo.productos p ON a.producto_id = p.id
JOIN dbo.categorias_producto cat ON p.categoria_id = cat.id
LEFT JOIN dbo.marcas m ON p.marca_id = m.id
LEFT JOIN dbo.fincas f ON a.finca_id = f.id
LEFT JOIN dbo.zonas z ON a.zona_id = z.id
LEFT JOIN dbo.tolvas t ON a.tolva_id = t.id
LEFT JOIN dbo.piscinas psc ON a.piscina_id = psc.id
LEFT JOIN dbo.proveedores prov ON a.proveedor_id = prov.id;
GO

IF OBJECT_ID('dbo.vw_activos_obsolescencia_critica', 'V') IS NOT NULL
  DROP VIEW dbo.vw_activos_obsolescencia_critica;
GO
CREATE VIEW dbo.vw_activos_obsolescencia_critica AS
SELECT * FROM dbo.vw_activos_completo
WHERE obsolescencia_pct >= 80
  AND estado IN ('ACTIVO','EN_MANTENIMIENTO');
GO

-- ----------------------------------------------------------------------------
-- 10. Seed: categorías, marcas, fincas, zonas, tolvas, productos
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.categorias_producto WHERE codigo = 'BAT')
  INSERT INTO dbo.categorias_producto (codigo, nombre, descripcion, tipo_obsolescencia, vida_util_anos, factor_degradacion, unidad_medida_vida, campos_esquema)
  VALUES ('BAT','Baterías','Baterías fotovoltaicas y de respaldo','EXPONENCIAL',10,0.0005,'CICLOS',N'{"voltaje_nominal": "number", "capacidad_kwh": "number", "amperios": "number"}');
IF NOT EXISTS (SELECT 1 FROM dbo.categorias_producto WHERE codigo = 'PAN')
  INSERT INTO dbo.categorias_producto (codigo, nombre, descripcion, tipo_obsolescencia, vida_util_anos, factor_degradacion, unidad_medida_vida, campos_esquema)
  VALUES ('PAN','Paneles Solares','Módulos fotovoltaicos','LINEAL',25,0.005,'ANOS',N'{"potencia_wp": "number", "voltaje_max": "number"}');
IF NOT EXISTS (SELECT 1 FROM dbo.categorias_producto WHERE codigo = 'INV')
  INSERT INTO dbo.categorias_producto (codigo, nombre, descripcion, tipo_obsolescencia, vida_util_anos, factor_degradacion, unidad_medida_vida, campos_esquema)
  VALUES ('INV','Inversores','Inversores de corriente','LINEAL',15,0.01,'ANOS',N'{"potencia_kw": "number", "voltaje_entrada": "number"}');
IF NOT EXISTS (SELECT 1 FROM dbo.categorias_producto WHERE codigo = 'SEN')
  INSERT INTO dbo.categorias_producto (codigo, nombre, descripcion, tipo_obsolescencia, vida_util_anos, factor_degradacion, unidad_medida_vida, campos_esquema)
  VALUES ('SEN','Sensores','Sensores de monitoreo','POR_USO',5,0.02,'HORAS',N'{"tipo_sensor": "text", "rango": "text"}');
IF NOT EXISTS (SELECT 1 FROM dbo.categorias_producto WHERE codigo = 'BOM')
  INSERT INTO dbo.categorias_producto (codigo, nombre, descripcion, tipo_obsolescencia, vida_util_anos, factor_degradacion, unidad_medida_vida, campos_esquema)
  VALUES ('BOM','Bombas','Bombas de agua','POR_USO',10,0.01,'HORAS',N'{"potencia_hp": "number", "caudal": "number"}');
IF NOT EXISTS (SELECT 1 FROM dbo.categorias_producto WHERE codigo = 'GEN')
  INSERT INTO dbo.categorias_producto (codigo, nombre, descripcion, tipo_obsolescencia, vida_util_anos, factor_degradacion, unidad_medida_vida, campos_esquema)
  VALUES ('GEN','Generadores','Generadores eléctricos','POR_USO',20,0.008,'HORAS',N'{"potencia_kva": "number", "tipo_combustible": "text"}');
IF NOT EXISTS (SELECT 1 FROM dbo.categorias_producto WHERE codigo = 'OTR')
  INSERT INTO dbo.categorias_producto (codigo, nombre, descripcion, tipo_obsolescencia, vida_util_anos, factor_degradacion, unidad_medida_vida, campos_esquema)
  VALUES ('OTR','Otros Equipos','Equipos varios','LINEAL',10,0.01,'ANOS',N'{}');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.marcas WHERE codigo = 'DYN')
  INSERT INTO dbo.marcas (codigo, nombre, descripcion, pais_origen, sitio_web) VALUES ('DYN','Dyness','Baterías LiFePO4','China','https://dyness.com');
IF NOT EXISTS (SELECT 1 FROM dbo.marcas WHERE codigo = 'PYL')
  INSERT INTO dbo.marcas (codigo, nombre, descripcion, pais_origen, sitio_web) VALUES ('PYL','Pylontech','Baterías de litio','China','https://pylontech.com.cn');
IF NOT EXISTS (SELECT 1 FROM dbo.marcas WHERE codigo = 'JNK')
  INSERT INTO dbo.marcas (codigo, nombre, descripcion, pais_origen, sitio_web) VALUES ('JNK','Jinko Solar','Módulos fotovoltaicos','China','https://jinkosolar.com');
IF NOT EXISTS (SELECT 1 FROM dbo.marcas WHERE codigo = 'LON')
  INSERT INTO dbo.marcas (codigo, nombre, descripcion, pais_origen, sitio_web) VALUES ('LON','Longi Solar','Tecnología monocristalina','China','https://longi.com');
IF NOT EXISTS (SELECT 1 FROM dbo.marcas WHERE codigo = 'DEY')
  INSERT INTO dbo.marcas (codigo, nombre, descripcion, pais_origen, sitio_web) VALUES ('DEY','Deye','Inversores híbridos','China','https://deyeinverter.com');
IF NOT EXISTS (SELECT 1 FROM dbo.marcas WHERE codigo = 'HUA')
  INSERT INTO dbo.marcas (codigo, nombre, descripcion, pais_origen, sitio_web) VALUES ('HUA','Huawei','Inversores solares','China','https://solar.huawei.com');
IF NOT EXISTS (SELECT 1 FROM dbo.marcas WHERE codigo = 'VIC')
  INSERT INTO dbo.marcas (codigo, nombre, descripcion, pais_origen, sitio_web) VALUES ('VIC','Victron Energy','Energía off-grid','Países Bajos','https://victronenergy.com');
IF NOT EXISTS (SELECT 1 FROM dbo.marcas WHERE codigo = 'SMA')
  INSERT INTO dbo.marcas (codigo, nombre, descripcion, pais_origen, sitio_web) VALUES ('SMA','SMA Solar Technology','Inversores alemanes','Alemania','https://sma.de');
IF NOT EXISTS (SELECT 1 FROM dbo.marcas WHERE codigo = 'GRO')
  INSERT INTO dbo.marcas (codigo, nombre, descripcion, pais_origen, sitio_web) VALUES ('GRO','Growatt','Inversores y almacenamiento','China','https://ginverter.com');
IF NOT EXISTS (SELECT 1 FROM dbo.marcas WHERE codigo = 'GOO')
  INSERT INTO dbo.marcas (codigo, nombre, descripcion, pais_origen, sitio_web) VALUES ('GOO','GoodWe','Inversores inteligentes','China','https://goodwe.com');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.fincas WHERE codigo = 'FIN-01')
  INSERT INTO dbo.fincas (codigo, nombre, descripcion) VALUES ('FIN-01','Finca Langua','Finca principal zona norte');
IF NOT EXISTS (SELECT 1 FROM dbo.fincas WHERE codigo = 'FIN-02')
  INSERT INTO dbo.fincas (codigo, nombre, descripcion) VALUES ('FIN-02','Finca La Esperanza','Finca zona centro');
IF NOT EXISTS (SELECT 1 FROM dbo.fincas WHERE codigo = 'FIN-03')
  INSERT INTO dbo.fincas (codigo, nombre, descripcion) VALUES ('FIN-03','Finca Vigsa','Finca zona sur');
IF NOT EXISTS (SELECT 1 FROM dbo.fincas WHERE codigo = 'FIN-04')
  INSERT INTO dbo.fincas (codigo, nombre, descripcion) VALUES ('FIN-04','Finca El Porvenir','Finca nueva adquisición');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.zonas z JOIN dbo.fincas f ON z.finca_id = f.id WHERE f.codigo = 'FIN-01' AND z.codigo = 'ZN')
  INSERT INTO dbo.zonas (finca_id, codigo, nombre) SELECT id, 'ZN', 'Zona Norte' FROM dbo.fincas WHERE codigo = 'FIN-01';
IF NOT EXISTS (SELECT 1 FROM dbo.zonas z JOIN dbo.fincas f ON z.finca_id = f.id WHERE f.codigo = 'FIN-02' AND z.codigo = 'ZC')
  INSERT INTO dbo.zonas (finca_id, codigo, nombre) SELECT id, 'ZC', 'Zona Centro' FROM dbo.fincas WHERE codigo = 'FIN-02';
IF NOT EXISTS (SELECT 1 FROM dbo.zonas z JOIN dbo.fincas f ON z.finca_id = f.id WHERE f.codigo = 'FIN-03' AND z.codigo = 'ZS')
  INSERT INTO dbo.zonas (finca_id, codigo, nombre) SELECT id, 'ZS', 'Zona Sur' FROM dbo.fincas WHERE codigo = 'FIN-03';
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tolvas WHERE codigo = 'TOL-A1')
  INSERT INTO dbo.tolvas (zona_id, codigo, nombre, capacidad_maxima) SELECT z.id, 'TOL-A1', 'Tolva A-1', 5000 FROM dbo.zonas z JOIN dbo.fincas f ON z.finca_id = f.id WHERE z.codigo = 'ZN' AND f.codigo = 'FIN-01';
IF NOT EXISTS (SELECT 1 FROM dbo.tolvas WHERE codigo = 'TOL-A2')
  INSERT INTO dbo.tolvas (zona_id, codigo, nombre, capacidad_maxima) SELECT z.id, 'TOL-A2', 'Tolva A-2', 5000 FROM dbo.zonas z JOIN dbo.fincas f ON z.finca_id = f.id WHERE z.codigo = 'ZN' AND f.codigo = 'FIN-01';
IF NOT EXISTS (SELECT 1 FROM dbo.tolvas WHERE codigo = 'TOL-B1')
  INSERT INTO dbo.tolvas (zona_id, codigo, nombre, capacidad_maxima) SELECT z.id, 'TOL-B1', 'Tolva B-1', 3000 FROM dbo.zonas z JOIN dbo.fincas f ON z.finca_id = f.id WHERE z.codigo = 'ZC' AND f.codigo = 'FIN-02';
IF NOT EXISTS (SELECT 1 FROM dbo.tolvas WHERE codigo = 'TOL-C1')
  INSERT INTO dbo.tolvas (zona_id, codigo, nombre, capacidad_maxima) SELECT z.id, 'TOL-C1', 'Tolva C-1', 4000 FROM dbo.zonas z JOIN dbo.fincas f ON z.finca_id = f.id WHERE z.codigo = 'ZS' AND f.codigo = 'FIN-03';
GO

IF NOT EXISTS (SELECT 1 FROM dbo.productos WHERE sku = 'BAT-48V-10KWH')
  INSERT INTO dbo.productos (sku, nombre, categoria_id, marca_id, marca, modelo, especificaciones, voltaje_nominal, vida_util_anos, factor_degradacion)
  SELECT 'BAT-48V-10KWH','Batería 48V 10.5kWh LiFePO4',c.id,m.id,'Dyness','PowerBox 10',N'{"capacidad_kwh": 10.5, "amperios": 210}',48,10,0.0005
  FROM dbo.categorias_producto c, dbo.marcas m WHERE c.codigo='BAT' AND m.codigo='DYN';
IF NOT EXISTS (SELECT 1 FROM dbo.productos WHERE sku = 'BAT-48V-15KWH')
  INSERT INTO dbo.productos (sku, nombre, categoria_id, marca_id, marca, modelo, especificaciones, voltaje_nominal, vida_util_anos, factor_degradacion)
  SELECT 'BAT-48V-15KWH','Batería 48V 15.2kWh LiFePO4',c.id,m.id,'Dyness','PowerBox 15',N'{"capacidad_kwh": 15.2, "amperios": 300}',48,10,0.0005
  FROM dbo.categorias_producto c, dbo.marcas m WHERE c.codigo='BAT' AND m.codigo='DYN';
IF NOT EXISTS (SELECT 1 FROM dbo.productos WHERE sku = 'BAT-24V-5KWH')
  INSERT INTO dbo.productos (sku, nombre, categoria_id, marca_id, marca, modelo, especificaciones, voltaje_nominal, vida_util_anos, factor_degradacion)
  SELECT 'BAT-24V-5KWH','Batería 24V 5.0kWh LiFePO4',c.id,m.id,'Pylontech','US2000C',N'{"capacidad_kwh": 5.0, "amperios": 200}',24,10,0.0005
  FROM dbo.categorias_producto c, dbo.marcas m WHERE c.codigo='BAT' AND m.codigo='PYL';
IF NOT EXISTS (SELECT 1 FROM dbo.productos WHERE sku = 'BAT-12V-2KWH')
  INSERT INTO dbo.productos (sku, nombre, categoria_id, marca_id, marca, modelo, especificaciones, voltaje_nominal, vida_util_anos, factor_degradacion)
  SELECT 'BAT-12V-2KWH','Batería 12V 2.0kWh',c.id,m.id,'Victron Energy','AGM 12V',N'{"capacidad_kwh": 2.0}',12,8,0.0008
  FROM dbo.categorias_producto c, dbo.marcas m WHERE c.codigo='BAT' AND m.codigo='VIC';
IF NOT EXISTS (SELECT 1 FROM dbo.productos WHERE sku = 'PAN-550W')
  INSERT INTO dbo.productos (sku, nombre, categoria_id, marca_id, marca, modelo, especificaciones, voltaje_nominal, vida_util_anos, factor_degradacion)
  SELECT 'PAN-550W','Panel Solar 550W Mono',c.id,m.id,'Jinko Solar','JKM550M-72HL4',N'{"potencia_wp": 550}',NULL,25,0.005
  FROM dbo.categorias_producto c, dbo.marcas m WHERE c.codigo='PAN' AND m.codigo='JNK';
IF NOT EXISTS (SELECT 1 FROM dbo.productos WHERE sku = 'INV-5KW')
  INSERT INTO dbo.productos (sku, nombre, categoria_id, marca_id, marca, modelo, especificaciones, voltaje_nominal, vida_util_anos, factor_degradacion)
  SELECT 'INV-5KW','Inversor Híbrido 5kW',c.id,m.id,'Deye','SUN-5K-SG04LP3',N'{"potencia_kw": 5}',NULL,15,0.01
  FROM dbo.categorias_producto c, dbo.marcas m WHERE c.codigo='INV' AND m.codigo='DEY';
GO
