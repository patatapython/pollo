import { NextRequest, NextResponse } from 'next/server';
import { generate, hash, computeLookup } from '@/lib/auth/passphrase';
import { createSession } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { getRepositories, RepositoryError } from '@/lib/repositories';

/**
 * POST /api/workspaces
 * Crear nuevo workspace
 *
 * Response: { id: string, passphrase: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Generar passphrase
    const passphrase = generate();
    const passphraseHash = await hash(passphrase);
    const passphraseLookup = computeLookup(passphrase);

    // Leer idioma del body (opcional, default 'es')
    let language = 'es';
    try {
      const body = await request.json();
      if (body?.language === 'en') language = 'en';
    } catch { /* body vacío o inválido — usar default */ }

    // Crear workspace en DB
    const repositories = getRepositories();

    let workspaceId: string;
    try {
      workspaceId = await repositories.workspaces.create(passphraseHash, passphraseLookup);
    } catch (error) {
      if (error instanceof RepositoryError) {
        logger.error('Failed to create workspace', error.cause ?? error, { endpoint: '/api/workspaces' });
        return NextResponse.json(
          { error: 'Failed to create workspace' },
          { status: 500 }
        );
      }
      throw error;
    }

    // Crear lista de ejemplo con items según idioma
    const exampleData = language === 'en'
      ? { listName: 'groceries', items: ['Milk', 'Bread', 'Fruits', 'Vegetables', 'Eggs', 'Cheese'] }
      : { listName: 'super', items: ['Leche', 'Pan', 'Frutas', 'Verduras', 'Huevos', 'Queso'] };

    let exampleListId: string | null = null;
    try {
      exampleListId = (await repositories.lists.create(workspaceId, exampleData.listName, 0)).id;
    } catch (error) {
      if (!(error instanceof RepositoryError)) throw error;
      logger.warn('Failed to create example list', { error: error.cause ?? error });
      // No es crítico si falla, continuamos
    }

    if (exampleListId) {
      try {
        await repositories.items.createMany(exampleListId, exampleData.items);
      } catch (error) {
        if (!(error instanceof RepositoryError)) throw error;
        logger.warn('Failed to create example items', { error: error.cause ?? error });
        // No es crítico si falla
      }
    }

    // Crear sesión JWT y setear cookie
    await createSession(workspaceId);

    return NextResponse.json(
      { id: workspaceId, passphrase },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creating workspace', error, { endpoint: '/api/workspaces' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
