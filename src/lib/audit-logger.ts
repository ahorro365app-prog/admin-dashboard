import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Tipos de acciones
export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'view_user'
  | 'update_user'
  | 'block_user'
  | 'unblock_user'
  | 'delete_user'
  | 'view_payment'
  | 'verify_payment'
  | 'reject_payment'
  | 'setup_2fa'
  | 'disable_2fa'
  | 'verify_2fa'
  | 'update_settings'
  | 'export_data'
  | 'view_analytics'
  | 'edit_transaction'
  | 'other';

export type ResourceType =
  | 'user'
  | 'payment'
  | 'transaction'
  | 'settings'
  | '2fa'
  | 'analytics'
  | 'other';

export interface AuditLogData {
  action: AuditAction;
  resourceType?: ResourceType;
  resourceId?: string;
  targetUserId?: string;
  details?: Record<string, any>;
  status?: 'success' | 'error' | 'warning';
  errorMessage?: string;
}

/**
 * Obtiene el ID del admin desde el token JWT
 */
function getAdminIdFromRequest(request: NextRequest): string | null {
  try {
    const token = request.cookies.get('admin-token')?.value;
    if (!token) return null;

    const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.id || decoded.adminId || null;
  } catch (error) {
    return null;
  }
}

/**
 * Obtiene información del cliente desde el request
 */
function getClientInfo(request: NextRequest): { ipAddress: string | null; userAgent: string | null } {
  const ipAddress =
    request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    null;

  const userAgent = request.headers.get('user-agent') || null;

  return { ipAddress, userAgent };
}

/**
 * Registra una acción en el log de auditoría
 */
export async function logAuditEvent(
  request: NextRequest,
  data: AuditLogData
): Promise<void> {
  try {
    // No registrar si no hay credenciales de Supabase
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('⚠️ Supabase credentials not configured. Audit log skipped.');
      return;
    }

    const adminId = getAdminIdFromRequest(request);
    if (!adminId) {
      // No registrar si no hay admin autenticado (excepto para login)
      if (data.action !== 'login' && data.action !== 'login_failed') {
        return;
      }
    }

    const { ipAddress, userAgent } = getClientInfo(request);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const logEntry = {
      admin_id: adminId,
      action: data.action,
      resource_type: data.resourceType || null,
      resource_id: data.resourceId || null,
      target_user_id: data.targetUserId || null,
      details: data.details ? JSON.stringify(data.details) : null,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: data.status || 'success',
      error_message: data.errorMessage || null,
    };

    const { error } = await supabase
      .from('admin_audit_logs')
      .insert(logEntry);

    if (error) {
      console.error('❌ Error logging audit event:', error);
    }
  } catch (error) {
    // No lanzar error, solo loguear
    console.error('❌ Error in audit logger:', error);
  }
}

/**
 * Helper para registrar login exitoso
 */
export async function logLogin(request: NextRequest, adminId: string, email: string): Promise<void> {
  await logAuditEvent(request, {
    action: 'login',
    resourceType: 'other',
    details: { email },
    status: 'success',
  });
}

/**
 * Helper para registrar login fallido
 */
export async function logLoginFailed(request: NextRequest, email: string, reason: string): Promise<void> {
  await logAuditEvent(request, {
    action: 'login_failed',
    resourceType: 'other',
    details: { email, reason },
    status: 'error',
    errorMessage: reason,
  });
}

/**
 * Helper para registrar logout
 */
export async function logLogout(request: NextRequest): Promise<void> {
  await logAuditEvent(request, {
    action: 'logout',
    resourceType: 'other',
    status: 'success',
  });
}

/**
 * Helper para registrar actualización de usuario
 */
export async function logUserUpdate(
  request: NextRequest,
  targetUserId: string,
  changes: Record<string, any>
): Promise<void> {
  await logAuditEvent(request, {
    action: 'update_user',
    resourceType: 'user',
    resourceId: targetUserId,
    targetUserId: targetUserId,
    details: { changes },
    status: 'success',
  });
}

/**
 * Helper para registrar bloqueo/desbloqueo de usuario
 */
export async function logUserBlock(
  request: NextRequest,
  targetUserId: string,
  blocked: boolean
): Promise<void> {
  await logAuditEvent(request, {
    action: blocked ? 'block_user' : 'unblock_user',
    resourceType: 'user',
    resourceId: targetUserId,
    targetUserId: targetUserId,
    details: { blocked },
    status: 'success',
  });
}

/**
 * Helper para registrar verificación/rechazo de pago
 */
export async function logPaymentAction(
  request: NextRequest,
  paymentId: string,
  action: 'verify_payment' | 'reject_payment',
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent(request, {
    action,
    resourceType: 'payment',
    resourceId: paymentId,
    details,
    status: 'success',
  });
}

/**
 * Helper para registrar acciones de 2FA
 */
export async function log2FAAction(
  request: NextRequest,
  action: 'setup_2fa' | 'disable_2fa' | 'verify_2fa',
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent(request, {
    action,
    resourceType: '2fa',
    details,
    status: 'success',
  });
}

/**
 * Helper para registrar actualización de configuración
 */
export async function logSettingsUpdate(
  request: NextRequest,
  settings: Record<string, any>
): Promise<void> {
  await logAuditEvent(request, {
    action: 'update_settings',
    resourceType: 'settings',
    details: { settings },
    status: 'success',
  });
}

/**
 * Helper para registrar eliminación de usuario
 */
export async function logUserDelete(
  request: NextRequest,
  targetUserId: string,
  userInfo?: { nombre?: string; correo?: string; telefono?: string }
): Promise<void> {
  await logAuditEvent(request, {
    action: 'delete_user',
    resourceType: 'user',
    resourceId: targetUserId,
    targetUserId: targetUserId,
    details: userInfo ? { deletedUser: userInfo } : {},
    status: 'success',
  });
}

/**
 * Helper para registrar edición de transacción
 */
export async function logTransactionEdit(
  request: NextRequest,
  transactionId: string,
  targetUserId: string,
  changes: { before?: any; after?: any }
): Promise<void> {
  await logAuditEvent(request, {
    action: 'edit_transaction',
    resourceType: 'transaction',
    resourceId: transactionId,
    targetUserId: targetUserId,
    details: changes,
    status: 'success',
  });
}

