import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { POST } from '@/app/api/workspaces/access/route';
import { NextRequest } from 'next/server';
import { hash, computeLookup } from '@/lib/auth/passphrase';

// Only the outbound dependencies are mocked. `@/lib/auth/passphrase` is
// deliberately NOT mocked: the candidate-repair path it provides is the whole
// point of these tests, and mocking it would hide whether repair actually works.
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

vi.mock('@/lib/auth/session', () => ({
  createSession: vi.fn(),
}));

vi.mock('@/lib/repositories', async (importOriginal) => {
  // RepositoryError must stay the real class, or `instanceof` stops working.
  const actual = await importOriginal<typeof import('@/lib/repositories')>();
  return { ...actual, getRepositories: vi.fn() };
});

import { createSession } from '@/lib/auth/session';
import { getRepositories, RepositoryError } from '@/lib/repositories';
import { logger } from '@/lib/logger';

/**
 * The passphrase a workspace was created with. All five are real dictionary
 * entries, and the three accented ones have no unaccented homograph in the
 * dictionary, so repair from mangled input is unambiguous.
 */
const ORIGINAL = 'absorción anillo académico animal ácido';

/** What a mobile keyboard produces: capitalised first word, accents dropped. */
const MANGLED = 'Absorcion anillo academico animal acido';

const WORKSPACE_ID = '11111111-2222-3333-4444-555555555555';

function buildRequest(passphrase: unknown, forwardedFor?: string) {
  return new NextRequest('http://localhost/api/workspaces/access', {
    method: 'POST',
    body: JSON.stringify(passphrase === undefined ? {} : { passphrase }),
    headers: forwardedFor ? { 'x-forwarded-for': forwardedFor } : undefined,
  });
}

/** A repository failure, shaped as the layer really raises it. */
function repositoryFailure(message: string) {
  return new RepositoryError(message, { code: '57014', message: 'statement timeout' });
}

