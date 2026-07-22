# Arquitectura Modular - Gestión de Activos OMARSA

## 🏗️ Estructura de 2 Módulos Independientes

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SISTEMA INTEGRADO OMARSA                         │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐    ┌──────────────────────────────┐
│   MÓDULO 1: GESTIÓN DE ACTIVOS   │    │  MÓDULO 2: GESTIÓN DE RH     │
│   (Baterías Fotovoltaicas)       │    │  (Recursos Humanos)          │
├──────────────────────────────────┤    ├──────────────────────────────┤
│                                  │    │                              │
│ • Registro de baterías           │    │ • Gestión de empleados       │
│ • Proveedores                    │    │ • Cronograma de personal     │
│ • Piscinas/Infraestructura       │    │ • Disponibilidad             │
│ • Ciclos y degradación           │    │ • Estados (Turno, Libre...)  │
│ • Paros y mantenimiento          │    │ • Historial                  │
│                                  │    │                              │
│ DB: baterias, proveedores,      │    │ DB: empleados,               │
│     piscinas, paros_piscina,     │    │     cronograma_personal      │
│     comentarios_bateria          │    │                              │
│                                  │    │                              │
└──────────────────────────────────┘    └──────────────────────────────┘
         ▲                                        ▲
         │                                        │
         └────────────────────────────────────────┘
                    API de Integración
                  (REST / GraphQL / Webhooks)
```

## 📊 Módulo 1: Gestión de Activos (Baterías)

### Tablas
- `piscinas` - Infraestructura acuícola
- `proveedores` - Proveedores de baterías
- `baterias` - Registro de baterías FV
- `paros_piscina` - Mantenimientos/paros
- `comentarios_bateria` - Notas y seguimiento

### APIs Expuestas
```
GET /api/activos/baterias              - Listar baterías
GET /api/activos/baterias/:id          - Detalles de batería
POST /api/activos/baterias             - Crear batería
GET /api/activos/baterias/:id/ciclos   - Calcular ciclos
GET /api/activos/proveedores           - Listar proveedores
GET /api/activos/piscinas              - Listar piscinas
POST /api/activos/paros                - Registrar paro
```

### Webhooks que Emite
```
bateria.creada
bateria.actualizada
bateria.degradacion_critica (< 80%)
paro.registrado
proveedor.agregado
```

---

## 👥 Módulo 2: Gestión de RH (Personal)

### Tablas
- `empleados` - Personal activo
- `cronograma_personal` - Calendario de disponibilidad

### APIs Expuestas
```
GET /api/rh/empleados                   - Listar empleados
POST /api/rh/empleados                  - Crear empleado
GET /api/rh/cronograma/:mes             - Calendario mensual
POST /api/rh/cronograma                 - Asignar estado
GET /api/rh/empleados/:id/disponibilidad - Disponibilidad
GET /api/rh/turnos/generados            - Turnos auto-generados
```

### Webhooks que Emite
```
empleado.agregado
empleado.vacaciones_iniciadas
empleado.vacaciones_finalizadas
cronograma.actualizado
turno.conflicto_detectado
```

---

## 🔗 Integración Entre Módulos

### Caso de Uso 1: Asignar Mantenimiento
```
1. Sistema de Activos detecta batería con degradación > 70%
2. Emite webhook: bateria.mantenimiento_requerido
3. Sistema de RH recibe evento
4. Sistema de RH verifica disponibilidad de técnicos
5. Sistema de RH sugiere fechas disponibles
6. Sistema de Activos crea paro en esas fechas
7. Sistema de RH marca turnos como "mantenimiento" en esas fechas
```

### Caso de Uso 2: Validar Capacidad de Personal
```
1. Sistema de RH recibe solicitud de crear período de vacaciones
2. Verifica: ¿Hay paros en esas fechas?
3. Consulta Sistema de Activos: GET /api/activos/paros?desde=X&hasta=Y
4. Si hay paros: alerta "No hay paros programados, puede ir de vacaciones"
5. Si NO hay paros: alerta "Hay mantenimiento programado, contactar admin"
```

---

## 🌐 API de Integración

### Endpoints Compartidos (Autenticación)
```
POST /auth/login              - Login
POST /auth/logout             - Logout
GET  /auth/user               - Usuario actual
POST /auth/refresh-token      - Renovar sesión
```

### Webhooks Framework
```
POST /webhooks/register       - Registrar webhook
DELETE /webhooks/:id          - Desregistrar
GET /webhooks/logs            - Ver logs
POST /webhooks/test/:id       - Probar webhook
```

---

## 📝 Especificación de Integración

### Evento: Batería Requiere Mantenimiento

**Nombre:** `bateria.mantenimiento_requerido`
**Disparador:** Degradación > 70%
**Payload:**
```json
{
  "event": "bateria.mantenimiento_requerido",
  "timestamp": "2026-07-17T10:30:00Z",
  "data": {
    "bateria_id": "uuid-xxx",
    "codigo_unico": "BAT-001-2024",
    "capacidad_residual_pct": 68,
    "degradacion_estimada": "32%",
    "ciclos_totales": 450,
    "mantenimiento_recomendado": "Limpieza y verificación",
    "piscina_id": "uuid-yyy",
    "piscina_nombre": "Langua",
    "proveedor_id": "uuid-zzz",
    "proveedor_nombre": "BatteryTech Solutions",
    "duracion_estimada_dias": 3
  }
}
```

### Evento: Personal Disponible

**Nombre:** `rh.personal_disponible`
**Disparador:** Consulta del sistema de activos
**Payload:**
```json
{
  "event": "rh.personal_disponible",
  "timestamp": "2026-07-17T10:30:00Z",
  "data": {
    "desde": "2026-07-20",
    "hasta": "2026-07-24",
    "disponibles": [
      {
        "empleado_id": "uuid-aaa",
        "nombre": "Juan Pérez",
        "cargo": "Gerente",
        "dias_disponibles": 5,
        "horas_disponibles": 40
      }
    ],
    "total_horas": 40,
    "conflictos": []
  }
}
```

---

## 🔐 Autenticación y Autorización

### Roles (RBAC)
```
ADMIN         - Acceso total a ambos módulos
GERENTE_ACTIVOS - Solo módulo de baterías
GERENTE_RH   - Solo módulo de personal
TECNICO      - Lectura de baterías, ver cronograma
EMPLEADO     - Ver solo su cronograma
PROVEEDOR    - Ver datos de sus baterías
```

### JWT Claims
```json
{
  "sub": "usuario-id",
  "email": "usuario@omarsa.com",
  "roles": ["GERENTE_ACTIVOS"],
  "permisos": [
    "activos:read",
    "activos:create",
    "activos:update",
    "paros:create"
  ],
  "modulos": ["activos"],
  "exp": 1234567890
}
```

---

## 🚀 Integración con Sistemas Externos

### Conectar con otro sistema de Baterías
```
1. Sistema Externo se registra como proveedor de webhooks
2. Sistema OMARSA envía eventos cuando:
   - Se crea batería
   - Se actualiza estado
   - Se calcula degradación
