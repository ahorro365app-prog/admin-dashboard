import { z } from 'zod';

/**
 * Schemas de validación Zod para endpoints del admin dashboard
 * Previene SQL injection, XSS, y inyección de datos maliciosos
 */

// =============================================
// VALIDACIONES COMUNES
// =============================================

/**
 * UUID válido
 */
export const uuidSchema = z.string().uuid('ID debe ser un UUID válido');

/**
 * Email válido
 */
export const emailSchema = z.string()
  .email('Email inválido')
  .max(255, 'Email demasiado largo')
  .toLowerCase()
  .trim();

/**
 * Texto seguro (previene XSS básico)
 */
export const safeTextSchema = z.string()
  .max(5000, 'Texto demasiado largo')
  .refine(
    (val) => !/<script|javascript:|onerror|onload/i.test(val),
    'Texto contiene caracteres no permitidos'
  );

// =============================================
// SCHEMAS DE ADMIN
// =============================================

/**
 * Schema para login de admin
 */
export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(1, 'Contraseña es requerida')
    .max(200, 'Contraseña demasiado larga'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

// =============================================
// SCHEMAS DE USUARIOS
// =============================================

/**
 * Schema para query params de usuarios
 */
export const getUsersQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 1)
    .pipe(z.number().int().positive().max(1000)),
  limit: z.string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 10)
    .pipe(z.number().int().positive().max(100)),
  search: z.string().max(200).optional(),
  subscription: z.enum(['free', 'smart', 'pro', 'caducado']).optional(),
  country: z.string().max(10).optional(),
  whatsappVerified: z.enum(['true', 'false']).optional(),
  expirationStatus: z.enum(['expired', 'expires_today', 'expires_7', 'active', 'no_expiration']).optional(),
});

export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;

/**
 * Schema para actualizar usuario
 */
export const updateUserSchema = z.object({
  id: uuidSchema,
  csrfToken: z.string().optional(), // CSRF token (opcional en schema, se valida aparte)
  nombre: z.string().max(200).optional(),
  correo: emailSchema.optional(),
  telefono: z.string().max(20).optional(),
  pais: z.string().max(10).optional(),
  moneda: z.enum(['USD', 'BOB', 'ARS', 'BRL', 'CLP', 'COP', 'PEN', 'MXN']).optional(),
  presupuesto_diario: z.number().positive().max(100000).optional(),
  suscripcion: z.enum(['free', 'smart', 'pro', 'caducado']).optional(),
  fecha_expiracion_suscripcion: z.union([z.string().datetime(), z.null()]).optional(),
  whatsapp_verificado: z.boolean().optional(),
}).refine((data) => {
  // Al menos un campo debe estar presente además del id
  const { id, csrfToken, ...updateFields } = data;
  return Object.keys(updateFields).length > 0;
}, {
  message: 'Al menos un campo debe ser actualizado',
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Schema para eliminar usuario (query params)
 */
export const deleteUserQuerySchema = z.object({
  id: uuidSchema,
});

export type DeleteUserQueryInput = z.infer<typeof deleteUserQuerySchema>;

/**
 * Schema para paginación simple
 */
export const paginationSchema = z.object({
  limit: z.string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 50)
    .pipe(z.number().int().positive().max(100)),
  offset: z.string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 0)
    .pipe(z.number().int().nonnegative()),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Schema para query params de audit logs
 */
export const auditLogsQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 1)
    .pipe(z.number().int().positive().max(1000)),
  limit: z.string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 50)
    .pipe(z.number().int().positive().max(100)),
  action: z.string().max(100).optional(),
  status: z.enum(['success', 'error', 'warning']).optional(),
  admin_id: uuidSchema.optional(),
  target_user_id: uuidSchema.optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});

export type AuditLogsQueryInput = z.infer<typeof auditLogsQuerySchema>;

/**
 * Schema para query params de payments
 */
export const paymentsQuerySchema = z.object({
  estado: z.enum(['pendiente', 'verificado', 'rechazado', 'all']).optional(),
});

export type PaymentsQueryInput = z.infer<typeof paymentsQuerySchema>;

