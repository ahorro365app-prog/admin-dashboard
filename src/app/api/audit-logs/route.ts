import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleError, handleValidationError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';
import { auditLogsQuerySchema, validateWithZod } from '@/lib/validations';
import { requireAuth } from '@/lib/auth-helpers';

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Obtiene logs de auditoría
 *     description: Retorna logs de auditoría con filtros opcionales por tipo de acción, usuario, fecha y paginación
 *     tags: [Audit]
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
 *           default: 50
 *           maximum: 100
 *         description: Límite de resultados por página
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filtro por tipo de acción (login, logout, user_update, etc.)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtro por ID de usuario
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de inicio (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de fin (ISO 8601)
 *     responses:
 *       200:
 *         description: Logs de auditoría obtenidos exitosamente
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
 * 
 * @route GET /api/audit-logs
 * @description Obtiene los logs de auditoría con filtros opcionales
 * @security Requiere autenticación de administrador (cookie)
 * @rateLimit 100 requests / 15 minutos
 */
export async function GET(request: NextRequest) {
  try {
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

    // 2. Verificar autenticación
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) {
      return auth; // Error de autenticación
    }
    const { adminId } = auth;

    // 3. Configuración de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('❌ Supabase credentials not configured');
      return NextResponse.json({
        success: false,
        message: 'Configuración de Supabase no encontrada'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Validar query params
    const { searchParams } = new URL(request.url);
    const params = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
      action: searchParams.get('action') || '',
      status: searchParams.get('status') || '',
      admin_id: searchParams.get('admin_id') || '',
      target_user_id: searchParams.get('target_user_id') || '',
      date_from: searchParams.get('date_from') || '',
      date_to: searchParams.get('date_to') || '',
    };
    
    const validation = validateWithZod(auditLogsQuerySchema, params);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }

    const { page, limit, action, status, admin_id, target_user_id, date_from, date_to } = validation.data;
    const offset = (page - 1) * limit;

    // Construir query
    let query = supabase
      .from('admin_audit_logs')
      .select(`
        *,
        admin_users:admin_id (
          id,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (action) {
      query = query.eq('action', action);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (admin_id) {
      query = query.eq('admin_id', admin_id);
    }
    if (target_user_id) {
      query = query.eq('target_user_id', target_user_id);
    }
    if (date_from) {
      query = query.gte('created_at', date_from);
    }
    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('❌ Error fetching audit logs:', error);
      return handleError(error, 'Error obteniendo logs de auditoría');
    }

    // Formatear datos
    const formattedLogs = (data || []).map((log: any) => ({
      id: log.id,
      adminId: log.admin_id,
      adminEmail: log.admin_users?.email || 'N/A',
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      targetUserId: log.target_user_id,
      details: log.details ? (typeof log.details === 'string' ? JSON.parse(log.details) : log.details) : null,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      status: log.status,
      errorMessage: log.error_message,
      createdAt: log.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedLogs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error: any) {
    logger.error('💥 Error en audit-logs API:', error);
    return handleError(error, 'Error obteniendo logs de auditoría');
  }
}

