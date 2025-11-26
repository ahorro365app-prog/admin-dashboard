# Script de Detección de Código Huérfano

## 📋 Descripción

Este script detecta automáticamente código huérfano (no usado) en el proyecto, incluyendo:
- Archivos que no se importan en ningún lugar
- Funciones exportadas que no se usan
- Imports no utilizados (análisis básico)

## 🚀 Uso

### Ejecutar el script:

```bash
# Desde la raíz del admin-dashboard
npm run lint:orphans
```

O directamente:

```bash
npx tsx scripts/detect-orphaned-code.ts
```

## 📊 Qué detecta

### Archivos huérfanos
- Archivos TypeScript/TSX que no se importan en ningún lugar
- Excluye archivos especiales de Next.js (middleware.ts, page.tsx, route.ts, etc.)
- Excluye archivos de test (.test.ts, .spec.ts)

### Exports no usados
- Funciones exportadas que no se usan
- Solo verifica archivos en `lib/` y `components/` (más propensos a tener exports no usados)

## ⚙️ Configuración

### Archivos ignorados automáticamente:
- `middleware.ts` - Se usa automáticamente por Next.js
- `layout.tsx` - Se usa automáticamente por Next.js
- `page.tsx` - Se usa automáticamente por Next.js
- `route.ts` - Se usa automáticamente por Next.js
- `error.tsx`, `loading.tsx`, `not-found.tsx` - Archivos especiales de Next.js
- Archivos en `scripts/` - Scripts pueden no tener imports
- Archivos `.test.ts`, `.spec.ts` - Archivos de test

## 🔍 Ejemplo de salida

```
🔍 Buscando código huérfano...

📊 RESULTADOS:

📁 ARCHIVOS HUÉRFANOS (no se importan):

   ❌ src/lib/debug.ts
      Razón: Archivo no usado - contiene funciones de test no importadas

💡 RECOMENDACIONES:
   • Revisar cada archivo antes de eliminar
   • Verificar que realmente no se usa
   • Considerar si es código de desarrollo/debug
   • Eliminar solo si está confirmado que no se necesita
```

## ⚠️ Importante

- **Revisar antes de eliminar**: El script puede tener falsos positivos
- **Verificar uso dinámico**: Algunos archivos pueden usarse dinámicamente
- **Considerar código de desarrollo**: Algunos archivos pueden ser útiles para debugging

## 🔧 Integración en CI/CD

Para integrar en GitHub Actions o CI/CD:

```yaml
# .github/workflows/lint.yml
- name: Check for orphaned code
  run: |
    cd admin-dashboard
    npm run lint:orphans
```

El script retorna código de salida 1 si encuentra código huérfano, lo que puede bloquear PRs.

## 📝 Notas

- El script usa análisis estático básico
- Puede no detectar uso dinámico de código
- Siempre revisar manualmente antes de eliminar archivos
- El script está diseñado para ser conservador (mejor detectar de más que de menos)

## 🐛 Solución de problemas

### Error: "tsx no encontrado"
```bash
npm install -D tsx
```

### Error: "Directorio src/ no encontrado"
Asegúrate de ejecutar el script desde la raíz del `admin-dashboard`.

### Falsos positivos
Si el script detecta un archivo como huérfano pero sabes que se usa:
1. Verifica que el import use la ruta correcta
2. Verifica que no sea uso dinámico (require dinámico, etc.)
3. Si es necesario, agrega el archivo a la lista de ignorados en el script

