import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * "I cannot find your list", "that list is not yours" and "the database did not
 * answer" used to collapse into a single 404. These pin them apart.
 *
 * Note what mocking a repository interface costs compared to the PostgREST
 * builder stub in lists.test.ts: three lines instead of a chainable thenable.
 */
vi.mock('@/lib/auth/session', () => ({ verifySession: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

vi.mock('@/lib/repositories', async (importOriginal) => {
  // RepositoryError must stay the real class, or `instanceof` stops working.
  const actual = await importOriginal<typeof import('@/lib/repositories')>();
  return { ...actual, getRepositories: vi.fn() };
});

import { GET } from '@/app/api/lists/[id]/route';
import { verifySession } from '@/lib/auth/session';
import { getRepositories, RepositoryError } from '@/lib/repositories';
import { logger } from '@/lib/logger';

const LIST_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function request() {
  return new NextRequest(`http://localhost/api/lists/${LIST_ID}`);
}

const params = { params: Promise.resolve({ id: LIST_ID }) };

/** Point `lists.findById` at a value to return, or an error to throw. */
function whenFindingList(outcome: { returns: unknown } | { throws: unknown }) {
  const findById =
    'throws' in outcome
      ? vi.fn().mockRejectedValue(outcome.throws)
      : vi.fn().mockResolvedValue(outcome.returns);

  vi.mocked(getRepositories).mockReturnValue({
    lists: { findById },
  } as unknown as ReturnType<typeof getRepositories>);

  return findById;
}

describe('GET /api/lists/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifySession).mockResolvedValue({ workspaceId: 'ws-123' } as never);
  });

  it('returns 500 when the database fails, not 404', async () => {
    // The defect this replaces: a query failure was indistinguishable from a
    // missing row, so an outage told the user their list did not exist.
    whenFindingList({ throws: new RepositoryError('Failed to fetch list', { code: '57014' }) });

    const res = await GET(request(), params);

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Internal server error' });
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns 404 when the list genuinely does not exist', async () => {
    whenFindingList({ returns: null });

    const res = await GET(request(), params);

    expect(res.status).toBe(404);
  });

  it('returns 403 when the list belongs to another workspace', async () => {
    whenFindingList({ returns: { id: LIST_ID, workspace_id: 'ws-other', name: 'ajena' } });

    const res = await GET(request(), params);

    expect(res.status).toBe(403);
  });
});
