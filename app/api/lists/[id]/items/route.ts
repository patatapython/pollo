import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getRepositories, RepositoryError } from '@/lib/repositories';

/**
 * `true` si la lista existe y es de este espacio.
 *
 * Un fallo de consulta cuenta como "no existe", igual que antes: el codigo
 * anterior escribia `if (listError || !list || ajena)` y respondia 404 en los
 * tres casos. Se conserva lo observable.
 */
async function listBelongsToWorkspace(id: string, workspaceId: string): Promise<boolean> {
  try {
    return (await getRepositories().lists.findById(id, workspaceId)) !== null;
  } catch (error) {
    if (error instanceof RepositoryError) return false;
    throw error;
  }
}

const CreateItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Item name is required')
    .max(500, 'Item name must be 500 characters or less')
    .trim(),
});

/**
 * GET /api/lists/[id]/items
 * Listar items de una lista
 *
 * Response: { items: Item[] }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificar que la lista pertenece al workspace
    if (!(await listBelongsToWorkspace(id, session.workspaceId))) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    // Obtener items
    let items;
    try {
      items = await getRepositories().items.findByList(id);
    } catch (error) {
      if (error instanceof RepositoryError) {
        logger.error('Error fetching items', error.cause ?? error, { endpoint: '/api/lists/[id]/items', method: 'GET' });
        return NextResponse.json(
          { error: 'Failed to fetch items' },
          { status: 500 }
        );
      }
      throw error;
    }

    return NextResponse.json({ items });
  } catch (error) {
    logger.error('Error getting items', error, { endpoint: '/api/lists/[id]/items', method: 'GET' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lists/[id]/items
 * Agregar item a lista
 *
 * Request: { name: string }
 * Response: { item: Item }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = CreateItemSchema.parse(body);

    // Verificar que la lista pertenece al workspace
    if (!(await listBelongsToWorkspace(id, session.workspaceId))) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    // Crear item
    let item;
    try {
      item = await getRepositories().items.create(id, {
        name: validatedData.name,
        position: 0,
      });
    } catch (error) {
      if (error instanceof RepositoryError) {
        logger.error('Error creating item', error.cause ?? error, { endpoint: '/api/lists/[id]/items', method: 'POST' });
        return NextResponse.json(
          { error: 'Failed to create item' },
          { status: 500 }
        );
      }
      throw error;
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }
    logger.error('Error creating item', error, { endpoint: '/api/lists/[id]/items', method: 'POST' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
