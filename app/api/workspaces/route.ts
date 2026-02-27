import { NextRequest, NextResponse } from 'next/server';
import { generate, hash, computeLookup } from '@/lib/auth/passphrase';
import { createSession } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { getAdminClient } from '@/lib/supabase/admin';

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
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        passphrase_hash: passphraseHash,
        passphrase_lookup: passphraseLookup,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to create workspace', error, { endpoint: '/api/workspaces' });
      return NextResponse.json(
        { error: 'Failed to create workspace' },
        { status: 500 }
      );
    }

    const workspaceId = data.id;

    // Crear lista de ejemplo con items según idioma
    const exampleData = language === 'en'
      ? { listName: 'groceries', items: ['Milk', 'Bread', 'Fruits', 'Vegetables', 'Eggs', 'Cheese'] }
      : { listName: 'super', items: ['Leche', 'Pan', 'Frutas', 'Verduras', 'Huevos', 'Queso'] };

    const { data: listData, error: listError } = await supabase
      .from('lists')
      .insert({
        workspace_id: workspaceId,
        name: exampleData.listName,
        position: 0,
      })
      .select('id')
      .single();

    if (listError) {
      logger.warn('Failed to create example list', { error: listError });
      // No es crítico si falla, continuamos
    } else if (listData) {
      const exampleItems = exampleData.items.map((name, position) => ({
        list_id: listData.id,
        name,
        position,
      }));

      const { error: itemsError } = await supabase
        .from('items')
        .insert(exampleItems);

      if (itemsError) {
        logger.warn('Failed to create example items', { error: itemsError });
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
