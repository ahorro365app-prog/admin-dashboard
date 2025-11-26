/**
 * Sentry Edge Configuration (Admin Dashboard)
 * 
 * Configuración de Sentry para Edge Runtime del admin dashboard
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  environment: process.env.NODE_ENV || "development",
  
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
  
  beforeSend(event, hint) {
    if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
      return null;
    }
    
    if (event.request) {
      if (event.request.cookies) {
        delete event.request.cookies;
      }
      
      if (event.request.headers) {
        const sensitiveHeaders = [
          "authorization",
          "x-user-id",
          "x-csrf-token",
          "cookie",
          "set-cookie",
          "admin-token",
        ];
        
        sensitiveHeaders.forEach((header) => {
          delete event.request.headers[header];
          delete event.request.headers[header.toLowerCase()];
        });
      }
    }
    
    if (event.user) {
      const userId = event.user.id;
      event.user = userId ? { id: userId } : {};
    }
    
    return event;
  },
  
  ignoreErrors: [
    /Rate limit exceeded/,
    /CSRF token/,
  ],
  
  release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
});