describe('/api/workspaces/access', () => {
  let passphraseHash: string;
  let findByLookups: ReturnType<typeof vi.fn>;
  let countFailedSince: ReturnType<typeof vi.fn>;
  let record: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    process.env.SERVER_SECRET = 'test-secret-key-at-least-32-characters-long-12345';
    passphraseHash = await hash(ORIGINAL);
  });

  /** Point the workspace lookup at a stored row, or at no rows at all. */
  function seedWorkspace(stored: boolean) {
    findByLookups.mockResolvedValue(
      stored
        ? [
            {
              id: WORKSPACE_ID,
              passphrase_hash: passphraseHash,
              passphrase_lookup: computeLookup(ORIGINAL),
            },
          ]
        : []
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();

    findByLookups = vi.fn();
    countFailedSince = vi.fn().mockResolvedValue(0);
    record = vi.fn().mockResolvedValue(undefined);
    seedWorkspace(true);

    vi.mocked(getRepositories).mockReturnValue({
      workspaces: { findByLookups },
      rateLimits: { countFailedSince, record },
    } as unknown as ReturnType<typeof getRepositories>);
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

    // The two bounds below exist so oversized input can never reach candidate
    // expansion. Rejecting before any query is the property that matters.
    it('returns 400 for a passphrase longer than 200 characters', async () => {
      const tooLong = ['a'.repeat(51), 'a'.repeat(49), 'a'.repeat(49), 'a'.repeat(49)].join(' ');

      const res = await POST(buildRequest(tooLong));

      expect(res.status).toBe(400);
      expect(findByLookups).not.toHaveBeenCalled();
      expect(record).not.toHaveBeenCalled();
    });

    it('returns 400 for a passphrase with more than 12 words', async () => {
      const tooManyWords = Array.from({ length: 13 }, () => 'mesa').join(' ');

      const res = await POST(buildRequest(tooManyWords));

      expect(res.status).toBe(400);
      expect(findByLookups).not.toHaveBeenCalled();
      expect(record).not.toHaveBeenCalled();
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

      expect(findByLookups).toHaveBeenCalledTimes(1);
      expect(findByLookups.mock.calls[0][0]).toContain(computeLookup(ORIGINAL));
    });

    it('rejects an unknown passphrase and records the failed attempt', async () => {
      seedWorkspace(false);

      const res = await POST(buildRequest(ORIGINAL));

      expect(res.status).toBe(401);
      expect(createSession).not.toHaveBeenCalled();
      expect(record).toHaveBeenCalledWith(null, false, expect.any(Date));
    });

    it('rejects a row whose lookup matches but whose hash does not', async () => {
      // Defence in depth: the HMAC lookup alone must never grant access.
      findByLookups.mockResolvedValue([
        {
          id: WORKSPACE_ID,
          passphrase_hash: await hash('anillo animal anoche ansia anhelo'),
          passphrase_lookup: computeLookup(ORIGINAL),
        },
      ]);

      const res = await POST(buildRequest(ORIGINAL));

      expect(res.status).toBe(401);
      expect(createSession).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('keys on the client, not on the proxy chain it arrived through', async () => {
      // Otherwise the same client counts as a new address per chain, and the
      // ten-attempt budget can be walked past by varying the route in.
      seedWorkspace(false);

      await POST(buildRequest(ORIGINAL, '203.0.113.7, 70.41.3.18'));

      expect(countFailedSince).toHaveBeenCalledWith('203.0.113.7', expect.any(Date));
      expect(record).toHaveBeenCalledWith('203.0.113.7', false, expect.any(Date));
    });

    it('keys on null when no usable address arrives', async () => {
      // The literal 'unknown' used to go here. It is not an address, and the
      // read that uses it runs before anyone is authenticated.
      seedWorkspace(false);

      await POST(buildRequest(ORIGINAL));

      expect(countFailedSince).toHaveBeenCalledWith(null, expect.any(Date));
      expect(record).toHaveBeenCalledWith(null, false, expect.any(Date));
    });

    it('returns 429 once the failed-attempt threshold is reached', async () => {
      countFailedSince.mockResolvedValue(10);

      const res = await POST(buildRequest(ORIGINAL));

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('900');
    });

    it('returns 500 when the rate-limit query itself fails', async () => {
      countFailedSince.mockRejectedValue(repositoryFailure('Failed to count failed attempts'));

      const res = await POST(buildRequest(ORIGINAL));

      expect(res.status).toBe(500);
      expect(findByLookups).not.toHaveBeenCalled();
    });

    it('logs a failure to record the attempt instead of discarding it', async () => {
      // If this write fails silently the limiter stops counting and nothing
      // says so -- during exactly the degradation where it matters most.
      seedWorkspace(false);
      record.mockRejectedValue(repositoryFailure('Failed to record attempt'));

      const res = await POST(buildRequest(ORIGINAL));

      expect(res.status).toBe(401);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed attempt not recorded',
        expect.objectContaining({ message: 'Failed to record attempt' }),
        expect.anything()
      );
    });

    it('still authenticates when recording a successful attempt fails', async () => {
      // The limiter degrading must never cost a valid passphrase its session.
      record.mockRejectedValue(repositoryFailure('Failed to record attempt'));

      const res = await POST(buildRequest(ORIGINAL));

      expect(res.status).toBe(200);
      expect(createSession).toHaveBeenCalledWith(WORKSPACE_ID);
      expect(logger.error).toHaveBeenCalledWith(
        'Successful attempt not recorded',
        expect.anything(),
        expect.anything()
      );
    });

    // A degraded database must never be charged to the caller: an infrastructure
    // failure is not a wrong guess, so it costs no attempt and reveals nothing
    // about whether the passphrase was valid.
    it('returns 500 without recording an attempt when the workspace lookup fails', async () => {
      findByLookups.mockRejectedValue(repositoryFailure('Failed to look up workspaces'));

      const res = await POST(buildRequest(ORIGINAL));

      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({ error: 'Internal server error' });
      expect(record).not.toHaveBeenCalled();
      expect(createSession).not.toHaveBeenCalled();
    });
  });
});
