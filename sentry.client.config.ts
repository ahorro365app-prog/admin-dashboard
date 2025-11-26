/**
 * Sentry Client Configuration (Admin Dashboard)
 * 
 * Configuración de Sentry para el cliente (browser) del admin dashboard
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  environment: process.env.NODE_ENV || "development",
  
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
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
      const sensitiveTags = ["email", "phone", "telefono"];
      sensitiveTags.forEach((tag) => {
        delete event.tags[tag];
      });
    }
    
    return event;
  },
  
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    /Extension context invalidated/,
    /Chrome extension/,
  ],
  
  release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
});







