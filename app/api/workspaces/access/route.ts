import { NextRequest, NextResponse } from 'next/server';
import { AccessSchema } from '@/lib/validations/schemas';
import { computeLookup, verify, candidatePassphrases } from '@/lib/auth/passphrase';
import { createSession } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { getAdminClient } from '@/lib/supabase/admin';

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
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const supabase = getAdminClient();

    // Obtener intentos fallidos en últimos 15 minutos
    const { count: failedAttempts, error: attemptsError } = await supabase
      .from('rate_limit_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIp)
      .eq('success', false)
      .gt('attempted_at', fifteenMinutesAgo.toISOString());

    if (attemptsError) {
      logger.error('Rate limit check error', attemptsError);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    if ((failedAttempts ?? 0) >= 10) {
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

    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, passphrase_hash, passphrase_lookup')
      .in('passphrase_lookup', [...lookupToCandidate.keys()]);

    let matched: { id: string } | null = null;
    for (const ws of workspaces ?? []) {
      const candidate = lookupToCandidate.get(ws.passphrase_lookup);
      if (candidate && (await verify(candidate, ws.passphrase_hash))) {
        matched = ws;
        break;
      }
    }

    if (workspaceError || !matched) {
      if (workspaceError) {
        logger.error('Workspace lookup error', workspaceError, { endpoint: '/api/workspaces/access' });
      }

      // Log failed attempt
      await supabase
        .from('rate_limit_attempts')
        .insert({
          ip_address: clientIp,
          success: false,
          attempted_at: now.toISOString(),
        });

      return NextResponse.json(
        { error: 'Invalid passphrase' },
        { status: 401 }
      );
    }

    // Log successful attempt
    await supabase
      .from('rate_limit_attempts')
      .insert({
        ip_address: clientIp,
        success: true,
        attempted_at: now.toISOString(),
      });

    // Crear sesión JWT y setear cookie
    await createSession(matched.id);

    return NextResponse.json(
      { id: matched.id },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    logger.error('Error accessing workspace', error, { endpoint: '/api/workspaces/access' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
