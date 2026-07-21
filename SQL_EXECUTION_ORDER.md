# Orden de Ejecución de Scripts SQL

## ⚠️ IMPORTANTE: Orden Correcto

Para evitar errores de relaciones y referencias, **DEBES ejecutar los scripts en este orden exacto**:

### 1️⃣ PRIMERO: `schema_baterias_fv.sql`

Este script contiene:
- ✅ Tipos enumerados (ENUMS)
- ✅ Tablas base: `piscinas`, `proveedores`, `baterias`, `paros_piscina`, `comentarios_bateria`
- ✅ Índices de tablas
- ✅ Funciones SQL
- ✅ Políticas RLS básicas

**Pasos:**
1. Ve a Supabase Dashboard → SQL Editor
2. Crea un nuevo query
3. Copia y pega todo el contenido de `schema_baterias_fv.sql`
4. Ejecuta el script completo

```sql
-- Contenido de schema_baterias_fv.sql
```

### 2️⃣ SEGUNDO: `SUPABASE_SETUP.sql`

Este script contiene:
- ✅ Políticas RLS adicionales para `proveedores`, `empleados`, `cronograma_personal`
- ✅ Datos de seed (proveedores y empleados de ejemplo)
- ✅ Tablas relacionadas: `empleados`, `cronograma_personal`

**Pasos:**
1. Ve a Supabase Dashboard → SQL Editor
2. Crea un nuevo query
3. Copia y pega todo el contenido de `SUPABASE_SETUP.sql`
4. Ejecuta el script completo

```sql
-- Contenido de SUPABASE_SETUP.sql
```

### 3️⃣ OPCIONAL: `migration_proveedores.sql`

⚠️ **Este archivo es LEGACY** - Ya no es necesario usarlo.

El contenido ya está integrado en:
- `schema_baterias_fv.sql`: Define la tabla `proveedores` y la columna `proveedor_id`
- `SUPABASE_SETUP.sql`: Inserta datos de seed de proveedores

---

## ✅ Verificación Post-Ejecución

Después de ejecutar ambos scripts, verifica en Supabase:

### En SQL Editor, corre estos queries:

```sql
-- Verificar tabla proveedores
SELECT COUNT(*) as total_proveedores FROM proveedores;
-- Deberías ver 4 registros

-- Verificar relación en baterías
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'baterias' AND column_name = 'proveedor_id';
-- Deberías ver: proveedor_id | uuid

-- Verificar foreign key
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'baterias' AND constraint_type = 'FOREIGN KEY';
-- Deberías ver la restricción de proveedor_id
```

---

## 🐛 Si Recibes Error: "Could not find a relationship..."

**Causa:** Los scripts no se ejecutaron en el orden correcto.

**Solución:**
1. ❌ NO intentes agregar columnas manualmente
2. ✅ Ejecuta `schema_baterias_fv.sql` primero
3. ✅ Luego ejecuta `SUPABASE_SETUP.sql`
4. ✅ Recarga la página o limpia el cache del navegador

---

## 📋 Resumen

| Script | Contenido | Orden |
|--------|-----------|-------|
| `schema_baterias_fv.sql` | Tablas base + índices + funciones | **PRIMERO** |
| `SUPABASE_SETUP.sql` | RLS policies + datos de seed | **SEGUNDO** |
| `migration_proveedores.sql` | ⛔ LEGACY - No usar | ❌ |

---

## 🔍 Estructura de Relaciones

```
proveedores (tabla base)
    ↓ (FK)
baterias.proveedor_id
    ↓ (FK)
piscinas.id
```

---

**Última actualización**: 2026-07-21  
**Versión**: 1.0
