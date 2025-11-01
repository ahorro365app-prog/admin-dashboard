/**
 * Servicio de Cleanup Automático
 * Ejecutar cada noche (cron job en Vercel)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function runNightlyCleanup() {
  console.log('🧹 Iniciando cleanup automático...');

  try {
    const { data, error } = await supabase.rpc('cleanup_old_predictions');

    if (error) {
      console.error('❌ Error en cleanup:', error);
      return { success: false, error } as const;
    }

    console.log('✅ Cleanup completado:');
    console.log(`   - Filas limpiadas: ${data?.[0]?.deleted_count || 0}`);
    console.log(`   - Agregados creados: ${data?.[0]?.aggregated_count || 0}`);

    return { success: true, data } as const;
  } catch (error) {
    console.error('❌ Error inesperado en cleanup:', error);
    return { success: false, error } as const;
  }
}


