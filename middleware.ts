import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { validateEnvVars } from '@/lib/config/env';

// Validar variables de entorno en startup
validateEnvVars();

const COOKIE_NAME = 'pollo_session';

/**
 * Middleware para proteger rutas autenticadas
 * - Verifica que la sesión sea válida
 * - Redirige a /access si no hay sesión o es inválida
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // NO aplicar a rutas de API
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Proteger rutas /dashboard* y /lists/*
  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/lists')) {
    return NextResponse.next();
  }

  // Obtener cookie de sesión
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    // Sin sesión, redirigir a /access
    return NextResponse.redirect(new URL('/access', request.url));
  }

  // Verificar sesión
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const secretBytes = new TextEncoder().encode(secret);
    const verified = await jwtVerify(token, secretBytes);
    const payload = verified.payload as { workspaceId?: string };

    if (!payload.workspaceId) {
      throw new Error('Invalid token payload');
    }

    // Sesión válida, continuar
    return NextResponse.next();
  } catch (error) {
    // Sesión inválida, redirigir a /access
    return NextResponse.redirect(new URL('/access', request.url));
  }
}

// Configurar qué rutas aplica el middleware
export const config = {
  matcher: ['/dashboard/:path*', '/lists/:path*'],
};
