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
