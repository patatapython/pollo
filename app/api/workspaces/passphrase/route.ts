import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

/**
 * GET /api/workspaces/passphrase
 * Obtener el passphrase del workspace actual
 *
 * Response: { passphrase: string }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Nota: El passphrase no se almacena en la base de datos después de la creación
    // Se debería devolver desde sessionStorage o una variable de sesión
    // Por ahora, retornamos un error indicando que no está disponible

    return NextResponse.json(
      { error: 'Passphrase not available. Please check your recovery kit file or re-create the workspace.' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error getting passphrase', error, { endpoint: '/api/workspaces/passphrase' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
