# Guía de Instalación - Gestión de Baterías Fotovoltaicas

## Requisitos Previos

- Node.js 18+ y npm 9+
- Una cuenta en Supabase
- Git instalado
- Navegador moderno (Chrome, Firefox, Edge)

## 1. Instalación del Proyecto

### 1.1 Clonar/Descargar el Repositorio

```bash
# Si tienes el repositorio en Git
git clone <url-del-repositorio>
cd Gestion-Activos

# O descargar como ZIP y extraer
```

### 1.2 Instalar Dependencias

```bash
npm install
```

### 1.3 Crear Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://radggsmuvtalwwktljfu.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_jdyDWIytMLR8SB6-Y-ClkA_95H5onV_
```

**Nota:** Reemplaza estos valores con los de tu proyecto Supabase.

## 2. Configuración de Supabase

### 2.1 Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Crea un nuevo proyecto
3. Anota tu Project URL y Anon Key
4. Espera a que se inicialice completamente (puede tomar 1-2 minutos)

### 2.2 Ejecutar el Schema SQL

1. Abre tu proyecto en Supabase
2. Ve a **SQL Editor** → **New Query**
3. Copia y pega TODO el contenido del archivo `schema_baterias_fv.sql`
4. Haz clic en **Run** (botón verde)
5. Espera a que se complete (debe decir "Success")

**Si hay errores sobre tipos existentes**, ejecuta este SQL de actualización en un nuevo query:

```sql
-- Agregar columnas a baterias si no existen
ALTER TABLE baterias ADD COLUMN IF NOT EXISTS proveedor_id uuid;
ALTER TABLE baterias ADD COLUMN IF NOT EXISTS lote text;

-- Crear tabla proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  persona_contacto text,
  email text,
  telefono text,
  ciudad text,
  pais text,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores(nombre);
CREATE INDEX IF NOT EXISTS idx_proveedores_activo ON proveedores(activo);

ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "proveedores_select_all" ON proveedores FOR SELECT USING (true);

-- Crear tabla empleados
CREATE TABLE IF NOT EXISTS empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cargo text NOT NULL,
  color text DEFAULT '#e3f2fd',
  piscina_id uuid REFERENCES piscinas(id) ON DELETE SET NULL,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_empleados_piscina ON empleados(piscina_id);
CREATE INDEX IF NOT EXISTS idx_empleados_activo ON empleados(activo);

