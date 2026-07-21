# Gestión de Baterías Fotovoltaicas - OMARSA

Sistema web para registrar, monitorear y gestionar baterías fotovoltaicas en sistemas de acuacultura. Construido con React, Vite, Supabase y Cloudflare Pages.

## 🌐 Sitio en Producción

**URL**: https://gestionactivos-aa.pages.dev/

## 🎯 Características

- ✅ Autenticación con Supabase Auth
- ✅ Registro completo de baterías y piscinas
- ✅ Cálculo automático de ciclos de carga/descarga
- ✅ Cálculo de capacidad residual con degradación por ciclos
- ✅ Gestión de paros (mantenimiento y pesca)
- ✅ Sistema de auditoría inmutable con comentarios
- ✅ Dashboard con visualización de datos (gráficos)
- ✅ RLS policies para seguridad de datos
- ✅ Responsive design (mobile-first)

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + RLS)
- **UI**: TailwindCSS + Lucide Icons
- **Gráficos**: Recharts
- **Routing**: React Router v6
- **Deploy**: Cloudflare Pages

## 📋 Requisitos Previos

- Node.js >= 16
- npm o yarn
- Cuenta Supabase (https://supabase.com)
- Cuenta Cloudflare (https://cloudflare.com)
- Git

## 🚀 Instalación Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/andresece07/gestionactivos_aa.git
cd gestionactivos_aa
```

### 2. Instalar dependencias

```bash
npm install
# o
yarn install
```

### 3. Configurar Supabase

1. Ejecutar el schema SQL en Supabase:
   - Ir a **SQL Editor** en Supabase Dashboard
   - Crear un nuevo query
   - Copiar contenido de `schema_baterias_fv.sql`
   - Ejecutar el script completo

2. Verificar que las tablas y funciones se crearon correctamente:
   - `piscinas`, `baterias`, `paros_piscina`, `comentarios_bateria`
   - Funciones: `calcular_ciclos_bateria`, `calcular_capacidad_residual`, `verificar_paros_solapados`

### 4. Variables de Entorno

Las credenciales de Supabase están en `src/lib/supabaseClient.js` (TEMPORAL).

**Antes del primer deploy a producción**, mover a Cloudflare Pages:

1. En Cloudflare Dashboard → tu proyecto → Settings → Environment variables
2. Agregar variables:
   ```
   VITE_SUPABASE_URL=https://radggsmuvtalwwktljfu.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_jdyDWIytMLR8SB6-Y-ClkA_95H5onV_
   ```

3. Actualizar `src/lib/supabaseClient.js`:
   ```javascript
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
   const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
   ```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:5173`

## 📱 Uso de la App

### Login
- Email: (cualquiera registrada en Supabase)
- Contraseña: (la que configuraste)

### Dashboard
- Vista general de baterías activas y dadas de baja
- Gráficos de ciclos y capacidad residual
- KPIs de estado operativo

### Baterías
- Listar todas las baterías registradas
- Buscar por código, SKU o piscina
- Ver detalle completo con capacidad residual
- Agregar comentarios de auditoría (immutables)

### Paros
- Registrar interrupciones de operación
- Especificar motivo (mantenimiento/pesca)
- Días de espera post-paro
- Validación automática de solapamiento

## 🔧 Cálculos Realizados

### Ciclos de Batería
```
ciclos = días_totales - días_paros - días_espera
```
- `días_totales`: desde fecha_instalacion hasta hoy
- `días_paros`: suma de duración de paros registrados
- `días_espera`: suma de tiempo_espera_dias

### Capacidad Residual
```
degradación = ciclos * 0.0005 (0.05% por ciclo)
capacidad_residual = (1 - degradación) * 100
```
- Rango: 0-100%
- Capacidad en kWh = capacidad_kwh * (capacidad_residual / 100)

## 🔐 Seguridad

### RLS Policies
- **SELECT**: Todos pueden leer (público)
- **INSERT**: Solo usuarios autenticados
- **UPDATE/DELETE**: Deshabilitado (datos inmutables)

### Datos Sensibles
- Comentarios: No editables ni eliminables (auditoría)
- Baterías: Solo pueden cambiar de ACTIVA a BAJA
- Paros: Solo lectura después de crear

## 🚀 Deploy a Cloudflare Pages

### 1. Conectar con GitHub

1. Ir a Cloudflare Dashboard → Pages → Create a project
2. Conectar repositorio GitHub
3. Autorizar acceso a Cloudflare

### 2. Configurar Build

- **Framework preset**: Vite
- **Build command**: `npm run build`
- **Build output directory**: `dist`

### 3. Agregar variables de entorno

En Settings → Environment variables → Production:
```
VITE_SUPABASE_URL=https://radggsmuvtalwwktljfu.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_jdyDWIytMLR8SB6-Y-ClkA_95H5onV_
```

### 4. Deploy automático

- Cada push a `main` triggeará build automático
- Cloudflare Pages servará la app en `https://tu-proyecto.pages.dev`

## 📁 Estructura de Carpetas

```
gestionactivos_aa/
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── Error.jsx
│   │   ├── Loading.jsx
│   │   └── Navbar.jsx
│   ├── hooks/            # Custom hooks
│   │   ├── useAuth.js
│   │   └── useSupabase.js
│   ├── lib/              # Librerías externas
│   │   └── supabaseClient.js
│   ├── pages/            # Páginas principales
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── BatteriesPage.jsx
│   │   ├── BatteryDetailPage.jsx
│   │   └── StoppagePage.jsx
│   ├── App.jsx           # Componente raíz + rutas
│   ├── index.css         # Estilos globales
│   └── main.jsx          # Entry point
├── schema_baterias_fv.sql # Schema SQL completo
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── wrangler.toml
└── index.html
```

## 🧪 Testing

Actualmente sin suite de tests. Se recomienda agregar:
- Vitest para unit tests
- React Testing Library para component tests
- Cypress para e2e tests

## 🐛 Troubleshooting

### "CORS error" en Supabase
- Verificar SUPABASE_URL y SUPABASE_ANON_KEY en supabaseClient.js
- En Supabase Settings → API → CORS, agregar dominio de Cloudflare Pages

### "No puedo logearme"
- Verificar usuario existe en Supabase Auth
- Revisar que usuario esté confirmado (check email)

### "Funciones SQL no existen"
- Ejecutar nuevamente script `schema_baterias_fv.sql` completo
- Verificar en Supabase → SQL Editor → Stored Procedures

### "No ve los datos en dashboard"
- Esperar a que carguen (puede tomar algunos segundos)
- Verificar que RLS policies estén activas
- Revisar console del navegador para errores

## 📝 Notas de Desarrollo

- Los comentarios son **completamente inmutables** (auditoría)
- Las baterías **no se pueden editar** después de crearse
- Los ciclos **se calculan dinámicamente** en cada query
- La capacidad residual considera **degradación exponencial**

## 🤝 Contribuir

Crear pull request con cambios. Asegurar:
- [ ] Tests pasan
- [ ] Código formateado
- [ ] Sin console.logs
- [ ] RLS policies respetadas

## 📄 Licencia

Privado - OMARSA

## 📞 Soporte

Contactar al equipo de desarrollo de OMARSA

---

**Última actualización**: 2024  
**Versión**: 0.1.0
