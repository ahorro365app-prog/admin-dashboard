/**
 * Helper centralizado para obtener cliente de Supabase Admin
 * Crea el cliente de forma lazy para evitar errores durante el build
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Obtiene el cliente de Supabase Admin de forma lazy
 * Solo se crea cuando se necesita, evitando errores durante el build
 * 
 * @throws Error si las variables de entorno no están configuradas
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Supabase configuration is missing. ' +
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

