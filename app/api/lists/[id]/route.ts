import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getRepositories, List, RepositoryError } from '@/lib/repositories';

/**
 * Busca la lista sin acotarla al espacio: estas rutas distinguen "no existe"
 * (404) de "existe pero es de otro espacio" (403), y para eso necesitan ver el
 * `workspace_id` real.
 *
 * Un fallo de consulta sube y acaba en 500, no en 404.
 */
async function findListForRoute(id: string): Promise<List | null> {
  return getRepositories().lists.findById(id);
}

const UpdateListSchema = z.object({
  name: z
    .string()
    .min(1, 'List name is required')
    .max(255, 'List name must be 255 characters or less')
    .trim(),
});

/**
 * GET /api/lists/[id]
 * Obtener detalle de una lista
 *
 * Response: { list: List }
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

    // Obtener lista y verificar que pertenece al workspace
    const list = await findListForRoute(id);

    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    if (list.workspace_id !== session.workspaceId) {
      return NextResponse.json(
        { error: 'Forbidden: List does not belong to your workspace' },
        { status: 403 }
      );
    }

    return NextResponse.json({ list });
  } catch (error) {
    logger.error('Error fetching list', error, { endpoint: '/api/lists/[id]', method: 'GET' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/lists/[id]
 * Actualizar nombre de lista
 *
 * Request: { name: string }
 * Response: { list: List }
 */
export async function PATCH(
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
    const validatedData = UpdateListSchema.parse(body);

    // Verificar que la lista pertenece al workspace
    const list = await findListForRoute(id);

    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    if (list.workspace_id !== session.workspaceId) {
      return NextResponse.json(
        { error: 'Forbidden: List does not belong to your workspace' },
        { status: 403 }
      );
    }

    // Actualizar lista
    let updatedList: List | null;
    try {
      updatedList = await getRepositories().lists.update(
        id,
        session.workspaceId,
        validatedData.name
      );
    } catch (error) {
      if (error instanceof RepositoryError) {
        logger.error('Error updating list', error.cause ?? error, { endpoint: '/api/lists/[id]', method: 'PATCH' });
        return NextResponse.json(
          { error: 'Failed to update list' },
          { status: 500 }
        );
      }
      throw error;
    }

    // La lista existia hace dos lineas: si ya no esta, alguien la borro entre
    // medias. El codigo anterior pedia una fila exacta y respondia 500; se
    // mantiene esa respuesta.
    if (!updatedList) {
      logger.error('Error updating list', new Error('List vanished before update'), { endpoint: '/api/lists/[id]', method: 'PATCH' });
      return NextResponse.json(
        { error: 'Failed to update list' },
        { status: 500 }
      );
    }

    return NextResponse.json({ list: updatedList });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }
    logger.error('Error updating list', error, { endpoint: '/api/lists/[id]', method: 'PATCH' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lists/[id]
 * Eliminar lista
 *
 * Response: { success: true }
 */
export async function DELETE(
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
    const list = await findListForRoute(id);

    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    if (list.workspace_id !== session.workspaceId) {
      return NextResponse.json(
        { error: 'Forbidden: List does not belong to your workspace' },
        { status: 403 }
      );
    }

    // Eliminar lista (cascade eliminará items automáticamente)
    // Que no hubiera nada que borrar no es un fallo: el codigo anterior
    // tampoco miraba cuantas filas cayeron.
    try {
      await getRepositories().lists.delete(id, session.workspaceId);
    } catch (error) {
      if (error instanceof RepositoryError) {
        logger.error('Error deleting list', error.cause ?? error, { endpoint: '/api/lists/[id]', method: 'DELETE' });
        return NextResponse.json(
          { error: 'Failed to delete list' },
          { status: 500 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting list', error, { endpoint: '/api/lists/[id]', method: 'DELETE' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
