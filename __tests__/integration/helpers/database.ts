import { readFileSync } from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

/**
 * The integration suite talks to a real PostgreSQL on purpose.
 *
 * Everything worth checking in the repository layer is SQL semantics: that
 * `IS NULL` is not `= NULL`, that a trigger fills `completed_at`, that deleting
 * a list takes its items with it, that the unique index on `passphrase_lookup`
 * actually rejects a duplicate. A test double returns whatever it is told to
 * return and would have confirmed the rate limiter worked while it counted
 * nothing at all — which is the defect this layer exists to have fixed.
 */

const DEFAULT_URL = 'postgres://postgres:dev@127.0.0.1:55432/pollo';

export function databaseUrl(): string {
  return process.env.TEST_DATABASE_URL ?? DEFAULT_URL;
}

/**
 * Fails loudly when no database answers.
 *
 * Deliberately not `describe.skip`. A suite that quietly skips reports success
 * for work it never did, which is the same failure as a test that cannot go
 * red: it is trusted precisely when it has stopped checking anything.
 */
export async function connectOrFail(): Promise<postgres.Sql> {
  const url = databaseUrl();
  // A single connection, not a pool: db/schema.sql carries its own
  // BEGIN/COMMIT, and postgres.js refuses transaction control on a pooled
  // connection because it cannot guarantee the statements land on the same one.
  const sql = postgres(url, { max: 1, connect_timeout: 5, onnotice: () => {} });

  try {
    await sql`SELECT 1`;
  } catch (error) {
    await sql.end({ timeout: 5 }).catch(() => {});
    throw new Error(
      `The integration suite needs a real PostgreSQL and none answered at ${url}.\n` +
        `Start one with:\n\n` +
        `  npm run test:db:up\n\n` +
        `or point TEST_DATABASE_URL at your own. Original error: ${String(error)}`
    );
  }

  return sql;
}

/** Applies db/schema.sql to an empty database, which also tests that it runs. */
export async function applySchema(sql: postgres.Sql): Promise<void> {
  const schema = readFileSync(path.resolve(process.cwd(), 'db/schema.sql'), 'utf8');

  await sql.unsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await sql.unsafe(schema);
}

export async function truncateAll(sql: postgres.Sql): Promise<void> {
  await sql.unsafe(
    'TRUNCATE workspaces, lists, items, rate_limit_attempts RESTART IDENTITY CASCADE'
  );
}
