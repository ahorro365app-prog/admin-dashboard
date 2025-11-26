import { NextRequest, NextResponse } from 'next/server'
import { prisma, checkDatabaseConnection } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  // ⚠️ ENDPOINT DE TEST - SOLO PARA DESARROLLO
  // Bloquear en producción por seguridad
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint no disponible en producción' },
      { status: 404 }
    );
  }

  try {
    console.log('🔍 Prisma Test: Usando cliente Prisma personalizado...')
    
    // Verificar conexión
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      throw new Error('No se pudo conectar a la base de datos')
    }

    // Probar consultas con Prisma
    const usuarios = await prisma.usuario.findMany({
      take: 5,
      select: ['id', 'nombre', 'correo', 'pais', 'suscripcion']
    })

    const totalUsuarios = await prisma.usuario.count()
    const premiumUsuarios = await prisma.usuario.count({
      where: { suscripcion: 'premium' }
    })

    console.log('✅ Prisma funcionando correctamente:', {
      usuariosEncontrados: usuarios.length,
      totalUsuarios,
      premiumUsuarios
    })

    return NextResponse.json({
      success: true,
      message: '✅ Prisma configurado y funcionando correctamente',
      data: {
        connection: 'OK',
        prismaStatus: 'WORKING',
        usuarios: usuarios,
        stats: {
          totalUsuarios,
          premiumUsuarios,
          freeUsuarios: totalUsuarios - premiumUsuarios
        },
        note: 'Prisma está funcionando con Supabase como backend'
      }
    })

  } catch (error: any) {
    console.error('❌ Error:', (error as Error).message)
    
    return NextResponse.json({
      success: false,
      message: 'Error: ' + (error as Error).message,
      error: (error as Error).message
    }, { status: 500 })
  }
}

