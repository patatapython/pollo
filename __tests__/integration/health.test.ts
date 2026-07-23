import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type postgres from 'postgres';
import { connectOrFail, applySchema, databaseUrl } from './helpers/database';

process.env.DATABASE_URL = databaseUrl();

const { postgresHealthRepository: repo } = await import(
  '@/lib/repositories/postgres/health'
);

let sql: postgres.Sql;

beforeAll(async () => {
  sql = await connectOrFail();
  await applySchema(sql);
});

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

describe('postgres health probe', () => {
  it('resolves against a database that answers', async () => {
    await expect(repo.ping()).resolves.toBeUndefined();
  });

  /**
   * The probe must not depend on there being any data. pollo's production
   * database was deliberately started empty, so a probe that asserted rows
   * exist would have reported the freshly cut-over deployment as permanently
   * unhealthy — and the orchestrator would have restart-looped a container
   * that was working perfectly.
   */
  it('stays healthy against a database with no rows at all', async () => {
    await sql`TRUNCATE workspaces CASCADE`;
    await sql`TRUNCATE rate_limit_attempts`;

    await expect(repo.ping()).resolves.toBeUndefined();
  });

  /**
   * The case the probe exists for. Asserted against a real unreachable server
   * rather than a mock, because what has to be caught here is a connection
   * failure raised by the driver, and a mock would prove only that the code
   * rethrows something we invented ourselves.
   *
   * Getting a client that points somewhere else takes more ceremony than it
   * looks: `lib/db/client.ts` memoises the pool in module scope *and*, outside
   * production, on `globalThis` so Next's hot reload cannot leak pools. Both
   * caches have to be cleared or the fresh module re-adopts the working pool
   * and this test passes while proving nothing — which is exactly what the
   * first version of it did.
   */
  it('raises RepositoryError when the database cannot be reached', async () => {
    const original = process.env.DATABASE_URL;
    const globalForDb = globalThis as unknown as { pollodb?: postgres.Sql };
    const cachedPool = globalForDb.pollodb;

    // Port 1 answers nothing on any host, so this is a refused connection and
    // not a slow query: the probe must surface it rather than hang.
    process.env.DATABASE_URL = 'postgres://pollo:pollo@127.0.0.1:1/pollo';
    delete globalForDb.pollodb;
    vi.resetModules();

    // Both from the *same* fresh registry. Importing the class from the outer
    // one instead makes `toBeInstanceOf` fail against an error that is in fact
    // a RepositoryError, because resetModules hands out a second copy of the
    // module and therefore a second, unrelated class object.
    const { postgresHealthRepository: broken } = await import(
      '@/lib/repositories/postgres/health'
    );
    const { RepositoryError } = await import('@/lib/repositories/types');

    try {
      await expect(broken.ping()).rejects.toBeInstanceOf(RepositoryError);
    } finally {
      process.env.DATABASE_URL = original;
      globalForDb.pollodb = cachedPool;
      vi.resetModules();
    }
  });
});