-- Crear tabla cronograma_personal
CREATE TABLE IF NOT EXISTS cronograma_personal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id uuid NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  estado text NOT NULL DEFAULT 'PROGRAMADO',
  motivo text,
  evidencia_url text,
  creado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  UNIQUE(empleado_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_cronograma_empleado ON cronograma_personal(empleado_id);
CREATE INDEX IF NOT EXISTS idx_cronograma_fecha ON cronograma_personal(fecha);
CREATE INDEX IF NOT EXISTS idx_cronograma_estado ON cronograma_personal(estado);

ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE cronograma_personal ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "empleados_select_all" ON empleados FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "cronograma_select_all" ON cronograma_personal FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "cronograma_insert_auth" ON cronograma_personal FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "cronograma_update_auth" ON cronograma_personal FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Insertar proveedores
INSERT INTO proveedores (nombre, persona_contacto, email, telefono, ciudad, pais, activo)
VALUES
  ('BatteryTech Solutions', 'Carlos Mendez', 'info@batterytech.com', '+56 9 1234 5678', 'Santiago', 'Chile', true),
  ('Solar Energy Supplies', 'María López', 'contact@solarsupply.com', '+56 9 2345 6789', 'Concepción', 'Chile', true),
  ('Renewable Power Corp', 'Juan García', 'sales@renewpower.com', '+56 9 3456 7890', 'Valparaíso', 'Chile', true),
  ('EcoBattery International', 'Ana Silva', 'support@ecobattery.com', '+56 9 4567 8901', 'Puerto Montt', 'Chile', true)
ON CONFLICT (nombre) DO NOTHING;

-- Insertar empleados
INSERT INTO empleados (nombre, cargo, color, activo)
VALUES
  ('Juan Pérez', 'Gerente', '#e3f2fd', true),
  ('María García', 'Técnico', '#f3e5f5', true),
  ('Carlos López', 'Operario', '#e8f5e9', true),
  ('Ana Martínez', 'Operario', '#fff3e0', true),
  ('Roberto Silva', 'Mantenimiento', '#fce4ec', true)
ON CONFLICT DO NOTHING;
```

### 2.3 Crear Usuario de Prueba (Autenticación)

1. En Supabase, ve a **Authentication** → **Users**
2. Haz clic en **Invite Users** o **Create User**
3. Usa estos datos:
   - Email: `usuario@omarsa.com`
   - Password: `Password123!`
4. Click **Create User**

### 2.4 Verificar Datos Iniciales

1. Ve a **Table Editor** en Supabase
2. Verifica que existan las tablas:
   - piscinas (3 piscinas)
   - baterias (5 baterías)
   - proveedores (4 proveedores)
   - empleados (5 empleados)

## 3. Ejecutar la Aplicación

### 3.1 Modo Desarrollo

```bash
# En la carpeta del proyecto
npm run dev
```

La aplicación se abrirá en `http://localhost:5173`

### 3.2 Login

Usa las credenciales de prueba:
- Email: `usuario@omarsa.com`
- Password: `Password123!`

## 4. Builds para Producción

### 4.1 Build Local

```bash
npm run build
```

Genera la carpeta `dist/` lista para desplegar.

### 4.2 Desplegar en Cloudflare Pages

1. Sube el código a GitHub
2. En Cloudflare:
   - Ve a **Pages**
   - Conecta tu repositorio GitHub
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables:
     - VITE_SUPABASE_URL
     - VITE_SUPABASE_ANON_KEY
3. Deploy automático en cada push

## 5. Características Principales

### Dashboard
- Resumen de baterías activas
- Estado general del sistema

### Gestión de Baterías
- Crear baterías nuevas con:
  - SKU y código único
  - Proveedor
  - Piscina
  - Fechas de compra e instalación
  - Voltaje y capacidad
  - Lote (batch)
- Ver detalles de cada batería
- Historial de ciclos y degradación

### Cronograma de Personal
- Crear nuevos empleados
- Asignar estados:
  - Turno / En Turno
  - Día Libre
  - Enfermo
  - Vacaciones
  - Falta
- Seleccionar rangos de fechas
- Exportar a CSV

### Paros de Piscina
- Registrar mantenimientos y paros
- Verificar solapamientos
- Asociar con piscina y empleados

## 6. Troubleshooting

### Error: "Cannot find module 'supabase'"
```bash
npm install @supabase/supabase-js
```

### Error: "Invalid Supabase credentials"
- Verifica que `.env.local` esté en la raíz
- Confirma que las claves sean correctas en Supabase
- Reinicia el servidor: `npm run dev`

### Error: "Table does not exist"
- Ejecuta nuevamente el schema SQL
- Verifica que no haya errores en la ejecución

### Login no funciona
- Confirma que el usuario existe en **Authentication**
- Verifica que la contraseña sea correcta
- Intenta crear un nuevo usuario

### La app es lenta
- Verifica conexión a internet
- Abre DevTools (F12) → Network para ver requests
- Comprueba estado de Supabase en su dashboard

## 7. Estructura del Proyecto

```
Gestion-Activos/
├── src/
│   ├── components/        # Componentes React reutilizables
│   ├── pages/            # Páginas principales
│   ├── hooks/            # Custom hooks (useAuth, etc)
│   ├── lib/              # Utilitarios y cliente Supabase
│   ├── App.jsx           # Rutas principales
│   └── main.jsx          # Entrada
├── schema_baterias_fv.sql # Schema completo
├── .env.local            # Variables de entorno (NO commitear)
├── package.json
├── vite.config.js
└── tailwind.config.js    # Configuración de estilos
```

## 8. Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linter (Si existe)
npm run lint
```

## 9. Notas de Seguridad

⚠️ **IMPORTANTE:**
- Nunca commites `.env.local` a Git
- Las claves Supabase están expuestas (es una demo)
- Para producción, restringir RLS policies
- Crear roles específicos por usuario
- Implementar 2FA en Authentication
- Auditar acceso regularmente

## 10. Contacto y Soporte

- Documentación de Supabase: https://supabase.com/docs
- Documentación de React Router: https://reactrouter.com
- Documentación de Tailwind: https://tailwindcss.com

---

**Última actualización:** 2026-07-17
**Versión:** 1.0
**Mantenedor:** OMARSA Team
