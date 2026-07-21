import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { POST } from '@/app/api/workspaces/access/route';
import { NextRequest } from 'next/server';
import { hash, computeLookup } from '@/lib/auth/passphrase';

// Only the outbound dependencies are mocked. `@/lib/auth/passphrase` is
// deliberately NOT mocked: the candidate-repair path it provides is the whole
// point of these tests, and mocking it would hide whether repair actually works.
vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

vi.mock('@/lib/auth/session', () => ({
  createSession: vi.fn(),
}));

import { getAdminClient } from '@/lib/supabase/admin';
import { createSession } from '@/lib/auth/session';

/**
 * The passphrase a workspace was created with. All five are real dictionary
 * entries, and the three accented ones have no unaccented homograph in the
 * dictionary, so repair from mangled input is unambiguous.
 */
const ORIGINAL = 'absorción anillo académico animal ácido';

/** What a mobile keyboard produces: capitalised first word, accents dropped. */
const MANGLED = 'Absorcion anillo academico animal acido';

const WORKSPACE_ID = '11111111-2222-3333-4444-555555555555';

type QueryResult = { data?: unknown; count?: number | null; error?: unknown };

const BUILDER_METHODS = ['select', 'eq', 'gt', 'lt', 'in', 'insert', 'single'] as const;

type MockBuilder = Record<(typeof BUILDER_METHODS)[number], ReturnType<typeof vi.fn>> & {
  then: (resolve: (value: QueryResult) => unknown) => unknown;
};

/** Chainable, awaitable stand-in for a PostgREST query builder. */
function makeBuilder(result: QueryResult): MockBuilder {
  const builder = {} as MockBuilder;
  for (const method of BUILDER_METHODS) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = (resolve: (value: QueryResult) => unknown) => resolve(result);
  return builder;
}

function buildRequest(passphrase: unknown) {
  return new NextRequest('http://localhost/api/workspaces/access', {
    method: 'POST',
    body: JSON.stringify(passphrase === undefined ? {} : { passphrase }),
  });
}

describe('/api/workspaces/access', () => {
  let passphraseHash: string;
  let rateLimit: MockBuilder;
  let workspaces: MockBuilder;

  beforeAll(async () => {
    process.env.SERVER_SECRET = 'test-secret-key-at-least-32-characters-long-12345';
    passphraseHash = await hash(ORIGINAL);
  });

  /** Point the `workspaces` table at a stored row, or at no rows at all. */
  function seedWorkspace(stored: boolean) {
    workspaces = makeBuilder({
      data: stored
        ? [
            {
              id: WORKSPACE_ID,
              passphrase_hash: passphraseHash,
              passphrase_lookup: computeLookup(ORIGINAL),
            },
          ]
        : [],
      error: null,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();

    rateLimit = makeBuilder({ count: 0, error: null });
    seedWorkspace(true);

    vi.mocked(getAdminClient).mockReturnValue({
      from: vi.fn((table: string) => (table === 'workspaces' ? workspaces : rateLimit)),
    } as unknown as ReturnType<typeof getAdminClient>);
  });

  describe('input validation', () => {
    it('returns 400 for a passphrase that is too short', async () => {
      const res = await POST(buildRequest('123'));
      expect(res.status).toBe(400);
    });

    it('returns 400 when the passphrase field is missing', async () => {
      const res = await POST(buildRequest(undefined));
      expect(res.status).toBe(400);
    });

    it('returns 400 rather than 500, so the message reaches the caller', async () => {
      const res = await POST(buildRequest('123'));
      await expect(res.json()).resolves.toHaveProperty('error');
      expect(res.status).not.toBe(500);
    });
  });

  describe('authentication', () => {
    it('authenticates a passphrase typed exactly as issued', async () => {
      const res = await POST(buildRequest(ORIGINAL));

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ id: WORKSPACE_ID });
      expect(createSession).toHaveBeenCalledWith(WORKSPACE_ID);
    });

    it('authenticates input mangled by a mobile keyboard', async () => {
      const res = await POST(buildRequest(MANGLED));

      expect(res.status).toBe(200);
      expect(createSession).toHaveBeenCalledWith(WORKSPACE_ID);
    });

    it('queries the stored lookup among the candidate lookups', async () => {
      await POST(buildRequest(MANGLED));

      expect(workspaces.in).toHaveBeenCalledTimes(1);
      const [column, lookups] = workspaces.in.mock.calls[0];
      expect(column).toBe('passphrase_lookup');
      expect(lookups).toContain(computeLookup(ORIGINAL));
    });

    it('rejects an unknown passphrase and records the failed attempt', async () => {
      seedWorkspace(false);

      const res = await POST(buildRequest(ORIGINAL));

      expect(res.status).toBe(401);
      expect(createSession).not.toHaveBeenCalled();
      expect(rateLimit.insert).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('rejects a row whose lookup matches but whose hash does not', async () => {
      // Defence in depth: the HMAC lookup alone must never grant access.
      workspaces = makeBuilder({
        data: [
          {
            id: WORKSPACE_ID,
            passphrase_hash: await hash('anillo animal anoche ansia anhelo'),
            passphrase_lookup: computeLookup(ORIGINAL),
          },
        ],
        error: null,
      });

      const res = await POST(buildRequest(ORIGINAL));

      expect(res.status).toBe(401);
      expect(createSession).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('returns 429 once the failed-attempt threshold is reached', async () => {
      rateLimit = makeBuilder({ count: 10, error: null });

      const res = await POST(buildRequest(ORIGINAL));

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('900');
    });

    it('returns 500 when the rate-limit query itself fails', async () => {
      rateLimit = makeBuilder({ count: null, error: { message: 'boom' } });

      const res = await POST(buildRequest(ORIGINAL));

      expect(res.status).toBe(500);
    });
  });
});
