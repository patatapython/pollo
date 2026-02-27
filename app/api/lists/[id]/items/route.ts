import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getAdminClient } from '@/lib/supabase/admin';
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

    const supabase = getAdminClient();

    // Verificar que la lista pertenece al workspace
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id, workspace_id')
      .eq('id', id)
      .single();

    if (listError || !list || list.workspace_id !== session.workspaceId) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    // Obtener items
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('list_id', id)
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching items', error, { endpoint: '/api/lists/[id]/items', method: 'GET' });
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: items || [] });
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

    const supabase = getAdminClient();

    // Verificar que la lista pertenece al workspace
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id, workspace_id')
      .eq('id', id)
      .single();

    if (listError || !list || list.workspace_id !== session.workspaceId) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    // Crear item
    const { data: item, error } = await supabase
      .from('items')
      .insert({
        list_id: id,
        name: validatedData.name,
        is_completed: false,
        position: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating item', error, { endpoint: '/api/lists/[id]/items', method: 'POST' });
      return NextResponse.json(
        { error: 'Failed to create item' },
        { status: 500 }
      );
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
