# 🚀 Deploy a Cloudflare Pages

## ✅ Build Completado

El proyecto ya está compilado en la carpeta `dist/`. 

**Estadísticas del build:**
- HTML: 0.49 kB (gzip: 0.33 kB)
- CSS: 19.91 kB (gzip: 4.27 kB)
- JS: 810.49 kB (gzip: 224.80 kB)
- ✅ Build time: 5.21s

---

## 📋 Requisitos para Deploy

1. ✅ Proyecto en GitHub
2. ✅ Cuenta en Cloudflare (gratis)
3. ✅ Variables de entorno configuradas
4. ✅ Build completado (dist/ existe)

---

## 🚀 Método 1: Deploy Automático (Recomendado)

### Paso 1: Subir a GitHub

```bash
# Si no tienes repositorio remoto
git remote add origin https://github.com/tu-usuario/Gestion-Activos.git
git branch -M main
git push -u origin main
```

### Paso 2: Conectar con Cloudflare

1. **Ve a:** https://dash.cloudflare.com
2. **Inicia sesión** (crea cuenta si es necesario - es GRATIS)
3. **Selecciona:** Pages en el menú lateral
4. **Clic en:** "Create a project" → "Connect to Git"
5. **Autoriza:** GitHub y selecciona `Gestion-Activos`
6. **Configura:**
   - **Framework:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variables:**
     ```
     VITE_SUPABASE_URL = https://radggsmuvtalwwktljfu.supabase.co
     VITE_SUPABASE_ANON_KEY = sb_publishable_jdyDWIytMLR8SB6-Y-ClkA_95H5onV_
     ```

7. **Clic:** "Save and Deploy"
8. **Espera:** 2-3 minutos para compilar

### Resultado

- ✅ Tu app en: `https://gestion-activos-xyz.pages.dev`
- ✅ Deployment automático cada vez que hagas `git push`
- ✅ SSL/TLS gratis
- ✅ CDN global

---

## 🚀 Método 2: Deploy Manual (Rápido)

### Usando Cloudflare CLI

```bash
# Instalar Wrangler (CLI de Cloudflare)
npm install -g wrangler

# Login en Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist

# Tu URL aparecerá en la terminal
```

---

## 🚀 Método 3: Drag & Drop

1. **Ve a:** https://dash.cloudflare.com/pages
2. **Clic:** "Upload assets" / "Create project"
3. **Arrastra la carpeta `dist/`** directamente
4. **Listo** - Deploy instantáneo

---

## 🌍 Usar Dominio Personalizado

Después de hacer deploy:

1. **En Cloudflare Pages:**
   - Selecciona tu proyecto
   - **Settings** → **Custom domain**
   - **Ingresa:** `activos.tudominio.com` (o similar)
   
2. **Apunta tu DNS:**
   - En tu registrador de dominios
   - CNAME `activos` → `gestion-activos-xxx.pages.dev`

3. **Cloudflare configura SSL automáticamente** ✅

---

## ✅ Verificar Deployment

1. **Abre tu URL:** `https://gestion-activos-xyz.pages.dev`
2. **Deberías ver:**
   - Página de login
   - "Gestión de Baterías Fotovoltaicas - OMARSA"
   - Login con: `usuario@omarsa.com` / `Password123!`

3. **Si hay error:**
   ```
   Error: VITE_SUPABASE_URL not found
   ```
   → Verifica que las variables de entorno estén configuradas en Cloudflare

---

## 🔧 Troubleshooting

### Error: "Build failed"
```
Solución:
1. Verifica: npm run build (localmente funciona)
2. En Cloudflare: Settings → Build settings
3. Asegúrate que Node.js version es 18+
```

### Error: "Cannot find module"
```
Solución:
1. rm -rf node_modules
2. npm install
3. npm run build
4. git push (para redeploy)
```

### Página en blanco (white screen)
```
Solución:
1. Abre DevTools (F12)
2. Console: verifica errores
3. Si dice "fetch failed": 
   - Variables de entorno incorrectas
   - Supabase URL/key equivocados
```

### "Cannot GET /"
```
Solución:
- Verifica que dist/index.html existe
- En Cloudflare: Settings → Build output directory = "dist"
```

---

## 📊 Monitoreo Post-Deploy

### Cloudflare Analytics
1. **Dashboard** → Tu proyecto
2. **Analytics** → Ver:
   - Requests
   - Bandwidth
   - Errors
   - Performance

### Logs de Build
1. **Deployments** → Selecciona el deploy
2. **View build log** → Ve qué pasó

### Logs en Tiempo Real
```bash
# Ver logs del último deploy
wrangler pages deployments list

# Ver logs específicos
wrangler pages view logs <deployment-id>
```

---

## 🔄 Actualizaciones Futuras

### Cada vez que hagas cambios:

```bash
# Desarrollo local
npm run dev

# Cuando esté listo:
git add -A
git commit -m "feature: descripción"
git push origin main

# Cloudflare automáticamente:
# 1. Clona el código
# 2. npm run build
# 3. Deploya dist/
# 4. Tu sitio se actualiza en segundos ✅
```

---

## 💰 Costos

- **Cloudflare Pages:** GRATIS (hasta 500 deploys/mes)
- **Dominio personalizado:** $10-15/año (en tu registrador)
- **SSL/TLS:** GRATIS (Cloudflare lo proporciona)
- **CDN Global:** GRATIS

---

## 🎯 Próximos Pasos

1. ✅ Completa el SQL en Supabase (copia `SUPABASE_QUICK_FIX.sql`)
2. ✅ Sube código a GitHub si aún no lo has hecho
3. ✅ Crea cuenta en Cloudflare
4. ✅ Conecta tu repositorio de GitHub
5. ✅ Configura variables de entorno
6. ✅ ¡Listo! Tu app estará en internet

---

## 📞 Soporte

**Si algo no funciona:**

1. **Cloudflare Status:** https://www.cloudflarestatus.com
2. **Documentación:** https://developers.cloudflare.com/pages
3. **Discord Community:** https://discord.gg/cloudflaredev

---

**Tiempo estimado de deploy:** 5-10 minutos  
**Uptime garantizado:** 99.9%  
**Performance:** ⚡ Ultra-rápido con CDN global

🚀 ¡Felicidades, tu app estará online en minutos!
