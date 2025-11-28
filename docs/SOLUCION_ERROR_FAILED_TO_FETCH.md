# 🔧 Solución: Error "Failed to fetch" al Cargar Transacciones

## 📋 Problema

Al intentar cargar las transacciones de WhatsApp, aparece el error:
```
Error al cargar transacciones
Failed to fetch
```

## 🔍 Causas Posibles

1. **Backend no está corriendo** (desarrollo local)
2. **URL del API incorrecta** en la configuración
3. **Problema de CORS** (Cross-Origin Resource Sharing)
4. **Endpoint no existe o no está accesible**

---

## ✅ Soluciones

### Opción 1: Usar Backend de Producción (Recomendado para Testing)

Si quieres ver las transacciones sin levantar el backend local:

1. **Verificar que el archivo `.env.local` NO existe** o tiene la URL de producción:
   ```env
   NEXT_PUBLIC_CORE_API_URL=https://ai-app-core-api.vercel.app
   ```

2. **Reiniciar el servidor del admin-dashboard:**
   ```bash
   # Detener el servidor (Ctrl+C)
   # Luego reiniciar:
   cd admin-dashboard
   npm run dev
   ```

3. **Verificar que el endpoint esté accesible:**
   - Abre: https://ai-app-core-api.vercel.app/api/whatsapp/transactions?page=1&limit=1
   - Debe devolver un JSON con `{"success": true, ...}`

---

### Opción 2: Usar Backend Local

Si prefieres usar el backend local:

1. **Crear archivo `.env.local` en `admin-dashboard/`:**
   ```env
   NEXT_PUBLIC_CORE_API_URL=http://localhost:3002
   ```

2. **Iniciar el backend (core-api):**
   ```bash
   cd packages/core-api
   npm run dev
   ```
   Debe estar corriendo en `http://localhost:3002`

3. **Verificar que el endpoint local esté accesible:**
   - Abre: http://localhost:3002/api/whatsapp/transactions?page=1&limit=1
   - Debe devolver un JSON

4. **Reiniciar el admin-dashboard:**
   ```bash
   cd admin-dashboard
   npm run dev
   ```

---

### Opción 3: Verificar CORS (Si usas backend local)

Si el backend local está corriendo pero sigue fallando, puede ser un problema de CORS.

**Verificar en `packages/core-api/next.config.js` o `packages/core-api/src/middleware.ts`** que permita requests desde `http://localhost:3001`.

---

## 🧪 Verificación Rápida

### 1. Verificar URL Configurada

Abre la consola del navegador (F12) y ejecuta:
```javascript
console.log(process.env.NEXT_PUBLIC_CORE_API_URL || 'https://ai-app-core-api.vercel.app')
```

### 2. Verificar Endpoint Accesible

**Producción:**
```bash
curl https://ai-app-core-api.vercel.app/api/whatsapp/transactions?page=1&limit=1
```

**Local:**
```bash
curl http://localhost:3002/api/whatsapp/transactions?page=1&limit=1
```

### 3. Verificar en Network Tab

1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Recarga la página
4. Busca la llamada a `/api/whatsapp/transactions`
5. Verifica:
   - **Status:** Debe ser 200 (no 404, 500, o CORS error)
   - **URL:** Debe ser la correcta
   - **Response:** Debe tener JSON válido

---

## 🚀 Pasos Recomendados

1. **Usar producción primero** (más fácil):
   - Asegúrate de que NO existe `.env.local` o tiene la URL de producción
   - Reinicia el servidor del admin-dashboard
   - Prueba de nuevo

2. **Si necesitas desarrollo local:**
   - Crea `.env.local` con `NEXT_PUBLIC_CORE_API_URL=http://localhost:3002`
   - Inicia el backend en `packages/core-api`
   - Reinicia el admin-dashboard
   - Verifica que ambos servidores estén corriendo

---

## 📝 Notas

- El archivo `.env.local` tiene prioridad sobre la URL por defecto
- Si cambias `.env.local`, **debes reiniciar el servidor** de Next.js
- La URL por defecto es `https://ai-app-core-api.vercel.app` (producción)
- Para desarrollo local, usa `http://localhost:3002`

---

## ✅ Verificación Final

Después de aplicar la solución:

1. Recarga la página del admin-dashboard
2. Ve a "WhatsApp Status" → Tab "Transacciones"
3. Debe cargar las transacciones sin error
4. Si hay transacciones, deben aparecer en la tabla


