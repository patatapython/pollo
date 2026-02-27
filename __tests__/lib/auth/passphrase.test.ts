import { describe, it, expect, beforeAll } from 'vitest';
import { generate, hash, verify, computeLookup } from '@/lib/auth/passphrase';

describe('passphrase', () => {
  beforeAll(() => {
    process.env.SERVER_SECRET = 'test-secret-key-at-least-32-characters-long-12345';
  });

  describe('generate', () => {
    it('should generate a passphrase with 5 words', () => {
      const passphrase = generate();
      const words = passphrase.split(' ');
      expect(words).toHaveLength(5);
    });

    it('should generate passphrases with at least 15 characters', () => {
      const passphrase = generate();
      expect(passphrase.length).toBeGreaterThanOrEqual(15);
    });

    it('should generate different passphrases on each call', () => {
      const p1 = generate();
      const p2 = generate();
      const p3 = generate();

      const passphrases = [p1, p2, p3];
      const unique = new Set(passphrases);
      // Allow small probability of collision, but at least 2 should be different
      expect(unique.size).toBeGreaterThan(1);
    });

    it('should only contain alphabetic characters (Spanish)', () => {
      const passphrase = generate();
      const words = passphrase.split(' ');
      const validPattern = /^[a-záéíóúñ]+$/i;

      words.forEach((word) => {
        expect(word).toMatch(validPattern);
      });
    });
  });

  describe('hash', () => {
    it('should hash a passphrase', async () => {
      const passphrase = 'mesa verde compra viernes lago';
      const hashed = await hash(passphrase);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for the same input (bcrypt randomness)', async () => {
      const passphrase = 'mesa verde compra viernes lago';
      const hash1 = await hash(passphrase);
      const hash2 = await hash(passphrase);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verify', () => {
    it('should verify a correct passphrase', async () => {
      const passphrase = 'mesa verde compra viernes lago';
      const hashed = await hash(passphrase);
      const isValid = await verify(passphrase, hashed);

      expect(isValid).toBe(true);
    });

    it('should reject an incorrect passphrase', async () => {
      const passphrase = 'mesa verde compra viernes lago';
      const wrongPassphrase = 'mesa verde compra viernes nube';
      const hashed = await hash(passphrase);
      const isValid = await verify(wrongPassphrase, hashed);

      expect(isValid).toBe(false);
    });
  });

  describe('computeLookup', () => {
    it('should compute a lookup hash', () => {
      const passphrase = 'mesa verde compra viernes lago';
      const lookup = computeLookup(passphrase);

      expect(lookup).toBeDefined();
      expect(typeof lookup).toBe('string');
      expect(lookup.length).toBe(64); // SHA256 hex = 64 chars
    });

    it('should be deterministic (same input = same output)', () => {
      const passphrase = 'mesa verde compra viernes lago';
      const lookup1 = computeLookup(passphrase);
      const lookup2 = computeLookup(passphrase);

      expect(lookup1).toBe(lookup2);
    });

    it('should produce different lookups for different passphrases', () => {
      const passphrase1 = 'mesa verde compra viernes lago';
      const passphrase2 = 'mesa verde compra viernes nube';
      const lookup1 = computeLookup(passphrase1);
      const lookup2 = computeLookup(passphrase2);

      expect(lookup1).not.toBe(lookup2);
    });

    it('should throw error if SERVER_SECRET is not configured', () => {
      delete process.env.SERVER_SECRET;
      expect(() => {
        computeLookup('test');
      }).toThrow('SERVER_SECRET env var not configured');
    });
  });
});
