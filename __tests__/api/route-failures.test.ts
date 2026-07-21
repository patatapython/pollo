import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * A database failure must never be reported as "not found".
 *
 * `lists-id.test.ts` pins that for GET /api/lists/[id]. This file covers the
 * other eight call sites, which a loopback proved could all be regressed to the
 * old 404-on-outage behavior without turning the suite red.
 *
 * Each case makes exactly one repository call fail and asserts the route
 * answers 500. The list-ownership lookups and the item lookups are exercised
 * separately, because they are separate helpers that were separately swallowing.
 */
vi.mock('@/lib/auth/session', () => ({ verifySession: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

vi.mock('@/lib/repositories', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/repositories')>();
  return { ...actual, getRepositories: vi.fn() };
});

import { PATCH as patchList, DELETE as deleteList } from '@/app/api/lists/[id]/route';
import { GET as getItems, POST as postItem } from '@/app/api/lists/[id]/items/route';
import { PATCH as patchItem, DELETE as deleteItem } from '@/app/api/lists/[id]/items/[itemId]/route';
import { verifySession } from '@/lib/auth/session';
import { getRepositories, RepositoryError } from '@/lib/repositories';

const LIST_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const ITEM_ID = '11111111-2222-3333-4444-555555555555';
const WORKSPACE = 'ws-123';

const LIST = { id: LIST_ID, workspace_id: WORKSPACE, name: 'compra', position: 0 };
const ITEM = { id: ITEM_ID, list_id: LIST_ID, name: 'Pan', is_completed: false, position: 0 };

const listParams = { params: Promise.resolve({ id: LIST_ID }) };
const itemParams = { params: Promise.resolve({ id: LIST_ID, itemId: ITEM_ID }) };

function request(body?: unknown) {
  return new NextRequest(`http://localhost/api/lists/${LIST_ID}`, {
    method: body === undefined ? 'GET' : 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** A failure of the kind the repository layer really raises. */
const outage = () => new RepositoryError('query failed', { code: '57014' });

/**
 * Wire the repositories, letting each method be either a resolved value or a
 * thrown outage. Anything unspecified resolves to a sensible success, so each
 * test fails exactly one call.
 */
function repositories(overrides: {
  findList?: unknown;
  findItem?: unknown;
  mutateList?: unknown;
  mutateItem?: unknown;
}) {
  const settle = (value: unknown, fallback: unknown) =>
    value instanceof RepositoryError
      ? vi.fn().mockRejectedValue(value)
      : vi.fn().mockResolvedValue(value === undefined ? fallback : value);

  vi.mocked(getRepositories).mockReturnValue({
    lists: {
      findById: settle(overrides.findList, LIST),
      update: settle(overrides.mutateList, LIST),
      delete: settle(overrides.mutateList, true),
    },
    items: {
      findById: settle(overrides.findItem, ITEM),
      update: settle(overrides.mutateItem, ITEM),
      delete: settle(overrides.mutateItem, true),
    },
  } as unknown as ReturnType<typeof getRepositories>);
}

describe('a failed query is never reported as not found', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifySession).mockResolvedValue({ workspaceId: WORKSPACE } as never);
  });

  describe('PATCH /api/lists/[id]', () => {
    it('returns 500 when the ownership lookup fails', async () => {
      repositories({ findList: outage() });
      const res = await patchList(request({ name: 'nueva' }), listParams);
      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /api/lists/[id]', () => {
    it('returns 500 when the ownership lookup fails', async () => {
      repositories({ findList: outage() });
      const res = await deleteList(request(), listParams);
      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/lists/[id]/items', () => {
    it('returns 500 when the ownership lookup fails', async () => {
      repositories({ findList: outage() });
      const res = await getItems(request(), listParams);
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/lists/[id]/items', () => {
    it('returns 500 when the ownership lookup fails', async () => {
      repositories({ findList: outage() });
      const res = await postItem(request({ name: 'Pan' }), listParams);
      expect(res.status).toBe(500);
    });
  });

  describe('PATCH /api/lists/[id]/items/[itemId]', () => {
    it('returns 500 when the ownership lookup fails', async () => {
      repositories({ findList: outage() });
      const res = await patchItem(request({ name: 'Pan integral' }), itemParams);
      expect(res.status).toBe(500);
    });

    it('returns 500 when the item lookup fails', async () => {
      repositories({ findItem: outage() });
      const res = await patchItem(request({ name: 'Pan integral' }), itemParams);
      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /api/lists/[id]/items/[itemId]', () => {
    it('returns 500 when the ownership lookup fails', async () => {
      repositories({ findList: outage() });
      const res = await deleteItem(request(), itemParams);
      expect(res.status).toBe(500);
    });

    it('returns 500 when the item lookup fails', async () => {
      repositories({ findItem: outage() });
      const res = await deleteItem(request(), itemParams);
      expect(res.status).toBe(500);
    });
  });

  describe('and a genuinely missing row is still a 404', () => {
    it('for an item that does not exist', async () => {
      repositories({ findItem: null });
      const res = await patchItem(request({ name: 'Pan integral' }), itemParams);
      expect(res.status).toBe(404);
    });

    it('for a list that does not exist', async () => {
      repositories({ findList: null });
      const res = await getItems(request(), listParams);
      expect(res.status).toBe(404);
    });
  });
});
