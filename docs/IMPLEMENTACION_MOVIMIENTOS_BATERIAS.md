# Implementación: Sistema de Registro de Movimientos de Baterías con QR

**Fecha**: 22 de julio de 2026  
**Estado**: Listo para implementar  
**Prioridad**: Alta

---

## 📋 Resumen

Sistema completo para registrar y rastrear movimientos de baterías incluyendo:
- Ubicación (piscina y tolva)
- Tipo de movimiento (instalación, traslado, mantenimiento, etc.)
- Datos técnicos (ciclos, capacidad, voltaje, temperatura)
- Observaciones y estado de la batería
- Lectura mediante código QR
- Historial completo filtrable

---

## 🔧 Pasos de Implementación

### 1. Ejecutar migración SQL en Supabase

**Archivo**: `database/movimientos_baterias_schema.sql`

1. Ve a [Supabase Console](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Copia y pega el contenido de `movimientos_baterias_schema.sql`
5. Ejecuta la query

**Lo que crea:**
- Tabla `movimientos_baterias` con todos los campos
- Índices para optimizar búsquedas
- Trigger automático para `updated_at`
- Políticas RLS (Row Level Security)

### 2. Verificar la tabla en Supabase

1. Ve a **Table Editor**
2. Busca `movimientos_baterias`
3. Verifica que tenga estas columnas:
   - `id` (UUID, primary key)
   - `bateria_id` (relación con baterías)
   - `piscina_id` (relación con piscinas)
   - `tolva` (VARCHAR)
   - `tipo_movimiento` (instalación, traslado, etc.)
   - `ciclos_registrados`, `capacidad_residual`, etc.
   - `usuario_id`, `usuario_nombre`
   - `fecha_movimiento`, `fecha_registro`
   - `observaciones`, `estado_bateria`

---

## 📱 Características de Usuario

### Módulo "Lectura QR"
- Accesible desde pantalla principal
- Escanear o ingresar manualmente código QR
- Redirecciona al historial de la batería
- Códigos de prueba incluidos

### Historial de Batería
- Ver todos los movimientos de una batería
- Agregar nuevo movimiento
- Editar movimientos existentes
- Eliminar movimientos
- Filtros completos

### Filtros disponibles
- **Por fecha**: Desde - Hasta
- **Por piscina**: Seleccionar piscina
- **Por tolva**: Campo de texto
- **Por tipo de movimiento**: Dropdown
- **Por estado**: Funcionando, Con falla, etc.
- **Por usuario**: Quién registró

---

## 🔍 Datos en cada Movimiento

```json
{
  "bateria_id": "UUID",
  "piscina_id": "UUID",
  "tolva": "Tolva A-1",
  "tipo_movimiento": "TRASLADO",
  
  "ciclos_registrados": 45000,
  "capacidad_residual": 87.5,
  "voltaje_inicial": 48.2,
  "voltaje_final": 47.9,
  "temperatura": 32.5,
  
  "usuario_id": "UUID",
  "usuario_nombre": "usuario@omarsa.com",
  "fecha_movimiento": "2026-07-22T10:30:00Z",
  "observaciones": "Traslado a Piscina 2 por mantenimiento",
  "estado_bateria": "FUNCIONANDO",
  "proxima_revision": "2026-08-22"
}
```

### Tipos de movimiento permitidos
- `INSTALACION`: Instalación inicial
- `TRASLADO`: Movimiento entre piscinas/tolvas
- `MANTENIMIENTO`: Mantenimiento programado
- `REPARACION`: Reparación necesaria
- `INSPECCION`: Inspección técnica
- `CAMBIO_TOLVA`: Cambio de tolva
- `RECARGA`: Recarga de batería
- `DESCARGA`: Descarga de batería
- `OTRO`: Otros movimientos

---

## 🔑 Configuración QR

### Formato del QR
El código QR debe contener el **código único de la batería**

**Ejemplo de códigos válidos:**
- `BAT-001-2024`
- `BAT-002-2024`
- `FV-PISCINA-1`

### Generar códigos QR
Para generar los QR, usa servicios como:
1. [QR Code Generator](https://www.qr-code-generator.com/)
2. [Zxing](https://zxing.appspot.com/)
3. Herramientas en línea gratis

**Contenido**: Simplemente el código único de la batería

---

## 🎯 Flujo de Uso

### Registrar nuevo movimiento de batería

1. **Opción A - Desde QR:**
   - Click en módulo "Lectura QR"
   - Escanear código QR o ingresar código manualmente
   - Sistema busca batería y abre historial
   - Click en "Agregar movimiento"

2. **Opción B - Desde Baterías:**
   - Ir a módulo "Baterías"
   - Click en una batería
   - Scroll a "Historial de Movimientos"
   - Click en "Agregar Movimiento"

### Formulario de movimiento
- Seleccionar **piscina** (obligatorio)
- Ingresar **tolva** (obligatorio)
- Seleccionar **tipo de movimiento** (obligatorio)
- Datos técnicos opcionales:
  - Ciclos registrados
  - Capacidad residual
  - Voltaje (inicial y final)
  - Temperatura
- Estado de la batería (obligatorio)
- Observaciones (opcional)
- Próxima revisión (opcional)

### Ver historial
- Tabla con todos los movimientos
- Ordenados por fecha (más reciente primero)
- Botones para:
  - **Ver detalles**: Expande registro
  - **Editar**: Modificar datos
  - **Eliminar**: Remover registro
  - **Exportar**: Descargar como CSV

---

## 🗄️ Relaciones en la Base de Datos

```
movimientos_baterias
├── bateria_id → baterias.id
├── piscina_id → piscinas.id
└── usuario_id → auth.users.id
```

---

## 📊 Consultas útiles

### Ver todos los movimientos de una batería
```sql
SELECT * FROM movimientos_baterias 
WHERE bateria_id = 'UUID' 
ORDER BY fecha_movimiento DESC
```

### Movimientos en las últimas 7 días
```sql
SELECT * FROM movimientos_baterias 
WHERE fecha_movimiento >= NOW() - INTERVAL '7 days'
ORDER BY fecha_movimiento DESC
```

### Baterías en mantenimiento
```sql
SELECT DISTINCT b.codigo_unico, m.tolva
FROM movimientos_baterias m
JOIN baterias b ON m.bateria_id = b.id
WHERE m.estado_bateria = 'REQUIERE_MANTENIMIENTO'
ORDER BY m.fecha_movimiento DESC
```

---

## ✅ Checklist de Implementación

- [ ] Ejecutar SQL en Supabase
- [ ] Verificar tabla `movimientos_baterias` creada
- [ ] Verificar índices creados
- [ ] Probar crear movimiento desde QR
- [ ] Probar crear movimiento desde Baterías
- [ ] Probar filtros
- [ ] Probar editar movimiento
- [ ] Probar eliminar movimiento
- [ ] Generar códigos QR para baterías
- [ ] Imprimir/etiquetar baterías con QR
- [ ] Capacitar usuarios

---

## 🚀 Próximas Mejoras

1. **Lectura QR real**: Integrar librería `html5-qrcode` para lectura con cámara
2. **Reportes**: Exportar historial completo a PDF
3. **Gráficos**: Mostrar tendencias de ciclos y capacidad
4. **Notificaciones**: Alertar sobre revisiones próximas
5. **Foto de evidencia**: Adjuntar fotos a movimientos
6. **Sincronización offline**: Registrar movimientos sin conexión

---

## 📞 Soporte

Para preguntas sobre la implementación:
1. Verificar que la tabla se creó correctamente en Supabase
2. Revisar que los códigos QR contengan el código único correcto
3. Verificar que la batería existe en la tabla `baterias`

**Commit**: `10ba95c`
