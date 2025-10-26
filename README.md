# Admin Dashboard - Ahorro365

Panel administrativo profesional para gestionar usuarios, analytics y configuraciones de la aplicación Ahorro365.

## 🚀 Características

- **Dashboard ejecutivo** con métricas en tiempo real
- **Gestión completa de usuarios** (FREE/PREMIUM)
- **Sistema de referidos** con analytics
- **Logs de auditoría** completos
- **Autenticación JWT** segura
- **Responsive design** (mobile, tablet, desktop)
- **100% gratuito** inicialmente

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Prisma ORM
- **Base de datos:** Supabase PostgreSQL
- **Estado:** TanStack Query, Zustand
- **Autenticación:** JWT manual
- **Deployment:** Vercel

## 🚀 Inicio Rápido

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Ejecutar en Desarrollo
```bash
npm run dev
```

El panel estará disponible en: `http://localhost:3001`

### 3. Acceso de Prueba
**URL:** `http://localhost:3001/login`

**Credenciales de Demo:**
- Email: `admin@demo.com`
- Contraseña: `admin123`

## 📦 Instalación Completa

1. **Clonar el repositorio:**
```bash
git clone <repository-url>
cd admin-dashboard
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
cp env.local.example .env.local
# Editar .env.local con tus valores
```

4. **Configurar base de datos:**
```bash
npm run db:generate
npm run db:push
```

5. **Ejecutar en desarrollo:**
```bash
npm run dev
```

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecutar en desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Ejecutar en producción
- `npm run lint` - Ejecutar linter
- `npm run db:generate` - Generar cliente Prisma
- `npm run db:push` - Sincronizar schema con BD
- `npm run db:migrate` - Ejecutar migraciones
- `npm run db:studio` - Abrir Prisma Studio

## 📁 Estructura del Proyecto

```
admin-dashboard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Rutas de autenticación
│   │   ├── (protected)/       # Rutas protegidas
│   │   └── api/               # API Routes
│   ├── components/            # Componentes React
│   ├── lib/                   # Utilidades y configuraciones
│   ├── hooks/                 # Custom hooks
│   └── types/                 # Tipos TypeScript
├── prisma/                    # Schema y migraciones
└── public/                    # Assets estáticos
```

## 🔐 Autenticación

El panel utiliza autenticación JWT con:
- **Login:** Email + contraseña
- **Tokens:** JWT en cookies HttpOnly
- **Expiración:** 24 horas (refresh: 7 días)
- **Protección:** Middleware en todas las rutas

## 📊 Funcionalidades

### Dashboard
- Métricas en tiempo real
- Gráficos interactivos
- Actividad reciente
- KPIs principales

### Gestión de Usuarios
- Lista con filtros avanzados
- Detalles completos del usuario
- Acciones masivas
- Exportación CSV

### Analytics
- Crecimiento de usuarios
- Conversión trial→premium
- Métricas de retención
- Exportación de reportes

### Sistema de Referidos
- Tracking de referidos
- Analytics de conversión
- Gestión de bonificaciones

## 🚀 Deployment

### Vercel (Recomendado)
1. Conectar repositorio GitHub
2. Configurar variables de entorno
3. Deploy automático en cada push

### Variables de Entorno Requeridas
- `DATABASE_URL` - URL de Supabase
- `JWT_SECRET` - Secret para JWT
- `ADMIN_EMAIL` - Email del administrador
- `ADMIN_PASSWORD_HASH` - Hash de contraseña

## 📈 Escalabilidad

**Fase 1 (Gratis):**
- Vercel: Plan gratuito
- Supabase: 500MB gratis
- GitHub: Repositorios públicos

**Fase 2 (Pago):**
- Vercel Pro: $20/mes
- Supabase Pro: $25/mes
- Sin cambios de código

## 🤝 Contribución

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico, contactar a: admin@ahorro365.com
