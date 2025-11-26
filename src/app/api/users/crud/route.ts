import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { requireCSRF } from '@/lib/csrf'
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { updateUserSchema, deleteUserQuerySchema, getUsersQuerySchema, validateWithZod } from '@/lib/validations'
import { handleError, handleValidationError } from '@/lib/errorHandler'
import { logUserUpdate, logUserDelete } from '@/lib/audit-logger'
import { requireAuth, requireElevatedAccess } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/users/crud:
 *   get:
 *     summary: Obtiene lista de usuarios con filtros y paginación
 *     description: Retorna una lista paginada de usuarios con opciones de filtrado por nombre, suscripción, país y verificación de WhatsApp
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Límite de resultados por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre o email
 *       - in: query
 *         name: subscription
 *         schema:
 *           type: string
 *           enum: [free, pro]
 *         description: Filtro por tipo de suscripción
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filtro por país
 *       - in: query
 *         name: whatsappVerified
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtro por verificación de WhatsApp
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit excedido (100 requests / 15 minutos)
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 100
 *           Retry-After:
 *             schema:
 *               type: integer
 *               example: 900
 * 
 * @route GET /api/users/crud
 * @description Obtiene lista de usuarios con filtros y paginación
 * @security Requiere autenticación de administrador (cookie)
 * @rateLimit 100 requests / 15 minutos
 */
