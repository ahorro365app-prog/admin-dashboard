import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🔍 Middleware checking:', pathname)

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/api/', '/setup', '/quick-setup', '/manual-setup', '/test']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Si es una ruta pública, permitir acceso
  if (isPublicRoute) {
    console.log('✅ Public route, allowing access:', pathname)
    return NextResponse.next()
  }

  // Para rutas protegidas, verificar token
  const token = request.cookies.get('admin-token')?.value

  console.log('🔑 Token found:', token ? 'Yes' : 'No')

  if (!token) {
    console.log('❌ No token, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.nextUrl.origin))
  }

  console.log('✅ Token found, allowing access:', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

