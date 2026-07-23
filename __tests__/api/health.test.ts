import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * A health endpoint that answers 200 without touching the database is worse
 * than none: it reports health while the only dependency that can fail is
 * down, and the orchestrator keeps a broken container in service because it
 * was told everything is fine.
 *
 * So the contract asserted here is not "returns 200". It is:
 *   - reaching the database is what decides the answer;
 *   - an unreachable database produces 503, the code a container orchestrator
 *     acts on;
 *   - the failure detail never reaches the caller, because this endpoint is
 *     public and unauthenticated.
 */
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

vi.mock('@/lib/repositories', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/repositories')>();
  return { ...actual, getRepositories: vi.fn() };
});

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/health/route';
import { getRepositories, RepositoryError } from '@/lib/repositories';
import { logger } from '@/lib/logger';

const mockedGetRepositories = vi.mocked(getRepositories);

/**
 * What the container health check sends: curl against 127.0.0.1:3000.
 *
 * A real `NextRequest` cannot carry the header here. `host` is a forbidden
 * header name, and this suite runs under happy-dom, which enforces that rule
 * and silently drops it -- measured: the same construction yields
 * `'127.0.0.1:3000'` under plain node and `null` under happy-dom. So the route
 * would refuse every request in this suite for a reason that has nothing to do
 * with the route.
 *
 * The stub carries only what the handler reads. That the handler reads the real
 * thing correctly was measured against a running server rather than asserted
 * here: `Host: 127.0.0.1:3000` answered 200 and `Host: www.pollolist.app`
 * answered 404. If this ever looks wrong, fix the harness -- not the route.
 */
function probeRequest(host = '127.0.0.1:3000') {
  return {
    headers: { get: (name: string) => (name.toLowerCase() === 'host' ? host : null) },
  } as unknown as NextRequest;
}

function withPing(ping: () => Promise<void>) {
  mockedGetRepositories.mockReturnValue({
    health: { ping },
  } as unknown as ReturnType<typeof getRepositories>);
}

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('answers 200 when the database answers', async () => {
    withPing(async () => {});

    const response = await GET(probeRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });

  it('actually reaches the database rather than assuming it is there', async () => {
    const ping = vi.fn(async () => {});
    withPing(ping);

    await GET(probeRequest());

    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('answers 503 when the database is unreachable', async () => {
    withPing(async () => {
      throw new RepositoryError('connection refused', { code: 'ECONNREFUSED' });
    });

    const response = await GET(probeRequest());

    expect(response.status).toBe(503);
  });

  /**
   * 503 and not 500: an orchestrator treats 5xx alike, but a human reading the
   * probe log needs to tell "this instance cannot serve" from "this request
   * blew up".
   */
  it('answers 503 for any failure, not only RepositoryError', async () => {
    withPing(async () => {
      throw new TypeError('undefined is not a function');
    });

    const response = await GET(probeRequest());

    expect(response.status).toBe(503);
  });

  it('never leaks the failure detail to an unauthenticated caller', async () => {
    withPing(async () => {
      throw new RepositoryError(
        'connection refused',
        { connectionString: 'postgres://pollo:hunter2@db:5432/pollo' }
      );
    });

    const response = await GET(probeRequest());
    const body = JSON.stringify(await response.json());

    expect(body).not.toContain('hunter2');
    expect(body).not.toContain('postgres://');
    expect(body).not.toContain('connection refused');
    expect(body).toContain('unavailable');
  });

  it('records the failure on the server, where the detail belongs', async () => {
    const cause = new RepositoryError('connection refused');
    withPing(async () => {
      throw cause;
    });

    await GET(probeRequest());

    expect(logger.error).toHaveBeenCalled();
  });

  /**
   * The probe is reachable only over loopback. Nothing legitimate calls it from
   * the internet -- the container health check uses `curl 127.0.0.1:3000` --
   * and left public it is an unauthenticated endpoint that takes a connection
   * from a pool capped at 10, so it hands an attacker a cheap way to starve the
   * application *and* silence the probe that exists to notice.
   */
  describe('reachability', () => {
    it.each(['127.0.0.1:3000', 'localhost:3000', '127.0.0.1', '[::1]:3000'])(
      'answers the probe on %s',
      async (host) => {
        withPing(async () => {});

        const response = await GET(probeRequest(host));

        expect(response.status).toBe(200);
      }
    );

    it.each(['www.pollolist.app', 'pollolist.app', 'evil.example.com'])(
      'is invisible from %s',
      async (host) => {
        withPing(async () => {});

        const response = await GET(probeRequest(host));

        // 404 and not 403: from outside it should not even look like it exists.
        expect(response.status).toBe(404);
      }
    );

    /**
     * The refusal must come before the query, or blocking the endpoint would
     * still leave the database load it was blocked to prevent.
     */
    it('does not touch the database for a request it refuses', async () => {
      const ping = vi.fn(async () => {});
      withPing(ping);

      await GET(probeRequest('www.pollolist.app'));

      expect(ping).not.toHaveBeenCalled();
    });
  });

  /**
   * A probe answered from a cache is not a probe. Next will happily treat a
   * GET route handler as static and serve the first 200 forever, which would
   * make this endpoint report health from a build-time snapshot.
   */
  it('forbids caching of the answer', async () => {
    withPing(async () => {});

    const response = await GET(probeRequest());

    expect(response.headers.get('cache-control')).toContain('no-store');
  });
});
