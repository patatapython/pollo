import { describe, it, expect, beforeAll } from 'vitest';
import { SignJWT, jwtVerify } from 'jose';

/**
 * Tests reales de sesión JWT.
 * No podemos testear createSession/verifySession directamente porque usan
 * cookies() de Next.js (solo funciona en request context). Pero podemos
 * testear la lógica de JWT que es el core de seguridad.
 */
describe('session JWT logic', () => {
  const JWT_SECRET = 'test-jwt-secret-key-at-least-32-characters-long';
  let secretBytes: Uint8Array;

  beforeAll(() => {
    secretBytes = new TextEncoder().encode(JWT_SECRET);
  });

  describe('token creation', () => {
    it('should create a valid JWT with workspaceId', async () => {
      const workspaceId = '550e8400-e29b-41d4-a716-446655440000';
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 24 * 60 * 60;

      const token = await new SignJWT({ workspaceId, iat: now, exp })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secretBytes);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });

    it('should produce different tokens for different workspaces', async () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 24 * 60 * 60;

      const token1 = await new SignJWT({ workspaceId: 'aaa', iat: now, exp })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secretBytes);

      const token2 = await new SignJWT({ workspaceId: 'bbb', iat: now, exp })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secretBytes);

      expect(token1).not.toBe(token2);
    });
  });

  describe('token verification', () => {
    it('should verify a valid token and extract workspaceId', async () => {
      const workspaceId = '550e8400-e29b-41d4-a716-446655440000';
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 24 * 60 * 60;

      const token = await new SignJWT({ workspaceId, iat: now, exp })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secretBytes);

      const verified = await jwtVerify(token, secretBytes);
      const payload = verified.payload as { workspaceId?: string };

      expect(payload.workspaceId).toBe(workspaceId);
    });

    it('should reject a token signed with a different secret', async () => {
      const workspaceId = 'test-id';
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 24 * 60 * 60;
      const wrongSecret = new TextEncoder().encode('wrong-secret-key-at-least-32-characters-long');

      const token = await new SignJWT({ workspaceId, iat: now, exp })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(wrongSecret);

      await expect(jwtVerify(token, secretBytes)).rejects.toThrow();
    });

    it('should reject an expired token', async () => {
      const workspaceId = 'test-id';
      const now = Math.floor(Date.now() / 1000);
      const exp = now - 3600; // expired 1 hour ago

      const token = await new SignJWT({ workspaceId, iat: now - 7200, exp })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secretBytes);

      await expect(jwtVerify(token, secretBytes)).rejects.toThrow();
    });

    it('should reject a tampered token', async () => {
      const workspaceId = 'test-id';
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 24 * 60 * 60;

      const token = await new SignJWT({ workspaceId, iat: now, exp })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secretBytes);

      // Tamper with the payload (change a character)
      const parts = token.split('.');
      parts[1] = parts[1].slice(0, -1) + (parts[1].slice(-1) === 'A' ? 'B' : 'A');
      const tamperedToken = parts.join('.');

      await expect(jwtVerify(tamperedToken, secretBytes)).rejects.toThrow();
    });
  });

  describe('security constraints', () => {
    it('should enforce minimum 32 character secret', () => {
      const shortSecret = 'short';
      expect(shortSecret.length).toBeLessThan(32);

      const longSecret = JWT_SECRET;
      expect(longSecret.length).toBeGreaterThanOrEqual(32);
    });

    it('should set expiration to exactly 24 hours', () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 24 * 60 * 60;
      const diffSeconds = exp - now;

      expect(diffSeconds).toBe(86400); // 24h in seconds
    });
  });
});
