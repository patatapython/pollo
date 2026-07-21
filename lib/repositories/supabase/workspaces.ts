import { getAdminClient } from '@/lib/supabase/admin';
import {
  RepositoryError,
  Workspace,
  WorkspaceRepository,
} from '@/lib/repositories/types';

export const supabaseWorkspaceRepository: WorkspaceRepository = {
  async create(passphraseHash, passphraseLookup) {
    const { data, error } = await getAdminClient()
      .from('workspaces')
      .insert({
        passphrase_hash: passphraseHash,
        passphrase_lookup: passphraseLookup,
      })
      .select('id')
      .single();

    if (error) throw new RepositoryError('Failed to create workspace', error);

    return (data as { id: string }).id;
  },

  async findByLookups(lookups) {
    if (lookups.length === 0) return [];

    const { data, error } = await getAdminClient()
      .from('workspaces')
      .select('id, passphrase_hash, passphrase_lookup')
      .in('passphrase_lookup', lookups);

    if (error) throw new RepositoryError('Failed to look up workspaces', error);

    return (data ?? []) as Workspace[];
  },
};
