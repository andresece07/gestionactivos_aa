-- PARTE 1: Tipos y tablas base
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE estado_bateria AS ENUM ('ACTIVA', 'BAJA');
CREATE TYPE motivo_paro AS ENUM ('MANTENIMIENTO', 'PESCA');
CREATE TABLE piscinas (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nombre text NOT NULL UNIQUE, zona text NOT NULL, created_at timestamp with time zone DEFAULT now(), CONSTRAINT nombre_no_vacio CHECK (length(trim(nombre)) > 0), CONSTRAINT zona_no_vacio CHECK (length(trim(zona)) > 0));
CREATE INDEX idx_piscinas_nombre ON piscinas(nombre);
CREATE TABLE proveedores (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nombre text NOT NULL UNIQUE, persona_contacto text, email text, telefono text, ciudad text, pais text, activo boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone, CONSTRAINT nombre_no_vacio CHECK (length(trim(nombre)) > 0));
CREATE INDEX idx_proveedores_nombre ON proveedores(nombre);
CREATE INDEX idx_proveedores_activo ON proveedores(activo);
CREATE TABLE baterias (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sku_dynamics text NOT NULL UNIQUE, codigo_unico text NOT NULL UNIQUE, lote text, piscina_id uuid NOT NULL REFERENCES piscinas(id) ON DELETE RESTRICT, proveedor_id uuid REFERENCES proveedores(id) ON DELETE SET NULL, fecha_compra date NOT NULL, fecha_instalacion date NOT NULL, voltaje_nominal numeric(5, 1) NOT NULL, capacidad_kwh numeric(8, 2) NOT NULL, estado estado_bateria NOT NULL DEFAULT 'ACTIVA', created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone, CONSTRAINT sku_no_vacio CHECK (length(trim(sku_dynamics)) > 0), CONSTRAINT codigo_no_vacio CHECK (length(trim(codigo_unico)) > 0), CONSTRAINT fechas_validas CHECK (fecha_compra <= fecha_instalacion), CONSTRAINT voltaje_positivo CHECK (voltaje_nominal > 0), CONSTRAINT capacidad_positiva CHECK (capacidad_kwh > 0));
CREATE INDEX idx_baterias_piscina ON baterias(piscina_id);
CREATE INDEX idx_baterias_proveedor ON baterias(proveedor_id);
CREATE INDEX idx_baterias_estado ON baterias(estado);
CREATE INDEX idx_baterias_sku ON baterias(sku_dynamics);