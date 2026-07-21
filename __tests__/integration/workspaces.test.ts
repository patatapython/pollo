import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type postgres from 'postgres';
import { connectOrFail, applySchema, truncateAll, databaseUrl } from './helpers/database';

process.env.DATABASE_URL = databaseUrl();

const { postgresWorkspaceRepository: repo } = await import(
  '@/lib/repositories/postgres/workspaces'
);

let sql: postgres.Sql;

beforeAll(async () => {
  sql = await connectOrFail();
  await applySchema(sql);
});

beforeEach(async () => {
  await truncateAll(sql);
});

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

describe('postgres workspace repository', () => {
  it('round-trips a credential through create and lookup', async () => {
    const id = await repo.create('$2b$12$hash', 'lookup-a');

    const found = await repo.findByLookups(['lookup-a']);

    expect(found).toEqual([
      { id, passphrase_hash: '$2b$12$hash', passphrase_lookup: 'lookup-a' },
    ]);
  });

  /**
   * The access route hands every candidate to a single call. Matching one at a
   * time would be one round trip per candidate, up to MAX_CANDIDATES of them.
   */
  it('matches any of the candidates in one query', async () => {
    const wanted = await repo.create('$2b$12$wanted', 'lookup-b');
    await repo.create('$2b$12$other', 'lookup-z');

    const found = await repo.findByLookups(['lookup-a', 'lookup-b', 'lookup-c']);

    expect(found.map((w) => w.id)).toEqual([wanted]);
  });

  it('returns nothing for an unknown lookup, rather than failing', async () => {
    await repo.create('$2b$12$hash', 'lookup-a');

    expect(await repo.findByLookups(['nope'])).toEqual([]);
  });

  it('answers an empty candidate list without touching the database', async () => {
    expect(await repo.findByLookups([])).toEqual([]);
  });

  /**
   * The unique index is what keeps bcrypt to one run per request: each
   * candidate can match at most one row. If a duplicate could ever be stored,
   * a single request would verify against several hashes. See
   * docs/auth-invariants.md.
   */
  it('refuses a duplicate lookup, which is what bounds bcrypt per request', async () => {
    await repo.create('$2b$12$first', 'same-lookup');

    await expect(repo.create('$2b$12$second', 'same-lookup')).rejects.toThrow(
      'Failed to create workspace'
    );

    const rows = await sql`SELECT COUNT(*)::int AS count FROM workspaces`;
    expect(rows[0].count).toBe(1);
  });
});
