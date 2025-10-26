import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('👤 Fetching user details for:', params.id)
    
    // Obtener usuario por ID
    const user = await prisma.usuario.findUnique({
      where: { id: params.id },
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

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ User details fetched:', (user as any).nombre)

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error: any) {
    console.error('💥 Error fetching user details:', error.message)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
