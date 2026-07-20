import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AccessSchema } from '@/lib/validations/schemas';
import { computeLookup, verify } from '@/lib/auth/passphrase';
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

    // Buscar workspace por passphrase lookup
    const passphraseLookup = computeLookup(validatedData.passphrase);

    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, passphrase_hash')
      .eq('passphrase_lookup', passphraseLookup)
      .single();

    if (workspaceError || !workspace) {
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

    // Verificar hash bcrypt
    const isValid = await verify(validatedData.passphrase, workspace.passphrase_hash);

    if (!isValid) {
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
    await createSession(workspace.id);

    return NextResponse.json(
      { id: workspace.id },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
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
