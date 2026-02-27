import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

// Nombre de la cookie
const COOKIE_NAME = 'pollo_session';

// Duración de la sesión: 24 horas
const SESSION_DURATION = 24 * 60 * 60 * 1000; // ms

/**
 * Obtener la clave secreta de JWT desde env vars
 * Debe ser string >= 32 caracteres
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET env var not configured');
  }
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  // Convertir string a Uint8Array para jose
  return new TextEncoder().encode(secret);
}

/**
 * Crear sesión JWT y setearla como httpOnly cookie
 * @param workspaceId UUID del workspace
 */
export async function createSession(workspaceId: string): Promise<void> {
  const secret = getJwtSecret();

  // Crear JWT
  const now = Math.floor(Date.now() / 1000); // segundos
  const exp = now + 24 * 60 * 60; // 24 horas

  const token = await new SignJWT({
    workspaceId,
    iat: now,
    exp,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(secret);

  // Setear cookie httpOnly
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION / 1000, // segundos
  });
}

/**
 * Verificar sesión desde cookie
 * Retorna { workspaceId } si válido, null si inválido o ausente
 */
export async function verifySession(): Promise<{ workspaceId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = getJwtSecret();
    const verified = await jwtVerify(token, secret);
    const payload = verified.payload as { workspaceId?: string };

    if (!payload.workspaceId) {
      return null;
    }

    return { workspaceId: payload.workspaceId };
  } catch (error) {
    // JWT inválido, expirado, etc.
    return null;
  }
}

/**
 * Limpiar sesión (eliminar cookie)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
