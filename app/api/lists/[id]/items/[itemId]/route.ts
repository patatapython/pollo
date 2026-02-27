import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getAdminClient } from '@/lib/supabase/admin';

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

    const supabase = getAdminClient();

    // Verificar que la lista pertenece al workspace
    const { data: list } = await supabase
      .from('lists')
      .select('id, workspace_id')
      .eq('id', id)
      .single();

    if (!list || list.workspace_id !== session.workspaceId) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    // Verificar que el item pertenece a la lista
    const { data: item, error: checkError } = await supabase
      .from('items')
      .select('id, list_id')
      .eq('id', itemId)
      .single();

    if (checkError || !item || item.list_id !== id) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Actualizar item
    const updateData: { name?: string; is_completed?: boolean } = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.is_completed !== undefined) updateData.is_completed = validatedData.is_completed;

    const { data: updatedItem, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating item', error, { endpoint: '/api/lists/[id]/items/[itemId]', method: 'PATCH' });
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

    const supabase = getAdminClient();

    // Verificar que la lista pertenece al workspace
    const { data: list } = await supabase
      .from('lists')
      .select('id, workspace_id')
      .eq('id', id)
      .single();

    if (!list || list.workspace_id !== session.workspaceId) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    // Verificar que el item pertenece a la lista
    const { data: item, error: checkError } = await supabase
      .from('items')
      .select('id, list_id')
      .eq('id', itemId)
      .single();

    if (checkError || !item || item.list_id !== id) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Eliminar item
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (error) {
      logger.error('Error deleting item', error, { endpoint: '/api/lists/[id]/items/[itemId]', method: 'DELETE' });
      return NextResponse.json(
        { error: 'Failed to delete item' },
        { status: 500 }
      );
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
