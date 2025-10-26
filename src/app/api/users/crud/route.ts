import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('👥 Fetching users with filters and pagination...')
    
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const subscription = searchParams.get('subscription') || ''
    const country = searchParams.get('country') || ''

    console.log('📋 Filters:', { page, limit, search, subscription, country })

    // Construir filtros
    const where: any = {}
    
    if (search) {
      where.nombre = {
        contains: search,
        mode: 'insensitive'
      }
    }
    
    if (subscription) {
      where.suscripcion = subscription
    }
    
    if (country) {
      where.pais = country
    }

    // Calcular offset
    const offset = (page - 1) * limit

    // Obtener usuarios con filtros
    const users = await prisma.usuario.findMany({
      where,
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

    // Contar total para paginación
    const total = await prisma.usuario.count({ where })

    console.log('✅ Users fetched:', { count: users.length, total, page })

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    })

  } catch (error: any) {
    console.error('💥 Error fetching users:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('✏️ Updating user...')
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID de usuario requerido' },
        { status: 400 }
      )
    }

    console.log('📝 Update data:', updateData)

    // Actualizar usuario
    const updatedUser = await prisma.usuario.update({
      where: { id },
      data: updateData,
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

    console.log('✅ User updated:', updatedUser.id)

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser
    })

  } catch (error: any) {
    console.error('💥 Error updating user:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Deleting user...')
    
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID de usuario requerido' },
        { status: 400 }
      )
    }

    // Eliminar usuario
    await prisma.usuario.delete({
      where: { id }
    })

    console.log('✅ User deleted:', id)

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    })

  } catch (error: any) {
    console.error('💥 Error deleting user:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


