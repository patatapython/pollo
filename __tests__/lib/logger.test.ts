import { describe, it, expect, vi, afterEach } from 'vitest';
import { Logger, redactError, redactContext } from '@/lib/logger';

/**
 * Production used to print the message alone and drop the error and the context
 * entirely, so an incident surfaced as `🔴 Workspace lookup error` with no
 * Postgres code and no endpoint. These lock in the opposite property: enough to
 * diagnose, never enough to leak a payload.
 */
describe('logger', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('redactError', () => {
    it('keeps the fields that identify a database failure', () => {
      const result = redactError({
        code: '23505',
        message: 'duplicate key value violates unique constraint',
        details: 'Key (passphrase_lookup)=(9f2a...) already exists.',
        hint: null,
      });

      expect(result).toEqual({
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      });
    });

    it('drops details and hint, which echo row values back', () => {
      const result = redactError({ code: '23505', details: 'Key (email)=(a@b.c) exists.' });

      expect(result).not.toHaveProperty('details');
      expect(JSON.stringify(result)).not.toContain('a@b.c');
    });

    it('truncates an oversized message rather than printing a payload', () => {
      const result = redactError({ message: 'x'.repeat(500) }) as { message: string };

      expect(result.message).toHaveLength(201);
      expect(result.message.endsWith('…')).toBe(true);
    });

    it('reports the shape of an error it cannot read', () => {
      expect(redactError({})).toEqual({ type: 'unknown error' });
      expect(redactError(undefined)).toBeUndefined();
    });

    it('drops the message of an error that quotes the input back', () => {
      // V8 puts ten characters of the parsed text into a JSON SyntaxError. On
      // the access endpoint that text is the request body: a passphrase.
      let parseError: unknown;
      try {
        JSON.parse('absorcion anillo academico animal acido');
      } catch (e) {
        parseError = e;
      }

      const result = redactError(parseError) as { name: string; message?: string };

      expect(result.name).toBe('SyntaxError');
      expect(result.message).toBeUndefined();
      expect(JSON.stringify(result)).not.toContain('absorcion');
    });

    it('unwraps the cause, where a wrapped error keeps what actually failed', () => {
      // A RepositoryError says "Failed to fetch list", which names nothing. The
      // Postgres code underneath is the only part that identifies the failure.
      const wrapped = new Error('Failed to fetch list');
      (wrapped as Error & { cause: unknown }).cause = { code: '57014', message: 'canceling statement due to statement timeout' };

      const result = redactError(wrapped) as { message: string; cause: { code: string } };

      expect(result.message).toBe('Failed to fetch list');
      expect(result.cause.code).toBe('57014');
    });

    it('terminates on a cause cycle instead of taking the handler down with it', () => {
      // Descending the cause chain is unbounded, so two errors pointing at each
      // other recurse forever. The throw lands inside logger.error(), which only
      // ever runs while a failure is already being handled: the redaction turns
      // one logged incident into an unhandled RangeError.
      const outer = new Error('Failed to fetch list') as Error & { cause: unknown };
      const inner = new Error('connection terminated') as Error & { cause: unknown };
      outer.cause = inner;
      inner.cause = outer;

      expect(() => redactError(outer)).not.toThrow();
      expect(JSON.stringify(redactError(outer))).toContain('connection terminated');
    });

    it('stops descending a cause chain that is merely very long', () => {
      // Asserting "does not throw" here would be green for the wrong reason:
      // 5000 levels do not exhaust the stack on their own. What matters is that
      // the output is bounded, so a log line can never become a payload of
      // arbitrary size either.
      let deepest: Error & { cause?: unknown } = new Error('root cause');
      for (let i = 0; i < 5000; i++) {
        const wrapper = new Error(`layer ${i}`) as Error & { cause?: unknown };
        wrapper.cause = deepest;
        deepest = wrapper;
      }

      let depth = 0;
      let node = redactError(deepest) as { cause?: unknown } | undefined;
      while (node && typeof node === 'object' && 'cause' in node) {
        depth++;
        node = node.cause as { cause?: unknown } | undefined;
      }

      expect(depth).toBeLessThan(20);
    });

    it('keeps a native Error identifiable', () => {
      const result = redactError(new Error('boom')) as { name: string; message: string };

      expect(result.name).toBe('Error');
      expect(result.message).toBe('boom');
    });
  });

  describe('redactContext', () => {
    it('keeps route metadata intact, since that is the diagnostic value', () => {
      expect(redactContext({ endpoint: '/api/lists/[id]', method: 'GET' })).toEqual({
        endpoint: '/api/lists/[id]',
        method: 'GET',
      });
    });

    it('replaces a structured value with its type, because payloads hide there', () => {
      const result = redactContext({ error: { secret: 'passphrase' }, rows: [1, 2] });

      expect(result).toEqual({ error: '[object]', rows: '[object]' });
      expect(JSON.stringify(result)).not.toContain('passphrase');
    });
  });

  describe('error() in production', () => {
    it('prints the redacted cause instead of the bare message', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      new Logger().error(
        'Workspace lookup error',
        { code: 'PGRST301', message: 'JWT expired', details: 'row data' },
        { endpoint: '/api/workspaces/access' }
      );

      expect(spy).toHaveBeenCalledWith('🔴 Workspace lookup error', {
        error: { code: 'PGRST301', message: 'JWT expired' },
        context: { endpoint: '/api/workspaces/access' },
      });
    });
  });
});
