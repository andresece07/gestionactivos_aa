-- ============================================================================
-- SQL SERVER (LocalDB) - 00_base_minima
-- Tablas base mínimas que la migración del catálogo necesita por FK.
-- Equivalente local de las tablas ya existentes en Supabase/Postgres.
-- (En Supabase NO ejecutar este archivo: allá ya existen.)
-- RLS de Supabase NO aplica aquí; es solo prueba local del modelo.
-- ============================================================================

-- Usuarios (stub local de auth.users de Supabase)
IF OBJECT_ID('dbo.usuarios', 'U') IS NULL
CREATE TABLE dbo.usuarios (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email NVARCHAR(200) NOT NULL
);

-- Piscinas (mínimo necesario: id, nombre, zona)
IF OBJECT_ID('dbo.piscinas', 'U') IS NULL
CREATE TABLE dbo.piscinas (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  nombre NVARCHAR(200) NOT NULL UNIQUE,
  zona NVARCHAR(200) NOT NULL,
  created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT CK_piscinas_nombre CHECK (LEN(LTRIM(RTRIM(nombre))) > 0),
  CONSTRAINT CK_piscinas_zona CHECK (LEN(LTRIM(RTRIM(zona))) > 0)
);

-- Proveedores (mínimo necesario + created_by para la política corregida)
IF OBJECT_ID('dbo.proveedores', 'U') IS NULL
CREATE TABLE dbo.proveedores (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  nombre NVARCHAR(200) NOT NULL UNIQUE,
  contacto NVARCHAR(200) NULL,
  telefono NVARCHAR(100) NULL,
  email NVARCHAR(200) NULL,
  direccion NVARCHAR(400) NULL,
  activo BIT NOT NULL DEFAULT 1,
  created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
  updated_at DATETIMEOFFSET NULL,
  created_by UNIQUEIDENTIFIER NULL REFERENCES dbo.usuarios(id) ON DELETE SET NULL,
  CONSTRAINT CK_proveedores_nombre CHECK (LEN(LTRIM(RTRIM(nombre))) > 0)
);

-- Seed mínimo para probar FKs
IF NOT EXISTS (SELECT 1 FROM dbo.piscinas WHERE nombre = N'Langua')
  INSERT INTO dbo.piscinas (nombre, zona) VALUES (N'Langua', N'Zona Norte');
IF NOT EXISTS (SELECT 1 FROM dbo.piscinas WHERE nombre = N'La Esperanza')
  INSERT INTO dbo.piscinas (nombre, zona) VALUES (N'La Esperanza', N'Zona Centro');
IF NOT EXISTS (SELECT 1 FROM dbo.piscinas WHERE nombre = N'Vigsa')
  INSERT INTO dbo.piscinas (nombre, zona) VALUES (N'Vigsa', N'Zona Sur');

IF NOT EXISTS (SELECT 1 FROM dbo.proveedores WHERE nombre = N'Soluna Energy')
  INSERT INTO dbo.proveedores (nombre, contacto, email) VALUES (N'Soluna Energy', N'Juan Carlos García', N'contacto@soluna.com');
GO
