# Plan de Implementación: Actividades Separadas en Dashboard

## Objetivo
Dividir el cuadro de "Actividades Recientes" en dos cuadros separados:
1. **Transacciones Recientes** (últimas 10)
2. **Registros Recientes** (últimos 10)

## Estrategia: Migración Incremental por Fases

### Fase 1: Crear Endpoints Separados ✅
**Objetivo:** Crear nuevos endpoints sin modificar el existente
- Crear `/api/analytics/recent-transactions`
- Crear `/api/analytics/recent-registrations`
- Testing: Verificar que ambos endpoints funcionan correctamente
- **No se modifica:** `/api/analytics/activities` (sigue funcionando)

### Fase 2: Crear Componentes Nuevos
**Objetivo:** Crear componentes nuevos sin modificar el existente
- Crear `RecentTransactionsTable.tsx`
- Crear `RecentRegistrationsTable.tsx`
- Testing: Verificar que los componentes renderizan correctamente con datos de prueba

### Fase 3: Integración Parcial
**Objetivo:** Agregar nuevos componentes al dashboard manteniendo el viejo
- Agregar grid con ambos componentes nuevos
- Mantener `ActivitiesTable` como fallback
- Testing: Verificar que ambos sistemas funcionan en paralelo

### Fase 4: Reemplazo Completo
**Objetivo:** Reemplazar el componente viejo por los nuevos
- Remover `ActivitiesTable` del dashboard
- Actualizar llamadas a endpoints
- Testing: Verificar que todo funciona correctamente

### Fase 5: Limpieza y Testing Final
**Objetivo:** Limpiar código obsoleto y hacer testing exhaustivo
- Opcional: Marcar `/api/analytics/activities` como deprecated
- Testing final completo
- Documentación

## Criterios de Éxito
- ✅ Ambos cuadros muestran datos correctamente
- ✅ Layout responsive (2 columnas en desktop, 1 en móvil)
- ✅ No se rompe funcionalidad existente
- ✅ Performance similar o mejor
- ✅ Código limpio y mantenible