/**
 * Schema para verificar/rechazar pago
 */
export const paymentActionSchema = z.object({
  csrfToken: z.string().optional(), // CSRF token (opcional en schema, se valida aparte)
  notas: z.string().max(1000).optional(),
});

export type PaymentActionInput = z.infer<typeof paymentActionSchema>;

// =============================================
// SCHEMAS DE WHATSAPP
// =============================================

/**
 * Schema para crear evento de WhatsApp
 */
export const whatsappEventSchema = z.object({
  timestamp: z.string().datetime().optional(),
  type: z.string().max(50, 'Tipo de evento demasiado largo'),
  user_id: uuidSchema.optional(),
  phone: z.string().max(20, 'Teléfono demasiado largo').optional(),
  status: z.string().max(50, 'Estado demasiado largo'),
  message: z.string().max(1000, 'Mensaje demasiado largo'),
  details: z.record(z.any()).optional(),
});

export type WhatsAppEventInput = z.infer<typeof whatsappEventSchema>;

/**
 * Schema para actualizar métricas de WhatsApp
 */
export const whatsappMetricsSchema = z.object({
  audios_count: z.number().int().nonnegative().optional(),
  success_count: z.number().int().nonnegative().optional(),
  error_count: z.number().int().nonnegative().optional(),
  transactions_count: z.number().int().nonnegative().optional(),
  total_amount: z.number().nonnegative().optional(),
});

export type WhatsAppMetricsInput = z.infer<typeof whatsappMetricsSchema>;

/**
 * Schema para actualizar sesión de WhatsApp
 */
export const whatsappUpdateSessionSchema = z.object({
  number: z.string().max(20, 'Número demasiado largo'),
  status: z.string().max(50, 'Estado demasiado largo'),
  lastSync: z.string().datetime('Fecha de sincronización inválida'),
  uptime: z.number().min(0).max(100, 'Uptime debe estar entre 0 y 100').optional(),
  jid: z.string().max(100, 'JID demasiado largo').optional(),
});

export type WhatsAppUpdateSessionInput = z.infer<typeof whatsappUpdateSessionSchema>;

/**
 * Schema para acción de status de WhatsApp
 */
export const whatsappStatusActionSchema = z.object({
  action: z.enum(['reconnect'], {
    errorMap: () => ({ message: 'Acción debe ser "reconnect"' }),
  }),
});

export type WhatsAppStatusActionInput = z.infer<typeof whatsappStatusActionSchema>;

// =============================================
// SCHEMAS DE TRANSACTIONS
// =============================================

/**
 * Schema para editar transacción
 */
export const transactionEditSchema = z.object({
  prediction_id: uuidSchema,
  usuario_id: uuidSchema,
  country_code: z.string().length(2, 'Código de país debe tener 2 caracteres'),
  formData: z.object({
    monto: z.number().positive('El monto debe ser positivo'),
    tipo: z.enum(['ingreso', 'egreso'], {
      errorMap: () => ({ message: 'Tipo debe ser "ingreso" o "egreso"' }),
    }),
    categoria: z.string().max(100, 'Categoría demasiado larga'),
    descripcion: z.string().max(500, 'Descripción demasiado larga'),
    metodoPago: z.string().max(50, 'Método de pago demasiado largo'),
    moneda: z.enum(['USD', 'BOB', 'ARS', 'BRL', 'CLP', 'COP', 'PEN', 'MXN'], {
      errorMap: () => ({ message: 'Moneda no válida' }),
    }),
  }),
});

export type TransactionEditInput = z.infer<typeof transactionEditSchema>;

// =============================================
// HELPER PARA VALIDAR Y PARSEAR
// =============================================

/**
 * Valida datos con Zod y retorna error formateado si falla
 */
export function validateWithZod<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details?: any } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const errorMessage = firstError?.message || 'Error de validación';
      const errorPath = firstError?.path?.join('.') || 'unknown';
      
      return {
        success: false,
        error: `${errorPath}: ${errorMessage}`,
        details: error.errors,
      };
    }
    
    return {
      success: false,
      error: 'Error de validación desconocido',
    };
  }
}

