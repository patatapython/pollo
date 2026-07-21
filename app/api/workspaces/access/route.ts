import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AccessSchema } from '@/lib/validations/schemas';
import { computeLookup, verify, candidatePassphrases } from '@/lib/auth/passphrase';
import { createSession } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { getRepositories } from '@/lib/repositories';

const ENDPOINT = '/api/workspaces/access';
const MAX_FAILED_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

/**
 * Anota el intento sin dejar que su fallo tumbe la peticion.
 *
 * Un fallo aqui degrada el limitador, no la sesion: quien acaba de escribir
 * bien su passphrase debe entrar aunque la anotacion no llegue a guardarse.
 * Pero se registra, porque un limitador que deja de contar en silencio es peor
 * que no tener ninguno: aparenta proteger.
 */
async function recordAttempt(ipAddress: string, success: boolean, at: Date) {
  try {
    await getRepositories().rateLimits.record(ipAddress, success, at);
  } catch (error) {
    logger.error(
      success ? 'Successful attempt not recorded' : 'Failed attempt not recorded',
      error,
      { endpoint: ENDPOINT }
    );
  }
}

/**
 * POST /api/workspaces/access
 * Acceder a workspace con passphrase
 *
 * Request: { passphrase: string }
 * Response: { id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar input
    const validatedData = AccessSchema.parse(body);

    // Rate limiting check
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_MS);

    const repositories = getRepositories();

    // Obtener intentos fallidos en la ventana actual
    let failedAttempts: number;
    try {
      failedAttempts = await repositories.rateLimits.countFailedSince(clientIp, windowStart);
    } catch (error) {
      logger.error('Rate limit check error', error, { endpoint: ENDPOINT });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }

    // Reparar entrada mediante candidatos del diccionario y buscar workspace
    const candidates = candidatePassphrases(validatedData.passphrase);
    const lookupToCandidate = new Map(
      candidates.map((c) => [computeLookup(c), c])
    );

    // Un fallo de la consulta no es un intento fallido: no se penaliza al
    // usuario ni se le informa de que su passphrase es incorrecta. Mismo
    // tratamiento que el error de la consulta de rate limit, mas arriba.
    let workspaces;
    try {
      workspaces = await repositories.workspaces.findByLookups([...lookupToCandidate.keys()]);
    } catch (error) {
      logger.error('Workspace lookup error', error, { endpoint: ENDPOINT });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    let matched: { id: string } | null = null;
    for (const ws of workspaces) {
      const candidate = lookupToCandidate.get(ws.passphrase_lookup);
      if (candidate && (await verify(candidate, ws.passphrase_hash))) {
        matched = ws;
        break;
      }
    }

    if (!matched) {
      // Registrar intento fallido
      await recordAttempt(clientIp, false, now);

      return NextResponse.json(
        { error: 'Invalid passphrase' },
        { status: 401 }
      );
    }

    // Registrar intento correcto
    await recordAttempt(clientIp, true, now);

    // Crear sesión JWT y setear cookie
    await createSession(matched.id);

    return NextResponse.json(
      { id: matched.id },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }
    logger.error('Error accessing workspace', error, { endpoint: ENDPOINT });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
