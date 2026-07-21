import { getAdminClient } from '@/lib/supabase/admin';
import { Item, ItemRepository, RepositoryError } from '@/lib/repositories/types';

export const supabaseItemRepository: ItemRepository = {
  async findByList(listId, status = 'all') {
    let query = getAdminClient().from('items').select('*').eq('list_id', listId);

    if (status === 'active') query = query.eq('is_completed', false);
    if (status === 'purchased') query = query.eq('is_completed', true);

    const { data, error } = await query
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw new RepositoryError('Failed to fetch items', error);

    return (data ?? []) as Item[];
  },

  async findById(id, listId) {
    const { data, error } = await getAdminClient()
      .from('items')
      .select('*')
      .eq('id', id)
      .eq('list_id', listId)
      .maybeSingle();

    if (error) throw new RepositoryError('Failed to fetch item', error);

    return (data as Item | null) ?? null;
  },

  async create(listId, data) {
    const { data: created, error } = await getAdminClient()
      .from('items')
      .insert({
        list_id: listId,
        name: data.name,
        is_completed: false,
        position: data.position ?? 0,
      })
      .select()
      .single();

    if (error) throw new RepositoryError('Failed to create item', error);

    return created as Item;
  },

  async createMany(listId, names) {
    if (names.length === 0) return;

    const { error } = await getAdminClient()
      .from('items')
      .insert(names.map((name, position) => ({ list_id: listId, name, position })));

    if (error) throw new RepositoryError('Failed to create items', error);
  },

  async update(id, listId, data) {
    const { data: updated, error } = await getAdminClient()
      .from('items')
      .update(data)
      .eq('id', id)
      .eq('list_id', listId)
      .select()
      .maybeSingle();

    if (error) throw new RepositoryError('Failed to update item', error);

    return (updated as Item | null) ?? null;
  },

  async delete(id, listId) {
    const { error, count } = await getAdminClient()
      .from('items')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('list_id', listId);

    if (error) throw new RepositoryError('Failed to delete item', error);

    return (count ?? 0) > 0;
  },
};
