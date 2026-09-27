# 🔧 Migración SQL - Instrucciones Paso a Paso

## ⚠️ IMPORTANTE
Ejecuta CADA statement uno por uno en Supabase SQL Editor. NO intentes copiar todo junto.

---

## PASO 1: Crear el tipo ENUM

Copia y pega en Supabase SQL Editor:
```sql
DO $$ BEGIN
  CREATE TYPE estado_vida_util AS ENUM ('ACTIVA', 'VIDA_UTIL_CUMPLIDA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

Haz clic en "Run" y espera a que veas "Success. No rows returned"

---

## PASO 2: Agregar columna dias_operacion

Copia y pega:
```sql
DO $$ BEGIN
  ALTER TABLE baterias ADD COLUMN dias_operacion integer DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
```

Haz clic en "Run"

---

## PASO 3: Agregar columna estado_vida_util

Copia y pega:
```sql
DO $$ BEGIN
  ALTER TABLE baterias ADD COLUMN estado_vida_util estado_vida_util DEFAULT 'ACTIVA';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
```

Haz clic en "Run"

---

## PASO 4: Agregar columna fecha_fin_vida_util

Copia y pega:
```sql
DO $$ BEGIN
  ALTER TABLE baterias ADD COLUMN fecha_fin_vida_util date;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
```

Haz clic en "Run"

---

## PASO 5: Crear función calcular_dias_desde_instalacion

Copia y pega:
```sql
CREATE OR REPLACE FUNCTION calcular_dias_desde_instalacion(bateria_id uuid)
RETURNS integer AS $$
DECLARE
  dias_totales integer;
  dias_paros integer;
  fecha_inst date;
  piscina_id_var uuid;
BEGIN
  SELECT b.fecha_instalacion, b.piscina_id INTO fecha_inst, piscina_id_var FROM baterias b WHERE b.id = bateria_id;
  IF fecha_inst IS NULL THEN RETURN 0; END IF;
  dias_totales := CURRENT_DATE - fecha_inst;
  IF dias_totales < 0 THEN RETURN 0; END IF;
  SELECT COALESCE(SUM(fecha_fin - fecha_inicio), 0) INTO dias_paros FROM paros_piscina WHERE piscina_id = piscina_id_var;
  RETURN GREATEST(0, dias_totales - dias_paros);
END;
$$ LANGUAGE plpgsql STABLE;
```

Haz clic en "Run"

---

## PASO 6: Crear función verificar_vida_util_cumplida

Copia y pega:
```sql
CREATE OR REPLACE FUNCTION verificar_vida_util_cumplida(bateria_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN calcular_dias_desde_instalacion(bateria_id) >= 3650;
END;
$$ LANGUAGE plpgsql STABLE;
```

Haz clic en "Run"

---

## PASO 7: Crear función obtener_estado_vida_util

Copia y pega:
```sql
CREATE OR REPLACE FUNCTION obtener_estado_vida_util(bateria_id uuid)
RETURNS estado_vida_util AS $$
BEGIN
  IF verificar_vida_util_cumplida(bateria_id) THEN
    RETURN 'VIDA_UTIL_CUMPLIDA'::estado_vida_util;
  ELSE
    RETURN 'ACTIVA'::estado_vida_util;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;
```

Haz clic en "Run"

---

## PASO 8: Recrear vista vw_baterias_estado

Copia y pega:
```sql
DROP VIEW IF EXISTS vw_baterias_estado;
```

Haz clic en "Run", luego copia y pega:

```sql
CREATE OR REPLACE VIEW vw_baterias_estado AS
SELECT
  b.id, b.sku_dynamics, b.codigo_unico, p.nombre as piscina, p.zona, b.finca, b.zona as zona_bateria, b.tolva,
  b.fecha_instalacion, b.voltaje_nominal, b.amperios, b.capacidad_kwh_legacy, b.estado,
  calcular_dias_desde_instalacion(b.id) as dias_desde_instalacion,
  calcular_ciclos_bateria(b.id) as ciclos_totales,
  calcular_capacidad_residual(b.id) as capacidad_residual_pct,
  obtener_estado_vida_util(b.id) as estado_vida_util,
  AGE(CURRENT_DATE, b.fecha_instalacion) as tiempo_operacion,
  b.created_at, b.updated_at
FROM baterias b LEFT JOIN piscinas p ON b.piscina_id = p.id
ORDER BY b.created_at DESC;
```

Haz clic en "Run"

---

## PASO 9: Crear vista vw_baterias_vida_util_cumplida

Copia y pega:
```sql
CREATE OR REPLACE VIEW vw_baterias_vida_util_cumplida AS
SELECT
  b.id, b.sku_dynamics, b.codigo_unico, p.nombre as piscina, p.zona, b.finca, b.tolva,
  b.fecha_instalacion, b.voltaje_nominal, b.amperios, b.estado,
  calcular_dias_desde_instalacion(b.id) as dias_desde_instalacion,
  ROUND((calcular_dias_desde_instalacion(b.id) / 365.25)::numeric, 1) as años_operacion,
  calcular_capacidad_residual(b.id) as capacidad_residual_pct,
  b.created_at, b.updated_at
FROM baterias b LEFT JOIN piscinas p ON b.piscina_id = p.id
WHERE verificar_vida_util_cumplida(b.id) = true
ORDER BY calcular_dias_desde_instalacion(b.id) DESC;
```

Haz clic en "Run"

---

## PASO 10: Crear índices

Copia y pega:
```sql
CREATE INDEX IF NOT EXISTS idx_baterias_estado_vida_util ON baterias(estado_vida_util);
```

Haz clic en "Run", luego copia y pega:

```sql
CREATE INDEX IF NOT EXISTS idx_baterias_dias_operacion ON baterias(dias_operacion);
```

Haz clic en "Run"

---

## ✅ ¡LISTO!

Una vez hayas ejecutado todos los pasos, la migración estará completa y el sistema funcionará correctamente.

### Verifica que todo funcione:
Ejecuta esta query para probar:
```sql
SELECT * FROM vw_baterias_estado LIMIT 5;
```

Deberías ver las baterías con las nuevas columnas.
