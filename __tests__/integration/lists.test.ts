import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type postgres from 'postgres';
import { connectOrFail, applySchema, truncateAll, databaseUrl } from './helpers/database';

process.env.DATABASE_URL = databaseUrl();

const { postgresListRepository: lists } = await import('@/lib/repositories/postgres/lists');
const { postgresItemRepository: items } = await import('@/lib/repositories/postgres/items');
const { postgresWorkspaceRepository: workspaces } = await import(
  '@/lib/repositories/postgres/workspaces'
);

let sql: postgres.Sql;
let workspaceId: string;
let otherWorkspaceId: string;

beforeAll(async () => {
  sql = await connectOrFail();
  await applySchema(sql);
});

beforeEach(async () => {
  await truncateAll(sql);
  workspaceId = await workspaces.create('$2b$12$a', 'lookup-a');
  otherWorkspaceId = await workspaces.create('$2b$12$b', 'lookup-b');
});

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

describe('postgres list repository', () => {
  /**
   * postgres.js hands back `Date` where PostgREST handed back a string, and
   * these values travel straight into the JSON the browser receives. Returning
   * a Date would change the shape of every route's response without any route
   * changing.
   */
  it('returns timestamps as ISO strings, the shape the API already sends', async () => {
    const list = await lists.create(workspaceId, 'Compra');

    expect(list.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(list.created_at).getTime()).not.toBeNaN();
  });

  it('scopes a lookup to its workspace, so a foreign list reads as absent', async () => {
    const list = await lists.create(workspaceId, 'Compra');

    expect(await lists.findById(list.id, workspaceId)).not.toBeNull();
    expect(await lists.findById(list.id, otherWorkspaceId)).toBeNull();
    // Without a workspace the row comes back as it is, and the caller decides.
    expect(await lists.findById(list.id)).not.toBeNull();
  });

  it('reports a miss as null rather than throwing', async () => {
    const absent = '00000000-0000-0000-0000-000000000000';
    expect(await lists.findById(absent, workspaceId)).toBeNull();
  });

  it('refuses to update or delete across workspaces', async () => {
    const list = await lists.create(workspaceId, 'Compra');

    expect(await lists.update(list.id, otherWorkspaceId, 'Robada')).toBeNull();
    expect(await lists.delete(list.id, otherWorkspaceId)).toBe(false);

    const survivor = await lists.findById(list.id, workspaceId);
    expect(survivor?.name).toBe('Compra');
  });

  it('reports whether a delete actually removed anything', async () => {
    const list = await lists.create(workspaceId, 'Compra');

    expect(await lists.delete(list.id, workspaceId)).toBe(true);
    expect(await lists.delete(list.id, workspaceId)).toBe(false);
  });

  it('takes the items with it, which is the schema cascade doing the work', async () => {
    const list = await lists.create(workspaceId, 'Compra');
    await items.create(list.id, { name: 'Leche' });

    await lists.delete(list.id, workspaceId);

    const rows = await sql`SELECT COUNT(*)::int AS count FROM items`;
    expect(rows[0].count).toBe(0);
  });

  describe('findByWorkspace', () => {
    it('orders by position and embeds each list its own items', async () => {
      const second = await lists.create(workspaceId, 'Segunda', 2);
      const first = await lists.create(workspaceId, 'Primera', 1);
      await items.create(second.id, { name: 'Pan', position: 0 });
      await items.create(first.id, { name: 'Leche', position: 0 });

      const { lists: page, total } = await lists.findByWorkspace(workspaceId);

      expect(page.map((l) => l.id)).toEqual([first.id, second.id]);
      expect(page[0].items.map((i) => i.name)).toEqual(['Leche']);
      expect(page[1].items.map((i) => i.name)).toEqual(['Pan']);
      expect(total).toBe(2);
    });

    it('gives an empty array to a list with no items, never undefined', async () => {
      await lists.create(workspaceId, 'Vacia');

      const { lists: page } = await lists.findByWorkspace(workspaceId);

      expect(page[0].items).toEqual([]);
    });

    it('never returns another workspace lists', async () => {
      await lists.create(otherWorkspaceId, 'Ajena');

      const { lists: page, total } = await lists.findByWorkspace(workspaceId);

      expect(page).toEqual([]);
      expect(total).toBe(0);
    });

    /**
     * The count is a separate query on purpose. Folded into the page query, an
     * offset past the end returns no rows at all and the total disappears with
     * them — which is exactly when pagination needs it to know there are
     * earlier pages.
     */
    it('still reports the total when the offset runs past the end', async () => {
      await lists.create(workspaceId, 'Primera', 1);
      await lists.create(workspaceId, 'Segunda', 2);

      const { lists: page, total } = await lists.findByWorkspace(workspaceId, {
        limit: 10,
        offset: 50,
      });

      expect(page).toEqual([]);
      expect(total).toBe(2);
    });

    it('pages without losing or repeating a list', async () => {
      for (let i = 1; i <= 5; i++) await lists.create(workspaceId, `Lista ${i}`, i);

      const first = await lists.findByWorkspace(workspaceId, { limit: 2, offset: 0 });
      const second = await lists.findByWorkspace(workspaceId, { limit: 2, offset: 2 });
      const third = await lists.findByWorkspace(workspaceId, { limit: 2, offset: 4 });

      const seen = [...first.lists, ...second.lists, ...third.lists].map((l) => l.name);
      expect(seen).toEqual(['Lista 1', 'Lista 2', 'Lista 3', 'Lista 4', 'Lista 5']);
      expect(first.total).toBe(5);
    });
  });
});
