import { NextResponse } from 'next/server';

/**
 * Tipos de errores que pueden ocurrir
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

/**
 * Interfaz para errores estructurados
 */
export interface AppError {
  type: ErrorType;
  message: string;
  statusCode: number;
  details?: any;
  originalError?: Error;
}

/**
 * Determina el tipo de error basado en el error original
 */
function classifyError(error: any): ErrorType {
  // Errores de validación
  if (error?.code === 'P2002' || error?.message?.includes('unique constraint')) {
    return ErrorType.VALIDATION;
  }
  
  // Errores de autenticación
  if (error?.status === 401 || error?.message?.includes('authentication') || error?.message?.includes('unauthorized')) {
    return ErrorType.AUTHENTICATION;
  }
  
  // Errores de autorización
  if (error?.status === 403 || error?.message?.includes('forbidden') || error?.message?.includes('permission')) {
    return ErrorType.AUTHORIZATION;
  }
  
  // Errores de base de datos
  if (error?.code?.startsWith('P') || error?.message?.includes('database') || error?.message?.includes('connection')) {
    return ErrorType.DATABASE;
  }
  
  // Errores de APIs externas
  if (error?.response || error?.config || error?.isAxiosError) {
    return ErrorType.EXTERNAL_API;
  }
  
  // Rate limiting
  if (error?.status === 429 || error?.message?.includes('rate limit')) {
    return ErrorType.RATE_LIMIT;
  }
  
  // Not found
  if (error?.status === 404 || error?.message?.includes('not found')) {
    return ErrorType.NOT_FOUND;
  }
  
  // Por defecto, error interno
  return ErrorType.INTERNAL;
}

/**
 * Obtiene el código de estado HTTP apropiado
 */
function getStatusCode(errorType: ErrorType, originalError?: any): number {
  // Si el error original tiene un status code, usarlo
  if (originalError?.status && typeof originalError.status === 'number') {
    return originalError.status;
  }
  
  // Mapeo de tipos de error a códigos de estado
  const statusMap: Record<ErrorType, number> = {
    [ErrorType.VALIDATION]: 400,
    [ErrorType.AUTHENTICATION]: 401,
    [ErrorType.AUTHORIZATION]: 403,
    [ErrorType.NOT_FOUND]: 404,
    [ErrorType.RATE_LIMIT]: 429,
    [ErrorType.DATABASE]: 500,
    [ErrorType.EXTERNAL_API]: 502,
    [ErrorType.INTERNAL]: 500,
  };
  
  return statusMap[errorType];
}

/**
 * Obtiene mensaje seguro para el usuario
 * En desarrollo: muestra detalles
 * En producción: mensaje genérico seguro
 */
function getSafeMessage(errorType: ErrorType, originalError?: any, customMessage?: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Si hay un mensaje personalizado, usarlo
  if (customMessage) {
    return customMessage;
  }
  
  // En desarrollo, mostrar más detalles
  if (isDevelopment && originalError?.message) {
    return originalError.message;
  }
  
  // Mensajes genéricos seguros para producción
  const safeMessages: Record<ErrorType, string> = {
    [ErrorType.VALIDATION]: 'Los datos proporcionados no son válidos',
    [ErrorType.AUTHENTICATION]: 'No estás autenticado. Por favor, inicia sesión nuevamente.',
    [ErrorType.AUTHORIZATION]: 'No tienes permisos para realizar esta acción',
    [ErrorType.NOT_FOUND]: 'El recurso solicitado no fue encontrado',
    [ErrorType.DATABASE]: 'Error al procesar la solicitud. Por favor, intenta más tarde.',
    [ErrorType.EXTERNAL_API]: 'Error al conectar con servicios externos. Por favor, intenta más tarde.',
    [ErrorType.RATE_LIMIT]: 'Demasiadas solicitudes. Por favor, intenta más tarde.',
    [ErrorType.INTERNAL]: 'Ha ocurrido un error interno. Por favor, intenta más tarde.',
  };
  
  return safeMessages[errorType];
}

/**
 * Crea un error estructurado
 */
export function createAppError(
  error: any,
  customMessage?: string,
  errorType?: ErrorType
): AppError {
  const type = errorType || classifyError(error);
  const statusCode = getStatusCode(type, error);
  const message = getSafeMessage(type, error, customMessage);
  
  return {
    type,
    message,
    statusCode,
    details: process.env.NODE_ENV === 'development' ? {
      originalMessage: error?.message,
      stack: error?.stack,
      code: error?.code,
    } : undefined,
    originalError: error instanceof Error ? error : undefined,
  };
}

/**
 * Maneja errores de forma segura y retorna respuesta HTTP
 * 
 * @param error - Error a manejar
 * @param customMessage - Mensaje personalizado (opcional)
 * @param errorType - Tipo de error específico (opcional)
 * @returns NextResponse con error formateado
 */
export function handleError(
  error: any,
  customMessage?: string,
  errorType?: ErrorType
): NextResponse {
  const appError = createAppError(error, customMessage, errorType);
  
  // Loggear el error completo internamente (siempre)
  console.error(`[${appError.type}] ${appError.message}`, {
    statusCode: appError.statusCode,
    details: appError.details,
    originalError: appError.originalError,
  });
  
  // En desarrollo, incluir más detalles en la respuesta
  const response: any = {
    success: false,
    error: appError.message,
    type: appError.type,
  };
  
  if (process.env.NODE_ENV === 'development') {
    response.details = appError.details;
  }
  
  return NextResponse.json(response, {
    status: appError.statusCode,
  });
}

/**
 * Wrapper para manejar errores en funciones async de API routes
 * 
 * Uso:
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   return await handleApiRoute(async () => {
 *     // Tu código aquí
 *     return NextResponse.json({ success: true });
 *   });
 * }
 * ```
 */
export async function handleApiRoute<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error: any) {
    return handleError(error);
  }
}

/**
 * Helper para errores de validación
 */
export function handleValidationError(message: string, details?: any): NextResponse {
  return handleError(
    new Error(message),
    message,
    ErrorType.VALIDATION
  );
}

/**
 * Helper para errores de autenticación
 */
export function handleAuthError(message: string = 'No estás autenticado'): NextResponse {
  return handleError(
    new Error(message),
    message,
    ErrorType.AUTHENTICATION
  );
}

/**
 * Helper para errores de autorización
 */
export function handleAuthorizationError(message: string = 'No tienes permisos'): NextResponse {
  return handleError(
    new Error(message),
    message,
    ErrorType.AUTHORIZATION
  );
}

/**
 * Helper para errores de recurso no encontrado
 */
export function handleNotFoundError(resource: string = 'Recurso'): NextResponse {
  return handleError(
    new Error(`${resource} no encontrado`),
    `${resource} no encontrado`,
    ErrorType.NOT_FOUND
  );
}

