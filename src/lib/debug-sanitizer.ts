/**
 * Utilidades para sanitizar datos en endpoints de debug
 * Oculta información sensible como password_hash, teléfonos, correos, etc.
 */

/**
 * Sanitiza datos para endpoints de debug
 * Oculta campos sensibles como password_hash, teléfonos completos, correos completos
 */
export function sanitizeDebugData(data: any): any {
  if (!data) return data;
  
  // Si es un array, sanitizar cada elemento
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDebugData(item));
  }
  
  // Si es un objeto, sanitizar recursivamente
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Ocultar password_hash completamente
      if (key === 'password_hash' || key === 'password' || key === 'hash') {
        sanitized[key] = '***REDACTED***';
        continue;
      }
      
      // Ocultar teléfono completo, mostrar solo últimos 4 dígitos
      if (key === 'telefono' || key === 'phone' || key === 'phone_number') {
        if (value && typeof value === 'string') {
          const phone = value.trim();
          sanitized[key] = phone.length > 4 
            ? `***${phone.slice(-4)}` 
            : '***REDACTED***';
        } else {
          sanitized[key] = value;
        }
        continue;
      }
      
      // Ocultar correo completo, mostrar solo dominio
      if (key === 'correo' || key === 'email' || key === 'email_address') {
        if (value && typeof value === 'string') {
          const email = value.trim();
          const [local, domain] = email.split('@');
          sanitized[key] = domain 
            ? `***@${domain}` 
            : '***REDACTED***';
        } else {
          sanitized[key] = value;
        }
        continue;
      }
      
      // Sanitizar objetos anidados recursivamente
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeDebugData(value);
        continue;
      }
      
      // Sanitizar arrays anidados
      if (Array.isArray(value)) {
        sanitized[key] = sanitizeDebugData(value);
        continue;
      }
      
      // Mantener otros valores tal cual
      sanitized[key] = value;
    }
    
    return sanitized;
  }
  
  // Para valores primitivos, retornar tal cual
  return data;
}

/**
 * Registra acceso a endpoint de debug
 * Solo en desarrollo, no en producción
 */
export function logDebugAccess(
  endpoint: string,
  request: { ip?: string | null; headers: Headers }
): void {
  if (process.env.NODE_ENV !== 'production') {
    const ip = request.ip || 
               request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    console.log(`🔍 [DEBUG ACCESS] ${endpoint} - IP: ${ip} - ${new Date().toISOString()}`);
  }
}

