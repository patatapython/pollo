import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getAdminClient } from '@/lib/supabase/admin';

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

    const supabase = getAdminClient();

    // Obtener lista y verificar que pertenece al workspace
    const { data: list, error } = await supabase
      .from('lists')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !list) {
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

    const supabase = getAdminClient();

    // Verificar que la lista pertenece al workspace
    const { data: list, error: checkError } = await supabase
      .from('lists')
      .select('id, workspace_id')
      .eq('id', id)
      .single();

    if (checkError || !list) {
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
    const { data: updatedList, error: updateError } = await supabase
      .from('lists')
      .update({ name: validatedData.name })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating list', updateError, { endpoint: '/api/lists/[id]', method: 'PATCH' });
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

    const supabase = getAdminClient();

    // Verificar que la lista pertenece al workspace
    const { data: list, error: checkError } = await supabase
      .from('lists')
      .select('id, workspace_id')
      .eq('id', id)
      .single();

    if (checkError || !list) {
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
    const { error: deleteError } = await supabase
      .from('lists')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error('Error deleting list', deleteError, { endpoint: '/api/lists/[id]', method: 'DELETE' });
      return NextResponse.json(
        { error: 'Failed to delete list' },
        { status: 500 }
      );
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
