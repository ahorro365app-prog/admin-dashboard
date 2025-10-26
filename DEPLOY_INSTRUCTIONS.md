# Panel de Administración - Ahorro365

## 🚀 Deploy a Vercel

### Variables de Entorno Requeridas

Configura las siguientes variables de entorno en Vercel:

#### Supabase (Obligatorias)
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

#### Base de Datos
```
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres
```

#### Autenticación Admin
```
JWT_SECRET=tu-secret-super-largo-aleatorio-min-32-caracteres
ADMIN_EMAIL=admin@ahorro365.com
ADMIN_PASSWORD_HASH=admin123
```

### Pasos para Deploy

1. **Conectar repositorio a Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Importa el proyecto desde GitHub
   - Selecciona la carpeta `admin-dashboard`

2. **Configurar variables de entorno**
   - En el dashboard de Vercel, ve a Settings > Environment Variables
   - Agrega todas las variables listadas arriba
   - Usa los valores reales de tu proyecto Supabase

3. **Deploy**
   - Haz clic en "Deploy"
   - Vercel construirá automáticamente el proyecto
   - Obtendrás una URL pública del admin panel

### Funcionalidades del Admin Panel

- ✅ **Autenticación segura** con JWT
- ✅ **Gestión de usuarios** (CRUD completo)
- ✅ **Analytics avanzados** con gráficos
- ✅ **Logs de auditoría**
- ✅ **Sistema de referidos**
- ✅ **Estadísticas en tiempo real**
- ✅ **Interfaz responsive**

### Credenciales por Defecto

```
Email: admin@demo.com
Password: admin123
```

### Estructura del Proyecto

```
admin-dashboard/
├── src/
│   ├── app/           # Rutas de Next.js
│   ├── components/    # Componentes React
│   ├── lib/          # Utilidades y configuración
│   └── types/        # Tipos TypeScript
├── prisma/           # Esquema de base de datos
└── vercel.json       # Configuración de Vercel
```

### Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build para producción
npm run build

# Iniciar servidor de producción
npm start
```

### Notas Importantes

- El proyecto usa Next.js 14 con App Router
- Base de datos: Supabase (PostgreSQL)
- Autenticación: JWT + cookies seguras
- UI: Tailwind CSS + Radix UI
- Charts: Recharts
- Estado: Zustand

### Soporte

Si tienes problemas con el deploy, verifica:
1. Variables de entorno configuradas correctamente
2. Conexión a Supabase funcionando
3. Tabla `admin_users` creada en la base de datos

