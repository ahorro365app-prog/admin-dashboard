/**
 * Script para migrar contraseñas de texto plano a bcrypt
 * 
 * Uso:
 * 1. Asegúrate de tener las variables de entorno configuradas
 * 2. Ejecuta: npx tsx scripts/migrate-passwords-to-bcrypt.ts
 * 
 * O desde el directorio admin-dashboard:
 * npx tsx scripts/migrate-passwords-to-bcrypt.ts
 */

import { createClient } from '@supabase/supabase-js';
import { hashPassword, isBcryptHash } from '../src/lib/bcrypt-helpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migratePasswords() {
  console.log('🔄 Iniciando migración de contraseñas a bcrypt...\n');

  try {
    // Obtener todos los usuarios admin
    const { data: admins, error } = await supabase
      .from('admin_users')
      .select('id, email, password_hash');

    if (error) {
      console.error('❌ Error obteniendo usuarios admin:', error);
      process.exit(1);
    }

    if (!admins || admins.length === 0) {
      console.log('⚠️ No se encontraron usuarios admin');
      return;
    }

    console.log(`📋 Encontrados ${admins.length} usuario(s) admin\n`);

    let migrated = 0;
    let alreadyHashed = 0;
    let errors = 0;

    for (const admin of admins) {
      console.log(`🔍 Procesando: ${admin.email}`);

      // Verificar si ya está hasheado
      if (isBcryptHash(admin.password_hash)) {
        console.log(`  ✅ Ya está hasheado con bcrypt, saltando...\n`);
        alreadyHashed++;
        continue;
      }

      // Hashear la contraseña
      try {
        console.log(`  🔐 Hasheando contraseña...`);
        const hashedPassword = await hashPassword(admin.password_hash);

        // Actualizar en la BD
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({ password_hash: hashedPassword })
          .eq('id', admin.id);

        if (updateError) {
          console.error(`  ❌ Error actualizando contraseña:`, updateError);
          errors++;
        } else {
          console.log(`  ✅ Contraseña migrada exitosamente\n`);
          migrated++;
        }
      } catch (error) {
        console.error(`  ❌ Error hasheando contraseña:`, error);
        errors++;
      }
    }

    console.log('\n📊 Resumen de migración:');
    console.log(`  ✅ Migradas: ${migrated}`);
    console.log(`  ⏭️  Ya hasheadas: ${alreadyHashed}`);
    console.log(`  ❌ Errores: ${errors}`);
    console.log(`  📝 Total: ${admins.length}\n`);

    if (errors === 0) {
      console.log('🎉 Migración completada exitosamente!');
    } else {
      console.log('⚠️ Migración completada con algunos errores');
    }

  } catch (error) {
    console.error('💥 Error fatal durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migratePasswords()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error ejecutando script:', error);
    process.exit(1);
  });