3. Sistema Externo actualiza su BD con los datos
4. Sincronización bidireccional via API REST
```

### Conectar con otro sistema de RH
```
1. Sistema Externo (ej: Sistema de RRHH corporativo)
2. Se autentica con credenciales OAuth
3. Consulta disponibilidad vía API
4. Recibe webhooks de cambios
5. Puede crear/actualizar empleados en OMARSA
6. Mantiene sincronización de datos
```

---

## 📦 Deployment Independiente

### Opción 1: Mismo servidor
```
server/
├── activos-service/
│   ├── app.py
│   ├── requirements.txt
│   └── .env
├── rh-service/
│   ├── app.py
│   ├── requirements.txt
│   └── .env
└── docker-compose.yml
```

### Opción 2: Servidores separados
```
Servidor A (Activos):  activos.omarsa.com
  - API REST: /api/activos/*
  - Webhooks: /webhooks/activos
  - DB: postgres-activos

Servidor B (RH):       rh.omarsa.com
  - API REST: /api/rh/*
  - Webhooks: /webhooks/rh
  - DB: postgres-rh

Gateway (API Unificada): api.omarsa.com
  - Enruta a ambos servicios
  - Maneja autenticación centralizada
```

---

## 🔄 Sincronización de Datos

### Patrón Event Sourcing
```
Módulo de Activos           Módulo de RH
      │                         │
      └──► Event Log ◄──────────┘
      
Cada cambio → Evento
Eventos → Base de Datos Centralizada
Sincronización mediante eventos
```

### Tabla Central: `events`
```sql
CREATE TABLE events (
  id uuid PRIMARY KEY,
  tipo text,              -- bateria.creada, rh.empleado.agregado
  modulo text,            -- activos, rh
  datos jsonb,
  timestamp timestamp,
  procesado boolean,
  UNIQUE(tipo, timestamp, modulo)
);
```

---

## 📊 Flujo de Datos Completo

```
Usuario crea Batería
    ↓
Sistema Activos API
    ↓
DB: baterias
    ↓
Event Log: bateria.creada
    ↓
Sistema RH consume evento
    ↓
Verifica: ¿Técnico disponible?
    ↓
Event Log: rh.personal_asignado
    ↓
Sistema Activos consume evento
    ↓
Actualiza: bateria.tecnico_asignado = rh-tecnico-id
    ↓
Webhooks a sistemas externos
```

---

## 🧪 Testing de Integración

### Test: Crear batería → Notificar RH
```bash
# 1. Crear batería en Módulo de Activos
curl -X POST http://activos:8000/api/baterias \
  -H "Content-Type: application/json" \
  -d '{"sku_dynamics":"SKU-TEST","codigo_unico":"BAT-TEST",...}'

# 2. Verificar que Sistema RH recibió webhook
curl http://rh:8001/api/webhooks/logs \
  -H "Authorization: Bearer token" | jq '.[] | select(.evento=="bateria.creada")'

# 3. Validar datos sincronizados
curl http://rh:8001/api/integraciones/activos/baterias
```

---

## 📋 Checklist de Integración

- [ ] Ambos módulos exponen APIs REST
- [ ] Sistema de webhooks implementado
- [ ] Event log centralizado
- [ ] Autenticación unificada (OAuth/JWT)
- [ ] Tests de integración pasando
- [ ] Documentación de APIs (OpenAPI/Swagger)
- [ ] Manejo de errores y reintentos
- [ ] Logs centralizados
- [ ] Monitoreo de eventos
- [ ] Recuperación ante fallos

---

**Versión:** 1.0  
**Última actualización:** 2026-07-17  
**Mantenedor:** OMARSA Team
