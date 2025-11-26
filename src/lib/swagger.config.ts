import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

// En Next.js, swagger-jsdoc se ejecuta desde el directorio raíz del proyecto
// Usamos ruta relativa al directorio de trabajo (funciona porque Next.js siempre ejecuta desde admin-dashboard/)
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Admin Dashboard API',
      version: '1.0.0',
      description: 'API documentation for Admin Dashboard - Ahorro365',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://admin.ahorro365.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenido del endpoint /api/auth/simple-login',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'admin-token',
          description: 'JWT token almacenado en cookie HttpOnly',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'string',
              example: 'Error details',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            nombre: {
              type: 'string',
              example: 'Juan Pérez',
            },
            correo: {
              type: 'string',
              format: 'email',
              example: 'juan@example.com',
            },
            pais: {
              type: 'string',
              example: 'México',
            },
            suscripcion: {
              type: 'string',
              enum: ['free', 'pro'],
              example: 'pro',
            },
            whatsapp_verificado: {
              type: 'boolean',
              example: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  example: 1,
                },
                limit: {
                  type: 'integer',
                  example: 10,
                },
                total: {
                  type: 'integer',
                  example: 100,
                },
                totalPages: {
                  type: 'integer',
                  example: 10,
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticación',
      },
      {
        name: 'Users',
        description: 'Gestión de usuarios',
      },
      {
        name: 'Payments',
        description: 'Gestión de pagos',
      },
      {
        name: 'Transactions',
        description: 'Gestión de transacciones',
      },
      {
        name: 'Analytics',
        description: 'Analytics y estadísticas',
      },
      {
        name: 'Admin',
        description: 'Operaciones administrativas',
      },
      {
        name: 'WhatsApp',
        description: 'Integración con WhatsApp',
      },
      {
        name: 'Audit',
        description: 'Logs de auditoría',
      },
    ],
  },
  apis: [
    './src/app/api/**/*.ts', // Rutas de API (relativa al directorio de trabajo - admin-dashboard/)
    // Nota: Esta ruta funciona porque Next.js siempre ejecuta desde el directorio raíz del proyecto
    // Si necesitas una ruta más robusta, considera usar process.cwd() + '/src/app/api/**/*.ts'
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