export async function GET(request: NextRequest) {
  try {
    logger.debug('👥 Fetching users with filters and pagination...')
    
    // 1. Rate limiting
    const identifier = getClientIdentifier(request as any);
    const rateLimitResult = await checkRateLimit(adminApiRateLimit, identifier);
    if (!rateLimitResult?.success) {
      logger.warn(`⛔ Rate limit exceeded for ${identifier}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Demasiadas solicitudes. Por favor, intenta más tarde.',
          retryAfter: rateLimitResult ? new Date(rateLimitResult.reset).toISOString() : 'unknown',
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString() : '900',
            'X-RateLimit-Limit': rateLimitResult?.limit.toString() || '200',
            'X-RateLimit-Remaining': rateLimitResult?.remaining.toString() || '0',
            'X-RateLimit-Reset': rateLimitResult?.reset.toString() || Date.now().toString(),
          },
        }
      );
    }

    // 2. Validar query params
    const searchParams = request.nextUrl.searchParams;
    const getOptionalParam = (key: string) => {
      const value = searchParams.get(key);
      if (!value || value.trim() === '') {
        return undefined;
      }
      return value;
    };

    const params = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || '',
      subscription: getOptionalParam('subscription'),
      country: getOptionalParam('country'),
      whatsappVerified: getOptionalParam('whatsappVerified'),
      expirationStatus: getOptionalParam('expirationStatus'),
    };
    
    const validation = validateWithZod(getUsersQuerySchema, params);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }

    const { page, limit, search, subscription, country, whatsappVerified, expirationStatus } = validation.data;

    logger.debug('📋 Filters:', { page, limit, search, subscription, country, whatsappVerified, expirationStatus })

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
    
    if (whatsappVerified === 'true') {
      where.whatsapp_verificado = true
    } else if (whatsappVerified === 'false') {
      where.whatsapp_verificado = false
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (expirationStatus) {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const sevenDaysAhead = new Date(today)
      sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7)

      const sevenDaysAheadExclusive = new Date(sevenDaysAhead)
      sevenDaysAheadExclusive.setDate(sevenDaysAheadExclusive.getDate() + 1)

      switch (expirationStatus) {
        case 'expired':
          where.fecha_expiracion_suscripcion = { lt: today.toISOString() }
          break
        case 'expires_today':
          where.fecha_expiracion_suscripcion = {
            gte: today.toISOString(),
            lt: tomorrow.toISOString()
          }
          break
        case 'expires_7':
          where.fecha_expiracion_suscripcion = {
            gte: today.toISOString(),
            lt: sevenDaysAheadExclusive.toISOString()
          }
          break
        case 'active':
          where.fecha_expiracion_suscripcion = {
            gte: sevenDaysAheadExclusive.toISOString()
          }
          break
        case 'no_expiration':
          where.fecha_expiracion_suscripcion = null
          break
        default:
          break
      }
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
        suscripcion: true,
        whatsapp_verificado: true,
        fecha_expiracion_suscripcion: true
      }
    })

    // Contar total para paginación
    const total = await prisma.usuario.count({ where })

    logger.success('✅ Users fetched:', { count: users.length, total, page })

    const usersWithExpiration = users.map((user) => {
      const expiration = user.fecha_expiracion_suscripcion
        ? new Date(user.fecha_expiracion_suscripcion)
        : null

      let daysToExpire: number | null = null

      if (expiration) {
        const expirationAtMidnight = new Date(expiration)
        expirationAtMidnight.setHours(0, 0, 0, 0)

        const diffMs = expirationAtMidnight.getTime() - today.getTime()
        daysToExpire = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      }

      return {
        ...user,
        daysToExpire,
      }
    })

    return NextResponse.json({
      success: true,
      data: usersWithExpiration,
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
    logger.error('💥 Error fetching users:', error)
    return handleError(error, 'Error al obtener usuarios');
  }
}

/**
 * @swagger
 * /api/users/crud:
 *   put:
 *     summary: Actualiza un usuario
 *     description: Actualiza la información de un usuario existente. Requiere autenticación y token CSRF.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - csrfToken
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID del usuario a actualizar
 *               csrfToken:
 *                 type: string
 *                 description: Token CSRF obtenido de /api/csrf-token
 *               nombre:
 *                 type: string
 *                 description: Nombre del usuario
 *               correo:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico
 *               telefono:
 *                 type: string
 *                 description: Teléfono del usuario
 *               pais:
 *                 type: string
 *                 description: País del usuario
 *               moneda:
 *                 type: string
 *                 description: Moneda preferida
 *               presupuesto_diario:
 *                 type: number
 *                 description: Presupuesto diario
 *               suscripcion:
 *                 type: string
 *                 enum: [free, pro]
 *                 description: Tipo de suscripción
 *               whatsapp_verificado:
 *                 type: boolean
 *                 description: Estado de verificación de WhatsApp
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Usuario actualizado exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit excedido (100 requests / 15 minutos)
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 100
 *           Retry-After:
 *             schema:
 *               type: integer
 *               example: 900
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * @route PUT /api/users/crud
 * @description Actualiza un usuario existente
 * @security Requiere autenticación de administrador (cookie) y CSRF token
 * @rateLimit 100 requests / 15 minutos
 */
export async function PUT(request: NextRequest) {
  try {
    logger.debug('✏️ Updating user...')
    
    // 1. Verificar autenticación
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) {
      return auth; // Error de autenticación
    }
    const { adminId } = auth;

    const elevated = requireElevatedAccess(request, adminId);
    if (elevated instanceof NextResponse) {
      return elevated;
    }
    
    // 2. Rate limiting
    const identifier = getClientIdentifier(request as any);
    const rateLimitResult = await checkRateLimit(adminApiRateLimit, identifier);
    if (!rateLimitResult?.success) {
      logger.warn(`⛔ Rate limit exceeded for ${identifier}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Demasiadas solicitudes. Por favor, intenta más tarde.',
          retryAfter: rateLimitResult ? new Date(rateLimitResult.reset).toISOString() : 'unknown',
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString() : '900',
            'X-RateLimit-Limit': rateLimitResult?.limit.toString() || '200',
            'X-RateLimit-Remaining': rateLimitResult?.remaining.toString() || '0',
            'X-RateLimit-Reset': rateLimitResult?.reset.toString() || Date.now().toString(),
          },
        }
      );
    }

    // 3. Leer body
    const body = await request.json();

    // 4. CSRF protection
    const csrfError = await requireCSRF(request, body.csrfToken);
    if (csrfError) {
      return csrfError;
    }

    // 5. Validación Zod
    const validation = validateWithZod(updateUserSchema, body);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }

    const { id, csrfToken, ...updateData } = validation.data;

    const payload: Record<string, any> = { ...updateData }

    if (Object.prototype.hasOwnProperty.call(payload, 'fecha_expiracion_suscripcion')) {
      if (payload.fecha_expiracion_suscripcion === '' || payload.fecha_expiracion_suscripcion === undefined) {
        payload.fecha_expiracion_suscripcion = null
      }
    }

    if (payload.suscripcion === 'caducado' && !Object.prototype.hasOwnProperty.call(payload, 'fecha_expiracion_suscripcion')) {
      payload.fecha_expiracion_suscripcion = null
    }

    logger.debug('📝 Update data:', payload)

    // Actualizar usuario
    const updatedUser = await prisma.usuario.update({
      where: { id },
      data: payload,
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        pais: true,
        moneda: true,
        presupuesto_diario: true,
        suscripcion: true,
        whatsapp_verificado: true,
        fecha_expiracion_suscripcion: true
      }
    })

    logger.success('✅ User updated:', updatedUser.id)

    // Registrar en audit log
    await logUserUpdate(request, id, payload);

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser
    })

  } catch (error: any) {
    logger.error('💥 Error updating user:', error)
    return handleError(error, 'Error al actualizar usuario');
  }
}

