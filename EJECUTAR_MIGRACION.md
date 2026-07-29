# 🚀 Instrucciones para Ejecutar la Migración SQL

## Opción 1: Usando el Editor SQL de Supabase (RECOMENDADO)

1. Abre Supabase en tu navegador: https://app.supabase.com
2. Selecciona tu proyecto "radggsmuvtalwwktljfu"
3. Ve a **SQL Editor** (en el menú lateral izquierdo)
4. Haz clic en el botón **"New Query"**
5. Copia todo el contenido del archivo: `database/agregar_dias_y_estado_vida.sql`
6. Pega el contenido en el editor
7. Haz clic en **"Run"** (o presiona Ctrl+Enter)

## Opción 2: Usando la CLI de Supabase

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Ir a la carpeta del proyecto
cd "C:\Users\asist.aa.cachug\Desktop\2\DESARROLLO OMARSA\Gestion-Activos"

# Ejecutar la migración
supabase db push database/agregar_dias_y_estado_vida.sql
```

---

## 📋 Cambios que se realizarán:

### 1. Nuevas Funciones SQL
- `calcular_dias_desde_instalacion()` - Calcula días desde instalación
- `verificar_vida_util_cumplida()` - Verifica si cumplió 10 años
- `obtener_estado_vida_util()` - Retorna estado de vida útil

### 2. Nuevas Vistas
- `vw_baterias_estado` - Vista actualizada con días
- `vw_baterias_vida_util_cumplida` - Reporte de baterías fuera de servicio

### 3. Nuevos Campos en tabla `baterias`
- `dias_operacion` - Días de operación
- `estado_vida_util` - Estado (ACTIVA o VIDA_UTIL_CUMPLIDA)
- `fecha_fin_vida_util` - Fecha cuando cumple vida útil

### 4. Nuevos Índices
- Índices para búsquedas rápidas por estado de vida útil

---

## ✅ Verificación

Después de ejecutar la migración, verifica que todo está correcto:

```sql
-- Ver la nueva vista
SELECT * FROM vw_baterias_estado LIMIT 5;

-- Ver baterías con vida útil cumplida (debería estar vacío inicialmente)
SELECT * FROM vw_baterias_vida_util_cumplida;

-- Ver las nuevas funciones
SELECT calcular_dias_desde_instalacion('YOUR-BATTERY-ID'::uuid);
```

---

## 🎯 Próximos Pasos

1. ✅ Ejecutar esta migración SQL
2. ✅ Los cambios del frontend ya están listos (BatteriesPage, BatteryDetailPage, nuevo reporte)
3. ✅ Instalar el app con `npm install` (si es necesario)
4. ✅ Ejecutar con `npm run dev`

---

## 📞 Si hay errores

Si encuentras errores al ejecutar:
1. Revisa que el proyecto de Supabase esté correctamente conectado
2. Verifica que tienes permisos suficientes
3. Contacta al administrador si los errores persisten

Cualquier error relacionado con "ACTIVA", "BAJA", "estado_bateria" es normal si ya existen en tu BD - la migración usa `CREATE TYPE IF NOT EXISTS` para evitar esto.
