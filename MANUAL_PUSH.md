# 📤 Hacer Push Manual a GitHub

## Si el push automático falla, sigue estos pasos:

### Opción 1: Git Bash (Recomendado)

```bash
cd "Desktop/2/DESARROLLO OMARSA/Gestion-Activos"

# Verifica el estado
git status

# Verifica los cambios sin pushear
git log --oneline origin/main..HEAD

# Intenta push con verbosidad
git push -v origin main

# Si sigue fallando, intenta con fuerza de credenciales
git push https://tu-usuario:tu-token@github.com/andresece07/gestionactivos_aa.git main
```

### Opción 2: GitHub Desktop (Visual)

1. Abre **GitHub Desktop**
2. Selecciona el repositorio `Gestion-Activos`
3. Tab: **Current Branch**
4. Botón: **Push origin** (arriba)
5. Espera a que termine ✅

### Opción 3: Cloudflare (Sin GitHub)

Si no puedes hacer push por ahora:

1. Ve a: https://dash.cloudflare.com
2. Selecciona tu proyecto `gestion-activos-aa`
3. **Deployments**
4. **Create deployment** → Redeploy latest commit
5. Espera 2-3 minutos

Esto fuerza un redeploy sin necesidad de push.

---

## 🔑 Si pide autenticación

**Token de GitHub:**
1. Ve a: https://github.com/settings/tokens
2. **Personal access tokens** → **Tokens (classic)**
3. **Generate new token**
4. Permisos: ✅ `repo` (full control of private repositories)
5. Copia el token
6. En terminal:
   ```bash
   git push https://andresece07:tu-token@github.com/andresece07/gestionactivos_aa.git main
   ```

---

## ⚠️ Si aún así falla

Verifica:
1. **¿Tienes internet?** Intenta: `nslookup github.com`
2. **¿Credenciales correctas?** En Git: `git credential approve` y re-ingresa
3. **¿SSH configurado?** Intenta:
   ```bash
   git remote set-url origin git@github.com:andresece07/gestionactivos_aa.git
   git push origin main
   ```

---

## ✅ Después de hacer Push

Verifica:
1. GitHub: https://github.com/andresece07/gestionactivos_aa
2. Cloudflare detectará cambios automáticamente
3. Verifica: https://gestionactivos-aa.pages.dev en 2-3 minutos

---

## 📊 Lo que se pushea

- 16 commits nuevos
- Incluye: cronograma, proveedor, lote, documentación, diagrama SVG
- Build optimizado listo
- Todas las guías de instalación y deployment

**Importante:** El SQL de Supabase aún necesita ejecutarse manualmente en:
https://supabase.com/dashboard/project/radggsmuvtalwwktljfu/sql/new
