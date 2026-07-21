import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getRepositories } from '@/lib/repositories';
import { postgresListRepository } from '@/lib/repositories/postgres/lists';
import { supabaseListRepository } from '@/lib/repositories/supabase/lists';

/**
 * The routes never name a database. This is the one place that does, so it is
 * the one place worth asserting: pointing the app at the VPS must be a change
 * of environment, not a change of code.
 */
describe('repository selection', () => {
  const original = process.env.DB_DRIVER;

  beforeEach(() => {
    delete process.env.DB_DRIVER;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.DB_DRIVER;
    else process.env.DB_DRIVER = original;
  });

  it('serves the Supabase implementation by default', () => {
    expect(getRepositories().lists).toBe(supabaseListRepository);
  });

  it('serves the Postgres implementation when it is declared', () => {
    process.env.DB_DRIVER = 'postgres';

    const repositories = getRepositories();

    expect(repositories.lists).toBe(postgresListRepository);
    expect(repositories.items).not.toBe(supabaseListRepository);
  });

  /**
   * Resolved per call, not frozen at import. A module-level constant would bind
   * the choice to whenever the module first loaded, which in Next can be during
   * the build rather than at server start.
   */
  it('follows a change of driver without reloading the module', () => {
    expect(getRepositories().lists).toBe(supabaseListRepository);

    process.env.DB_DRIVER = 'postgres';

    expect(getRepositories().lists).toBe(postgresListRepository);
  });
});
