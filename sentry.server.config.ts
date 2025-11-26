/**
 * Sentry Server Configuration (Admin Dashboard)
 * 
 * Configuración de Sentry para el servidor del admin dashboard
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  environment: process.env.NODE_ENV || "development",
  
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  integrations: [
    Sentry.nodeProfilingIntegration(),
  ],
  
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
          "x-api-key",
          "x-auth-token",
          "admin-token",
        ];
        
        sensitiveHeaders.forEach((header) => {
          delete event.request.headers[header];
          delete event.request.headers[header.toLowerCase()];
        });
      }
      
      if (event.request.data) {
        const sensitiveFields = [
          "password",
          "token",
          "csrfToken",
          "apiKey",
          "secret",
          "authorization",
          "creditCard",
          "cardNumber",
          "cvv",
          "pin",
        ];
        
        if (typeof event.request.data === "object") {
          sensitiveFields.forEach((field) => {
            if (event.request.data[field]) {
              event.request.data[field] = "[REDACTED]";
            }
          });
        }
      }
    }
    
    if (event.user) {
      const userId = event.user.id;
      event.user = userId ? { id: userId } : {};
    }
    
    if (event.tags) {
      const sensitiveTags = ["email", "phone", "telefono", "userId"];
      sensitiveTags.forEach((tag) => {
        delete event.tags[tag];
      });
    }
    
    if (process.env.NODE_ENV === "production" && event.exception) {
      event.exception.values?.forEach((exception) => {
        if (exception.stacktrace) {
          if (exception.stacktrace.frames && exception.stacktrace.frames.length > 10) {
            exception.stacktrace.frames = exception.stacktrace.frames.slice(-10);
          }
        }
      });
    }
    
    return event;
  },
  
  ignoreErrors: [
    "ValidationError",
    "ZodError",
    /Rate limit exceeded/,
    /CSRF token/,
  ],
  
  release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
});







