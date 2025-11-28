# 🚀 Guía de Despliegue en Vercel - Admin Dashboard

## 📋 Prerrequisitos

1. **Cuenta de Vercel**: [vercel.com](https://vercel.com)
2. **Repositorio Git**: El proyecto debe estar en GitHub, GitLab o Bitbucket
3. **Variables de entorno**: Tener acceso a todas las credenciales necesarias

## 🔧 Paso 1: Preparar el Proyecto

### 1.1 Verificar cambios locales

```bash
cd admin-dashboard
git status
```

### 1.2 Hacer commit de cambios pendientes (si es necesario)

```bash
git add .
git commit -m "Preparar para despliegue en Vercel"
git push
```

## 🌐 Paso 2: Conectar con Vercel

### Opción A: Desde la Web (Recomendado)

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en **"Add New Project"**
3. Importa tu repositorio desde GitHub/GitLab/Bitbucket
4. Selecciona el proyecto `ai-app`
5. **IMPORTANTE**: En "Root Directory", selecciona `admin-dashboard`
6. Haz clic en **"Deploy"**

### Opción B: Desde CLI

```bash
# Instalar Vercel CLI (si no está instalado)
npm i -g vercel

# Iniciar sesión
vercel login

# Desplegar desde el directorio admin-dashboard
cd admin-dashboard
vercel

# Seguir las instrucciones interactivas
# - ¿Set up and deploy? Y
# - ¿Which scope? (seleccionar tu cuenta)
# - ¿Link to existing project? N (primera vez) o Y (si ya existe)
# - ¿What's your project's name? admin-dashboard
# - ¿In which directory is your code located? ./
```

## 🔐 Paso 3: Configurar Variables de Entorno

Ve a **Settings > Environment Variables** en el dashboard de Vercel y agrega:

### Variables Obligatorias - Supabase

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

### Variables Obligatorias - Autenticación

```env
JWT_SECRET=tu-secret-super-largo-aleatorio-min-32-caracteres
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d
ADMIN_EMAIL=admin@ahorro365.com
ADMIN_PASSWORD_HASH=bcrypt-hash-del-password
```

### Variables Opcionales - Base de Datos

```env
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres
```

### Variables Opcionales - Core API (si aplica)

```env
NEXT_PUBLIC_CORE_API_URL=https://tu-core-api.vercel.app
```

### Variables Opcionales - WhatsApp (si aplica)

```env
WHATSAPP_ACCESS_TOKEN=tu-access-token
WHATSAPP_PHONE_NUMBER_ID=tu-phone-number-id
WHATSAPP_SUPPORT_PHONE_NUMBER_ID=tu-support-phone-number-id
```

### Variables Opcionales - Cron Jobs

```env
CRON_SECRET=tu-cron-secret-key
CLEANUP_API_KEY=tu-cleanup-api-key
```

### Variables Opcionales - Sentry (si aplica)

```env
SENTRY_DSN=tu-sentry-dsn
SENTRY_ORG=tu-sentry-org
SENTRY_PROJECT=tu-sentry-project
```

### Variables Opcionales - Otros

```env
NODE_ENV=production
PORT=3001
```

## 📝 Paso 4: Configurar Build Settings

Vercel debería detectar automáticamente Next.js, pero verifica:

- **Framework Preset**: Next.js
- **Root Directory**: `admin-dashboard`
- **Build Command**: `npm run build` (o `npm run vercel-build`)
- **Output Directory**: `.next` (automático)
- **Install Command**: `npm install`

## 🚀 Paso 5: Desplegar

### Primera vez

1. Haz clic en **"Deploy"** en el dashboard de Vercel
2. Espera a que termine el build
3. Revisa los logs si hay errores

### Actualizaciones futuras

```bash
# Desde el directorio admin-dashboard
vercel --prod
```

O simplemente haz push a la rama principal:

```bash
git push origin main
```

Vercel desplegará automáticamente si tienes **Auto Deploy** habilitado.

## ✅ Paso 6: Verificar el Despliegue

1. **URL de producción**: Vercel te dará una URL como `https://admin-dashboard.vercel.app`
2. **Verificar funcionalidades**:
   - Login: `/login`
   - Dashboard: `/dashboard`
   - WhatsApp Soporte: `/whatsapp-soporte`
   - WhatsApp Status: `/whatsapp-status`

## 🔍 Troubleshooting

### Error: "Module not found"

- Verifica que el **Root Directory** esté configurado como `admin-dashboard`
- Asegúrate de que `package.json` esté en el directorio correcto

### Error: "Environment variable not found"

- Verifica que todas las variables estén configuradas en Vercel
- Asegúrate de que las variables estén disponibles para **Production**, **Preview** y **Development**

### Error: "Build failed"

- Revisa los logs de build en Vercel
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que no haya errores de TypeScript o ESLint que bloqueen el build

### Error: "CSP (Content Security Policy) blocking requests"

- Verifica `next.config.js` para ajustar las políticas CSP
- Asegúrate de que `NEXT_PUBLIC_CORE_API_URL` esté configurada correctamente

## 📊 Monitoreo

### Logs en Vercel

1. Ve a tu proyecto en Vercel
2. Haz clic en **"Deployments"**
3. Selecciona un deployment
4. Haz clic en **"View Function Logs"** para ver logs en tiempo real

### Analytics

Vercel proporciona analytics básicos. Para más detalles, considera:
- Vercel Analytics (integrado)
- Sentry (si está configurado)
- Logs personalizados

## 🔄 Actualizaciones Continuas

### Auto Deploy

Por defecto, Vercel despliega automáticamente cuando haces push a:
- `main` o `master` → Production
- Otras ramas → Preview

### Deploy Manual

```bash
vercel --prod
```

## 📚 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Next.js en Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Variables de Entorno en Vercel](https://vercel.com/docs/environment-variables)

## 🎉 ¡Listo!

Tu admin dashboard debería estar desplegado y funcionando en Vercel.

**URL de producción**: `https://tu-proyecto.vercel.app`

