# Guía de Deployment a Cloudflare Pages

## Pre-requisitos

- ✅ Repositorio en GitHub: https://github.com/andresece07/gestionactivos_aa.git
- ✅ Schema SQL ejecutado en Supabase
- ✅ Cuenta Cloudflare activa
- ✅ Todas las dependencias instaladas localmente

## Paso 1: Preparar el Repositorio

### 1.1 Commit inicial de todo el código

```bash
cd ~/Desktop/"2/DESARROLLO OMARSA/Gestion-Activos"

# Inicializar git si no existe
git init

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "feat: initial commit - react app with supabase integration"

# Agregar remote (si no existe)
git remote add origin https://github.com/andresece07/gestionactivos_aa.git

# Push a main
git branch -M main
git push -u origin main
```

### 1.2 Verificar estructura en GitHub

Asegurarse de que en GitHub se vea:
```
gestionactivos_aa/
├── src/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
├── .gitignore
├── schema_baterias_fv.sql
├── README.md
├── PROMPTS.md
└── DEPLOYMENT.md
```

## Paso 2: Cloudflare Pages Setup

### 2.1 Conectar repositorio

1. Ir a **Cloudflare Dashboard** (https://dash.cloudflare.com)
2. Seleccionar **Pages** en el menú lateral
3. Click en **Create a project**
4. Seleccionar **Connect to Git**
5. Autorizar Cloudflare para acceder a GitHub
6. Seleccionar repositorio: `gestionactivos_aa`
7. Click en **Begin Setup**

### 2.2 Configurar build

En la pantalla de configuración:

| Campo | Valor |
|-------|-------|
| **Production branch** | `main` |
| **Framework preset** | `Vite` |
| **Build command** | `npm install && npm run build` |
| **Build output directory** | `dist` |

### 2.3 Agregar variables de entorno

1. Ir a **Settings** del proyecto
2. Ir a **Environment variables**
3. Click en **Production** (si no está expandido)
4. Click en **Add variables**

Agregar:
```
Name: VITE_SUPABASE_URL
Value: https://radggsmuvtalwwktljfu.supabase.co
Environments: Production, Preview
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: sb_publishable_jdyDWIytMLR8SB6-Y-ClkA_95H5onV_
Environments: Production, Preview
```

### 2.4 Guardar y deployar

1. Click en **Save and Deploy**
2. Cloudflare comenzará el build automático
3. Esperar 2-3 minutos mientras construye
4. Ver el deploy URL: `https://gestionactivos-aa.pages.dev` (o similar)

## Paso 3: Verificar Deploy

### 3.1 Revisar logs de build

En Cloudflare Pages → proyecto → Deployments:
- Buscar el último deployment
- Click en él para ver logs detallados
- Verificar que NO haya errores

Debe mostrar algo como:
```
✓ Build successful
✓ Deployment successful
Domain: https://gestionactivos-aa.pages.dev
```

### 3.2 Acceder a la app

1. Ir a `https://gestionactivos-aa.pages.dev`
2. Debería redirigir a `/login`
3. Usar credenciales de Supabase para loguearse
4. Verificar que:
   - ✅ Dashboard carga correctamente
   - ✅ Gráficos se renderizan
   - ✅ Puedo navegar entre páginas
   - ✅ Baterías se cargan sin errores

### 3.3 Revisar console del navegador

Abrir DevTools (F12) → Console y verificar:
- ❌ NO hay errores de CORS
- ❌ NO hay 404s de recursos
- ✅ Conexión a Supabase exitosa

## Paso 4: Configuración Post-Deploy

### 4.1 Actualizar código fuente (opcional)

Cambiar `src/lib/supabaseClient.js` para usar variables de entorno:

```javascript
// ANTES (hardcodeado)
const SUPABASE_URL = 'https://radggsmuvtalwwktljfu.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_jdyDWIytMLR8SB6-Y-ClkA_95H5onV_'

// DESPUÉS (env vars)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://radggsmuvtalwwktljfu.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_jdyDWIytMLR8SB6-Y-ClkA_95H5onV_'
```

Hacer commit y push:
```bash
git add src/lib/supabaseClient.js
git commit -m "chore: use env vars for supabase credentials"
git push origin main
```

Cloudflare Pages se redeploy automáticamente.

### 4.2 Configurar dominio personalizado (opcional)

1. Ir a proyecto en Cloudflare Pages
2. Click en **Custom domain**
3. Ingresar dominio: `baterias.tudominio.com`
4. Seguir instrucciones DNS
5. Esperar a que DNS propague (~24 horas)

## Paso 5: Configuración Supabase para CORS

Para evitar errores CORS:

1. Ir a **Supabase Dashboard** → Settings → API
2. Bajo **CORS Configuration**, agregar origen:
   ```
   https://gestionactivos-aa.pages.dev
   ```
3. Si usas dominio personalizado, también agregar:
   ```
   https://baterias.tudominio.com
   ```

## Paso 6: Testing Post-Deploy

### 6.1 Flujo de login
- [ ] Ingresar email y contraseña
- [ ] Verificar que session se guarda en localStorage
- [ ] Refrescar página y mantiene sesión

### 6.2 Dashboard
- [ ] KPIs cargan correctamente
- [ ] Gráficos se renderizan sin errores
- [ ] Números coinciden con datos en Supabase

### 6.3 Baterías
- [ ] Lista de baterías completa
- [ ] Búsqueda funciona (SKU, código, piscina)
- [ ] Click en "Ver" abre detalle correcto
- [ ] Ciclos calculados dinámicamente

### 6.4 Detalle de Batería
- [ ] Muestra toda la info correcta
- [ ] Capacidad residual calculada (0-100%)
- [ ] Comentarios cargan
- [ ] Puedo agregar nuevo comentario

### 6.5 Paros
- [ ] Puedo crear nuevo paro
- [ ] Validación de fechas funciona
- [ ] Error si hay solapamiento
- [ ] Tabla muestra todos los paros

### 6.6 Logout
- [ ] Botón logout aparece
- [ ] Click en logout cierra sesión
- [ ] Redirige a login
- [ ] No hay sesión en localStorage

## Monitoreo Post-Deploy

### Analytics en Cloudflare
- Ir a **Analytics** en proyecto Pages
- Monitores requests, errors, performance

### Logs de Supabase
- Ir a **Logs** en Supabase Dashboard
- Revisar errores de queries o auth
- Monitorear uso de funciones

### Performance
- DevTools → Lighthouse
- Correr auditoría de performance
- Target: > 80 scores

## Troubleshooting

### Error: "Cannot read properties of undefined"
**Causa**: Variable de entorno no configurada
**Solución**: Verificar env vars en Cloudflare Pages settings

### Error: "CORS error"
**Causa**: Origen no agregado en Supabase
**Solución**: Agregar dominio en Supabase → Settings → CORS

### Funciones SQL no existen
**Causa**: Schema SQL no ejecutado correctamente
**Solución**: Ejecutar nuevamente `schema_baterias_fv.sql` en Supabase SQL Editor

### Datos no se muestran en dashboard
**Causa**: RLS policies bloqueando queries
**Solución**: Verificar que `auth.uid()` esté disponible en sesión

### Build falla en Cloudflare
**Causa**: Errores en código o dependencias
**Solución**: 
1. Revisar logs en Cloudflare Pages
2. Probar `npm run build` localmente
3. Hacer commit con fix
4. Push automáticamente redeploy

## Workflow de Desarrollo

### Para agregar nuevas features

```bash
# 1. Crear rama
git checkout -b feature/nueva-feature

# 2. Hacer cambios
# ... editar archivos ...

# 3. Commit
git add .
git commit -m "feat: descripción de cambio"

# 4. Push
git push origin feature/nueva-feature

# 5. Crear PR en GitHub

# 6. Una vez merged a main, Cloudflare redeploy automático
```

## Seguridad - TODO Antes de Producción

- [ ] Cambiar credenciales Supabase (rotar claves)
- [ ] Habilitar Row Level Security en todas las tablas
- [ ] Configurar CORS correctamente
- [ ] Implementar rate limiting en API
- [ ] Configurar backups automáticos en Supabase
- [ ] Habilitar logs de auditoría
- [ ] Revisar y actualizar dependencias npm regularmente

## Mantenimiento

### Semanal
- Revisar logs de Cloudflare Pages
- Monitores de performance

### Mensual
- Actualizar dependencias: `npm update`
- Revisar analytics de uso

### Trimestral
- Backup de datos (Supabase)
- Revisión de seguridad
- Optimización de performance

---

**¡Deployment completado! 🚀**

La app está lista en: `https://gestionactivos-aa.pages.dev`
