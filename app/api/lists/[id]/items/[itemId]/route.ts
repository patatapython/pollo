import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getRepositories, Item, RepositoryError } from '@/lib/repositories';

/**
 * `true` si la lista existe y es de este espacio.
 *
 * El codigo anterior descartaba el error de esta consulta y dejaba `list` en
 * `null`, con lo que un fallo de base de datos respondia 404. Se conserva.
 */
async function listBelongsToWorkspace(id: string, workspaceId: string): Promise<boolean> {
  try {
    return (await getRepositories().lists.findById(id, workspaceId)) !== null;
  } catch (error) {
    if (error instanceof RepositoryError) return false;
    throw error;
  }
}

/**
 * El articulo de esa lista, o `null`. Un fallo de consulta tambien devuelve
 * `null`: antes era `if (checkError || !item || ajeno)` con un unico 404.
 */
async function findItemForRoute(itemId: string, listId: string): Promise<Item | null> {
  try {
    return await getRepositories().items.findById(itemId, listId);
  } catch (error) {
    if (error instanceof RepositoryError) return null;
    throw error;
  }
}

const UpdateItemSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  is_completed: z.boolean().optional(),
});

/**
 * PATCH /api/lists/[id]/items/[itemId]
 * Actualizar item
 *
 * Request: { name?: string, is_completed?: boolean }
 * Response: { item: Item }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, itemId } = await params;
    const body = await request.json();
    const validatedData = UpdateItemSchema.parse(body);

    // Verificar que la lista pertenece al workspace
    if (!(await listBelongsToWorkspace(id, session.workspaceId))) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    // Verificar que el item pertenece a la lista
    if (!(await findItemForRoute(itemId, id))) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Actualizar item
    const updateData: { name?: string; is_completed?: boolean } = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.is_completed !== undefined) updateData.is_completed = validatedData.is_completed;

    let updatedItem: Item | null;
    try {
      updatedItem = await getRepositories().items.update(itemId, id, updateData);
    } catch (error) {
      if (error instanceof RepositoryError) {
        logger.error('Error updating item', error.cause ?? error, { endpoint: '/api/lists/[id]/items/[itemId]', method: 'PATCH' });
        return NextResponse.json(
          { error: 'Failed to update item' },
          { status: 500 }
        );
      }
      throw error;
    }

    // El articulo existia hace dos lineas: si ya no esta, se borro entre
    // medias. El codigo anterior pedia una fila exacta y respondia 500.
    if (!updatedItem) {
      logger.error('Error updating item', new Error('Item vanished before update'), { endpoint: '/api/lists/[id]/items/[itemId]', method: 'PATCH' });
      return NextResponse.json(
        { error: 'Failed to update item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }
    logger.error('Error updating item', error, { endpoint: '/api/lists/[id]/items/[itemId]', method: 'PATCH' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lists/[id]/items/[itemId]
 * Eliminar item
 *
 * Response: { success: true }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, itemId } = await params;

    // Verificar que la lista pertenece al workspace
    if (!(await listBelongsToWorkspace(id, session.workspaceId))) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    // Verificar que el item pertenece a la lista
    if (!(await findItemForRoute(itemId, id))) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Eliminar item. Que no quedara nada que borrar no es un fallo: el codigo
    // anterior tampoco miraba cuantas filas cayeron.
    try {
      await getRepositories().items.delete(itemId, id);
    } catch (error) {
      if (error instanceof RepositoryError) {
        logger.error('Error deleting item', error.cause ?? error, { endpoint: '/api/lists/[id]/items/[itemId]', method: 'DELETE' });
        return NextResponse.json(
          { error: 'Failed to delete item' },
          { status: 500 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting item', error, { endpoint: '/api/lists/[id]/items/[itemId]', method: 'DELETE' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
