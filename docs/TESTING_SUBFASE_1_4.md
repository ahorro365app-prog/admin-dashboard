# Testing Sub-Fase 1.4: Frontend - Integración con Backend

## 🎯 Objetivo
Verificar que el componente `TransactionsPanel` se integra correctamente con el endpoint del backend y muestra los datos recibidos.

---

## 📋 Checklist de Testing

### 1. **Componente Carga Correctamente**

**Acción:**
- Navegar a `http://localhost:3001/whatsapp-status`
- Cambiar al tab "Transacciones"

**Expectativa:**
- ✅ El componente `TransactionsPanel` se muestra
- ✅ Muestra estado de carga inicial (spinner)
- ✅ No hay errores en la consola del navegador

---

### 2. **Llamada al Endpoint**

**Acción:**
- Abrir DevTools → Network tab
- Recargar la página o cambiar al tab "Transacciones"

**Expectativa:**
- ✅ Se hace una llamada GET a `${CORE_API_URL}/api/whatsapp/transactions?page=1&limit=20`
- ✅ La URL es correcta (verificar en Network tab)
- ✅ El request tiene headers correctos (`Content-Type: application/json`)
- ✅ El request tiene `cache: no-store`

**Verificar URL:**
- Desarrollo: `http://localhost:3002/api/whatsapp/transactions?page=1&limit=20`
- Producción: `https://ai-app-core-api.vercel.app/api/whatsapp/transactions?page=1&limit=20`

---

### 3. **Estado de Carga**

**Acción:**
- Observar el componente mientras carga

**Expectativa:**
- ✅ Muestra spinner de carga
- ✅ Muestra texto "Cargando transacciones..."
- ✅ El botón "Actualizar" está deshabilitado durante la carga

---

### 4. **Respuesta Exitosa con Datos**

**Acción:**
- Esperar a que la respuesta llegue (si hay datos en la BD)

**Expectativa:**
- ✅ El estado de carga desaparece
- ✅ Se muestran los datos recibidos
- ✅ Se muestra el total de transacciones en el header
- ✅ Se muestran hasta 5 transacciones en preview
- ✅ Cada transacción muestra:
  - Nombre y teléfono del usuario
  - Transcripción (primeros 100 caracteres)
  - Número de transacciones relacionadas
  - Estado (Confirmado/Rechazado/Pendiente)
  - Fecha
- ✅ No hay errores en la consola

---

### 5. **Respuesta Exitosa sin Datos**

**Acción:**
- Si no hay transacciones en la BD, verificar el estado vacío

**Expectativa:**
- ✅ El estado de carga desaparece
- ✅ Se muestra mensaje "No hay transacciones"
- ✅ Se muestra descripción: "Aún no se han procesado transacciones desde WhatsApp"
- ✅ No hay errores en la consola

---

### 6. **Manejo de Errores**

**Acción:**
- Simular un error (desconectar internet, endpoint incorrecto, etc.)

**Expectativa:**
- ✅ Se muestra mensaje de error en un banner rojo
- ✅ El mensaje de error es descriptivo
- ✅ Hay botón "Intentar nuevamente"
- ✅ Al hacer clic en "Intentar nuevamente", se vuelve a intentar la llamada
- ✅ No hay errores no manejados en la consola

---

### 7. **Botón Actualizar**

**Acción:**
- Hacer clic en el botón "🔄 Actualizar"

**Expectativa:**
- ✅ Se vuelve a hacer la llamada al endpoint
- ✅ Muestra estado de carga mientras actualiza
- ✅ Los datos se refrescan
- ✅ El botón se deshabilita durante la carga

---

### 8. **Información de Paginación**

**Acción:**
- Verificar que se muestra información de paginación

**Expectativa:**
- ✅ Si hay datos, muestra "Mostrando X de Y transacciones"
- ✅ Si hay múltiples páginas, muestra "Página X de Y"
- ✅ La información es correcta según la respuesta del backend

---

### 9. **Preview de Datos**

**Acción:**
- Verificar que se muestran los primeros 5 items

**Expectativa:**
- ✅ Se muestran máximo 5 transacciones
- ✅ Cada transacción tiene:
  - Borde y hover effect
  - Información del usuario
  - Transcripción truncada (100 caracteres)
  - Badge de estado con color correcto
  - Fecha formateada
- ✅ Si hay más de 5, muestra mensaje indicando que hay más

---

### 10. **Debug Info (Solo Desarrollo)**

**Acción:**
- En modo desarrollo, expandir "🔍 Debug Info"

**Expectativa:**
- ✅ Se muestra información de debug
- ✅ Muestra JSON con los primeros 2 items y paginación
- ✅ Solo visible en `NODE_ENV === 'development'`
- ✅ No visible en producción

---

### 11. **Logs en Consola**

**Acción:**
- Abrir DevTools → Console
- Recargar la página

**Expectativa:**
- ✅ Se muestra log: `🔄 Llamando a: [URL]`
- ✅ Se muestra log: `✅ Respuesta recibida: { success, count, pagination }`
- ✅ Si hay error, se muestra: `❌ Error obteniendo transacciones: [error]`
- ✅ No hay errores no manejados

---

### 12. **URL del Endpoint**

**Acción:**
- Verificar que la URL del endpoint es correcta

**Expectativa:**
- ✅ Usa `NEXT_PUBLIC_CORE_API_URL` si está configurada
- ✅ Si no está configurada, usa `https://ai-app-core-api.vercel.app` como fallback
- ✅ La URL no tiene trailing slash
- ✅ Los query params están correctamente formateados

---

## ✅ Criterios de Éxito

- ✅ El componente carga sin errores
- ✅ Se hace la llamada al endpoint correcto
- ✅ Los estados de carga, error y éxito se manejan correctamente
- ✅ Los datos se muestran correctamente (si existen)
- ✅ El estado vacío se muestra correctamente (si no hay datos)
- ✅ Los errores se manejan gracefully
- ✅ El botón actualizar funciona
- ✅ No hay errores en la consola
- ✅ Los logs de debug son útiles

---

## 🚀 Siguiente Paso

Si todos los tests pasan, proceder con **Sub-Fase 1.5: Frontend - Implementar Tabla de Transacciones**.

---

## 📝 Notas

- Esta sub-fase solo muestra un preview básico de los datos
- La tabla completa con todas las columnas se implementará en la Sub-Fase 1.5
- Los filtros y búsqueda se implementarán en la Sub-Fase 1.6
- La paginación completa se implementará en la Sub-Fase 1.7


