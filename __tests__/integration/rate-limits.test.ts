import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type postgres from 'postgres';
import { connectOrFail, applySchema, truncateAll, databaseUrl } from './helpers/database';

process.env.DATABASE_URL = databaseUrl();

const { postgresRateLimitRepository: repo } = await import(
  '@/lib/repositories/postgres/rate-limits'
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

const MINUTE = 60 * 1000;

describe('postgres rate limit repository', () => {
  /**
   * The whole reason this layer was rewritten. Requests with no usable address
   * share one bucket, and that bucket is a NULL. Written with equality the
   * count is always zero, because `ip_address = NULL` is unknown rather than
   * false — unlimited attempts, no 429, and nothing in any log to say so.
   */
  it('counts the shared bucket of requests that carry no address', async () => {
    const now = new Date();
    await repo.record(null, false, new Date(now.getTime() - MINUTE));
    await repo.record(null, false, new Date(now.getTime() - 2 * MINUTE));

    const count = await repo.countFailedSince(null, new Date(now.getTime() - 15 * MINUTE));

    expect(count).toBe(2);
  });

  it('keeps the null bucket separate from a real address', async () => {
    const now = new Date();
    const since = new Date(now.getTime() - 15 * MINUTE);

    await repo.record(null, false, now);
    await repo.record('203.0.113.7', false, now);
    await repo.record('203.0.113.7', false, now);

    expect(await repo.countFailedSince(null, since)).toBe(1);
    expect(await repo.countFailedSince('203.0.113.7', since)).toBe(2);
    expect(await repo.countFailedSince('203.0.113.8', since)).toBe(0);
  });

  it('ignores successful attempts, which are not what the budget limits', async () => {
    const now = new Date();
    await repo.record('203.0.113.7', true, now);
    await repo.record('203.0.113.7', false, now);

    expect(
      await repo.countFailedSince('203.0.113.7', new Date(now.getTime() - MINUTE))
    ).toBe(1);
  });

  it('excludes an attempt exactly on the window boundary', async () => {
    // The window is strictly greater than `since`, matching what the previous
    // implementation did. An off-by-one here silently widens or narrows the
    // budget every request.
    const boundary = new Date('2026-07-21T12:00:00.000Z');
    await repo.record('203.0.113.7', false, boundary);

    expect(await repo.countFailedSince('203.0.113.7', boundary)).toBe(0);
    expect(
      await repo.countFailedSince('203.0.113.7', new Date(boundary.getTime() - 1))
    ).toBe(1);
  });

  it('stores an IPv6 address, since parseClientIp can return one', async () => {
    const now = new Date();
    await repo.record('2001:db8::1', false, now);

    expect(
      await repo.countFailedSince('2001:db8::1', new Date(now.getTime() - MINUTE))
    ).toBe(1);
  });

  it('rejects a value that is not an address, rather than storing it', async () => {
    // The column is INET now. 'unknown' used to be written here as text; it has
    // to fail loudly rather than come back as a silent bucket of its own.
    await expect(repo.record('unknown', false, new Date())).rejects.toThrow(
      'Failed to record attempt'
    );
  });

  it('deletes strictly older attempts and reports how many', async () => {
    const cutoff = new Date('2026-07-21T12:00:00.000Z');
    await repo.record('203.0.113.7', false, new Date(cutoff.getTime() - 1));
    await repo.record('203.0.113.7', false, cutoff);
    await repo.record('203.0.113.7', false, new Date(cutoff.getTime() + 1));

    expect(await repo.deleteOlderThan(cutoff)).toBe(1);

    const remaining = await sql`SELECT COUNT(*)::int AS count FROM rate_limit_attempts`;
    expect(remaining[0].count).toBe(2);
  });
});
