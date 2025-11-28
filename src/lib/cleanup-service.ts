/**
 * Servicio de Cleanup Automático
 * Ejecutar cada noche (cron job en Vercel)
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Obtiene el cliente de Supabase de forma lazy
 * Solo se crea cuando se necesita, evitando errores durante el build
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration is missing. NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function runNightlyCleanup() {
  console.log('🧹 Iniciando cleanup automático...');

  try {
    // Verificar que las variables de entorno estén disponibles
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables de entorno de Supabase no configuradas');
      return { 
        success: false, 
        error: 'Supabase configuration is missing. NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.' 
      } as const;
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('cleanup_old_predictions');

    if (error) {
      console.error('❌ Error en cleanup:', error);
      return { success: false, error } as const;
    }

    console.log('✅ Cleanup completado:');
    console.log(`   - Filas limpiadas: ${data?.[0]?.deleted_count || 0}`);
    console.log(`   - Agregados creados: ${data?.[0]?.aggregated_count || 0}`);

    return { success: true, data } as const;
  } catch (error: any) {
    console.error('❌ Error inesperado en cleanup:', error);
    return { 
      success: false, 
      error: error?.message || 'Error desconocido en cleanup' 
    } as const;
  }
}