/**
 * @swagger
 * /api/users/crud:
 *   delete:
 *     summary: Elimina un usuario
 *     description: Elimina un usuario del sistema. Requiere autenticación y token CSRF. La acción se registra en audit log.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario a eliminar
 *       - in: query
 *         name: csrfToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Token CSRF obtenido de /api/csrf-token
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Usuario eliminado exitosamente
 *       400:
 *         description: Error de validación o usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit excedido (100 requests / 15 minutos)
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 100
 *           Retry-After:
 *             schema:
 *               type: integer
 *               example: 900
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * @route DELETE /api/users/crud
 * @description Elimina un usuario del sistema
 * @security Requiere autenticación de administrador (cookie) y CSRF token
 * @rateLimit 100 requests / 15 minutos
 */
export async function DELETE(request: NextRequest) {
  try {
    logger.debug('🗑️ Deleting user...')
    
    // 1. Verificar autenticación
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) {
      return auth; // Error de autenticación
    }
    const { adminId } = auth;

    const elevated = requireElevatedAccess(request, adminId);
    if (elevated instanceof NextResponse) {
      return elevated;
    }
    
    // 2. Rate limiting
    const identifier = getClientIdentifier(request as any);
    const rateLimitResult = await checkRateLimit(adminApiRateLimit, identifier);
    if (!rateLimitResult?.success) {
      logger.warn(`⛔ Rate limit exceeded for ${identifier}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Demasiadas solicitudes. Por favor, intenta más tarde.',
          retryAfter: rateLimitResult ? new Date(rateLimitResult.reset).toISOString() : 'unknown',
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString() : '900',
            'X-RateLimit-Limit': rateLimitResult?.limit.toString() || '200',
            'X-RateLimit-Remaining': rateLimitResult?.remaining.toString() || '0',
            'X-RateLimit-Reset': rateLimitResult?.reset.toString() || Date.now().toString(),
          },
        }
      );
    }

    // 3. Obtener y validar query params
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validación Zod para query params
    const validation = validateWithZod(deleteUserQuerySchema, { id });
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }

    const validId = validation.data.id;

    // 4. CSRF protection (para DELETE, el token puede venir en query params o header)
    // En este caso, verificamos si viene en query params, sino en header
    const csrfToken = searchParams.get('csrfToken') || request.headers.get('x-csrf-token');
    const csrfError = await requireCSRF(request, csrfToken || undefined);
    if (csrfError) {
      return csrfError;
    }

    // 5. Obtener información del usuario ANTES de eliminarlo (para audit log)
    const userToDelete = await prisma.usuario.findUnique({
      where: { id: validId },
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true
      }
    });

    if (!userToDelete) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    // 6. Eliminar usuario
    await prisma.usuario.delete({
      where: { id: validId }
    })

    logger.success('✅ User deleted:', validId)

    // 7. Registrar en audit log (después de eliminar exitosamente)
    await logUserDelete(request, validId, {
      nombre: userToDelete.nombre || undefined,
      correo: userToDelete.correo || undefined,
      telefono: userToDelete.telefono || undefined
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    })

  } catch (error: any) {
    logger.error('💥 Error deleting user:', error)
    return handleError(error, 'Error al eliminar usuario');
  }
}


