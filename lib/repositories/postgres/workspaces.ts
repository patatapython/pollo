import { getSql } from '@/lib/db/client';
import {
  RepositoryError,
  Workspace,
  WorkspaceRepository,
} from '@/lib/repositories/types';

export const postgresWorkspaceRepository: WorkspaceRepository = {
  async create(passphraseHash, passphraseLookup) {
    try {
      const rows = await getSql()<{ id: string }[]>`
        INSERT INTO workspaces (passphrase_hash, passphrase_lookup)
        VALUES (${passphraseHash}, ${passphraseLookup})
        RETURNING id
      `;
      return rows[0].id;
    } catch (error) {
      throw new RepositoryError('Failed to create workspace', error);
    }
  },

  /**
   * Una sola consulta para todos los candidatos. El `UNIQUE` de
   * `passphrase_lookup` garantiza que cada candidato encaje con una fila como
   * mucho, que es lo que mantiene bcrypt en una ejecucion por peticion. Ver
   * docs/auth-invariants.md.
   */
  async findByLookups(lookups) {
    if (lookups.length === 0) return [];

    try {
      const rows = await getSql()<Workspace[]>`
        SELECT id, passphrase_hash, passphrase_lookup
        FROM workspaces
        WHERE passphrase_lookup = ANY(${lookups})
      `;
      return rows.map((row) => ({
        id: row.id,
        passphrase_hash: row.passphrase_hash,
        passphrase_lookup: row.passphrase_lookup,
      }));
    } catch (error) {
      throw new RepositoryError('Failed to look up workspaces', error);
    }
  },
};
