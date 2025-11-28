# 📋 Instrucciones: Cómo Ver las Transacciones de WhatsApp

## 🎯 Objetivo

Poder visualizar las transacciones de WhatsApp en el panel administrativo.

---

## ✅ Opción 1: Usar Backend de Producción (Más Fácil)

Si el backend ya está desplegado en Vercel, puedes usarlo directamente:

### Pasos:

1. **Asegúrate de que NO existe `.env.local`** en `admin-dashboard/`
   - Si existe, elimínalo o renómbralo a `.env.local.backup`

2. **Reinicia el servidor del admin-dashboard:**
   ```bash
   # Detén el servidor actual (Ctrl+C en la terminal)
   # Luego reinicia:
   cd admin-dashboard
   npm run dev
   ```

3. **Abre el navegador:**
   - Ve a: `http://localhost:3001/whatsapp-status`
   - Inicia sesión si es necesario
   - Haz clic en el tab "Transacciones"

4. **Verifica:**
   - Debe cargar las transacciones desde `https://ai-app-core-api.vercel.app`
   - Si hay transacciones, aparecerán en la tabla

---

## ✅ Opción 2: Usar Backend Local

Si prefieres usar el backend local (útil para desarrollo):

### Pasos:

1. **Inicia el backend (core-api):**
   ```bash
   cd packages/core-api
   npm run dev
   ```
   Debe estar corriendo en `http://localhost:3002`

2. **Crea archivo `.env.local` en `admin-dashboard/`:**
   ```env
   NEXT_PUBLIC_CORE_API_URL=http://localhost:3002
   ```

3. **Reinicia el admin-dashboard:**
   ```bash
   # Detén el servidor actual (Ctrl+C)
   cd admin-dashboard
   npm run dev
   ```

4. **Abre el navegador:**
   - Ve a: `http://localhost:3001/whatsapp-status`
   - Inicia sesión si es necesario
   - Haz clic en el tab "Transacciones"

---

## 🔍 Verificación

### Verificar que el Backend Está Corriendo

**Producción:**
```bash
# Abre en el navegador:
https://ai-app-core-api.vercel.app/api/whatsapp/transactions?page=1&limit=1
```
Debe devolver un JSON con `{"success": true, ...}`

**Local:**
```bash
# Abre en el navegador:
http://localhost:3002/api/whatsapp/transactions?page=1&limit=1
```
Debe devolver un JSON con `{"success": true, ...}`

### Verificar en la Consola del Navegador

1. Abre DevTools (F12)
2. Ve a la pestaña "Console"
3. Busca mensajes como:
   - `🔄 Llamando a: [URL]` - Indica que está intentando conectar
   - `✅ Respuesta recibida:` - Indica éxito
   - `❌ Error obteniendo transacciones:` - Indica error

### Verificar en Network Tab

1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Recarga la página
4. Busca la llamada a `/api/whatsapp/transactions`
5. Verifica:
   - **Status:** Debe ser 200 (verde)
   - **URL:** Debe ser correcta
   - **Response:** Debe tener JSON válido

---

## 🐛 Solución de Problemas

### Error: "Failed to fetch"

**Causa:** No se puede conectar al backend.

**Soluciones:**
1. Verifica que el backend esté corriendo (si usas local)
2. Verifica que la URL en `.env.local` sea correcta
3. Verifica que no haya problemas de CORS
4. Prueba con la URL de producción primero

### Error: "404 Not Found"

**Causa:** El endpoint no existe o la URL es incorrecta.

**Soluciones:**
1. Verifica que el endpoint esté desplegado (producción)
2. Verifica que el backend local tenga el endpoint
3. Verifica la URL en `.env.local`

### Error: "CORS error"

**Causa:** El backend no permite requests desde el origen del frontend.

**Soluciones:**
1. Verifica la configuración de CORS en `packages/core-api`
2. Asegúrate de que permita requests desde `http://localhost:3001`

---

## 📝 Notas Importantes

- **El archivo `.env.local` tiene prioridad** sobre la URL por defecto
- **Si cambias `.env.local`, debes reiniciar el servidor** de Next.js
- **La URL por defecto es:** `https://ai-app-core-api.vercel.app` (producción)
- **Para desarrollo local:** Usa `http://localhost:3002`

---

## ✅ Checklist Rápido

- [ ] Backend corriendo (local o producción)
- [ ] `.env.local` configurado correctamente (si usas local)
- [ ] Admin-dashboard reiniciado después de cambios
- [ ] Navegador abierto en `http://localhost:3001/whatsapp-status`
- [ ] Tab "Transacciones" seleccionado
- [ ] Sin errores en la consola del navegador
- [ ] Llamada exitosa en Network tab

---

## 🚀 Si Todo Falla

1. **Verifica los logs del backend:**
   - Si es local: Revisa la terminal donde corre `packages/core-api`
   - Si es producción: Revisa los logs de Vercel

2. **Verifica que haya transacciones en la base de datos:**
   - El endpoint puede funcionar pero no haber datos
   - Verifica en Supabase que existan registros en `predicciones_groq` con `mensaje_origen = 'whatsapp'`

3. **Prueba el endpoint directamente:**
   - Abre la URL del endpoint en el navegador
   - Debe devolver JSON válido

---

## 💡 Recomendación

**Para empezar rápido:** Usa la Opción 1 (producción). Es más fácil y no requiere levantar el backend local.

**Para desarrollo:** Usa la Opción 2 (local) para tener control total y poder hacer cambios.

