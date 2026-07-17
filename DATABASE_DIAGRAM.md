# Diagrama de Base de Datos - Gestión de Baterías Fotovoltaicas

## Estructura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SCHEMA: public                                   │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    piscinas      │     │   proveedores    │     │   empleados      │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (uuid) PK     │     │ id (uuid) PK     │     │ id (uuid) PK     │
│ nombre (text)    │     │ nombre (text)    │     │ nombre (text)    │
│ zona (text)      │     │ persona_contacto │     │ cargo (text)     │
│ created_at       │     │ email (text)     │     │ color (text)     │
│                  │     │ telefono (text)  │     │ piscina_id (uuid)├──┐
│                  │     │ ciudad (text)    │     │ activo (bool)    │  │
│                  │     │ pais (text)      │     │ created_at       │  │
│                  │     │ activo (bool)    │     │ updated_at       │  │
│                  │     │ created_at       │     └──────────────────┘  │
│                  │     │ updated_at       │                           │
│                  │     └──────────────────┘                           │
│                  │                                                    │
└────────┬─────────┘                                                    │
         │                                                              │
         │ (1:N)                                                        │
         │                                                              │
         ├──────────────────────────────────────────────────────────────┤
         │                                                              │
         │                     ┌──────────────────┐                     │
         │                     │     baterias     │                     │
         │                     ├──────────────────┤                     │
         │                     │ id (uuid) PK     │                     │
         │                     │ sku_dynamics     │                     │
         │                     │ codigo_unico     │                     │
         │                     │ lote (text)      │                     │
         │                     │ piscina_id (uuid)├─────────────────────┤
         │                     │ proveedor_id (u) ├──┐
         │                     │ fecha_compra     │  │
         │                     │ fecha_instal     │  │
         │                     │ voltaje_nominal  │  │
         │                     │ capacidad_kwh    │  │
         │                     │ estado (enum)    │  │
         │                     │ created_at       │  │
         │                     │ updated_at       │  │
         │                     └────────┬─────────┘  │
         └─────────────────────────────┘             │
                                                     │ (N:1)
                                                     │
                                       ┌─────────────┘
                                       │
                                       └──────────────────┐
                                                          │
                                          ┌───────────────┴──────────┐
                                          │    paros_piscina        │
                                          ├─────────────────────────┤
                                          │ id (uuid) PK            │
                                          │ piscina_id (uuid) FK    │
                                          │ fecha_inicio (date)     │
                                          │ fecha_fin (date)        │
                                          │ motivo (enum)           │
                                          │ tiempo_espera_dias (int)│
                                          │ created_at              │
                                          │ created_by (uuid) FK    │
                                          └─────────────────────────┘

┌──────────────────────┐       ┌──────────────────────┐
│  comentarios_bateria │       │ cronograma_personal  │
├──────────────────────┤       ├──────────────────────┤
│ id (uuid) PK         │       │ id (uuid) PK         │
│ bateria_id (uuid) FK ├──────►│ empleado_id (uuid) FK
│ contenido (text)     │       │ fecha (date)         │
│ usuario_id (uuid) FK │       │ estado (enum)        │
│ fecha_creacion       │       │ motivo (text)        │
│ created_at           │       │ evidencia_url (text) │
└──────────────────────┘       │ creado_por (uuid) FK │
                               │ created_at           │
                               │ updated_at           │
                               └──────────────────────┘
```

## Tipos ENUM

### `estado_bateria`
- ACTIVA
- BAJA

### `motivo_paro`
- MANTENIMIENTO
- PESCA

### `estado_cronograma`
- TURNO
- LIBRE
- ENFERMO
- VACACIONES
- FALTA
- PROGRAMADO

## Relaciones (Foreign Keys)

| Tabla | Campo | Referencia | Acción |
|-------|-------|-----------|--------|
| baterias | piscina_id | piscinas.id | ON DELETE RESTRICT |
| baterias | proveedor_id | proveedores.id | ON DELETE SET NULL |
| paros_piscina | piscina_id | piscinas.id | ON DELETE RESTRICT |
| paros_piscina | created_by | auth.users.id | ON DELETE RESTRICT |
| comentarios_bateria | bateria_id | baterias.id | ON DELETE CASCADE |
| comentarios_bateria | usuario_id | auth.users.id | ON DELETE RESTRICT |
| empleados | piscina_id | piscinas.id | ON DELETE SET NULL |
| cronograma_personal | empleado_id | empleados.id | ON DELETE CASCADE |
| cronograma_personal | creado_por | auth.users.id | ON DELETE SET NULL |

## Índices

- idx_piscinas_nombre: piscinas(nombre)
- idx_proveedores_nombre: proveedores(nombre)
- idx_proveedores_activo: proveedores(activo)
- idx_baterias_piscina: baterias(piscina_id)
- idx_baterias_estado: baterias(estado)
- idx_baterias_sku: baterias(sku_dynamics)
- idx_baterias_proveedor: baterias(proveedor_id)
- idx_paros_piscina: paros_piscina(piscina_id)
- idx_paros_fecha: paros_piscina(fecha_inicio, fecha_fin)
- idx_paros_created_by: paros_piscina(created_by)
- idx_paros_motivo: paros_piscina(motivo)
- idx_comentarios_bateria: comentarios_bateria(bateria_id)
- idx_comentarios_usuario: comentarios_bateria(usuario_id)
- idx_comentarios_fecha: comentarios_bateria(fecha_creacion DESC)
- idx_empleados_piscina: empleados(piscina_id)
- idx_empleados_activo: empleados(activo)
- idx_cronograma_empleado: cronograma_personal(empleado_id)
- idx_cronograma_fecha: cronograma_personal(fecha)
- idx_cronograma_estado: cronograma_personal(estado)
- idx_cronograma_unico: cronograma_personal(empleado_id, fecha) UNIQUE

## Funciones SQL

### calcular_ciclos_bateria(bateria_id uuid) → integer
Calcula días operacionales totales considerando paros.

### calcular_capacidad_residual(bateria_id uuid) → numeric
Calcula degradación (0.05% por ciclo) hasta máximo 100%.

### verificar_paros_solapados(piscina_id uuid, fecha_inicio date, fecha_fin date) → boolean
Verifica si hay paros superpuestos.

### actualizar_updated_at_bateria()
Trigger que actualiza timestamp cuando batería cambia a estado BAJA.

## Row Level Security (RLS)

Todas las tablas tienen RLS habilitado:
- **Lectura**: Abierta para usuarios autenticados (SELECT USING true)
- **Escritura**: Solo usuarios autenticados (INSERT/UPDATE WITH CHECK auth.uid() IS NOT NULL)
- **Paros y cronograma**: Validación adicional de propiedad (usuario_id = auth.uid())
