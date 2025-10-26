import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('👥 Fetching usuarios using Prisma...')
  
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('📋 Params:', { limit, offset })

    // Usar Prisma para obtener usuarios
    const usuarios = await prisma.usuario.findMany({
      take: limit,
      skip: offset,
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        pais: true,
        moneda: true,
        presupuesto_diario: true,
        suscripcion: true
      }
    })

    const total = await prisma.usuario.count()

    console.log('✅ Usuarios fetched with Prisma:', usuarios.length)
    
    return NextResponse.json({
      success: true,
      data: usuarios,
      pagination: {
        limit,
        offset,
        total
      }
    })

  } catch (error: any) {
    console.error('💥 Error fetching usuarios:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Método no permitido' },
    { status: 405 }
  )
}

