import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type postgres from 'postgres';
import { connectOrFail, applySchema, truncateAll, databaseUrl } from './helpers/database';

process.env.DATABASE_URL = databaseUrl();

const { postgresItemRepository: items } = await import('@/lib/repositories/postgres/items');
const { postgresListRepository: lists } = await import('@/lib/repositories/postgres/lists');
const { postgresWorkspaceRepository: workspaces } = await import(
  '@/lib/repositories/postgres/workspaces'
);

let sql: postgres.Sql;
let listId: string;
let otherListId: string;

beforeAll(async () => {
  sql = await connectOrFail();
  await applySchema(sql);
});

beforeEach(async () => {
  await truncateAll(sql);
  const workspaceId = await workspaces.create('$2b$12$a', 'lookup-a');
  listId = (await lists.create(workspaceId, 'Compra')).id;
  otherListId = (await lists.create(workspaceId, 'Otra')).id;
});

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

describe('postgres item repository', () => {
  it('creates an item pending, never already purchased', async () => {
    const item = await items.create(listId, { name: 'Leche' });

    expect(item.is_completed).toBe(false);
    expect(item.completed_at).toBeNull();
  });

  it('puts pending items before purchased ones', async () => {
    const bought = await items.create(listId, { name: 'Pan' });
    await items.create(listId, { name: 'Leche' });
    await items.update(bought.id, listId, { is_completed: true });

    const all = await items.findByList(listId);

    expect(all.map((i) => i.name)).toEqual(['Leche', 'Pan']);
  });

  it('filters by status', async () => {
    const bought = await items.create(listId, { name: 'Pan' });
    await items.create(listId, { name: 'Leche' });
    await items.update(bought.id, listId, { is_completed: true });

    expect((await items.findByList(listId, 'active')).map((i) => i.name)).toEqual(['Leche']);
    expect((await items.findByList(listId, 'purchased')).map((i) => i.name)).toEqual(['Pan']);
    expect(await items.findByList(listId, 'all')).toHaveLength(2);
  });

  it('never reaches into another list', async () => {
    const item = await items.create(listId, { name: 'Leche' });

    expect(await items.findById(item.id, otherListId)).toBeNull();
    expect(await items.update(item.id, otherListId, { name: 'Robado' })).toBeNull();
    expect(await items.delete(item.id, otherListId)).toBe(false);
    expect((await items.findById(item.id, listId))?.name).toBe('Leche');
  });

  /**
   * completed_at is written by the set_completed_at trigger, not by this code.
   * The repository must not set it, and the trigger must be there for the
   * column to mean anything — which only a real database can confirm.
   */
  it('lets the trigger stamp completed_at when an item is purchased', async () => {
    const item = await items.create(listId, { name: 'Leche' });

    const bought = await items.update(item.id, listId, { is_completed: true });
    expect(bought?.completed_at).not.toBeNull();

    const undone = await items.update(item.id, listId, { is_completed: false });
    expect(undone?.completed_at).toBeNull();
  });

  it('touches updated_at on every write, also through the trigger', async () => {
    const item = await items.create(listId, { name: 'Leche' });

    const renamed = await items.update(item.id, listId, { name: 'Leche entera' });

    expect(new Date(renamed!.updated_at).getTime()).toBeGreaterThan(
      new Date(item.updated_at).getTime()
    );
  });

  it('updates one field without clearing the others', async () => {
    const item = await items.create(listId, { name: 'Leche', position: 3 });
    await items.update(item.id, listId, { is_completed: true });

    const renamed = await items.update(item.id, listId, { name: 'Leche entera' });

    expect(renamed?.name).toBe('Leche entera');
    expect(renamed?.is_completed).toBe(true);
    expect(renamed?.position).toBe(3);
  });

  it('returns the row unchanged when asked to update nothing', async () => {
    const item = await items.create(listId, { name: 'Leche' });

    const result = await items.update(item.id, listId, {});

    expect(result?.name).toBe('Leche');
  });

  it('stores a batch in the order it was given', async () => {
    await items.createMany(listId, ['Leche', 'Pan', 'Huevos']);

    const stored = await items.findByList(listId);

    expect(stored.map((i) => [i.name, i.position])).toEqual([
      ['Leche', 0],
      ['Pan', 1],
      ['Huevos', 2],
    ]);
  });

  it('accepts an empty batch as a no-op', async () => {
    await expect(items.createMany(listId, [])).resolves.toBeUndefined();
    expect(await items.findByList(listId)).toEqual([]);
  });

  it('reports whether a delete actually removed anything', async () => {
    const item = await items.create(listId, { name: 'Leche' });

    expect(await items.delete(item.id, listId)).toBe(true);
    expect(await items.delete(item.id, listId)).toBe(false);
  });
});
