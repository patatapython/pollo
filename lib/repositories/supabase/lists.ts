import { getAdminClient } from '@/lib/supabase/admin';
import {
  List,
  ListRepository,
  ListWithItems,
  RepositoryError,
} from '@/lib/repositories/types';

/** Columnas de la lista mas los articulos que necesita la vista previa. */
const LIST_WITH_ITEMS_SELECT = `
        *,
        items (
          id,
          name,
          is_completed,
          position,
          created_at
        )
      `;

const DEFAULT_LIMIT = 50;

export const supabaseListRepository: ListRepository = {
  async findByWorkspace(workspaceId, options) {
    const limit = options?.limit ?? DEFAULT_LIMIT;
    const offset = options?.offset ?? 0;

    const { data, error, count } = await getAdminClient()
      .from('lists')
      .select(LIST_WITH_ITEMS_SELECT, { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new RepositoryError('Failed to fetch lists', error);

    return {
      lists: (data ?? []) as unknown as ListWithItems[],
      total: count ?? 0,
    };
  },

  async findById(id, workspaceId) {
    let query = getAdminClient().from('lists').select('*').eq('id', id);
    if (workspaceId !== undefined) query = query.eq('workspace_id', workspaceId);

    const { data, error } = await query.maybeSingle();

    if (error) throw new RepositoryError('Failed to fetch list', error);

    return (data as List | null) ?? null;
  },

  async create(workspaceId, name, position = 0) {
    const { data, error } = await getAdminClient()
      .from('lists')
      .insert({ workspace_id: workspaceId, name, position })
      .select()
      .single();

    if (error) throw new RepositoryError('Failed to create list', error);

    return data as List;
  },

  async update(id, workspaceId, name) {
    const { data, error } = await getAdminClient()
      .from('lists')
      .update({ name })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .maybeSingle();

    if (error) throw new RepositoryError('Failed to update list', error);

    return (data as List | null) ?? null;
  },

  async delete(id, workspaceId) {
    const { error, count } = await getAdminClient()
      .from('lists')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (error) throw new RepositoryError('Failed to delete list', error);

    return (count ?? 0) > 0;
  },
};
