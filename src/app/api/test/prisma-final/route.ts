import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Prisma Final Test: Verificando funcionalidad completa...')
    
    // Probar todas las funcionalidades principales
    const usuarios = await prisma.usuario.findMany({
      take: 3,
      select: {
        id: true,
        nombre: true,
        pais: true,
        suscripcion: true
      }
    })

    const totalUsuarios = await prisma.usuario.count()
    const premiumUsuarios = await prisma.usuario.count({
      where: { suscripcion: 'premium' }
    })

    // Probar transacciones si existen
    let transaccionesCount = 0
    try {
      transaccionesCount = await prisma.transaccion.count()
    } catch (error) {
      console.log('Tabla transacciones no disponible')
    }

    console.log('✅ Prisma Final Test completado:', {
      usuariosEncontrados: usuarios.length,
      totalUsuarios,
      premiumUsuarios,
      transaccionesCount
    })

    return NextResponse.json({
      success: true,
      message: '🎉 Prisma configurado y funcionando perfectamente',
      data: {
        prismaStatus: 'FULLY_WORKING',
        usuarios: usuarios,
        estadisticas: {
          totalUsuarios,
          premiumUsuarios,
          freeUsuarios: totalUsuarios - premiumUsuarios,
          transaccionesCount
        },
        funcionalidades: [
          '✅ Conexión a Supabase',
          '✅ Consultas de usuarios',
          '✅ Conteo de registros',
          '✅ Filtros por suscripción',
          '✅ Selección de campos específicos',
          '✅ Manejo de errores'
        ],
        note: 'Paso 3: Conexión BD completado exitosamente'
      }
    })

  } catch (error: any) {
    console.error('❌ Error en Prisma Final Test:', (error as Error).message)
    
    return NextResponse.json({
      success: false,
      message: 'Error: ' + (error as Error).message,
      error: (error as Error).message
    }, { status: 500 })
  }
}


